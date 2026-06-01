package handler

import (
	"agent/internal/model"
	"agent/internal/model/request"
	"agent/internal/service"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ChatHandler struct {
	svc *service.Service
}

func NewChatHandler(
	svc *service.Service,
) *ChatHandler {
	return &ChatHandler{
		svc: svc,
	}
}

func (h *ChatHandler) Completion(c *gin.Context) {
	chatReq := &request.ChatRequest{}
	if err := c.ShouldBindJSON(chatReq); err != nil {
		model.Fail(c, 400, "invalid request: "+err.Error())
		return
	}
	headers := map[string]string{
		"Content-Type":  "text/event-stream",
		"Cache-Control": "no-cache",
		"Connection":    "keep-alive",
	}
	for k, v := range headers {
		c.Header(k, v)
	}

	flusher, ok := c.Writer.(http.Flusher)
	if !ok {
		model.Fail(c, 500, "failed to get flusher")
		return
	}
	flusher.Flush()
	err := h.svc.StreamCompletion(c.Request.Context(), chatReq,
		func(id string) error {
			writeEvent(c, map[string]any{"type": "conversation", "id": id})
			flusher.Flush()
			return nil
		},
		func(delta string) error {
			writeEvent(c, map[string]any{"type": "delta", "content": delta})
			flusher.Flush()
			return nil
		})
	if err != nil {
		writeEvent(c, map[string]any{"type": "error", "message": err.Error()})
	} else {
		writeEvent(c, map[string]any{"type": "done"})
	}
	flusher.Flush()
}

func writeEvent(ctx *gin.Context, v any) {
	b, _ := json.Marshal(v)
	fmt.Fprintf(ctx.Writer, "data:%s\n\n", b)
}

func (h *ChatHandler) History(c *gin.Context) {
	userId := c.Query("user_id")
	conversations, err := h.svc.GetConversationHistory(c.Request.Context(), userId)
	if err != nil {
		model.Fail(c, 500, "failed to get conversation history: "+err.Error())
		return
	}
	model.OK(c, conversations)
}

func (h *ChatHandler) Messages(c *gin.Context) {
	conversationId := c.Query("conversation_id")
	messages, err := h.svc.GetMessages(c.Request.Context(), conversationId)
	if err != nil {
		model.Fail(c, 500, "failed to get messages: "+err.Error())
		return
	}
	model.OK(c, messages)
}

func (h *ChatHandler) DeleteConversation(c *gin.Context) {
	conversationId := c.Query("conversation_id")
	err := h.svc.DeleteConversation(c.Request.Context(), conversationId)
	if err != nil {
		model.Fail(c, 500, "failed to delete conversation: "+err.Error())
		return
	}
	model.OK(c, nil)
}

func (h *ChatHandler) UpdateConversationTitle(c *gin.Context) {
	var req request.UpdateConversationTitleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		model.Fail(c, 400, "invalid request: "+err.Error())
		return
	}
	err := h.svc.UpdateConversationTitle(c.Request.Context(), req.ConversationID, req.Title)
	if err != nil {
		model.Fail(c, 500, "failed to update conversation title: "+err.Error())
		return
	}
	model.OK(c, nil)
}
