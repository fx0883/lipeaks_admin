<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Refresh,
  Delete,
  View,
  Computer,
  Warning
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import { useUserStoreHook } from "@/store/modules/user";
import type { MachineBinding, MachineBindingListParams } from "@/types/license";
import { hasPerms } from "@/utils/auth";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const licenseStore = useLicenseStoreHook();
const userStore = useUserStoreHook();

// 检查用户权限
const checkPermission = () => {
  return hasPerms("license:view");
};

if (!checkPermission()) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 表格加载状态
const tableLoading = computed(() => licenseStore.loading.machineBindingList);

// 表格数据
const machineBindings = computed(
  () => licenseStore.machineBindings?.data || []
);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: computed(() => licenseStore.machineBindings?.total || 0)
});

// 搜索表单
const searchForm = reactive<MachineBindingListParams>({
  search: "",
  license: undefined,
  status: undefined,
  ordering: "-last_seen_at",
  page: 1,
  page_size: 20
});

// 状态选项
const statusOptions = [
  { value: undefined, label: t("license.machines.statusAll") },
  { value: "active", label: t("license.machines.statusActive") },
  { value: "inactive", label: t("license.machines.statusInactive") },
  { value: "blocked", label: t("license.machines.statusBlocked") }
];

// 许可证选项
const licenseOptions = ref([]);

// 多选相关
const multipleSelection = ref<MachineBinding[]>([]);
const handleSelectionChange = (val: MachineBinding[]) => {
  multipleSelection.value = val;
};

// 获取机器绑定列表
const fetchMachineBindings = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    const params = { ...searchForm };
    logger.debug("[MachineBindingIndex] 机器绑定列表请求参数:", params);

    await licenseStore.fetchMachineBindingList(params);
  } catch (error) {
    logger.error("获取机器绑定列表失败", error);
    ElMessage.error(t("license.machines.fetchError"));
  }
};

// 获取许可证选项
const fetchLicenseOptions = async () => {
  try {
    await licenseStore.fetchLicenseList({
      page: 1,
      page_size: 100
      // 移除状态过滤，获取所有许可证供用户选择
    });

    // 确保数据存在并映射为选项
    const licenseData = licenseStore.licenses?.data || [];
    licenseOptions.value = licenseData.map(license => ({
      value: license.id,
      label: `${license.license_key.substring(0, 8)}...${license.license_key.slice(-4)} (${license.plan_name})`
    }));

    logger.debug(
      `[MachineBindingIndex] 加载了 ${licenseOptions.value.length} 个许可证选项`
    );
  } catch (error) {
    logger.error("获取许可证选项失败", error);
    ElMessage.error("加载许可证选项失败");
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchMachineBindings();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: "",
    license: undefined,
    status: undefined,
    ordering: "-last_seen_at",
    page: 1,
    page_size: 20
  });
  pagination.currentPage = 1;
  fetchMachineBindings();
};

// 刷新
const handleRefresh = () => {
  fetchMachineBindings();
};

// 查看详情
const handleView = (row: MachineBinding) => {
  router.push(`/license/machines/detail/${row.id}`);
};

// 阻止机器绑定
const handleBlock = async (row: MachineBinding) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      t("license.machines.blockConfirm", {
        machineId: row.machine_id.substring(0, 12) + "..."
      }),
      t("license.machines.blockReason"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPlaceholder: t("license.machines.blockReasonPlaceholder"),
        inputType: "textarea"
      }
    );

    await licenseStore.blockMachineBinding(row.id, { reason: reason || "" });
    ElMessage.success(t("license.machines.blockSuccess"));
    await fetchMachineBindings();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("阻止机器绑定失败", error);
      ElMessage.error(t("license.machines.blockError"));
    }
  }
};

// 批量阻止（如果有需要，可以后续实现）
const handleBatchBlock = async () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("license.machines.selectMachines"));
    return;
  }

  // TODO: 如果API支持批量阻止，可以在这里实现
  ElMessage.info(t("common.featureComingSoon"));
};

// 格式化机器ID
const formatMachineId = (machineId: string) => {
  return machineId.length > 24
    ? `${machineId.substring(0, 12)}...${machineId.substring(machineId.length - 12)}`
    : machineId;
};

// 格式化最后活跃时间
const formatLastSeen = (lastSeen: string | null, daysSince?: number) => {
  if (!lastSeen) return t("license.machines.never");

  if (daysSince !== undefined) {
    if (daysSince === 0) return t("license.machines.today");
    if (daysSince === 1) return t("license.machines.yesterday");
    if (daysSince < 7)
      return t("license.machines.daysAgo", { days: daysSince });
  }

  const date = new Date(lastSeen);
  return date.toLocaleString();
};

// 获取操作系统图标
const getOSIcon = (osInfo: any) => {
  if (!osInfo || !osInfo.name) return "ri:computer-line";
  const osName = osInfo.name.toLowerCase();
  if (osName.includes("windows")) return "ri:windows-fill";
  if (osName.includes("mac") || osName.includes("darwin"))
    return "ri:apple-fill";
  if (osName.includes("linux") || osName.includes("ubuntu"))
    return "ri:ubuntu-fill";
  return "ri:computer-line";
};

// 获取状态标签类型
const getStatusTagType = (status: string) => {
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

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchMachineBindings();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchMachineBindings();
};

// 页面加载时获取数据
onMounted(async () => {
  await fetchLicenseOptions(); // 先加载许可证选项
  fetchMachineBindings(); // 然后加载机器绑定列表
});
</script>

<template>
  <div class="machine-management">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('license.machines.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('license.machines.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item :label="t('license.machines.license')">
          <el-select
            v-model="searchForm.license"
            :placeholder="t('license.machines.licensePlaceholder')"
            clearable
            filterable
          >
            <el-option
              v-for="option in licenseOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('license.machines.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('license.machines.statusPlaceholder')"
            clearable
          >
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            {{ t("common.search") }}
          </el-button>
          <el-button @click="handleResetSearch">
            {{ t("common.reset") }}
          </el-button>
          <el-button :icon="Refresh" @click="handleRefresh">
            {{ t("common.refresh") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="action-card">
      <div class="action-header">
        <div class="action-left">
          <el-button
            type="warning"
            :icon="Warning"
            :disabled="multipleSelection.length === 0"
            @click="handleBatchBlock"
          >
            {{ t("license.machines.batchBlock") }}
            <span v-if="multipleSelection.length > 0"
              >({{ multipleSelection.length }})</span
            >
          </el-button>
        </div>

        <div class="action-right">
          <span class="total-info">
            {{ t("license.machines.total", { count: pagination.total }) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="machineBindings"
        :loading="tableLoading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          prop="id"
          :label="t('license.machines.id')"
          width="80"
        />

        <el-table-column
          prop="machine_id"
          :label="t('license.machines.machineId')"
          min-width="200"
        >
          <template #default="{ row }">
            <code class="machine-id">{{
              formatMachineId(row.machine_id)
            }}</code>
          </template>
        </el-table-column>

        <el-table-column
          prop="license_key_preview"
          :label="t('license.machines.licenseKey')"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <code class="license-key">{{ row.license_key_preview }}</code>
          </template>
        </el-table-column>

        <el-table-column
          prop="os_info"
          :label="t('license.machines.osInfo')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div class="os-info-cell">
              <el-icon class="os-icon">
                <component :is="getOSIcon(row.os_info)" />
              </el-icon>
              <div>
                <div>{{ row.os_info?.name || "-" }}</div>
                <div class="os-version">{{ row.os_info?.version || "" }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="hardware_summary"
          :label="t('license.machines.hardwareInfo')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="row.hardware_summary" class="hardware-info">
              <div v-if="row.hardware_summary.cpu" class="info-line">
                <strong>CPU:</strong> {{ row.hardware_summary.cpu }}
              </div>
              <div v-if="row.hardware_summary.memory" class="info-line">
                <strong>Memory:</strong> {{ row.hardware_summary.memory }}
              </div>
              <div v-if="row.hardware_summary.disk" class="info-line">
                <strong>Disk:</strong> {{ row.hardware_summary.disk }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="last_ip_address"
          :label="t('license.machines.ipAddress')"
          width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ row.last_ip_address || "-" }}
          </template>
        </el-table-column>

        <el-table-column
          prop="status"
          :label="t('license.machines.status')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{
                t(
                  `license.machines.status${row.status.charAt(0).toUpperCase() + row.status.slice(1)}`
                )
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="last_seen_at"
          :label="t('license.machines.lastSeen')"
          width="150"
        >
          <template #default="{ row }">
            <span
              :class="{
                'recent-activity': row.days_since_last_seen === 0
              }"
            >
              {{ formatLastSeen(row.last_seen_at, row.days_since_last_seen) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="first_seen_at"
          :label="t('license.machines.firstSeen')"
          width="160"
        >
          <template #default="{ row }">
            {{ new Date(row.first_seen_at).toLocaleString() }}
          </template>
        </el-table-column>

        <el-table-column :label="t('common.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              :icon="View"
              size="small"
              @click="handleView(row)"
            >
              {{ t("common.view") }}
            </el-button>

            <el-button
              v-if="row.status === 'active'"
              type="warning"
              :icon="Warning"
              size="small"
              @click="handleBlock(row)"
            >
              {{ t("license.machines.block") }}
            </el-button>

            <el-tag
              v-else-if="row.status === 'blocked'"
              type="danger"
              size="small"
            >
              {{ t("license.machines.blocked") }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.machine-management {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.search-card,
.action-card,
.table-card {
  background: #ffffff;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-info {
  color: #606266;
  font-size: 14px;
}

.machine-id {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #909399;
}

.license-key {
  background: #e8f4fd;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 12px;
  color: #409eff;
}

.os-info-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.os-icon {
  font-size: 16px;
  color: #409eff;
}

.os-version {
  font-size: 11px;
  color: #909399;
  margin-top: 2px;
}

.hardware-info {
  font-size: 12px;
  line-height: 1.4;
}

.info-line {
  margin-bottom: 2px;
}

.info-line strong {
  color: #303133;
  font-weight: 500;
}

.recent-activity {
  color: #67c23a;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
