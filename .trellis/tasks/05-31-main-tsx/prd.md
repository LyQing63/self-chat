# 修复前端白屏：补回缺失的 main.tsx 入口

## Goal

前端页面白屏、无任何渲染。根因：`index.html` 把 `/src/App.tsx` 当作模块入口，但 `App.tsx` 仅 `export default App`、从不调用 `createRoot().render()`，且整个 `src/` 下没有 `main.tsx`。同时 `src/index.css`（Tailwind v4 入口）未在任何地方被 import。结果挂载点 `#root` 始终为空、样式也不加载。需要补回标准 Vite React 入口文件并修正 `index.html` 引用，使应用正常挂载并加载样式。

## What I already know

* `index.html` 第 10 行：`<script type="module" src="/src/App.tsx">`，直接指向 App 组件文件。
* `src/App.tsx` 只定义并 `export default App`，无渲染调用。
* `grep` 确认 `src/` 下无 `createRoot` / `ReactDOM` / `render(`，且无 `main.tsx`。
* `src/index.css` 是 Tailwind v4 入口（`@import "tailwindcss"` 等），当前未被任何文件 import。
* 技术栈：React 19、Vite 8、`@vitejs/plugin-react` + react-compiler、Tailwind v4。
* `tsconfig.app.json`：`jsx: react-jsx`、`verbatimModuleSyntax: true`、path alias `@/* -> ./src/*`。
* `vite.config.ts` 配置了 `@` alias，可用于 import。

## Requirements

* 新建 `src/main.tsx`，使用 `react-dom/client` 的 `createRoot` 将 `<App />` 渲染到 `#root`。
* 在 `main.tsx` 中 `import "@/index.css"`（或相对路径），确保 Tailwind 样式加载。
* 将 `index.html` 入口由 `/src/App.tsx` 改为 `/src/main.tsx`。
* `App.tsx` 保持仅导出组件（职责分离，符合 Vite 标准模板）。

## Acceptance Criteria

* [ ] `src/main.tsx` 存在并正确挂载 App 到 `#root`。
* [ ] `index.html` 入口指向 `/src/main.tsx`。
* [ ] `npm run dev` 启动后页面渲染出 Sidebar + ChatArea，非白屏。
* [ ] Tailwind 样式生效（背景/布局类生效）。
* [ ] `npm run build`（`tsc -b && vite build`）通过，无类型/构建错误。

## Definition of Done

* 浏览器实测页面正常渲染（golden path）。
* `tsc -b` + `vite build` 绿。
* 无新增 `console.log`。

## Out of Scope

* 不重构 App.tsx / 组件逻辑。
* 不调整 Tailwind 主题、不改业务功能（chat 模拟、sidebar 等）。
* 不引入测试框架（当前项目无测试设施；本次为入口修复）。

## Technical Approach

标准 React 19 + Vite 入口：

```tsx
// src/main.tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "@/index.css"
import App from "@/App"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`index.html`：`src="/src/App.tsx"` → `src="/src/main.tsx"`。

## Decision (ADR-lite)

**Context**: 入口缺失导致白屏，需补回。是否把渲染逻辑放进 App.tsx 还是独立 main.tsx。
**Decision**: 采用独立 `main.tsx`（Vite/React 官方模板约定），App.tsx 保持纯组件。
**Consequences**: 符合社区惯例、职责清晰；改动最小（新增 1 文件 + 改 1 行 html）。

## Technical Notes

* 文件已检视：`index.html`、`src/App.tsx`、`src/index.css`、`vite.config.ts`、`tsconfig.app.json`、`package.json`。
* `verbatimModuleSyntax: true`：main.tsx 无类型 import，无需 `import type`。
* 可用 `@/` alias 或相对路径，二者 vite 均支持；倾向 `@/` 与项目其他文件一致。
