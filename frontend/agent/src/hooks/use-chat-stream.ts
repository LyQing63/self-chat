import { useCallback, useRef } from "react"
import { useChat } from "@/contexts/chat-context"
import { DEFAULT_USER_ID } from "@/api/chat"
import type { ChatRequest, ChatRequestMessage, ChatStreamEvent } from "@/types/chat"

const ENDPOINT = "/api/v1/chat/completions"

export function useChatStream() {
  const { addMessage, updateMessage, setConversationBackendId, dispatch } = useChat()
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const streamAssistant = useCallback(
    async (
      conversationId: string,
      requestMessages: ChatRequestMessage[],
      backendConversationId?: string
    ) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      dispatch({ type: "SET_LOADING", payload: true })

      let assistantId: string | null = null
      let acc = ""
      let buffer = ""

      // 延迟到首个 delta 才创建 AI 气泡，避免等待期出现空气泡
      const writeContent = (content: string) => {
        if (assistantId === null) {
          assistantId = addMessage("assistant", content, conversationId).id
        } else {
          updateMessage(assistantId, content)
        }
      }

      try {
        const res = await fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 首轮省略 conversation_id（后端懒创建并回传）；后续轮次带上
          body: JSON.stringify({
            user_id: DEFAULT_USER_ID,
            messages: requestMessages,
            ...(backendConversationId ? { conversation_id: backendConversationId } : {}),
          } satisfies ChatRequest),
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          throw new Error(`请求失败：HTTP ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })

          // SSE 事件以空行分隔；保留最后一段未闭合的尾巴
          const events = buffer.split("\n\n")
          buffer = events.pop() ?? ""

          for (const raw of events) {
            const line = raw.trim()
            if (!line.startsWith("data:")) continue
            const payload = line.slice(5).trim()
            if (!payload) continue

            let event: ChatStreamEvent
            try {
              event = JSON.parse(payload) as ChatStreamEvent
            } catch {
              continue
            }

            if (event.type === "conversation") {
              // 新建会话：把后端回传的 id 存进当前会话状态，供后续请求复用
              setConversationBackendId(conversationId, event.id)
            } else if (event.type === "delta") {
              acc += event.content
              writeContent(acc)
            } else if (event.type === "error") {
              throw new Error(event.message)
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // 用户主动停止：保留已生成内容，不报错
        } else {
          const message = err instanceof Error ? err.message : "未知错误"
          writeContent(acc ? `${acc}\n\n_[出错：${message}]_` : `_[出错：${message}]_`)
        }
      } finally {
        dispatch({ type: "SET_LOADING", payload: false })
        if (abortRef.current === controller) abortRef.current = null
      }
    },
    [addMessage, updateMessage, setConversationBackendId, dispatch]
  )

  return { streamAssistant, stop }
}
