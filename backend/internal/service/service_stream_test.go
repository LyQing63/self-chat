package service

import (
	"context"
	"errors"
	"strings"
	"testing"

	"agent/internal/dto"
	"agent/internal/entity"
	"agent/internal/model/request"
)

// --- fakes ---

type fakeConvRepo struct {
	createID   string
	createErr  error
	created    int
	updatedIDs []string
}

func (f *fakeConvRepo) CreateConversation(userID, title string) (*entity.Conversation, error) {
	if f.createErr != nil {
		return nil, f.createErr
	}
	f.created++
	return &entity.Conversation{ID: f.createID, UserID: userID, Title: title}, nil
}
func (f *fakeConvRepo) GetConversationsByUserID(string) ([]*entity.Conversation, error) {
	return nil, nil
}
func (f *fakeConvRepo) GetConversationByID(string) (*entity.Conversation, error) { return nil, nil }
func (f *fakeConvRepo) UpdateConversationTitle(string, string) error            { return nil }
func (f *fakeConvRepo) DeleteConversation(string) error                         { return nil }
func (f *fakeConvRepo) UpdateConversationUpdatedAt(id string) error {
	f.updatedIDs = append(f.updatedIDs, id)
	return nil
}

type savedMsg struct{ convID, role, content string }

type fakeMsgRepo struct {
	saved []savedMsg
	err   error
}

func (f *fakeMsgRepo) CreateMessage(convID, role, content string) (*entity.Message, error) {
	if f.err != nil {
		return nil, f.err
	}
	f.saved = append(f.saved, savedMsg{convID, role, content})
	return &entity.Message{ConversationID: convID, Role: role, Content: content}, nil
}
func (f *fakeMsgRepo) GetMessagesByConversationID(string) ([]*entity.Message, error) {
	return nil, nil
}

type fakeLLM struct {
	resp string
	err  error
}

func (f *fakeLLM) GetCompletion(string, string) (string, error) { return "", nil }
func (f *fakeLLM) StreamCompletion(_ context.Context, _ []dto.ChatMessage, onDelta func(string) error) (string, error) {
	if f.err != nil {
		return "", f.err
	}
	if onDelta != nil {
		_ = onDelta(f.resp)
	}
	return f.resp, nil
}

func newReq(convID string, msgs ...dto.ChatMessage) *request.ChatRequest {
	return &request.ChatRequest{UserID: "u1", ConversationID: convID, Messages: msgs}
}

// --- tests ---

func TestStreamCompletion_NewConversation(t *testing.T) {
	conv := &fakeConvRepo{createID: "new-uuid"}
	msg := &fakeMsgRepo{}
	s := &Service{LLMService: &fakeLLM{resp: "hi there"}, conversationRepo: conv, messageRepo: msg}

	var convCalls int
	var gotID string
	err := s.StreamCompletion(context.Background(),
		newReq("", dto.ChatMessage{Role: "user", Content: "hello"}),
		func(id string) error { convCalls++; gotID = id; return nil },
		func(string) error { return nil })

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if conv.created != 1 {
		t.Errorf("expected 1 conversation created, got %d", conv.created)
	}
	if convCalls != 1 || gotID != "new-uuid" {
		t.Errorf("onConversation: calls=%d id=%q, want 1 / new-uuid", convCalls, gotID)
	}
	if len(msg.saved) != 2 {
		t.Fatalf("expected 2 messages saved, got %d", len(msg.saved))
	}
	if msg.saved[0].role != "user" || msg.saved[0].content != "hello" {
		t.Errorf("first saved msg = %+v, want user/hello", msg.saved[0])
	}
	if msg.saved[1].role != "assistant" || msg.saved[1].content != "hi there" {
		t.Errorf("second saved msg = %+v, want assistant/hi there", msg.saved[1])
	}
	if msg.saved[0].convID != "new-uuid" {
		t.Errorf("message convID = %q, want new-uuid", msg.saved[0].convID)
	}
}

func TestStreamCompletion_ExistingConversation(t *testing.T) {
	conv := &fakeConvRepo{}
	msg := &fakeMsgRepo{}
	s := &Service{LLMService: &fakeLLM{resp: "ok"}, conversationRepo: conv, messageRepo: msg}

	var convCalls int
	err := s.StreamCompletion(context.Background(),
		newReq("existing-id",
			dto.ChatMessage{Role: "user", Content: "u1"},
			dto.ChatMessage{Role: "assistant", Content: "a1"},
			dto.ChatMessage{Role: "user", Content: "u2"}),
		func(string) error { convCalls++; return nil },
		func(string) error { return nil })

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if conv.created != 0 {
		t.Errorf("expected no conversation created, got %d", conv.created)
	}
	if convCalls != 0 {
		t.Errorf("onConversation should not fire for existing conv, got %d calls", convCalls)
	}
	if len(msg.saved) != 2 {
		t.Fatalf("expected 2 messages saved, got %d", len(msg.saved))
	}
	// 只落本轮新增：user[last]=u2 + assistant，不重复历史。
	if msg.saved[0].content != "u2" || msg.saved[0].convID != "existing-id" {
		t.Errorf("first saved = %+v, want u2/existing-id", msg.saved[0])
	}
	if msg.saved[1].role != "assistant" {
		t.Errorf("second saved role = %q, want assistant", msg.saved[1].role)
	}
}

func TestStreamCompletion_LLMErrorDiscardsAssistant(t *testing.T) {
	conv := &fakeConvRepo{createID: "c1"}
	msg := &fakeMsgRepo{}
	s := &Service{LLMService: &fakeLLM{err: errors.New("boom")}, conversationRepo: conv, messageRepo: msg}

	err := s.StreamCompletion(context.Background(),
		newReq("", dto.ChatMessage{Role: "user", Content: "hello"}),
		func(string) error { return nil },
		func(string) error { return nil })

	if err == nil {
		t.Fatal("expected error from LLM failure")
	}
	if len(msg.saved) != 1 {
		t.Fatalf("expected only user message saved (assistant discarded), got %d", len(msg.saved))
	}
	if msg.saved[0].role != "user" {
		t.Errorf("saved msg role = %q, want user", msg.saved[0].role)
	}
}

func TestGetTitleFromMessages_RuneSafe(t *testing.T) {
	long := strings.Repeat("中", 50)
	title := GetTitleFromMessages([]dto.ChatMessage{{Role: "user", Content: long}})
	if got := []rune(title); len(got) != 40 {
		t.Errorf("title rune length = %d, want 40", len(got))
	}
	if !utf8ValidString(title) {
		t.Errorf("title is not valid UTF-8: %q", title)
	}
}

func utf8ValidString(s string) bool {
	for _, r := range s {
		if r == '\uFFFD' {
			return false
		}
	}
	return true
}
