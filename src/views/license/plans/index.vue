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
  Money
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import { useUserStoreHook } from "@/store/modules/user";
import type { LicensePlan, PlanListParams, PlanType } from "@/types/license";
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
const tableLoading = computed(() => licenseStore.loading.planList);

// 表格数据
const plans = computed(() => licenseStore.plans.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => licenseStore.plans.total)
});

// 搜索表单
const searchForm = reactive<PlanListParams>({
  search: "",
  product: undefined,
  plan_type: undefined,
  status: undefined,
  page: 1,
  page_size: 10
});

// 计划类型选项
const planTypeOptions = [
  { value: undefined, label: t("license.plans.typeAll") },
  { value: "trial", label: t("license.plans.typeTrial") },
  { value: "basic", label: t("license.plans.typeBasic") },
  { value: "professional", label: t("license.plans.typeProfessional") },
  { value: "enterprise", label: t("license.plans.typeEnterprise") },
  { value: "custom", label: t("license.plans.typeCustom") }
];

// 状态选项
const statusOptions = [
  { value: undefined, label: t("license.plans.statusAll") },
  { value: "active", label: t("license.plans.statusActive") },
  { value: "inactive", label: t("license.plans.statusInactive") }
];

// 产品选项
const productOptions = ref([]);

// 多选相关
const multipleSelection = ref<LicensePlan[]>([]);
const handleSelectionChange = (val: LicensePlan[]) => {
  multipleSelection.value = val;
};

// 获取计划列表
const fetchPlans = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    // 过滤掉 undefined 和空字符串，只传递有效的搜索参数
    const params: Record<string, any> = {};
    Object.keys(searchForm).forEach(key => {
      const value = searchForm[key as keyof typeof searchForm];
      if (value !== undefined && value !== null && value !== "") {
        params[key] = value;
      }
    });

    logger.debug("[PlanIndex] 计划列表请求参数:", params);

    await licenseStore.fetchPlanList(params);
  } catch (error) {
    logger.error("获取计划列表失败", error);
    ElMessage.error(t("license.plans.fetchError"));
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

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchPlans();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: "",
    product: undefined,
    plan_type: undefined,
    status: undefined,
    page: 1,
    page_size: 10
  });
  pagination.currentPage = 1;
  fetchPlans();
};

// 刷新
const handleRefresh = () => {
  fetchPlans();
};

// 创建计划
const handleCreate = () => {
  router.push("/license/plans/create");
};

// 查看详情
const handleView = (row: LicensePlan) => {
  router.push(`/license/plans/${row.id}`);
};

// 编辑计划
const handleEdit = (row: LicensePlan) => {
  router.push(`/license/plans/${row.id}/edit`);
};

// 删除计划
const handleDelete = async (row: LicensePlan) => {
  try {
    await ElMessageBox.confirm(
      t("license.plans.deleteConfirm", { name: row.name }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );

    await licenseStore.deletePlan(row.id);
    ElMessage.success(t("license.plans.deleteSuccess"));
    await fetchPlans();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("删除计划失败", error);
      ElMessage.error(t("license.plans.deleteError"));
    }
  }
};

// 格式化价格
const formatPrice = (price: string, currency: string = "USD") => {
  return `${currency} ${price}`;
};

// 格式化特性
const formatFeatures = (features?: Record<string, any>) => {
  if (!features || typeof features !== "object") return "-";
  const featuresList = Object.keys(features);
  if (featuresList.length === 0) return "-";
  return (
    featuresList.slice(0, 3).join(", ") + (featuresList.length > 3 ? "..." : "")
  );
};

// 格式化持续时间
const formatDuration = (days: number) => {
  if (days === 0) return t("license.plans.unlimited");
  if (days === 1) return t("license.plans.oneDay");
  if (days === 7) return t("license.plans.oneWeek");
  if (days === 30) return t("license.plans.oneMonth");
  if (days === 365) return t("license.plans.oneYear");
  return t("license.plans.daysCount", { count: days });
};

// 获取计划类型标签类型
const getPlanTypeTagType = (
  type: PlanType
): "success" | "info" | "warning" | "danger" | undefined => {
  const typeMap: Record<
    PlanType,
    "success" | "info" | "warning" | "danger" | undefined
  > = {
    trial: undefined,
    basic: "success",
    professional: "warning",
    enterprise: "danger",
    custom: "info"
  };
  return typeMap[type] || undefined;
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchPlans();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchPlans();
};

// 页面加载时获取数据
onMounted(() => {
  fetchProductOptions();
  fetchPlans();
});
</script>

<template>
  <div class="plan-management">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('license.plans.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('license.plans.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item :label="t('license.plans.product')">
          <el-select
            v-model="searchForm.product"
            :placeholder="t('license.plans.productPlaceholder')"
            clearable
            style="width: 240px"
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

        <el-form-item :label="t('license.plans.type')">
          <el-select
            v-model="searchForm.plan_type"
            :placeholder="t('license.plans.typePlaceholder')"
            clearable
            style="width: 160px"
            @change="handleSearch"
          >
            <el-option
              v-for="option in planTypeOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('license.plans.status')">
          <el-select
            v-model="searchForm.status"
            :placeholder="t('license.plans.statusPlaceholder')"
            clearable
            style="width: 140px"
            @change="handleSearch"
          >
            <el-option
              v-for="option in statusOptions"
              :key="String(option.value)"
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
            {{ t("license.plans.create") }}
          </el-button>
        </div>

        <div class="action-right">
          <span class="total-info">
            {{ t("license.plans.total", { count: pagination.total }) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="plans"
        :loading="tableLoading"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          prop="name"
          :label="t('license.plans.name')"
          min-width="150"
          show-overflow-tooltip
        />

        <el-table-column
          prop="code"
          :label="t('license.plans.code')"
          width="120"
          show-overflow-tooltip
        />

        <el-table-column
          prop="plan_type"
          :label="t('license.plans.type')"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getPlanTypeTagType(row.plan_type)">
              {{
                t(
                  `license.plans.type${row.plan_type.charAt(0).toUpperCase() + row.plan_type.slice(1)}`
                )
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="product_name"
          :label="t('license.plans.product')"
          width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <span v-if="row.product_name">{{ row.product_name }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="default_max_activations"
          :label="t('license.plans.defaultMaxActivations')"
          width="140"
        >
          <template #default="{ row }">
            <span v-if="row.default_max_activations === -1">{{
              t("license.plans.unlimited")
            }}</span>
            <span v-else>{{ row.default_max_activations }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="default_validity_days"
          :label="t('license.plans.defaultValidityDays')"
          width="140"
        >
          <template #default="{ row }">
            {{ formatDuration(row.default_validity_days) }}
          </template>
        </el-table-column>

        <el-table-column
          prop="price"
          :label="t('license.plans.price')"
          width="120"
        >
          <template #default="{ row }">
            <span class="price-text">
              <el-icon><Money /></el-icon>
              {{ formatPrice(row.price, row.currency) }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="features"
          :label="t('license.plans.features')"
          min-width="200"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            <el-tooltip
              v-if="row.features && Object.keys(row.features).length > 0"
              :content="JSON.stringify(row.features, null, 2)"
              placement="top"
            >
              <span>{{ formatFeatures(row.features) }}</span>
            </el-tooltip>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="status"
          :label="t('license.plans.status')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{
                row.status === "active"
                  ? t("license.plans.active")
                  : t("license.plans.inactive")
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="created_at"
          :label="t('license.plans.createdAt')"
          width="160"
        >
          <template #default="{ row }">
            {{ new Date(row.created_at).toLocaleString() }}
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
              type="warning"
              :icon="Edit"
              size="small"
              @click="handleEdit(row)"
            >
              {{ t("common.edit") }}
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
.plan-management {
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

.price-text {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e6a23c;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
