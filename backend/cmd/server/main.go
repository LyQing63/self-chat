package main

import (
	"fmt"
	"log/slog"

	"agent/internal/config"
	"agent/internal/handler"
	"agent/internal/router"
	"agent/internal/service"
	"agent/pkg/database"
	"agent/pkg/logger"
	"agent/pkg/redis"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		slog.Error("Failed to load config", slog.String("error", err.Error()))
		return
	}

	// Initialize logger
	logger.Init(cfg.Log.Level, cfg.Log.Format)
	slog.Info("Starting server", slog.Int("port", cfg.Server.Port))

	// Initialize database
	db, err := database.Init(cfg.Database.DSN())
	if err != nil {
		slog.Error("Failed to connect to database", slog.String("error", err.Error()))
		return
	}

	// Initialize Redis
	redisClient, err := redis.Init(cfg.Redis.Addr(), cfg.Redis.Password, cfg.Redis.DB)
	if err != nil {
		slog.Error("Failed to connect to redis", slog.String("error", err.Error()))
		return
	}

	// Close connections on exit
	defer func() {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
		redisClient.Close()
	}()

	// Initialize services
	var svc *service.Service
	svc, err = service.Init(cfg, db)
	if err != nil {
		slog.Error("Failed to initialize services", slog.String("error", err.Error()))
		return
	}

	// Setup router
	r := router.Setup(cfg.Server.Mode)
	h := handler.NewChatHandler(svc)
	router.RegisterChatRoutes(r, h)

	// Start server
	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	if err := r.Run(addr); err != nil {
		slog.Error("Failed to start server", slog.String("error", err.Error()))
	}
}
