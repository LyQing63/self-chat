package service

import (
	"fmt"
	"testing"
)

func TestGetCompletion(t *testing.T) {
	result, err := svc.LLMService.GetCompletion("你好", "deepseek-v4-flash")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	t.Log(result)
}
