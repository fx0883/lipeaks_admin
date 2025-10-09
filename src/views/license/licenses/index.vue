<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElLoading } from "element-plus";
import {
  Search,
  Plus,
  Edit,
  Delete,
  View,
  Refresh,
  Key,
  CopyDocument,
  Download,
  ArrowDown
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
  product: undefined,
  plan: undefined,
  status: undefined,
  page: 1,
  page_size: 10,
  ordering: "-issued_at"
});

// 许可证状态选项
const statusOptions = [
  { value: undefined, label: t("license.licenses.statusAll") },
  { value: "generated", label: t("license.licenses.statusGenerated") },
  { value: "activated", label: t("license.licenses.statusActivated") },
  { value: "suspended", label: t("license.licenses.statusSuspended") },
  { value: "revoked", label: t("license.licenses.statusRevoked") },
  { value: "expired", label: t("license.licenses.statusExpired") }
];

// 产品选项
const productOptions = ref([]);
// 计划选项
const planOptions = ref([]);

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
    await licenseStore.fetchProductList({
      page: 1,
      page_size: 100,
      is_active: true
    });
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
    await licenseStore.fetchPlanList({
      page: 1,
      page_size: 100,
      status: "active"
    });
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
    product: undefined,
    plan: undefined,
    status: undefined,
    page: 1,
    page_size: 10,
    ordering: "-issued_at"
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
  router.push("/license/licenses/create");
};

// 查看详情
const handleView = (row: License) => {
  router.push(`/license/licenses/${row.id}`);
};

// 编辑许可证
const handleEdit = (row: License) => {
  router.push(`/license/licenses/${row.id}/edit`);
};

// 复制许可证密钥
const handleCopyLicenseKey = (key: string) => {
  navigator.clipboard
    .writeText(key)
    .then(() => {
      ElMessage.success(t("license.licenses.copySuccess"));
    })
    .catch(() => {
      ElMessage.error(t("license.licenses.copyError"));
    });
};

// 下载许可证文件
const handleDownloadLicense = async (row: License) => {
  console.log("下载按钮被点击", { licenseId: row.id });
  logger.info("开始下载许可证", { licenseId: row.id });

  try {
    console.log("调用 licenseStore.downloadLicense", { id: row.id });
    await licenseStore.downloadLicense(row.id);
    console.log("下载完成");
    ElMessage.success(t("license.licenses.downloadSuccess"));
  } catch (error) {
    console.error("下载失败", error);
    logger.error("下载许可证失败", error);
    ElMessage.error(t("license.licenses.downloadError"));
  }
};

// 撤销许可证
const handleRevokeLicense = async (row: License) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      t("license.licenses.revokeConfirm", {
        key: row.license_key.substring(0, 8) + "..."
      }),
      t("license.licenses.revokeReason"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPlaceholder: t("license.licenses.revokeReasonPlaceholder"),
        inputType: "textarea"
      }
    );

    await licenseStore.revokeLicense(row.id, { reason: reason || "" });
    ElMessage.success(t("license.licenses.revokeSuccess"));
    await fetchLicenses();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("撤销许可证失败", error);
      ElMessage.error(t("license.licenses.revokeError"));
    }
  }
};

// 延长许可证
const handleExtendLicense = async (row: License) => {
  try {
    const { value: days } = await ElMessageBox.prompt(
      t("license.licenses.extendConfirm", {
        key: row.license_key.substring(0, 8) + "..."
      }),
      t("license.licenses.extendDays"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPlaceholder: t("license.licenses.extendDaysPlaceholder"),
        inputType: "number",
        inputPattern: /^\d+$/,
        inputErrorMessage: t("license.licenses.extendDaysError")
      }
    );

    const extendDays = parseInt(days);
    if (extendDays <= 0) {
      ElMessage.error(t("license.licenses.extendDaysInvalid"));
      return;
    }

    await licenseStore.extendLicense(row.id, extendDays);
    ElMessage.success(
      t("license.licenses.extendSuccess", { days: extendDays })
    );
    await fetchLicenses();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("延长许可证失败", error);
      ElMessage.error(t("license.licenses.extendError"));
    }
  }
};

// 删除许可证
const handleDelete = async (row: License) => {
  try {
    await ElMessageBox.confirm(
      t("license.licenses.deleteConfirm", {
        key: row.license_key.substring(0, 8) + "..."
      }),
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
  return key.length > 16
    ? `${key.substring(0, 8)}...${key.substring(key.length - 8)}`
    : key;
};

// 获取状态标签类型
const getStatusTagType = (
  status: LicenseStatus
): "success" | "info" | "warning" | "danger" => {
  const statusMap: Record<
    LicenseStatus,
    "success" | "info" | "warning" | "danger"
  > = {
    generated: "info",
    activated: "success",
    suspended: "warning",
    revoked: "danger",
    expired: "danger"
  };
  return statusMap[status] || "info";
};

// 格式化过期时间
const formatExpiresAt = (expiresAt: string | null) => {
  if (!expiresAt) return t("license.licenses.permanent");

  const date = new Date(expiresAt);
  const now = new Date();

  if (date < now) {
    return `${date.toLocaleDateString()} (${t("license.licenses.expired")})`;
  }

  const diffDays = Math.ceil(
    (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

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

// 处理更多操作
const handleMoreAction = (command: string, row: License) => {
  switch (command) {
    case "extend":
      handleExtendLicense(row);
      break;
    case "revoke":
      handleRevokeLicense(row);
      break;
    case "delete":
      handleDelete(row);
      break;
    default:
      break;
  }
};

// 批量操作处理
const handleBatchOperation = (command: string) => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("license.licenses.pleaseSelectLicenses"));
    return;
  }

  switch (command) {
    case "batch-extend":
      handleBatchExtend();
      break;
    case "batch-revoke":
      handleBatchRevoke();
      break;
    case "batch-suspend":
      handleBatchSuspend();
      break;
    case "batch-activate":
      handleBatchActivate();
      break;
    case "batch-delete":
      handleBatchDelete();
      break;
    default:
      break;
  }
};

// 批量延期许可证
const handleBatchExtend = async () => {
  try {
    const { value: days } = await ElMessageBox.prompt(
      t("license.licenses.batchExtendConfirm", {
        count: multipleSelection.value.length
      }),
      t("license.licenses.extendDays"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPattern: /^\d+$/,
        inputErrorMessage: t("license.licenses.extendDaysInvalid"),
        inputPlaceholder: t("license.licenses.enterExtendDays")
      }
    );

    const extendDays = parseInt(days);
    if (extendDays <= 0) {
      ElMessage.error(t("license.licenses.extendDaysInvalid"));
      return;
    }

    const loading = ElLoading.service({
      lock: true,
      text: t("license.licenses.batchExtending"),
      background: "rgba(0, 0, 0, 0.7)"
    });

    try {
      const licenseIds = multipleSelection.value.map(license => license.id);
      const result = await licenseStore.batchOperationLicenses({
        license_ids: licenseIds,
        operation: "extend",
        parameters: { days: extendDays }
      });

      if (result.success) {
        ElMessage.success(
          t("license.licenses.batchExtendSuccess", {
            success: result.data.results.filter(r => r.success).length,
            total: result.data.results.length
          })
        );
      } else {
        ElMessage.error(
          result.message || t("license.licenses.batchExtendFailed")
        );
      }

      await fetchLicenses();
      multipleSelection.value = [];
    } finally {
      loading.close();
    }
  } catch (error) {
    if (error !== "cancel") {
      logger.error("批量延期许可证失败", error);
      ElMessage.error(t("license.licenses.batchExtendError"));
    }
  }
};

// 批量撤销许可证
const handleBatchRevoke = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      t("license.licenses.batchRevokeConfirm", {
        count: multipleSelection.value.length
      }),
      t("license.licenses.revokeReason"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPlaceholder: t("license.licenses.enterRevokeReason")
      }
    );

    const loading = ElLoading.service({
      lock: true,
      text: t("license.licenses.batchRevoking"),
      background: "rgba(0, 0, 0, 0.7)"
    });

    try {
      const licenseIds = multipleSelection.value.map(license => license.id);
      const result = await licenseStore.batchOperationLicenses({
        license_ids: licenseIds,
        operation: "revoke",
        reason: reason || ""
      });

      if (result.success) {
        ElMessage.success(
          t("license.licenses.batchRevokeSuccess", {
            success: result.data.results.filter(r => r.success).length,
            total: result.data.results.length
          })
        );
      } else {
        ElMessage.error(
          result.message || t("license.licenses.batchRevokeFailed")
        );
      }

      await fetchLicenses();
      multipleSelection.value = [];
    } finally {
      loading.close();
    }
  } catch (error) {
    if (error !== "cancel") {
      logger.error("批量撤销许可证失败", error);
      ElMessage.error(t("license.licenses.batchRevokeError"));
    }
  }
};

// 批量暂停许可证
const handleBatchSuspend = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      t("license.licenses.batchSuspendConfirm", {
        count: multipleSelection.value.length
      }),
      t("license.licenses.suspendReason"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPlaceholder: t("license.licenses.reasonPlaceholder")
      }
    );

    const loading = ElLoading.service({
      lock: true,
      text: t("license.licenses.batchSuspending"),
      background: "rgba(0, 0, 0, 0.7)"
    });

    try {
      const licenseIds = multipleSelection.value.map(license => license.id);
      const result = await licenseStore.batchOperationLicenses({
        license_ids: licenseIds,
        operation: "suspend",
        reason: reason || ""
      });

      if (result.success) {
        ElMessage.success(
          t("license.licenses.batchSuspendSuccess", {
            count: licenseIds.length
          })
        );
      } else {
        ElMessage.error(
          result.message || t("license.licenses.batchSuspendFailed")
        );
      }

      await fetchLicenses();
      multipleSelection.value = [];
    } finally {
      loading.close();
    }
  } catch (error) {
    if (error !== "cancel") {
      logger.error("批量暂停许可证失败", error);
      ElMessage.error(t("license.licenses.batchSuspendError"));
    }
  }
};

// 批量激活许可证
const handleBatchActivate = async () => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      t("license.licenses.batchActivateConfirm", {
        count: multipleSelection.value.length
      }),
      t("license.licenses.activateReason"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        inputPlaceholder: t("license.licenses.reasonPlaceholder")
      }
    );

    const loading = ElLoading.service({
      lock: true,
      text: t("license.licenses.batchActivating"),
      background: "rgba(0, 0, 0, 0.7)"
    });

    try {
      const licenseIds = multipleSelection.value.map(license => license.id);
      const result = await licenseStore.batchOperationLicenses({
        license_ids: licenseIds,
        operation: "activate",
        reason: reason || ""
      });

      if (result.success) {
        ElMessage.success(
          t("license.licenses.batchActivateSuccess", {
            count: licenseIds.length
          })
        );
      } else {
        ElMessage.error(
          result.message || t("license.licenses.batchActivateFailed")
        );
      }

      await fetchLicenses();
      multipleSelection.value = [];
    } finally {
      loading.close();
    }
  } catch (error) {
    if (error !== "cancel") {
      logger.error("批量激活许可证失败", error);
      ElMessage.error(t("license.licenses.batchActivateError"));
    }
  }
};

// 批量删除许可证
const handleBatchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      t("license.licenses.batchDeleteConfirm", {
        count: multipleSelection.value.length
      }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning",
        dangerouslyUseHTMLString: false
      }
    );

    const loading = ElLoading.service({
      lock: true,
      text: t("license.licenses.batchDeleting"),
      background: "rgba(0, 0, 0, 0.7)"
    });

    try {
      const licenseIds = multipleSelection.value.map(license => license.id);
      const result = await licenseStore.batchDeleteLicenses(licenseIds);

      if (result.success) {
        ElMessage.success(
          t("license.licenses.batchDeleteSuccess", {
            success: result.data.results.filter(r => r.success).length,
            total: result.data.results.length
          })
        );
      } else {
        ElMessage.error(
          result.message || t("license.licenses.batchDeleteFailed")
        );
      }

      await fetchLicenses();
      multipleSelection.value = [];
    } finally {
      loading.close();
    }
  } catch (error) {
    if (error !== "cancel") {
      logger.error("批量删除许可证失败", error);
      ElMessage.error(t("license.licenses.batchDeleteError"));
    }
  }
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
            v-model="searchForm.product"
            :placeholder="t('license.licenses.productPlaceholder')"
            class="filter-select"
            clearable
            @change="handleSearch"
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
            v-model="searchForm.plan"
            :placeholder="t('license.licenses.planPlaceholder')"
            class="filter-select"
            clearable
            @change="handleSearch"
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
            class="filter-select"
            clearable
            @change="handleSearch"
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
          <el-button type="primary" :icon="Plus" @click="handleCreate">
            {{ t("license.licenses.create") }}
          </el-button>

          <!-- 批量操作按钮 -->
          <el-dropdown
            v-if="multipleSelection.length > 0"
            trigger="click"
            @command="handleBatchOperation"
          >
            <el-button type="warning">
              {{ t("license.licenses.batchOperation") }} ({{
                multipleSelection.length
              }})
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="batch-extend">
                  {{ t("license.licenses.batchExtend") }}
                </el-dropdown-item>
                <el-dropdown-item command="batch-suspend">
                  {{ t("license.licenses.batchSuspend") }}
                </el-dropdown-item>
                <el-dropdown-item command="batch-activate">
                  {{ t("license.licenses.batchActivate") }}
                </el-dropdown-item>
                <el-dropdown-item command="batch-revoke">
                  {{ t("license.licenses.batchRevoke") }}
                </el-dropdown-item>
                <el-dropdown-item command="batch-delete" divided>
                  {{ t("license.licenses.batchDelete") }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
        stripe
        border
        @selection-change="handleSelectionChange"
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
              <code class="license-key">{{
                formatLicenseKey(row.license_key)
              }}</code>
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
          prop="product_name"
          :label="t('license.licenses.product')"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.product_name">{{ row.product_name }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="plan_name"
          :label="t('license.licenses.plan')"
          width="120"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.plan_name">{{ row.plan_name }}</span>
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
              {{
                t(
                  `license.licenses.status${row.status.charAt(0).toUpperCase() + row.status.slice(1)}`
                )
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="current_activations"
          :label="t('license.licenses.activations')"
          width="100"
        >
          <template #default="{ row }">
            <span class="activation-count">
              {{ row.current_activations }}
              <span v-if="row.max_activations !== -1">
                / {{ row.max_activations }}
              </span>
              <span v-else-if="row.max_activations === -1"> / ∞ </span>
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="expires_at"
          :label="t('license.licenses.expiresAt')"
          width="150"
        >
          <template #default="{ row }">
            <span
              :class="{
                'expired-text': row.status === 'expired',
                'expiring-text':
                  row.expires_at &&
                  new Date(row.expires_at) <=
                    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              }"
            >
              {{ formatExpiresAt(row.expires_at) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="customer_name"
          :label="t('license.licenses.customer')"
          min-width="150"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <div v-if="row.customer_name">
              <div>{{ row.customer_name }}</div>
              <div v-if="row.customer_email" class="customer-email">
                {{ row.customer_email }}
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('common.actions')" width="260" fixed="right">
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
              type="info"
              :icon="Download"
              size="small"
              @click="handleDownloadLicense(row)"
            >
              {{ t("license.licenses.download") }}
            </el-button>

            <el-dropdown @command="command => handleMoreAction(command, row)">
              <el-button type="primary" size="small">
                {{ t("common.more") }}
                <el-icon class="el-icon--right">
                  <arrow-down />
                </el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item
                    command="extend"
                    :disabled="row.status !== 'activated'"
                  >
                    {{ t("license.licenses.extend") }}
                  </el-dropdown-item>
                  <el-dropdown-item
                    command="revoke"
                    :disabled="row.status !== 'activated'"
                  >
                    {{ t("license.licenses.revoke") }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" divided>
                    {{ t("common.delete") }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
  font-family: "Courier New", monospace;
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

.customer-email {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 过滤控件样式 */
.filter-select {
  width: 200px;
}
</style>
