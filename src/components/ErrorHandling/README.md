# 统一错误处理系统

## 概述

本系统基于 Lipeaks Backend 统一异常处理标准，实现了前端的统一错误处理方案。

## 架构特点

✅ **三层架构** - 拦截层、处理层、展示层职责清晰  
✅ **错误分级** - 根据严重程度选择不同提示方式  
✅ **用户友好** - 技术错误转换为用户可理解的消息  
✅ **智能重试** - 可恢复错误自动重试  
✅ **Token管理** - 自动Token刷新，支持并发请求  
✅ **框架无关** - 基于标准接口，易于扩展  

## 快速开始

### 1. 在组件中使用

```vue
<template>
  <FormFieldWrapper label="用户名" :error="getFieldError('username')" required>
    <el-input v-model="form.username" @input="clearFieldError('username')" />
  </FormFieldWrapper>
  
  <el-button @click="handleSubmit" :loading="errorState.isSubmitting">
    提交
  </el-button>
</template>

<script setup>
import { reactive } from 'vue';
import { useFormErrorHandling } from '@/composables/useErrorHandling';
import { FormFieldWrapper } from '@/components/ErrorHandling';

const form = reactive({
  username: '',
  email: ''
});

const { errorState, handleSubmitError, getFieldError, clearFieldError, safeSubmit } = useFormErrorHandling();

const handleSubmit = async () => {
  await safeSubmit(async () => {
    // 发送API请求
    const response = await createUser(form);
    return response;
  });
};
</script>
```

### 2. 处理列表加载

```vue
<script setup>
import { useListErrorHandling } from '@/composables/useErrorHandling';

const { loading, error, safeLoad, retry } = useListErrorHandling();

const loadData = async () => {
  await safeLoad(async () => {
    const response = await getUserList();
    return response;
  });
};

// 重试加载
const handleRetry = () => {
  retry(loadData);
};
</script>
```

### 3. 批量操作

```vue
<script setup>
import { useBatchErrorHandling } from '@/composables/useErrorHandling';

const { processing, progress, executeBatch } = useBatchErrorHandling();

const handleBatchDelete = async () => {
  await executeBatch(
    selectedItems,
    async (item) => await deleteUser(item.id),
    {
      onProgress: (current, total) => {
        console.log(`进度: ${current}/${total}`);
      },
      onPartialSuccess: (results, errors) => {
        console.log('部分成功:', { results, errors });
      }
    }
  );
};
</script>
```

## 组件文档

### ErrorToast

轻量级错误提示组件，自动消失，不阻塞用户操作。

**Props:**
- `message: string` - 提示消息
- `type?: 'success' | 'warning' | 'error' | 'info'` - 提示类型
- `duration?: number` - 显示时长（ms），0为不自动关闭
- `showClose?: boolean` - 是否显示关闭按钮
- `action?: string` - 操作按钮文本
- `onAction?: () => void` - 操作按钮回调

### ErrorModal

错误对话框组件，需要用户确认操作。

**Props:**
- `message: string` - 错误消息
- `type?: 'error' | 'warning' | 'info' | 'confirm'` - 对话框类型
- `title?: string` - 标题
- `details?: string` - 详细信息
- `guidance?: string | string[]` - 操作指引
- `primaryAction?: string` - 主要按钮文本
- `secondaryAction?: string` - 次要按钮文本

### FieldError

字段错误提示组件，显示在表单字段下方。

**Props:**
- `error?: string | string[]` - 错误消息
- `type?: 'error' | 'warning' | 'info'` - 错误类型
- `shake?: boolean` - 是否抖动动画

### FormFieldWrapper

表单字段包装组件，自动处理字段错误状态。

**Props:**
- `label?: string` - 字段标签
- `error?: string | string[]` - 字段错误
- `help?: string` - 帮助文本
- `required?: boolean` - 是否必填
- `fieldId?: string` - 字段ID

### ErrorPage

错误页面组件，用于显示全屏错误。

**Props:**
- `type?: '404' | '403' | '500' | 'network' | 'custom'` - 错误页面类型
- `title?: string` - 自定义标题
- `message?: string` - 自定义消息
- `showRetry?: boolean` - 是否显示重试按钮
- `onRetry?: () => void` - 重试回调

## API 服务

### errorService

统一错误处理服务，提供高级错误处理接口。

**方法:**
- `handleApiError(error, options)` - 处理API错误
- `handleFormError(error, options)` - 处理表单错误  
- `handleNetworkError(error, options)` - 处理网络错误
- `showSuccess(message)` - 显示成功提示
- `showWarning(message)` - 显示警告提示
- `showError(message)` - 显示错误提示
- `confirm(options)` - 显示确认对话框

### tokenManager

Token管理服务，处理认证Token的生命周期。

**方法:**
- `getAccessToken()` - 获取访问Token
- `refreshToken()` - 刷新Token
- `clearTokens()` - 清除所有Token
- `waitForTokenRefresh()` - 等待Token刷新完成

### retryManager

重试管理服务，处理请求的自动重试逻辑。

**方法:**
- `executeWithRetry(requestFn, options)` - 执行带重试的请求
- `shouldRetry(error, attempt)` - 判断是否应该重试
- `getRetryDelay(attempt)` - 获取重试延迟时间

## 错误码系统

### 错误码分类

| 范围 | 模块 | 说明 | 示例 |
|------|------|------|------|
| 4001-4099 | 认证授权 | 未登录、权限不足等 | AUTH_NOT_AUTHENTICATED |
| 4100-4199 | 租户管理 | 租户不存在、未激活等 | TENANT_NOT_FOUND |
| 4200-4299 | 许可证管理 | 许可证过期、配额超限等 | LICENSE_EXPIRED |
| 4300-4399 | 用户管理 | 用户不存在、未激活等 | USER_NOT_FOUND |
| 4400-4499 | 积分系统 | 积分不足、已过期等 | POINTS_INSUFFICIENT |
| 5000-5099 | 服务器错误 | 系统内部错误 | INTERNAL_SERVER_ERROR |

### 处理策略

**认证错误** → 自动跳转登录  
**权限错误** → 显示权限提示对话框  
**验证错误** → 显示字段级错误  
**业务错误** → 显示Toast提示  
**服务器错误** → 显示对话框+重试选项  

## 最佳实践

### 1. 表单提交

```vue
<script setup>
const { safeSubmit, getFieldError, clearFieldError } = useFormErrorHandling();

const handleSubmit = async () => {
  const result = await safeSubmit(async () => {
    return await createTenant(form);
  });
  
  if (result) {
    // 提交成功的处理
    router.push('/tenants');
  }
};
</script>
```

### 2. 列表加载

```vue
<script setup>
const { loading, error, safeLoad } = useListErrorHandling();

const loadTenants = async () => {
  const result = await safeLoad(async () => {
    return await getTenantList();
  });
  
  if (result) {
    tenants.value = result.data.results;
  }
};
</script>
```

### 3. 批量操作

```vue
<script setup>
const { processing, executeBatch } = useBatchErrorHandling();

const batchDelete = async () => {
  await executeBatch(
    selectedTenants.value,
    async (tenant) => await deleteTenant(tenant.id),
    {
      onPartialSuccess: (results, errors) => {
        // 显示详细结果
      }
    }
  );
};
</script>
```

### 4. 错误页面

```vue
<!-- 404页面 -->
<template>
  <ErrorPage type="404" />
</template>

<!-- 自定义错误页面 -->
<template>
  <ErrorPage
    type="custom"
    title="加载失败"
    message="数据加载失败，请稍后重试"
    :show-retry="true"
    :on-retry="retryLoad"
    :custom-actions="[
      { key: 'home', text: '返回首页', handler: () => router.push('/') }
    ]"
  />
</template>
```

## 配置和定制

### 1. 自定义错误消息

修改 `src/utils/http/errorCodes.ts` 中的 `USER_FRIENDLY_MESSAGES`：

```typescript
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  'TENANT_NOT_FOUND': '自定义的租户不存在消息',
  // ...
};
```

### 2. 自定义操作指引

修改 `ACTION_GUIDANCE`：

```typescript
export const ACTION_GUIDANCE: Record<string, any> = {
  'LICENSE_EXPIRED': {
    message: '许可证已过期',
    action: '立即续费',
    route: '/licenses/renew'
  }
};
```

### 3. 重试配置

```typescript
import { RetryManager } from '@/utils/http/retryManager';

const customRetryManager = new RetryManager({
  maxRetries: 5,
  retryDelay: [1000, 2000, 4000, 8000, 16000]
});
```

## 调试和监控

### 开发环境

- 所有错误都会记录到浏览器控制台
- 包含详细的错误堆栈和上下文信息
- 支持错误详情展开查看

### 生产环境

- 只显示用户友好的错误消息
- 不暴露技术细节
- 可集成错误监控系统（如Sentry）

## 升级指南

### 从旧系统迁移

1. **替换错误处理**：
   ```javascript
   // 旧方式
   catch (error) {
     ElMessage.error(error.message);
   }
   
   // 新方式
   catch (error) {
     await errorService.handleApiError(error);
   }
   ```

2. **使用组合式API**：
   ```javascript
   // 新方式
   const { handleError, showSuccess } = useErrorHandling();
   ```

3. **表单验证**：
   ```vue
   <!-- 旧方式 -->
   <el-form-item prop="username">
     <el-input v-model="form.username" />
   </el-form-item>
   
   <!-- 新方式 -->
   <FormFieldWrapper label="用户名" :error="getFieldError('username')">
     <el-input v-model="form.username" />
   </FormFieldWrapper>
   ```

## 故障排除

### 常见问题

**Q: Token刷新失败怎么办？**  
A: 检查refresh token是否有效，确保后端Token刷新接口正常工作。

**Q: 错误提示不显示？**  
A: 检查Element Plus是否正确引入，确保z-index层级正确。

**Q: 字段错误不显示？**  
A: 确保使用FormFieldWrapper组件，并正确传递error属性。

**Q: 重试机制不工作？**  
A: 检查错误类型是否在RETRYABLE_ERRORS中，确认重试配置。
