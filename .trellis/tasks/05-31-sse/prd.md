# 对接前端流式聊天接口（SSE）

## 背景
前端聊天页已完成，但助手回复用 `use-ai-simulation.ts` 模拟（`setInterval` 切片）。
后端 Gin 已有 `POST /api/v1/chat/completions`（空 handler）与 DeepSeek service。
本任务把前端从模拟切换到真实后端流式输出。

**分工**：本任务只实现**前端**改动。后端改法以文档形式交付给开发者自行实现，不在本任务写后端代码。

## 接口契约（前后端共识）
- 传输：`POST /api/v1/chat/completions`，SSE。前端用 `fetch` + `ReadableStream` 读取（非 `EventSource`）。
- 同源：开发期走 Vite `/api` 代理，前端用相对路径。
- 请求体（前端发整段历史，后端无状态）：
  ```json
  { "messages": [{ "role": "user", "content": "..." }] }
  ```
- 响应流（结构化 JSON，按 type 分发）：
  ```
  data: {"type":"delta","content":"片段"}\n\n
  data: {"type":"done"}\n\n
  data: {"type":"error","message":"..."}\n\n
  ```
  错误走流内 event，不靠 HTTP 状态码。

## 前端范围（本任务实现）
1. 新建 `src/hooks/use-chat-stream.ts` 替换 `use-ai-simulation.ts`：
   - `addMessage("user", text)` → `addMessage("assistant", "")` 取 id
   - `fetch` POST，body 为当前会话 messages 映射成 `{role, content}`，带 `AbortController.signal`
   - 读 `res.body.getReader()` + `TextDecoder`，**拼行缓冲**：累加 → 按 `\n\n` 切分 → 逐条 `JSON.parse`
   - `delta` 累加进 buffer → `updateMessage(id, buffer)`；`done` 收尾；`error` 写入消息或提示
   - 全程 `SET_LOADING` 控制输入框禁用；token 直显（不做打字机）
2. 接线：App/chat-area 的 `onSend` 改调 `use-chat-stream`，移除模拟 hook 引用
3. 停止按钮（最简版）：流式中发送按钮切「停止」，点击 `abort()`，保留已生成文本
4. `vite.config.ts` 增加 `server.proxy`：`/api` → Gin 端口

## 后端改法（交付文档，开发者自行实现）
1. `LLMService` 接口：`GetCompletion(prompt)` → `StreamCompletion(ctx, messages, model, temp, onDelta func(string) error) error`（callback，不用 channel）
2. `deepseek_service.go`：stub 里的 `print` 改为 `onDelta(data.Delta)`，`ctx` 由外部传入
3. `router.go` handler：设 `Content-Type: text/event-stream`、`Cache-Control: no-cache`、`Connection: keep-alive`；每写一条 `c.Writer.Flush()`；监听 `c.Request.Context().Done()` 透传取消

## MVP 边界
- 不做：会话持久化到 DB、登录、token 用量统计、打字机平滑
- 做：正向流式、错误流内传递、停止生成（前端 abort + 后端 ctx 取消）

## 验收
- 浏览器发消息 → 助手气泡逐字流式出现
- 断网/上游错误 → 气泡或提示显示错误，不白屏
- 点停止 → 立即停下，保留已生成部分
- 多轮对话上下文生效（后端收到完整 messages）
