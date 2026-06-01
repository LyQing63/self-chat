package service

import (
	"agent/internal/config"
	"agent/internal/dto"
	"context"
	"fmt"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

type LLMService interface {
	GetCompletion(prompt string, model string) (string, error)
	StreamCompletion(ctx context.Context, messages []dto.ChatMessage, onDelta func(string) error) (string, error)
}

type BaseLLMService struct {
	apiKey      string
	temperature float64
	model       string
}

func (s *BaseLLMService) GetCompletion(prompt string, model string) (string, error) {
	return "", fmt.Errorf("not implemented")
}

func (s *BaseLLMService) genGPTMessageFromString(prompt string) openai.ChatCompletionMessageParamUnion {
	return openai.UserMessage(prompt)
}

func (s *BaseLLMService) genGPTMessage(msg dto.ChatMessage) openai.ChatCompletionMessageParamUnion {
	switch msg.Role {
	case "system":
		return openai.SystemMessage(msg.Content)
	case "assistant":
		return openai.AssistantMessage(msg.Content)
	default:
		return openai.UserMessage(msg.Content)
	}
}

func (s *BaseLLMService) StreamCompletion(ctx context.Context, messages []dto.ChatMessage, onDelta func(string) error) (string, error) {

	client := openai.NewClient(
		option.WithAPIKey(s.apiKey),
	)

	responseContent, err := s.StreamCompletionWithClient(ctx, messages, &client, onDelta)
	if err != nil {
		return "", err
	}

	return responseContent, nil
}

func (s *BaseLLMService) StreamCompletionWithClient(ctx context.Context, messages []dto.ChatMessage, client *openai.Client, onDelta func(string) error) (string, error) {
	msgs := make([]openai.ChatCompletionMessageParamUnion, len(messages))
	for i, msg := range messages {
		msgs[i] = s.genGPTMessage(msg)
	}
	var responseContent string
	stream := client.Chat.Completions.NewStreaming(ctx, openai.ChatCompletionNewParams{
		Model:       s.model,
		Messages:    msgs,
		Temperature: openai.Float(s.temperature),
	})
	defer stream.Close()

	for stream.Next() {
		chunk := stream.Current()
		if len(chunk.Choices) == 0 {
			continue
		}
		delta := chunk.Choices[0].Delta.Content
		if delta == "" {
			continue
		}
		if err := onDelta(delta); err != nil {
			return "", err
		}
		responseContent += delta
	}

	if err := stream.Err(); err != nil {
		return "", fmt.Errorf("stream error: %w", err)
	}

	return responseContent, nil
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
