# 许可证创建API前端集成文档

## 📋 文档概览

本文档包提供了完整的许可证创建API (`POST /api/v1/licenses/admin/licenses/`) 前端集成指南，包括：

- 完整的API集成指南
- 详细的字段使用说明
- 多种业务场景示例
- 错误处理和最佳实践
- 实际代码实现参考

## 📁 文档结构

| 文档名称 | 内容说明 |
|---------|---------|
| `api_integration_guide.md` | 主要API集成指南，包含完整的接口调用流程 |
| `field_reference.md` | 详细的字段使用参考，每个字段的用法说明 |
| `business_scenarios.md` | 各种业务场景的具体实现示例 |
| `error_handling.md` | 错误处理指南和问题排查 |
| `code_examples.md` | JavaScript/TypeScript实际代码示例 |

## 🎯 快速开始

### 基础用法

```javascript
const response = await fetch('/api/v1/licenses/admin/licenses/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    plan: 2,  // 必需：许可证方案ID
    customer_info: {
      name: '客户姓名',     // 必需
      email: '客户邮箱'    // 必需
    }
  })
});
```

### 重要提醒

- **product字段已废弃**: 不需要传入product字段，系统会从plan自动获取
- **plan字段必需**: 必须提供有效的许可证方案ID
- **客户信息必需**: customer_info对象必须包含name和email字段
- **权限要求**: 需要管理员权限和JWT认证

## 📚 详细阅读指南

建议按以下顺序阅读文档：

1. **api_integration_guide.md** - 了解基本集成流程
2. **field_reference.md** - 掌握每个字段的具体用法
3. **business_scenarios.md** - 学习不同业务场景的实现
4. **code_examples.md** - 参考实际代码实现
5. **error_handling.md** - 学习错误处理和问题排查

## ⚡ 版本信息

- **API版本**: v1.0
- **文档版本**: 1.0.0
- **RIPER-5重构版本**: v1.0
- **创建日期**: 2024年9月27日
- **最后更新**: 2024年9月27日

## 🔗 相关资源

- **OpenAPI文档**: `/api/v1/docs/` - 在线API文档
- **后端代码**: `licenses/views/admin_views.py` - LicenseViewSet.create
- **数据模型**: `licenses/models.py` - License, LicensePlan模型
- **序列化器**: `licenses/serializers.py` - LicenseCreateSerializer

---

**开始您的许可证管理系统集成之旅！** 🚀
