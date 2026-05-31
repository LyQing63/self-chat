# Agent

[English](./README.md) | 简体中文

一个全栈 AI 聊天应用，采用 Go 后端 + React 前端。后端通过 Server-Sent Events（SSE）流式返回 LLM 回复，前端实时渲染并支持 Markdown。

## 功能特性

- **流式对话** —— 通过 SSE 逐 token 返回回复
- **LLM 接入** —— DeepSeek 服务（兼容 OpenAI 协议）
- **会话管理** —— 多会话、重命名、删除
- **Markdown 渲染** —— 助手回复支持 GitHub 风格 Markdown
- **主题切换** —— 浅色 / 深色 / 跟随系统
- **现代化 UI** —— React 19、Tailwind CSS 4、Radix UI 组件

## 技术栈

| 层级   | 技术                                                          |
| ------ | ------------------------------------------------------------- |
| 后端   | Go 1.24、Gin、GORM（PostgreSQL）、Redis、Viper、slog           |
| 前端   | React 19、Vite 8、TypeScript、Tailwind CSS 4、Radix UI、GSAP   |
| LLM    | DeepSeek（兼容 OpenAI 的 API）                                 |

## 项目结构

```
agent/
├── backend/                 # Go API 服务
│   ├── cmd/server/          # 入口（main.go）
│   ├── internal/
│   │   ├── config/          # Viper 配置加载
│   │   ├── handler/         # HTTP / SSE 处理器
│   │   ├── middleware/      # CORS、日志、recovery
│   │   ├── model/           # 请求 / 响应模型
│   │   ├── repository/      # 数据访问
│   │   ├── router/          # 路由注册
│   │   └── service/         # 业务逻辑、LLM 客户端
│   ├── pkg/                 # database、redis、logger
│   └── config.yaml          # 运行时配置
└── frontend/agent/          # React + Vite 应用
    └── src/
        ├── components/      # chat、sidebar、ui、shared
        ├── contexts/        # 聊天状态（reducer/context）
        └── types/           # 共享 TypeScript 类型
```

## 快速开始

### 环境要求

- Go 1.24+
- Node.js 20+
- PostgreSQL
- Redis

### 后端

```bash
cd backend

# 从模板复制本地配置，再填入数据库、Redis 与 LLM API key
# （详见下方「配置」）
cp config.example.yaml config.yaml

make run          # 启动服务（go run cmd/server/main.go）
# make build      # 编译为 bin/server
# make test       # 运行测试（race 检测 + 覆盖率）
```

服务默认监听 `http://localhost:8080`。

### 前端

```bash
cd frontend/agent

npm install
npm run dev       # 启动 Vite 开发服务器
# npm run build   # 类型检查 + 生产构建
```

Vite 会将 `/api` 请求代理到 `http://localhost:8080`，因此请先启动后端。

## 配置

将 `backend/config.example.yaml` 复制为 `backend/config.yaml` 并填入你自己的值。`config.yaml` 已被 git 忽略，因此真实凭据不会进入版本控制。

```yaml
server:
  port: 8080
  mode: debug          # debug | release | test

database:
  host: localhost
  port: 5432
  user: admin
  password: <你的密码>
  dbname: agent
  sslmode: disable
  timezone: Asia/Shanghai

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

llm:
  provider: deepseek
  api_key: <你的-api-key>
  temperature: 0.7
  model: deepseek-v4-flash

log:
  level: debug         # debug | info | warn | error
  format: text         # text | json
```

> **安全提示：** 请勿将真实凭据（数据库密码、API key）提交到版本控制。生产环境应使用环境变量或不纳入版本管理的本地配置。

## API

基础路径：`/api/v1`

### `GET /health`

健康检查，返回统一响应结构：

```json
{ "code": 0, "message": "ok", "data": null }
```

### `POST /chat/completions`

通过 SSE 流式返回 LLM 回复。

**请求体：**

```json
{
  "messages": [
    { "role": "user", "content": "你好！" }
  ]
}
```

**响应：** `text/event-stream`，每条事件格式如下：

```
data:{"type":"delta","content":"..."}   // 流式 token 片段
data:{"type":"done"}                     // 流结束
data:{"type":"error","message":"..."}    // 发生错误
```

## 许可证

请在此处补充许可证信息。
