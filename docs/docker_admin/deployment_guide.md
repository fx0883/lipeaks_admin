# 使用 docker-compose-ro.yml 部署指南

## 前提条件

- 已安装 Docker 和 Docker Compose
- 已下载 lipeaks_admin 项目代码

## 部署步骤

### 1. 创建必要目录

确保在正确的目录中创建所需的文件夹结构：

```powershell
# 已在 D:\GitHub\lipeaks_admin\docs\docker_admin 目录下
mkdir -Force staticfiles
mkdir -Force media
mkdir -Force logs
```

### 2. 检查配置文件

确认 `docker-compose-ro.yml` 文件存在于当前目录，并包含正确的配置。

### 3. 启动服务

```powershell
docker-compose -f docker-compose-ro.yml up -d
```

此命令将:
- 拉取必要的 Docker 镜像 (mysql:8.0, fx0883/lipeaks_backend, fx0883/lipeaks_admin)
- 创建并启动所有容器
- 设置网络连接
- 挂载卷和目录

### 4. 检查服务状态

```powershell
docker-compose -f docker-compose-ro.yml ps
```

确认所有服务都处于"running"状态。

### 5. 查看日志（可选）

如果需要查看应用日志，运行：

```powershell
docker-compose -f docker-compose-ro.yml logs -f
```

按 `Ctrl+C` 退出日志查看。

### 6. 访问应用

- 前端界面: http://localhost
- 后端API: http://localhost:8000/api/v1
- 数据库: localhost:3306 (用户名: django, 密码: django_password)

### 7. 管理服务

**停止服务但保留数据**:
```powershell
docker-compose -f docker-compose-ro.yml stop
```

**重新启动服务**:
```powershell
docker-compose -f docker-compose-ro.yml start
```

**完全停止并移除容器**:
```powershell
docker-compose -f docker-compose-ro.yml down
```

**完全停止并移除容器及数据卷**:
```powershell
docker-compose -f docker-compose-ro.yml down -v
```

## 故障排除

### 端口冲突

如果遇到端口冲突（例如端口 80 或 8000 已被占用），编辑 `docker-compose-ro.yml` 文件修改端口映射：

```yaml
ports:
  - "8080:80"  # 将主机的8080端口映射到容器的80端口
```

### 数据库连接问题

如果前端或后端无法连接到数据库，检查:
1. 数据库容器是否正常运行
2. 环境变量中的数据库配置是否正确

### API连接问题

如果前端无法连接到API，请确保:
1. 后端服务正常运行
2. Nginx配置正确代理API请求到后端服务

### 查看详细日志

```powershell
# 查看特定服务的日志
docker-compose -f docker-compose-ro.yml logs -f web
docker-compose -f docker-compose-ro.yml logs -f frontend
docker-compose -f docker-compose-ro.yml logs -f db
```

## 系统登录

系统启动后，可以使用以下默认超级管理员账户登录:
- 用户名: admin
- 密码: admin123456

## 备份与恢复

**备份数据库**:
```powershell
docker exec -it docker_admin_db_1 mysqldump -u django -pdjango_password multi_tenant_db_dev > backup.sql
```

**恢复数据库**:
```powershell
cat backup.sql | docker exec -i docker_admin_db_1 mysql -u django -pdjango_password multi_tenant_db_dev
``` 