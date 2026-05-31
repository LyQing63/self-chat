# Agent

English | [简体中文](./README.zh-CN.md)

A full-stack AI chat application with a Go backend and a React frontend. The backend streams LLM completions over Server-Sent Events (SSE); the frontend renders them in real time with Markdown support.

## Features

- **Streaming chat** — token-by-token responses via SSE
- **LLM integration** — DeepSeek provider (OpenAI-compatible)
- **Conversation management** — multiple conversations, rename, delete
- **Markdown rendering** — GitHub-flavored Markdown in assistant replies
- **Theme switching** — light / dark / system
- **Modern UI** — React 19, Tailwind CSS 4, Radix UI primitives

## Tech Stack

| Layer    | Technologies                                                        |
| -------- | ------------------------------------------------------------------- |
| Backend  | Go 1.24, Gin, GORM (PostgreSQL), Redis, Viper, slog                  |
| Frontend | React 19, Vite 8, TypeScript, Tailwind CSS 4, Radix UI, GSAP         |
| LLM      | DeepSeek (OpenAI-compatible API)                                     |

## Project Structure

```
agent/
├── backend/                 # Go API server
│   ├── cmd/server/          # Entry point (main.go)
│   ├── internal/
│   │   ├── config/          # Viper config loading
│   │   ├── handler/         # HTTP / SSE handlers
│   │   ├── middleware/      # CORS, logger, recovery
│   │   ├── model/           # Request / response models
│   │   ├── repository/      # Data access
│   │   ├── router/          # Route registration
│   │   └── service/         # Business logic, LLM client
│   ├── pkg/                 # database, redis, logger
│   └── config.yaml          # Runtime configuration
└── frontend/agent/          # React + Vite app
    └── src/
        ├── components/      # chat, sidebar, ui, shared
        ├── contexts/        # chat state (reducer/context)
        └── types/           # shared TypeScript types
```

## Getting Started

### Prerequisites

- Go 1.24+
- Node.js 20+
- PostgreSQL
- Redis

### Backend

```bash
cd backend

# Create your local config from the template, then fill in
# your database, Redis, and LLM API key (see Configuration below)
cp config.example.yaml config.yaml

make run          # start the server (go run cmd/server/main.go)
# make build      # compile to bin/server
# make test       # run tests with race detector + coverage
```

The server listens on `http://localhost:8080` by default.

### Frontend

```bash
cd frontend/agent

npm install
npm run dev       # start Vite dev server
# npm run build   # type-check + production build
```

Vite proxies `/api` requests to `http://localhost:8080`, so run the backend first.

## Configuration

Copy `backend/config.example.yaml` to `backend/config.yaml` and fill in your own values. `config.yaml` is git-ignored, so your real credentials stay out of version control.

```yaml
server:
  port: 8080
  mode: debug          # debug | release | test

database:
  host: localhost
  port: 5432
  user: admin
  password: <your-password>
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
  api_key: <your-api-key>
  temperature: 0.7
  model: deepseek-v4-flash

log:
  level: debug         # debug | info | warn | error
  format: text         # text | json
```

> **Security note:** Do not commit real credentials (database passwords, API keys) to version control. Use environment variables or an untracked local config in production.

## API

Base path: `/api/v1`

### `GET /health`

Health check. Returns the unified envelope:

```json
{ "code": 0, "message": "ok", "data": null }
```

### `POST /chat/completions`

Streams an LLM completion over SSE.

**Request body:**

```json
{
  "messages": [
    { "role": "user", "content": "Hello!" }
  ]
}
```

**Response:** `text/event-stream`, where each event is:

```
data:{"type":"delta","content":"..."}   // a streamed token chunk
data:{"type":"done"}                     // stream finished
data:{"type":"error","message":"..."}    // an error occurred
```

## License

Add your license here.
