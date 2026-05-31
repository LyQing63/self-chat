.PHONY: run build test lint clean

# 启动服务
run:
	go run cmd/server/main.go

# 编译二进制
build:
	go build -o bin/server cmd/server/main.go

# 运行测试
test:
	go test -race -cover ./...

# 代码检查
lint:
	go vet ./...
	@echo "Lint passed"

# 清理编译产物
clean:
	rm -rf bin/
