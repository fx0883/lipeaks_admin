# CMS文章批量删除功能使用指南

## 概述

本文档说明CMS文章批量删除功能的实现和使用方法，基于统一错误处理系统。

## API接口

### 请求格式

```bash
POST /api/v1/cms/articles/batch-delete/
Content-Type: application/json
Authorization: Bearer <token>

{
  "article_ids": [317, 318],
  "force": false
}
```

### 参数说明

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| article_ids | number[] | ✅ | 要删除的文章ID数组 |
| force | boolean | ❌ | 是否强制删除（默认false），true时忽略关联检查 |

### 响应格式

**成功响应：**
```json
{
  "success": true,
  "code": 2000,
  "message": "文章批量删除成功",
  "data": {
    "message": "文章批量删除成功",
    "requested_count": 2,
    "deleted_count": 2,
    "deleted_ids": [318, 317]
  }
}
```

**响应字段说明：**
- `requested_count`: 请求删除的文章数量
- `deleted_count`: 实际删除的文章数量  
- `deleted_ids`: 成功删除的文章ID列表

## 前端实现

### 1. API方法

文件：`src/api/modules/cms.ts`

```typescript
/**
 * 批量删除文章
 * @param article_ids 文章ID数组
 * @param force 是否强制删除
 */
export function batchDeleteArticles(article_ids: number[], force = false) {
  logger.debug("API请求: 批量删除文章", { article_ids, force });

  return http.request<ApiResponse<{
    message: string;
    requested_count: number;
    deleted_count: number;
    deleted_ids: number[];
  }>>(
    "post",
    "/cms/articles/batch-delete/",
    { data: { article_ids, force } }
  );
}
```

### 2. Store方法

文件：`src/store/modules/cms.ts`

```typescript
async batchDeleteArticles(article_ids: number[], force = false) {
  this.loading.articleDelete = true;
  try {
    const response = await cmsApi.batchDeleteArticles(article_ids, force);
    if (response.success && response.data) {
      const { deleted_ids, deleted_count, requested_count } = response.data;
      
      logger.info(`批量删除成功: 请求${requested_count}个，删除${deleted_count}个`);
      
      // 从列表中移除已删除的文章
      this.articles.data = this.articles.data.filter(
        item => !deleted_ids.includes(item.id)
      );
      
      // 更新总数
      this.articles.total = Math.max(0, this.articles.total - deleted_count);
      
      return response;
    } else {
      logger.error(response.message || "批量删除文章失败");
      return Promise.reject(response);
    }
  } catch (error) {
    logger.error("批量删除文章失败", error);
    throw error;
  } finally {
    this.loading.articleDelete = false;
  }
}
```

### 3. 组件使用

文件：`src/views/cms/article/index.vue`

```vue
<script setup>
import { useErrorHandling } from '@/composables/useErrorHandling';

const { handleError } = useErrorHandling();

const handleBatchDelete = async (force = false) => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning("请先选择要删除的文章");
    return;
  }

  const article_ids = multipleSelection.value.map(item => item.id);
  
  // 显示确认对话框
  confirmDialog.confirmAction = async () => {
    try {
      const response = await cmsStore.batchDeleteArticles(article_ids, force);
      
      if (response.success && response.data) {
        const { deleted_count, requested_count } = response.data;
        
        // 全部成功
        if (deleted_count === requested_count) {
          ElMessage.success(
            `批量删除成功 (${deleted_count}/${requested_count})`
          );
        } 
        // 部分成功
        else {
          ElMessage.warning(
            `部分删除成功：已删除 ${deleted_count}/${requested_count} 个文章`
          );
        }
        
        fetchArticles();
        multipleSelection.value = [];
      }
    } catch (error) {
      // 使用新的错误处理系统
      if (error && typeof error === 'object' && 'error_code' in error) {
        await handleError(error);
      } else {
        ElMessage.error("批量删除失败");
      }
    }
  };
  confirmDialog.visible = true;
};
</script>
```

### 4. 高级批量删除对话框组件

文件：`src/components/Cms/Article/BatchDeleteDialog.vue`

使用示例：
```vue
<template>
  <BatchDeleteDialog
    v-if="showBatchDeleteDialog"
    :articles="selectedArticles"
    @confirm="handleBatchDeleteConfirm"
    @close="showBatchDeleteDialog = false"
    @success="handleDeleteSuccess"
  />
</template>

<script setup>
import BatchDeleteDialog from '@/components/Cms/Article/BatchDeleteDialog.vue';
import { useCmsStoreHook } from '@/store/modules/cms';

const showBatchDeleteDialog = ref(false);
const selectedArticles = ref([]);
const cmsStore = useCmsStoreHook();

const handleBatchDeleteConfirm = async (article_ids, force) => {
  const response = await cmsStore.batchDeleteArticles(article_ids, force);
  return response.data; // 返回 { deleted_count, requested_count }
};

const handleDeleteSuccess = (deletedCount) => {
  console.log(`成功删除${deletedCount}篇文章`);
  // 刷新列表等操作
};
</script>
```

## 使用场景

### 场景1：基本批量删除

```vue
<el-button @click="handleBatchDelete(false)">
  批量删除
</el-button>
```

### 场景2：强制批量删除

```vue
<el-button @click="handleBatchDelete(true)">
  强制批量删除
</el-button>
```

### 场景3：使用高级对话框

```vue
<template>
  <!-- 批量删除按钮 -->
  <el-button 
    @click="showBatchDeleteDialog = true"
    :disabled="selectedArticles.length === 0"
  >
    批量删除 ({{ selectedArticles.length }})
  </el-button>

  <!-- 批量删除对话框 -->
  <BatchDeleteDialog
    v-if="showBatchDeleteDialog"
    :articles="selectedArticles"
    :on-confirm="handleBatchDeleteConfirm"
    @close="showBatchDeleteDialog = false"
    @success="handleDeleteSuccess"
  />
</template>
```

## 错误处理

### 使用新的错误处理系统

```typescript
import { useErrorHandling } from '@/composables/useErrorHandling';

const { handleError, showSuccess } = useErrorHandling();

try {
  const response = await cmsStore.batchDeleteArticles(article_ids, force);
  
  if (response.data.deleted_count === response.data.requested_count) {
    showSuccess(`成功删除${response.data.deleted_count}篇文章`);
  } else {
    showWarning(`部分删除成功：${response.data.deleted_count}/${response.data.requested_count}`);
  }
} catch (error) {
  await handleError(error);
}
```

## 可能的错误类型

| 错误码 | 说明 | 处理方式 |
|-------|------|---------|
| 4003 | 权限不足 | 显示权限错误提示 |
| 4501 | 文章不存在 | 提示文章可能已被删除 |
| 5000 | 服务器错误 | 提供重试选项 |

## 最佳实践

1. **检查选择**：删除前检查是否选中了文章
2. **二次确认**：显示确认对话框，列出将要删除的文章
3. **进度反馈**：显示删除进度条
4. **结果展示**：明确显示成功/失败的数量
5. **列表刷新**：删除后自动刷新列表
6. **错误处理**：使用统一错误处理系统

## cURL测试示例

```bash
# 基本删除
curl -X POST 'http://localhost:8000/api/v1/cms/articles/batch-delete/' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "article_ids": [317, 318],
    "force": false
  }'

# 强制删除
curl -X POST 'http://localhost:8000/api/v1/cms/articles/batch-delete/' \
  -H 'Authorization: Bearer <your_token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "article_ids": [319, 320],
    "force": true
  }'
```

## 完整示例

```vue
<template>
  <div class="article-management">
    <!-- 批量操作栏 -->
    <div class="batch-actions">
      <el-button
        type="danger"
        :disabled="multipleSelection.length === 0"
        @click="openBatchDeleteDialog"
      >
        批量删除 ({{ multipleSelection.length }})
      </el-button>
    </div>

    <!-- 文章表格 -->
    <el-table
      :data="articles"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" label="标题" />
      <!-- 其他列... -->
    </el-table>

    <!-- 批量删除对话框 -->
    <BatchDeleteDialog
      v-if="showBatchDeleteDialog"
      :articles="multipleSelection"
      :on-confirm="handleBatchDeleteConfirm"
      @close="showBatchDeleteDialog = false"
      @success="handleBatchDeleteSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useCmsStoreHook } from '@/store/modules/cms';
import { useErrorHandling } from '@/composables/useErrorHandling';
import BatchDeleteDialog from '@/components/Cms/Article/BatchDeleteDialog.vue';

const cmsStore = useCmsStoreHook();
const { handleError, showSuccess } = useErrorHandling();

const multipleSelection = ref([]);
const showBatchDeleteDialog = ref(false);

const handleSelectionChange = (selection) => {
  multipleSelection.value = selection;
};

const openBatchDeleteDialog = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning('请先选择要删除的文章');
    return;
  }
  showBatchDeleteDialog.value = true;
};

const handleBatchDeleteConfirm = async (article_ids, force) => {
  try {
    const response = await cmsStore.batchDeleteArticles(article_ids, force);
    return response.data;
  } catch (error) {
    await handleError(error);
    throw error;
  }
};

const handleBatchDeleteSuccess = (deletedCount) => {
  showSuccess(`成功删除${deletedCount}篇文章`);
  multipleSelection.value = [];
  // 刷新列表
  fetchArticles();
};
</script>
```

---

**更新时间**: 2025-01-08  
**维护者**: Lipeaks CMS Team
