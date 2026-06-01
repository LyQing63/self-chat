-- +goose Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

CREATE TABLE conversations (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL DEFAULT 'default',
    title       TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ            -- NULL = 未删
);
CREATE INDEX idx_conv_user_active
    ON conversations (user_id, updated_at DESC)
    WHERE deleted_at IS NULL;          -- 侧栏列表查询走这个

CREATE TABLE messages (
    id              BIGSERIAL   PRIMARY KEY,
    conversation_id UUID        NOT NULL
        REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT        NOT NULL
        CHECK (role IN ('user','assistant','system')),
    content         TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_msg_conv ON messages (conversation_id, id);

-- +goose Down
DROP TABLE messages;
DROP TABLE conversations;