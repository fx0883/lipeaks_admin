# 前端部署

本文档详细介绍如何在 cPanel 环境中部署 Lipeaks Admin 的前端部分。Lipeaks Admin 前端是一个基于 Vue 3 的单页应用，我们将构建静态文件并部署到 cPanel 的 Web 目录。

## 1. 前端配置

### 1.1 配置环境变量

在部署前，需要配置前端应用的环境变量，特别是 API 基础 URL。

1. 在项目根目录创建 `.env.production` 文件（如果不存在）：

```bash
cd /path/to/lipeaks_admin
touch .env.production
```

2. 编辑 `.env.production` 文件，添加以下内容：

```
# API基础URL - 替换为您的实际后端URL
VITE_BASE_API=https://api.yourdomain.com/api/v1

# 公共路径 - 如果部署在子目录，请相应修改
VITE_PUBLIC_PATH=/

# 其他环境变量
VITE_COMPRESSION=none
```

> **重要**：`VITE_BASE_API` 必须设置为您的后端 API URL。如果您将后端部署在同一域名下的子目录，可以使用相对路径，例如 `/api/v1`。

### 1.2 自定义配置（可选）

如果需要，您可以修改 `vite.config.ts` 文件进行更多自定义配置：

```typescript
// vite.config.ts 中的 server.proxy 配置示例
server: {
  proxy: {
    "/api": {
      target: "https://api.yourdomain.com",
      changeOrigin: true,
      rewrite: path => path.replace(/^\/api/, "")
    }
  }
}
```

## 2. 构建前端应用

### 2.1 安装依赖

确保所有依赖都已正确安装：

```bash
pnpm install
```

### 2.2 构建生产版本

运行构建命令生成生产版本的静态文件：

```bash
pnpm build
```

成功构建后，静态文件将生成在 `dist` 目录中。

### 2.3 验证构建结果

检查 `dist` 目录，确保包含以下文件：

- `index.html` - 应用入口文件
- `static/` 目录 - 包含 JS、CSS 和其他静态资源
- 其他资源文件

## 3. 上传前端文件到 cPanel

### 3.1 使用 File Manager（文件管理器）

1. 登录 cPanel 控制面板
2. 找到并点击 **"File Manager"**（文件管理器）
3. 导航到 Web 根目录（通常是 `public_html`）
4. 如果您想将前端部署在子目录中，创建一个子目录，例如 `admin`
5. 点击 **"Upload"**（上传）按钮
6. 上传 `dist` 目录中的所有文件和文件夹

### 3.2 使用 FTP 客户端

1. 打开 FileZilla 或其他 FTP 客户端
2. 使用您的 cPanel FTP 凭据连接到服务器：
   - 主机：`ftp.yourdomain.com` 或服务器 IP
   - 用户名：您的 FTP 用户名
   - 密码：您的 FTP 密码
   - 端口：21（或服务商提供的端口）
3. 连接成功后，导航到 Web 根目录（通常是 `public_html`）
4. 如果需要，在服务器上创建子目录，例如 `admin`
5. 将本地 `dist` 目录中的所有文件上传到服务器目录

> **提示**：上传大量小文件可能需要一些时间。使用 FTP 客户端的批量传输功能可以提高效率。

### 3.3 使用 SSH 和 SCP（高级）

如果您有 SSH 访问权限，可以使用 SCP 命令快速传输文件：

```bash
# 压缩dist目录
cd /path/to/lipeaks_admin
tar -czf dist.tar.gz dist/

# 使用SCP上传
scp dist.tar.gz username@your_server_ip:~/

# SSH登录到服务器
ssh username@your_server_ip

# 解压文件到web目录
cd ~/
mkdir -p public_html/admin  # 如果需要子目录
tar -xzf dist.tar.gz
cp -r dist/* public_html/admin/  # 或直接复制到public_html/
rm -rf dist dist.tar.gz  # 清理临时文件
```

## 4. 配置 .htaccess 文件

对于 SPA（单页应用）来说，需要配置服务器将所有请求重定向到 `index.html`。在 cPanel 的 Apache 服务器上，可以通过 `.htaccess` 文件实现：

1. 在前端应用的根目录（与 `index.html` 同级）创建 `.htaccess` 文件
2. 添加以下内容：

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # 如果请求的不是真实文件，继续
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  
  # 将所有请求重定向到index.html
  RewriteRule ^(.*)$ index.html [QSA,L]
</IfModule>

# 添加缓存控制
<IfModule mod_expires.c>
  ExpiresActive On
  
  # CSS, JavaScript和字体文件缓存一个月
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType application/x-font-ttf "access plus 1 month"
  ExpiresByType application/x-font-woff "access plus 1 month"
  ExpiresByType image/svg+xml "access plus 1 month"
  
  # 图片缓存一周
  ExpiresByType image/jpg "access plus 1 week"
  ExpiresByType image/jpeg "access plus 1 week"
  ExpiresByType image/gif "access plus 1 week"
  ExpiresByType image/png "access plus 1 week"
</IfModule>
```

> **注意**：如果您将前端部署在子目录中，例如 `/admin`，请将 `RewriteBase /` 修改为 `RewriteBase /admin/`。

## 5. 验证部署

### 5.1 访问应用

在浏览器中访问您的域名（或子目录）：

- 如果部署在根目录：`https://yourdomain.com`
- 如果部署在子目录：`https://yourdomain.com/admin`

### 5.2 检查常见问题

如果应用无法正常访问或运行，请检查以下问题：

1. **白屏或404错误**：
   - 确认 `.htaccess` 文件配置正确
   - 检查文件权限（通常应为 644）
   - 检查所有必要的文件是否已上传

2. **API连接错误**：
   - 检查 `VITE_BASE_API` 环境变量是否正确
   - 确认后端 API 是否可访问
   - 检查 CORS 设置

3. **资源加载错误**：
   - 检查浏览器控制台的错误信息
   - 确认静态资源路径是否正确

### 5.3 查看错误日志

如果遇到问题，cPanel 的错误日志可能会提供有用的信息：

1. 在 cPanel 中找到 **"Error Log"**（错误日志）选项
2. 或通过 File Manager 访问 `logs` 目录下的错误日志文件

## 6. 后续维护

### 6.1 更新前端应用

当需要更新前端应用时，重复以下步骤：

1. 拉取最新代码
2. 更新环境变量（如需）
3. 构建新版本
4. 上传新文件到 cPanel（可以先备份旧版本）

### 6.2 性能优化

部署后，可以考虑以下性能优化措施：

1. **启用 Gzip 压缩**：
   在 `.htaccess` 文件中添加：
   ```apache
   <IfModule mod_deflate.c>
     AddOutputFilterByType DEFLATE text/html text/plain text/css application/javascript text/javascript application/json
   </IfModule>
   ```

2. **配置浏览器缓存**：
   我们已在 `.htaccess` 文件中添加了基本的缓存控制，可以根据需要调整。

3. **使用 CDN**：
   考虑使用 CDN（内容分发网络）提供静态资源，如 Cloudflare、jsDelivr 等。

## 下一步

前端部署完成后，请继续阅读[后端部署](./03_backend_deployment.md)文档，部署后端 API 服务。 