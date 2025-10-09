<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t("license.dashboard") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/machines' }">
            {{ $t("license.machines.title") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{
            $t("license.machines.detail")
          }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ machineData.machine_id }}</h2>
            <el-tag :type="getStatusType(machineData.status)">
              {{
                $t(
                  `license.machines.status${machineData.status.charAt(0).toUpperCase() + machineData.status.slice(1)}`
                )
              }}
            </el-tag>
            <el-tag
              v-if="machineData.days_since_last_seen === 0"
              type="success"
            >
              {{ $t("license.machines.online") }}
            </el-tag>
            <el-tag v-else type="info">
              {{
                $t("license.machines.lastSeenDaysAgo", {
                  days: machineData.days_since_last_seen
                })
              }}
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
                  <el-dropdown-item
                    command="activate"
                    :disabled="machineData.status === 'active'"
                  >
                    {{ $t("license.machines.activate") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="block"
                    :disabled="machineData.status === 'blocked'"
                  >
                    {{ $t("license.machines.block") }}
                  </el-dropdown-item>
                  <el-dropdown-item command="reset" divided>{{
                    $t("license.machines.reset")
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
                <span>{{ $t("license.machines.basicInfo") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item
                  :label="$t('license.machines.machineId')"
                  :span="2"
                >
                  <div class="machine-id">
                    <code>{{ machineData.machine_id }}</code>
                    <el-button
                      type="text"
                      size="small"
                      @click="copyMachineId"
                      style="margin-left: 10px"
                    >
                      {{ $t("common.copy") }}
                    </el-button>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.machines.licenseKey')"
                >
                  <code>{{ machineData.license_key_preview }}</code>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.status')">
                  <el-tag :type="getStatusType(machineData.status)">
                    {{
                      $t(
                        `license.machines.status${machineData.status.charAt(0).toUpperCase() + machineData.status.slice(1)}`
                      )
                    }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.ipAddress')">
                  {{ machineData.last_ip_address || "-" }}
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.machines.daysSinceLastSeen')"
                >
                  {{ machineData.days_since_last_seen }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.machines.systemInfo") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item
                  :label="$t('license.machines.operatingSystem')"
                >
                  {{ machineData.os_info?.name || "-" }}
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.machines.architecture')"
                >
                  {{ machineData.os_info?.architecture || "-" }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.version')">
                  {{ machineData.os_info?.version || "-" }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.domain')">
                  {{ machineData.os_info?.domain || "-" }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.cpuInfo')">
                  {{ machineData.hardware_summary?.cpu || "-" }}
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.machines.memoryInfo')"
                >
                  {{ machineData.hardware_summary?.memory || "-" }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.machines.licenseInfo") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.machines.license')">
                  {{ machineData.license || "-" }}
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.machines.licenseKey')"
                >
                  <code>{{ machineData.license_key_preview }}</code>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.firstSeen')">
                  {{ formatDate(machineData.first_seen_at) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.lastSeen')">
                  {{ formatDate(machineData.last_seen_at) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.machines.activeLicensesList") }}</span>
              </template>

              <el-table :data="activeLicenses" style="width: 100%">
                <el-table-column
                  prop="licenseKey"
                  :label="$t('license.machines.licenseKey')"
                  width="200"
                >
                  <template #default="{ row }">
                    <code class="license-key-cell">{{ row.licenseKey }}</code>
                  </template>
                </el-table-column>
                <el-table-column
                  prop="planName"
                  :label="$t('license.machines.plan')"
                />
                <el-table-column
                  prop="customerName"
                  :label="$t('license.machines.customer')"
                />
                <el-table-column
                  prop="activationDate"
                  :label="$t('license.machines.activationDate')"
                >
                  <template #default="{ row }">
                    {{ formatDate(row.activationDate) }}
                  </template>
                </el-table-column>
                <el-table-column
                  prop="expiryDate"
                  :label="$t('license.machines.expiryDate')"
                >
                  <template #default="{ row }">
                    <span
                      :class="{
                        'expiring-soon': isExpiringSoon(row.expiryDate)
                      }"
                    >
                      {{ formatDate(row.expiryDate) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('common.actions')" width="100">
                  <template #default="{ row }">
                    <el-button
                      type="text"
                      size="small"
                      @click="viewLicense(row.licenseId)"
                    >
                      {{ $t("common.view") }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <el-card
              v-if="machineData.metadata"
              class="detail-card"
              shadow="never"
            >
              <template #header>
                <span>{{ $t("license.machines.metadata") }}</span>
              </template>

              <div class="metadata-content">
                <pre>{{ formatMetadata(machineData.metadata) }}</pre>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span>{{ $t("license.machines.statistics") }}</span>
              </template>

              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">{{ machineData.license || 0 }}</div>
                  <div class="stat-label">
                    {{ $t("license.machines.licenseId") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">
                    {{ machineData.days_since_last_seen }}
                  </div>
                  <div class="stat-label">
                    {{ $t("license.machines.daysSinceLastSeen") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div
                    class="stat-number"
                    :class="getStatusTagType(machineData.status)"
                  >
                    {{ machineData.status }}
                  </div>
                  <div class="stat-label">
                    {{ $t("license.machines.status") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">
                    {{ formatUptime(machineData.uptime || 0) }}
                  </div>
                  <div class="stat-label">
                    {{ $t("license.machines.uptime") }}
                  </div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.machines.connectionInfo") }}</span>
              </template>

              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('license.machines.isOnline')">
                  <el-tag
                    :type="
                      machineData.days_since_last_seen === 0
                        ? 'success'
                        : 'danger'
                    "
                  >
                    {{
                      machineData.days_since_last_seen === 0
                        ? $t("license.machines.online")
                        : $t("license.machines.offline")
                    }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.lastSeen')">
                  {{ formatDate(machineData.last_seen_at) }}
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.machines.lastIpAddress')"
                >
                  {{ machineData.last_ip_address || "-" }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.userAgent')">
                  <div class="user-agent">
                    {{ machineData.userAgent || "-" }}
                  </div>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.machines.recentActivity") }}</span>
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
                <span>{{ $t("license.machines.timeline") }}</span>
              </template>

              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('license.machines.firstSeen')">
                  {{ formatDate(machineData.first_seen_at) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.lastSeen')">
                  {{ formatDate(machineData.last_seen_at) }}
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.machines.daysSinceLastSeen')"
                >
                  {{ machineData.days_since_last_seen }} {{ $t("common.days") }}
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
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";
import { useLicenseStoreHook } from "@/store/modules/license";
import type { MachineBinding } from "@/types/license";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const licenseStore = useLicenseStoreHook();

const loading = ref(false);

// 使用API返回的机器绑定数据结构，加上一些扩展字段用于详情页显示
interface MachineDetailData extends MachineBinding {
  // 扩展字段
  uptime?: number;
  connectionCount?: number;
  userAgent?: string;
  metadata?: string;
}

interface License {
  licenseId: string;
  licenseKey: string;
  planName: string;
  customerName: string;
  activationDate: string;
  expiryDate: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

const machineData = reactive<MachineDetailData>({
  id: 0,
  license: 0,
  license_key_preview: "",
  machine_id: "",
  hardware_summary: {},
  os_info: {},
  last_ip_address: "",
  status: "active",
  first_seen_at: "",
  last_seen_at: "",
  days_since_last_seen: 0,
  // 扩展字段
  uptime: 0,
  connectionCount: 0,
  userAgent: "",
  metadata: ""
});

const activeLicenses = ref<License[]>([]);
const recentActivities = ref<Activity[]>([]);

const getStatusType = (status: string) => {
  switch (status) {
    case "active":
      return "success";
    case "inactive":
      return "info";
    case "blocked":
      return "danger";
    default:
      return "info";
  }
};

const loadMachineData = async () => {
  const machineBindingId = route.params.id;
  if (!machineBindingId) {
    ElMessage.error(t("license.machines.invalidId"));
    router.push("/license/machines");
    return;
  }

  loading.value = true;
  try {
    logger.debug("[MachineDetail] 加载机器绑定详情", { machineBindingId });

    // 调用真实API获取机器绑定详情
    const response = await licenseStore.fetchMachineBindingDetail(
      parseInt(machineBindingId as string)
    );

    if (response.success && response.data) {
      // 更新机器绑定数据
      Object.assign(machineData, {
        ...response.data,
        // 添加一些扩展字段的默认值
        uptime: 0,
        connectionCount: 0,
        userAgent: "",
        metadata: ""
      });
      logger.debug("[MachineDetail] 机器绑定数据加载成功", response.data);
    } else {
      throw new Error(response.message || "获取机器绑定详情失败");
    }

    // 生成活动记录（基于机器绑定的状态变化）
    const activities = [];

    if (machineData.status === "blocked") {
      activities.push({
        id: "1",
        type: "danger",
        description: t("license.machines.machineBlocked"),
        timestamp: machineData.last_seen_at
      });
    }

    if (machineData.status === "active") {
      activities.push({
        id: "2",
        type: "success",
        description: t("license.machines.machineActive"),
        timestamp: machineData.last_seen_at
      });
    }

    activities.push({
      id: "3",
      type: "info",
      description: t("license.machines.machineFirstSeen"),
      timestamp: machineData.first_seen_at
    });

    recentActivities.value = activities;

    // 暂时清空许可证数据，实际应该根据机器绑定关联的许可证来显示
    activeLicenses.value = [];
  } catch (error) {
    logger.error("加载机器绑定详情失败", error);
    ElMessage.error(t("license.machines.loadFailed"));
    router.push("/license/machines");
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
};

const formatMetadata = (metadata: string) => {
  try {
    return JSON.stringify(JSON.parse(metadata), null, 2);
  } catch {
    return metadata;
  }
};

const isExpiringSoon = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 3600 * 24));
  return days <= 30 && days > 0;
};

const copyMachineId = async () => {
  try {
    await navigator.clipboard.writeText(machineData.machine_id);
    ElMessage.success(t("license.machines.machineIdCopied"));
  } catch (error) {
    ElMessage.error(t("common.copyFailed"));
  }
};

const viewLicense = (licenseId: string) => {
  router.push(`/license/licenses/detail/${licenseId}`);
};

const handleAction = async (command: string) => {
  switch (command) {
    case "block":
      await handleBlockMachine();
      break;
    case "activate":
    case "reset":
      // TODO: 实现相应的机器操作
      ElMessage.info(t("common.featureComingSoon"));
      break;
  }
};

const handleBlockMachine = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      t("license.machines.blockConfirm", {
        machineId: machineData.machine_id.substring(0, 12) + "..."
      }),
      t("license.machines.blockReason"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPlaceholder: t("license.machines.blockReasonPlaceholder"),
        inputType: "textarea"
      }
    );

    await licenseStore.blockMachineBinding(machineData.id, {
      reason: reason || ""
    });
    ElMessage.success(t("license.machines.blockSuccess"));

    // 重新加载数据以更新状态
    await loadMachineData();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("阻止机器绑定失败", error);
      ElMessage.error(t("license.machines.blockError"));
    }
  }
};

const handleBack = () => {
  router.back();
};

onMounted(() => {
  loadMachineData();
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

.machine-id {
  display: flex;
  align-items: center;
}

.machine-id code {
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

.license-key-cell {
  font-family: "Courier New", monospace;
  font-size: 12px;
  background-color: var(--el-bg-color-page);
  padding: 2px 4px;
  border-radius: 2px;
}

.expiring-soon {
  color: var(--el-color-warning);
  font-weight: 500;
}

.user-agent {
  font-family: "Courier New", monospace;
  font-size: 12px;
  word-break: break-all;
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
