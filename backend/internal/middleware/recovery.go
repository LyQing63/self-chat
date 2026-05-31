package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/gin-gonic/gin"
)

// Recovery returns a middleware that recovers from panics.
func Recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if r := recover(); r != nil {
				slog.Error("Panic recovered",
					slog.Any("error", r),
					slog.String("stack", string(debug.Stack())),
					slog.String("path", c.Request.URL.Path),
				)

				c.JSON(http.StatusInternalServerError, gin.H{
					"code":    500,
					"message": "Internal Server Error",
					"data":    nil,
				})
				c.Abort()
			}
		}()

		c.Next()
	}
}
