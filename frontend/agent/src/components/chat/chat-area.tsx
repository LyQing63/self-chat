import { useCallback, useEffect, useRef } from "react"
import { useChat } from "@/contexts/chat-context"
import { useChatStream } from "@/hooks/use-chat-stream"
import { useScrollToBottom } from "@/hooks/use-scroll-to-bottom"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { Button } from "@/components/ui/button"
import { Plus, MessageSquare } from "lucide-react"
import gsap from "gsap"

export function ChatArea() {
  const { state, addMessage, createConversation, renameConversation } = useChat()
  const { streamAssistant, stop } = useChatStream()
  const messages = state.currentConversationId
    ? state.messages[state.currentConversationId] ?? []
    : []

  const scrollRef = useScrollToBottom<HTMLDivElement>([messages.length, messages[messages.length - 1]?.content])

  const handleSend = useCallback(
    (content: string) => {
      let conversationId = state.currentConversationId

      if (!conversationId) {
        const conversation = createConversation()
        conversationId = conversation.id
      }

      addMessage("user", content, conversationId)

      // Auto-title: use first message as title
      if (messages.length === 0) {
        const title = content.length > 30 ? content.slice(0, 30) + "..." : content
        renameConversation(conversationId, title)
      }

      // 构造发往后端的完整历史（已有消息 + 当前这条用户消息）
      const requestMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ]

      void streamAssistant(conversationId, requestMessages)
    },
    [state.currentConversationId, messages, addMessage, createConversation, renameConversation, streamAssistant]
  )

  // Page load animation
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!containerRef.current) return
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.5, ease: "power2.out" }
    )
  }, [])

  // Empty state
  if (!state.currentConversationId) {
    return (
      <div ref={containerRef} className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
        <MessageSquare className="size-16 opacity-20" />
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Welcome to Chat</h2>
          <p className="text-sm mt-1">Start a new conversation or select an existing one</p>
        </div>
        <Button onClick={createConversation}>
          <Plus className="size-4 mr-2" />
          New Chat
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold truncate">
          {state.conversations.find((c) => c.id === state.currentConversationId)?.title ?? "Chat"}
        </h2>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" viewportRef={scrollRef}>
        <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          )}
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {/* Loading indicator：仅在尚未开始回复（最后一条还是用户消息）时显示 */}
          {state.isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3">
              <div className="size-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-xs">AI</span>
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
                <div className="flex gap-1">
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={stop}
        isLoading={state.isLoading}
        disabled={!state.currentConversationId}
      />
    </div>
  )
}
