import { ChatProvider } from "@/contexts/chat-context"
import { Sidebar } from "@/components/sidebar/sidebar"
import { ChatArea } from "@/components/chat/chat-area"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <ChatProvider>
      <TooltipProvider>
        <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-end px-4 py-1.5 border-b border-border">
              <ThemeToggle />
            </div>
            <ChatArea />
          </main>
        </div>
      </TooltipProvider>
    </ChatProvider>
  )
}

export default App
