<template>
  <div class="system-health-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t("feedback.systemHealth") }}</h2>
      <el-button :icon="Refresh" @click="handleRefresh">
        {{ t("buttons.refresh") }}
      </el-button>
    </div>

    <!-- 整体健康状态 -->
    <el-card class="overall-status-card" shadow="never" v-loading="loading">
      <div class="overall-status" :class="health?.status">
        <div class="status-icon">
          <IconifyIconOffline
            :icon="getStatusIcon(health?.status)"
            :style="{ fontSize: '64px', color: getStatusColor(health?.status) }"
          />
        </div>
        <div class="status-info">
          <div class="status-label">
            {{ t("feedback.health.overallStatus") }}
          </div>
          <div class="status-value">{{ getStatusLabel(health?.status) }}</div>
        </div>
      </div>
    </el-card>

    <!-- 组件状态详情 -->
    <div class="components-grid">
      <!-- Redis -->
      <el-card class="component-card" shadow="hover">
        <template #header>
          <div class="component-header">
            <span>Redis</span>
            <el-tag
              :type="health?.components.redis.available ? 'success' : 'danger'"
            >
              {{
                health?.components.redis.available
                  ? t("common.normal")
                  : t("common.unavailable")
              }}
            </el-tag>
          </div>
        </template>
        <div class="component-content">
          <div v-if="health?.components.redis.available" class="component-info">
            <div class="info-item">
              <span class="info-label">{{ t("feedback.health.mode") }}:</span>
              <span class="info-value">{{ health.components.redis.mode }}</span>
            </div>
            <div class="info-item">
              <span class="info-label"
                >{{ t("feedback.health.version") }}:</span
              >
              <span class="info-value">{{
                health.components.redis.version
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">{{ t("feedback.health.memory") }}:</span>
              <span class="info-value">{{
                health.components.redis.used_memory_human
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label"
                >{{ t("feedback.health.clients") }}:</span
              >
              <span class="info-value">{{
                health.components.redis.connected_clients
              }}</span>
            </div>
          </div>
          <div v-else class="component-error">
            <el-alert
              :title="health?.components.redis.error || t('common.unavailable')"
              type="error"
              :closable="false"
            />
          </div>
        </div>
      </el-card>

      <!-- Database -->
      <el-card class="component-card" shadow="hover">
        <template #header>
          <div class="component-header">
            <span>{{ t("feedback.health.database") }}</span>
            <el-tag
              :type="
                health?.components.database.available ? 'success' : 'danger'
              "
            >
              {{
                health?.components.database.available
                  ? t("common.normal")
                  : t("common.unavailable")
              }}
            </el-tag>
          </div>
        </template>
        <div class="component-content">
          <div class="component-info">
            <div class="info-item">
              <span class="info-label">{{ t("feedback.health.type") }}:</span>
              <span class="info-value">{{
                health?.components.database.type
              }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Celery -->
      <el-card class="component-card" shadow="hover">
        <template #header>
          <div class="component-header">
            <span>Celery ({{ t("feedback.health.asyncTasks") }})</span>
            <el-tag
              :type="health?.components.celery.available ? 'success' : 'danger'"
            >
              {{
                health?.components.celery.available
                  ? t("common.normal")
                  : t("common.unavailable")
              }}
            </el-tag>
          </div>
        </template>
        <div class="component-content">
          <div class="component-info">
            <div class="info-item">
              <span class="info-label">{{ t("feedback.health.mode") }}:</span>
              <span class="info-value">{{
                health?.components.celery.mode
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label"
                >{{ t("feedback.health.fallback") }}:</span
              >
              <el-tag
                :type="
                  health?.components.celery.fallback_enabled
                    ? 'success'
                    : 'info'
                "
                size="small"
              >
                {{
                  health?.components.celery.fallback_enabled
                    ? t("common.enabled")
                    : t("common.disabled")
                }}
              </el-tag>
            </div>
            <div v-if="health?.components.celery.broker" class="info-item">
              <span class="info-label">Broker:</span>
              <span class="info-value">{{
                health.components.celery.broker
              }}</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- Email -->
      <el-card class="component-card" shadow="hover">
        <template #header>
          <div class="component-header">
            <span>{{ t("feedback.health.email") }}</span>
            <el-tag
              :type="health?.components.email.available ? 'success' : 'danger'"
            >
              {{
                health?.components.email.available
                  ? t("common.normal")
                  : t("common.unavailable")
              }}
            </el-tag>
          </div>
        </template>
        <div class="component-content">
          <div class="component-info">
            <div class="info-item">
              <span class="info-label">{{ t("feedback.health.mode") }}:</span>
              <span class="info-value">{{
                health?.components.email.mode
              }}</span>
            </div>
            <div v-if="health?.components.email.backend" class="info-item">
              <span class="info-label">Backend:</span>
              <span class="info-value">{{
                health.components.email.backend
              }}</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 系统建议 -->
    <el-card
      v-if="health?.recommendations && health.recommendations.length > 0"
      class="recommendations-card"
      shadow="never"
    >
      <template #header>
        <span>{{ t("feedback.health.recommendations") }}</span>
      </template>
      <el-alert
        v-for="(rec, index) in health.recommendations"
        :key="index"
        :title="rec"
        type="warning"
        :closable="false"
        style="margin-bottom: 12px"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { getSystemHealth } from "@/api/modules/feedback";
import type { SystemHealth } from "@/types/feedback";
import { Refresh } from "@element-plus/icons-vue";

const { t } = useI18n();

// 健康状态
const health = ref<SystemHealth | null>(null);
const loading = ref(false);

// 自动刷新定时器
let refreshTimer: number | null = null;

/**
 * 获取系统健康状态
 */
const fetchHealth = async () => {
  loading.value = true;

  try {
    const response = await getSystemHealth();

    if (response.success && response.data) {
      health.value = response.data;
    }
  } catch (error) {
    console.error("获取系统健康状态失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 手动刷新
 */
const handleRefresh = () => {
  fetchHealth();
};

/**
 * 获取状态图标
 */
const getStatusIcon = (status?: string) => {
  const iconMap: Record<string, string> = {
    healthy: "ep:circle-check",
    degraded: "ep:warning",
    unhealthy: "ep:circle-close"
  };
  return iconMap[status || ""] || "ep:warning";
};

/**
 * 获取状态颜色
 */
const getStatusColor = (status?: string) => {
  const colorMap: Record<string, string> = {
    healthy: "#67c23a",
    degraded: "#e6a23c",
    unhealthy: "#f56c6c"
  };
  return colorMap[status || ""] || "#909399";
};

/**
 * 获取状态标签文本
 */
const getStatusLabel = (status?: string) => {
  const labelMap: Record<string, string> = {
    healthy: t("feedback.health.healthy"),
    degraded: t("feedback.health.degraded"),
    unhealthy: t("feedback.health.unhealthy")
  };
  return labelMap[status || ""] || t("common.unknown");
};

// 页面加载
onMounted(() => {
  fetchHealth();

  // 每30秒自动刷新
  refreshTimer = window.setInterval(() => {
    fetchHealth();
  }, 30000);
});

// 页面卸载
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style lang="scss" scoped>
.system-health-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .overall-status-card {
    margin-bottom: 24px;

    .overall-status {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 20px;

      .status-icon {
        width: 80px;
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: #f5f7fa;
      }

      .status-info {
        flex: 1;

        .status-label {
          font-size: 16px;
          color: #909399;
          margin-bottom: 8px;
        }

        .status-value {
          font-size: 32px;
          font-weight: 700;
        }
      }

      &.healthy .status-value {
        color: #67c23a;
      }

      &.degraded .status-value {
        color: #e6a23c;
      }

      &.unhealthy .status-value {
        color: #f56c6c;
      }
    }
  }

  .components-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .component-card {
      .component-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .component-content {
        .component-info {
          .info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #ebeef5;

            &:last-child {
              border-bottom: none;
            }

            .info-label {
              color: #909399;
              font-weight: 500;
            }

            .info-value {
              color: #303133;
            }
          }
        }

        .component-error {
          padding: 12px 0;
        }
      }
    }
  }

  .recommendations-card {
    :deep(.el-alert:last-child) {
      margin-bottom: 0;
    }
  }
}
</style>
