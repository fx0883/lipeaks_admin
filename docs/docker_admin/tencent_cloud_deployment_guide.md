# 在腾讯云服务器上使用 docker-compose-ro.yml 部署指南

本文档提供了在腾讯云服务器上使用 docker-compose-ro.yml 部署 Lipeaks Admin 系统的详细步骤。

## 前提条件

- 已购买并配置好腾讯云服务器实例（建议 2核4G 或更高配置）
- 已在腾讯云服务器上安装 Docker 和 Docker Compose
- 已获取 Lipeaks Admin 项目代码或相关 Docker 镜像
- 已开通腾讯云服务器的 80 和 8000 端口（在安全组中设置）

## 部署步骤

### 1. 登录腾讯云服务器

```bash
# 使用 SSH 登录到腾讯云服务器
ssh root@<腾讯云服务器IP>

# 或使用腾讯云提供的网页版终端登录
```

### 2. 安装 Docker 和 Docker Compose（如未安装）

```bash
# 更新包索引
apt-get update || yum update

# 安装 Docker
curl -fsSL https://get.docker.com | sh

# 启动 Docker 服务
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 3. 创建部署目录并准备配置文件

```bash
# 创建部署目录
mkdir -p /opt/lipeaks_admin
cd /opt/lipeaks_admin

# 创建必要的子目录
mkdir -p staticfiles media logs

# 下载或创建 docker-compose-ro.yml 文件
# 方式1：如果已有项目代码，可以从项目中复制
# cp /path/to/lipeaks_admin/docs/docker_admin/docker-compose-ro.yml .

# 方式2：直接创建文件
cat > docker-compose-ro.yml << 'EOF'
version: "3.8"

services:
  db:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: multi_tenant_db_dev
      MYSQL_USER: django
      MYSQL_PASSWORD: django_password
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-authentication-plugin=mysql_native_password
    networks:
      - app-network

  web:
    image: fx0883/lipeaks_backend:latest
    restart: always
    volumes:
      - ./staticfiles:/app/staticfiles
      - ./media:/app/media
      - ./logs:/app/logs
    ports:
      - "8000:8000"
    environment:
      - DEBUG=False
      - SECRET_KEY=your_production_secret_key_here
      - DB_NAME=multi_tenant_db_dev
      - DB_USER=django
      - DB_PASSWORD=django_password
      - DB_HOST=db
      - DB_PORT=3306
      - LOG_TO_CONSOLE=True
      - DJANGO_SETTINGS_MODULE=core.settings_docker
      # 超级管理员设置
      - CREATE_SUPERUSER=true
      - SUPERUSER_USERNAME=admin
      - SUPERUSER_EMAIL=admin@example.com
      - SUPERUSER_PASSWORD=admin123456
      # CORS设置
      - CORS_ALLOWED_ORIGINS=http://localhost,http://frontend
    depends_on:
      - db
    networks:
      - app-network

  frontend:
    image: fx0883/lipeaks_admin:latest
    restart: always
    ports:
      - "80:80"
    depends_on:
      - web
    networks:
      - app-network

volumes:
  mysql_data:

networks:
  app-network:
    driver: bridge
EOF
```

### 4. 自定义配置（生产环境必须修改）

在生产环境中，您应该修改以下配置项以增强安全性：

```bash
# 编辑 docker-compose-ro.yml 文件
nano docker-compose-ro.yml
```

需要修改的关键配置：

1. **数据库密码**：修改 `MYSQL_ROOT_PASSWORD`、`MYSQL_PASSWORD` 和 `DB_PASSWORD` 为强密码
2. **SECRET_KEY**：修改 `SECRET_KEY` 为随机生成的复杂字符串
3. **超级管理员账户**：修改 `SUPERUSER_USERNAME`、`SUPERUSER_EMAIL` 和 `SUPERUSER_PASSWORD`
4. **CORS 设置**：修改 `CORS_ALLOWED_ORIGINS` 为实际域名
5. **DEBUG 模式**：确保 `DEBUG=False` 以关闭调试模式
6. **端口映射**：如有必要，修改端口映射以适应您的环境

### 5. 拉取镜像并启动服务

```bash
# 拉取所需的 Docker 镜像
docker-compose -f docker-compose-ro.yml pull

# 启动所有服务
docker-compose -f docker-compose-ro.yml up -d
```

此命令将：
- 拉取必要的 Docker 镜像 (mysql:8.0, fx0883/lipeaks_backend, fx0883/lipeaks_admin)
- 创建并启动所有容器
- 设置网络连接
- 挂载卷和目录

### 6. 检查服务状态

```bash
# 检查所有容器状态
docker-compose -f docker-compose-ro.yml ps

# 查看日志
docker-compose -f docker-compose-ro.yml logs -f
```

确认所有服务都处于 "running" 状态，且没有错误日志。

### 7. 配置域名和 HTTPS（推荐）

对于生产环境，强烈建议配置域名和 HTTPS：

1. **在腾讯云控制台中将域名解析到服务器 IP**

2. **安装 Certbot 并获取 SSL 证书**：
   ```bash
   apt-get install certbot || yum install certbot
   certbot certonly --standalone -d yourdomain.com
   ```

3. **创建 Nginx 配置文件**：
   ```bash
   mkdir -p nginx
   cat > nginx/default.conf << 'EOF'
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com;

       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
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

4. **更新 docker-compose-ro.yml 文件以使用 HTTPS**：
   ```yaml
   frontend:
     image: fx0883/lipeaks_admin:latest
     restart: always
     ports:
       - "80:80"
       - "443:443"
     volumes:
       - ./nginx/default.conf:/etc/nginx/conf.d/default.conf
       - /etc/letsencrypt:/etc/letsencrypt:ro
     depends_on:
       - web
     networks:
       - app-network
   ```

5. **重启前端服务**：
   ```bash
   docker-compose -f docker-compose-ro.yml up -d frontend
   ```

### 8. 访问应用

- 如果配置了域名和 HTTPS：https://yourdomain.com
- 如果使用 IP 直接访问：http://<腾讯云服务器IP>
- 后端 API：http://<腾讯云服务器IP>:8000/api/v1
- 数据库：<腾讯云服务器IP>:3306（用户名：django，密码：您设置的密码）

### 9. 系统登录

系统启动后，可以使用您在环境变量中配置的超级管理员账户登录：
- 用户名：admin（或您设置的值）
- 密码：admin123456（或您设置的值）

## 管理和维护

### 查看日志

```bash
# 查看所有服务的日志
docker-compose -f docker-compose-ro.yml logs

# 查看特定服务的日志
docker-compose -f docker-compose-ro.yml logs web
docker-compose -f docker-compose-ro.yml logs frontend
docker-compose -f docker-compose-ro.yml logs db

# 实时查看日志
docker-compose -f docker-compose-ro.yml logs -f
```

### 服务管理

```bash
# 停止服务但保留数据
docker-compose -f docker-compose-ro.yml stop

# 重新启动服务
docker-compose -f docker-compose-ro.yml start

# 完全停止并移除容器（保留数据卷）
docker-compose -f docker-compose-ro.yml down

# 完全停止并移除容器及数据卷（谨慎使用！会删除所有数据）
docker-compose -f docker-compose-ro.yml down -v
```

### 数据备份与恢复

```bash
# 备份数据库
docker exec -it $(docker-compose -f docker-compose-ro.yml ps -q db) mysqldump -u django -pdjango_password multi_tenant_db_dev > backup_$(date +%Y%m%d).sql

# 恢复数据库
cat backup_20230101.sql | docker exec -i $(docker-compose -f docker-compose-ro.yml ps -q db) mysql -u django -pdjango_password multi_tenant_db_dev
```

### 更新应用

```bash
# 拉取最新镜像
docker-compose -f docker-compose-ro.yml pull

# 重启服务以应用更新
docker-compose -f docker-compose-ro.yml up -d
```

## 性能优化

### 数据库优化

1. **调整 MySQL 配置**：
   创建 `mysql.cnf` 文件并挂载到容器中：
   
   ```bash
   mkdir -p mysql
   cat > mysql/my.cnf << 'EOF'
   [mysqld]
   innodb_buffer_pool_size = 1G
   innodb_log_file_size = 256M
   max_connections = 200
   key_buffer_size = 128M
   table_open_cache = 400
   EOF
   ```
   
   更新 docker-compose-ro.yml 中的 db 服务：
   
   ```yaml
   db:
     # 其他配置保持不变
     volumes:
       - mysql_data:/var/lib/mysql
       - ./mysql/my.cnf:/etc/mysql/conf.d/custom.cnf
   ```

2. **添加数据库索引**：根据应用需求为常用查询添加索引。

### 应用服务器优化

1. **调整 Gunicorn 工作进程数**：
   
   为 web 服务添加环境变量：
   ```yaml
   web:
     # 其他配置保持不变
     environment:
       # 其他环境变量保持不变
       - GUNICORN_WORKERS=4
       - GUNICORN_THREADS=2
   ```

2. **启用缓存**：配置 Redis 或 Memcached 进行缓存。

### Nginx 优化

1. **启用 Gzip 压缩**：
   
   更新 Nginx 配置：
   ```nginx
   # 在 http 块中添加
   gzip on;
   gzip_comp_level 5;
   gzip_min_length 256;
   gzip_proxied any;
   gzip_types
     application/javascript
     application/json
     application/xml
     text/css
     text/plain
     text/xml;
   ```

2. **配置浏览器缓存**：
   
   ```nginx
   location /static/ {
       proxy_pass http://web:8000/static/;
       expires 30d;
       add_header Cache-Control "public, max-age=2592000";
   }
   ```

## 故障排除

### 容器无法启动

1. **检查日志**：
   ```bash
   docker-compose -f docker-compose-ro.yml logs <service_name>
   ```

2. **检查磁盘空间**：
   ```bash
   df -h
   ```

3. **检查端口占用**：
   ```bash
   netstat -tulpn | grep -E '80|8000|3306'
   ```

### 数据库连接问题

1. **检查数据库容器状态**：
   ```bash
   docker-compose -f docker-compose-ro.yml ps db
   ```

2. **检查数据库日志**：
   ```bash
   docker-compose -f docker-compose-ro.yml logs db
   ```

3. **验证数据库连接**：
   ```bash
   docker exec -it $(docker-compose -f docker-compose-ro.yml ps -q db) mysql -u django -pdjango_password -e "SHOW DATABASES;"
   ```

### 前端无法访问

1. **检查前端容器状态**：
   ```bash
   docker-compose -f docker-compose-ro.yml ps frontend
   ```

2. **检查 Nginx 配置**：
   ```bash
   docker exec -it $(docker-compose -f docker-compose-ro.yml ps -q frontend) nginx -t
   ```

3. **检查 Nginx 日志**：
   ```bash
   docker exec -it $(docker-compose -f docker-compose-ro.yml ps -q frontend) cat /var/log/nginx/error.log
   ```

### API 连接问题

1. **检查后端容器状态**：
   ```bash
   docker-compose -f docker-compose-ro.yml ps web
   ```

2. **检查 API 可访问性**：
   ```bash
   curl -I http://localhost:8000/api/v1/
   ```

3. **检查后端日志**：
   ```bash
   docker-compose -f docker-compose-ro.yml logs web
   ```

## 安全建议

1. **定期更新镜像**：保持所有容器使用最新的安全补丁。

2. **限制数据库访问**：移除或限制 MySQL 端口的外部访问：
   ```yaml
   db:
     # 其他配置保持不变
     ports:
       - "127.0.0.1:3306:3306"  # 只允许本地访问
   ```

3. **设置防火墙**：仅开放必要的端口：
   ```bash
   # 在腾讯云控制台设置安全组，或使用 iptables
   iptables -A INPUT -p tcp --dport 80 -j ACCEPT
   iptables -A INPUT -p tcp --dport 443 -j ACCEPT
   iptables -A INPUT -p tcp --dport 22 -j ACCEPT
   iptables -A INPUT -j DROP
   ```

4. **启用自动安全更新**：
   ```bash
   apt-get install unattended-upgrades || yum install yum-cron
   ```

5. **定期备份数据**：设置定时任务进行数据库备份：
   ```bash
   crontab -e
   # 添加以下行（每天凌晨 2 点备份）
   0 2 * * * cd /opt/lipeaks_admin && docker exec $(docker-compose -f docker-compose-ro.yml ps -q db) mysqldump -u django -pdjango_password multi_tenant_db_dev > /opt/backups/db_$(date +\%Y\%m\%d).sql
   ```

## 结论

按照本指南在腾讯云服务器上部署 Lipeaks Admin 系统后，您应该已经拥有一个功能完整、安全可靠的生产环境。定期维护和监控系统性能，确保应用持续稳定运行。

如需进一步的帮助或有任何问题，请参考项目文档或联系技术支持团队。 