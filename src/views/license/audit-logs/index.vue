<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Search,
  Refresh,
  View,
  Document,
  Filter
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import { useUserStoreHook } from "@/store/modules/user";
import type {
  AuditLog,
  AuditLogListParams,
  AuditAction
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
const tableLoading = computed(() => licenseStore.loading.auditLogList);

// 表格数据
const auditLogs = computed(() => licenseStore.auditLogs.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 20,
  total: computed(() => licenseStore.auditLogs.total)
});

// 搜索表单
const searchForm = reactive<AuditLogListParams>({
  search: "",
  action: undefined,
  resource_type: undefined,
  user_id: undefined,
  start_date: undefined,
  end_date: undefined,
  page: 1,
  page_size: 20
});

// 操作类型选项
const actionOptions = [
  { value: undefined, label: t("license.auditLogs.actionAll") },
  { value: "create", label: t("license.auditLogs.actionCreate") },
  { value: "update", label: t("license.auditLogs.actionUpdate") },
  { value: "delete", label: t("license.auditLogs.actionDelete") },
  { value: "activate", label: t("license.auditLogs.actionActivate") },
  { value: "deactivate", label: t("license.auditLogs.actionDeactivate") },
  { value: "revoke", label: t("license.auditLogs.actionRevoke") },
  { value: "bind", label: t("license.auditLogs.actionBind") },
  { value: "unbind", label: t("license.auditLogs.actionUnbind") },
  { value: "view", label: t("license.auditLogs.actionView") },
  { value: "download", label: t("license.auditLogs.actionDownload") }
];

// 资源类型选项
const resourceTypeOptions = [
  { value: undefined, label: t("license.auditLogs.resourceAll") },
  { value: "product", label: t("license.auditLogs.resourceProduct") },
  { value: "plan", label: t("license.auditLogs.resourcePlan") },
  { value: "license", label: t("license.auditLogs.resourceLicense") },
  { value: "activation", label: t("license.auditLogs.resourceActivation") },
  { value: "machine", label: t("license.auditLogs.resourceMachine") }
];

// 用户选项
const userOptions = ref([]);

// 获取审计日志列表
const fetchAuditLogs = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    const params = { ...searchForm };
    logger.debug("[AuditLogIndex] 审计日志列表请求参数:", params);

    await licenseStore.fetchAuditLogList(params);
  } catch (error) {
    logger.error("获取审计日志列表失败", error);
    ElMessage.error(t("license.auditLogs.fetchError"));
  }
};

// 获取用户选项
const fetchUserOptions = async () => {
  try {
    // 假设有获取用户列表的方法
    // await userStore.fetchUserList({ page: 1, page_size: 100 });
    // userOptions.value = userStore.users.data.map(user => ({
    //   value: user.id,
    //   label: user.username || user.email
    // }));
  } catch (error) {
    logger.error("获取用户选项失败", error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchAuditLogs();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: "",
    action: undefined,
    resource_type: undefined,
    user_id: undefined,
    start_date: undefined,
    end_date: undefined,
    page: 1,
    page_size: 20
  });
  pagination.currentPage = 1;
  fetchAuditLogs();
};

// 刷新
const handleRefresh = () => {
  fetchAuditLogs();
};

// 查看详情
const handleView = (row: AuditLog) => {
  router.push(`/license/audit-logs/detail/${row.id}`);
};

// 获取操作类型标签类型
const getActionTagType = (action: AuditAction) => {
  const actionMap = {
    create: "success",
    update: "warning",
    delete: "danger",
    activate: "success",
    deactivate: "info",
    revoke: "danger",
    bind: "success",
    unbind: "warning",
    view: "",
    download: "info"
  };
  return actionMap[action] || "";
};

// 获取资源类型图标
const getResourceTypeIcon = (resourceType: string) => {
  const iconMap = {
    product: "ri:box-3-line",
    plan: "ri:vip-crown-line", 
    license: "ri:key-line",
    activation: "ri:shield-check-line",
    machine: "ri:computer-line"
  };
  return iconMap[resourceType] || "ri:file-line";
};

// 格式化IP地址
const formatIpAddress = (ip: string | null) => {
  if (!ip) return "-";
  return ip;
};

// 格式化用户代理
const formatUserAgent = (userAgent: string | null) => {
  if (!userAgent) return "-";
  
  // 简化用户代理显示
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Edge")) return "Edge";
  
  return userAgent.length > 50 ? userAgent.substring(0, 50) + "..." : userAgent;
};

// 格式化变更数据
const formatChanges = (changes: Record<string, any> | null) => {
  if (!changes || Object.keys(changes).length === 0) return "-";
  
  const changeCount = Object.keys(changes).length;
  return t("license.auditLogs.changesCount", { count: changeCount });
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchAuditLogs();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchAuditLogs();
};

// 页面加载时获取数据
onMounted(() => {
  fetchUserOptions();
  fetchAuditLogs();
});
</script>

<template>
  <div class="audit-log-management">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('license.auditLogs.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('license.auditLogs.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item :label="t('license.auditLogs.action')">
          <el-select
            v-model="searchForm.action"
            :placeholder="t('license.auditLogs.actionPlaceholder')"
            clearable
          >
            <el-option
              v-for="option in actionOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('license.auditLogs.resourceType')">
          <el-select
            v-model="searchForm.resource_type"
            :placeholder="t('license.auditLogs.resourceTypePlaceholder')"
            clearable
          >
            <el-option
              v-for="option in resourceTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('license.auditLogs.dateRange')">
          <el-date-picker
            v-model="searchForm.start_date"
            type="datetime"
            :placeholder="t('license.auditLogs.startDate')"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        
        <el-form-item>
          <el-date-picker
            v-model="searchForm.end_date"
            type="datetime"
            :placeholder="t('license.auditLogs.endDate')"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
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
          <el-tag type="info" :icon="Document">
            {{ t("license.auditLogs.description") }}
          </el-tag>
        </div>
        
        <div class="action-right">
          <span class="total-info">
            {{ t("license.auditLogs.total", { count: pagination.total }) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="auditLogs"
        :loading="tableLoading"
        stripe
        border
      >
        <el-table-column
          prop="id"
          :label="t('license.auditLogs.id')"
          width="80"
        />
        
        <el-table-column
          prop="action"
          :label="t('license.auditLogs.action')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getActionTagType(row.action)">
              {{ t(`license.auditLogs.action${row.action.charAt(0).toUpperCase() + row.action.slice(1)}`) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="resource_type"
          :label="t('license.auditLogs.resourceType')"
          width="120"
        >
          <template #default="{ row }">
            <div class="resource-type-cell">
              <el-icon class="resource-icon">
                <component :is="getResourceTypeIcon(row.resource_type)" />
              </el-icon>
              <span>{{ t(`license.auditLogs.resource${row.resource_type.charAt(0).toUpperCase() + row.resource_type.slice(1)}`) }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="resource_id"
          :label="t('license.auditLogs.resourceId')"
          width="100"
        >
          <template #default="{ row }">
            <span v-if="row.resource_id">{{ row.resource_id }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="description"
          :label="t('license.auditLogs.description')"
          min-width="250"
          show-overflow-tooltip
        />
        
        <el-table-column
          prop="user"
          :label="t('license.auditLogs.user')"
          width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.user">{{ row.user.username || row.user.email }}</span>
            <span v-else class="system-user">{{ t("license.auditLogs.system") }}</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="ip_address"
          :label="t('license.auditLogs.ipAddress')"
          width="140"
        >
          <template #default="{ row }">
            {{ formatIpAddress(row.ip_address) }}
          </template>
        </el-table-column>
        
        <el-table-column
          prop="user_agent"
          :label="t('license.auditLogs.userAgent')"
          width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ formatUserAgent(row.user_agent) }}
          </template>
        </el-table-column>
        
        <el-table-column
          prop="changes"
          :label="t('license.auditLogs.changes')"
          width="100"
        >
          <template #default="{ row }">
            <span class="changes-info">{{ formatChanges(row.changes) }}</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="metadata"
          :label="t('license.auditLogs.metadata')"
          width="100"
        >
          <template #default="{ row }">
            <span v-if="row.metadata && Object.keys(row.metadata).length > 0" class="metadata-badge">
              {{ Object.keys(row.metadata).length }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="created_at"
          :label="t('license.auditLogs.createdAt')"
          width="160"
          sortable
        >
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        
        <el-table-column
          :label="t('common.actions')"
          width="120"
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
.audit-log-management {
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

.resource-type-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.resource-icon {
  font-size: 16px;
  color: #409eff;
}

.system-user {
  color: #909399;
  font-style: italic;
}

.changes-info {
  color: #e6a23c;
  font-size: 12px;
  font-weight: 500;
}

.metadata-badge {
  display: inline-block;
  background: #f0f9ff;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
