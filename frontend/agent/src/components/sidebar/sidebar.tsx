import { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@/contexts/chat-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Plus,
  Search,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react"
import gsap from "gsap"

export function Sidebar() {
  const {
    state,
    createConversation,
    deleteConversation,
    renameConversation,
    setCurrentConversation,
    toggleSidebar,
  } = useChat()

  const [searchQuery, setSearchQuery] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const sidebarRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // GSAP collapse/expand animation
  useEffect(() => {
    if (!sidebarRef.current) return
    gsap.to(sidebarRef.current, {
      width: state.sidebarCollapsed ? 0 : 280,
      duration: 0.3,
      ease: "power2.inOut",
    })
  }, [state.sidebarCollapsed])

  // GSAP stagger animation for conversation items
  useEffect(() => {
    if (!listRef.current) return
    const items = listRef.current.querySelectorAll("[data-conv-item]")
    gsap.fromTo(
      items,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }
    )
  }, [state.conversations.length])

  const filteredConversations = state.conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleRename = useCallback(
    (id: string) => {
      if (editTitle.trim()) {
        renameConversation(id, editTitle.trim())
      }
      setEditingId(null)
      setEditTitle("")
    },
    [editTitle, renameConversation]
  )

  const handleDelete = useCallback(() => {
    if (deleteId) {
      deleteConversation(deleteId)
      setDeleteId(null)
    }
  }, [deleteId, deleteConversation])

  const handleNewChat = useCallback(() => {
    createConversation()
  }, [createConversation])

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "flex flex-col border-r border-border bg-sidebar text-sidebar-foreground overflow-hidden",
          state.sidebarCollapsed ? "w-0" : "w-[280px]"
        )}
        style={{ minWidth: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={toggleSidebar}>
                <PanelLeftClose className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Collapse sidebar</TooltipContent>
          </Tooltip>

          <span className="text-sm font-semibold truncate">Conversations</span>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={handleNewChat}>
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
        </div>

        <Separator />

        {/* Search */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        {/* Conversation List */}
        <ScrollArea className="flex-1">
          <div ref={listRef} className="flex flex-col gap-0.5 p-1">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                data-conv-item
                className={cn(
                  "group flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  state.currentConversationId === conversation.id &&
                    "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => setCurrentConversation(conversation.id)}
              >
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />

                {editingId === conversation.id ? (
                  <Input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => handleRename(conversation.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(conversation.id)
                      if (e.key === "Escape") {
                        setEditingId(null)
                        setEditTitle("")
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-xs flex-1 min-w-0"
                  />
                ) : (
                  <span className="truncate flex-1 min-w-0">{conversation.title}</span>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="opacity-0 group-hover:opacity-100 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="size-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingId(conversation.id)
                        setEditTitle(conversation.title)
                      }}
                    >
                      <Pencil className="size-3.5 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteId(conversation.id)
                      }}
                    >
                      <Trash2 className="size-3.5 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {filteredConversations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <MessageSquare className="size-8 mb-2 opacity-50" />
                <p className="text-xs">
                  {searchQuery ? "No matches found" : "No conversations yet"}
                </p>
                {!searchQuery && (
                  <Button variant="ghost" size="sm" className="mt-2" onClick={handleNewChat}>
                    <Plus className="size-3.5 mr-1" />
                    Start chatting
                  </Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>

      {/* Expand button when collapsed */}
      {state.sidebarCollapsed && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="fixed left-2 top-2 z-40"
              onClick={toggleSidebar}
            >
              <PanelLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Expand sidebar</TooltipContent>
        </Tooltip>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The conversation and all its messages will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
