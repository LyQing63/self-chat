export interface Message {
  id: string
  conversationId: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
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
}

/** 后端 SSE 流内的 event，按 type 分发 */
export type ChatStreamEvent =
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
  | { type: "SET_CURRENT_CONVERSATION"; payload: string | null }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; content: string } }
  | { type: "SET_MESSAGES"; payload: { conversationId: string; messages: Message[] } }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_THEME"; payload: Theme }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "LOAD_STATE"; payload: Partial<AppState> }
