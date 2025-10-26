# API 修复说明

## 修复日期
2025-10-24

## 修复内容

### 1. 类型定义更新

**文件**: `src/types/feedback.ts`

**修复内容**:
- 更新了 `SoftwareCategoryListResponse` 类型，支持直接数组或分页格式
- 更新了 `SoftwareListResponse` 类型，支持直接数组或分页格式  
- 更新了 `SoftwareVersionListResponse` 类型，支持直接数组或分页格式
- 更新了 `Software` 接口，添加 `category_id` 和 `metadata` 字段支持

**原因**: 
- API 可能返回多种数据格式（直接数组、分页对象、双层嵌套）
- 软件详情中 category 可能是 number 或对象

### 2. 软件分类API响应处理

**文件**: `src/composables/useSoftware.ts`

**函数**: `fetchCategories()`

**修复内容**:
```typescript
// 新增处理双层嵌套数据格式
else if (response.data.data && Array.isArray(response.data.data)) {
  // 处理双层嵌套数据格式 {data: {data: [...]}}
  categories.value = response.data.data;
}
```

**处理顺序**:
1. 首先检查 `response.data.results`（分页格式）
2. 然后检查 `response.data.data`（双层嵌套）
3. 最后检查 `response.data`（直接数组）

### 3. 软件产品列表API响应处理

**文件**: `src/composables/useSoftware.ts`

**函数**: `fetchSoftwareList()`

**修复内容**:
```typescript
// 新增处理双层嵌套数据格式
else if (response.data.data && Array.isArray(response.data.data)) {
  // 处理双层嵌套数据格式 {data: {data: [...]}}
  softwareList.value = response.data.data;
  pagination.total = response.data.data.length;
  pagination.page = params.page || 1;
  pagination.pageSize = params.page_size || 20;
}
```

### 4. 软件版本API响应处理

**文件**: `src/composables/useSoftware.ts`

**函数**: `fetchVersions()`

**修复内容**:
```typescript
// 新增处理双层嵌套数据格式
else if (response.data.data && Array.isArray(response.data.data)) {
  // 处理双层嵌套数据格式 {data: {data: [...]}}
  versions.value = response.data.data;
}
```

### 5. 软件详情页面修复

**文件**: `src/views/feedback/software/products/detail.vue`

**修复内容**:
- 添加 `getCategoryName()` 函数，正确处理 category 字段
- category 可能是对象 `{id, name, code}` 或 category_name 字符串

```typescript
const getCategoryName = (soft: Software) => {
  if (typeof soft.category === 'object' && soft.category !== null) {
    return soft.category.name;
  }
  return soft.category_name || "-";
};
```

### 6. 软件编辑页面修复

**文件**: `src/views/feedback/software/products/edit.vue`

**修复内容**:
- 在加载详情时正确提取 `category_id`
- 处理 category 字段可能是 number 或对象的情况

```typescript
// 处理category字段，可能是number或对象
if (typeof software.category === 'object' && software.category !== null) {
  formData.category_id = software.category.id;
} else {
  formData.category_id = software.category_id || software.category || 0;
}
```

### 7. 编辑路由和页面添加

**文件**: 
- `temp1022_2/feedback_menu_config.json`
- `src/views/feedback/software/products/edit.vue`（新建）

**修复内容**:
- 添加编辑路由配置 `/feedback/software/products/edit/:id`
- 创建编辑页面组件，支持加载和更新软件信息

## API 响应格式支持

现在系统支持以下三种API响应格式：

### 格式1: 直接数组
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": [...]
}
```

### 格式2: 分页格式
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "results": [...],
    "pagination": {
      "count": 100,
      "current_page": 1,
      "page_size": 20
    }
  }
}
```

### 格式3: 双层嵌套
```json
{
  "success": true,
  "code": 2000,
  "message": "操作成功",
  "data": {
    "success": true,
    "data": [...]
  }
}
```

## 测试建议

### 1. 软件分类测试
- 访问 `/feedback/software/categories`
- 验证分类列表正确显示
- 测试创建、编辑、删除功能

### 2. 软件产品测试
- 访问 `/feedback/software/products`
- 验证产品列表正确显示
- 测试创建、编辑、查看详情功能
- 验证分类筛选功能

### 3. 软件版本测试
- 访问 `/feedback/software/versions`
- 验证版本列表正确显示
- 测试为软件添加版本功能

### 4. 反馈提交测试
- 访问 `/feedback/feedbacks/submit`
- 测试级联选择器（分类 → 软件 → 版本）
- 验证所有字段正确显示和选择

## 兼容性说明

- ✅ 向后兼容旧的API格式
- ✅ 支持最新的API文档格式
- ✅ 自动处理多种数据结构
- ✅ TypeScript 类型安全

## 注意事项

1. **category 字段处理**: 在软件详情中，category 可能返回对象，需要使用辅助函数提取名称
2. **双层嵌套**: 某些API可能返回双层嵌套的data结构，已添加兼容处理
3. **分页信息**: 如果API返回分页信息，会自动提取并设置到pagination对象
4. **错误日志**: 使用logger记录数据格式异常，便于调试

## 相关文档

- [01_软件分类API使用文档.md](01_软件分类API使用文档.md)
- [02_软件产品API使用文档.md](02_软件产品API使用文档.md)
- [03_软件版本API使用文档.md](03_软件版本API使用文档.md)
- [README.md](README.md)

