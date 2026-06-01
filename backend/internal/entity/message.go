package entity

import "time"

type Message struct {
	ID             int64     `gorm:"primaryKey;autoIncrement"`
	ConversationID string    `json:"conversation_id"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	CreatedAt      time.Time `json:"created_at"`
}

func (c *Message) TableName() string {
	return "messages"
}
