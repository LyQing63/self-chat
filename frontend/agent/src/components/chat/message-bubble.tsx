import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/shared/markdown-renderer"
import type { Message } from "@/types/chat"
import gsap from "gsap"

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isUser = message.role === "user"

  // GSAP enter animation
  useEffect(() => {
    if (!ref.current) return
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: 20, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: "power2.out" }
    )
  }, [])

  return (
    <div
      ref={ref}
      className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "")}
      style={{ opacity: 0 }}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs font-medium",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {isUser ? "U" : "AI"}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <MarkdownRenderer content={message.content} />
        )}
      </div>
    </div>
  )
}
