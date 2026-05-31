import { useEffect, useRef, useCallback } from "react"

export function useScrollToBottom<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null)
  const shouldScrollRef = useRef(true)

  const handleScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100
    shouldScrollRef.current = isAtBottom
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [handleScroll])

  useEffect(() => {
    if (shouldScrollRef.current) {
      ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
