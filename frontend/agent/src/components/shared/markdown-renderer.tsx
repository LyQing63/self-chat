import { useState, useCallback } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"

interface MarkdownRendererProps {
  content: string
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
      onClick={handleCopy}
    >
      {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
    </Button>
  )
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          const isInline = !match
          const codeString = String(children).replace(/\n$/, "")

          if (isInline) {
            return (
              <code
                className="bg-muted rounded px-1.5 py-0.5 text-xs font-mono"
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <div className="relative group my-2">
              <div className="flex items-center justify-between bg-muted rounded-t-md px-3 py-1.5 text-xs text-muted-foreground">
                <span>{match[1]}</span>
                <CopyButton code={codeString} />
              </div>
              <pre className="bg-muted/50 rounded-b-md p-3 overflow-x-auto">
                <code className="text-xs font-mono" {...props}>
                  {codeString}
                </code>
              </pre>
            </div>
          )
        },
        p({ children }) {
          return <p className="mb-2 last:mb-0">{children}</p>
        },
        ul({ children }) {
          return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
            >
              {children}
            </a>
          )
        },
        h1({ children }) {
          return <h1 className="text-lg font-bold mb-2">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-base font-bold mb-2">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-sm font-bold mb-1">{children}</h3>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-muted-foreground pl-3 italic my-2">
              {children}
            </blockquote>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-2">
              <table className="border-collapse text-sm">{children}</table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th className="border border-border px-2 py-1 text-left font-medium bg-muted">
              {children}
            </th>
          )
        },
        td({ children }) {
          return <td className="border border-border px-2 py-1">{children}</td>
        },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
