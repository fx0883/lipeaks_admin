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
import type {
  Machine,
  MachineListParams
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
const tableLoading = computed(() => licenseStore.loading.machineList);

// 表格数据
const machines = computed(() => licenseStore.machines.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => licenseStore.machines.total)
});

// 搜索表单
const searchForm = reactive<MachineListParams>({
  search: "",
  license_id: undefined,
  is_active: undefined,
  page: 1,
  page_size: 10
});

// 状态选项
const statusOptions = [
  { value: undefined, label: t("license.machines.statusAll") },
  { value: true, label: t("license.machines.statusActive") },
  { value: false, label: t("license.machines.statusInactive") }
];

// 许可证选项
const licenseOptions = ref([]);

// 多选相关
const multipleSelection = ref<Machine[]>([]);
const handleSelectionChange = (val: Machine[]) => {
  multipleSelection.value = val;
};

// 获取机器列表
const fetchMachines = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    const params = { ...searchForm };
    logger.debug("[MachineIndex] 机器列表请求参数:", params);

    await licenseStore.fetchMachineList(params);
  } catch (error) {
    logger.error("获取机器列表失败", error);
    ElMessage.error(t("license.machines.fetchError"));
  }
};

// 获取许可证选项
const fetchLicenseOptions = async () => {
  try {
    await licenseStore.fetchLicenseList({ page: 1, page_size: 100, status: "active" });
    licenseOptions.value = licenseStore.licenses.data.map(license => ({
      value: license.id,
      label: `${license.license_key.substring(0, 8)}...${license.license_key.slice(-4)} (${license.product?.name || 'N/A'})`
    }));
  } catch (error) {
    logger.error("获取许可证选项失败", error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchMachines();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: "",
    license_id: undefined,
    is_active: undefined,
    page: 1,
    page_size: 10
  });
  pagination.currentPage = 1;
  fetchMachines();
};

// 刷新
const handleRefresh = () => {
  fetchMachines();
};

// 查看详情
const handleView = (row: Machine) => {
  router.push(`/license/machines/detail/${row.id}`);
};

// 解绑机器
const handleUnbind = async (row: Machine) => {
  if (!hasPerms("license:manage")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      t("license.machines.unbindConfirm", { fingerprint: row.fingerprint.substring(0, 12) + "..." }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    await licenseStore.unbindMachine(row.id);
    ElMessage.success(t("license.machines.unbindSuccess"));
    await fetchMachines();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("解绑机器失败", error);
      ElMessage.error(t("license.machines.unbindError"));
    }
  }
};

// 删除机器记录
const handleDelete = async (row: Machine) => {
  if (!hasPerms("license:delete")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      t("license.machines.deleteConfirm", { fingerprint: row.fingerprint.substring(0, 12) + "..." }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    await licenseStore.deleteMachine(row.id);
    ElMessage.success(t("license.machines.deleteSuccess"));
    await fetchMachines();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("删除机器记录失败", error);
      ElMessage.error(t("license.machines.deleteError"));
    }
  }
};

// 批量解绑
const handleBatchUnbind = async () => {
  if (!hasPerms("license:manage")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("license.machines.selectMachines"));
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      t("license.machines.batchUnbindConfirm", { count: multipleSelection.value.length }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    const machineIds = multipleSelection.value.map(machine => machine.id);
    await licenseStore.batchUnbindMachines(machineIds);
    
    ElMessage.success(t("license.machines.batchUnbindSuccess"));
    await fetchMachines();
    multipleSelection.value = [];
  } catch (error) {
    if (error !== "cancel") {
      logger.error("批量解绑机器失败", error);
      ElMessage.error(t("license.machines.batchUnbindError"));
    }
  }
};

// 格式化机器指纹
const formatFingerprint = (fingerprint: string) => {
  return fingerprint.length > 24 ? 
    `${fingerprint.substring(0, 12)}...${fingerprint.substring(fingerprint.length - 12)}` : 
    fingerprint;
};

// 格式化最后活跃时间
const formatLastSeen = (lastSeen: string | null) => {
  if (!lastSeen) return t("license.machines.never");
  
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffMinutes < 5) return t("license.machines.justNow");
  if (diffMinutes < 60) return t("license.machines.minutesAgo", { minutes: diffMinutes });
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return t("license.machines.hoursAgo", { hours: diffHours });
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return t("license.machines.daysAgo", { days: diffDays });
  
  return date.toLocaleDateString();
};

// 获取操作系统图标
const getOSIcon = (os: string) => {
  if (os.toLowerCase().includes('windows')) return 'ri:windows-fill';
  if (os.toLowerCase().includes('mac')) return 'ri:apple-fill';
  if (os.toLowerCase().includes('linux')) return 'ri:ubuntu-fill';
  return 'ri:computer-line';
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchMachines();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchMachines();
};

// 页面加载时获取数据
onMounted(() => {
  fetchLicenseOptions();
  fetchMachines();
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
            v-model="searchForm.license_id"
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
            v-model="searchForm.is_active"
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
            v-if="hasPerms('license:manage')"
            type="warning"
            :icon="Warning"
            :disabled="multipleSelection.length === 0"
            @click="handleBatchUnbind"
          >
            {{ t("license.machines.batchUnbind") }}
            <span v-if="multipleSelection.length > 0">({{ multipleSelection.length }})</span>
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
        :data="machines"
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
          prop="fingerprint"
          :label="t('license.machines.fingerprint')"
          min-width="200"
        >
          <template #default="{ row }">
            <code class="machine-fingerprint">{{ formatFingerprint(row.fingerprint) }}</code>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="hostname"
          :label="t('license.machines.hostname')"
          min-width="150"
          show-overflow-tooltip
        />
        
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
              <span>{{ row.os_info }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="hardware_info"
          :label="t('license.machines.hardwareInfo')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="row.hardware_info" class="hardware-info">
              <div v-if="row.hardware_info.cpu" class="info-line">
                <strong>CPU:</strong> {{ row.hardware_info.cpu }}
              </div>
              <div v-if="row.hardware_info.memory" class="info-line">
                <strong>Memory:</strong> {{ row.hardware_info.memory }}
              </div>
              <div v-if="row.hardware_info.disk" class="info-line">
                <strong>Disk:</strong> {{ row.hardware_info.disk }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="license"
          :label="t('license.machines.license')"
          width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.license">
              {{ row.license.license_key.substring(0, 8) }}...{{ row.license.license_key.slice(-4) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="is_active"
          :label="t('license.machines.status')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? t('common.active') : t('common.inactive') }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="last_seen_at"
          :label="t('license.machines.lastSeen')"
          width="150"
        >
          <template #default="{ row }">
            <span :class="{ 'recent-activity': row.last_seen_at && new Date(row.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000) }">
              {{ formatLastSeen(row.last_seen_at) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="created_at"
          :label="t('license.machines.firstSeen')"
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
              v-if="hasPerms('license:manage') && row.is_active"
              type="warning"
              size="small"
              @click="handleUnbind(row)"
            >
              {{ t("license.machines.unbind") }}
            </el-button>
            
            <el-button
              v-if="hasPerms('license:delete')"
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

.machine-fingerprint {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #909399;
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
