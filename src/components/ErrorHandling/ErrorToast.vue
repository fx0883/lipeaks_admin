<template>
  <Teleport to="body">
    <div
      v-if="visible"
      :class="[
        'error-toast',
        `error-toast--${type}`,
        { 'error-toast--show': show }
      ]"
      @click="close"
    >
      <div class="error-toast__icon">
        <component :is="iconComponent" />
      </div>
      <div class="error-toast__content">
        <div class="error-toast__message">{{ message }}</div>
        <div v-if="action" class="error-toast__action">
          <button
            class="error-toast__action-button"
            @click.stop="handleAction"
          >
            {{ action }}
          </button>
        </div>
      </div>
      <button
        v-if="showClose"
        class="error-toast__close"
        @click.stop="close"
      >
        ×
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue';
import {
  Check,
  WarningFilled,
  Close,
  InfoFilled
} from '@element-plus/icons-vue';

export interface ErrorToastProps {
  message: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  showClose?: boolean;
  action?: string;
  onAction?: () => void;
  onClose?: () => void;
}

const props = withDefaults(defineProps<ErrorToastProps>(), {
  type: 'info',
  duration: 3000,
  showClose: false
});

const visible = ref(false);
const show = ref(false);

const iconComponent = computed(() => {
  switch (props.type) {
    case 'success':
      return Check;
    case 'warning':
      return WarningFilled;
    case 'error':
      return Close;
    case 'info':
    default:
      return InfoFilled;
  }
});

let timer: NodeJS.Timeout | null = null;

const close = () => {
  show.value = false;
  setTimeout(() => {
    visible.value = false;
    props.onClose?.();
  }, 200);
  
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
};

const handleAction = () => {
  props.onAction?.();
  close();
};

onMounted(async () => {
  visible.value = true;
  await nextTick();
  show.value = true;

  // 自动关闭
  if (props.duration > 0) {
    timer = setTimeout(() => {
      close();
    }, props.duration);
  }
});
</script>

<style scoped lang="scss">
.error-toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 3000;
  min-width: 300px;
  max-width: 500px;
  opacity: 0;
  transition: all 0.3s ease-out;
  cursor: pointer;

  &--show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }

  &--success {
    border-left: 4px solid #67c23a;
    .error-toast__icon {
      color: #67c23a;
    }
  }

  &--warning {
    border-left: 4px solid #e6a23c;
    .error-toast__icon {
      color: #e6a23c;
    }
  }

  &--error {
    border-left: 4px solid #f56c6c;
    .error-toast__icon {
      color: #f56c6c;
    }
  }

  &--info {
    border-left: 4px solid #409eff;
    .error-toast__icon {
      color: #409eff;
    }
  }

  &__icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__message {
    font-size: 14px;
    color: #303133;
    line-height: 1.4;
    word-break: break-word;
  }

  &__action {
    margin-top: 8px;
  }

  &__action-button {
    background: none;
    border: none;
    color: #409eff;
    font-size: 12px;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;

    &:hover {
      color: #66b1ff;
    }
  }

  &__close {
    background: none;
    border: none;
    font-size: 20px;
    color: #909399;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      color: #606266;
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    left: 20px;
    right: 20px;
    transform: translateY(-100%);
    min-width: auto;
    max-width: none;

    &--show {
      transform: translateY(0);
    }
  }
}</style>
