package service

import (
	"agent/internal/config"
	"agent/internal/repository"
	"context"
	"fmt"
)

type Service struct {
	LLMService LLMService
}

func Init(config *config.Config) (*Service, error) {
	llmService, err := NewLLMService(config.LLMConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize LLM service: %w", err)
	}
	svc := &Service{
		LLMService: llmService,
	}
	return svc, nil
}

func (s *Service) StreamCompletion(ctx context.Context, messages []repository.ChatMessage, onDelta func(string) error) error {
	// 1. prompt增强
	// 2. cache判断
	// 3. model routing
	// 4. 调用LLM
	return s.LLMService.StreamCompletion(ctx, messages, onDelta)
}
