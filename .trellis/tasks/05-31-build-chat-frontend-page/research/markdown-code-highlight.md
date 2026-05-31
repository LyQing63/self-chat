# Markdown + Code Highlighting Research

## react-markdown

- `react-markdown` v9+ for rendering Markdown
- `remark-gfm` for GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)
- Custom components via `components` prop to override default rendering

## Code Syntax Highlighting

### Options Comparison

| Library | Bundle Size | SSR | Themes | Language Count |
|---------|------------|-----|--------|---------------|
| shiki | ~200KB (lazy) | Yes | Many | 200+ |
| prism-react-renderer | ~40KB | No | Fewer | ~30 common |
| highlight.js | ~50KB | Yes | Many | 190+ |

### Recommendation: shiki

- Best quality output (uses VS Code's TextMate grammars)
- Supports all major languages
- Many built-in themes (matches dark/light mode)
- Can be lazy-loaded for performance
- `shiki` v3+ has ESM support and tree-shaking

### Copy Button Pattern

Custom code block component wraps `<pre>` with a copy button overlay:
1. Extract `children.props.children` for the code string
2. Use `navigator.clipboard.writeText()` to copy
3. Show "Copied!" feedback for 2 seconds

## Streaming Typewriter Effect

### Pattern: Progressive reveal with react-markdown

1. Store full AI response in state
2. Use `useEffect` + `setInterval` to progressively reveal characters
3. Render partial markdown via react-markdown
4. Handle edge case: incomplete markdown tokens during streaming (don't render mid-token)
5. Alternative: use a character-by-character state with requestAnimationFrame for smoothness

### Simpler approach for MVP

- Use CSS `@keyframes` typing animation for the cursor blink
- Incrementally append text chunks (not individual chars) to the displayed content
- Chunks can be word-level or sentence-level for natural feel

## Packages to Install

```bash
npm install react-markdown remark-gfm rehype-raw shiki
```

- `react-markdown` — core markdown renderer
- `remark-gfm` — GitHub Flavored Markdown
- `rehype-raw` — allow raw HTML if needed
- `shiki` — code syntax highlighting
