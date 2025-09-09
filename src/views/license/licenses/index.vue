<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Search,
  Plus,
  Edit,
  Delete,
  View,
  Refresh,
  Key,
  CopyDocument,
  Download
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import { useUserStoreHook } from "@/store/modules/user";
import type {
  License,
  LicenseListParams,
  LicenseStatus
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
const tableLoading = computed(() => licenseStore.loading.licenseList);

// 表格数据
const licenses = computed(() => licenseStore.licenses?.data || []);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => licenseStore.licenses?.total || 0)
});

// 搜索表单
const searchForm = reactive<LicenseListParams>({
  search: "",
  product_id: undefined,
  plan_id: undefined,
  status: undefined,
  customer_id: undefined,
  page: 1,
  page_size: 10
});

// 许可证状态选项
const statusOptions = [
  { value: undefined, label: t("license.licenses.statusAll") },
  { value: "active", label: t("license.licenses.statusActive") },
  { value: "expired", label: t("license.licenses.statusExpired") },
  { value: "revoked", label: t("license.licenses.statusRevoked") },
  { value: "suspended", label: t("license.licenses.statusSuspended") }
];

// 产品选项
const productOptions = ref([]);
// 计划选项
const planOptions = ref([]);
// 客户选项
const customerOptions = ref([]);

// 多选相关
const multipleSelection = ref<License[]>([]);
const handleSelectionChange = (val: License[]) => {
  multipleSelection.value = val;
};

// 获取许可证列表
const fetchLicenses = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    const params = { ...searchForm };
    logger.debug("[LicenseIndex] 许可证列表请求参数:", params);

    await licenseStore.fetchLicenseList(params);
  } catch (error) {
    logger.error("获取许可证列表失败", error);
    ElMessage.error(t("license.licenses.fetchError"));
  }
};

// 获取产品选项
const fetchProductOptions = async () => {
  try {
    await licenseStore.fetchProductList({ page: 1, page_size: 100, is_active: true });
    productOptions.value = licenseStore.products.data.map(product => ({
      value: product.id,
      label: `${product.name} v${product.version}`
    }));
  } catch (error) {
    logger.error("获取产品选项失败", error);
  }
};

// 获取计划选项
const fetchPlanOptions = async () => {
  try {
    await licenseStore.fetchPlanList({ page: 1, page_size: 100, is_active: true });
    planOptions.value = licenseStore.plans.data.map(plan => ({
      value: plan.id,
      label: `${plan.name} (${plan.plan_type})`
    }));
  } catch (error) {
    logger.error("获取计划选项失败", error);
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchLicenses();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: "",
    product_id: undefined,
    plan_id: undefined,
    status: undefined,
    customer_id: undefined,
    page: 1,
    page_size: 10
  });
  pagination.currentPage = 1;
  fetchLicenses();
};

// 刷新
const handleRefresh = () => {
  fetchLicenses();
};

// 创建许可证
const handleCreate = () => {
  if (!hasPerms("license:create")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  router.push("/license/licenses/create");
};

// 查看详情
const handleView = (row: License) => {
  router.push(`/license/licenses/detail/${row.id}`);
};

// 编辑许可证
const handleEdit = (row: License) => {
  if (!hasPerms("license:edit")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  router.push(`/license/licenses/edit/${row.id}`);
};

// 复制许可证密钥
const handleCopyLicenseKey = (key: string) => {
  navigator.clipboard.writeText(key).then(() => {
    ElMessage.success(t("license.licenses.copySuccess"));
  }).catch(() => {
    ElMessage.error(t("license.licenses.copyError"));
  });
};

// 下载许可证文件
const handleDownloadLicense = async (row: License) => {
  if (!hasPerms("license:download")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  
  try {
    await licenseStore.downloadLicense(row.id);
    ElMessage.success(t("license.licenses.downloadSuccess"));
  } catch (error) {
    logger.error("下载许可证失败", error);
    ElMessage.error(t("license.licenses.downloadError"));
  }
};

// 撤销许可证
const handleRevokeLicense = async (row: License) => {
  if (!hasPerms("license:revoke")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      t("license.licenses.revokeConfirm", { key: row.license_key.substring(0, 8) + "..." }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    await licenseStore.revokeLicense(row.id);
    ElMessage.success(t("license.licenses.revokeSuccess"));
    await fetchLicenses();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("撤销许可证失败", error);
      ElMessage.error(t("license.licenses.revokeError"));
    }
  }
};

// 删除许可证
const handleDelete = async (row: License) => {
  if (!hasPerms("license:delete")) {
    ElMessage.error("无权限执行此操作");
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      t("license.licenses.deleteConfirm", { key: row.license_key.substring(0, 8) + "..." }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );
    
    await licenseStore.deleteLicense(row.id);
    ElMessage.success(t("license.licenses.deleteSuccess"));
    await fetchLicenses();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("删除许可证失败", error);
      ElMessage.error(t("license.licenses.deleteError"));
    }
  }
};

// 格式化许可证密钥显示
const formatLicenseKey = (key: string) => {
  return key.length > 16 ? `${key.substring(0, 8)}...${key.substring(key.length - 8)}` : key;
};

// 获取状态标签类型
const getStatusTagType = (status: LicenseStatus) => {
  const statusMap = {
    active: "success",
    expired: "warning",
    revoked: "danger",
    suspended: "info"
  };
  return statusMap[status] || "";
};

// 格式化过期时间
const formatExpiresAt = (expiresAt: string | null) => {
  if (!expiresAt) return t("license.licenses.permanent");
  
  const date = new Date(expiresAt);
  const now = new Date();
  
  if (date < now) {
    return `${date.toLocaleDateString()} (${t("license.licenses.expired")})`;
  }
  
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 7) {
    return `${date.toLocaleDateString()} (${t("license.licenses.expiringSoon", { days: diffDays })})`;
  }
  
  return date.toLocaleDateString();
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchLicenses();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchLicenses();
};

// 页面加载时获取数据
onMounted(() => {
  fetchProductOptions();
  fetchPlanOptions();
  fetchLicenses();
});
</script>

<template>
  <div class="license-management">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('license.licenses.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('license.licenses.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item :label="t('license.licenses.product')">
          <el-select
            v-model="searchForm.product_id"
            :placeholder="t('license.licenses.productPlaceholder')"
            clearable
          >
            <el-option
              v-for="option in productOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('license.licenses.plan')">
          <el-select
            v-model="searchForm.plan_id"
            :placeholder="t('license.licenses.planPlaceholder')"
            clearable
          >
            <el-option
              v-for="option in planOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="t('license.licenses.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('license.licenses.statusPlaceholder')"
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
            v-if="hasPerms('license:create')"
            type="primary"
            :icon="Plus"
            @click="handleCreate"
          >
            {{ t("license.licenses.create") }}
          </el-button>
        </div>
        
        <div class="action-right">
          <span class="total-info">
            {{ t("license.licenses.total", { count: pagination.total }) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="licenses"
        :loading="tableLoading"
        @selection-change="handleSelectionChange"
        stripe
        border
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column
          prop="id"
          :label="t('license.licenses.id')"
          width="80"
        />
        
        <el-table-column
          prop="license_key"
          :label="t('license.licenses.licenseKey')"
          min-width="180"
        >
          <template #default="{ row }">
            <div class="license-key-cell">
              <code class="license-key">{{ formatLicenseKey(row.license_key) }}</code>
              <el-button
                type="text"
                :icon="CopyDocument"
                size="small"
                @click="handleCopyLicenseKey(row.license_key)"
              />
            </div>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="product"
          :label="t('license.licenses.product')"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.product">{{ row.product.name }} v{{ row.product.version }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="plan"
          :label="t('license.licenses.plan')"
          width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.plan">{{ row.plan.name }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="status"
          :label="t('license.licenses.status')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ t(`license.licenses.status${row.status.charAt(0).toUpperCase() + row.status.slice(1)}`) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="activations_count"
          :label="t('license.licenses.activations')"
          width="100"
        >
          <template #default="{ row }">
            <span class="activation-count">
              {{ row.activations_count }}
              <span v-if="row.plan && row.plan.max_activations !== -1">
                / {{ row.plan.max_activations }}
              </span>
              <span v-else-if="row.plan && row.plan.max_activations === -1">
                / ∞
              </span>
            </span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="expires_at"
          :label="t('license.licenses.expiresAt')"
          width="150"
        >
          <template #default="{ row }">
            <span :class="{ 'expired-text': row.status === 'expired', 'expiring-text': row.expires_at && new Date(row.expires_at) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }">
              {{ formatExpiresAt(row.expires_at) }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="customer"
          :label="t('license.licenses.customer')"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.customer">{{ row.customer.name }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        
        <el-table-column
          prop="created_at"
          :label="t('license.licenses.createdAt')"
          width="160"
        >
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
          </template>
        </el-table-column>
        
        <el-table-column
          :label="t('common.actions')"
          width="260"
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
              v-if="hasPerms('license:download')"
              type="info"
              :icon="Download"
              size="small"
              @click="handleDownloadLicense(row)"
            >
              {{ t("license.licenses.download") }}
            </el-button>
            
            <el-button
              v-if="hasPerms('license:revoke') && row.status === 'active'"
              type="warning"
              size="small"
              @click="handleRevokeLicense(row)"
            >
              {{ t("license.licenses.revoke") }}
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
.license-management {
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

.license-key-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.license-key {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #409eff;
}

.activation-count {
  color: #606266;
  font-weight: 500;
}

.expired-text {
  color: #f56c6c;
}

.expiring-text {
  color: #e6a23c;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
