package request

import "agent/internal/repository"

type ChatRequest struct {
	Messages []repository.ChatMessage `json:"messages" binding:"required,min=1,dive"`
}
