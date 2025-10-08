<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    :width="width"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    :before-close="handleClose"
    class="error-modal"
  >
    <!-- 错误图标和内容 -->
    <div class="error-modal__content">
      <div class="error-modal__icon">
        <component :is="iconComponent" />
      </div>
      
      <div class="error-modal__body">
        <div class="error-modal__message">{{ message }}</div>
        
        <!-- 详细信息 -->
        <div v-if="details" class="error-modal__details">
          <el-collapse>
            <el-collapse-item title="详细信息" name="details">
              <pre class="error-modal__details-content">{{ details }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>

        <!-- 操作指引 -->
        <div v-if="guidance" class="error-modal__guidance">
          <div class="error-modal__guidance-title">建议操作：</div>
          <ul class="error-modal__guidance-list">
            <li v-for="(guide, index) in guidanceList" :key="index">
              {{ guide }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 操作按钮 -->
    <template #footer>
      <div class="error-modal__footer">
        <!-- 次要操作按钮 -->
        <el-button
          v-if="secondaryAction"
          @click="handleSecondaryAction"
        >
          {{ secondaryAction }}
        </el-button>
        
        <!-- 主要操作按钮 -->
        <el-button
          :type="primaryButtonType"
          @click="handlePrimaryAction"
        >
          {{ primaryAction }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  WarningFilled,
  Close,
  InfoFilled,
  QuestionFilled
} from '@element-plus/icons-vue';

export interface ErrorModalProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'confirm';
  title?: string;
  details?: string;
  guidance?: string | string[];
  primaryAction?: string;
  secondaryAction?: string;
  width?: string;
  onPrimary?: () => void | Promise<void>;
  onSecondary?: () => void;
  onClose?: () => void;
}

const props = withDefaults(defineProps<ErrorModalProps>(), {
  type: 'error',
  primaryAction: '确定',
  width: '500px'
});

const visible = ref(true);

const dialogTitle = computed(() => {
  if (props.title) return props.title;
  
  switch (props.type) {
    case 'error':
      return '错误';
    case 'warning':
      return '警告';
    case 'info':
      return '提示';
    case 'confirm':
      return '确认';
    default:
      return '提示';
  }
});

const iconComponent = computed(() => {
  switch (props.type) {
    case 'error':
      return Close;
    case 'warning':
      return WarningFilled;
    case 'info':
      return InfoFilled;
    case 'confirm':
      return QuestionFilled;
    default:
      return InfoFilled;
  }
});

const primaryButtonType = computed(() => {
  switch (props.type) {
    case 'error':
      return 'danger';
    case 'warning':
      return 'warning';
    case 'confirm':
      return 'primary';
    default:
      return 'primary';
  }
});

const guidanceList = computed(() => {
  if (!props.guidance) return [];
  return Array.isArray(props.guidance) ? props.guidance : [props.guidance];
});

const handleClose = (done: () => void) => {
  visible.value = false;
  props.onClose?.();
  done();
};

const handlePrimaryAction = async () => {
  try {
    await props.onPrimary?.();
  } catch (error) {
    console.error('Primary action failed:', error);
  } finally {
    visible.value = false;
  }
};

const handleSecondaryAction = () => {
  props.onSecondary?.();
  visible.value = false;
};
</script>

<style scoped lang="scss">
.error-modal {
  :deep(.el-dialog__header) {
    padding: 20px 20px 10px;
  }

  :deep(.el-dialog__body) {
    padding: 10px 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 10px 20px 20px;
  }
}

.error-modal__content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.error-modal__icon {
  font-size: 24px;
  flex-shrink: 0;
  margin-top: 2px;

  .error-modal[data-type="error"] & {
    color: #f56c6c;
  }

  .error-modal[data-type="warning"] & {
    color: #e6a23c;
  }

  .error-modal[data-type="info"] & {
    color: #409eff;
  }

  .error-modal[data-type="confirm"] & {
    color: #909399;
  }
}

.error-modal__body {
  flex: 1;
  min-width: 0;
}

.error-modal__message {
  font-size: 16px;
  line-height: 1.5;
  color: #303133;
  margin-bottom: 16px;
  word-break: break-word;
}

.error-modal__details {
  margin-bottom: 16px;

  :deep(.el-collapse) {
    border: none;
  }

  :deep(.el-collapse-item__header) {
    background-color: #f5f7fa;
    border: none;
    font-size: 14px;
    color: #606266;
  }

  :deep(.el-collapse-item__content) {
    padding: 12px 16px;
    background-color: #fafafa;
    border: 1px solid #ebeef5;
    border-radius: 4px;
  }
}

.error-modal__details-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #666;
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.error-modal__guidance {
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 12px;
}

.error-modal__guidance-title {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 8px;
  font-size: 14px;
}

.error-modal__guidance-list {
  margin: 0;
  padding-left: 20px;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;

  li {
    margin-bottom: 4px;
  }
}

.error-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .error-modal {
    :deep(.el-dialog) {
      width: 90% !important;
      margin: 5vh auto;
    }
  }

  .error-modal__content {
    flex-direction: column;
    gap: 12px;
  }

  .error-modal__icon {
    align-self: center;
  }

  .error-modal__message {
    font-size: 15px;
  }

  .error-modal__footer {
    flex-direction: column-reverse;

    .el-button {
      width: 100%;
    }
  }
}</style>
