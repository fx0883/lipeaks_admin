# 后端部署

本文档详细介绍如何在 cPanel 环境中部署 Lipeaks Admin 的后端 API 服务。后端基于 Django REST Framework 构建，需要特殊配置以在 cPanel 中运行。

## 1. cPanel Python 应用支持

首先，请确认您的 cPanel 主机支持 Python 应用。通常有两种部署方式：

1. **Python App 功能** - 某些 cPanel 提供专门的 Python 应用部署功能
2. **传统部署** - 通过 Passenger 或其他 WSGI 服务器部署

本指南将首先介绍使用 Python App 功能的部署方法，然后提供传统方法作为备选。

## 2. 使用 cPanel Python App 功能部署

### 2.1 创建 Python 应用

1. 登录 cPanel 控制面板
2. 找到并点击 **"Setup Python App"** 或类似选项
3. 点击 **"Create Application"** 按钮
4. 填写以下信息：
   - **Python Version**：选择 Python 3.8 或更高版本
   - **Application Root**：指定应用路径，例如 `/lipeaks_backend`
   - **Application URL**：设置访问 URL，例如 `/api` 或使用子域名
   - **Application Startup File**：通常是 `passenger_wsgi.py` 或 `app.py`
   - **Application Entry Point**：通常是 `application`

### 2.2 准备后端代码

1. 从本地获取后端代码：
   ```bash
   # 克隆后端代码库（如果是分开的仓库）
   git clone https://github.com/your-organization/lipeaks_backend.git
   cd lipeaks_backend
   ```

2. 创建 `passenger_wsgi.py` 文件（如果不存在）：
   ```python
   import os
   import sys
   
   # 添加项目路径到 Python 路径
   sys.path.insert(0, os.path.dirname(__file__))
   
   # 设置 Django 设置模块
   os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings_cpanel'
   
   # 创建 WSGI 应用
   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

3. 创建 cPanel 专用的设置文件 `core/settings_cpanel.py`：
   ```python
   # 导入基础设置
   from .settings import *
   
   # 生产环境设置
   DEBUG = False
   
   # 允许的主机
   ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com']
   
   # 数据库设置
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.mysql',
           'NAME': 'cpanelusername_lipeaks',  # 替换为您的数据库名
           'USER': 'cpanelusername_dbuser',   # 替换为您的数据库用户名
           'PASSWORD': 'your_db_password',    # 替换为您的数据库密码
           'HOST': 'localhost',
           'PORT': '3306',
           'OPTIONS': {
               'charset': 'utf8mb4',
           },
       }
   }
   
   # 静态文件设置
   STATIC_URL = '/static/'
   STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
   
   # 媒体文件设置
   MEDIA_URL = '/media/'
   MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
   
   # CSRF 和安全设置
   CSRF_COOKIE_SECURE = True
   SESSION_COOKIE_SECURE = True
   
   # 日志设置
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'handlers': {
           'file': {
               'level': 'WARNING',
               'class': 'logging.FileHandler',
               'filename': os.path.join(BASE_DIR, 'logs/django.log'),
           },
       },
       'loggers': {
           'django': {
               'handlers': ['file'],
               'level': 'WARNING',
               'propagate': True,
           },
       },
   }
   
   # 确保日志目录存在
   import os
   os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)
   ```

### 2.3 上传后端代码

您可以使用以下方法之一上传代码：

#### 方法 1：使用 File Manager

1. 压缩后端项目文件夹：
   ```bash
   tar -czf backend.tar.gz lipeaks_backend/
   ```
2. 在 cPanel 中打开 File Manager，导航到应用根目录
3. 上传压缩文件并在服务器上解压

#### 方法 2：使用 FTP

1. 使用 FileZilla 或其他 FTP 客户端连接到服务器
2. 导航到 Python 应用的根目录
3. 上传所有项目文件

#### 方法 3：使用 Git（如果服务器上可用）

1. SSH 连接到服务器：
   ```bash
   ssh username@your_server
   ```
2. 导航到应用目录并使用 Git 克隆代码：
   ```bash
   cd ~/lipeaks_backend
   git clone https://github.com/your-organization/lipeaks_backend.git .
   ```

### 2.4 设置虚拟环境并安装依赖

大多数 cPanel Python 应用功能会自动创建虚拟环境。如果需要手动设置：

1. SSH 连接到服务器
2. 导航到应用目录
3. 创建并激活虚拟环境：
   ```bash
   cd ~/lipeaks_backend
   python3 -m venv venv
   source venv/bin/activate
   ```
4. 安装依赖：
   ```bash
   pip install -r requirements.txt
   pip install mysqlclient   # MySQL 连接器
   pip install gunicorn      # WSGI 服务器
   ```

### 2.5 配置数据库

1. 在 cPanel 中创建数据库和数据库用户（如环境准备文档中所述）
2. 确保数据库凭据与 `settings_cpanel.py` 中的设置一致
3. 应用数据库迁移：
   ```bash
   cd ~/lipeaks_backend
   source venv/bin/activate
   python manage.py migrate --settings=core.settings_cpanel
   ```

### 2.6 收集静态文件

```bash
cd ~/lipeaks_backend
source venv/bin/activate
python manage.py collectstatic --noinput --settings=core.settings_cpanel
```

### 2.7 创建超级用户（管理员）

```bash
cd ~/lipeaks_backend
source venv/bin/activate
python manage.py createsuperuser --settings=core.settings_cpanel
```

### 2.8 配置应用启动

在 cPanel 的 Python App 界面：

1. 确认应用配置（Python 版本、应用路径等）
2. 点击 **"Restart Application"** 使更改生效

## 3. 传统 cPanel 部署方法（备选）

如果 cPanel 不提供 Python App 功能，请使用以下方法：

### 3.1 上传项目文件

使用之前描述的方法（File Manager、FTP 或 Git）上传项目文件到服务器上的目录，例如 `~/lipeaks_backend`。

### 3.2 创建并配置 .htaccess 文件

在项目根目录创建 `.htaccess` 文件：

```apache
<IfModule mod_wsgi.c>
    # 添加 WSGI 配置
    WSGIScriptAlias /api /home/username/lipeaks_backend/wsgi.py
    WSGIPythonPath /home/username/lipeaks_backend:/home/username/lipeaks_backend/venv/lib/python3.8/site-packages
    
    <Directory /home/username/lipeaks_backend>
        <Files wsgi.py>
            Require all granted
        </Files>
    </Directory>
</IfModule>

# 静态文件设置
Alias /static/ /home/username/lipeaks_backend/staticfiles/
Alias /media/ /home/username/lipeaks_backend/media/

<Directory /home/username/lipeaks_backend/staticfiles>
    Require all granted
</Directory>

<Directory /home/username/lipeaks_backend/media>
    Require all granted
</Directory>
```

### 3.3 创建 wsgi.py 文件

在项目根目录创建或修改 `wsgi.py` 文件：

```python
import os
import sys

# 添加项目路径
path = '/home/username/lipeaks_backend'
if path not in sys.path:
    sys.path.append(path)

# 设置 Django 设置模块
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings_cpanel'

# 创建 WSGI 应用
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 3.4 设置虚拟环境并安装依赖

与之前的步骤相同，创建虚拟环境并安装依赖项。

### 3.5 配置数据库和迁移

与之前的步骤相同，配置数据库并应用迁移。

## 4. 配置 CORS 设置

对于前后端分离的应用，需要配置 CORS 设置允许前端访问后端 API：

1. 确保已安装 `django-cors-headers`：
   ```bash
   pip install django-cors-headers
   ```

2. 在 `settings_cpanel.py` 中添加：
   ```python
   INSTALLED_APPS += [
       'corsheaders',
   ]
   
   MIDDLEWARE = [
       'corsheaders.middleware.CorsMiddleware',  # 添加到顶部
       # ... 其他中间件 ...
   ]
   
   # 配置 CORS
   CORS_ALLOWED_ORIGINS = [
       "https://yourdomain.com",
       "https://www.yourdomain.com",
       # 添加前端应用的域名
   ]
   
   # 或允许所有源（不推荐生产环境使用）
   # CORS_ALLOW_ALL_ORIGINS = True
   ```

## 5. 验证部署

### 5.1 测试 API 端点

使用浏览器或 API 测试工具（如 Postman）访问 API 端点：

```
https://yourdomain.com/api/v1/
```

### 5.2 检查日志

如果遇到问题，检查日志文件：

```bash
cd ~/lipeaks_backend
cat logs/django.log
```

也可以通过 cPanel 的 Error Log 查看服务器错误日志。

## 6. 设置定期任务（如需）

如果您的应用需要定期执行任务（如数据清理、报告生成等），可以使用 cPanel 的 Cron Jobs：

1. 在 cPanel 中找到 **"Cron Jobs"** 选项
2. 设置新的 Cron Job，例如：
   ```bash
   # 每天凌晨运行管理命令
   0 0 * * * cd /home/username/lipeaks_backend && /home/username/lipeaks_backend/venv/bin/python manage.py some_command --settings=core.settings_cpanel
   ```

## 7. 配置 SSL/TLS

推荐为 API 服务配置 HTTPS，可以通过以下方式实现：

1. 在 cPanel 中找到 **"SSL/TLS"** 选项
2. 使用 **"Let's Encrypt"** 或上传自己的证书
3. 启用 HTTPS 重定向

## 8. 后续维护

### 8.1 更新应用

当需要更新后端应用时：

1. 上传新代码
2. 应用数据库迁移（如有）：
   ```bash
   cd ~/lipeaks_backend
   source venv/bin/activate
   python manage.py migrate --settings=core.settings_cpanel
   ```
3. 收集静态文件（如有新的静态文件）：
   ```bash
   python manage.py collectstatic --noinput --settings=core.settings_cpanel
   ```
4. 重启应用

### 8.2 监控和日志

定期检查日志文件和服务器状态：

1. 应用日志：`~/lipeaks_backend/logs/django.log`
2. 服务器错误日志：通过 cPanel Error Log 访问

## 下一步

后端部署完成后，请继续阅读[数据库设置](./04_database_setup.md)文档，了解更详细的数据库配置和维护指南。 