export interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  /** 后端懒创建会话时回传的 UUID，用作后续请求的 conversation_id；首轮前为 undefined */
  backendId?: string
  title: string
  createdAt: number
  updatedAt: number
}

export type Theme = "light" | "dark" | "system"

/** 发往后端的单条消息（不含前端本地字段） */
export interface ChatRequestMessage {
  role: "user" | "assistant"
  content: string
}

export interface ChatRequest {
  messages: ChatRequestMessage[]
  /** 无用户体系，写死占位常量；用于会话归属，供 /history 按 user_id 检索 */
  user_id?: string
  /** 首轮省略；拿到后端回传的 id 后，同一会话后续请求带上 */
  conversation_id?: string
}

/** 后端 SSE 流内的 event，按 type 分发 */
export type ChatStreamEvent =
  | { type: "conversation"; id: string }
  | { type: "delta"; content: string }
  | { type: "done" }
  | { type: "error"; message: string }

export interface AppState {
  conversations: Conversation[]
  currentConversationId: string | null
  messages: Record<string, Message[]>
  sidebarCollapsed: boolean
  theme: Theme
  isLoading: boolean
}

export type ChatAction =
  | { type: "CREATE_CONVERSATION"; payload: Conversation }
  | { type: "DELETE_CONVERSATION"; payload: string }
  | { type: "RENAME_CONVERSATION"; payload: { id: string; title: string } }
  | { type: "SET_CONVERSATION_BACKEND_ID"; payload: { id: string; backendId: string } }
  | { type: "SET_CURRENT_CONVERSATION"; payload: string | null }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; content: string } }
  | { type: "SET_MESSAGES"; payload: { conversationId: string; messages: Message[] } }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_THEME"; payload: Theme }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOAD_STATE"; payload: Partial<AppState> }
