// 会话/消息的后端 REST 调用。统一解包 {code,message,data} 信封，code !== 0 抛错。
// 本任务无用户体系，user_id 暂写死常量。

export const DEFAULT_USER_ID = "default-user"

const BASE = "/api/v1/chat"

interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  if (!res.ok) {
    throw new Error(`请求失败：HTTP ${res.status}`)
  }
  const body = (await res.json()) as ApiEnvelope<T>
  if (body.code !== 0) {
    throw new Error(body.message || `业务错误：code ${body.code}`)
  }
  return body.data
}

/** GET /history 返回的单条会话 */
export interface ApiConversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

/** GET /messages 返回的单条消息 */
export interface ApiMessage {
  id: number
  role: "user" | "assistant"
  content: string
}

export function fetchHistory(userId: string = DEFAULT_USER_ID): Promise<ApiConversation[]> {
  return request<ApiConversation[]>(`${BASE}/history?user_id=${encodeURIComponent(userId)}`)
}

export function fetchMessages(conversationId: string): Promise<ApiMessage[]> {
  return request<ApiMessage[]>(
    `${BASE}/messages?conversation_id=${encodeURIComponent(conversationId)}`
  )
}

export function deleteConversationApi(conversationId: string): Promise<null> {
  return request<null>(
    `${BASE}/conversations/delete?conversation_id=${encodeURIComponent(conversationId)}`,
    { method: "DELETE" }
  )
}

export function updateConversationTitleApi(
  conversationId: string,
  title: string
): Promise<null> {
  return request<null>(`${BASE}/update/title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, title }),
  })
}
