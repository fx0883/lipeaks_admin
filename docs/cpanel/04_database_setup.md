# 数据库设置

本文档详细介绍如何在 cPanel 环境中为 Lipeaks Admin 项目设置和配置 MySQL 数据库。数据库是应用的核心组件，正确的配置对于系统的稳定性和性能至关重要。

## 1. 创建 MySQL 数据库

### 1.1 通过 cPanel 创建数据库

1. 登录 cPanel 控制面板
2. 找到并点击 **"MySQL® Databases"** 选项
3. 在 **"Create New Database"** 部分，输入数据库名称（例如 `lipeaks`）
4. 点击 **"Create Database"** 按钮

> **注意**：cPanel 会自动在您创建的数据库名称前加上您的 cPanel 用户名作为前缀，例如 `cpanelusername_lipeaks`。请记下完整的数据库名称，以便在配置文件中使用。

### 1.2 创建数据库用户

1. 在同一页面，找到 **"Add New User"** 部分
2. 输入用户名（例如 `lipeaks_user`）
3. 输入强密码（建议使用 cPanel 的密码生成器）
4. 点击 **"Create User"** 按钮

> **注意**：同样，cPanel 会在用户名前加上您的 cPanel 用户名作为前缀，例如 `cpanelusername_lipeaks_user`。

### 1.3 分配用户权限

1. 在 **"Add User To Database"** 部分，选择刚创建的用户和数据库
2. 点击 **"Add"** 按钮
3. 在权限选择页面，选择 **"ALL PRIVILEGES"**（或根据安全需求选择特定权限）
4. 点击 **"Make Changes"** 按钮

## 2. 配置数据库连接

### 2.1 后端数据库配置

在后端 Django 项目的设置文件中配置数据库连接：

```python
# core/settings_cpanel.py

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'cpanelusername_lipeaks',  # 替换为您的实际数据库名
        'USER': 'cpanelusername_lipeaks_user',  # 替换为您的实际用户名
        'PASSWORD': 'your_strong_password',  # 替换为您的实际密码
        'HOST': 'localhost',  # 通常是 localhost
        'PORT': '3306',  # MySQL 默认端口
        'OPTIONS': {
            'charset': 'utf8mb4',  # 支持完整的 Unicode 字符集
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",  # 启用严格模式
        },
    }
}
```

### 2.2 配置连接池（可选但推荐）

对于生产环境，建议配置数据库连接池以提高性能：

1. 安装 `django-db-connection-pool`：
   ```bash
   pip install django-db-connection-pool
   ```

2. 修改数据库引擎配置：
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'dj_db_conn_pool.backends.mysql',  # 使用连接池
           'NAME': 'cpanelusername_lipeaks',
           # ... 其他设置保持不变 ...
           'POOL_OPTIONS': {
               'POOL_SIZE': 10,  # 连接池大小
               'MAX_OVERFLOW': 10,  # 允许的最大溢出连接数
               'RECYCLE': 300,  # 连接回收时间（秒）
           },
       }
   }
   ```

## 3. 初始化数据库

### 3.1 应用数据库迁移

通过 SSH 连接到服务器并运行以下命令：

```bash
cd ~/lipeaks_backend
source venv/bin/activate  # 激活虚拟环境
python manage.py migrate --settings=core.settings_cpanel
```

这将创建所有必要的数据库表。

### 3.2 导入初始数据（如果有）

如果您有初始数据（如初始配置、预定义角色等），可以使用 Django fixtures 导入：

```bash
python manage.py loaddata initial_data.json --settings=core.settings_cpanel
```

或者使用 SQL 文件导入：

```bash
mysql -u cpanelusername_lipeaks_user -p cpanelusername_lipeaks < initial_data.sql
```

### 3.3 创建超级管理员用户

```bash
python manage.py createsuperuser --settings=core.settings_cpanel
```

按照提示输入用户名、电子邮件和密码。

## 4. 数据库管理

### 4.1 使用 phpMyAdmin

cPanel 通常集成了 phpMyAdmin，这是一个强大的 MySQL 数据库管理工具：

1. 在 cPanel 中找到并点击 **"phpMyAdmin"** 选项
2. 在左侧面板选择您的数据库
3. 使用图形界面执行各种数据库操作：
   - 查看和编辑表结构
   - 执行 SQL 查询
   - 导入/导出数据
   - 管理用户和权限

### 4.2 使用命令行

如果您有 SSH 访问权限，还可以使用 MySQL 命令行客户端：

```bash
# 连接到数据库
mysql -u cpanelusername_lipeaks_user -p cpanelusername_lipeaks

# 在 MySQL 提示符下执行 SQL 命令
mysql> SHOW TABLES;
mysql> SELECT * FROM auth_user;
```

## 5. 数据库备份

### 5.1 使用 cPanel 备份工具

1. 在 cPanel 中找到 **"Backup"** 或 **"Backup Wizard"** 选项
2. 选择 **"Download a MySQL Database Backup"**
3. 选择您的数据库，然后点击 **"Generate Backup"**

### 5.2 设置自动备份

使用 cPanel 的 Cron Jobs 设置定期备份：

1. 在 cPanel 中找到 **"Cron Jobs"** 选项
2. 添加新的 Cron Job，例如每天凌晨 2 点执行备份：
   ```bash
   0 2 * * * mysqldump -u cpanelusername_lipeaks_user -p'your_password' cpanelusername_lipeaks > ~/backups/lipeaks_$(date +\%Y\%m\%d).sql
   ```

> **安全提示**：在 cron 命令中包含密码存在安全风险。更安全的方法是创建一个包含密码的 `~/.my.cnf` 文件并设置适当的权限。

### 5.3 备份脚本示例

在 `~/scripts` 目录创建一个备份脚本：

```bash
#!/bin/bash

# 设置变量
DB_USER="cpanelusername_lipeaks_user"
DB_NAME="cpanelusername_lipeaks"
BACKUP_DIR="/home/username/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 确保备份目录存在
mkdir -p $BACKUP_DIR

# 创建备份
mysqldump -u $DB_USER -p'your_password' $DB_NAME | gzip > $BACKUP_DIR/$DB_NAME-$DATE.sql.gz

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +7 -delete
```

设置执行权限并添加到 Cron Jobs：

```bash
chmod +x ~/scripts/backup_db.sh
```

## 6. 数据库优化

### 6.1 索引优化

为经常查询的字段添加索引可以显著提高性能：

```sql
-- 例如，为用户表的电子邮件字段添加索引
CREATE INDEX idx_user_email ON auth_user(email);
```

### 6.2 MySQL 配置优化

通过 cPanel 的 **"MultiPHP INI Editor"** 或联系主机提供商，可以调整以下 MySQL 设置：

- `innodb_buffer_pool_size`：为 InnoDB 缓冲池分配足够内存
- `max_connections`：根据应用需求设置最大连接数
- `query_cache_size`：为查询缓存分配适当内存（MySQL 5.7 及以下）

## 7. 故障排除

### 7.1 连接问题

如果遇到数据库连接问题，请检查：

1. 数据库名称、用户名和密码是否正确
2. 数据库主机和端口是否正确
3. 数据库用户是否有适当的权限
4. 防火墙或访问控制设置是否阻止连接

### 7.2 性能问题

如果遇到性能问题：

1. 检查慢查询日志（可通过 phpMyAdmin 访问）
2. 确认关键表是否有适当的索引
3. 优化复杂查询
4. 考虑增加缓存层（如 Redis 或 Memcached）

### 7.3 空间问题

如果数据库占用太多空间：

1. 通过 phpMyAdmin 优化表（去除碎片）
2. 清理不必要的数据或日志
3. 考虑数据归档策略

## 下一步

数据库设置完成后，请继续阅读[域名与HTTPS配置](./05_domain_https_setup.md)文档，了解如何配置域名和启用 HTTPS 安全连接。 