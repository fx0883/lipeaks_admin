# 应用管理 API 详细文档（一）- 获取列表和创建

**基础URL**: `http://localhost:8000`  
**API前缀**: `/api/v1`  
**认证方式**: Bearer Token (JWT)

---

## 1. 获取应用列表

### 基本信息

- **端点**: `/api/v1/applications/`
- **方法**: `GET`
- **权限**: 认证用户（租户管理员和普通成员）
- **说明**: 获取当前租户下的所有应用列表，支持分页和搜索

### 请求参数

#### Query Parameters（可选）

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| page | integer | 否 | 页码，默认1 | `1` |
| page_size | integer | 否 | 每页数量，默认10 | `20` |
| search | string | 否 | 搜索关键词（搜索名称和代码） | `测试` |
| status | string | 否 | 按状态筛选 | `active` |
| ordering | string | 否 | 排序字段，支持多字段 | `-created_at` |

#### 状态枚举值

- `development` - 开发中
- `testing` - 测试中
- `active` - 运行中
- `maintenance` - 维护中
- `deprecated` - 已弃用
- `archived` - 已归档

#### 排序说明

- 字段前加`-`表示降序，如：`-created_at`（最新的在前）
- 支持的排序字段：`name`, `code`, `created_at`, `updated_at`, `status`
- 多字段排序：`ordering=status,-created_at`

### 请求示例

#### cURL命令

```bash
# 基本查询
curl -X GET 'http://localhost:8000/api/v1/applications/' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# 带分页参数
curl -X GET 'http://localhost:8000/api/v1/applications/?page=1&page_size=20' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# 搜索应用
curl -X GET 'http://localhost:8000/api/v1/applications/?search=测试' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# 按状态筛选
curl -X GET 'http://localhost:8000/api/v1/applications/?status=active' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

# 组合查询（搜索+筛选+排序）
curl -X GET 'http://localhost:8000/api/v1/applications/?search=测试&status=development&ordering=-created_at' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

#### JavaScript (Axios)

```javascript
const response = await axios.get('/api/v1/applications/', {
  params: {
    page: 1,
    page_size: 20,
    search: '测试',
    status: 'active',
    ordering: '-created_at'
  },
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
  "code": 2000,
  "message": "操作成功",
  "data": {
    "pagination": {
      "count": 25,                  // 总记录数
      "next": "http://localhost:8000/api/v1/applications/?page=2",  // 下一页URL
      "previous": null,             // 上一页URL
      "page_size": 10,              // 每页数量
      "current_page": 1,            // 当前页码
      "total_pages": 3              // 总页数
    },
    "results": [
      {
        "id": 1,
        "name": "测试应用",
        "code": "test-app",
        "description": "这是一个测试应用",
        "logo": "https://example.com/logo.png",  // Logo URL，可为null
        "current_version": "1.0.0",
        "status": "active",
        "is_active": true,
        "created_at": "2025-11-21T14:31:49.522138Z",
        "updated_at": "2025-11-23T13:26:20.830823Z"
      },
      {
        "id": 2,
        "name": "另一个应用",
        "code": "another-app",
        "description": "应用描述",
        "logo": null,
        "current_version": "2.0.1",
        "status": "development",
        "is_active": true,
        "created_at": "2025-11-22T10:15:30.123456Z",
        "updated_at": "2025-11-24T08:20:45.654321Z"
      }
    ]
  }
}
```

#### 响应字段说明

##### pagination对象

| 字段 | 类型 | 说明 |
|------|------|------|
| count | integer | 总记录数 |
| next | string/null | 下一页URL，最后一页为null |
| previous | string/null | 上一页URL，第一页为null |
| page_size | integer | 每页显示数量 |
| current_page | integer | 当前页码 |
| total_pages | integer | 总页数 |

##### results数组元素

| 字段 | 类型 | 说明 |
|------|------|------|
| id | integer | 应用ID |
| name | string | 应用名称 |
| code | string | 应用代码（唯一标识） |
| description | string | 应用描述 |
| logo | string/null | Logo图片URL |
| current_version | string | 当前版本号 |
| status | string | 应用状态 |
| is_active | boolean | 是否启用 |
| created_at | string | 创建时间（ISO 8601格式） |
| updated_at | string | 更新时间（ISO 8601格式） |

#### 错误响应

##### 401 未授权
```json
{
  "success": false,
  "code": 4001,
  "message": "未授权访问",
  "data": null,
  "error_code": "AUTHENTICATION_FAILED"
}
```

##### 403 权限不足
```json
{
  "success": false,
  "code": 4003,
  "message": "权限不足",
  "data": null,
  "error_code": "PERMISSION_DENIED"
}
```

---

## 2. 创建应用

### 基本信息

- **端点**: `/api/v1/applications/`
- **方法**: `POST`
- **权限**: 租户管理员
- **说明**: 创建新的应用，应用代码(code)在租户内必须唯一

### 请求参数

#### Request Body (JSON)

| 参数名 | 类型 | 必填 | 说明 | 示例 |
|--------|------|------|------|------|
| name | string | ✅ 是 | 应用名称，最大100字符 | `我的应用` |
| code | string | ✅ 是 | 应用代码，最大50字符，租户内唯一 | `my-app-001` |
| description | string | 否 | 应用描述 | `这是应用描述` |
| logo | string | 否 | Logo图片URL | `https://cdn.com/logo.png` |
| website | string | 否 | 官方网站 | `https://example.com` |
| contact_email | string | 否 | 联系邮箱 | `contact@example.com` |
| current_version | string | 否 | 当前版本，默认1.0.0 | `1.0.0` |
| owner | string | 否 | 负责人 | `张三` |
| team | string | 否 | 开发团队 | `开发部` |
| status | string | 否 | 状态，默认development | `development` |
| tags | array | 否 | 标签数组 | `["标签1", "标签2"]` |
| metadata | object | 否 | 元数据JSON对象 | `{"key": "value"}` |

#### 字段验证规则

##### name（应用名称）
- ✅ 必填
- 最大长度：100字符
- 不能为空字符串

##### code（应用代码）
- ✅ 必填
- 最大长度：50字符
- 只能包含字母、数字、下划线、中划线
- 在同一租户内必须唯一
- 建议格式：`app-name-timestamp` 或 `app-name-v1`

##### status（状态）
- 可选枚举值：
  - `development` - 开发中（默认）
  - `testing` - 测试中
  - `active` - 运行中
  - `maintenance` - 维护中
  - `deprecated` - 已弃用
  - `archived` - 已归档

##### contact_email（联系邮箱）
- 必须是有效的邮箱格式
- 示例：`user@example.com`

##### website（官方网站）
- 必须是有效的URL格式
- 示例：`https://example.com`

### 请求示例

#### cURL命令

##### 最简单的创建（仅必填字段）
```bash
curl -X POST 'http://localhost:8000/api/v1/applications/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "name": "新应用",
    "code": "new-app-001"
  }'
```

##### 完整字段创建
```bash
curl -X POST 'http://localhost:8000/api/v1/applications/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d '{
    "name": "我的新应用",
    "code": "my-new-app-001",
    "description": "这是一个功能强大的应用",
    "logo": "https://cdn.example.com/logo.png",
    "website": "https://myapp.example.com",
    "contact_email": "contact@example.com",
    "current_version": "1.0.0",
    "owner": "张三",
    "team": "开发部",
    "status": "development",
    "tags": ["新功能", "测试"],
    "metadata": {
      "category": "工具",
      "priority": "high"
    }
  }'
```

##### 使用时间戳生成唯一code
```bash
curl -X POST 'http://localhost:8000/api/v1/applications/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -d "{
    \"name\": \"测试应用\",
    \"code\": \"test-app-$(date +%s)\",
    \"description\": \"自动化测试创建\",
    \"current_version\": \"1.0.0\",
    \"status\": \"development\"
  }"
```

#### JavaScript (Axios)

```javascript
const response = await axios.post('/api/v1/applications/', {
  name: '我的新应用',
  code: 'my-new-app-001',
  description: '这是一个功能强大的应用',
  logo: 'https://cdn.example.com/logo.png',
  website: 'https://myapp.example.com',
  contact_email: 'contact@example.com',
  current_version: '1.0.0',
  owner: '张三',
  team: '开发部',
  status: 'development',
  tags: ['新功能', '测试'],
  metadata: {
    category: '工具',
    priority: 'high'
  }
}, {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <YOUR_TOKEN>'
  }
});
```

### 响应格式

#### 成功响应 (201 Created)

```json
{
  "success": true,
  "code": "my-new-app-001",
  "message": "操作成功",
  "data": {
    "name": "我的新应用",
    "code": "my-new-app-001",
    "description": "这是一个功能强大的应用",
    "logo": "https://cdn.example.com/logo.png",
    "website": "https://myapp.example.com",
    "contact_email": "contact@example.com",
    "current_version": "1.0.0",
    "owner": "张三",
    "team": "开发部",
    "status": "development",
    "is_active": true,
    "tags": ["新功能", "测试"],
    "metadata": {
      "category": "工具",
      "priority": "high"
    }
  }
}
```

#### 响应字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| name | string | 应用名称 |
| code | string | 应用代码 |
| description | string | 应用描述 |
| logo | string/null | Logo URL |
| website | string/null | 官方网站 |
| contact_email | string/null | 联系邮箱 |
| current_version | string | 当前版本 |
| owner | string | 负责人 |
| team | string | 开发团队 |
| status | string | 应用状态 |
| is_active | boolean | 是否启用（默认true） |
| tags | array | 标签数组 |
| metadata | object | 元数据对象 |

#### 错误响应

##### 400 验证错误 - 缺少必填字段
```json
{
  "success": false,
  "code": 4000,
  "message": "请求参数错误",
  "data": {
    "name": ["该字段是必填项。"],
    "code": ["该字段是必填项。"]
  },
  "error_code": "VALIDATION_ERROR"
}
```

##### 400 验证错误 - code重复
```json
{
  "success": false,
  "code": 4000,
  "message": "请求参数错误",
  "data": {
    "code": ["应用代码已存在"]
  },
  "error_code": "VALIDATION_ERROR"
}
```

##### 400 验证错误 - 邮箱格式错误
```json
{
  "success": false,
  "code": 4000,
  "message": "请求参数错误",
  "data": {
    "contact_email": ["请输入有效的电子邮箱地址。"]
  },
  "error_code": "VALIDATION_ERROR"
}
```

##### 401 未授权
```json
{
  "success": false,
  "code": 4001,
  "message": "未授权访问",
  "data": null,
  "error_code": "AUTHENTICATION_FAILED"
}
```

##### 403 权限不足（非租户管理员）
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

## 实际测试示例

### 示例1：创建基础应用

```bash
# 测试创建最简单的应用
curl -X POST 'http://localhost:8000/api/v1/applications/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM' \
  -d '{
    "name": "快速测试应用",
    "code": "quick-test-001"
  }' \
  -s | jq .
```

**测试结果**: ✅ 创建成功

### 示例2：查询刚创建的应用

```bash
# 搜索刚创建的应用
curl -X GET 'http://localhost:8000/api/v1/applications/?search=快速测试' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM' \
  -s | jq .
```

**测试结果**: ✅ 查询成功

---

## 注意事项

1. **租户隔离**: 所有应用自动关联到当前用户的租户，无需手动指定tenant_id
2. **代码唯一性**: code字段在同一租户内必须唯一，建议使用时间戳或UUID保证唯一性
3. **Token有效期**: Token过期后需要重新登录获取新Token
4. **数据量**: 建议使用分页查询，避免一次性加载过多数据
5. **搜索功能**: search参数会同时搜索name和code字段
