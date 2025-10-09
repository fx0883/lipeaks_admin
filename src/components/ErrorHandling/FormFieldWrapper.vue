<template>
  <div class="form-field-wrapper">
    <!-- 字段标签 -->
    <label 
      v-if="label" 
      :for="fieldId"
      :class="[
        'form-field-wrapper__label',
        { 'form-field-wrapper__label--required': required }
      ]"
    >
      {{ label }}
    </label>

    <!-- 字段内容插槽 -->
    <div 
      :class="[
        'form-field-wrapper__field',
        { 'form-field-wrapper__field--error': hasError }
      ]"
    >
      <slot 
        :field-id="fieldId"
        :has-error="hasError"
        :error-message="errorMessage"
      />
    </div>

    <!-- 字段错误提示 -->
    <FieldError 
      :error="error" 
      :type="errorType"
      :shake="shake"
    />

    <!-- 帮助文本 -->
    <div v-if="help && !hasError" class="form-field-wrapper__help">
      {{ help }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, provide } from 'vue';
import { generateId } from '@/utils/id';
import FieldError from './FieldError.vue';

export interface FormFieldWrapperProps {
  label?: string;
  error?: string | string[];
  help?: string;
  required?: boolean;
  fieldId?: string;
  errorType?: 'error' | 'warning' | 'info';
  shake?: boolean;
}

const props = withDefaults(defineProps<FormFieldWrapperProps>(), {
  errorType: 'error',
  shake: false
});

// 生成唯一ID
const fieldId = computed(() => props.fieldId || generateId('field'));

// 错误状态
const hasError = computed(() => {
  if (Array.isArray(props.error)) {
    return props.error.some(err => Boolean(err));
  }
  return Boolean(props.error);
});

const errorMessage = computed(() => {
  if (Array.isArray(props.error)) {
    return props.error.filter(Boolean)[0] || '';
  }
  return props.error || '';
});

// 提供给子组件的上下文
provide('fieldContext', {
  fieldId: fieldId.value,
  hasError: hasError.value,
  errorMessage: errorMessage.value
});

// 可能从表单组件注入的上下文
const formContext = inject('formContext', null) as any;

// 向表单注册字段错误状态
if (formContext && typeof formContext.registerField === 'function') {
  formContext.registerField(fieldId.value, {
    hasError: hasError.value,
    errorMessage: errorMessage.value
  });
}
</script>

<style scoped lang="scss">
.form-field-wrapper {
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
}

.form-field-wrapper__label {
  display: inline-block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  line-height: 1.4;

  &--required {
    position: relative;
    
    &::after {
      content: '*';
      color: #f56c6c;
      margin-left: 4px;
    }
  }
}

.form-field-wrapper__field {
  position: relative;

  // 为子组件提供错误状态样式
  :deep(.el-input__wrapper) {
    transition: border-color 0.2s ease;
  }

  &--error {
    :deep(.el-input__wrapper) {
      border-color: #f56c6c !important;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }

    :deep(.el-input__inner) {
      color: #f56c6c;
    }

    :deep(.el-textarea__inner) {
      border-color: #f56c6c !important;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
      color: #f56c6c;
    }

    :deep(.el-select .el-input__wrapper) {
      border-color: #f56c6c !important;
      box-shadow: 0 0 0 1px #f56c6c inset !important;
    }

    :deep(.el-radio-group) {
      .el-radio__input.is-checked .el-radio__inner {
        border-color: #f56c6c;
        background-color: #f56c6c;
      }
    }

    :deep(.el-checkbox-group) {
      .el-checkbox__input.is-checked .el-checkbox__inner {
        border-color: #f56c6c;
        background-color: #f56c6c;
      }
    }
  }
}

.form-field-wrapper__help {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

// 响应式设计
@media (max-width: 768px) {
  .form-field-wrapper {
    margin-bottom: 16px;
  }

  .form-field-wrapper__label {
    font-size: 15px;
    margin-bottom: 6px;
  }

  .form-field-wrapper__help {
    font-size: 13px;
  }
}</style>
