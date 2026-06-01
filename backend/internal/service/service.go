package service

import (
	"agent/internal/config"
	"agent/internal/dto"
	"agent/internal/model/request"
	"agent/repository"
	"context"
	"fmt"

	"gorm.io/gorm"
)

type Service struct {
	db               *gorm.DB
	LLMService       LLMService
	conversationRepo repository.ConversationRepository
	messageRepo      repository.MessageRepository
}

func Init(config *config.Config, db *gorm.DB) (*Service, error) {
	llmService, err := NewLLMService(config.LLMConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize LLM service: %w", err)
	}
	svc := &Service{
		db:               db,
		LLMService:       llmService,
		conversationRepo: repository.NewConversationRepository(db),
		messageRepo:      repository.NewMessageRepository(db),
	}
	return svc, nil
}

func (s *Service) StreamCompletion(ctx context.Context, chatReq *request.ChatRequest, onConversation func(string) error, onDelta func(string) error) error {
	// 方案1：前端发全量 messages，服务端仅把每轮新增消息落库（不读库拼历史）。
	// conversation_id 为空 => 懒创建会话，并通过 onConversation 回传新 id。
	conversationId := chatReq.ConversationID
	if conversationId == "" {
		newID, err := s.createConversation(ctx, chatReq)
		if err != nil {
			return fmt.Errorf("failed to create conversation: %w", err)
		}
		conversationId = newID
		if onConversation != nil {
			if err := onConversation(conversationId); err != nil {
				return fmt.Errorf("failed to emit conversation event: %w", err)
			}
		}
	}

	// 调 LLM 前先落库用户消息，确保即使 LLM 失败问题也不丢。
	userMsg := chatReq.Messages[len(chatReq.Messages)-1]
	if err := s.saveMessage(conversationId, userMsg); err != nil {
		return fmt.Errorf("failed to save user message: %w", err)
	}

	responseContent, err := s.LLMService.StreamCompletion(ctx, chatReq.Messages, onDelta)
	if err != nil {
		// 断流：丢弃残缺回复，不落库 assistant。
		return fmt.Errorf("failed to stream completion: %w", err)
	}

	if err := s.saveMessage(conversationId, dto.ChatMessage{
		Role:    "assistant",
		Content: responseContent,
	}); err != nil {
		return fmt.Errorf("failed to save assistant message: %w", err)
	}
	return nil
}

func (s *Service) createConversation(ctx context.Context, chatReq *request.ChatRequest) (string, error) {
	conversation, err := s.conversationRepo.CreateConversation(chatReq.UserID, GetTitleFromMessages(chatReq.Messages))
	if err != nil {
		return "", fmt.Errorf("%w", err)
	}
	return conversation.ID, nil
}

func (s *Service) saveMessage(conversationId string, msg dto.ChatMessage) error {
	_, err := s.messageRepo.CreateMessage(conversationId, msg.Role, msg.Content)
	if err != nil {
		return err
	}
	// 更新conversation的更新时间
	err = s.conversationRepo.UpdateConversationUpdatedAt(conversationId)
	if err != nil {
		return err
	}
	return nil
}

func GetTitleFromMessages(messages []dto.ChatMessage) string {
	for _, msg := range messages {
		if msg.Role == "user" {
			return truncateRunes(msg.Content, 40)
		}
	}
	return ""
}

// truncateRunes 按 rune 截断，避免把中文等多字节字符切坏。
func truncateRunes(s string, n int) string {
	r := []rune(s)
	if len(r) > n {
		return string(r[:n])
	}
	return s
}

func (s *Service) GetConversationHistory(ctx context.Context, userId string) ([]dto.ConversationHistory, error) {
	conversations, err := s.conversationRepo.GetConversationsByUserID(userId)
	if err != nil {
		return nil, fmt.Errorf("failed to get conversations: %w", err)
	}
	conversationHistory := make([]dto.ConversationHistory, len(conversations))
	for i := range conversations {
		conversationHistory[i] = dto.ConversationHistory{
			ID:        conversations[i].ID,
			Title:     conversations[i].Title,
			UpdatedAt: conversations[i].UpdatedAt,
			CreatedAt: conversations[i].CreatedAt,
		}
	}
	return conversationHistory, nil
}

func (s *Service) GetMessages(ctx context.Context, conversationId string) ([]dto.ChatMessage, error) {
	messages, err := s.messageRepo.GetMessagesByConversationID(conversationId)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}
	chatMessages := make([]dto.ChatMessage, len(messages))
	for i := range messages {
		chatMessages[i] = dto.ChatMessage{
			ID:      messages[i].ID,
			Role:    messages[i].Role,
			Content: messages[i].Content,
		}
	}
	return chatMessages, nil
}

func (s *Service) DeleteConversation(ctx context.Context, conversationId string) error {
	// 判断回话是否存在
	conversation, err := s.conversationRepo.GetConversationByID(conversationId)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}
	if conversation == nil {
		return fmt.Errorf("conversation not found")
	}
	err = s.conversationRepo.DeleteConversation(conversationId)
	if err != nil {
		return fmt.Errorf("failed to delete conversation: %w", err)
	}
	return nil
}

func (s *Service) UpdateConversationTitle(ctx context.Context, conversationId string, title string) error {
	// 判断回话是否存在
	conversation, err := s.conversationRepo.GetConversationByID(conversationId)
	if err != nil {
		return fmt.Errorf("conversation not found: %w", err)
	}
	if conversation == nil {
		return fmt.Errorf("conversation not found")
	}
	err = s.conversationRepo.UpdateConversationTitle(conversationId, title)
	if err != nil {
		return fmt.Errorf("failed to update conversation title: %w", err)
	}
	return nil
}
