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
  Shield,
  Warning
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import { useUserStoreHook } from "@/store/modules/user";
import type {
  Activation,
  ActivationListParams,
  ActivationStatus
} from "@/types/license";
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
const tableLoading = computed(() => licenseStore.loading.activationList);

// 表格数据
const activations = computed(() => licenseStore.activations.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => licenseStore.activations.total)
});

// 搜索表单
const searchForm = reactive<ActivationListParams>({
  search: "",
  license_id: undefined,
  machine_id: undefined,
  status: undefined,
  page: 1,
  page_size: 10
});

// 激活状态选项
const statusOptions = [
  { value: undefined, label: t("license.activations.statusAll") },
  { value: "active", label: t("license.activations.statusActive") },
  { value: "inactive", label: t("license.activations.statusInactive") },
  { value: "expired", label: t("license.activations.statusExpired") },
  { value: "revoked", label: t("license.activations.statusRevoked") }
];

// 许可证选项
const licenseOptions = ref([]);
// 机器选项
const machineOptions = ref([]);

// 多选相关
const multipleSelection = ref<Activation[]>([]);
const handleSelectionChange = (val: Activation[]) => {
  multipleSelection.value = val;
};

// 获取激活记录列表
const fetchActivations = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    const params = { ...searchForm };
    logger.debug("[ActivationIndex] 激活记录列表请求参数:", params);

    await licenseStore.fetchActivationList(params);
  } catch (error) {
    logger.error("获取激活记录列表失败", error);
    ElMessage.error(t("license.activations.fetchError"));
  }
};

// 获取许可证选项
const fetchLicenseOptions = async () => {
  try {
    // 许可证状态: generated, activated, suspended, revoked, expired
    await licenseStore.fetchLicenseList({ page: 1, page_size: 100, status: "activated" });
    licenseOptions.value = licenseStore.licenses.data.map(license => ({
      value: license.id,
      label: `${license.license_key.substring(0, 8)}...${license.license_key.slice(-4)} (${license.application_name || 'N/A'})`
    }));
  } catch (error) {
    logger.error("获取许可证选项失败", error);
  }
};

// 获取机器选项
const fetchMachineOptions = async () => {
  try {
    await licenseStore.fetchMachineList({ page: 1, page_size: 100, is_active: true });
    machineOptions.value = licenseStore.machines.data.map(machine => ({
      value: machine.id,
      label: `${machine.hostname} (${machine.fingerprint.substring(0, 12)}...)`
    }));
  } catch (error) {
    logger.error("获取机器选项失败", error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchActivations();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: "",
    license_id: undefined,
    machine_id: undefined,
    status: undefined,
    page: 1,
    page_size: 10
  });
  pagination.currentPage = 1;
  fetchActivations();
};

// 刷新
const handleRefresh = () => {
  fetchActivations();
};

// 查看详情
const handleView = (row: Activation) => {
  router.push(`/license/activations/detail/${row.id}`);
};

// 撤销激活
const handleRevoke = async (row: Activation) => {
  
  try {
    await ElMessageBox.confirm(
      t("license.activations.revokeConfirm", { id: row.id }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    await licenseStore.revokeActivation(row.id);
    ElMessage.success(t("license.activations.revokeSuccess"));
    await fetchActivations();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("撤销激活失败", error);
      ElMessage.error(t("license.activations.revokeError"));
    }
  }
};

// 删除激活记录
const handleDelete = async (row: Activation) => {
  
  try {
    await ElMessageBox.confirm(
      t("license.activations.deleteConfirm", { id: row.id }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    await licenseStore.deleteActivation(row.id);
    ElMessage.success(t("license.activations.deleteSuccess"));
    await fetchActivations();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("删除激活记录失败", error);
      ElMessage.error(t("license.activations.deleteError"));
    }
  }
};

// 批量撤销
const handleBatchRevoke = async () => {
  
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("license.activations.selectActivations"));
    return;
  }
  
  const activeActivations = multipleSelection.value.filter(activation => activation.status === "active");
  if (activeActivations.length === 0) {
    ElMessage.warning(t("license.activations.noActiveActivations"));
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      t("license.activations.batchRevokeConfirm", { count: activeActivations.length }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    const activationIds = activeActivations.map(activation => activation.id);
    await licenseStore.batchRevokeActivations(activationIds);
    
    ElMessage.success(t("license.activations.batchRevokeSuccess"));
    await fetchActivations();
    multipleSelection.value = [];
  } catch (error) {
    if (error !== "cancel") {
      logger.error("批量撤销激活失败", error);
      ElMessage.error(t("license.activations.batchRevokeError"));
    }
  }
};

// 获取状态标签类型
const getStatusTagType = (status: ActivationStatus) => {
  const statusMap = {
    active: "success",
    inactive: "info",
    expired: "warning",
    revoked: "danger"
  };
  return statusMap[status] || "";
};

// 格式化激活时间
const formatActivatedAt = (activatedAt: string | null) => {
  if (!activatedAt) return "-";
  return new Date(activatedAt).toLocaleString();
};

// 格式化最后心跳时间
const formatLastHeartbeat = (lastHeartbeat: string | null) => {
  if (!lastHeartbeat) return t("license.activations.never");
  
  const date = new Date(lastHeartbeat);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 5) return t("license.activations.justNow");
  if (diffMinutes < 60) return t("license.activations.minutesAgo", { minutes: diffMinutes });
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("license.activations.hoursAgo", { hours: diffHours });
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return t("license.activations.daysAgo", { days: diffDays });
  
  return date.toLocaleDateString();
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchActivations();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchActivations();
};

// 页面加载时获取数据
onMounted(() => {
  fetchLicenseOptions();
  fetchMachineOptions();
  fetchActivations();
});
</script>

<template>
  <div class="activation-management">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('license.activations.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('license.activations.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item :label="t('license.activations.license')">
          <el-select
            v-model="searchForm.license_id"
            :placeholder="t('license.activations.licensePlaceholder')"
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
        
        <el-form-item :label="t('license.activations.machine')">
          <el-select
            v-model="searchForm.machine_id"
            :placeholder="t('license.activations.machinePlaceholder')"
            clearable
            filterable
          >
            <el-option
              v-for="option in machineOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('license.activations.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('license.activations.statusPlaceholder')"
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
            @click="handleBatchRevoke"
          >
            {{ t("license.activations.batchRevoke") }}
            <span v-if="multipleSelection.length > 0">({{ multipleSelection.length }})</span>
          </el-button>
        </div>
        
        <div class="action-right">
          <span class="total-info">
            {{ t("license.activations.total", { count: pagination.total }) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="activations"
        :loading="tableLoading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column
          prop="id"
          :label="t('license.activations.id')"
          width="80"
        />
        
        <el-table-column
          prop="license"
          :label="t('license.activations.license')"
          min-width="180"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="row.license" class="license-info">
              <code class="license-key">
                {{ row.license.license_key.substring(0, 8) }}...{{ row.license.license_key.slice(-4) }}
              </code>
              <div class="application-name">{{ row.license.application_name || 'N/A' }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="machine"
          :label="t('license.activations.machine')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="row.machine" class="machine-info">
              <div class="machine-hostname">{{ row.machine.hostname }}</div>
              <code class="machine-fingerprint">{{ row.machine.fingerprint.substring(0, 12) }}...</code>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="status"
          :label="t('license.activations.status')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ t(`license.activations.status${row.status.charAt(0).toUpperCase() + row.status.slice(1)}`) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="activated_at"
          :label="t('license.activations.activatedAt')"
          width="160"
        >
          <template #default="{ row }">
            {{ formatActivatedAt(row.activated_at) }}
          </template>
        </el-table-column>
        
        <el-table-column
          prop="last_heartbeat"
          :label="t('license.activations.lastHeartbeat')"
          width="150"
        >
          <template #default="{ row }">
            <span :class="{ 'recent-heartbeat': row.last_heartbeat && new Date(row.last_heartbeat) > new Date(Date.now() - 5 * 60 * 1000) }">
              {{ formatLastHeartbeat(row.last_heartbeat) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="ip_address"
          :label="t('license.activations.ipAddress')"
          width="140"
          show-overflow-tooltip
        />
        
        <el-table-column
          prop="user_agent"
          :label="t('license.activations.userAgent')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.user_agent">{{ row.user_agent }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="metadata"
          :label="t('license.activations.metadata')"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="row.metadata && Object.keys(row.metadata).length > 0" class="metadata-info">
              <div v-for="(value, key) in row.metadata" :key="key" class="metadata-item">
                <strong>{{ key }}:</strong> {{ value }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="created_at"
          :label="t('license.activations.createdAt')"
          width="160"
        >
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        
        <el-table-column
          :label="t('common.actions')"
          width="200"
          fixed="right"
        >
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
              size="small"
              @click="handleRevoke(row)"
            >
              {{ t("license.activations.revoke") }}
            </el-button>
            
            <el-button
              type="danger"
              :icon="Delete"
              size="small"
              @click="handleDelete(row)"
            >
              {{ t("common.delete") }}
            </el-button>
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
.activation-management {
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

.license-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.license-key {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #409eff;
}

.application-name {
  font-size: 12px;
  color: #909399;
}

.machine-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.machine-hostname {
  font-weight: 500;
  color: #303133;
}

.machine-fingerprint {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #909399;
}

.recent-heartbeat {
  color: #67c23a;
  font-weight: 500;
}

.metadata-info {
  font-size: 12px;
  line-height: 1.4;
}

.metadata-item {
  margin-bottom: 2px;
}

.metadata-item strong {
  color: #303133;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
