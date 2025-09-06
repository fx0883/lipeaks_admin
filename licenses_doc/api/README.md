# Licenses API 详细使用文档

本目录包含licenses应用的完整API使用文档，涵盖所有端点的详细说明、字段定义、使用示例和最佳实践。

## 文档结构

### 📋 概览文档
- **[01_api_overview.md](./01_api_overview.md)** - API概览、认证方式和通用规范
- **[02_authentication.md](./02_authentication.md)** - 认证和权限详解

### 🔧 管理API文档
- **[10_admin_products_api.md](./10_admin_products_api.md)** - 软件产品管理API
- **[11_admin_plans_api.md](./11_admin_plans_api.md)** - 许可证方案管理API  
- **[12_admin_licenses_api.md](./12_admin_licenses_api.md)** - 许可证管理API
- **[13_admin_machines_api.md](./13_admin_machines_api.md)** - 机器绑定管理API
- **[14_admin_activations_api.md](./14_admin_activations_api.md)** - 激活记录管理API
- **[15_admin_audit_api.md](./15_admin_audit_api.md)** - 安全审计日志API
- **[16_admin_quotas_api.md](./16_admin_quotas_api.md)** - 租户配额管理API

### 🚀 客户端API文档
- **[20_client_activation_api.md](./20_client_activation_api.md)** - 许可证激活API
- **[21_client_verification_api.md](./21_client_verification_api.md)** - 许可证验证API
- **[22_client_heartbeat_api.md](./22_client_heartbeat_api.md)** - 心跳检测API
- **[23_client_info_api.md](./23_client_info_api.md)** - 许可证信息查询API
- **[24_client_status_api.md](./24_client_status_api.md)** - 服务状态API

### 📊 报告API文档
- **[30_reports_api.md](./30_reports_api.md)** - 许可证报告API
- **[31_dashboard_api.md](./31_dashboard_api.md)** - 仪表板统计API

### 💡 使用指南
- **[40_usage_examples.md](./40_usage_examples.md)** - API使用示例和代码片段
- **[41_best_practices.md](./41_best_practices.md)** - 最佳实践和安全建议
- **[42_error_handling.md](./42_error_handling.md)** - 错误处理和故障排除

## API基础信息

### Base URL
```
https://your-domain.com/api/v1/licenses/
```

### 认证方式
- **JWT Bearer Token** - 用于管理API和需要认证的操作
- **API Key** - 可选的附加认证方式（用于服务间调用）

### 响应格式
所有API返回JSON格式，遵循统一的响应结构：

```json
{
    "success": true,
    "data": {},
    "message": "操作成功",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP状态码
- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未认证或认证失败
- `403` - 权限不足
- `404` - 资源不存在
- `429` - 请求频率限制
- `500` - 服务器内部错误

## 权限系统

### 用户类型
1. **超级管理员** (`is_super_admin=true`)
   - 可访问所有租户的数据
   - 拥有系统管理权限

2. **租户管理员** (`tenant` 属性存在)
   - 只能访问自己租户的数据
   - 可管理租户内的许可证

3. **匿名用户**
   - 仅可访问公开的客户端API
   - 需要提供有效的许可证信息

### 数据隔离
- 租户管理员只能查看和操作自己租户范围内的数据
- 所有管理API都实现了基于租户的数据过滤
- 客户端API通过许可证验证确保数据安全

## 快速开始

1. 获取JWT认证token
2. 选择合适的API端点
3. 构造请求参数
4. 处理响应结果

详细使用方法请参考对应的API文档。

## 技术支持

如有问题，请参考：
- [错误处理指南](./42_error_handling.md)
- [最佳实践](./41_best_practices.md)
- 联系技术支持团队
