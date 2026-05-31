import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Send, Square } from "lucide-react"
import gsap from "gsap"

interface ChatInputProps {
  onSend: (message: string) => void
  onStop: () => void
  isLoading: boolean
  disabled?: boolean
}

export function ChatInput({ onSend, onStop, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 200) + "px"
  }, [value])

  // Button micro-animation
  useEffect(() => {
    if (!buttonRef.current) return
    if (value.trim()) {
      gsap.to(buttonRef.current, { scale: 1, duration: 0.15, ease: "power2.out" })
    } else {
      gsap.to(buttonRef.current, { scale: 0.95, duration: 0.15, ease: "power2.out" })
    }
  }, [value])

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed || isLoading || disabled) return
    onSend(trimmed)
    setValue("")
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value, isLoading, disabled, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  return (
    <div className="border-t border-border bg-background p-4">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Shift+Enter for new line)"
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "min-h-[40px] max-h-[200px]"
          )}
        />
        <Button
          ref={buttonRef}
          onClick={isLoading ? onStop : handleSend}
          disabled={isLoading ? false : !value.trim() || disabled}
          size="icon"
          className="shrink-0"
          aria-label={isLoading ? "停止生成" : "发送"}
        >
          {isLoading ? (
            <Square className="size-4" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
