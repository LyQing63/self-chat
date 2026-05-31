# 修复聊天区域无法滚轮滚动

## 问题
聊天消息区域内容超出可视高度时，鼠标滚轮无法滚动，超出部分被裁剪不可见。

## 根因
`src/components/chat/chat-area.tsx` 中 `<ScrollArea className="flex-1">` 缺少 `min-h-0`。
flex 子项默认 `min-height: auto`，导致 Radix ScrollArea 的 Root 被内容撑高而非在 flex 容器内收缩，Viewport（`size-full`）随之撑满，内部没有 overflow，滚轮失效。

此外 `ref={scrollRef}` 被转发到 Radix `Root` 而非可滚动的 `Viewport`，导致"自动滚动到底部"也作用在错误元素上（次要问题）。

## 方案
1. 给 `ScrollArea` 增加 `min-h-0`：`className="flex-1 min-h-0"`。
2. （可选）让 `useScrollToBottom` 的 ref 指向 Viewport，使自动滚动到底生效。

## 验收
- 消息超出高度时鼠标滚轮可正常上下滚动。
- 新消息到达时自动滚动到底部仍工作。
