package service

import (
	"agent/internal/config"
	"agent/internal/repository"
	"context"
	"fmt"
)

type LLMService interface {
	GetCompletion(prompt string, model string) (string, error)
	StreamCompletion(ctx context.Context, messages []repository.ChatMessage, onDelta func(string) error) error
}

func NewLLMService(
	cfg config.LLMConfig,
) (LLMService, error) {

	switch cfg.Provider {
	case "deepseek":
		return NewDeepSeekService(cfg), nil

	default:
		return nil, fmt.Errorf(
			"unsupported provider: %s",
			cfg.Provider,
		)
	}
}
