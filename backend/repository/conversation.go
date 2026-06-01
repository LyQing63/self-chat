package repository

import (
	"agent/internal/entity"

	"gorm.io/gorm"
)

type ConversationRepository interface {
	CreateConversation(userID, title string) (*entity.Conversation, error)
	GetConversationsByUserID(userID string) ([]*entity.Conversation, error)
	GetConversationByID(id string) (*entity.Conversation, error)
	UpdateConversationTitle(id, title string) error
	DeleteConversation(id string) error
	UpdateConversationUpdatedAt(id string) error
}

func NewConversationRepository(db *gorm.DB) ConversationRepository {
	return &conversationRepositoryImpl{db: db}
}

type conversationRepositoryImpl struct {
	// 这里可以添加数据库连接等字段
	db *gorm.DB
}

func (r *conversationRepositoryImpl) CreateConversation(userID, title string) (*entity.Conversation, error) {
	// 实现创建会话的逻辑，返回新创建的会话对象
	conversation := &entity.Conversation{
		UserID: userID,
		Title:  title,
	}
	if err := r.db.Create(conversation).Error; err != nil {
		return nil, err
	}
	return conversation, nil
}

func (r *conversationRepositoryImpl) GetConversationsByUserID(userID string) ([]*entity.Conversation, error) {
	// 实现根据用户ID获取会话列表的逻辑
	var conversations []*entity.Conversation
	if err := r.db.Order("updated_at desc").Where("user_id = ?", userID).Find(&conversations).Error; err != nil {
		return nil, err
	}
	return conversations, nil
}

func (r *conversationRepositoryImpl) GetConversationByID(id string) (*entity.Conversation, error) {
	// 实现根据会话ID获取会话详情的逻辑
	var conversation entity.Conversation
	if err := r.db.Where("id = ?", id).First(&conversation).Error; err != nil {
		return nil, err
	}
	return &conversation, nil
}

func (r *conversationRepositoryImpl) UpdateConversationTitle(id, title string) error {
	// 实现更新会话标题的逻辑
	if err := r.db.Model(&entity.Conversation{}).Where("id = ?", id).Update("title", title).Error; err != nil {
		return err
	}
	return nil
}

func (r *conversationRepositoryImpl) DeleteConversation(id string) error {
	// 实现删除会话的逻辑
	if err := r.db.Where("id = ?", id).Delete(&entity.Conversation{}).Error; err != nil {
		return err
	}
	return nil
}

func (r *conversationRepositoryImpl) UpdateConversationUpdatedAt(id string) error {
	// 实现更新会话更新时间的逻辑
	if err := r.db.Model(&entity.Conversation{}).Where("id = ?", id).Update("updated_at", gorm.Expr("NOW()")).Error; err != nil {
		return err
	}
	return nil
}
