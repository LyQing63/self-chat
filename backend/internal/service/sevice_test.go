package service

import (
	"agent/internal/config"
	"agent/pkg/database"
	"log/slog"
	"os"
	"testing"
)

var svc *Service

// TestMain 尽力初始化 DB-backed svc（供集成测试用）。无 DB 时降级：
// svc 留空，但纯单测（使用 fake 依赖）仍照常运行。
func TestMain(m *testing.M) {
	if cfg, err := config.Load(); err == nil {
		if db, derr := database.Init(cfg.Database.DSN()); derr == nil {
			svc, _ = Init(cfg, db)
			code := m.Run()
			if sqlDB, _ := db.DB(); sqlDB != nil {
				sqlDB.Close()
			}
			os.Exit(code)
		} else {
			slog.Warn("DB unavailable; running unit tests without DB-backed svc",
				slog.String("error", derr.Error()))
		}
	}
	os.Exit(m.Run())
}
