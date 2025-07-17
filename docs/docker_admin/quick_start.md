# Lipeaks Admin 前端 Docker 快速入门指南

本指南提供 Lipeaks Admin 前端项目的 Docker 部署快速操作步骤。

## 前置要求

- Docker 和 Docker Compose 已安装
- Git 已安装
- 已获取项目代码

## 快速部署步骤

### 1. 获取项目代码

```bash
# 克隆项目代码
git clone <repository-url>
cd lipeaks_admin
```

### 2. 准备 Nginx 配置文件

```bash
# 创建 nginx 配置目录
mkdir -p nginx

# 创建默认配置文件
cat > nginx/default.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://web:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /static/ {
        proxy_pass http://web:8000/static/;
    }
    
    location /media/ {
        proxy_pass http://web:8000/media/;
    }
}
EOF
```

### 3. 更新 Dockerfile

确保 Dockerfile 中包含 Nginx 配置文件的复制：

```bash
# 检查已有 Dockerfile
cat Dockerfile

# 如果需要更新，编辑 Dockerfile
# 确保包含以下行：
# COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
```

### 4. 构建前端 Docker 镜像

有两种方式构建前端镜像:

#### 方式1：使用 docker 命令直接构建

```bash
# 在前端项目根目录下执行
docker build -t lipeaks_admin:latest .
```

#### 方式2：使用 docker-compose 构建（推荐）

```bash
# 在包含 docker-compose.yml 的目录下执行
docker-compose build frontend
```

如果前端和后端项目分开部署，需要先构建前端镜像，再传输到后端部署环境：

```bash
# 构建镜像
docker build -t lipeaks_admin:latest .

# 推送到 Docker 仓库（可选）
docker tag lipeaks_admin:latest your-registry/lipeaks_admin:latest
docker push your-registry/lipeaks_admin:latest

# 或者导出镜像文件传输
docker save lipeaks_admin:latest > lipeaks_admin.tar

# 在后端服务器上加载镜像
docker load < lipeaks_admin.tar
```

### 5. 创建或更新 docker-compose.yml

在后端项目目录下，更新 docker-compose.yml 文件，添加前端服务：

```bash
cd <backend-project-directory>

# 备份原 docker-compose.yml
cp docker-compose.yml docker-compose.yml.bak

# 编辑 docker-compose.yml 添加前端服务
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  db:
    # 保留原有 db 服务配置...

  web:
    # 保留原有 web 服务配置...

  frontend:
    image: lipeaks_admin:latest
    build:
      context: <path-to-frontend-project>
      dockerfile: Dockerfile
    restart: always
    ports:
      - "80:80"
    volumes:
      - <path-to-frontend-project>/nginx/default.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - web

volumes:
  mysql_data:
EOF
```

### 6. 构建并启动服务

```bash
# 构建镜像（如果在 docker-compose.yml 中定义了 build 配置）
docker-compose build

# 启动所有服务
docker-compose up -d

# 或仅启动前端服务
docker-compose up -d frontend
```

### 7. 验证部署

- 访问 http://localhost 或服务器 IP 查看前端应用
- 确认前端可以成功连接后端 API

## 常见问题快速解决

### 无法构建镜像

```bash
# 检查构建日志
docker-compose logs frontend
```

### 前端无法连接后端

```bash
# 检查网络连接
docker network ls
docker network inspect <network_name>

# 修改 Nginx 配置中的后端服务名
# 确保与 docker-compose.yml 中的服务名匹配
```

### 容器启动但无法访问页面

```bash
# 检查端口映射
docker ps

# 确认 Nginx 配置
docker exec -it <container_id> cat /etc/nginx/conf.d/default.conf
```

## 后续步骤

- 阅读完整部署指南了解更多配置选项
- 查看故障排除指南解决常见问题
- 参考部署检查清单确保部署完整性

## 参考资源

- [完整部署指南](./frontend_deployment_guide.md)
- [故障排除指南](./troubleshooting_guide.md)
- [部署检查清单](./deployment_checklist.md) 