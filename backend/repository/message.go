package repository

import (
	"agent/internal/entity"

	"gorm.io/gorm"
)

type MessageRepository interface {
	// 定义消息相关的数据库操作方法，例如：
	CreateMessage(conversationID, role, content string) (*entity.Message, error)
	GetMessagesByConversationID(conversationID string) ([]*entity.Message, error)
}

func NewMessageRepository(db *gorm.DB) MessageRepository {
	return &messageRepositoryImpl{db: db}
}

type messageRepositoryImpl struct {
	// 这里可以添加数据库连接等字段
	db *gorm.DB
}

func (r *messageRepositoryImpl) CreateMessage(conversationID, role, content string) (*entity.Message, error) {
	// 实现创建消息的逻辑，返回新创建的消息对象
	message := &entity.Message{
		ConversationID: conversationID,
		Role:           role,
		Content:        content,
	}
	// 这里应该执行数据库插入操作，例如 r.db.Create(message)
	if err := r.db.Create(message).Error; err != nil {
		return nil, err
	}
	return message, nil
}

func (r *messageRepositoryImpl) GetMessagesByConversationID(conversationID string) ([]*entity.Message, error) {
	// 实现根据会话ID获取消息列表的逻辑
	var messages []*entity.Message
	// 这里应该执行数据库查询操作
	if err := r.db.Order("id ASC").Where("conversation_id = ?", conversationID).Find(&messages).Error; err != nil {
		return nil, err
	}
	return messages, nil
}
