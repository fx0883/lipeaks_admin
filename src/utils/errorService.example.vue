<template>
  <div class="error-example-page">
    <el-card class="example-card">
      <template #header>
        <span>错误处理系统示例</span>
      </template>

      <!-- 表单示例 -->
      <el-divider content-position="left">表单提交错误处理</el-divider>
      <el-form ref="formRef" :model="form" label-width="120px">
        <FormFieldWrapper 
          label="用户名" 
          :error="getFieldError('username')" 
          required
        >
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            @input="clearFieldError('username')"
          />
        </FormFieldWrapper>

        <FormFieldWrapper 
          label="邮箱" 
          :error="getFieldError('email')"
          required
        >
          <el-input 
            v-model="form.email" 
            placeholder="请输入邮箱"
            @input="clearFieldError('email')"
          />
        </FormFieldWrapper>

        <FormFieldWrapper 
          label="密码" 
          :error="getFieldError('password')"
          required
        >
          <el-input 
            v-model="form.password" 
            type="password"
            placeholder="请输入密码"
            @input="clearFieldError('password')"
          />
        </FormFieldWrapper>

        <el-form-item>
          <el-button 
            type="primary" 
            @click="handleFormSubmit"
            :loading="errorState.isSubmitting"
          >
            {{ errorState.isSubmitting ? '提交中...' : '提交表单' }}
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 各种错误类型示例 -->
      <el-divider content-position="left">错误类型示例</el-divider>
      <div class="error-buttons">
        <el-button @click="testValidationError">验证错误</el-button>
        <el-button @click="testAuthError">认证错误</el-button>
        <el-button @click="testPermissionError">权限错误</el-button>
        <el-button @click="testBusinessError">业务错误</el-button>
        <el-button @click="testServerError">服务器错误</el-button>
        <el-button @click="testNetworkError">网络错误</el-button>
      </div>

      <!-- Toast提示示例 -->
      <el-divider content-position="left">提示类型示例</el-divider>
      <div class="toast-buttons">
        <el-button type="success" @click="showSuccess('操作成功！')">成功提示</el-button>
        <el-button type="warning" @click="showWarning('这是警告消息')">警告提示</el-button>
        <el-button type="danger" @click="showError('这是错误消息')">错误提示</el-button>
        <el-button type="info" @click="showInfoExample">信息提示</el-button>
      </div>

      <!-- 批量操作示例 -->
      <el-divider content-position="left">批量操作示例</el-divider>
      <div class="batch-example">
        <div class="batch-controls">
          <el-checkbox-group v-model="selectedItems">
            <el-checkbox
              v-for="item in mockItems"
              :key="item.id"
              :label="item.id"
            >
              {{ item.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        
        <div class="batch-actions">
          <el-button 
            @click="handleBatchOperation"
            :loading="processing"
            :disabled="selectedItems.length === 0"
          >
            批量删除 ({{ selectedItems.length }})
          </el-button>
          
          <div v-if="processing" class="batch-progress">
            <el-progress :percentage="progress" />
          </div>
        </div>
      </div>

      <!-- 错误状态展示 -->
      <el-divider content-position="left">当前错误状态</el-divider>
      <div class="error-status">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="表单错误数">
            {{ errorState.errorCount }}
          </el-descriptions-item>
          <el-descriptions-item label="有字段错误">
            {{ errorState.hasError ? '是' : '否' }}
          </el-descriptions-item>
          <el-descriptions-item label="正在提交">
            {{ errorState.isSubmitting ? '是' : '否' }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="errorState.hasError" class="field-errors">
          <h4>字段错误详情：</h4>
          <pre>{{ JSON.stringify(errorState.fieldErrors, null, 2) }}</pre>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useErrorHandling, useFormErrorHandling, useBatchErrorHandling } from '@/composables/useErrorHandling';
import { FormFieldWrapper } from '@/components/ErrorHandling';
import { showInfoToast } from '@/components/ErrorHandling';

// 表单数据
const form = reactive({
  username: '',
  email: '',
  password: ''
});

const formRef = ref();

// 错误处理Hook
const { showSuccess, showWarning, showError } = useErrorHandling();
const { 
  errorState, 
  handleSubmitError, 
  getFieldError, 
  clearFieldError, 
  clearAllErrors,
  safeSubmit 
} = useFormErrorHandling(formRef);

// 批量操作Hook
const { processing, progress, executeBatch } = useBatchErrorHandling();

// 模拟数据
const mockItems = ref([
  { id: 1, name: '项目 1' },
  { id: 2, name: '项目 2' },
  { id: 3, name: '项目 3' },
  { id: 4, name: '项目 4' },
  { id: 5, name: '项目 5' }
]);

const selectedItems = ref<number[]>([]);

// 表单提交
const handleFormSubmit = async () => {
  await safeSubmit(async () => {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 随机返回成功或验证错误
    if (Math.random() > 0.5) {
      throw {
        success: false,
        code: 4000,
        message: '数据验证失败',
        data: {
          username: ['用户名不能为空'],
          email: ['邮箱格式不正确'],
          password: ['密码长度至少8位']
        },
        error_code: 'VALIDATION_ERROR'
      };
    }
    
    return { success: true };
  });
};

// 重置表单
const resetForm = () => {
  Object.keys(form).forEach(key => {
    form[key] = '';
  });
  clearAllErrors();
};

// 测试各种错误类型
const testValidationError = async () => {
  const error = {
    success: false,
    code: 4000,
    message: '数据验证失败',
    data: {
      name: ['该字段不能为空'],
      email: ['请输入有效的邮箱地址']
    },
    error_code: 'VALIDATION_ERROR'
  };
  
  await handleSubmitError(error);
};

const testAuthError = () => {
  const error = {
    success: false,
    code: 4001,
    message: '认证失败，请登录',
    data: null,
    error_code: 'AUTH_NOT_AUTHENTICATED'
  };
  
  // 这个会触发跳转登录，实际使用时会跳转
  console.log('模拟认证错误:', error);
  showError('模拟认证错误 (实际会跳转登录)');
};

const testPermissionError = () => {
  const error = {
    success: false,
    code: 4003,
    message: '您没有执行该操作的权限',
    data: null,
    error_code: 'AUTH_PERMISSION_DENIED'
  };
  
  // 实际会显示权限错误对话框
  console.log('模拟权限错误:', error);
  showWarning('模拟权限错误 (实际会显示对话框)');
};

const testBusinessError = () => {
  const error = {
    success: false,
    code: 4201,
    message: '许可证已于 2024-01-15 过期',
    data: null,
    error_code: 'LICENSE_EXPIRED'
  };
  
  showError('许可证已过期，续费后可继续使用');
};

const testServerError = () => {
  const error = {
    success: false,
    code: 5000,
    message: '服务器内部错误',
    data: null,
    error_code: 'INTERNAL_SERVER_ERROR'
  };
  
  showError('服务器暂时不可用，请稍后重试');
};

const testNetworkError = () => {
  showError('网络连接失败，请检查您的网络设置');
};

const showInfoExample = () => {
  showInfoToast('这是一条信息提示');
};

// 批量操作
const handleBatchOperation = async () => {
  if (selectedItems.value.length === 0) {
    showWarning('请先选择要操作的项目');
    return;
  }

  await executeBatch(
    selectedItems.value.map(id => mockItems.value.find(item => item.id === id)!),
    async (item) => {
      // 模拟删除操作
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 50%概率失败
      if (Math.random() > 0.5) {
        throw new Error(`删除${item.name}失败`);
      }
      
      return item;
    },
    {
      onProgress: (current, total) => {
        console.log(`进度: ${current}/${total}`);
      },
      onPartialSuccess: (results, errors) => {
        console.log('部分成功结果:', { results, errors });
      }
    }
  );
  
  selectedItems.value = [];
};
</script>

<style scoped lang="scss">
.error-example-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.example-card {
  margin-bottom: 20px;
}

.error-buttons,
.toast-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.batch-example {
  .batch-controls {
    margin-bottom: 16px;
    padding: 16px;
    background-color: #f5f7fa;
    border-radius: 6px;
  }

  .batch-actions {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .batch-progress {
    flex: 1;
    max-width: 200px;
  }
}

.error-status {
  background-color: #fafafa;
  padding: 16px;
  border-radius: 6px;

  .field-errors {
    margin-top: 16px;
    
    h4 {
      margin-bottom: 8px;
      color: #f56c6c;
    }
    
    pre {
      background-color: #fff;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      padding: 12px;
      font-size: 12px;
      color: #606266;
      white-space: pre-wrap;
      max-height: 200px;
      overflow-y: auto;
    }
  }
}

@media (max-width: 768px) {
  .error-example-page {
    padding: 10px;
  }

  .error-buttons,
  .toast-buttons {
    flex-direction: column;
    
    .el-button {
      width: 100%;
    }
  }

  .batch-actions {
    flex-direction: column;
    align-items: stretch;
    
    .batch-progress {
      max-width: none;
    }
  }
}</style>
