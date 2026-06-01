package request

import "agent/internal/dto"

type ChatRequest struct {
	UserID         string            `json:"user_id,omitempty"`
	ConversationID string            `json:"conversation_id,omitempty"`
	Messages       []dto.ChatMessage `json:"messages" binding:"required,min=1,dive"`
}

type UpdateConversationTitleRequest struct {
	ConversationID string `json:"conversation_id" binding:"required"`
	Title          string `json:"title" binding:"required"`
}
