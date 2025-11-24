# 应用管理模块故障排查指南

## 问题：数据无法加载

### 检查清单

#### 1. 检查浏览器控制台

打开浏览器开发者工具 (F12)，查看：

**Console标签**:
- 是否有JavaScript错误？
- 是否有API请求日志？
- 错误信息是什么？

**Network标签**:
- 找到 `GET /api/v1/applications/` 请求
- 查看状态码：
  - `200` - 成功，检查响应数据
  - `401` - 未授权，Token可能过期
  - `403` - 无权限，检查用户角色
  - `404` - 接口不存在
  - `500` - 服务器错误

#### 2. 检查API响应

在Network标签中，点击 `/api/v1/applications/` 请求，查看Response:

**正确的响应格式**:
```json
{
  "success": true,
  "code": 2000,
  "data": {
    "pagination": {
      "count": 10,
      "current_page": 1,
      "page_size": 10,
      "total_pages": 1
    },
    "results": [
      {
        "id": 1,
        "name": "测试应用",
        "code": "test_app",
        "status": "active",
        ...
      }
    ]
  }
}
```

**如果返回空数据**:
```json
{
  "success": true,
  "code": 2000,
  "data": {
    "pagination": {
      "count": 0,
      "current_page": 1,
      "page_size": 10,
      "total_pages": 0
    },
    "results": []
  }
}
```
这是正常的，说明数据库中还没有应用记录。

#### 3. 检查Token和权限

**检查Token**:
```javascript
// 在浏览器控制台执行
console.log('Token:', localStorage.getItem('access_token'));
```

**检查用户角色**:
```javascript
// 在浏览器控制台执行
console.log('User Info:', localStorage.getItem('user-info'));
```

#### 4. 测试API接口

使用curl测试接口是否正常：

```bash
# 替换YOUR_TOKEN为实际的access_token
TOKEN="YOUR_TOKEN"

# 测试获取应用列表
curl -X GET "http://localhost:8000/api/v1/applications/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json"
```

#### 5. 检查后端服务

```bash
# 检查后端是否运行
curl http://localhost:8000/api/v1/health/ || echo "后端未运行"

# 查看后端日志
tail -f /path/to/backend/logs/django.log
```

## 常见问题及解决方案

### 问题1: 401 Unauthorized

**原因**: Token过期或无效

**解决**:
1. 退出登录
2. 重新登录
3. 检查Token是否正确保存

### 问题2: 403 Forbidden

**原因**: 用户无权限访问

**解决**:
1. 检查用户角色（超级管理员/租户管理员）
2. 为用户分配 `application:view` 权限
3. 确认租户隔离配置正确

### 问题3: 404 Not Found

**原因**: API路径错误

**检查**:
- 后端路由是否正确配置？
- API前缀是否匹配？（`/api/v1/`）
- 后端服务是否运行在正确的端口？

### 问题4: 500 Internal Server Error

**原因**: 后端代码错误

**排查**:
1. 查看后端日志
2. 检查数据库连接
3. 检查后端代码是否有异常

### 问题5: 数据为空

**原因**: 数据库中没有记录

**解决**:
1. 使用"创建应用"功能添加测试数据
2. 或使用管理命令导入测试数据：

```bash
# 进入后端项目
cd /path/to/backend

# 创建测试应用
python manage.py shell
>>> from apps.application.models import Application
>>> Application.objects.create(
...     name="测试应用",
...     code="test_app",
...     status="active",
...     current_version="1.0.0",
...     tenant_id=1  # 替换为实际的租户ID
... )
```

### 问题6: 权限检查失败

**错误**: `userStore.isAdmin is not a function`

**原因**: 代码已修复，清除浏览器缓存

**解决**:
1. 硬刷新页面：Ctrl+Shift+R (Windows) 或 Cmd+Shift+R (Mac)
2. 或清除浏览器缓存
3. 重启开发服务器

## 快速测试脚本

保存为 `test-application-api.sh`:

```bash
#!/bin/bash

# 配置
API_BASE="http://localhost:8000"
TOKEN="your_access_token_here"

echo "=== 测试应用管理API ==="

# 1. 获取应用列表
echo "1. 测试获取应用列表..."
curl -s -X GET "${API_BASE}/api/v1/applications/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" | jq .

# 2. 创建测试应用
echo ""
echo "2. 测试创建应用..."
curl -s -X POST "${API_BASE}/api/v1/applications/" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试应用",
    "code": "test_app_'$(date +%s)'",
    "status": "active",
    "current_version": "1.0.0"
  }' | jq .

echo ""
echo "=== 测试完成 ==="
```

使用方法：
```bash
chmod +x test-application-api.sh
./test-application-api.sh
```

## 联系支持

如果以上步骤都无法解决问题，请提供：
1. 浏览器控制台的完整错误信息
2. Network标签中API请求的截图
3. 后端日志的相关部分
