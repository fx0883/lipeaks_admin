# License Management System - Implementation Guide

## 实施概述

本文档提供基于CMS集成模式的License管理系统前端集成实施指南，包含详细的开发步骤、代码示例和最佳实践。

## 实施阶段

### 第一阶段：基础架构搭建

#### 1.1 类型定义创建
```typescript
// src/types/license.ts
export interface SoftwareProduct {
  id: number;
  name: string;
  version: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LicensePlan {
  id: number;
  product_id: number;
  name: string;
  max_activations: number;
  duration_days: number;
  features: string[];
  price: number;
  is_active: boolean;
}

export interface License {
  id: string;
  plan_id: number;
  customer_email: string;
  license_key: string;
  activation_count: number;
  status: 'active' | 'expired' | 'suspended';
  expires_at: string;
  created_at: string;
}
```

#### 1.2 API模块创建
```typescript
// src/api/modules/license.ts  
import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";

export function getProductList(params = {}) {
  return http.request<PaginationResponse<SoftwareProduct>>(
    "get",
    "/licenses/products/",
    { params }
  );
}

export function createProduct(data: ProductCreateParams) {
  return http.request<ApiResponse<SoftwareProduct>>(
    "post", 
    "/licenses/products/",
    { data }
  );
}
```

#### 1.3 Store模块创建
参考CMS store模式：
```typescript
// src/store/modules/license.ts
import { defineStore } from "pinia";
import * as licenseApi from "@/api/modules/license";

export const useLicenseStore = defineStore("license", {
  state: () => ({
    products: { data: [], total: 0, page: 1, limit: 10 },
    loading: { productList: false }
  }),
  
  actions: {
    async fetchProductList(params = {}) {
      this.loading.productList = true;
      try {
        const response = await licenseApi.getProductList(params);
        if (response.success) {
          this.products = response.data;
        }
        return response;
      } finally {
        this.loading.productList = false;
      }
    }
  }
});
```

### 第二阶段：页面组件开发

#### 2.1 产品管理页面
参考CMS文章管理页面模式：
```vue
<!-- src/views/license/products/index.vue -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useLicenseStore } from "@/store/modules/license";

const { t } = useI18n();
const licenseStore = useLicenseStore();

const tableLoading = computed(() => licenseStore.loading.productList);
const products = computed(() => licenseStore.products.data);

const searchForm = reactive({
  search: "",
  is_active: undefined,
  page: 1,
  page_size: 10
});

const fetchProducts = async () => {
  await licenseStore.fetchProductList(searchForm);
};

onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="product-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>{{ t('license.products.title') }}</span>
          <el-button type="primary" @click="handleCreate">
            {{ t('license.products.create') }}
          </el-button>
        </div>
      </template>
      
      <el-table :data="products" :loading="tableLoading">
        <el-table-column prop="name" :label="t('license.products.name')" />
        <el-table-column prop="version" :label="t('license.products.version')" />
        <el-table-column prop="is_active" :label="t('license.products.status')">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? t('common.active') : t('common.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
```

#### 2.2 公共组件开发
```vue
<!-- src/components/License/Product/ProductForm.vue -->
<script setup lang="ts">
import { ref, reactive } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const props = defineProps({
  mode: { type: String, default: "create" },
  product: { type: Object, default: null }
});

const emit = defineEmits(["submit", "cancel"]);

const formData = reactive({
  name: "",
  version: "", 
  description: "",
  is_active: true
});

const rules = {
  name: [
    { required: true, message: t('license.products.nameRequired'), trigger: 'blur' }
  ]
};
</script>
```

### 第三阶段：菜单配置集成

#### 3.1 后端菜单配置
通过管理后台添加License模块菜单：
```json
{
  "name": "License Management",
  "code": "license",
  "path": "/license",
  "component": "Layout", 
  "title": "许可证管理",
  "icon": "ep/key",
  "rank": 50,
  "show_link": true,
  "roles": ["admin", "license_manager"],
  "children": [
    {
      "name": "Products",
      "code": "license-products",
      "path": "/license/products", 
      "component": "/views/license/products/index.vue",
      "title": "产品管理",
      "roles": ["admin", "license_manager"]
    }
  ]
}
```

#### 3.2 权限配置
在用户角色中添加License相关权限：
- `license:view` - 查看权限
- `license:create` - 创建权限  
- `license:edit` - 编辑权限
- `license:delete` - 删除权限
- `license:manage` - 管理权限

### 第四阶段：国际化配置

#### 4.1 中文资源文件
```yaml
# locales/zh-CN.yaml
license:
  title: "许可证管理"
  products:
    title: "产品管理"
    name: "产品名称"
    version: "版本"
    create: "创建产品"
    nameRequired: "请输入产品名称"
  plans:
    title: "许可计划"
    duration: "有效期(天)"
  licenses: 
    title: "许可证管理"
    key: "许可证密钥"
    status: "状态"
```

#### 4.2 英文资源文件
```yaml
# locales/en.yaml
license:
  title: "License Management"
  products:
    title: "Product Management"
    name: "Product Name"
    version: "Version"
    create: "Create Product"
    nameRequired: "Please enter product name"
```

## 开发最佳实践

### 1. 代码规范
- 遵循项目现有的ESLint配置
- 使用TypeScript严格模式
- 组件命名采用PascalCase
- 文件命名采用kebab-case

### 2. 组件设计
- 单一职责原则
- 数据向下，事件向上
- 合理使用computed和watch
- 及时清理副作用

### 3. 状态管理
- 遵循Pinia最佳实践
- 合理划分store模块
- 使用TypeScript类型检查
- 避免直接修改state

### 4. API集成
- 统一使用http工具
- 合理的错误处理
- 请求参数验证
- 响应数据格式化

## 部署和测试

### 测试策略
1. 单元测试：组件和工具函数
2. 集成测试：API和Store交互  
3. E2E测试：完整业务流程

### 部署检查
1. 构建产物检查
2. 路由配置验证
3. 权限功能测试
4. 多环境兼容性

## 后续扩展

### 功能扩展点
1. 许可证使用分析
2. 客户管理集成
3. 财务系统集成
4. 自动化运维工具

### 技术扩展
1. 实时监控集成
2. 微服务架构支持
3. 移动端适配
4. PWA功能支持

通过以上实施指南，可以确保License管理系统按照既定的架构标准高质量地集成到现有项目中。
