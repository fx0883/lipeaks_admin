# Lipeaks Admin 前端 Docker 部署故障排除指南

本文档提供常见部署问题的解决方案，帮助您排除 Lipeaks Admin 前端 Docker 部署中可能遇到的故障。

## 常见问题与解决方案

### 1. 构建失败问题

#### 症状: Docker 构建过程失败

**可能原因与解决方案:**

- **依赖项安装失败**
  ```bash
  # 检查日志
  docker-compose logs frontend
  
  # 尝试手动构建并查看详细错误
  docker build -t lipeaks_admin .
  ```

- **Node 版本兼容性问题**
  - 确认 Dockerfile 中使用的 Node 版本与项目兼容
  - 修改 Dockerfile 中的 Node 版本: `FROM node:xx-alpine as build-stage`

### 2. 前端容器启动但无法访问

#### 症状: 容器正常运行，但浏览器无法访问前端页面

**可能原因与解决方案:**

- **端口映射问题**
  ```bash
  # 检查容器端口映射
  docker ps
  
  # 确认 docker-compose.yml 中的端口配置
  # 应该是 "80:80" 或其他合适的映射
  ```

- **Nginx 配置错误**
  ```bash
  # 进入容器查看 Nginx 配置
  docker exec -it <container_id> sh
  cat /etc/nginx/conf.d/default.conf
  
  # 检查 Nginx 日志
  docker exec -it <container_id> sh
  cat /var/log/nginx/error.log
  ```

### 3. 前端可以访问但 API 请求失败

#### 症状: 页面加载但后端 API 请求返回错误

**可能原因与解决方案:**

- **API 代理配置错误**
  - 确认 Nginx 配置中的代理设置正确
  - 检查 `location /api/` 配置中的 `proxy_pass` 地址

- **后端服务不可访问**
  ```bash
  # 检查后端容器是否运行
  docker ps | grep web
  
  # 检查容器网络连接
  docker network inspect bridge
  ```

- **跨域问题**
  - 确认 Nginx 配置中已设置适当的 CORS 头
  - 检查后端是否配置了 CORS 支持

### 4. 静态资源加载错误

#### 症状: 页面加载但缺少样式或图片

**可能原因与解决方案:**

- **路径配置问题**
  - 确认 `vite.config.ts` 中的 `base` 配置正确
  - 检查构建后的资源路径是否正确

- **Nginx 配置问题**
  - 确认 `location /` 配置正确
  - 添加额外的静态资源处理规则

### 5. 容器间通信问题

#### 症状: 前端无法连接到后端 API

**可能原因与解决方案:**

- **Docker 网络配置问题**
  ```bash
  # 创建专用网络
  docker network create lipeaks_network
  
  # 修改 docker-compose.yml，添加网络配置
  networks:
    - lipeaks_network
  
  # 底部添加网络定义
  networks:
    lipeaks_network:
      driver: bridge
  ```

- **服务名称解析问题**
  - 确保在 Nginx 配置中使用正确的服务名作为主机名
  - 例如：`proxy_pass http://web:8000/api/;`

### 6. 环境配置问题

#### 症状: 前端应用使用了错误的 API URL 或配置

**可能原因与解决方案:**

- **平台配置文件问题**
  - 确认 `public/platform-config.json` 文件内容正确
  - 必要时通过卷挂载覆盖配置文件:
  ```yaml
  volumes:
    - ./custom-platform-config.json:/usr/share/nginx/html/platform-config.json
  ```

### 7. 性能问题

#### 症状: 前端应用加载缓慢

**可能原因与解决方案:**

- **构建优化问题**
  - 确认生产构建已正确配置
  - 检查 `vite.config.ts` 中的构建优化选项

- **Nginx 缓存配置**
  - 为静态资源添加缓存头:
  ```nginx
  location /assets/ {
      expires 1y;
      add_header Cache-Control "public, max-age=31536000, immutable";
  }
  ```

## 调试技巧

### 容器调试

```bash
# 查看容器日志
docker-compose logs frontend

# 实时查看日志
docker-compose logs -f frontend

# 进入容器内部
docker exec -it <container_id> sh
```

### Nginx 调试

```bash
# 检查 Nginx 配置语法
docker exec <container_id> nginx -t

# 查看 Nginx 错误日志
docker exec <container_id> cat /var/log/nginx/error.log
```

### 网络调试

```bash
# 检查容器网络
docker network ls
docker network inspect bridge

# 从容器内部测试网络连接
docker exec <frontend_container_id> ping web
```

## 高级问题解决

### 自定义构建配置

如需自定义构建过程，可以创建 `.env.production` 文件并在构建时使用:

```bash
# 创建环境变量文件
echo "VITE_API_BASE_URL=/api" > .env.production

# 更新 Dockerfile 中的构建命令
RUN pnpm build --mode production
```

### 使用 Docker 卷进行持久化配置

```yaml
volumes:
  - ./nginx/custom.conf:/etc/nginx/conf.d/default.conf
  - ./config:/usr/share/nginx/html/config
```

## 联系支持

如果您仍然遇到问题，请联系技术支持团队：

- 提交 GitHub Issue
- 发送邮件至 support@example.com
- 在内部工单系统创建工单 