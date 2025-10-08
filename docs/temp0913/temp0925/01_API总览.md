# API总览 - 多租户积分系统

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     客户端应用层                            │
│  Web App │ Mobile App │ Desktop App │ Third-party Apps    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS/REST API
┌─────────────────────▼───────────────────────────────────────┐
│                   API Gateway 层                           │
│  认证验证 │ 限流控制 │ 日志记录 │ 错误处理 │ 响应缓存     │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    应用服务层                               │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │  积分系统   │ │  VIP标签    │ │  许可证分配 │ │ 统计分析│ │
│ │ Points API  │ │  VIP API    │ │License API  │ │Stats API│ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   业务服务层                                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ Points      │ │Permission   │ │VIP Expiry   │ │License  │ │
│ │ Engine      │ │ Service     │ │Service      │ │Service  │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   数据访问层                                │
│  ORM │ 数据库连接池 │ 查询优化 │ 事务管理 │ 缓存策略      │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    数据存储层                               │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │   主数据库  │ │   Redis     │ │   文件存储  │ │  日志    │ │
│ │   MySQL     │ │   缓存      │ │   Storage   │ │  Logs   │ │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 认证与授权

### JWT Bearer Token 认证

#### 认证流程

```
1. 客户端登录 → 2. 服务器验证 → 3. 返回JWT Token → 4. 客户端存储Token
     ↓                ↓                ↓                    ↓
   POST /auth/    验证用户名密码    生成JWT + 刷新Token    localStorage
   login/         租户权限检查      设置过期时间           secureStorage
```

#### Token 格式

```http
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### Token 载荷示例

```json
{
  "user_id": 123,
  "username": "john_doe",
  "tenant_id": 456,
  "tenant_name": "ACME Corp",
  "permissions": ["view_points", "manage_vip"],
  "exp": 1695648000,
  "iat": 1695644400
}
```

### 权限级别

| 权限级别 | 说明 | 典型用户 |
|---------|------|----------|
| **租户管理员** | 租户内全部权限，管理本租户的所有功能 | 企业管理员、组织负责人、积分管理员、VIP管理员、许可证管理员 |
| **普通用户** | 基础查看和操作权限，仅限个人数据 | 普通员工、会员、最终用户 |

---

## 🌐 API 基础信息

### 基础URL

```
开发环境: http://localhost:8000/api/v1/
测试环境: https://api-test.example.com/api/v1/
生产环境: https://api.example.com/api/v1/
```

### 通用请求头

```http
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
Accept: application/json
User-Agent: MyApp/1.0
X-Tenant-ID: {TENANT_ID}  # 可选，用于额外租户验证
```

### HTTP 方法规范

| 方法 | 用途 | 示例 |
|------|------|------|
| `GET` | 获取资源 | `GET /points/profiles/` |
| `POST` | 创建资源 | `POST /points/profiles/123/earn_points/` |
| `PUT` | 完整更新 | `PUT /vip-tags/456/` |
| `PATCH` | 部分更新 | `PATCH /profiles/123/` |
| `DELETE` | 删除资源 | `DELETE /vip-tags/456/` |

---

## 📡 API 端点总览

### 积分系统 (`/points/`)

```http
# 用户等级管理
GET    /points/user-levels/                    # 获取用户等级列表
GET    /points/user-levels/{id}/               # 获取特定等级详情

# 用户标签定义
GET    /points/user-type-tags/                 # 获取用户标签列表
GET    /points/user-type-tags/{id}/            # 获取特定标签详情

# 用户档案管理
GET    /points/profiles/                       # 获取用户档案列表
GET    /points/profiles/{id}/                  # 获取特定用户档案
POST   /points/profiles/{id}/earn_points/      # 用户获得积分
POST   /points/profiles/{id}/spend_points/     # 用户消费积分
POST   /points/profiles/{id}/adjust_points/    # 手动调整积分
GET    /points/profiles/{id}/summary/          # 获取积分摘要
GET    /points/profiles/{id}/permissions/      # 获取用户权限

# 积分记录查询
GET    /points/points-records/                 # 获取积分记录列表
GET    /points/points-records/{id}/            # 获取特定积分记录
GET    /points/points-records/summary/         # 获取积分记录统计
```

### VIP标签管理 (`/points/vip-tags/`)

```http
# VIP标签管理
GET    /points/vip-tags/                       # 获取VIP标签列表
GET    /points/vip-tags/{id}/                  # 获取特定VIP标签
POST   /points/vip-tags/grant_vip_tag/         # 授予VIP标签
POST   /points/vip-tags/{id}/renew/            # 续期VIP标签
POST   /points/vip-tags/{id}/revoke/           # 撤销VIP标签
GET    /points/vip-tags/{id}/status/           # 获取VIP状态详情
GET    /points/vip-tags/expiring_soon/         # 获取即将过期的VIP标签
```

### 统计分析 (`/points/statistics/`)

```http
# 统计数据
GET    /points/statistics/                     # 获取积分统计概览
GET    /points/statistics/points_trend/        # 获取积分趋势数据
```

### 许可证分配 (`/licenses/admin/assignments/`)

```http
# 许可证分配管理
GET    /licenses/admin/assignments/            # 获取分配列表
POST   /licenses/admin/assignments/            # 创建新分配
GET    /licenses/admin/assignments/{id}/       # 获取特定分配
POST   /licenses/admin/assignments/{id}/activate/      # 激活分配
POST   /licenses/admin/assignments/{id}/revoke/        # 撤销分配
POST   /licenses/admin/assignments/{id}/record_usage/  # 记录使用
GET    /licenses/admin/assignments/{id}/permissions/   # 获取分配权限
GET    /licenses/admin/assignments/my_assignments/     # 获取我的分配
POST   /licenses/admin/assignments/batch_assign/       # 批量分配
POST   /licenses/admin/assignments/batch_revoke/       # 批量撤销
GET    /licenses/admin/assignments/expiring_soon/      # 即将过期的分配
GET    /licenses/admin/assignments/statistics/         # 分配统计信息
```

---

## 📝 通用响应格式

### 成功响应

#### 标准列表响应

```json
{
  "count": 150,
  "next": "http://localhost:8000/api/v1/points/profiles/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "member": 123,
      "tenant": 456,
      "total_points": 1500,
      "available_points": 1200,
      "current_level": {
        "id": 3,
        "level_name": "银牌会员",
        "level_color": "#C0C0C0"
      },
      "created_at": "2025-09-25T10:30:00Z",
      "updated_at": "2025-09-25T15:45:00Z"
    }
  ]
}
```

#### 标准详情响应

```json
{
  "id": 1,
  "member": 123,
  "tenant": 456,
  "total_points": 1500,
  "available_points": 1200,
  "current_level_info": {
    "id": 3,
    "level_name": "银牌会员",
    "level_code": "SILVER",
    "level_order": 2,
    "min_points": 1000,
    "max_points": 5000,
    "level_color": "#C0C0C0",
    "level_icon": "🥈"
  },
  "member_info": {
    "id": 123,
    "username": "john_doe",
    "email": "john@example.com",
    "is_active": true
  },
  "tenant_info": {
    "id": 456,
    "name": "ACME Corp",
    "is_active": true
  },
  "points_summary": {
    "total_points": 1500,
    "earned_this_month": 300,
    "spent_this_month": 100,
    "net_change": 200
  },
  "active_tags": [
    {
      "id": 1,
      "tag_name": "VIP金牌",
      "tag_code": "VIP_GOLD",
      "tag_type": "vip",
      "expires_at": "2025-12-31T23:59:59Z",
      "status": "active"
    }
  ],
  "effective_permissions": {
    "can_view_premium_content": true,
    "can_use_priority_support": true,
    "discount_rate": 0.15
  },
  "created_at": "2025-09-25T10:30:00Z",
  "updated_at": "2025-09-25T15:45:00Z"
}
```

#### 操作成功响应

```json
{
  "success": true,
  "message": "成功获得 100 积分",
  "data": {
    "record_id": 789,
    "points_added": 100,
    "new_total_points": 1600,
    "level_upgraded": false
  },
  "timestamp": "2025-09-25T16:00:00Z"
}
```

### 错误响应

#### 标准错误格式

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "积分余额不足",
    "details": {
      "required_points": 500,
      "available_points": 200,
      "shortage": 300
    }
  },
  "timestamp": "2025-09-25T16:00:00Z"
}
```

#### 验证错误格式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求数据验证失败",
    "field_errors": {
      "points_amount": ["积分数量必须大于0"],
      "category": ["必须选择有效的积分类别"],
      "expires_at": ["过期时间不能早于当前时间"]
    }
  },
  "timestamp": "2025-09-25T16:00:00Z"
}
```

---

## 🔄 分页和过滤

### 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | integer | 1 | 页码，从1开始 |
| `page_size` | integer | 20 | 每页条数，最大100 |

### 过滤参数

#### 通用过滤器

| 参数 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `search` | string | 搜索关键词 | `?search=john` |
| `ordering` | string | 排序字段 | `?ordering=-created_at` |
| `created_at__gte` | datetime | 创建时间起始 | `?created_at__gte=2025-09-01` |
| `created_at__lte` | datetime | 创建时间结束 | `?created_at__lte=2025-09-30` |

#### 特定模块过滤器

**积分记录过滤器**:
```http
GET /points/points-records/?point_type=earn&category=login&status=active
```

**VIP标签过滤器**:
```http
GET /points/vip-tags/?status=active&expires_at__lte=2025-12-31
```

---

## ⚡ 性能优化

### 请求优化

1. **使用字段选择**: `?fields=id,name,points`
2. **批量操作**: 使用批量API减少请求次数
3. **缓存策略**: 合理使用ETag和缓存头
4. **分页控制**: 合理设置page_size，避免过大

### 响应优化

1. **压缩传输**: 启用gzip压应
2. **条件请求**: 使用If-Modified-Since
3. **并发控制**: 合理控制并发请求数量

---

## 🔒 安全考虑

### API安全措施

1. **HTTPS强制**: 生产环境必须使用HTTPS
2. **Token过期**: JWT Token定期过期和刷新
3. **权限验证**: 每个请求都进行权限检查
4. **租户隔离**: 严格的数据隔离机制
5. **速率限制**: 防止API滥用
6. **审计日志**: 完整的操作日志记录

### 最佳实践

1. **Token存储**: 使用安全的存储方式
2. **敏感数据**: 避免在URL中传递敏感信息
3. **错误信息**: 不暴露系统内部信息
4. **输入验证**: 严格的输入数据验证

---

## 📊 监控与调试

### 响应头信息

```http
X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
X-Response-Time: 125ms
X-Rate-Limit-Remaining: 299
X-Rate-Limit-Reset: 1695648000
```

### 调试工具

1. **API文档**: http://localhost:8000/api/v1/docs/
2. **健康检查**: http://localhost:8000/api/v1/health/
3. **系统状态**: http://localhost:8000/api/v1/status/

---

下一步查看: [02_积分系统API.md](./02_积分系统API.md) 了解详细的积分系统API使用方法。
