# Build Chat Frontend Page

## Goal

Build a production-quality chat frontend page in `frontend/agent/` using React 19 + Vite + TypeScript + shadcn/ui + Tailwind CSS + GSAP. The page features a classic left-right split layout with conversation management on the left and a rich chat interface on the right. Data is persisted to localStorage initially, with the architecture designed for easy backend integration later.

## Requirements

### Layout
- Classic left-right split: sidebar (conversation list) + main chat area
- Sidebar is collapsible with smooth GSAP animation
- Responsive: sidebar collapses automatically on small screens

### Sidebar
- Conversation CRUD: create, delete, rename conversations
- Conversation switching with active highlight
- Search conversations by keyword
- Collapsible/expandable with GSAP animation

### Chat Area
- Chat header showing current conversation title
- Scrollable message area with auto-scroll to bottom on new messages
- Input area at bottom with auto-growing textarea

### Messages
- Support text messages (user + AI)
- Markdown rendering (headings, lists, bold, links, etc.)
- Code blocks with syntax highlighting and copy button
- Streaming typewriter effect for AI responses
- GSAP enter animation for new messages (slide-in/fade-in)

### Input Area
- Auto-growing textarea based on content
- Enter to send, Shift+Enter for newline
- Send button disabled when message is empty
- Loading indicator while AI is "thinking"

### Theme
- Dark/light mode toggle
- Follow system preference by default
- Manual toggle persisted to localStorage

### State Management
- React Context + useReducer for global state
- State shape: conversations list, current conversation, messages, UI state (sidebar collapsed, theme)

### Data Persistence
- localStorage for all data (conversations, messages, settings)
- Architecture designed for easy swap to API calls later

### AI Simulation
- Simulated AI responses with configurable delay (1-3 seconds)
- Random responses from a predefined pool
- Streaming effect during response

### GSAP Animations
- Message enter animation (slide-in + fade)
- Sidebar collapse/expand transition
- Page load entrance animation
- Button hover/click micro-interactions

## Acceptance Criteria

- [ ] Page renders with sidebar + chat area layout
- [ ] Can create, rename, delete, and switch conversations
- [ ] Can search conversations
- [ ] Sidebar collapses/expands with smooth animation
- [ ] Can send messages and see them in chat
- [ ] AI responds with simulated delay and streaming effect
- [ ] Markdown renders correctly in messages
- [ ] Code blocks have syntax highlighting and copy button
- [ ] Dark/light theme toggle works and persists
- [ ] Input area grows with content
- [ ] Enter sends, Shift+Enter newlines
- [ ] Send button disabled when empty
- [ ] Loading indicator shows while AI responds
- [ ] All data persists across page reloads (localStorage)
- [ ] GSAP animations are smooth and non-janky

## Definition of Done

- All acceptance criteria pass
- Lint / typecheck green
- No console errors
- Responsive layout works on common screen sizes

## Technical Approach

- **UI Framework**: shadcn/ui v4.x (CLI: `npx shadcn@latest init --template vite --preset nova`) + Tailwind v4 (CSS-based config, no tailwind.config.js)
- **Animations**: GSAP + @gsap/react (`useGSAP` hook, `gsap.context()` for scoping, `autoAlpha` + `y` for enter animations, `height: "auto"` for collapse)
- **Markdown**: react-markdown v9 + remark-gfm
- **Code Highlighting**: shiki v3+ (VS Code grammars, many themes, matches dark/light mode)
- **State**: React Context + useReducer, with localStorage sync middleware
- **Component Structure**: Feature-based organization (chat/, sidebar/, shared/)
- **Key shadcn components**: button, input, textarea, scroll-area, dialog, alert-dialog, tooltip, sheet, avatar, badge, separator, skeleton, dropdown-menu, toggle, sonner
- **Styling rules**: semantic colors only, `gap-*` not `space-y-*`, `cn()` for conditional classes, always include `AvatarFallback`

## Out of Scope

- Routing (single page app)
- Real backend API integration
- User authentication
- File/image uploads
- Message editing/deletion
- Multiple AI models
- Mobile-first responsive (desktop-first is fine)

## Technical Notes

- Project root: `/Users/qingly/Desktop/projects/agent/frontend/agent/`
- Package manager: npm
- React 19.2.6 + Vite 8.0.12 already scaffolded
- No existing UI library, router, or state management
- TypeScript 6.0.2

## Research References

- [`research/shadcn-vite-setup.md`](research/shadcn-vite-setup.md) — shadcn/ui v4.8.3 + Vite 8 + React 19 setup, Tailwind v4 CSS config, component list for chat app
- [`research/gsap-react-patterns.md`](research/gsap-react-patterns.md) — GSAP + React 19 integration, useGSAP hook, animation patterns for stagger/slide/collapse
- [`research/markdown-code-highlight.md`](research/markdown-code-highlight.md) — react-markdown + shiki for code blocks, streaming typewriter patterns
