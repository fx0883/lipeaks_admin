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

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      :title="
        dialogMode === 'create'
          ? t('feedback.software.createProduct')
          : t('feedback.software.productEdit')
      "
      width="700px"
      @close="handleDialogClose"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogFormData"
        :rules="dialogRules"
        label-width="120px"
      >
        <el-form-item :label="t('feedback.software.productName')" prop="name">
          <el-input
            v-model="dialogFormData.name"
            :placeholder="t('feedback.software.productNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.productCode')" prop="code">
          <el-input
            v-model="dialogFormData.code"
            :placeholder="t('feedback.software.productCodePlaceholder')"
          />
          <template #extra>
            <span class="form-tip">{{
              t("feedback.software.codeFormat")
            }}</span>
          </template>
        </el-form-item>

        <el-form-item
          :label="t('feedback.software.category')"
          prop="category_id"
        >
          <el-select
            v-model="dialogFormData.category_id"
            :placeholder="t('feedback.software.selectCategory')"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.software.description')">
          <el-input
            v-model="dialogFormData.description"
            type="textarea"
            :rows="3"
            :placeholder="t('feedback.software.descriptionPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.website')">
          <el-input
            v-model="dialogFormData.website"
            :placeholder="t('feedback.software.websitePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.owner')">
          <el-input
            v-model="dialogFormData.owner"
            :placeholder="t('feedback.software.ownerPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.team')">
          <el-input
            v-model="dialogFormData.team"
            :placeholder="t('feedback.software.teamPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.contactEmail')">
          <el-input
            v-model="dialogFormData.contact_email"
            :placeholder="t('feedback.software.emailPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.productStatus')">
          <el-select v-model="dialogFormData.status">
            <el-option label="开发中" value="development" />
            <el-option label="测试中" value="testing" />
            <el-option label="已发布" value="released" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="已废弃" value="deprecated" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.software.status')">
          <el-switch v-model="dialogFormData.is_active" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="createDialogVisible = false">
          {{ t("buttons.cancel") }}
        </el-button>
        <el-button
          type="primary"
          :loading="submitting"
          @click="handleDialogSubmit"
        >
          {{ t("buttons.confirm") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSoftwareCategories } from "@/composables/useSoftware";
import { useSoftwareList } from "@/composables/useSoftware";
import { ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useDebounceFn } from "@vueuse/core";
import { createSoftware } from "@/api/modules/feedback";
import type { FormInstance, FormRules } from "element-plus";
import type { Software, SoftwareCreateParams } from "@/types/feedback";
import { message } from "@/utils/message";

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

// 创建/编辑对话框
const createDialogVisible = ref(false);
const dialogFormRef = ref<FormInstance>();
const submitting = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);

// 对话框表单数据
const dialogFormData = reactive<SoftwareCreateParams>({
  name: "",
  code: "",
  description: "",
  category_id: 0,
  website: "",
  owner: "",
  team: "",
  contact_email: "",
  status: "development",
  is_active: true
});

// 对话框表单验证规则
const dialogRules = reactive<FormRules>({
  name: [
    {
      required: true,
      message: t("feedback.software.productNameRequired"),
      trigger: "blur"
    }
  ],
  code: [
    {
      required: true,
      message: t("feedback.software.productCodeRequired"),
      trigger: "blur"
    },
    {
      pattern: /^[a-z0-9_]+$/,
      message: t("feedback.software.codeFormatError"),
      trigger: "blur"
    }
  ],
  category_id: [
    {
      required: true,
      message: t("feedback.software.categoryRequired"),
      trigger: "change"
    }
  ],
  contact_email: [
    {
      type: "email",
      message: t("feedback.software.emailInvalid"),
      trigger: "blur"
    }
  ]
});

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
  dialogMode.value = "create";
  editingId.value = null;
  resetDialogForm();
  createDialogVisible.value = true;
};

/**
 * 对话框提交
 */
const handleDialogSubmit = async () => {
  if (!dialogFormRef.value) return;

  await dialogFormRef.value.validate(async valid => {
    if (!valid) return;

    submitting.value = true;

    try {
      let response;
      if (dialogMode.value === "create") {
        response = await createSoftware(dialogFormData);
      } else if (editingId.value) {
        const { updateSoftware } = await import("@/api/modules/feedback");
        response = await updateSoftware(editingId.value, dialogFormData);
      }

      if (response?.success && response.data) {
        message(
          dialogMode.value === "create"
            ? t("common.createSuccess")
            : t("common.updateSuccess"),
          { type: "success" }
        );
        createDialogVisible.value = false;
        fetchSoftwareList(); // 刷新列表
        resetDialogForm();
      }
    } catch (error) {
      console.error(
        dialogMode.value === "create" ? "创建失败:" : "更新失败:",
        error
      );
    } finally {
      submitting.value = false;
    }
  });
};

/**
 * 对话框关闭
 */
const handleDialogClose = () => {
  resetDialogForm();
  dialogFormRef.value?.clearValidate();
};

/**
 * 重置对话框表单
 */
const resetDialogForm = () => {
  dialogFormData.name = "";
  dialogFormData.code = "";
  dialogFormData.description = "";
  dialogFormData.category_id = 0;
  dialogFormData.website = "";
  dialogFormData.owner = "";
  dialogFormData.team = "";
  dialogFormData.contact_email = "";
  dialogFormData.status = "development";
  dialogFormData.is_active = true;
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
  dialogMode.value = "edit";
  editingId.value = software.id;

  // 填充表单数据
  dialogFormData.name = software.name;
  dialogFormData.code = software.code;
  dialogFormData.description = software.description || "";

  // 处理category字段
  if (typeof software.category === "object" && software.category !== null) {
    dialogFormData.category_id = software.category.id;
  } else {
    dialogFormData.category_id = software.category_id || software.category || 0;
  }

  dialogFormData.website = software.website || "";
  dialogFormData.owner = software.owner || "";
  dialogFormData.team = software.team || "";
  dialogFormData.contact_email = software.contact_email || "";
  dialogFormData.status = software.status;
  dialogFormData.is_active = software.is_active;

  createDialogVisible.value = true;
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

  .form-tip {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
  }
}
</style>
