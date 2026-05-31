package service

import (
	"agent/internal/config"
	"agent/internal/repository"
	"context"
	"fmt"

	"github.com/openai/openai-go" // imported as openai
	"github.com/openai/openai-go/option"
)

type DeepSeekService struct {
	apiKey      string
	temperature float64
	model       string
}

func initDeepSeekService(cfg config.LLMConfig) {
	deepSeekService = NewDeepSeekService(cfg)
}

func NewDeepSeekService(cfg config.LLMConfig) *DeepSeekService {
	return &DeepSeekService{
		apiKey:      cfg.APIKey,
		temperature: cfg.Temperature,
		model:       cfg.Model,
	}
}

var deepSeekService *DeepSeekService

const BASE_URL = "https://api.deepseek.com/v1"

func (s *DeepSeekService) genGPTMessageFromString(prompt string) openai.ChatCompletionMessageParamUnion {
	return openai.UserMessage(prompt)
}

func (s *DeepSeekService) genGPTMessage(msg repository.ChatMessage) openai.ChatCompletionMessageParamUnion {
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
	ctx context.Context, messages []repository.ChatMessage, onDelta func(string) error) error {

	client := openai.NewClient(
		option.WithAPIKey(s.apiKey),
		option.WithBaseURL(BASE_URL),
	)

	msgs := make([]openai.ChatCompletionMessageParamUnion, len(messages))
	for i, msg := range messages {
		msgs[i] = s.genGPTMessage(msg)
	}

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
			return err
		}
	}

	if err := stream.Err(); err != nil {
		return fmt.Errorf("stream error: %w", err)
	}

	return nil
}
