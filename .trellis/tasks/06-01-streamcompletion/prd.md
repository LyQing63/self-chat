# 对接对话持久化到 StreamCompletion 流式链路

## Goal

把已写好的 conversation/message 存储层接进聊天流式链路,让服务端在每次对话中:懒创建会话 → 落库用户消息 → 调 LLM 流式返回 → `done` 时落库 assistant 回复,断流时丢弃残缺回复。这是"A 对话持久化"能力的业务层收口。

## What I already know

- 存储层已就绪:`entity.Conversation/Message`、`repository.ConversationRepository/MessageRepository`(Create/Get/Update/Delete 已实现且编译通过)、`sql/0001_init.sql`(UUID 会话 + BIGSERIAL 消息 + 软删除)。
- `service.Service` 已注入 `db / conversationRepo / messageRepo`,`main.go` 已传入 `*gorm.DB`。
- `StreamCompletion(ctx, *request.ChatRequest, onDelta)` 已改签名;`LLMService.StreamCompletion` 现返回累积后的完整文本 `responseContent`(便于落库 assistant)。
- handler 已传 `chatReq`,SSE 事件:`delta` / `error` / `done`。
- **本任务决策(回退):采用方案1** —— 前端发全量 `messages[]`,服务端**仅落库不读库**(把每轮新增的 user/assistant 当日志增量写入)。懒创建、断流丢弃残缺、软删除沿用。

## 现状发现的偏离/缺陷(待确认与修复)

1. **[致命] 懒创建条件反转**(service.go:43):`if conversationId != ""` 应为 `== ""`。现状:新会话(空 id)不创建 → 用空 conversation_id 落库 → FK/UUID 失败;已有会话反而被新建覆盖。
2. ~~[设计偏离] 实际是方案1~~ → **已决策采用方案1**:LLM 收到 `chatReq.Messages`(前端全量),落库取 `Messages[last]` 作为本轮用户消息。`GetMessagesByConversationID` 在写链路中**不使用**(留给将来读接口)。此项不再视为缺陷。
3. **[缺失] 新 conversation_id 未回传前端**:无 `conversation` 类型 SSE 事件,前端无法得知新建会话 id。
4. **[错误吞掉] `saveMessage` 返回值被忽略**(service.go:50、56)。
5. **[中文 bug] 标题截断 `content[:50]` 按字节切**,会把中文 UTF-8 多字节字符切坏。应按 rune 截断。

## Open Questions

- (已定) 新 conversation_id 回传:**service 新增 `onConversation func(id string) error` 回调**,建会话后立即触发,handler 写出 `{"type":"conversation","id":...}` SSE 事件(在 deltas 之前)。service 不直接碰 HTTP。

## Requirements (evolving)

- **采用方案1**:保留 `messages[]` 全量请求契约,服务端仅增量落库(每轮存 user[last] + assistant),不读库拼历史。
- 修复懒创建条件反转(`== ""` 才建)。
- 新建会话时通过 SSE `conversation` 事件回传 id。
- 错误显式处理(落库失败要中断并返回)。
- 标题按 rune 安全截断。

## Acceptance Criteria (evolving)

- [ ] 空 conversation_id 发起对话 → 新建 conversation,首个 SSE 事件回传其 id,本轮 user+assistant 两条消息落库。
- [ ] 带 conversation_id 发起对话 → 不新建,本轮 user+assistant 追加到该会话(不重复历史)。
- [ ] LLM 中途报错 → 不落库 assistant 消息(残缺丢弃),用户消息已落库。
- [ ] 含中文标题截断不出现乱码(按 rune)。
- [ ] `go build ./...` 与 `go test ./...` 通过。

## Decision (ADR-lite)

**Context**: 前序设计定了方案2(服务端拥有历史)。实现阶段用户选择回退到方案1。
**Decision**: 本任务采用**方案1**——前端维持全量 `messages[]` 发送,服务端仅把每轮新增消息落库作为持久化日志,不在写链路读库拼历史。
**Consequences**: 改动最小、前端无需改契约;但前端仍是历史真相源,服务端副本是只写日志,跨设备恢复需另配读接口且存在与前端漂移的风险。将来若要真正"服务端拥有历史",需切回方案2(改请求体为单条消息 + 写链路读库)。

## Definition of Done

- 单测覆盖 service 链路关键分支(新建/追加/断流)。
- lint / vet / build 绿。
- 行为变化点同步到前端契约说明(SSE 事件、请求体)。

## Out of Scope (explicit)

- B 上下文窗口管理(截断/摘要)、C 长期记忆、D 缓存。
- Redis 任何接入。
- 鉴权/多用户(user_id 仍用占位)。
- 会话列表/恢复/删除的 HTTP 接口(本任务聚焦写链路;读接口可另起任务)。

## Technical Notes

- 相关文件:`internal/service/service.go`、`internal/service/llm_service.go`、`internal/handler/chat_handler.go`、`internal/model/request/chat.go`、`internal/dto/chat.go`、`repository/*.go`、`cmd/server/main.go`。
- 方案1 写链路顺序:建会话(空 id 时,SSE 回传 id)→ 存 user 消息(`Messages[last]`)→ 流式 LLM(喂 `chatReq.Messages` 全量)→ done 存 assistant + 更新 updated_at;LLM 报错则不存 assistant。
