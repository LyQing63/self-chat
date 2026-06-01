# 前端 /completion 请求补传 user_id

## Goal

让前端调用 `/api/v1/chat/completions` 时携带 `user_id`，使懒创建的会话写入正确的 user_id，从而能被 `/history`（按 `user_id` 查询）检索到。

## Bug / Root Cause

- 后端懒创建会话时用 `chatReq.UserID` 写入 conversation 的 user_id（`service.go:74` → `createConversation`）。
- 前端 `use-chat-stream.ts:45-48` 的请求体只发 `messages` 和 `conversation_id`，**未带 `user_id`**，后端收到空字符串。
- 结果：新会话 user_id 为空，而 `fetchHistory`（`chat.ts:42`）用 `DEFAULT_USER_ID="default-user"` 查询历史 → 查不到这些孤儿会话，历史列表丢失。

## Requirements

- 前端 completion 请求体补上 `user_id`，复用已存在的 `DEFAULT_USER_ID` 常量（与 `fetchHistory` 保持一致）。
- `ChatRequest` 类型补 `user_id?: string` 字段。

## Acceptance Criteria

- [ ] 空 `conversation_id` 发起对话 → 新建会话的 user_id == `"default-user"`。
- [ ] 刷新后 `/history` 能查到该会话。
- [ ] 前端 `tsc` 类型检查通过。

## Out of Scope

- 后端逻辑改动（后端契约已支持 `user_id`，本任务仅前端补传）。
- 真正的鉴权/多用户体系（user_id 仍是占位常量）。

## Technical Notes

- 相关文件：`frontend/agent/src/hooks/use-chat-stream.ts`、`frontend/agent/src/types/chat.ts`、`frontend/agent/src/api/chat.ts`（`DEFAULT_USER_ID` 来源）。
