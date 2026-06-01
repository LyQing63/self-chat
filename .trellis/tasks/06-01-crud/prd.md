# 会话 CRUD 对接后端接口

## Goal

把前端 `chat-context.tsx` 中基于 localStorage 的会话增删改查（create/delete/rename/list+messages），替换为调用后端 REST 接口，使会话数据以后端数据库为准、跨设备/刷新一致。

## What I already know

### 前端现状（纯本地状态 + localStorage）
- 所有 CRUD 在 `frontend/agent/src/contexts/chat-context.tsx`，通过 reducer + localStorage 实现：
  - 增 `createConversation`（本地建空会话占位）
  - 删 `deleteConversation`
  - 改 `renameConversation`
  - 查 `loadState`（读 localStorage）
- 唯一真实后端调用在 `hooks/use-chat-stream.ts`：`POST /api/v1/chat/completions`（SSE）。
- `Conversation` 类型已有 `backendId`（后端懒创建回传的 UUID）。
- 前端无 user_id / 用户体系概念。

### 后端现状（base `/api/v1/chat`，响应 `{code,message,data}`，code=0 成功）
- `GET /history?user_id=` → `[{id,title,created_at,updated_at}]`
- `GET /messages?conversation_id=` → `[{id,role,content}]`
- `DELETE /conversations/delete?conversation_id=` → null
- `POST /completions`（SSE，conversation_id 为空时懒创建会话，回传 id）
- repo 层有 `UpdateConversationTitle`，但**未暴露 rename 的 service/handler/route**。

## Gaps（前端 CRUD ↔ 后端）
1. **user_id**：后端 history/create 都需要 user_id，前端没有。→ 必须先确定来源。
2. **rename（改）**：后端缺 HTTP 接口（repo 已就绪），需补 service+handler+route，或前端放弃 rename。
3. **create（增）**：后端无独立 create 接口，会话靠首轮聊天懒创建。需确定"新建会话"按钮行为。
4. **list/messages（查）**：后端已有，前端改为拉取替换 localStorage。

## Decisions
- **user_id**：暂时写死固定 user_id（`default-user`），前端常量；本任务不做登录/鉴权。
- **rename**：后端 `POST /update/title` 已就绪，前端 rename 改为调后端再同步本地。
- **localStorage**：会话/消息以后端为唯一真实来源，删除其 localStorage 持久化；仅 theme 仍存本地（客户端偏好）。
- **新建会话**：保留懒创建——New Chat 仅建本地空占位，发首条消息后端才真正创建并回传 id。

## Requirements
- 会话列表（查）：挂载时 `GET /history?user_id=default-user` 拉取，替换 localStorage。
- 消息（查）：切换会话时按 backendId `GET /messages?conversation_id=` 拉取，按需加载。
- 删除：`DELETE /conversations/delete?conversation_id=` 成功后同步本地。
- 重命名：`POST /update/title` 成功后同步本地。
- 新建：保留本地占位 + SSE 懒创建链路不变。

## Acceptance Criteria
- [ ] 刷新页面后会话列表来自后端，与数据库一致。
- [ ] 删除会话调用后端并同步前端。
- [ ] 重命名调用后端 `/update/title` 并同步前端。
- [ ] 切换会话时从后端拉取该会话消息。
- [ ] theme 仍由本地持久化，刷新保留。

## Out of Scope (explicit)
- 真正的用户登录/鉴权体系（除非确认纳入）。

## Technical Notes
- 后端文件：router.go / chat_handler.go / service.go / repository/conversation.go
- 前端文件：chat-context.tsx / use-chat-stream.ts / types/chat.ts
