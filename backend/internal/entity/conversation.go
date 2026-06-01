package entity

import (
	"time"

	"gorm.io/gorm"
)

type Conversation struct {
	ID        string         `gorm:"type:uuid;default:gen_random_uuid()"`
	UserID    string         `json:"user_id"`
	Title     string         `json:"title"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index"`
}

func (c *Conversation) TableName() string {
	return "conversations"
}
