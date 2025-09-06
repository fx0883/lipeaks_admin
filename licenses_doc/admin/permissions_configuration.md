# License Management System - 权限配置指南

## 概述

License管理系统采用基于角色的访问控制（RBAC）模型，通过细粒度的权限控制确保系统安全性和数据隔离。本文档详细说明了权限配置方式、角色定义和最佳实践。

## 权限模型

### 权限层级结构

```
License Management
├── Products (产品管理)
│   ├── product:view (查看产品)
│   ├── product:create (创建产品)
│   ├── product:edit (编辑产品)
│   ├── product:delete (删除产品)
│   └── product:export (导出产品)
├── Plans (计划管理)
│   ├── plan:view (查看计划)
│   ├── plan:create (创建计划)
│   ├── plan:edit (编辑计划)
│   ├── plan:delete (删除计划)
│   └── plan:export (导出计划)
├── Licenses (许可证管理)
│   ├── license:view (查看许可证)
│   ├── license:create (创建许可证)
│   ├── license:edit (编辑许可证)
│   ├── license:delete (删除许可证)
│   ├── license:revoke (撤销许可证)
│   ├── license:download (下载许可证)
│   ├── license:export (导出许可证)
│   └── license:batch_operations (批量操作)
├── Machines (机器管理)
│   ├── machine:view (查看机器)
│   ├── machine:unbind (解绑机器)
│   ├── machine:delete (删除机器)
│   ├── machine:export (导出机器)
│   └── machine:batch_operations (批量操作)
├── Activations (激活记录管理)
│   ├── activation:view (查看激活记录)
│   ├── activation:revoke (撤销激活)
│   ├── activation:delete (删除激活记录)
│   ├── activation:export (导出激活记录)
│   └── activation:batch_operations (批量操作)
├── Audit Logs (审计日志)
│   ├── audit:view (查看审计日志)
│   └── audit:export (导出审计日志)
└── Dashboard (仪表盘)
    ├── dashboard:view (查看仪表盘)
    └── dashboard:stats (查看统计数据)
```

## 预定义角色

### 1. 超级管理员 (Super Admin)
**权限范围**: 所有权限
```json
{
  "role": "super_admin",
  "permissions": [
    "product:*",
    "plan:*",
    "license:*",
    "machine:*",
    "activation:*",
    "audit:*",
    "dashboard:*"
  ]
}
```

### 2. License管理员 (License Manager)
**权限范围**: License相关的完整管理权限，包括产品、计划、许可证管理
```json
{
  "role": "license_manager",
  "permissions": [
    "product:view",
    "product:create",
    "product:edit",
    "product:export",
    "plan:view",
    "plan:create",
    "plan:edit",
    "plan:export",
    "license:view",
    "license:create",
    "license:edit",
    "license:revoke",
    "license:download",
    "license:export",
    "license:batch_operations",
    "machine:view",
    "machine:unbind",
    "machine:export",
    "machine:batch_operations",
    "activation:view",
    "activation:revoke",
    "activation:export",
    "activation:batch_operations",
    "audit:view",
    "dashboard:view",
    "dashboard:stats"
  ]
}
```

### 3. License操作员 (License Operator)
**权限范围**: 日常License操作权限，不包括删除和高级管理功能
```json
{
  "role": "license_operator",
  "permissions": [
    "product:view",
    "plan:view",
    "license:view",
    "license:create",
    "license:edit",
    "license:revoke",
    "license:download",
    "license:export",
    "machine:view",
    "machine:unbind",
    "activation:view",
    "activation:revoke",
    "dashboard:view"
  ]
}
```

### 4. License查看者 (License Viewer)
**权限范围**: 只读权限，用于审计和监控
```json
{
  "role": "license_viewer",
  "permissions": [
    "product:view",
    "plan:view",
    "license:view",
    "license:export",
    "machine:view",
    "machine:export",
    "activation:view",
    "activation:export",
    "audit:view",
    "audit:export",
    "dashboard:view",
    "dashboard:stats"
  ]
}
```

### 5. 客户支持 (Customer Support)
**权限范围**: 客户支持相关权限，包括查看和基本操作
```json
{
  "role": "customer_support",
  "permissions": [
    "product:view",
    "plan:view",
    "license:view",
    "license:download",
    "machine:view",
    "activation:view",
    "dashboard:view"
  ]
}
```

## 权限配置实现

### 1. 后端权限控制

#### 中间件配置
```php
// routes/api.php
Route::middleware(['auth:api', 'permission:product:view'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
});

Route::middleware(['auth:api', 'permission:product:create'])->group(function () {
    Route::post('/products', [ProductController::class, 'store']);
});

Route::middleware(['auth:api', 'permission:product:edit'])->group(function () {
    Route::put('/products/{id}', [ProductController::class, 'update']);
});

Route::middleware(['auth:api', 'permission:product:delete'])->group(function () {
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
});
```

#### 控制器中的权限检查
```php
class ProductController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('product:view');
        // 业务逻辑
    }

    public function store(Request $request)
    {
        $this->authorize('product:create');
        // 业务逻辑
    }

    public function update(Request $request, $id)
    {
        $this->authorize('product:edit');
        // 业务逻辑
    }

    public function destroy($id)
    {
        $this->authorize('product:delete');
        // 业务逻辑
    }
}
```

### 2. 前端权限控制

#### 权限检查工具函数
```typescript
// src/utils/permissions.ts
export const hasPermission = (permission: string): boolean => {
  const userPermissions = useUserStore().permissions || [];
  return userPermissions.includes(permission) || userPermissions.includes('*');
};

export const hasAnyPermission = (permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(permission));
};

export const hasAllPermissions = (permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(permission));
};

// 权限指令
export const permissionDirective = {
  mounted(el: HTMLElement, binding: any) {
    const { value } = binding;
    if (!hasPermission(value)) {
      el.style.display = 'none';
    }
  },
  updated(el: HTMLElement, binding: any) {
    const { value } = binding;
    if (!hasPermission(value)) {
      el.style.display = 'none';
    } else {
      el.style.display = '';
    }
  }
};
```

#### 在组件中使用权限检查
```vue
<template>
  <div>
    <!-- 使用v-if进行权限控制 -->
    <el-button 
      v-if="hasPerms('product:create')"
      @click="createProduct"
      type="primary"
    >
      创建产品
    </el-button>

    <!-- 使用权限指令 -->
    <el-button 
      v-permission="'product:edit'"
      @click="editProduct"
      type="warning"
    >
      编辑产品
    </el-button>

    <!-- 批量操作权限控制 -->
    <BatchActions
      v-if="hasPerms('product:batch_operations')"
      :selected-items="selectedProducts"
      @batch-delete="handleBatchDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { hasPerms } from '@/utils/permissions';

const createProduct = () => {
  // 创建产品逻辑
};

const editProduct = () => {
  // 编辑产品逻辑
};
</script>
```

#### 路由权限控制
```typescript
// src/router/guards.ts
export const permissionGuard = (to: RouteLocationNormalized) => {
  const requiredPermission = to.meta?.permission as string;
  
  if (requiredPermission && !hasPermission(requiredPermission)) {
    ElMessage.error('您没有访问此页面的权限');
    return '/403';
  }
  
  return true;
};

// 路由配置
{
  path: '/license/products',
  component: () => import('@/views/license/products/index.vue'),
  meta: {
    title: 'license.menu.products',
    permission: 'product:view'
  }
}
```

## 权限配置最佳实践

### 1. 最小权限原则
- 用户只应获得完成其工作所需的最小权限集
- 定期审查和调整用户权限
- 避免给予过度的权限

### 2. 角色分离
- 开发、测试、生产环境使用不同的权限配置
- 管理员和普通用户权限严格分离
- 临时权限应设置过期时间

### 3. 审计和监控
- 记录所有权限变更操作
- 监控敏感操作的执行
- 定期进行权限审计

### 4. 权限继承
```json
{
  "role_hierarchy": {
    "super_admin": ["license_manager"],
    "license_manager": ["license_operator"],
    "license_operator": ["license_viewer"]
  }
}
```

### 5. 动态权限检查
```typescript
// 基于业务规则的权限检查
export const canEditLicense = (license: License, user: User): boolean => {
  // 基础权限检查
  if (!hasPermission('license:edit')) {
    return false;
  }
  
  // 业务规则检查
  if (license.status === 'revoked') {
    return false;
  }
  
  if (license.created_by !== user.id && !hasPermission('license:edit_all')) {
    return false;
  }
  
  return true;
};
```

## 错误处理

### 权限拒绝处理
```typescript
export const handlePermissionDenied = (permission: string) => {
  ElMessage.error(`权限不足：缺少 ${permission} 权限`);
  
  // 记录权限拒绝日志
  console.warn(`Permission denied: ${permission}`, {
    user: useUserStore().user,
    timestamp: new Date().toISOString(),
    page: window.location.pathname
  });
};
```

## 测试权限配置

### 1. 单元测试
```typescript
describe('Permission Utils', () => {
  test('should check permission correctly', () => {
    const userPermissions = ['product:view', 'product:create'];
    expect(hasPermission('product:view')).toBe(true);
    expect(hasPermission('product:delete')).toBe(false);
  });

  test('should check multiple permissions', () => {
    expect(hasAnyPermission(['product:edit', 'product:view'])).toBe(true);
    expect(hasAllPermissions(['product:view', 'product:create'])).toBe(true);
  });
});
```

### 2. 集成测试
```typescript
describe('License Management Permissions', () => {
  test('license manager can access all license features', async () => {
    // 模拟license manager登录
    await loginAs('license_manager');
    
    // 测试各个功能的访问权限
    expect(await canAccessPage('/license/products')).toBe(true);
    expect(await canPerformAction('product:create')).toBe(true);
  });

  test('license viewer cannot delete products', async () => {
    await loginAs('license_viewer');
    expect(await canPerformAction('product:delete')).toBe(false);
  });
});
```

## 部署配置

### 环境变量配置
```env
# 权限配置
PERMISSION_CACHE_TTL=3600
PERMISSION_CHECK_STRICT=true
ROLE_HIERARCHY_ENABLED=true

# 审计配置
AUDIT_PERMISSION_CHANGES=true
AUDIT_LOG_RETENTION_DAYS=90
```

### 数据库迁移
```sql
-- 权限表
CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 角色权限关联表
CREATE TABLE role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id BIGINT UNSIGNED,
    permission_id BIGINT UNSIGNED,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (role_id, permission_id)
);

-- 用户角色关联表
CREATE TABLE user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED,
    role_id BIGINT UNSIGNED,
    assigned_by BIGINT UNSIGNED,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role_id)
);
```

## 故障排除

### 常见问题

1. **权限检查失败**
   - 检查用户是否正确登录
   - 验证权限名称拼写
   - 确认角色权限分配

2. **页面访问被拒绝**
   - 检查路由权限配置
   - 验证用户角色
   - 查看权限缓存是否过期

3. **批量操作权限问题**
   - 确认用户有批量操作权限
   - 检查选中项目的权限
   - 验证业务规则限制

### 调试工具
```typescript
// 权限调试工具
export const debugPermissions = () => {
  const user = useUserStore().user;
  const permissions = useUserStore().permissions;
  
  console.group('Permission Debug Info');
  console.log('User:', user);
  console.log('Permissions:', permissions);
  console.log('Current Route:', useRoute().path);
  console.groupEnd();
};

// 在开发环境中使用
if (process.env.NODE_ENV === 'development') {
  window.debugPermissions = debugPermissions;
}
```

## 总结

License管理系统的权限配置采用了细粒度、基于角色的访问控制模型，确保了系统的安全性和可维护性。通过合理的角色设计、完善的权限检查机制和充分的测试覆盖，能够满足不同场景下的权限管理需求。

在实际部署时，应根据具体的业务需求调整权限配置，并建立完善的权限审计和监控机制，确保系统的长期安全运行。
