# 应用管理 API 测试报告

**测试日期**: 2025-11-24  
**测试人员**: AI Assistant  
**API基础URL**: `http://localhost:8000`  
**认证方式**: Bearer Token (JWT)  
**测试角色**: 租户管理员 (admin_cms)

---

## 📋 测试概况

| 序号 | API端点 | HTTP方法 | 测试状态 | 说明 |
|------|---------|----------|----------|------|
| 1 | `/api/v1/applications/` | GET | ✅ 通过 | 获取应用列表 |
| 2 | `/api/v1/applications/` | POST | ✅ 通过 | 创建应用 |
| 3 | `/api/v1/applications/{id}/` | GET | ✅ 通过 | 获取应用详情 |
| 4 | `/api/v1/applications/{id}/` | PATCH | ✅ 通过 | 部分更新应用 |
| 5 | `/api/v1/applications/{id}/` | PUT | ✅ 通过 | 完整更新应用 |
| 6 | `/api/v1/applications/{id}/` | DELETE | ❌ **失败** | 删除应用（500错误） |
| 7 | `/api/v1/applications/{id}/statistics/` | GET | ✅ 通过 | 获取应用统计 |
| 8 | `/api/v1/applications/{id}/articles/` | GET | ✅ 通过 | 获取关联文章 |

**通过率**: 7/8 (87.5%)  
**失败数量**: 1个 (DELETE API)

---

## ❌ 失败的API详情

### DELETE `/api/v1/applications/{id}/`

**问题描述**:  
删除应用时返回500内部服务器错误

**测试命令**:
```bash
curl -X DELETE 'http://localhost:8000/api/v1/applications/4/' \
  -H 'Authorization: Bearer <TOKEN>'
```

**错误响应**:
```json
{
  "success": false,
  "code": 5000,
  "message": "服务器内部错误",
  "data": null,
  "error_code": "INTERNAL_SERVER_ERROR"
}
```

**HTTP状态码**: 500 Internal Server Error

**问题分析**:  
这是后端服务器问题，可能原因：
1. 数据库外键约束冲突（可能有关联数据未清理）
2. TenantModelViewSet的destroy方法实现有bug
3. Application模型的delete方法缺少异常处理
4. 权限检查逻辑错误

**建议修复方案**:
1. 检查后端Django日志，查看具体异常堆栈
2. 检查Application模型是否有关联数据需要级联删除或保护
3. 在ViewSet中重写destroy方法，添加异常捕获
4. 添加事务处理确保数据一致性

**临时解决方案**:  
前端暂时禁用删除功能，或者提示用户联系管理员手动删除

---

## ✅ 成功的API详情

### 1. GET `/api/v1/applications/` - 获取应用列表

**测试命令**:
```bash
curl -X GET 'http://localhost:8000/api/v1/applications/' \
  -H 'Authorization: Bearer <TOKEN>'
```

**响应示例**:
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "pagination": {
      "count": 10,
      "next": null,
      "previous": null,
      "page_size": 10,
      "current_page": 1,
      "total_pages": 1
    },
    "results": [
      {
        "id": 1,
        "name": "测试应用",
        "code": "test-app",
        "description": "测试描述",
        "logo": null,
        "current_version": "1.0.0",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-21T14:31:49.522138Z",
        "updated_at": "2025-11-23T13:26:20.830823Z"
      }
    ]
  }
}
```

### 2. POST `/api/v1/applications/` - 创建应用

**测试命令**:
```bash
curl -X POST 'http://localhost:8000/api/v1/applications/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "name": "新应用",
    "code": "new-app-001",
    "description": "应用描述",
    "current_version": "1.0.0",
    "status": "development"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "code": "new-app-001",
  "message": "操作成功",
  "data": {
    "name": "新应用",
    "code": "new-app-001",
    "description": "应用描述",
    "logo": null,
    "website": null,
    "contact_email": null,
    "current_version": "1.0.0",
    "owner": "",
    "team": "",
    "status": "development",
    "is_active": true,
    "tags": [],
    "metadata": {}
  }
}
```

### 3. GET `/api/v1/applications/{id}/` - 获取应用详情

**测试命令**:
```bash
curl -X GET 'http://localhost:8000/api/v1/applications/1/' \
  -H 'Authorization: Bearer <TOKEN>'
```

**响应示例**:
```json
{
  "success": true,
  "code": "test-app",
  "message": "操作成功",
  "data": {
    "id": 1,
    "name": "测试应用",
    "code": "test-app",
    "description": "测试描述",
    "logo": "https://example.com/logo.png",
    "website": "https://example.com",
    "contact_email": "test@example.com",
    "current_version": "1.0.0",
    "owner": "张三",
    "team": "开发团队",
    "status": "active",
    "is_active": true,
    "tags": ["测试", "开发"],
    "metadata": {},
    "license_count": 5,
    "feedback_count": 3,
    "article_count": 2,
    "created_at": "2025-11-21T14:31:49.522138Z",
    "updated_at": "2025-11-23T13:26:20.830823Z"
  }
}
```

### 4. PATCH `/api/v1/applications/{id}/` - 部分更新

**测试命令**:
```bash
curl -X PATCH 'http://localhost:8000/api/v1/applications/1/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "current_version": "2.0.0",
    "description": "更新后的描述"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "code": "test-app",
  "message": "操作成功",
  "data": {
    "name": "测试应用",
    "code": "test-app",
    "description": "更新后的描述",
    "logo": null,
    "website": "",
    "contact_email": "",
    "current_version": "2.0.0",
    "owner": "",
    "team": "",
    "status": "active",
    "is_active": true,
    "tags": [],
    "metadata": {}
  }
}
```

### 5. PUT `/api/v1/applications/{id}/` - 完整更新

**测试命令**:
```bash
curl -X PUT 'http://localhost:8000/api/v1/applications/1/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <TOKEN>' \
  -d '{
    "name": "完全更新的应用",
    "code": "test-app",
    "description": "完整更新描述",
    "current_version": "3.0.0",
    "status": "testing",
    "owner": "李四",
    "team": "测试团队"
  }'
```

**响应示例**:
```json
{
  "success": true,
  "code": "test-app",
  "message": "操作成功",
  "data": {
    "name": "完全更新的应用",
    "code": "test-app",
    "description": "完整更新描述",
    "logo": null,
    "website": "",
    "contact_email": "",
    "current_version": "3.0.0",
    "owner": "李四",
    "team": "测试团队",
    "status": "testing",
    "is_active": true,
    "tags": [],
    "metadata": {}
  }
}
```

### 6. GET `/api/v1/applications/{id}/statistics/` - 获取统计

**测试命令**:
```bash
curl -X GET 'http://localhost:8000/api/v1/applications/1/statistics/' \
  -H 'Authorization: Bearer <TOKEN>'
```

**响应示例**:
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "licenses": {
      "total": 5,
      "active": 3
    },
    "feedbacks": {
      "total": 10,
      "open": 7
    },
    "articles": {
      "total": 8
    }
  }
}
```

### 7. GET `/api/v1/applications/{id}/articles/` - 获取关联文章

**测试命令**:
```bash
curl -X GET 'http://localhost:8000/api/v1/applications/1/articles/' \
  -H 'Authorization: Bearer <TOKEN>'
```

**响应示例**:
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": []
}
```

---

## 🔧 测试环境

- **后端服务器**: localhost:8000
- **前端服务器**: localhost:8850
- **测试Token**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **测试用户**: admin_cms (租户管理员)
- **租户**: 从Token自动获取，无需手动指定tenant_id

---

## 📌 注意事项

1. **租户隔离**: 所有API自动根据Token中的租户信息进行数据隔离
2. **权限控制**: 
   - GET请求：所有认证用户可访问
   - POST/PUT/PATCH/DELETE：仅租户管理员
3. **必填字段**: name, code (创建时必填)
4. **唯一性约束**: code在同一租户内必须唯一
5. **状态枚举**: development, testing, active, maintenance, deprecated, archived

---

## 🚨 待修复问题

### DELETE API (高优先级)

**问题**: 删除应用时返回500错误  
**影响**: 用户无法通过API删除应用  
**建议**: 后端开发人员立即检查并修复

**后端检查清单**:
- [ ] 查看Django服务器日志
- [ ] 检查数据库外键约束
- [ ] 验证权限检查逻辑
- [ ] 测试级联删除规则
- [ ] 添加异常处理和日志记录
