# Research: shadcn/ui with Vite + React 19 + TypeScript Setup

- **Query**: How to set up shadcn/ui with Vite + React 19 + TypeScript in 2025-2026
- **Scope**: mixed (internal project context + shadcn skill docs)
- **Date**: 2026-05-31

## Current Project State

The project at `/Users/qingly/Desktop/projects/agent/frontend/agent/` already has:
- **Vite 8.0.12** with `@vitejs/plugin-react`
- **React 19.2.6** + `react-dom`
- **TypeScript 6.0.2**
- No `components.json`, no Tailwind, no shadcn installed yet

## 1. Installation Commands

### Initialize shadcn/ui in existing Vite project

```bash
cd /Users/qingly/Desktop/projects/agent/frontend/agent

# Initialize with Vite template and a preset (recommended)
npx shadcn@latest init --template vite --preset nova

# Or with defaults (interactive prompts)
npx shadcn@latest init

# Or skip prompts with --yes
npx shadcn@latest init --template vite --preset base-nova --yes
```

The `init` command will:
1. Detect the existing Vite + React + TypeScript project
2. Install Tailwind CSS (v4 by default as of 2025)
3. Create `components.json` configuration
4. Set up the `cn()` utility in `src/lib/utils.ts`
5. Configure import aliases in `tsconfig.json` and `vite.config.ts`

### Add components after init

```bash
npx shadcn@latest add button input scroll-area dialog tooltip sheet avatar
# or add all at once
npx shadcn@latest add --all
```

## 2. React 19 Compatibility

**shadcn/ui works with React 19.** As of shadcn v4.x (the `@latest` tag), React 19 is fully supported.

Key notes:
- shadcn/ui v4 uses Radix UI primitives, which have been updated for React 19 compatibility
- The `asChild` pattern (Radix) works with React 19's ref forwarding changes
- No known issues with React 19.2.x and the latest shadcn CLI (v4.8.3)
- The project already uses React 19.2.6 which is well within the supported range

## 3. Required Dependencies

The `npx shadcn@latest init` command handles dependency installation automatically. The typical dependency set:

### Runtime dependencies (auto-installed)
- `tailwindcss` (v4 by default)
- `@tailwindcss/vite` (Vite plugin for Tailwind v4)
- `class-variance-authority` (cva) -- component variants
- `clsx` -- conditional class names
- `tailwind-merge` -- merge Tailwind classes
- `lucide-react` -- icon library (default)

### Radix UI primitives (auto-installed per component)
- `@radix-ui/react-dialog`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-tooltip`
- `@radix-ui/react-avatar`
- `@radix-ui/react-slot` (for Button's asChild)
- etc.

### Additional for chat app
- `sonner` -- toast notifications (shadcn-recommended)
- `react-markdown` + `remark-gfm` -- markdown rendering
- `react-syntax-highlighter` or `shiki` -- code block highlighting
- `gsap` -- animations (already in PRD requirements)

## 4. Tailwind Configuration

### Tailwind v4 (Default for New Projects)

With Tailwind v4, there is **no `tailwind.config.js`**. Configuration is done entirely in CSS.

**`src/index.css` (or `globals.css`)**:

```css
@import "tailwindcss";

@theme inline {
  /* Color tokens -- these map to CSS variables */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-surface: var(--surface);
  --color-surface-foreground: var(--surface-foreground);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.965 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.965 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.965 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --radius: 0.625rem;
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --surface: oklch(0.985 0 0);
  --surface-foreground: oklch(0.145 0 0);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-accent: oklch(0.965 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.439 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --surface: oklch(0.205 0 0);
  --surface-foreground: oklch(0.985 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(0.269 0 0);
  --sidebar-ring: oklch(0.439 0 0);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Note**: The `init` command generates all of this automatically. You do NOT need to hand-write it.

### Tailwind v3 (Legacy)

If using Tailwind v3 (unlikely for new projects), configuration goes in `tailwind.config.js` with `content` paths and `theme.extend` for colors. The shadcn CLI detects this automatically.

## 5. Components for Chat App

### Recommended components to install

```bash
npx shadcn@latest add button input textarea scroll-area dialog tooltip sheet avatar badge separator skeleton spinner sonner
```

| Component | Chat App Use Case |
|-----------|------------------|
| `Button` | Send button, action buttons, sidebar toggles |
| `Input` | Search conversations, single-line inputs |
| `Textarea` | Auto-growing message input area |
| `ScrollArea` | Scrollable message list, scrollable sidebar |
| `Dialog` | Settings modal, confirmation dialogs |
| `AlertDialog` | Delete conversation confirmation |
| `Tooltip` | Button tooltips (send, delete, settings) |
| `Sheet` | Mobile sidebar drawer, details panel |
| `Avatar` | User and AI avatars in message list |
| `Badge` | Conversation tags, status indicators |
| `Separator` | Visual dividers between sections |
| `Skeleton` | Loading placeholders for messages |
| `Spinner` | Loading indicator for AI "thinking" |
| `sonner` | Toast notifications (errors, confirmations) |
| `DropdownMenu` | Conversation context menu (rename, delete) |
| `Toggle` | Sidebar collapse toggle |
| `Card` | Message cards, conversation cards |

### Component patterns critical for chat app

**Avatar with fallback (mandatory):**
```tsx
<Avatar>
  <AvatarImage src="/avatar.png" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

**ScrollArea for message list:**
```tsx
<ScrollArea className="h-[calc(100vh-12rem)]">
  {/* messages */}
</ScrollArea>
```

**Button with loading state (no isLoading prop -- compose manually):**
```tsx
<Button disabled={isLoading}>
  {isLoading && <Spinner data-icon="inline-start" />}
  Send
</Button>
```

**Sheet for mobile sidebar:**
```tsx
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon"><MenuIcon /></Button>
  </SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Conversations</SheetTitle>
    </SheetHeader>
    {/* conversation list */}
  </SheetContent>
</Sheet>
```

## 6. CLI Reference

### Core commands

```bash
# Initialize shadcn in existing project
npx shadcn@latest init [options]

# Create new project with shadcn
npx shadcn@latest init --name my-app --template vite --preset nova

# Add components
npx shadcn@latest add button input dialog
npx shadcn@latest add --all                    # add every component
npx shadcn@latest add @magicui/shimmer-button  # from community registry

# Preview before adding
npx shadcn@latest add button --dry-run
npx shadcn@latest add button --diff
npx shadcn@latest add button --view

# Search registries
npx shadcn@latest search @shadcn -q "sidebar"

# Get component docs
npx shadcn@latest docs button dialog input

# View project info
npx shadcn@latest info

# Apply preset/theme
npx shadcn@latest apply nova
npx shadcn@latest apply a2r6bw --only theme
```

### Key init flags

| Flag | Description |
|------|-------------|
| `--template vite` | Use Vite template |
| `--preset nova` | Apply named preset (nova, vega, maia, lyra, mira, luma) |
| `--yes` / `-y` | Skip confirmation prompts |
| `--force` / `-f` | Overwrite existing config |
| `--name <name>` | Create new project with this name |
| `--monorepo` | Scaffold as monorepo |

### Key add flags

| Flag | Description |
|------|-------------|
| `--all` / `-a` | Add all available components |
| `--overwrite` / `-o` | Overwrite existing component files |
| `--dry-run` | Preview changes without writing |
| `--diff [file]` | Show diffs (per file or first 5) |
| `--view [file]` | Show file contents |

## 7. components.json Structure

After running `init`, a `components.json` file is created in the project root:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "nova",
  "base": "radix",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

Key fields:
- `base: "radix"` -- uses Radix UI primitives (default)
- `style: "nova"` -- visual style preset
- `rsc: false` -- no React Server Components (correct for Vite SPA)
- `tailwind.css` -- the global CSS file where theme variables live
- `aliases` -- import path aliases matching `tsconfig.json` paths

## 8. Styling Rules (Critical)

From the shadcn skill rules:

1. **Use semantic colors**: `bg-primary`, `text-muted-foreground` -- never raw `bg-blue-500`
2. **Use `gap-*` not `space-y-*`**: `flex flex-col gap-4` not `space-y-4`
3. **Use `size-*` for equal dimensions**: `size-10` not `w-10 h-10`
4. **Use `cn()` for conditional classes**: `cn("base", condition && "extra")`
5. **No manual `dark:` overrides**: Semantic tokens handle light/dark automatically
6. **No manual `z-index` on overlays**: Dialog/Sheet/Tooltip handle their own stacking
9. **Avatar always needs AvatarFallback**: For image load failures
10. **Button has no `isLoading` prop**: Compose with `Spinner` + `disabled`

## 9. Recommended Setup Sequence

```bash
# 1. Navigate to project
cd /Users/qingly/Desktop/projects/agent/frontend/agent

# 2. Initialize shadcn with Vite template
npx shadcn@latest init --template vite --preset nova --yes

# 3. Install chat-relevant components
npx shadcn@latest add button input textarea scroll-area dialog alert-dialog \
  tooltip sheet avatar badge separator skeleton spinner dropdown-menu toggle

# 4. Install sonner for toasts
npx shadcn@latest add sonner

# 5. Verify installation
npx shadcn@latest info
```

## Caveats / Not Found

- The PRD mentions GSAP for animations -- this is separate from shadcn/ui and needs to be installed independently (`npm install gsap`)
- The PRD mentions markdown rendering and code syntax highlighting -- these are not shadcn components; they need separate libraries (`react-markdown`, `react-syntax-highlighter` or `shiki`)
- Dark mode toggle for Vite SPA: use `next-themes` equivalent for Vite, or implement manually by toggling `.dark` class on `<html>` and persisting to localStorage
- The project uses Vite 8 and TypeScript 6 which are very recent; shadcn v4.8.3 should handle these but verify after init
