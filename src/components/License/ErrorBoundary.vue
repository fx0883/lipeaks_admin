<template>
  <div class="error-boundary">
    <div v-if="hasError" class="error-display">
      <div class="error-content">
        <el-result
          :icon="errorIcon"
          :title="errorTitle"
          :sub-title="errorMessage"
        >
          <template #extra>
            <div class="error-actions">
              <el-button @click="retry" type="primary">
                <el-icon><Refresh /></el-icon>
                {{ t("common.button.retry") }}
              </el-button>
              <el-button @click="goHome" type="default">
                <el-icon><HomeFilled /></el-icon>
                {{ t("common.button.goHome") }}
              </el-button>
              <el-button v-if="showDetails" @click="toggleDetails" type="info">
                <el-icon><InfoFilled /></el-icon>
                {{ showErrorDetails ? t("common.button.hideDetails") : t("common.button.showDetails") }}
              </el-button>
            </div>
          </template>
        </el-result>
        
        <!-- Error Details -->
        <el-collapse v-if="showErrorDetails" class="error-details">
          <el-collapse-item :title="t('common.error.technicalDetails')" name="details">
            <div class="error-info">
              <div class="error-field">
                <label>{{ t("common.error.errorType") }}:</label>
                <code>{{ errorType }}</code>
              </div>
              <div class="error-field">
                <label>{{ t("common.error.timestamp") }}:</label>
                <span>{{ errorTimestamp }}</span>
              </div>
              <div class="error-field" v-if="errorCode">
                <label>{{ t("common.error.errorCode") }}:</label>
                <code>{{ errorCode }}</code>
              </div>
              <div class="error-field" v-if="errorStack">
                <label>{{ t("common.error.stackTrace") }}:</label>
                <pre class="error-stack">{{ errorStack }}</pre>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
    
    <!-- Loading State -->
    <div v-else-if="isRetrying" class="retry-loading">
      <LoadingSpinner
        size="large"
        :text="t('common.message.retrying')"
        overlay
      />
    </div>
    
    <!-- Normal Content -->
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onErrorCaptured, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElResult, ElButton, ElCollapse, ElCollapseItem, ElIcon } from "element-plus";
import { Refresh, HomeFilled, InfoFilled } from "@element-plus/icons-vue";
import LoadingSpinner from "./LoadingSpinner.vue";
import { errorHandler } from "@/utils/errorHandler";

export interface ErrorBoundaryProps {
  fallback?: string;
  showRetry?: boolean;
  showHome?: boolean;
  showDetails?: boolean;
  maxRetries?: number;
}

const props = withDefaults(defineProps<ErrorBoundaryProps>(), {
  showRetry: true,
  showHome: true,
  showDetails: true,
  maxRetries: 3
});

const emit = defineEmits<{
  error: [error: Error];
  retry: [];
}>();

const { t } = useI18n();
const router = useRouter();

// Error state
const hasError = ref(false);
const isRetrying = ref(false);
const retryCount = ref(0);
const showErrorDetails = ref(false);

// Error information
const errorType = ref("");
const errorMessage = ref("");
const errorCode = ref("");
const errorStack = ref("");
const errorTimestamp = ref("");

// Computed properties
const errorIcon = computed(() => {
  if (errorType.value === "NetworkError") return "warning";
  if (errorType.value === "PermissionError") return "error";
  if (errorCode.value?.startsWith("4")) return "warning";
  if (errorCode.value?.startsWith("5")) return "error";
  return "error";
});

const errorTitle = computed(() => {
  if (errorType.value === "NetworkError") return t("common.error.networkTitle");
  if (errorType.value === "PermissionError") return t("common.error.permissionTitle");
  if (errorCode.value === "404") return t("common.error.notFoundTitle");
  if (errorCode.value?.startsWith("5")) return t("common.error.serverTitle");
  return t("common.error.generalTitle");
});

// Error capture
onErrorCaptured((error: Error, instance, info) => {
  handleError(error, info);
  return false; // Prevent the error from propagating further
});

// Handle uncaught errors
onMounted(() => {
  window.addEventListener("error", (event) => {
    handleError(event.error || new Error(event.message));
  });

  window.addEventListener("unhandledrejection", (event) => {
    handleError(new Error(event.reason));
  });
});

// Handle error
const handleError = (error: Error, info?: string) => {
  console.error("[ErrorBoundary]", error, info);
  
  hasError.value = true;
  errorType.value = error.constructor.name;
  errorMessage.value = error.message || t("common.error.unknown");
  errorCode.value = (error as any).code || (error as any).status || "";
  errorStack.value = error.stack || "";
  errorTimestamp.value = new Date().toISOString();

  // Log error for debugging
  errorHandler.handleApiError(error, {
    showMessage: false,
    logError: true
  });

  emit("error", error);
};

// Retry logic
const retry = async () => {
  if (retryCount.value >= props.maxRetries) {
    errorHandler.handleApiError(new Error(t("common.error.maxRetriesExceeded")), {
      showMessage: true
    });
    return;
  }

  isRetrying.value = true;
  retryCount.value++;

  try {
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset error state
    hasError.value = false;
    errorType.value = "";
    errorMessage.value = "";
    errorCode.value = "";
    errorStack.value = "";
    
    emit("retry");
  } catch (error) {
    handleError(error as Error);
  } finally {
    isRetrying.value = false;
  }
};

// Navigation
const goHome = () => {
  router.push("/");
};

// Toggle details
const toggleDetails = () => {
  showErrorDetails.value = !showErrorDetails.value;
};

// Expose methods for external use
defineExpose({
  handleError,
  retry,
  hasError: computed(() => hasError.value)
});
</script>

<style scoped>
.error-boundary {
  position: relative;
  min-height: 200px;
}

.error-display {
  padding: 20px;
  text-align: center;
}

.error-content {
  max-width: 600px;
  margin: 0 auto;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.error-details {
  margin-top: 20px;
  text-align: left;
}

.error-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-field label {
  font-weight: 600;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.error-field code {
  background: var(--el-fill-color-light);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: var(--el-color-danger);
}

.error-stack {
  background: var(--el-fill-color-darker);
  padding: 12px;
  border-radius: 6px;
  font-family: "Courier New", monospace;
  font-size: 11px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.retry-loading {
  position: relative;
  min-height: 200px;
}

/* Dark theme support */
.dark .error-field code {
  background: var(--el-fill-color-darker);
  color: var(--el-color-danger-light-3);
}

.dark .error-stack {
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-darker);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 200px;
  }
  
  .error-content {
    padding: 0 10px;
  }
}
</style>
