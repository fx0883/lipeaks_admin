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
  Refresh
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import { useUserStoreHook } from "@/store/modules/user";
import type { SoftwareProduct, ProductListParams } from "@/types/license";
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

// 如果没有权限，显示无权限提示
if (!checkPermission()) {
  ElMessage.error("无权限访问此页面");
  router.push("/dashboard");
}

// 表格加载状态
const tableLoading = computed(() => licenseStore.loading.productList);

// 表格数据
const products = computed(() => licenseStore.products.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => licenseStore.products.total)
});

// 搜索表单
const searchForm = reactive<ProductListParams>({
  search: "",
  is_active: undefined,
  page: 1,
  page_size: 10
});

// 状态选项
const statusOptions = [
  { value: undefined, label: t("license.products.statusAll") },
  { value: true, label: t("license.products.statusActive") },
  { value: false, label: t("license.products.statusInactive") }
];

// 多选相关
const multipleSelection = ref<SoftwareProduct[]>([]);
const handleSelectionChange = (val: SoftwareProduct[]) => {
  multipleSelection.value = val;
};

// 防止重复请求的标志
const isLoading = ref(false);

// 获取产品列表
const fetchProducts = async () => {
  // 防止重复请求
  if (isLoading.value || licenseStore.loading.productList) {
    logger.debug("[ProductIndex] 请求正在进行中，跳过重复调用");
    return;
  }

  try {
    isLoading.value = true;
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    const params = { ...searchForm };
    logger.debug("[ProductIndex] 产品列表请求参数:", params);

    await licenseStore.fetchProductList(params);
  } catch (error) {
    logger.error("获取产品列表失败", error);
    ElMessage.error(t("license.products.fetchError"));
  } finally {
    isLoading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchProducts();
};

// 重置搜索
const handleResetSearch = () => {
  Object.assign(searchForm, {
    search: "",
    is_active: undefined,
    page: 1,
    page_size: 10
  });
  pagination.currentPage = 1;
  fetchProducts();
};

// 刷新
const handleRefresh = () => {
  fetchProducts();
};

// 创建产品
const handleCreate = () => {
  router.push("/license/products/create");
};

// 查看详情
const handleView = (row: SoftwareProduct) => {
  router.push(`/license/products/${row.id}`);
};

// 编辑产品
const handleEdit = (row: SoftwareProduct) => {
  router.push(`/license/products/${row.id}/edit`);
};

// 删除产品
const handleDelete = async (row: SoftwareProduct) => {
  try {
    await ElMessageBox.confirm(
      t("license.products.deleteConfirm", { name: row.name }),
      t("common.warning"),
      {
        confirmButtonText: t("common.confirm"),
        cancelButtonText: t("common.cancel"),
        type: "warning"
      }
    );

    await licenseStore.deleteProduct(row.id);
    ElMessage.success(t("license.products.deleteSuccess"));
    await fetchProducts();
  } catch (error) {
    if (error !== "cancel") {
      logger.error("删除产品失败", error);
      ElMessage.error(t("license.products.deleteError"));
    }
  }
};

// 分页变化
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  fetchProducts();
};

const handleCurrentChange = (page: number) => {
  pagination.currentPage = page;
  fetchProducts();
};

// 页面加载时获取数据
onMounted(() => {
  fetchProducts();
});
</script>

<template>
  <div class="product-management">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="searchForm" inline>
        <el-form-item :label="t('license.products.search')">
          <el-input
            v-model="searchForm.search"
            :placeholder="t('license.products.searchPlaceholder')"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>

        <el-form-item :label="t('license.products.status')">
          <el-select
            v-model="searchForm.is_active"
            :placeholder="t('license.products.statusPlaceholder')"
            clearable
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
            {{ t("license.products.create") }}
          </el-button>
        </div>

        <div class="action-right">
          <span class="total-info">
            {{ t("license.products.total", { count: pagination.total }) }}
          </span>
        </div>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-card">
      <el-table
        :data="products"
        :loading="tableLoading"
        stripe
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          prop="name"
          :label="t('license.products.name')"
          min-width="75"
          show-overflow-tooltip
        />

        <el-table-column
          prop="version"
          :label="t('license.products.version')"
          width="120"
        />

        <el-table-column
          prop="code"
          :label="t('license.products.productCode')"
          width="200"
          show-overflow-tooltip
        />

        <el-table-column
          prop="status"
          :label="t('license.products.status')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'">
              {{
                row.status === "active"
                  ? t("common.active")
                  : t("common.inactive")
              }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column
          prop="created_at"
          :label="t('license.products.createdAt')"
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
.product-management {
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

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
