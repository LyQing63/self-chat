# 修复前端白屏：补全缺失的 npm 依赖

## Goal

前端页面白屏（在 main.tsx 入口修复之后仍然白屏）。运行时报错：
`Uncaught TypeError: Cannot read properties of null (reading 'useRef')` +
`Invalid hook call ... more than one copy of React`，崩溃发生在 `<TooltipProvider>`。

## Root Cause（已确诊）

`frontend/agent/src/components/ui/*` 共 10 个文件以及其他源码用到一批运行时依赖，但
`frontend/agent/package.json` 只声明了 `react / react-dom / tailwindcss / @tailwindcss/vite /
@fontsource-variable/geist`，**漏声明**以下实际被 import 的包：

- `radix-ui`
- `lucide-react`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `gsap`
- `react-markdown`
- `remark-gfm`

由于项目本地 `node_modules` 没有这些包，Node 沿目录树向上解析，命中了
`/Users/qingly/node_modules`（home 目录里的 stray node_modules）。该目录里的 `radix-ui`
在 import `react` 时又解析到 `/Users/qingly/node_modules/react`——与项目自身的
`frontend/agent/node_modules/react` 是**两个独立的 React 模块实例**。React 的 hook
dispatcher 是模块级单例，双实例导致 dispatcher 为 null，`useRef` 报错，整页崩溃白屏。

stack trace 佐证：
```
exports.useRef ../../../../../node_modules/react/cjs/react.development.js
TooltipProvider ../../../../../node_modules/@radix-ui/react-tooltip/dist/index.mjs
```
（`../../../../../node_modules` 指向项目目录树之外的 home 级 node_modules）

## Requirements

- 在 `frontend/agent/package.json` 的 `dependencies` 中补全上述 8 个缺失依赖。
- 安装到项目本地 `node_modules`，确保 `radix-ui` 与其依赖的 `react` 都解析到项目本地、
  与 app 共享同一个 React 实例。
- 版本需兼容 React 19。

## Acceptance Criteria

- [ ] `package.json` 声明全部实际 import 的运行时依赖。
- [ ] `require.resolve('radix-ui')` 解析到 `frontend/agent/node_modules`，不再指向 home。
- [ ] `npm run dev` 后浏览器渲染出 Sidebar + ChatArea，无 console error，非白屏。
- [ ] `npm run build`（`tsc -b && vite build`）通过。

## Out of Scope

- 不重构组件逻辑。
- 不处理 home 目录 `/Users/qingly/node_modules` 的清理（属环境问题，仅建议）。
