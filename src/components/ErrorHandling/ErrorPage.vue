<template>
  <div class="error-page">
    <div class="error-page__container">
      <!-- 错误图标 -->
      <div class="error-page__icon">
        <component :is="iconComponent" />
      </div>

      <!-- 错误信息 -->
      <div class="error-page__content">
        <h1 class="error-page__title">{{ title }}</h1>
        <p class="error-page__message">{{ message }}</p>
        
        <!-- 额外信息 -->
        <div v-if="extraInfo" class="error-page__extra">
          <div class="error-page__extra-label">详细信息：</div>
          <div class="error-page__extra-content">{{ extraInfo }}</div>
        </div>

        <!-- 建议操作 -->
        <div v-if="suggestions.length > 0" class="error-page__suggestions">
          <div class="error-page__suggestions-title">您可以尝试：</div>
          <ul class="error-page__suggestions-list">
            <li v-for="(suggestion, index) in suggestions" :key="index">
              {{ suggestion }}
            </li>
          </ul>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="error-page__actions">
        <el-button
          v-if="showRetry"
          type="primary"
          :loading="retrying"
          @click="handleRetry"
        >
          {{ retrying ? '重试中...' : '重试' }}
        </el-button>
        
        <el-button
          v-if="showBack"
          @click="handleGoBack"
        >
          返回上一页
        </el-button>
        
        <el-button
          v-if="showHome"
          @click="handleGoHome"
        >
          返回首页
        </el-button>

        <!-- 自定义操作按钮 -->
        <el-button
          v-for="action in customActions"
          :key="action.key"
          :type="action.type || 'default'"
          @click="action.handler"
        >
          {{ action.text }}
        </el-button>
      </div>

      <!-- 联系信息 -->
      <div v-if="showContact" class="error-page__contact">
        <p class="error-page__contact-text">
          如果问题持续出现，请联系技术支持
        </p>
        <div class="error-page__contact-info">
          <span>错误代码：{{ errorCode }}</span>
          <span v-if="timestamp">时间：{{ timestamp }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  WarningFilled,
  Close,
  InfoFilled,
  QuestionFilled,
  Connection
} from '@element-plus/icons-vue';

export interface CustomAction {
  key: string;
  text: string;
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  handler: () => void | Promise<void>;
}

export interface ErrorPageProps {
  type?: '404' | '403' | '500' | 'network' | 'custom';
  title?: string;
  message?: string;
  errorCode?: string;
  extraInfo?: string;
  suggestions?: string[];
  showRetry?: boolean;
  showBack?: boolean;
  showHome?: boolean;
  showContact?: boolean;
  customActions?: CustomAction[];
  onRetry?: () => void | Promise<void>;
}

const props = withDefaults(defineProps<ErrorPageProps>(), {
  type: 'custom',
  showBack: true,
  showHome: true,
  showContact: false,
  suggestions: () => []
});

const router = useRouter();
const retrying = ref(false);

// 根据类型设置默认内容
const defaultContent = computed(() => {
  switch (props.type) {
    case '404':
      return {
        title: '页面不存在',
        message: '抱歉，您访问的页面不存在或已被删除',
        errorCode: '404',
        suggestions: [
          '检查网址是否正确',
          '返回上一页重新操作',
          '访问首页查找所需内容'
        ]
      };
    case '403':
      return {
        title: '权限不足',
        message: '您没有权限访问此页面',
        errorCode: '403',
        suggestions: [
          '联系管理员申请权限',
          '使用其他账户登录',
          '返回有权限的页面'
        ]
      };
    case '500':
      return {
        title: '服务器错误',
        message: '服务器遇到了一些问题，我们正在处理中',
        errorCode: '500',
        suggestions: [
          '稍后重新尝试',
          '刷新页面',
          '联系技术支持'
        ]
      };
    case 'network':
      return {
        title: '网络连接失败',
        message: '请检查您的网络连接',
        errorCode: 'NETWORK_ERROR',
        suggestions: [
          '检查网络连接是否正常',
          '尝试刷新页面',
          '检查防火墙设置'
        ]
      };
    default:
      return {
        title: '出现错误',
        message: '系统遇到了一些问题',
        errorCode: 'UNKNOWN_ERROR',
        suggestions: []
      };
  }
});

// 计算实际显示的内容
const title = computed(() => props.title || defaultContent.value.title);
const message = computed(() => props.message || defaultContent.value.message);
const errorCode = computed(() => props.errorCode || defaultContent.value.errorCode);
const suggestions = computed(() => 
  props.suggestions?.length > 0 ? props.suggestions : defaultContent.value.suggestions
);

// 当前时间戳
const timestamp = computed(() => new Date().toLocaleString());

// 图标组件
const iconComponent = computed(() => {
  switch (props.type) {
    case '404':
      return QuestionFilled;
    case '403':
      return WarningFilled;
    case '500':
      return Close;
    case 'network':
      return Connection;
    default:
      return InfoFilled;
  }
});

// 处理重试
const handleRetry = async () => {
  if (!props.onRetry) return;
  
  retrying.value = true;
  try {
    await props.onRetry();
  } catch (error) {
    console.error('Retry failed:', error);
  } finally {
    retrying.value = false;
  }
};

// 返回上一页
const handleGoBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push('/');
  }
};

// 返回首页
const handleGoHome = () => {
  router.push('/');
};
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f7fa;
  padding: 20px;
}

.error-page__container {
  max-width: 600px;
  width: 100%;
  text-align: center;
  background: white;
  border-radius: 12px;
  padding: 60px 40px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.error-page__icon {
  font-size: 80px;
  margin-bottom: 30px;
  
  &[data-type="404"] {
    color: #909399;
  }
  
  &[data-type="403"] {
    color: #e6a23c;
  }
  
  &[data-type="500"] {
    color: #f56c6c;
  }
  
  &[data-type="network"] {
    color: #409eff;
  }
}

.error-page__content {
  margin-bottom: 40px;
}

.error-page__title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.error-page__message {
  font-size: 18px;
  color: #606266;
  margin: 0 0 24px 0;
  line-height: 1.5;
}

.error-page__extra {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}

.error-page__extra-label {
  font-weight: 600;
  color: #495057;
  margin-bottom: 8px;
}

.error-page__extra-content {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  color: #6c757d;
  word-break: break-word;
}

.error-page__suggestions {
  text-align: left;
  background-color: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  padding: 20px;
}

.error-page__suggestions-title {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 12px;
}

.error-page__suggestions-list {
  margin: 0;
  padding-left: 20px;
  color: #374151;

  li {
    margin-bottom: 8px;
    line-height: 1.5;
  }
}

.error-page__actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 30px;
}

.error-page__contact {
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
  color: #909399;
}

.error-page__contact-text {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.error-page__contact-info {
  display: flex;
  justify-content: center;
  gap: 20px;
  font-size: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

// 响应式设计
@media (max-width: 768px) {
  .error-page {
    padding: 10px;
  }

  .error-page__container {
    padding: 40px 20px;
  }

  .error-page__icon {
    font-size: 60px;
  }

  .error-page__title {
    font-size: 24px;
  }

  .error-page__message {
    font-size: 16px;
  }

  .error-page__actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }

  .error-page__contact-info {
    flex-direction: column;
    gap: 8px;
  }
}</style>
