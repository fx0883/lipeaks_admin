<template>
  <div class="main-container">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t("license.dashboard") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/licenses' }">
            {{ $t("license.licenses.title") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{
            $t("license.licenses.detail")
          }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ licenseData.customer_name }}</h2>
            <el-tag :type="getStatusType(licenseData.status)">
              {{
                $t(
                  `license.licenses.status${licenseData.status.charAt(0).toUpperCase() + licenseData.status.slice(1)}`
                )
              }}
            </el-tag>
            <el-tag v-if="isExpiringSoon" type="warning">
              {{ $t("license.licenses.expiringSoon") }}
            </el-tag>
          </div>
          <div class="action-section">
            <el-dropdown @command="handleAction">
              <el-button type="primary">
                {{ $t("common.actions") }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">{{
                    $t("common.edit")
                  }}</el-dropdown-item>
                  <el-dropdown-item
                    command="activate"
                    :disabled="licenseData.status === 'activated'"
                  >
                    {{ $t("license.licenses.activate") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="suspend"
                    :disabled="licenseData.status !== 'activated'"
                  >
                    {{ $t("license.licenses.suspend") }}
                  </el-dropdown-item>
                  <el-dropdown-item command="renew">{{
                    $t("license.licenses.renew")
                  }}</el-dropdown-item>
                  <el-dropdown-item command="export" divided>{{
                    $t("license.licenses.exportLicense")
                  }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button @click="handleBack">
              {{ $t("common.back") }}
            </el-button>
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.licenses.basicInfo") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item
                  :label="$t('license.licenses.licenseKey')"
                  :span="2"
                >
                  <div class="license-key">
                    <code>{{ licenseData.license_key }}</code>
                    <el-button
                      type="text"
                      size="small"
                      style="margin-left: 10px"
                      @click="copyLicenseKey"
                    >
                      {{ $t("common.copy") }}
                    </el-button>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.product')">
                  {{ licenseData.product_name || "-" }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.plan')">
                  {{ licenseData.plan_name || "-" }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.customer')">
                  <div>
                    <div>{{ licenseData.customer_name }}</div>
                    <div
                      style="
                        color: var(--el-text-color-secondary);
                        font-size: 12px;
                      "
                    >
                      {{ licenseData.customer_email }}
                    </div>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="licenseData.notes"
                  :label="$t('license.licenses.notes')"
                  :span="2"
                >
                  {{ licenseData.notes }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.licenses.validity") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.licenses.issuedAt')">
                  {{ formatDate(licenseData.issued_at) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.expiresAt')">
                  <span
                    :class="{
                      'expiring-soon': isExpiringSoon,
                      expired: isExpired
                    }"
                  >
                    {{
                      licenseData.expires_at
                        ? formatDate(licenseData.expires_at)
                        : $t("license.licenses.permanent")
                    }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.licenses.remainingDays')"
                >
                  <span
                    :class="{
                      'expiring-soon': remainingDays <= 30 && remainingDays > 0,
                      expired: remainingDays <= 0
                    }"
                  >
                    {{
                      licenseData.expires_at
                        ? remainingDays + " " + $t("common.days")
                        : $t("license.licenses.permanent")
                    }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.licenses.machineBindings')"
                >
                  {{ licenseData.machine_bindings_count || 0 }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.licenses.limitations") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item
                  :label="$t('license.licenses.maxActivations')"
                >
                  <span class="usage-info">
                    {{
                      licenseData.max_activations === -1
                        ? $t("common.unlimited")
                        : licenseData.max_activations
                    }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.licenses.currentActivations')"
                >
                  <span class="usage-info">
                    {{ licenseData.current_activations }} /
                    {{
                      licenseData.max_activations === -1
                        ? "∞"
                        : licenseData.max_activations
                    }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span>{{ $t("license.licenses.usageStatistics") }}</span>
              </template>

              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">
                    {{ usageData.totalActivations }}
                  </div>
                  <div class="stat-label">
                    {{ $t("license.licenses.totalActivations") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ usageData.activeDevices }}</div>
                  <div class="stat-label">
                    {{ $t("license.licenses.activeDevices") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ usageData.currentUsers }}</div>
                  <div class="stat-label">
                    {{ $t("license.licenses.currentUsers") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">
                    {{ formatBytes(usageData.dataUsage) }}
                  </div>
                  <div class="stat-label">
                    {{ $t("license.licenses.dataUsage") }}
                  </div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.licenses.recentActivity") }}</span>
              </template>

              <el-timeline>
                <el-timeline-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  :timestamp="formatDate(activity.timestamp)"
                  :type="activity.type"
                >
                  {{ activity.description }}
                </el-timeline-item>
              </el-timeline>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.licenses.timeline") }}</span>
              </template>

              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('common.createdAt')">
                  {{ formatDate(licenseData.created_at) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedAt')">
                  {{ formatDate(licenseData.updated_at) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown, Check } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import { getLicenseDetail } from "@/api/modules/license";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const loading = ref(false);

interface LicenseData {
  id: number;
  license_key: string;
  product: number;
  product_name?: string;
  plan: number;
  plan_name?: string;
  tenant: number; // API响应包含此字段，但前端不显示
  tenant_name?: string; // API响应包含此字段，但前端不显示
  customer_name: string;
  customer_email: string;
  max_activations: number;
  current_activations: number;
  status: "generated" | "activated" | "suspended" | "revoked" | "expired";
  issued_at: string;
  expires_at: string | null;
  days_until_expiry: number | null;
  machine_bindings_count: number;
  last_verified_at: string | null;
  notes?: string;
  metadata?: Record<string, any>;
  machine_bindings?: any[];
  recent_activations?: any[];
  usage_stats?: {
    total_usage_logs: number;
    recent_usage_logs: number;
  };
  created_at: string;
  updated_at: string;
}

interface UsageData {
  totalActivations: number;
  activeDevices: number;
  currentUsers: number;
  currentDevices: number;
  dataUsage: number;
}

interface Activity {
  id: string;
  type: "primary" | "success" | "warning" | "danger" | "info";
  description: string;
  timestamp: string;
}

const licenseData = reactive<LicenseData>({
  id: 0,
  license_key: "",
  product: 0,
  product_name: "",
  plan: 0,
  plan_name: "",
  tenant: 0,
  tenant_name: "",
  customer_name: "",
  customer_email: "",
  max_activations: 0,
  current_activations: 0,
  status: "generated",
  issued_at: "",
  expires_at: null,
  days_until_expiry: null,
  machine_bindings_count: 0,
  last_verified_at: null,
  notes: "",
  metadata: {},
  machine_bindings: [],
  recent_activations: [],
  usage_stats: {
    total_usage_logs: 0,
    recent_usage_logs: 0
  },
  created_at: "",
  updated_at: ""
});

const usageData = reactive<UsageData>({
  totalActivations: 0,
  activeDevices: 0,
  currentUsers: 0,
  currentDevices: 0,
  dataUsage: 0
});

const recentActivities = ref<Activity[]>([]);

const remainingDays = computed(() => {
  // 优先使用API返回的days_until_expiry
  if (licenseData.days_until_expiry !== null) {
    return licenseData.days_until_expiry;
  }

  if (!licenseData.expires_at) return 0;
  const now = new Date();
  const expiry = new Date(licenseData.expires_at);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
});

const isExpiringSoon = computed(
  () => remainingDays.value <= 30 && remainingDays.value > 0
);
const isExpired = computed(
  () => licenseData.status === "expired" || remainingDays.value <= 0
);

const getStatusType = (status: string) => {
  switch (status) {
    case "activated":
      return "success";
    case "generated":
      return "info";
    case "suspended":
      return "warning";
    case "revoked":
      return "danger";
    case "expired":
      return "danger";
    default:
      return "info";
  }
};

const loadLicenseData = async () => {
  const licenseId = route.params.id;
  if (!licenseId) {
    ElMessage.error(t("license.licenses.invalidId"));
    router.push("/license/licenses");
    return;
  }

  loading.value = true;
  try {
    logger.debug("[LicenseDetail] 加载许可证详情", { licenseId });

    // 调用真实API获取许可证详情
    const response = await getLicenseDetail(parseInt(licenseId as string));

    if (response.success && response.data) {
      // 更新许可证数据
      Object.assign(licenseData, response.data);
      logger.debug("[LicenseDetail] 许可证数据加载成功", response.data);

      // 更新使用统计数据
      if (response.data.usage_stats) {
        Object.assign(usageData, {
          totalActivations: response.data.usage_stats.total_usage_logs || 0,
          activeDevices: response.data.machine_bindings_count || 0,
          currentUsers: response.data.current_activations || 0,
          currentDevices: response.data.machine_bindings_count || 0,
          dataUsage: 0 // API暂未提供数据使用量
        });
      }

      // 生成活动记录
      const activities = [];

      if (response.data.last_verified_at) {
        activities.push({
          id: "1",
          type: "info",
          description: t("license.licenses.licenseValidated"),
          timestamp: response.data.last_verified_at
        });
      }

      if (response.data.status === "activated") {
        activities.push({
          id: "2",
          type: "success",
          description: t("license.licenses.licenseActivated"),
          timestamp: response.data.issued_at
        });
      }

      activities.push({
        id: "3",
        type: "info",
        description: t("license.licenses.licenseCreated"),
        timestamp: response.data.created_at
      });

      recentActivities.value = activities;
    } else {
      throw new Error(response.message || "获取许可证详情失败");
    }
  } catch (error) {
    logger.error("[LicenseDetail] 加载许可证详情失败", error);
    ElMessage.error(t("license.licenses.loadFailed"));
    router.push("/license/licenses");
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
};

const formatMetadata = (metadata: string) => {
  try {
    return JSON.stringify(JSON.parse(metadata), null, 2);
  } catch {
    return metadata;
  }
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, "");
};

const copyLicenseKey = async () => {
  try {
    await navigator.clipboard.writeText(licenseData.license_key);
    ElMessage.success(t("license.licenses.licenseKeyCopied"));
  } catch (error) {
    ElMessage.error(t("common.copyFailed"));
  }
};

const handleAction = (command: string) => {
  switch (command) {
    case "edit":
      router.push(`/license/licenses/edit/${licenseData.id}`);
      break;
    case "activate":
    case "suspend":
    case "renew":
      // TODO: 实现相应的许可证操作
      ElMessage.info(t("common.featureComingSoon"));
      break;
    case "export":
      // TODO: 实现许可证导出功能
      ElMessage.info(t("common.featureComingSoon"));
      break;
  }
};

const handleBack = () => {
  router.back();
};

onMounted(() => {
  loadLicenseData();
});
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-section h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.action-section {
  display: flex;
  gap: 10px;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card :deep(.el-card__header) {
  background-color: var(--el-bg-color-page);
  font-weight: 600;
}

.stats-card :deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.license-key {
  display: flex;
  align-items: center;
}

.license-key code {
  background-color: var(--el-bg-color-page);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 14px;
}

.stats-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px 10px;
  border-radius: 4px;
  background-color: var(--el-bg-color);
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.usage-info {
  font-weight: 500;
}

.expiring-soon {
  color: var(--el-color-warning);
  font-weight: 500;
}

.expired {
  color: var(--el-color-danger);
  font-weight: 500;
}

.ip-tag,
.domain-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.no-restriction {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
}

.feature-icon {
  font-size: 16px;
}

.metadata-content {
  background-color: var(--el-bg-color-page);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.metadata-content pre {
  margin: 0;
  font-family: "Courier New", monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.el-descriptions__body) {
  background-color: var(--el-bg-color);
}

:deep(.el-descriptions-item__label) {
  font-weight: 500;
  background-color: var(--el-bg-color-page);
}

:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
}
</style>
