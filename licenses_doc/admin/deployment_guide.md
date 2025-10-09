# License Management System - 部署指南

## 概述

本文档提供了License管理系统的完整部署指南，包括环境准备、系统配置、部署步骤和运维监控等内容。

## 系统要求

### 硬件要求
- **CPU**: 4核心及以上 (推荐8核心)
- **内存**: 8GB及以上 (推荐16GB)
- **存储**: 100GB及以上 SSD存储
- **网络**: 100Mbps及以上带宽

### 软件要求
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Web服务器**: Nginx 1.18+ / Apache 2.4+
- **数据库**: MySQL 8.0+ / PostgreSQL 13+
- **PHP**: PHP 8.1+
- **Node.js**: 16.0+ (用于构建前端)
- **Redis**: 6.0+ (缓存和会话存储)

## 环境准备

### 1. 服务器配置

#### Ubuntu/Debian系统
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础软件
sudo apt install -y curl wget git unzip software-properties-common

# 安装Nginx
sudo apt install -y nginx

# 安装MySQL
sudo apt install -y mysql-server

# 安装PHP 8.1
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.1 php8.1-fpm php8.1-mysql php8.1-xml php8.1-curl php8.1-json php8.1-mbstring php8.1-zip php8.1-bcmath php8.1-intl

# 安装Redis
sudo apt install -y redis-server

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

#### CentOS/RHEL系统
```bash
# 更新系统
sudo yum update -y

# 安装EPEL仓库
sudo yum install -y epel-release

# 安装基础软件
sudo yum install -y curl wget git unzip

# 安装Nginx
sudo yum install -y nginx

# 安装MySQL
sudo yum install -y mysql-server

# 安装PHP 8.1
sudo yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm
sudo yum install -y https://rpms.remirepo.net/enterprise/remi-release-8.rpm
sudo yum module enable php:remi-8.1 -y
sudo yum install -y php php-fpm php-mysql php-xml php-curl php-json php-mbstring php-zip php-bcmath php-intl

# 安装Redis
sudo yum install -y redis

# 安装Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

### 2. 数据库配置

#### MySQL配置
```bash
# 启动MySQL服务
sudo systemctl start mysql
sudo systemctl enable mysql

# 安全配置
sudo mysql_secure_installation

# 创建数据库和用户
mysql -u root -p
```

```sql
-- 创建数据库
CREATE DATABASE lipeaks_license CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户
CREATE USER 'license_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON lipeaks_license.* TO 'license_user'@'localhost';
FLUSH PRIVILEGES;

-- 优化配置
SET GLOBAL innodb_buffer_pool_size = 1G;
SET GLOBAL max_connections = 200;
EXIT;
```

#### Redis配置
```bash
# 编辑Redis配置
sudo vim /etc/redis/redis.conf

# 修改以下配置
maxmemory 1gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000

# 启动Redis服务
sudo systemctl start redis
sudo systemctl enable redis
```

## 项目部署

### 1. 代码部署

```bash
# 创建项目目录
sudo mkdir -p /var/www/lipeaks_admin
cd /var/www/lipeaks_admin

# 克隆项目代码
git clone https://github.com/your-org/lipeaks_admin.git .

# 设置文件权限
sudo chown -R www-data:www-data /var/www/lipeaks_admin
sudo chmod -R 755 /var/www/lipeaks_admin
sudo chmod -R 775 storage bootstrap/cache
```

### 2. 后端部署（Laravel）

```bash
# 安装PHP依赖
cd /var/www/lipeaks_admin/api
composer install --optimize-autoloader --no-dev

# 复制环境配置文件
cp .env.example .env

# 编辑环境配置
vim .env
```

#### .env配置示例
```env
APP_NAME="License Management System"
APP_ENV=production
APP_KEY=base64:your-app-key-here
APP_DEBUG=false
APP_URL=https://license.yourdomain.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=error

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lipeaks_license
DB_USERNAME=license_user
DB_PASSWORD=secure_password

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null

# License相关配置
LICENSE_ENCRYPTION_KEY=your-license-encryption-key
LICENSE_DEFAULT_VALIDITY_DAYS=365
LICENSE_MAX_ACTIVATIONS=5

# 权限配置
PERMISSION_CACHE_TTL=3600
PERMISSION_CHECK_STRICT=true
ROLE_HIERARCHY_ENABLED=true

# 审计配置
AUDIT_PERMISSION_CHANGES=true
AUDIT_LOG_RETENTION_DAYS=90
```

```bash
# 生成应用密钥
php artisan key:generate

# 运行数据库迁移
php artisan migrate --force

# 创建符号链接
php artisan storage:link

# 缓存配置
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 安装初始数据
php artisan db:seed --class=LicensePermissionsSeeder
php artisan db:seed --class=DefaultRolesSeeder
```

### 3. 前端部署

```bash
cd /var/www/lipeaks_admin

# 安装前端依赖
npm ci --production

# 构建生产版本
npm run build:prod

# 清理node_modules（可选）
rm -rf node_modules
```

### 4. Web服务器配置

#### Nginx配置
```bash
# 创建Nginx配置文件
sudo vim /etc/nginx/sites-available/lipeaks_admin
```

```nginx
server {
    listen 80;
    server_name license.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name license.yourdomain.com;
    
    root /var/www/lipeaks_admin/dist;
    index index.html;
    
    # SSL证书配置
    ssl_certificate /etc/ssl/certs/your-cert.pem;
    ssl_certificate_key /etc/ssl/private/your-key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; media-src 'self'; object-src 'none'; child-src 'none'; worker-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self';" always;
    
    # Gzip压缩
    gzip on;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时配置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 静态文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|eot|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 安全文件保护
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(storage|vendor|node_modules)/ {
        deny all;
    }
}
```

```bash
# 启用站点
sudo ln -s /etc/nginx/sites-available/lipeaks_admin /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

#### PHP-FPM配置
```bash
# 编辑PHP-FPM配置
sudo vim /etc/php/8.1/fpm/pool.d/www.conf

# 优化配置
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 20
pm.max_requests = 1000

# 重启PHP-FPM
sudo systemctl restart php8.1-fpm
sudo systemctl enable php8.1-fpm
```

## 监控和日志

### 1. 日志配置

```bash
# 创建日志目录
sudo mkdir -p /var/log/lipeaks_admin
sudo chown -R www-data:www-data /var/log/lipeaks_admin

# 配置Logrotate
sudo vim /etc/logrotate.d/lipeaks_admin
```

```
/var/log/lipeaks_admin/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        sudo systemctl reload php8.1-fpm
        sudo systemctl reload nginx
    endscript
}
```

### 2. 系统监控

#### 安装监控工具
```bash
# 安装htop和iotop
sudo apt install -y htop iotop

# 安装Prometheus Node Exporter (可选)
wget https://github.com/prometheus/node_exporter/releases/download/v1.3.1/node_exporter-1.3.1.linux-amd64.tar.gz
tar xvfz node_exporter-1.3.1.linux-amd64.tar.gz
sudo cp node_exporter-1.3.1.linux-amd64/node_exporter /usr/local/bin/
sudo useradd -rs /bin/false node_exporter
```

#### 创建监控脚本
```bash
# 创建系统监控脚本
sudo vim /usr/local/bin/system_monitor.sh
```

```bash
#!/bin/bash

# 系统监控脚本
LOG_FILE="/var/log/lipeaks_admin/system_monitor.log"

# 记录系统资源使用情况
echo "=== System Monitor - $(date) ===" >> $LOG_FILE
echo "CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)" >> $LOG_FILE
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.2f%%", $3/$2 * 100.0)}')" >> $LOG_FILE
echo "Disk Usage: $(df -h / | awk 'NR==2 {print $5}')" >> $LOG_FILE
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')" >> $LOG_FILE

# 检查服务状态
services=("nginx" "mysql" "redis" "php8.1-fpm")
for service in "${services[@]}"; do
    if systemctl is-active --quiet $service; then
        echo "$service: ACTIVE" >> $LOG_FILE
    else
        echo "$service: INACTIVE" >> $LOG_FILE
    fi
done

echo "" >> $LOG_FILE
```

```bash
# 设置执行权限
sudo chmod +x /usr/local/bin/system_monitor.sh

# 添加到crontab
echo "*/5 * * * * /usr/local/bin/system_monitor.sh" | sudo crontab -
```

### 3. 应用监控

```bash
# 创建Laravel日志监控脚本
sudo vim /usr/local/bin/laravel_monitor.sh
```

```bash
#!/bin/bash

LOG_DIR="/var/www/lipeaks_admin/storage/logs"
MONITOR_LOG="/var/log/lipeaks_admin/laravel_monitor.log"

# 检查Laravel错误日志
if [ -f "$LOG_DIR/laravel.log" ]; then
    error_count=$(tail -n 100 "$LOG_DIR/laravel.log" | grep -c "ERROR")
    if [ $error_count -gt 0 ]; then
        echo "$(date): Found $error_count errors in Laravel log" >> $MONITOR_LOG
    fi
fi

# 检查队列状态
queue_failed=$(php /var/www/lipeaks_admin/artisan queue:failed --format=json | jq '. | length')
if [ "$queue_failed" -gt 0 ]; then
    echo "$(date): $queue_failed failed queue jobs detected" >> $MONITOR_LOG
fi
```

## 性能优化

### 1. 数据库优化

```sql
-- MySQL优化配置
-- /etc/mysql/mysql.conf.d/mysqld.cnf

[mysqld]
innodb_buffer_pool_size = 2G
innodb_log_file_size = 512M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections = 200
query_cache_size = 256M
query_cache_type = 1
key_buffer_size = 256M
tmp_table_size = 256M
max_heap_table_size = 256M
```

### 2. Redis优化

```bash
# Redis优化配置
# /etc/redis/redis.conf

maxmemory 2gb
maxmemory-policy allkeys-lru
tcp-keepalive 60
timeout 300
save 900 1
save 300 10
save 60 10000
```

### 3. PHP优化

```ini
; PHP优化配置
; /etc/php/8.1/fpm/php.ini

memory_limit = 256M
max_execution_time = 60
max_input_time = 60
post_max_size = 100M
upload_max_filesize = 100M
max_file_uploads = 20

; OPcache配置
opcache.enable = 1
opcache.memory_consumption = 128
opcache.interned_strings_buffer = 8
opcache.max_accelerated_files = 4000
opcache.revalidate_freq = 60
opcache.fast_shutdown = 1
opcache.enable_cli = 1
```

## 备份策略

### 1. 数据库备份

```bash
# 创建数据库备份脚本
sudo vim /usr/local/bin/db_backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/lipeaks_admin"
DB_NAME="lipeaks_license"
DB_USER="license_user"
DB_PASS="secure_password"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 创建数据库备份
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$DATE.sql.gz"

# 保留最近30天的备份
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: db_backup_$DATE.sql.gz"
```

### 2. 文件备份

```bash
# 创建文件备份脚本
sudo vim /usr/local/bin/file_backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/backups/lipeaks_admin"
SOURCE_DIR="/var/www/lipeaks_admin"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份重要文件
tar -czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" \
    --exclude="$SOURCE_DIR/node_modules" \
    --exclude="$SOURCE_DIR/storage/logs" \
    --exclude="$SOURCE_DIR/storage/framework/cache" \
    --exclude="$SOURCE_DIR/storage/framework/sessions" \
    --exclude="$SOURCE_DIR/storage/framework/views" \
    "$SOURCE_DIR"

# 保留最近7天的文件备份
find $BACKUP_DIR -name "files_backup_*.tar.gz" -mtime +7 -delete

echo "Files backup completed: files_backup_$DATE.tar.gz"
```

```bash
# 设置定时备份
# 每天凌晨2点备份数据库
0 2 * * * /usr/local/bin/db_backup.sh

# 每周日凌晨3点备份文件
0 3 * * 0 /usr/local/bin/file_backup.sh
```

## 安全加固

### 1. 防火墙配置

```bash
# 安装和配置UFW防火墙
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# 限制SSH连接次数
sudo ufw limit 22/tcp

# 查看防火墙状态
sudo ufw status verbose
```

### 2. SSL证书配置

```bash
# 安装Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d license.yourdomain.com

# 设置自动续期
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3. 系统安全

```bash
# 禁用root SSH登录
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# 安装fail2ban
sudo apt install -y fail2ban

# 配置fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo vim /etc/fail2ban/jail.local
```

## 故障排除

### 1. 常见问题

#### 数据库连接错误
```bash
# 检查MySQL服务状态
sudo systemctl status mysql

# 检查数据库连接
mysql -u license_user -p lipeaks_license

# 检查网络连接
netstat -an | grep 3306
```

#### PHP-FPM 502错误
```bash
# 检查PHP-FPM状态
sudo systemctl status php8.1-fpm

# 查看PHP错误日志
sudo tail -f /var/log/php8.1-fpm.log

# 检查权限
ls -la /var/run/php/php8.1-fpm.sock
```

#### Nginx配置错误
```bash
# 测试Nginx配置
sudo nginx -t

# 查看Nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 重载配置
sudo nginx -s reload
```

### 2. 性能问题诊断

```bash
# 查看系统负载
htop
iotop

# 查看数据库性能
mysql -u root -p -e "SHOW PROCESSLIST;"
mysql -u root -p -e "SHOW STATUS LIKE 'Slow_queries';"

# 查看Redis性能
redis-cli info stats
redis-cli info memory
```

### 3. 日志分析

```bash
# 分析访问日志
sudo tail -f /var/log/nginx/access.log | grep "POST\|PUT\|DELETE"

# 分析错误日志
sudo tail -f /var/log/nginx/error.log

# 分析Laravel日志
sudo tail -f /var/www/lipeaks_admin/storage/logs/laravel.log

# 分析系统日志
sudo journalctl -f -u nginx
sudo journalctl -f -u php8.1-fpm
sudo journalctl -f -u mysql
```

## 更新和维护

### 1. 系统更新

```bash
# 创建更新脚本
sudo vim /usr/local/bin/system_update.sh
```

```bash
#!/bin/bash

echo "Starting system update..."

# 备份重要配置文件
cp /etc/nginx/sites-available/lipeaks_admin /tmp/nginx_backup_$(date +%Y%m%d)
cp /etc/php/8.1/fpm/php.ini /tmp/php_backup_$(date +%Y%m%d)

# 更新系统包
sudo apt update
sudo apt upgrade -y

# 重启服务
sudo systemctl restart nginx
sudo systemctl restart php8.1-fpm

echo "System update completed."
```

### 2. 应用更新

```bash
# 创建应用更新脚本
sudo vim /usr/local/bin/app_update.sh
```

```bash
#!/bin/bash

APP_DIR="/var/www/lipeaks_admin"
BACKUP_DIR="/var/backups/lipeaks_admin/app_backup_$(date +%Y%m%d_%H%M%S)"

echo "Starting application update..."

# 创建备份
mkdir -p $BACKUP_DIR
cp -r $APP_DIR $BACKUP_DIR

# 进入维护模式
cd $APP_DIR
php artisan down --render="errors::503" --secret="update-token"

# 拉取最新代码
git pull origin main

# 更新依赖
composer install --optimize-autoloader --no-dev
npm ci --production
npm run build:prod

# 运行迁移
php artisan migrate --force

# 清除缓存
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 退出维护模式
php artisan up

echo "Application update completed."
```

## 监控指标

### 1. 关键性能指标 (KPI)

- **响应时间**: API响应时间 < 500ms
- **可用性**: 系统可用性 > 99.9%
- **错误率**: HTTP 5xx错误率 < 0.1%
- **数据库性能**: 查询响应时间 < 100ms
- **资源使用率**: CPU < 80%, 内存 < 85%, 磁盘 < 90%

### 2. 监控命令

```bash
# 实时监控脚本
sudo vim /usr/local/bin/realtime_monitor.sh
```

```bash
#!/bin/bash

while true; do
    clear
    echo "=== License Management System Monitor ==="
    echo "Time: $(date)"
    echo
    
    echo "=== System Resources ==="
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "Memory: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
    echo "Disk: $(df -h / | awk 'NR==2 {print $5}')"
    echo "Load: $(uptime | awk -F'load average:' '{print $2}')"
    echo
    
    echo "=== Services Status ==="
    systemctl is-active --quiet nginx && echo "Nginx: RUNNING" || echo "Nginx: STOPPED"
    systemctl is-active --quiet mysql && echo "MySQL: RUNNING" || echo "MySQL: STOPPED"
    systemctl is-active --quiet redis && echo "Redis: RUNNING" || echo "Redis: STOPPED"
    systemctl is-active --quiet php8.1-fpm && echo "PHP-FPM: RUNNING" || echo "PHP-FPM: STOPPED"
    echo
    
    echo "=== Network Connections ==="
    echo "HTTP: $(netstat -an | grep :80 | grep ESTABLISHED | wc -l)"
    echo "HTTPS: $(netstat -an | grep :443 | grep ESTABLISHED | wc -l)"
    echo
    
    sleep 5
done
```

通过以上部署指南，您可以成功部署License管理系统并确保其稳定运行。建议根据实际环境和需求调整配置参数，并建立完善的监控和备份机制。
