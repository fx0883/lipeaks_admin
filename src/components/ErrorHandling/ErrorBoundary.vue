<template>
  <div class="error-boundary">
    <!-- 正常渲染子组件 -->
    <slot v-if="!hasError" />
    
    <!-- 错误状态UI -->
    <div v-else class="error-boundary__error">
      <div class="error-boundary__container">
        <!-- 错误图标 -->
        <div class="error-boundary__icon">
          <Close />
        </div>

        <!-- 错误信息 -->
        <div class="error-boundary__content">
          <h3 class="error-boundary__title">组件加载失败</h3>
          <p class="error-boundary__message">{{ errorMessage }}</p>
          
          <!-- 开发环境显示详细错误 -->
          <div v-if="isDev && errorDetails" class="error-boundary__details">
            <el-collapse>
              <el-collapse-item title="错误详情" name="details">
                <pre>{{ errorDetails }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="error-boundary__actions">
          <el-button type="primary" @click="handleRetry">
            重试
          </el-button>
          <el-button @click="handleReportError">
            报告问题
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured, nextTick } from 'vue';
import { Close } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import logger from '@/utils/logger';

export interface ErrorBoundaryProps {
  fallback?: boolean; // 是否显示fallback UI
  onError?: (error: Error, instance: any, info: string) => void;
}

const props = withDefaults(defineProps<ErrorBoundaryProps>(), {
  fallback: true
});

const hasError = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');
const isDev = import.meta.env.DEV;

// 捕获子组件错误
onErrorCaptured((error: Error, instance: any, info: string) => {
  logger.error('ErrorBoundary捕获到错误:', { error, instance, info });

  hasError.value = true;
  errorMessage.value = error.message || '未知错误';
  
  if (isDev) {
    errorDetails.value = `${error.stack}\n\n组件信息: ${info}`;
  }

  // 调用外部错误处理回调
  props.onError?.(error, instance, info);

  // 上报错误到监控系统（生产环境）
  if (!isDev) {
    reportErrorToMonitoring({
      error: error.message,
      stack: error.stack,
      componentInfo: info,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  // 阻止错误继续向上传播
  return false;
});

/**
 * 重试渲染组件
 */
const handleRetry = async () => {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  
  // 等待下一个tick确保状态更新
  await nextTick();
  
  ElMessage.info('正在重试...');
};

/**
 * 报告错误
 */
const handleReportError = () => {
  // 这里可以打开错误报告对话框或跳转到反馈页面
  const errorInfo = {
    message: errorMessage.value,
    details: errorDetails.value,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  // 复制错误信息到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(JSON.stringify(errorInfo, null, 2))
      .then(() => {
        ElMessage.success('错误信息已复制到剪贴板');
      })
      .catch(() => {
        ElMessage.warning('复制失败，请手动复制下方错误信息');
      });
  }

  console.error('错误报告信息:', errorInfo);
};

/**
 * 上报错误到监控系统
 */
const reportErrorToMonitoring = (errorData: any) => {
  // 这里集成错误监控服务，如Sentry
  try {
    // 示例：上报到自定义错误监控接口
    fetch('/api/v1/monitoring/frontend-errors/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(errorData)
    }).catch(err => {
      console.error('上报错误失败:', err);
    });
  } catch (error) {
    console.error('错误上报异常:', error);
  }
};
</script>

<style scoped lang="scss">
.error-boundary {
  width: 100%;
  min-height: 100px;
}

.error-boundary__error {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
}

.error-boundary__container {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.error-boundary__icon {
  font-size: 48px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.error-boundary__title {
  font-size: 20px;
  color: #303133;
  margin-bottom: 8px;
  font-weight: 600;
}

.error-boundary__message {
  font-size: 16px;
  color: #606266;
  margin-bottom: 20px;
  line-height: 1.5;
}

.error-boundary__details {
  margin-bottom: 20px;
  text-align: left;

  :deep(.el-collapse-item__content) {
    padding: 12px;
    background-color: #f8f9fa;
  }

  pre {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 12px;
    color: #666;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
  }
}

.error-boundary__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
}

// 响应式设计
@media (max-width: 768px) {
  .error-boundary__container {
    padding: 0 10px;
  }

  .error-boundary__icon {
    font-size: 36px;
  }

  .error-boundary__title {
    font-size: 18px;
  }

  .error-boundary__message {
    font-size: 14px;
  }

  .error-boundary__actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}</style>
