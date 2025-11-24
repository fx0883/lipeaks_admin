# 应用管理 API 文档目录

**文档版本**: 1.0  
**最后更新**: 2025-11-24  
**API基础URL**: `http://localhost:8000/api/v1`

---

## 📚 文档列表

### 1. [应用管理API文档](./01_应用管理API文档.md)
原始API文档，包含基础信息和请求响应格式。

### 2. [API测试报告](./02_API测试报告.md)
完整的API测试结果报告，包括：
- 所有API的测试状态
- 成功和失败的详细信息
- DELETE API的500错误问题说明
- 测试通过率统计

### 3. [API详细文档 - 获取列表和创建](./03_API详细文档-获取列表和创建.md)
详细说明以下API：
- **GET** `/api/v1/applications/` - 获取应用列表
- **POST** `/api/v1/applications/` - 创建应用

包含完整的：
- 请求参数说明
- cURL命令示例
- JavaScript/Vue代码示例
- 响应格式说明
- 错误处理
- 实际测试结果

### 4. [API详细文档 - 详情和更新](./04_API详细文档-详情和更新.md)
详细说明以下API：
- **GET** `/api/v1/applications/{id}/` - 获取应用详情
- **PATCH** `/api/v1/applications/{id}/` - 部分更新应用
- **PUT** `/api/v1/applications/{id}/` - 完整更新应用
- **DELETE** `/api/v1/applications/{id}/` - 删除应用（当前有bug）

包含：
- PATCH vs PUT 对比说明
- 完整的代码示例
- 字段验证规则
- 实际测试示例

### 5. [API详细文档 - 统计和文章](./05_API详细文档-统计和文章.md)
详细说明以下API：
- **GET** `/api/v1/applications/{id}/statistics/` - 获取应用统计
- **GET** `/api/v1/applications/{id}/articles/` - 获取关联文章

包含：
- 统计数据说明
- Vue组件示例
- 使用场景示例
- 性能优化建议
- 数据关联说明

---

## 🚀 快速开始

### 认证

所有API请求都需要携带Bearer Token：

```bash
curl -X GET 'http://localhost:8000/api/v1/applications/' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

### 获取Token

登录后从响应中获取access_token：

```bash
curl -X POST 'http://localhost:8000/api/v1/auth/login/' \
  -H 'Content-Type: application/json' \
  -d '{
    "username": "admin_cms",
    "password": "admin_main"
  }'
```

**测试Token** (有效期至2025-12-29):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJ1c2VybmFtZSI6ImFkbWluX2NtcyIsImV4cCI6MTc2NDQ5MjA3MSwibW9kZWxfdHlwZSI6InVzZXIiLCJpc19hZG1pbiI6dHJ1ZSwiaXNfc3VwZXJfYWRtaW4iOmZhbHNlLCJpc19zdGFmZiI6dHJ1ZX0.sG3xbmD1mdvGgvj_i_lKfDfSZ_6cRnakqPHWy5BSObM
```

---

## 📊 API概览

| 序号 | 端点 | 方法 | 状态 | 说明 |
|------|------|------|------|------|
| 1 | `/applications/` | GET | ✅ 正常 | 获取应用列表 |
| 2 | `/applications/` | POST | ✅ 正常 | 创建应用 |
| 3 | `/applications/{id}/` | GET | ✅ 正常 | 获取应用详情 |
| 4 | `/applications/{id}/` | PATCH | ✅ 正常 | 部分更新应用 |
| 5 | `/applications/{id}/` | PUT | ✅ 正常 | 完整更新应用 |
| 6 | `/applications/{id}/` | DELETE | ❌ **500错误** | 删除应用 |
| 7 | `/applications/{id}/statistics/` | GET | ✅ 正常 | 获取应用统计 |
| 8 | `/applications/{id}/articles/` | GET | ✅ 正常 | 获取关联文章 |

**通过率**: 7/8 (87.5%)

---

## 🔑 权限说明

### 租户管理员 (Tenant Admin)
- ✅ 查看应用列表
- ✅ 查看应用详情
- ✅ 创建应用
- ✅ 更新应用
- ✅ 删除应用（当前有bug）
- ✅ 查看统计信息
- ✅ 查看关联文章

### 普通成员 (Member)
- ✅ 查看应用列表
- ✅ 查看应用详情
- ❌ 创建应用
- ❌ 更新应用
- ❌ 删除应用
- ✅ 查看统计信息
- ✅ 查看关联文章

---

## 🎯 常用示例

### 示例1：创建应用

```bash
curl -X POST 'http://localhost:8000/api/v1/applications/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "name": "我的应用",
    "code": "my-app-001",
    "description": "应用描述",
    "current_version": "1.0.0",
    "status": "development"
  }'
```

### 示例2：获取列表（带搜索）

```bash
curl -X GET 'http://localhost:8000/api/v1/applications/?search=测试&status=active' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

### 示例3：更新版本号

```bash
curl -X PATCH 'http://localhost:8000/api/v1/applications/1/' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -d '{
    "current_version": "2.0.0"
  }'
```

### 示例4：获取统计信息

```bash
curl -X GET 'http://localhost:8000/api/v1/applications/1/statistics/' \
  -H 'Authorization: Bearer YOUR_TOKEN'
```

---

## ⚠️ 已知问题

### DELETE API 500错误

**问题**: 删除应用时返回500内部服务器错误

**影响**: 用户无法通过API删除应用

**状态**: 已报告给后端团队

**临时解决方案**:
1. 前端暂时隐藏/禁用删除按钮
2. 通过数据库管理工具手动删除
3. 联系后端管理员处理

**详细信息**: 见 [02_API测试报告.md](./02_API测试报告.md)

---

## 📝 字段说明

### 应用状态枚举

| 值 | 中文 | 说明 |
|----|------|------|
| `development` | 开发中 | 应用正在开发阶段 |
| `testing` | 测试中 | 应用正在测试阶段 |
| `active` | 运行中 | 应用正式运行中 |
| `maintenance` | 维护中 | 应用正在维护 |
| `deprecated` | 已弃用 | 应用已废弃但仍可用 |
| `archived` | 已归档 | 应用已归档 |

### 必填字段

创建应用时必须提供：
- `name` - 应用名称
- `code` - 应用代码（租户内唯一）

### 唯一性约束

- `code` - 在同一租户内必须唯一

---

## 🔧 开发环境

- **后端服务器**: http://localhost:8000
- **前端服务器**: http://localhost:8850
- **测试用户**: admin_cms (租户管理员)
- **测试租户**: 从Token自动获取

---

## 💡 最佳实践

### 1. 使用PATCH而非PUT

部分更新时优先使用PATCH，更高效：

```javascript
// ✅ 推荐：只更新需要的字段
await axios.patch(`/api/v1/applications/${id}/`, {
  current_version: '2.0.0'
});

// ❌ 不推荐：必须提供所有字段
await axios.put(`/api/v1/applications/${id}/`, {
  name: '...',
  code: '...',
  current_version: '2.0.0'
  // ... 其他所有字段
});
```

### 2. 使用分页

获取列表时使用分页避免性能问题：

```javascript
// ✅ 推荐：使用分页
axios.get('/api/v1/applications/?page=1&page_size=20');

// ❌ 不推荐：获取所有数据
axios.get('/api/v1/applications/?page_size=9999');
```

### 3. 缓存统计数据

统计数据变化频率低，可以缓存5-10分钟。

### 4. 错误处理

始终处理API错误：

```javascript
try {
  const response = await axios.post('/api/v1/applications/', data);
  ElMessage.success('创建成功');
} catch (error) {
  if (error.response?.data?.data) {
    // 显示字段验证错误
    Object.entries(error.response.data.data).forEach(([field, messages]) => {
      ElMessage.error(`${field}: ${messages.join(', ')}`);
    });
  } else {
    ElMessage.error('操作失败');
  }
}
```

---

## 📞 联系方式

如有问题或建议，请联系：
- 后端API问题：后端开发团队
- 前端集成问题：前端开发团队
- 文档问题：提交Issue

---

## 📅 更新日志

### 2025-11-24
- ✅ 完成所有API测试
- ✅ 创建详细API文档
- ✅ 提供代码示例
- ⚠️ 发现DELETE API的500错误
- 📝 记录所有测试结果

---

**祝开发愉快！🎉**
