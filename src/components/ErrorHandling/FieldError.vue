<template>
  <Transition
    name="field-error"
    enter-active-class="field-error-enter-active"
    leave-active-class="field-error-leave-active"
  >
    <div
      v-if="visible && errorMessage"
      :class="[
        'field-error',
        `field-error--${type}`,
        { 'field-error--shake': shake }
      ]"
    >
      <div class="field-error__icon">
        <component :is="iconComponent" />
      </div>
      <div class="field-error__message">{{ errorMessage }}</div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import {
  Close,
  WarningFilled,
  InfoFilled
} from '@element-plus/icons-vue';

export interface FieldErrorProps {
  error?: string | string[];
  type?: 'error' | 'warning' | 'info';
  shake?: boolean;
}

const props = withDefaults(defineProps<FieldErrorProps>(), {
  type: 'error',
  shake: false
});

const visible = ref(false);

const errorMessage = computed(() => {
  if (!props.error) return '';
  
  if (Array.isArray(props.error)) {
    return props.error.filter(Boolean)[0] || '';
  }
  
  return props.error;
});

const iconComponent = computed(() => {
  switch (props.type) {
    case 'error':
      return Close;
    case 'warning':
      return WarningFilled;
    case 'info':
      return InfoFilled;
    default:
      return Close;
  }
});

// 监听error变化，控制显示/隐藏
watch(
  () => errorMessage.value,
  async (newError, oldError) => {
    if (newError && !oldError) {
      // 有错误消息，显示
      visible.value = true;
    } else if (!newError && oldError) {
      // 错误消息清空，隐藏
      visible.value = false;
    } else if (newError && oldError && newError !== oldError) {
      // 错误消息变化，先隐藏再显示
      visible.value = false;
      await nextTick();
      visible.value = true;
    }
  },
  { immediate: true }
);

// 初始化时如果有错误，显示
if (errorMessage.value) {
  visible.value = true;
}
</script>

<style scoped lang="scss">
.field-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;

  &--error {
    color: #f56c6c;
    
    .field-error__icon {
      color: #f56c6c;
    }
  }

  &--warning {
    color: #e6a23c;
    
    .field-error__icon {
      color: #e6a23c;
    }
  }

  &--info {
    color: #409eff;
    
    .field-error__icon {
      color: #409eff;
    }
  }

  &--shake {
    animation: shake 0.5s ease-in-out;
  }

  &__icon {
    font-size: 14px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  &__message {
    flex: 1;
    min-width: 0;
    word-break: break-word;
  }
}

// 进入动画
.field-error-enter-active {
  transition: all 0.3s ease-out;
}

.field-error-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.field-error-enter-to {
  opacity: 1;
  transform: translateY(0);
}

// 离开动画
.field-error-leave-active {
  transition: all 0.2s ease-in;
}

.field-error-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.field-error-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// 抖动动画
@keyframes shake {
  0%, 100% {
    transform: translateX(0);
  }
  
  25% {
    transform: translateX(-4px);
  }
  
  75% {
    transform: translateX(4px);
  }
}</style>
