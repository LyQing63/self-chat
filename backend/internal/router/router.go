package router

import (
	"agent/internal/handler"
	"agent/internal/middleware"
	"agent/internal/model"

	"github.com/gin-gonic/gin"
)

// Setup initializes the Gin router with middleware and routes.
func Setup(mode string) *gin.Engine {
	gin.SetMode(mode)

	r := gin.New()

	// Middleware
	r.Use(middleware.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS())

	// Health check
	r.GET("/api/v1/health", func(c *gin.Context) {
		model.OK(c, nil)
	})

	return r
}

func RegisterChatRoutes(
	r *gin.Engine,
	h *handler.ChatHandler,
) {
	api := r.Group("/api/v1/chat")

	api.POST("/completions", h.Completion)
}
