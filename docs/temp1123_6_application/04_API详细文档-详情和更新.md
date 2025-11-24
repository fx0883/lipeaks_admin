# 应用管理 API 详细文档（二）- 详情和更新

**基础URL**: `http://localhost:8000`  
**API前缀**: `/api/v1`  
**认证方式**: Bearer Token (JWT)

---

## 3. 获取应用详情

### 基本信息

- **端点**: `/api/v1/applications/{id}/`
- **方法**: `GET`
- **权限**: 认证用户（租户管理员和普通成员）
- **说明**: 获取指定应用的详细信息，包括统计数据

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ 是 | 应用ID |

### 请求示例

#### cURL命令

```bash
# 获取ID为1的应用详情
curl -X GET 'http://localhost:8000/api/v1/applications/1/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -s | jq .
```

#### JavaScript (Axios)

```javascript
const response = await axios.get(`/api/v1/applications/${id}/`, {
  headers: {
    'Authorization': 'Bearer <YOUR_TOKEN>'
  }
});
```

### 响应格式

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": "test-app",
  "message": "操作成功",
  "data": {
    "id": 1,
    "name": "测试应用",
    "code": "test-app",
    "description": "这是一个测试应用的详细描述",
    "logo": "https://example.com/logo.png",
    "website": "https://myapp.example.com",
    "contact_email": "contact@example.com",
    "current_version": "2.1.0",
    "owner": "张三",
    "team": "开发部",
    "status": "active",
    "is_active": true,
    "tags": ["生产", "重要"],
    "metadata": {
      "category": "工具",
      "priority": "high",
      "environment": "production"
    },
    "license_count": 15,
    "feedback_count": 23,
    "article_count": 8,
    "created_at": "2025-11-21T14:31:49.522138Z",
    "updated_at": "2025-11-23T13:26:20.830823Z"
  }
}
```

#### 响应字段说明（相比列表API增加的字段）

| 字段 | 类型 | 说明 |
|------|------|------|
| website | string/null | 官方网站 |
| contact_email | string/null | 联系邮箱 |
| owner | string | 负责人 |
| team | string | 开发团队 |
| tags | array | 标签数组 |
| metadata | object | 元数据对象 |
| **license_count** | integer | 关联的许可证总数 |
| **feedback_count** | integer | 关联的反馈总数 |
| **article_count** | integer | 关联的文章总数 |

#### 错误响应

##### 404 应用不存在
```json
{
  "success": false,
  "code": 4004,
  "message": "未找到",
  "data": null,
  "error_code": "NOT_FOUND"
}
```

##### 403 无权访问（不属于同一租户）
```json
{
  "success": false,
  "code": 4003,
  "message": "权限不足：无权访问该应用",
  "data": null,
  "error_code": "PERMISSION_DENIED"
}
```

---

## 4. 部分更新应用（PATCH）

### 基本信息

- **端点**: `/api/v1/applications/{id}/`
- **方法**: `PATCH`
- **权限**: 租户管理员
- **说明**: 部分更新应用信息，只需提供需要修改的字段

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ 是 | 应用ID |

### 请求参数

#### Request Body (JSON)

**注意**: PATCH请求只需要包含要修改的字段，未提供的字段保持不变

| 参数名 | 类型 | 说明 |
|--------|------|------|
| name | string | 应用名称 |
| description | string | 应用描述 |
| logo | string/null | Logo URL |
| website | string/null | 官方网站 |
| contact_email | string/null | 联系邮箱 |
| current_version | string | 当前版本 |
| owner | string | 负责人 |
| team | string | 开发团队 |
| status | string | 应用状态 |
| tags | array | 标签数组 |
| metadata | object | 元数据对象 |

**重要**: `code`字段不允许修改

### 请求示例

#### cURL命令

##### 示例1：只更新版本号
```bash
curl -X PATCH 'http://localhost:8000/api/v1/applications/8/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "current_version": "2.0.0"
  }' \
  -s | jq .
```

##### 示例2：更新版本和描述
```bash
curl -X PATCH 'http://localhost:8000/api/v1/applications/8/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "current_version": "2.1.0",
    "description": "更新功能：添加了新的API接口"
  }' \
  -s | jq .
```

##### 示例3：更新状态和负责人
```bash
curl -X PATCH 'http://localhost:8000/api/v1/applications/8/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "status": "active",
    "owner": "李四",
    "team": "运维团队"
  }' \
  -s | jq .
```

##### 示例4：更新标签和元数据
```bash
curl -X PATCH 'http://localhost:8000/api/v1/applications/8/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "tags": ["生产环境", "高优先级", "关键应用"],
    "metadata": {
      "environment": "production",
      "priority": "critical",
      "updated_by": "admin"
    }
  }' \
  -s | jq .
```

#### JavaScript (Axios)

```javascript
// 只更新部分字段
const response = await axios.patch(`/api/v1/applications/${id}/`, {
  current_version: '2.1.0',
  description: '更新功能说明'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_TOKEN>'
  }
});
```

### 响应格式

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": "test-app",
  "message": "操作成功",
  "data": {
    "name": "测试应用",
    "code": "test-app",
    "description": "更新功能：添加了新的API接口",
    "logo": "https://example.com/logo.png",
    "website": "https://example.com",
    "contact_email": "test@example.com",
    "current_version": "2.1.0",
    "owner": "李四",
    "team": "运维团队",
    "status": "active",
    "is_active": true,
    "tags": ["生产环境", "高优先级"],
    "metadata": {
      "environment": "production",
      "priority": "critical"
    }
  }
}
```

#### 错误响应

##### 400 验证错误
```json
{
  "success": false,
  "code": 4000,
  "message": "请求参数错误",
  "data": {
    "status": ["无效的状态值"]
  },
  "error_code": "VALIDATION_ERROR"
}
```

##### 404 应用不存在
```json
{
  "success": false,
  "code": 4004,
  "message": "未找到",
  "data": null,
  "error_code": "NOT_FOUND"
}
```

---

## 5. 完整更新应用（PUT）

### 基本信息

- **端点**: `/api/v1/applications/{id}/`
- **方法**: `PUT`
- **权限**: 租户管理员
- **说明**: 完整更新应用信息，必须提供所有必填字段

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ 是 | 应用ID |

### 请求参数

#### Request Body (JSON)

**注意**: PUT请求需要提供所有必填字段（name, code），未提供的可选字段将被清空

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | ✅ 是 | 应用名称 |
| code | string | ✅ 是 | 应用代码（必须与原值相同） |
| description | string | 否 | 应用描述 |
| logo | string/null | 否 | Logo URL |
| website | string/null | 否 | 官方网站 |
| contact_email | string/null | 否 | 联系邮箱 |
| current_version | string | 否 | 当前版本 |
| owner | string | 否 | 负责人 |
| team | string | 否 | 开发团队 |
| status | string | 否 | 应用状态 |
| tags | array | 否 | 标签数组 |
| metadata | object | 否 | 元数据对象 |

### 请求示例

#### cURL命令

```bash
# 完整更新应用
curl -X PUT 'http://localhost:8000/api/v1/applications/8/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "name": "完整更新后的应用",
    "code": "test-app",
    "description": "这是完整更新后的描述",
    "logo": "https://newcdn.com/logo.png",
    "website": "https://newsite.com",
    "contact_email": "new@example.com",
    "current_version": "3.0.0",
    "owner": "王五",
    "team": "新团队",
    "status": "testing",
    "tags": ["测试", "更新"],
    "metadata": {
      "version": "3.0.0",
      "build": "20251124"
    }
  }' \
  -s | jq .
```

#### JavaScript (Axios)

```javascript
// 完整更新应用
const response = await axios.put(`/api/v1/applications/${id}/`, {
  name: '完整更新后的应用',
  code: 'test-app',  // code必须与原值相同
  description: '这是完整更新后的描述',
  current_version: '3.0.0',
  status: 'testing',
  owner: '王五',
  team: '新团队'
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_TOKEN>'
  }
});
```

### 响应格式

#### 成功响应 (200 OK)

```json
{
  "success": true,
  "code": "test-app",
  "message": "操作成功",
  "data": {
    "name": "完整更新后的应用",
    "code": "test-app",
    "description": "这是完整更新后的描述",
    "logo": "https://newcdn.com/logo.png",
    "website": "https://newsite.com",
    "contact_email": "new@example.com",
    "current_version": "3.0.0",
    "owner": "王五",
    "team": "新团队",
    "status": "testing",
    "is_active": true,
    "tags": ["测试", "更新"],
    "metadata": {
      "version": "3.0.0",
      "build": "20251124"
    }
  }
}
```

---

## 6. 删除应用（DELETE）

### 基本信息

- **端点**: `/api/v1/applications/{id}/`
- **方法**: `DELETE`
- **权限**: 租户管理员
- **说明**: 删除指定应用

⚠️ **当前状态**: **此API存在500错误，暂不可用**

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | integer | ✅ 是 | 应用ID |

### 请求示例

#### cURL命令

```bash
curl -X DELETE 'http://localhost:8000/api/v1/applications/1/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

### 当前问题

❌ **500 Internal Server Error**

```json
{
  "success": false,
  "code": 5000,
  "message": "服务器内部错误",
  "data": null,
  "error_code": "INTERNAL_SERVER_ERROR"
}
```

**问题状态**: 已报告给后端团队，等待修复

**临时方案**: 
1. 前端暂时禁用删除按钮
2. 或通过数据库管理工具手动删除
3. 联系后端管理员进行删除操作

### 预期响应格式（修复后）

#### 成功响应 (204 No Content)

```json
{
  "success": true,
  "code": 2000,
  "message": "删除成功",
  "data": null
}
```

#### 错误响应

##### 404 应用不存在
```json
{
  "success": false,
  "code": 4004,
  "message": "未找到",
  "data": null,
  "error_code": "NOT_FOUND"
}
```

##### 403 权限不足
```json
{
  "success": false,
  "code": 4003,
  "message": "权限不足：需要租户管理员权限",
  "data": null,
  "error_code": "PERMISSION_DENIED"
}
```

---

## PATCH vs PUT 对比

### PATCH（部分更新）

**优点**:
- ✅ 只需提供要修改的字段
- ✅ 其他字段保持不变
- ✅ 适合单个或少量字段更新
- ✅ 网络传输数据量小

**示例**:
```json
// 只更新版本号
{
  "current_version": "2.0.0"
}
```

### PUT（完整更新）

**优点**:
- ✅ 完全替换资源
- ✅ 保证数据完整性
- ✅ 适合批量字段更新

**缺点**:
- ❌ 必须提供所有必填字段
- ❌ 未提供的可选字段会被清空
- ❌ 网络传输数据量大

**示例**:
```json
// 必须提供name和code
{
  "name": "应用名称",
  "code": "app-code",
  "current_version": "2.0.0"
  // 其他字段未提供会被清空
}
```

### 使用建议

| 场景 | 推荐方法 | 原因 |
|------|---------|------|
| 更新单个字段（如版本号） | PATCH | 简单快捷 |
| 更新多个字段 | PATCH | 灵活方便 |
| 完全重置所有信息 | PUT | 确保完整性 |
| 表单提交 | PATCH | 只提交修改的字段 |

---

## 实际测试示例

### 测试1：获取应用详情

```bash
# 获取应用1的详情
curl -X GET 'http://localhost:8000/api/v1/applications/1/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM' \
  -s | jq .
```

**测试结果**: ✅ 成功获取详情，包含统计数据

### 测试2：部分更新

```bash
# 只更新版本号
curl -X PATCH 'http://localhost:8000/api/v1/applications/8/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM' \
  -d '{
    "current_version": "2.0.0",
    "description": "PATCH更新测试"
  }' \
  -s | jq .
```

**测试结果**: ✅ 成功更新，其他字段保持不变

### 测试3：完整更新

```bash
# 完整更新应用
curl -X PUT 'http://localhost:8000/api/v1/applications/8/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM' \
  -d '{
    "name": "PUT完整更新测试",
    "code": "123a",
    "description": "PUT方法测试",
    "current_version": "3.0.0",
    "status": "testing",
    "owner": "测试负责人",
    "team": "测试团队"
  }' \
  -s | jq .
```

**测试结果**: ✅ 成功更新所有字段

---

## 注意事项

1. **code字段**: 创建后不允许修改，PUT和PATCH请求中的code必须与原值相同
2. **租户隔离**: 只能访问和修改本租户的应用
3. **权限控制**: 更新和删除操作需要租户管理员权限
4. **数据验证**: 邮箱、网站URL等字段会进行格式验证
5. **DELETE API**: 当前存在bug，请勿使用，等待后端修复
6. **PATCH vs PUT**: 建议优先使用PATCH，更加灵活和高效
