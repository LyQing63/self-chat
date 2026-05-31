package service

import (
	"agent/internal/config"
	"log/slog"
	"os"
	"testing"
)

var svc *Service

func TestMain(m *testing.M) {
	cfg, err := config.Load()
	if err != nil {
		panic(err)
	}
	// 初始化
	svc, err = Init(cfg)
	if err != nil {
		slog.Error("Failed to initialize services", slog.String("error", err.Error()))
		return
	}

	// 执行测试
	code := m.Run()

	os.Exit(code)
}
