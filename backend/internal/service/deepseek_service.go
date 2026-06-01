package service

import (
	"agent/internal/config"
	"agent/internal/dto"
	"context"
	"fmt"

	"github.com/openai/openai-go" // imported as openai
	"github.com/openai/openai-go/option"
)

type DeepSeekService struct {
	BaseLLMService
}

func initDeepSeekService(cfg config.LLMConfig) {
	deepSeekService = NewDeepSeekService(cfg)
}

func NewDeepSeekService(cfg config.LLMConfig) *DeepSeekService {
	return &DeepSeekService{
		BaseLLMService: BaseLLMService{
			apiKey:      cfg.APIKey,
			temperature: cfg.Temperature,
			model:       cfg.Model,
		},
	}
}

var deepSeekService *DeepSeekService

const BASE_URL = "https://api.deepseek.com/v1"

func (s *DeepSeekService) genGPTMessageFromString(prompt string) openai.ChatCompletionMessageParamUnion {
	return openai.UserMessage(prompt)
}

func (s *DeepSeekService) genGPTMessage(msg dto.ChatMessage) openai.ChatCompletionMessageParamUnion {
	switch msg.Role {
	case "system":
		return openai.SystemMessage(msg.Content)
	case "assistant":
		return openai.AssistantMessage(msg.Content)
	default:
		return openai.UserMessage(msg.Content)
	}
}

func (s *DeepSeekService) GetCompletion(prompt string, model string) (string, error) {
	client := openai.NewClient(
		option.WithAPIKey(s.apiKey),
		option.WithBaseURL(BASE_URL),
	)

	chatCompletion, err := client.Chat.Completions.New(context.TODO(), openai.ChatCompletionNewParams{
		Messages: []openai.ChatCompletionMessageParamUnion{
			// openai.SystemMessage("You are a coding assistant that talks like a pirate."),
			s.genGPTMessageFromString(prompt),
		},
		Model:       model,
		Temperature: openai.Float(s.temperature),
	})
	if err != nil {
		return "", err
	}
	if len(chatCompletion.Choices) == 0 {
		return "generate answer error", nil
	}
	return chatCompletion.Choices[0].Message.Content, nil
}

func (s *DeepSeekService) StreamCompletion(
	ctx context.Context, messages []dto.ChatMessage, onDelta func(string) error) (string, error) {

	client := openai.NewClient(
		option.WithAPIKey(s.apiKey),
		option.WithBaseURL(BASE_URL),
	)

	responseContent, err := s.StreamCompletionWithClient(ctx, messages, &client, onDelta)
	if err != nil {
		return "", fmt.Errorf("deepseek stream completion: %w", err)
	}

	return responseContent, nil
}
