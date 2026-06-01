import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { AppState, ChatAction, Message, Conversation, Theme } from "@/types/chat"
import {
  fetchHistory,
  fetchMessages,
  deleteConversationApi,
  updateConversationTitleApi,
  type ApiConversation,
  type ApiMessage,
} from "@/api/chat"

// 会话/消息以后端为唯一真实来源，仅 theme 仍本地持久化（客户端偏好）。
const THEME_KEY = "chat-app-theme"

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    return stored === "light" || stored === "dark" || stored === "system" ? stored : null
  } catch {
    return null
  }
}

function saveTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // ignore storage errors
  }
}

// 后端会话 → 前端会话：id 与 backendId 同为后端 UUID，时间转毫秒时间戳。
function mapConversation(c: ApiConversation): Conversation {
  return {
    id: c.id,
    backendId: c.id,
    title: c.title,
    createdAt: new Date(c.created_at).getTime(),
    updatedAt: new Date(c.updated_at).getTime(),
  }
}

// 后端消息 → 前端消息：id 转字符串，timestamp 不参与展示，按顺序填占位值。
function mapMessage(m: ApiMessage, conversationId: string, index: number): Message {
  return {
    id: String(m.id),
    conversationId,
    role: m.role,
    content: m.content,
    timestamp: index,
  }
}

const initialState: AppState = {
  conversations: [],
  currentConversationId: null,
  messages: {},
  sidebarCollapsed: false,
  theme: "system",
  isLoading: false,
}

function chatReducer(state: AppState, action: ChatAction): AppState {
  switch (action.type) {
    case "CREATE_CONVERSATION":
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
        currentConversationId: action.payload.id,
        messages: { ...state.messages, [action.payload.id]: [] },
      }

    case "DELETE_CONVERSATION": {
      const { [action.payload]: _, ...restMessages } = state.messages
      const newConversations = state.conversations.filter((c) => c.id !== action.payload)
      const newCurrentId =
        state.currentConversationId === action.payload
          ? newConversations[0]?.id ?? null
          : state.currentConversationId
      return {
        ...state,
        conversations: newConversations,
        currentConversationId: newCurrentId,
        messages: restMessages,
      }
    }

    case "RENAME_CONVERSATION":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.id
            ? { ...c, title: action.payload.title, updatedAt: Date.now() }
            : c
        ),
      }

    case "SET_CONVERSATION_BACKEND_ID":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.payload.id ? { ...c, backendId: action.payload.backendId } : c
        ),
      }

    case "SET_CURRENT_CONVERSATION":
      return { ...state, currentConversationId: action.payload }

    case "ADD_MESSAGE": {
      const convId = action.payload.conversationId
      return {
        ...state,
        messages: {
          ...state.messages,
          [convId]: [...(state.messages[convId] ?? []), action.payload],
        },
        conversations: state.conversations.map((c) =>
          c.id === convId ? { ...c, updatedAt: Date.now() } : c
        ),
      }
    }

    case "UPDATE_MESSAGE": {
      const updated = { ...state.messages }
      for (const [convId, msgs] of Object.entries(updated)) {
        const idx = msgs.findIndex((m) => m.id === action.payload.id)
        if (idx !== -1) {
          updated[convId] = msgs.map((m) =>
            m.id === action.payload.id ? { ...m, content: action.payload.content } : m
          )
          break
        }
      }
      return { ...state, messages: updated }
    }

    case "SET_MESSAGES":
      return {
        ...state,
        messages: { ...state.messages, [action.payload.conversationId]: action.payload.messages },
      }

    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }

    case "SET_THEME":
      return { ...state, theme: action.payload }

    case "SET_LOADING":
      return { ...state, isLoading: action.payload }

    case "LOAD_STATE":
      return { ...state, ...action.payload }

    default:
      return state
  }
}

interface ChatContextValue {
  state: AppState
  dispatch: React.Dispatch<ChatAction>
  createConversation: () => Conversation
  deleteConversation: (id: string) => Promise<void>
  renameConversation: (id: string, title: string) => Promise<void>
  setConversationBackendId: (id: string, backendId: string) => void
  setCurrentConversation: (id: string | null) => Promise<void>
  addMessage: (role: "user" | "assistant", content: string, conversationId?: string) => Message
  updateMessage: (id: string, content: string) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // 挂载时：恢复本地 theme，并从后端拉取会话列表（替代旧的 localStorage 全量恢复）。
  useEffect(() => {
    const theme = loadTheme()
    if (theme) {
      dispatch({ type: "SET_THEME", payload: theme })
    }
    fetchHistory()
      .then((list) => {
        dispatch({
          type: "LOAD_STATE",
          payload: { conversations: list.map(mapConversation) },
        })
      })
      .catch((err) => {
        console.error("加载会话列表失败：", err)
      })
  }, [])

  // 仅持久化 theme；会话/消息以后端为准，不再写 localStorage。
  useEffect(() => {
    saveTheme(state.theme)
  }, [state.theme])

  // Apply theme class to html element
  useEffect(() => {
    const root = document.documentElement
    const isDark =
      state.theme === "dark" ||
      (state.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    root.classList.toggle("dark", isDark)
  }, [state.theme])

  function createConversation(): Conversation {
    const conversation: Conversation = {
      id: generateId(),
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    dispatch({ type: "CREATE_CONVERSATION", payload: conversation })
    return conversation
  }

  async function deleteConversation(id: string) {
    const conv = state.conversations.find((c) => c.id === id)
    // 已落库会话先删后端；纯本地占位（无 backendId）直接删本地。
    if (conv?.backendId) {
      try {
        await deleteConversationApi(conv.backendId)
      } catch (err) {
        console.error("删除会话失败：", err)
        return
      }
    }
    dispatch({ type: "DELETE_CONVERSATION", payload: id })
  }

  async function renameConversation(id: string, title: string) {
    const conv = state.conversations.find((c) => c.id === id)
    // 已落库会话调后端再同步；本地占位（含首条消息前的自动标题）仅乐观更新。
    if (conv?.backendId) {
      try {
        await updateConversationTitleApi(conv.backendId, title)
      } catch (err) {
        console.error("重命名会话失败：", err)
        return
      }
    }
    dispatch({ type: "RENAME_CONVERSATION", payload: { id, title } })
  }

  function setConversationBackendId(id: string, backendId: string) {
    dispatch({ type: "SET_CONVERSATION_BACKEND_ID", payload: { id, backendId } })
  }

  async function setCurrentConversation(id: string | null) {
    dispatch({ type: "SET_CURRENT_CONVERSATION", payload: id })
    if (!id) return
    const conv = state.conversations.find((c) => c.id === id)
    // 仅对已落库且尚未加载过消息的会话拉取（undefined = 从未加载；[] = 已加载空）。
    if (conv?.backendId && state.messages[id] === undefined) {
      try {
        const apiMessages = await fetchMessages(conv.backendId)
        dispatch({
          type: "SET_MESSAGES",
          payload: {
            conversationId: id,
            messages: apiMessages.map((m, i) => mapMessage(m, id, i)),
          },
        })
      } catch (err) {
        console.error("加载会话消息失败：", err)
      }
    }
  }

  function addMessage(role: "user" | "assistant", content: string, conversationId?: string): Message {
    const targetId = conversationId ?? state.currentConversationId
    if (!targetId) throw new Error("No current conversation")
    const message: Message = {
      id: generateId(),
      conversationId: targetId,
      role,
      content,
      timestamp: Date.now(),
    }
    dispatch({ type: "ADD_MESSAGE", payload: message })
    return message
  }

  function updateMessage(id: string, content: string) {
    dispatch({ type: "UPDATE_MESSAGE", payload: { id, content } })
  }

  function toggleSidebar() {
    dispatch({ type: "TOGGLE_SIDEBAR" })
  }

  function setTheme(theme: Theme) {
    dispatch({ type: "SET_THEME", payload: theme })
  }

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        createConversation,
        deleteConversation,
        renameConversation,
        setConversationBackendId,
        setCurrentConversation,
        addMessage,
        updateMessage,
        toggleSidebar,
        setTheme,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within ChatProvider")
  return context
}
