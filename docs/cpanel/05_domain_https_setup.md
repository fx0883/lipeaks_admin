# 域名与HTTPS配置

本文档详细介绍如何在 cPanel 环境中为 Lipeaks Admin 项目配置域名和启用 HTTPS 安全连接。正确的域名配置和 HTTPS 加密不仅提高了网站的专业性，也是保护数据传输安全的关键步骤。

## 1. 域名配置

### 1.1 添加域名到 cPanel

如果您的域名不是通过您的 cPanel 主机提供商注册的，需要先将其添加到 cPanel：

1. 登录 cPanel 控制面板
2. 找到并点击 **"Domains"** 或 **"Addon Domains"** 部分
3. 在 **"Create an Addon Domain"** 表单中填写以下信息：
   - **New Domain Name**：输入您的域名（例如 `yourdomain.com`）
   - **Subdomain**：通常会自动填充
   - **Document Root**：选择网站文件所在的目录（例如 `public_html/yourdomain`）
4. 点击 **"Add Domain"** 按钮

### 1.2 设置子域名（可选）

如果您想使用子域名（例如 `admin.yourdomain.com` 或 `api.yourdomain.com`）：

1. 在 cPanel 中找到并点击 **"Subdomains"** 选项
2. 填写子域名信息：
   - **Subdomain**：输入子域名前缀（例如 `admin` 或 `api`）
   - **Domain**：从下拉菜单选择主域名
   - **Document Root**：选择子域名对应的目录
3. 点击 **"Create"** 按钮

### 1.3 配置 DNS 记录

确保域名的 DNS 记录指向您的 cPanel 主机：

1. 在域名注册商的控制面板中，找到 DNS 管理选项
2. 设置 A 记录或 CNAME 记录：
   - **A 记录**：将域名直接指向服务器 IP 地址
   - **CNAME 记录**：将域名指向主机提供商的域名

例如，设置 A 记录：
- 主机名：`@` 或 `yourdomain.com`
- 类型：`A`
- 值：您的服务器 IP 地址（例如 `192.168.1.1`）

或者设置子域名的 CNAME 记录：
- 主机名：`api`
- 类型：`CNAME`
- 值：`yourdomain.com` 或主机提供商提供的域名

> **注意**：DNS 更改可能需要 24-48 小时才能完全传播。

## 2. HTTPS 配置

### 2.1 获取 SSL 证书

cPanel 提供多种方式获取 SSL 证书：

#### 方法 1：使用 Let's Encrypt（免费）

1. 在 cPanel 中找到并点击 **"SSL/TLS"** 部分下的 **"Let's Encrypt SSL"** 选项
2. 选择要保护的域名和子域名
3. 点击 **"Issue"** 或 **"Issue Certificate"** 按钮
4. 证书通常会在几分钟内自动安装

#### 方法 2：使用自定义 SSL 证书

如果您已经有 SSL 证书（例如从其他提供商购买）：

1. 在 cPanel 中找到并点击 **"SSL/TLS"** 部分下的 **"Install and Manage SSL for your site (HTTPS)"** 选项
2. 选择要保护的域名
3. 粘贴以下内容：
   - **Certificate (CRT)**：您的 SSL 证书内容
   - **Private Key**：与证书对应的私钥
   - **Certificate Authority Bundle (CABUNDLE)**：中间证书内容（如果有）
4. 点击 **"Install Certificate"** 按钮

### 2.2 强制使用 HTTPS

为了确保所有流量都通过 HTTPS 加密，建议设置强制 HTTPS 重定向：

1. 在网站根目录创建或编辑 `.htaccess` 文件（通过 File Manager 或 FTP）
2. 添加以下内容：

```apache
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

这将把所有 HTTP 请求重定向到相应的 HTTPS URL。

### 2.3 配置 HTTP 严格传输安全 (HSTS)

HSTS 可以进一步增强安全性，告诉浏览器始终使用 HTTPS 连接：

在 `.htaccess` 文件中添加：

```apache
<IfModule mod_headers.c>
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
</IfModule>
```

> **注意**：启用 HSTS 前请确保您的 HTTPS 配置正确无误，因为一旦启用，将很难快速回退到 HTTP。

## 3. 前端配置

### 3.1 更新前端 API 地址

确保前端应用使用 HTTPS URL 访问后端 API：

1. 编辑 `.env.production` 文件：
   ```
   VITE_BASE_API=https://api.yourdomain.com/api/v1
   ```

2. 重新构建前端应用并部署

### 3.2 确保资源加载安全

检查前端代码中的资源引用，确保所有外部资源都通过 HTTPS 加载，避免混合内容警告：

- 图片：`<img src="https://...">`
- 脚本：`<script src="https://...">`
- 样式表：`<link href="https://...">`
- API 调用：`fetch("https://...")`

## 4. 后端配置

### 4.1 配置 Django 设置

在 Django 设置文件中启用 HTTPS 相关选项：

```python
# core/settings_cpanel.py

# 安全设置
SECURE_SSL_REDIRECT = True  # 强制重定向到 HTTPS
SESSION_COOKIE_SECURE = True  # 仅通过 HTTPS 发送会话 Cookie
CSRF_COOKIE_SECURE = True  # 仅通过 HTTPS 发送 CSRF Cookie
SECURE_HSTS_SECONDS = 31536000  # 启用 HSTS (1 年)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True  # 子域名也使用 HSTS
SECURE_HSTS_PRELOAD = True  # 允许预加载到浏览器 HSTS 列表

# 如果使用代理服务器
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
```

### 4.2 更新 CORS 设置

如果使用了 `django-cors-headers`，请更新 CORS 配置以使用 HTTPS URL：

```python
# CORS 设置
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
    "https://admin.yourdomain.com",
]
```

## 5. 验证 HTTPS 配置

### 5.1 使用浏览器测试

1. 在浏览器中访问您的网站：`https://yourdomain.com`
2. 确认浏览器显示安全锁图标，表示连接是安全的
3. 尝试使用 HTTP 访问（`http://yourdomain.com`），应该会自动重定向到 HTTPS

### 5.2 使用在线 SSL 检测工具

使用以下工具之一检查您的 SSL 配置：

- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslshopper.com/ssl-checker.html)
- [DigiCert SSL Checker](https://www.digicert.com/help/)

这些工具会分析您的 SSL 证书和配置，提供详细报告和改进建议。

### 5.3 常见问题检查

1. **混合内容警告**：检查浏览器控制台是否有混合内容警告
2. **证书链问题**：确保中间证书正确安装
3. **证书不匹配**：确保证书涵盖正在使用的所有域名和子域名

## 6. 自动续期 Let's Encrypt 证书

Let's Encrypt 证书有效期为 90 天，需要定期续期：

1. cPanel 通常会自动处理 Let's Encrypt 证书的续期
2. 您可以在 cPanel 的 **"SSL Status"** 页面查看证书到期日期
3. 如果需要手动续期，可以在 **"Let's Encrypt SSL"** 页面点击续期选项

## 7. 多域名和通配符证书

### 7.1 多域名证书

如果您的项目使用多个域名或子域名，可以：

1. 在申请 Let's Encrypt 证书时选择所有相关域名
2. 或购买支持多域名（SAN）的商业 SSL 证书

### 7.2 通配符证书

如果您需要为多个子域名提供 HTTPS，可以考虑通配符证书：

1. 某些主机提供商支持 Let's Encrypt 通配符证书
2. 或购买商业通配符 SSL 证书（例如 `*.yourdomain.com`）

> **注意**：通配符证书通常需要 DNS 验证，可能需要主机提供商的额外支持。

## 8. 故障排除

### 8.1 证书安装失败

如果 SSL 证书安装失败：

1. 检查域名的 DNS 记录是否正确指向服务器
2. 确认域名已完全传播（可以使用 [whatsmydns.net](https://www.whatsmydns.net/) 检查）
3. 检查域名控制验证是否成功完成

### 8.2 HTTPS 重定向循环

如果遇到重定向循环：

1. 检查 `.htaccess` 文件中的重定向规则
2. 确认 `SECURE_SSL_REDIRECT` 和代理设置的配置正确
3. 临时禁用重定向规则进行故障排除

### 8.3 证书警告或错误

如果浏览器显示证书警告：

1. 确认证书是否已过期
2. 检查证书是否与访问的域名匹配
3. 验证证书链是否完整（包括所有中间证书）

## 下一步

域名和 HTTPS 配置完成后，请继续阅读[故障排除](./06_troubleshooting.md)文档，了解如何解决部署过程中可能遇到的常见问题。 