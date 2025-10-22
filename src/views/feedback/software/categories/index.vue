<template>
  <div class="software-categories-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t("feedback.software.categories") }}</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ t("feedback.software.createCategory") }}
      </el-button>
    </div>

    <!-- 分类列表 -->
    <el-card shadow="never" v-loading="loading">
      <el-table :data="categories" stripe style="width: 100%">
        <el-table-column
          prop="name"
          :label="t('feedback.software.categoryName')"
          min-width="150"
        />
        <el-table-column
          prop="code"
          :label="t('feedback.software.categoryCode')"
          width="150"
        />
        <el-table-column
          prop="description"
          :label="t('feedback.software.description')"
          min-width="200"
        />
        <el-table-column
          prop="software_count"
          :label="t('feedback.software.softwareCount')"
          width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag type="info">{{ row.software_count || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="sort_order"
          :label="t('feedback.software.sortOrder')"
          width="100"
          align="center"
        />
        <el-table-column
          prop="is_active"
          :label="t('feedback.software.status')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? t("common.active") : t("common.inactive") }}
            </el-tag>
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
    </el-card>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="handleDialogClose"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogFormData"
        :rules="dialogRules"
        label-width="100px"
      >
        <el-form-item :label="t('feedback.software.categoryName')" prop="name">
          <el-input
            v-model="dialogFormData.name"
            :placeholder="t('feedback.software.categoryNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.categoryCode')" prop="code">
          <el-input
            v-model="dialogFormData.code"
            :placeholder="t('feedback.software.categoryCodePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.description')">
          <el-input
            v-model="dialogFormData.description"
            type="textarea"
            :rows="3"
            :placeholder="t('feedback.software.descriptionPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.icon')">
          <el-input
            v-model="dialogFormData.icon"
            :placeholder="t('feedback.software.iconPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.sortOrder')">
          <el-input-number v-model="dialogFormData.sort_order" :min="0" />
        </el-form-item>

        <el-form-item :label="t('feedback.software.status')">
          <el-switch v-model="dialogFormData.is_active" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">{{
          t("buttons.cancel")
        }}</el-button>
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
import { ref, reactive, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useSoftwareCategories } from "@/composables/useSoftware";
import { ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type {
  SoftwareCategory,
  SoftwareCategoryCreateParams
} from "@/types/feedback";

const { t } = useI18n();

// 使用 Composable
const {
  categories,
  loading,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory
} = useSoftwareCategories(false);

// 对话框状态
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);
const submitting = ref(false);

// 对话框表单引用
const dialogFormRef = ref<FormInstance>();

// 对话框表单数据
const dialogFormData = reactive<SoftwareCategoryCreateParams>({
  name: "",
  code: "",
  description: "",
  icon: "",
  sort_order: 0,
  is_active: true
});

// 对话框标题
const dialogTitle = computed(() => {
  return dialogMode.value === "create"
    ? t("feedback.software.createCategory")
    : t("feedback.software.editCategory");
});

// 对话框表单验证规则
const dialogRules = reactive<FormRules>({
  name: [
    {
      required: true,
      message: t("feedback.software.categoryNameRequired"),
      trigger: "blur"
    }
  ],
  code: [
    {
      required: true,
      message: t("feedback.software.categoryCodeRequired"),
      trigger: "blur"
    },
    {
      pattern: /^[a-z0-9_]+$/,
      message: t("feedback.software.categoryCodeFormat"),
      trigger: "blur"
    }
  ]
});

// 页面加载时获取数据
onMounted(() => {
  fetchCategories();
});

/**
 * 创建分类
 */
const handleCreate = () => {
  dialogMode.value = "create";
  editingId.value = null;
  resetDialogForm();
  dialogVisible.value = true;
};

/**
 * 编辑分类
 */
const handleEdit = (category: SoftwareCategory) => {
  dialogMode.value = "edit";
  editingId.value = category.id;

  // 填充表单数据
  dialogFormData.name = category.name;
  dialogFormData.code = category.code;
  dialogFormData.description = category.description || "";
  dialogFormData.icon = category.icon || "";
  dialogFormData.sort_order = category.sort_order;
  dialogFormData.is_active = category.is_active;

  dialogVisible.value = true;
};

/**
 * 删除分类
 */
const handleDelete = async (category: SoftwareCategory) => {
  try {
    await ElMessageBox.confirm(
      t("feedback.software.deleteCategoryConfirm", { name: category.name }),
      t("common.warning"),
      {
        confirmButtonText: t("buttons.confirm"),
        cancelButtonText: t("buttons.cancel"),
        type: "warning"
      }
    );

    await deleteCategory(category.id);
    fetchCategories(); // 刷新列表
  } catch {
    // 用户取消
  }
};

/**
 * 对话框提交
 */
const handleDialogSubmit = async () => {
  if (!dialogFormRef.value) return;

  await dialogFormRef.value.validate(async valid => {
    if (!valid) return;

    submitting.value = true;

    let success = false;
    if (dialogMode.value === "create") {
      const result = await createCategory(dialogFormData);
      success = !!result;
    } else if (editingId.value) {
      success = await updateCategory(editingId.value, dialogFormData);
    }

    submitting.value = false;

    if (success) {
      dialogVisible.value = false;
      fetchCategories(); // 刷新列表
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
  dialogFormData.icon = "";
  dialogFormData.sort_order = 0;
  dialogFormData.is_active = true;
};
</script>

<style lang="scss" scoped>
.software-categories-container {
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
}
</style>
