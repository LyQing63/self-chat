import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import type { AppState, ChatAction, Message, Conversation, Theme } from "@/types/chat"

const STORAGE_KEY = "chat-app-state"

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function loadState(): Partial<AppState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        conversations: state.conversations,
        currentConversationId: state.currentConversationId,
        messages: state.messages,
        theme: state.theme,
      })
    )
  } catch {
    // ignore storage errors
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
  deleteConversation: (id: string) => void
  renameConversation: (id: string, title: string) => void
  setCurrentConversation: (id: string | null) => void
  addMessage: (role: "user" | "assistant", content: string, conversationId?: string) => Message
  updateMessage: (id: string, content: string) => void
  toggleSidebar: () => void
  setTheme: (theme: Theme) => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState)

  // Load persisted state on mount
  useEffect(() => {
    const stored = loadState()
    if (Object.keys(stored).length > 0) {
      dispatch({ type: "LOAD_STATE", payload: stored })
    }
  }, [])

  // Persist state on change
  useEffect(() => {
    if (state.conversations.length > 0 || state.currentConversationId) {
      saveState(state)
    }
  }, [state.conversations, state.currentConversationId, state.messages, state.theme])

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

  function deleteConversation(id: string) {
    dispatch({ type: "DELETE_CONVERSATION", payload: id })
  }

  function renameConversation(id: string, title: string) {
    dispatch({ type: "RENAME_CONVERSATION", payload: { id, title } })
  }

  function setCurrentConversation(id: string | null) {
    dispatch({ type: "SET_CURRENT_CONVERSATION", payload: id })
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
