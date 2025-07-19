# 故障排除

本文档提供在 cPanel 环境中部署 Lipeaks Admin 项目过程中可能遇到的常见问题及其解决方案。遇到问题时，可以按照本指南系统性地排查和解决各种部署问题。

## 1. 前端部署问题

### 1.1 静态文件加载失败

**症状**：网站加载不完整，控制台显示 404 错误，找不到 JS 或 CSS 文件。

**可能原因**：
- 静态文件路径配置错误
- 文件权限问题
- 构建过程中的问题

**解决方案**：
1. 检查 `.env.production` 文件中的 `VITE_PUBLIC_PATH` 设置
2. 确认所有静态文件已正确上传到服务器
3. 检查文件权限，应该至少为 644（`-rw-r--r--`）
4. 在本地重新构建前端应用并重新上传

```bash
# 在本地重新构建
pnpm build

# 通过 FTP 重新上传
# 或者通过 SCP
scp -r dist/* username@your_server_ip:~/public_html/
```

### 1.2 路由问题（404 页面）

**症状**：刷新页面或直接访问非根路径时出现 404 错误。

**可能原因**：
- `.htaccess` 重写规则未正确配置
- Apache 的 mod_rewrite 模块未启用

**解决方案**：
1. 确认 `.htaccess` 文件已正确配置：
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

2. 确认文件权限正确（通常是 644）

3. 如果问题仍然存在，联系主机提供商确认 mod_rewrite 已启用

### 1.3 API 连接错误

**症状**：前端应用加载但无法连接到后端 API，控制台显示网络错误。

**可能原因**：
- API URL 配置错误
- CORS 问题
- 后端服务未运行

**解决方案**：
1. 检查 `.env.production` 中的 `VITE_BASE_API` 配置
2. 确认后端 API 服务在运行并可访问
3. 检查后端 CORS 配置是否允许前端域名
4. 使用浏览器开发工具检查请求是否被发送和正确处理

## 2. 后端部署问题

### 2.1 WSGI 应用启动失败

**症状**：访问 API 端点返回 500 错误，服务器错误日志显示应用启动问题。

**可能原因**：
- Python 路径问题
- 依赖项缺失
- 配置文件错误

**解决方案**：
1. 检查 `passenger_wsgi.py` 或 `wsgi.py` 文件设置
2. 确认所有依赖项已正确安装：
   ```bash
   cd ~/lipeaks_backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. 检查日志文件中的具体错误：
   ```bash
   cat ~/lipeaks_backend/logs/django.log
   ```
4. 确认 `settings_cpanel.py` 文件中的配置正确

### 2.2 数据库连接错误

**症状**：应用返回数据库连接错误，无法执行查询。

**可能原因**：
- 数据库凭据错误
- 数据库用户权限不足
- 数据库服务器问题

**解决方案**：
1. 检查 `settings_cpanel.py` 中的数据库配置
2. 确认数据库用户名和密码正确
3. 尝试使用 phpMyAdmin 或命令行直接连接数据库验证凭据
4. 检查数据库用户是否有足够的权限
   ```sql
   GRANT ALL PRIVILEGES ON cpanelusername_lipeaks.* TO 'cpanelusername_lipeaks_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

### 2.3 静态文件和媒体文件问题

**症状**：无法加载后端静态文件（如管理界面样式）或上传的媒体文件。

**可能原因**：
- 静态文件未正确收集
- 文件路径或 URL 配置错误
- 文件权限问题

**解决方案**：
1. 运行 `collectstatic` 命令收集静态文件：
   ```bash
   cd ~/lipeaks_backend
   source venv/bin/activate
   python manage.py collectstatic --noinput --settings=core.settings_cpanel
   ```
2. 确认静态文件和媒体文件目录的权限（通常为 755）
3. 在 `.htaccess` 文件中正确配置静态文件和媒体文件的 URL 路径

### 2.4 权限和安全问题

**症状**：应用出现 403 错误，或文件无法创建或修改。

**可能原因**：
- 文件和目录权限不正确
- SELinux 或其他安全策略限制

**解决方案**：
1. 设置适当的文件和目录权限：
   ```bash
   # 目录权限
   find ~/lipeaks_backend -type d -exec chmod 755 {} \;
   # 文件权限
   find ~/lipeaks_backend -type f -exec chmod 644 {} \;
   # 可执行脚本
   chmod +x ~/lipeaks_backend/manage.py
   ```
2. 确保日志和媒体文件目录可写：
   ```bash
   chmod -R 775 ~/lipeaks_backend/media
   chmod -R 775 ~/lipeaks_backend/logs
   ```

## 3. 数据库问题

### 3.1 迁移错误

**症状**：执行数据库迁移时出错，表示架构不匹配或迁移冲突。

**可能原因**：
- 不兼容的数据库版本
- 迁移历史混乱
- 表已存在但不完整

**解决方案**：
1. 备份数据库（如果有重要数据）
2. 尝试使用 `--fake` 标志应用迁移：
   ```bash
   python manage.py migrate --fake-initial --settings=core.settings_cpanel
   ```
3. 对于严重问题，考虑重新创建数据库并重新应用所有迁移：
   ```bash
   # 在 phpMyAdmin 中删除数据库
   # 重新创建数据库和用户
   # 然后重新迁移
   python manage.py migrate --settings=core.settings_cpanel
   ```

### 3.2 性能问题

**症状**：数据库操作缓慢，页面加载延迟明显。

**可能原因**：
- 缺少索引
- 查询优化问题
- 共享主机资源限制

**解决方案**：
1. 在常用查询字段上添加索引
2. 优化复杂查询
3. 实现缓存机制（如果可能）
4. 考虑升级主机套餐或迁移到性能更好的服务器

## 4. 域名和 HTTPS 问题

### 4.1 域名解析问题

**症状**：域名无法访问或解析到错误的服务器。

**可能原因**：
- DNS 记录配置错误
- DNS 传播未完成
- 域名未激活或过期

**解决方案**：
1. 检查域名注册商控制面板中的 DNS 设置
2. 使用 [whatsmydns.net](https://www.whatsmydns.net/) 等工具检查 DNS 传播
3. 临时使用服务器 IP 地址访问网站进行测试

### 4.2 SSL 证书问题

**症状**：浏览器显示安全警告，证书错误或不安全连接。

**可能原因**：
- 证书未正确安装
- 证书和域名不匹配
- 证书过期
- 混合内容问题

**解决方案**：
1. 在 cPanel 中重新安装 SSL 证书
2. 确认证书域名与访问域名完全匹配
3. 检查证书是否过期，如果是，更新或重新申请
4. 使用浏览器开发工具查找并修复混合内容（HTTP 资源）

### 4.3 HTTPS 重定向问题

**症状**：重定向循环或 HTTPS 不工作。

**可能原因**：
- `.htaccess` 中的重定向规则有问题
- 后端设置错误
- 代理或负载均衡器配置问题

**解决方案**：
1. 检查 `.htaccess` 文件中的重定向规则
2. 确认 Django 设置中的 `SECURE_SSL_REDIRECT` 配置正确
3. 临时禁用重定向规则以排除问题

## 5. 服务器和环境问题

### 5.1 内存限制问题

**症状**：应用崩溃，日志显示内存错误或进程被终止。

**可能原因**：
- 共享主机内存限制
- 应用内存泄漏
- 配置不当导致过度内存使用

**解决方案**：
1. 优化应用内存使用
2. 调整 Python 和 WSGI 服务器的内存限制（如果主机允许）
3. 考虑升级到资源更充足的主机计划
4. 添加缓存层减少数据库查询和计算

### 5.2 CPU 限制问题

**症状**：应用响应缓慢，请求处理时间长。

**可能原因**：
- CPU 密集型操作
- 共享主机 CPU 限制
- 进程数量限制

**解决方案**：
1. 优化CPU密集型代码
2. 使用异步任务处理后台作业
3. 考虑升级主机计划
4. 实现更多的缓存策略

### 5.3 文件系统问题

**症状**：无法写入文件，日志或上传失败。

**可能原因**：
- 磁盘空间不足
- inode 限制
- 文件系统权限问题

**解决方案**：
1. 检查 cPanel 中的磁盘空间和 inode 使用情况
2. 清理不必要的文件和日志
3. 压缩或归档旧日志
4. 确认文件权限正确

## 6. CORS 和安全问题

### 6.1 CORS 错误

**症状**：浏览器控制台显示 CORS 错误，API 请求失败。

**可能原因**：
- CORS 头配置错误
- 域名不匹配
- 预检（OPTIONS）请求未正确处理

**解决方案**：
1. 确认后端 CORS 配置中包含前端域名：
   ```python
   CORS_ALLOWED_ORIGINS = [
       "https://yourdomain.com",
       "https://www.yourdomain.com"
   ]
   ```
2. 对于开发环境，可以临时设置（不推荐生产环境）：
   ```python
   CORS_ALLOW_ALL_ORIGINS = True
   ```
3. 确保 Apache 配置允许 OPTIONS 请求

### 6.2 CSP 和其他安全限制

**症状**：资源加载受阻，浏览器控制台显示内容安全策略错误。

**可能原因**：
- 内容安全策略（CSP）限制
- X-Frame-Options 或其他安全头的问题

**解决方案**：
1. 检查并适当调整服务器发送的安全头
2. 在 `.htaccess` 文件中配置适当的 CSP：
   ```apache
   <IfModule mod_headers.c>
       Header set Content-Security-Policy "default-src 'self' https://api.yourdomain.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
   </IfModule>
   ```

## 7. 日志和调试

### 7.1 查看关键日志

在排除故障时，查看以下日志文件非常有用：

1. **Django 应用日志**：
   ```bash
   cat ~/lipeaks_backend/logs/django.log
   ```

2. **Apache 错误日志**（通过 cPanel）：
   - 在 cPanel 中找到 **"Error Log"** 选项
   - 或直接查看：
     ```bash
     cat ~/logs/error_log
     ```

3. **PHP 错误日志**（如果使用 PHP）：
   ```bash
   cat ~/logs/php_error_log
   ```

### 7.2 启用更详细的调试输出

对于难以诊断的问题，可以临时启用更详细的日志：

1. 在 Django 设置中启用调试（**仅用于排错，不要在生产环境长期使用**）：
   ```python
   DEBUG = True
   
   LOGGING = {
       'version': 1,
       'disable_existing_loggers': False,
       'handlers': {
           'file': {
               'level': 'DEBUG',  # 将级别从 WARNING 改为 DEBUG
               'class': 'logging.FileHandler',
               'filename': os.path.join(BASE_DIR, 'logs/django.log'),
           },
       },
       'loggers': {
           'django': {
               'handlers': ['file'],
               'level': 'DEBUG',  # 将级别从 WARNING 改为 DEBUG
               'propagate': True,
           },
       },
   }
   ```

2. 为前端请求添加详细日志：
   ```javascript
   // 在前端代码的 API 请求处添加
   console.log('Request:', config);
   console.log('Response:', response);
   ```

## 8. 主机提供商特定问题

### 8.1 资源限制

不同的 cPanel 主机提供商可能对以下资源有不同的限制：
- CPU 使用时间
- 内存使用量
- 进程数
- 执行时间
- 文件数量

**解决方案**：
1. 查阅主机提供商的文档了解具体限制
2. 优化应用以符合这些限制
3. 如有必要，升级主机计划

### 8.2 获取支持

如果经过上述故障排除仍无法解决问题：

1. 联系主机提供商的技术支持
2. 提供详细的错误日志和问题描述
3. 询问特定主机环境的最佳实践

## 9. 恢复和备份

### 9.1 备份策略

为防止问题导致数据丢失，定期执行以下备份：

1. **数据库备份**：
   ```bash
   # 使用 cPanel 计划任务每天运行
   mysqldump -u cpanelusername_lipeaks_user -p'password' cpanelusername_lipeaks | gzip > ~/backups/db_$(date +\%Y\%m\%d).sql.gz
   ```

2. **文件备份**：
   ```bash
   # 备份关键目录
   tar -czf ~/backups/files_$(date +\%Y\%m\%d).tar.gz ~/public_html ~/lipeaks_backend
   ```

### 9.2 恢复策略

如果需要从备份恢复：

1. **恢复数据库**：
   ```bash
   # 通过 phpMyAdmin 或命令行
   gunzip < backup.sql.gz | mysql -u cpanelusername_lipeaks_user -p cpanelusername_lipeaks
   ```

2. **恢复文件**：
   ```bash
   # 解压文件到原始位置
   tar -xzf backup.tar.gz -C /
   ```

## 10. 升级和维护

### 10.1 平稳升级

当需要升级应用时：

1. 备份数据库和文件
2. 在非高峰时段进行升级
3. 先在测试环境验证升级
4. 准备回退计划

### 10.2 维护模式

在执行重大更改时，考虑启用维护模式：

1. 创建 `maintenance.html` 文件
2. 在 `.htaccess` 中添加临时重定向：
   ```apache
   # 维护模式 - 取消注释以启用
   # RewriteEngine On
   # RewriteCond %{REQUEST_URI} !^/maintenance\.html$
   # RewriteCond %{REQUEST_URI} !^/static/.*$
   # RewriteRule ^(.*)$ /maintenance.html [R=503,L]
   # ErrorDocument 503 /maintenance.html
   ```

## 结语

此故障排除指南涵盖了在 cPanel 环境中部署 Lipeaks Admin 项目时可能遇到的大多数常见问题。如果遇到此处未列出的问题，建议查阅项目文档、相关技术的官方文档，或咨询专业技术支持。

记住，系统性的故障排除方法是解决复杂问题的关键：隔离问题、检查日志、逐一排除可能原因，并始终做好备份。 