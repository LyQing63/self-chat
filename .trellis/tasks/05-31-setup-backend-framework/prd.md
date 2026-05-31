# Setup Backend Framework

## Goal

快速搭建一个基于 Gin + PostgreSQL + Redis 的 Go 后端项目框架，包含完整的项目结构、配置管理、日志系统、数据库连接、Redis 连接、统一响应格式和核心中间件。

## 技术选型

| 组件 | 选择 | 版本 |
|------|------|------|
| Web 框架 | Gin | latest |
| 数据库 | PostgreSQL + GORM | latest |
| 缓存 | Redis + go-redis/v9 | v9 |
| 日志 | slog (标准库) | Go 1.24 |
| 配置 | Viper | latest |

## 项目结构

```
backend/
├── cmd/
│   └── server/
│       └── main.go              # 入口，初始化所有组件并启动服务
├── internal/
│   ├── config/
│   │   └── config.go            # Viper 配置加载
│   ├── middleware/
│   │   ├── cors.go              # CORS 中间件
│   │   ├── logger.go            # 请求日志中间件 (slog)
│   │   └── recovery.go          # Panic 恢复中间件
│   ├── model/
│   │   └── response.go          # 统一响应结构
│   ├── handler/                 # HTTP 处理器（按资源分组）
│   ├── service/                 # 业务逻辑层
│   ├── repository/              # 数据访问层
│   └── router/
│       └── router.go            # 路由注册
├── pkg/
│   ├── database/
│   │   └── database.go          # GORM 初始化 + AutoMigrate
│   ├── redis/
│   │   └── redis.go             # Redis 客户端初始化
│   └── logger/
│       └── logger.go            # slog 初始化 + 配置
├── config.yaml                  # 配置文件
├── go.mod
├── go.sum
└── Makefile
```

## 配置文件 (config.yaml)

```yaml
server:
  port: 8080
  mode: debug  # debug | release | test

database:
  host: localhost
  port: 5432
  user: postgres
  password: postgres
  dbname: agent
  sslmode: disable
  timezone: Asia/Shanghai

redis:
  host: localhost
  port: 6379
  password: ""
  db: 0

log:
  level: debug  # debug | info | warn | error
  format: text  # text | json
```

## 统一响应格式

```go
type Response struct {
    Code    int         `json:"code"`    // 0=成功, 非0=错误码
    Message string      `json:"message"` // 提示信息
    Data    interface{} `json:"data"`    // 数据
}
```

## API 路由结构

```
GET  /api/v1/health              # 健康检查
```

后续扩展：
```
GET    /api/v1/conversations          # 会话列表
POST   /api/v1/conversations          # 创建会话
GET    /api/v1/conversations/:id      # 会话详情
PUT    /api/v1/conversations/:id      # 更新会话
DELETE /api/v1/conversations/:id      # 删除会话
GET    /api/v1/conversations/:id/messages  # 消息列表
POST   /api/v1/conversations/:id/messages  # 发送消息
```

## 中间件

1. **CORS** — 允许前端跨域请求（开发环境允许 `localhost:5173`）
2. **Logger** — 记录每个请求的方法、路径、状态码、耗时
3. **Recovery** — 捕获 panic，返回 500 错误而非崩溃

## Makefile 命令

```makefile
make run          # 启动服务
make build        # 编译到 bin/server
make test         # 运行测试
make lint         # go vet + staticcheck
```

## 依赖列表

```
github.com/gin-gonic/gin
gorm.io/gorm
gorm.io/driver/postgres
github.com/redis/go-redis/v9
github.com/spf13/viper
```

## Acceptance Criteria

- [ ] 项目结构完整，可编译运行
- [ ] `make run` 启动服务，监听 8080 端口
- [ ] `GET /api/v1/health` 返回 `{"code": 0, "message": "ok", "data": null}`
- [ ] 配置文件正确加载，支持环境变量覆盖
- [ ] slog 日志输出到 stdout，包含请求日志
- [ ] PostgreSQL 连接成功（需本地运行 PG）
- [ ] Redis 连接成功（需本地运行 Redis）
- [ ] CORS 中间件生效
- [ ] Recovery 中间件生效
- [ ] 统一响应格式可用

## Definition of Done

- 所有 acceptance criteria 通过
- `go vet` 无警告
- 代码结构清晰，遵循 Go 社区规范

## Out of Scope

- Docker / docker-compose
- JWT 认证
- 限流中间件
- 数据库迁移工具（使用 AutoMigrate）
- 单元测试（框架搭建阶段）
- 具体业务 API 实现
