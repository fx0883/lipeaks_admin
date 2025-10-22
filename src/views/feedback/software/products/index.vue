<template>
  <div class="software-products-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t("feedback.software.products") }}</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ t("feedback.software.createProduct") }}
      </el-button>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item :label="t('feedback.filters.category')">
          <el-select
            v-model="filterCategoryId"
            :placeholder="t('feedback.filters.allCategories')"
            clearable
            @change="handleFilterChange"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.filters.status')">
          <el-select
            v-model="filterStatus"
            :placeholder="t('feedback.filters.allStatuses')"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="开发中" value="development" />
            <el-option label="测试中" value="testing" />
            <el-option label="已发布" value="released" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="已废弃" value="deprecated" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="searchText"
            :placeholder="t('feedback.filters.search')"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <IconifyIconOffline :icon="Search" />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 产品列表 -->
    <el-card shadow="never" v-loading="loading">
      <el-table :data="softwareList" stripe style="width: 100%">
        <el-table-column
          prop="name"
          :label="t('feedback.software.productName')"
          min-width="180"
        >
          <template #default="{ row }">
            <div class="product-name-cell">
              <el-avatar v-if="row.logo" :src="row.logo" :size="32" />
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          prop="code"
          :label="t('feedback.software.productCode')"
          width="150"
        />
        <el-table-column
          prop="category_name"
          :label="t('feedback.software.category')"
          width="120"
        />
        <el-table-column
          prop="current_version"
          :label="t('feedback.software.currentVersion')"
          width="120"
        >
          <template #default="{ row }">
            <el-tag v-if="row.current_version" type="primary" size="small">
              {{ row.current_version }}
            </el-tag>
            <span v-else class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          :label="t('feedback.software.productStatus')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="total_feedbacks"
          :label="t('feedback.software.feedbackCount')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <span class="feedback-count">{{ row.total_feedbacks || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="version_count"
          :label="t('feedback.software.versionCount')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <span class="version-count">{{ row.version_count || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column
          :label="t('buttons.actions')"
          width="200"
          fixed="right"
        >
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewDetail(row.id)"
            >
              {{ t("buttons.view") }}
            </el-button>
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              {{ t("buttons.edit") }}
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              {{ t("buttons.delete") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 创建对话框（简化版） -->
    <el-dialog
      v-model="createDialogVisible"
      :title="t('feedback.software.createProduct')"
      width="700px"
    >
      <el-alert type="info" :closable="false" style="margin-bottom: 20px">
        {{ t("feedback.software.createProductTip") }}
      </el-alert>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSoftwareCategories } from "@/composables/useSoftware";
import { useSoftwareList } from "@/composables/useSoftware";
import { ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useDebounceFn } from "@vueuse/core";
import type { Software } from "@/types/feedback";

const Search = "ep:search";

const { t } = useI18n();
const router = useRouter();

// 获取分类列表
const { categories } = useSoftwareCategories(true);

// 使用软件列表 Composable
const {
  softwareList,
  loading,
  pagination,
  params,
  fetchSoftwareList,
  updateParams,
  changePage,
  deleteSoftwareItem
} = useSoftwareList();

// 筛选器状态
const filterCategoryId = ref<number | null>(null);
const filterStatus = ref<string>("");
const searchText = ref("");

// 创建对话框
const createDialogVisible = ref(false);

// 页面加载时获取数据
onMounted(() => {
  fetchSoftwareList();
});

/**
 * 处理筛选器变化
 */
const handleFilterChange = () => {
  updateParams({
    category: filterCategoryId.value || undefined,
    status: (filterStatus.value as any) || undefined,
    search: searchText.value || undefined
  });
};

/**
 * 处理搜索（带防抖）
 */
const handleSearch = useDebounceFn(() => {
  handleFilterChange();
}, 300);

/**
 * 处理分页变化
 */
const handlePageChange = (page: number) => {
  changePage(page);
};

/**
 * 处理每页大小变化
 */
const handleSizeChange = (size: number) => {
  params.page_size = size;
  params.page = 1;
  fetchSoftwareList();
};

/**
 * 创建产品
 */
const handleCreate = () => {
  router.push("/feedback/software/products/create");
};

/**
 * 查看详情
 */
const handleViewDetail = (id: number) => {
  router.push(`/feedback/software/products/detail/${id}`);
};

/**
 * 编辑产品
 */
const handleEdit = (software: Software) => {
  router.push(`/feedback/software/products/edit/${software.id}`);
};

/**
 * 删除产品
 */
const handleDelete = async (software: Software) => {
  try {
    await ElMessageBox.confirm(
      t("feedback.software.deleteProductConfirm", { name: software.name }),
      t("common.warning"),
      {
        confirmButtonText: t("buttons.confirm"),
        cancelButtonText: t("buttons.cancel"),
        type: "warning"
      }
    );

    await deleteSoftwareItem(software.id);
  } catch {
    // 用户取消
  }
};

/**
 * 获取状态标签颜色
 */
const getStatusTag = (status: string) => {
  const statusMap: Record<string, any> = {
    development: "info",
    testing: "warning",
    released: "success",
    maintenance: "primary",
    deprecated: "danger"
  };
  return statusMap[status] || "info";
};

/**
 * 获取状态标签文本
 */
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    development: "开发中",
    testing: "测试中",
    released: "已发布",
    maintenance: "维护中",
    deprecated: "已废弃"
  };
  return statusLabels[status] || status;
};
</script>

<style lang="scss" scoped>
.software-products-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .product-name-cell {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .feedback-count,
  .version-count {
    font-weight: 600;
    color: #409eff;
  }

  .text-gray {
    color: #c0c4cc;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
