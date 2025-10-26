<template>
  <div class="email-templates-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t("feedback.email.templates") }}</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ t("feedback.email.createTemplate") }}
      </el-button>
    </div>

    <!-- 模板列表 -->
    <el-card shadow="never" v-loading="loading">
      <el-table :data="templates" stripe style="width: 100%">
        <el-table-column
          prop="name"
          :label="t('feedback.email.templateName')"
          min-width="180"
        />
        <el-table-column
          prop="template_type"
          :label="t('feedback.email.templateType')"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getTemplateTypeTag(row.template_type)" size="small">
              {{ getTemplateTypeLabel(row.template_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="subject"
          :label="t('feedback.email.subject')"
          min-width="200"
        />
        <el-table-column
          prop="is_active"
          :label="t('feedback.email.status')"
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
          prop="updated_at"
          :label="t('feedback.email.updatedAt')"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.updated_at) }}
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
      width="800px"
      @close="handleDialogClose"
    >
      <el-form
        ref="dialogFormRef"
        :model="dialogFormData"
        :rules="dialogRules"
        label-width="120px"
      >
        <el-form-item :label="t('feedback.email.templateName')" prop="name">
          <el-input
            v-model="dialogFormData.name"
            :placeholder="t('feedback.email.templateNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item
          :label="t('feedback.email.templateType')"
          prop="template_type"
        >
          <el-select
            v-model="dialogFormData.template_type"
            :placeholder="t('feedback.email.selectTemplateType')"
          >
            <el-option label="回复通知" value="reply" />
            <el-option label="状态变更" value="status_change" />
            <el-option label="邮箱验证" value="verification" />
            <el-option label="每日摘要" value="summary" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.email.subject')" prop="subject">
          <el-input
            v-model="dialogFormData.subject"
            :placeholder="t('feedback.email.subjectPlaceholder')"
          />
          <template #extra>
            <span class="form-tip">{{ t("feedback.email.variableTip") }}</span>
          </template>
        </el-form-item>

        <el-form-item
          :label="t('feedback.email.bodyTemplate')"
          prop="body_html"
        >
          <el-input
            v-model="dialogFormData.body_html"
            type="textarea"
            :rows="12"
            :placeholder="t('feedback.email.bodyPlaceholder')"
          />
          <template #extra>
            <div class="variables-tip">
              <p>{{ t("feedback.email.availableVariables") }}:</p>
              <el-tag size="small" class="variable-tag"
                >{'{{ user_name }}'}</el-tag
              >
              <el-tag size="small" class="variable-tag"
                >{'{{ feedback_title }}'}</el-tag
              >
              <el-tag size="small" class="variable-tag"
                >{'{{ software_name }}'}</el-tag
              >
              <el-tag size="small" class="variable-tag"
                >{'{{ reply_content }}'}</el-tag
              >
            </div>
          </template>
        </el-form-item>

        <el-form-item :label="t('feedback.email.status')">
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
import {
  getEmailTemplateList,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate
} from "@/api/modules/feedback";
import { ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance, FormRules } from "element-plus";
import type {
  EmailTemplate,
  EmailTemplateCreateParams,
  EmailTemplateType
} from "@/types/feedback";
import { message } from "@/utils/message";
import dayjs from "dayjs";

const { t } = useI18n();

// 数据状态
const templates = ref<EmailTemplate[]>([]);
const loading = ref(false);

// 对话框状态
const dialogVisible = ref(false);
const dialogMode = ref<"create" | "edit">("create");
const editingId = ref<number | null>(null);
const submitting = ref(false);

// 对话框表单引用
const dialogFormRef = ref<FormInstance>();

// 对话框表单数据
const dialogFormData = reactive<EmailTemplateCreateParams>({
  template_type: "reply",
  name: "",
  subject: "",
  body_html: "",
  is_active: true
});

// 对话框标题
const dialogTitle = computed(() => {
  return dialogMode.value === "create"
    ? t("feedback.email.createTemplate")
    : t("feedback.email.editTemplate");
});

// 对话框表单验证规则
const dialogRules = reactive<FormRules>({
  template_type: [
    {
      required: true,
      message: t("feedback.email.templateTypeRequired"),
      trigger: "change"
    }
  ],
  name: [
    {
      required: true,
      message: t("feedback.email.templateNameRequired"),
      trigger: "blur"
    }
  ],
  subject: [
    {
      required: true,
      message: t("feedback.email.subjectRequired"),
      trigger: "blur"
    }
  ],
  body_html: [
    {
      required: true,
      message: t("feedback.email.bodyRequired"),
      trigger: "blur"
    }
  ]
});

/**
 * 获取模板列表
 */
const fetchTemplates = async () => {
  loading.value = true;

  try {
    const response = await getEmailTemplateList();

    if (response.success && response.data) {
      // 处理多种数据格式
      if (Array.isArray(response.data)) {
        templates.value = response.data;
      } else if (
        response.data.results &&
        Array.isArray(response.data.results)
      ) {
        templates.value = response.data.results;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        templates.value = response.data.data;
      } else if (response.data.id) {
        // 如果返回的是单个对象，包装成数组
        templates.value = [response.data];
      } else {
        templates.value = [];
      }
    }
  } catch (error) {
    console.error("获取邮件模板失败:", error);
    templates.value = [];
  } finally {
    loading.value = false;
  }
};

/**
 * 创建模板
 */
const handleCreate = () => {
  dialogMode.value = "create";
  editingId.value = null;
  resetDialogForm();
  dialogVisible.value = true;
};

/**
 * 编辑模板
 */
const handleEdit = (template: EmailTemplate) => {
  dialogMode.value = "edit";
  editingId.value = template.id;

  dialogFormData.template_type = template.template_type;
  dialogFormData.name = template.name;
  dialogFormData.subject = template.subject;
  dialogFormData.body_html = template.body_html;
  dialogFormData.is_active = template.is_active;

  dialogVisible.value = true;
};

/**
 * 删除模板
 */
const handleDelete = async (template: EmailTemplate) => {
  try {
    await ElMessageBox.confirm(
      t("feedback.email.deleteTemplateConfirm", { name: template.name }),
      t("common.warning"),
      {
        confirmButtonText: t("buttons.confirm"),
        cancelButtonText: t("buttons.cancel"),
        type: "warning"
      }
    );

    const response = await deleteEmailTemplate(template.id);

    if (response.success) {
      message(t("common.deleteSuccess"), { type: "success" });
      fetchTemplates();
    }
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

    try {
      let response;
      if (dialogMode.value === "create") {
        response = await createEmailTemplate(dialogFormData);
      } else if (editingId.value) {
        response = await updateEmailTemplate(editingId.value, dialogFormData);
      }

      if (response && response.success) {
        message(
          dialogMode.value === "create"
            ? t("common.createSuccess")
            : t("common.updateSuccess"),
          { type: "success" }
        );
        dialogVisible.value = false;
        fetchTemplates();
      } else if (response && !response.success) {
        // 处理业务错误
        if (response.code === 4003) {
          message("权限不足：只有租户管理员可以管理邮件模板", {
            type: "error"
          });
          console.error("权限错误详情:", response);
        } else {
          message(response.message || "操作失败", { type: "error" });
        }
      }
    } catch (error: any) {
      console.error("操作失败:", error);

      // 处理HTTP错误
      if (error.response) {
        if (error.response.status === 403) {
          message("权限不足：只有租户管理员可以管理邮件模板", {
            type: "error"
          });
          console.error("HTTP 403 错误 - 权限不足");
          console.error("当前用户信息:", error.response.data);
        } else if (error.response.status === 401) {
          message("登录已过期，请重新登录", { type: "error" });
        } else {
          message(error.response.data?.message || "操作失败", {
            type: "error"
          });
        }
      } else {
        message("网络错误或服务器异常", { type: "error" });
      }
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
  dialogFormData.template_type = "reply";
  dialogFormData.name = "";
  dialogFormData.subject = "";
  dialogFormData.body_html = "";
  dialogFormData.is_active = true;
};

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

/**
 * 获取模板类型标签颜色
 */
const getTemplateTypeTag = (type: EmailTemplateType) => {
  const typeMap: Record<EmailTemplateType, any> = {
    reply: "primary",
    status_change: "success",
    verification: "warning",
    summary: "info"
  };
  return typeMap[type] || "info";
};

/**
 * 获取模板类型标签文本
 */
const getTemplateTypeLabel = (type: EmailTemplateType) => {
  const typeLabels: Record<EmailTemplateType, string> = {
    reply: "回复通知",
    status_change: "状态变更",
    verification: "邮箱验证",
    summary: "每日摘要"
  };
  return typeLabels[type] || type;
};

// 页面加载
onMounted(() => {
  fetchTemplates();
});
</script>

<style lang="scss" scoped>
.email-templates-container {
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

  .form-tip {
    font-size: 12px;
    color: #909399;
  }

  .variables-tip {
    margin-top: 8px;

    p {
      margin: 0 0 8px 0;
      font-size: 12px;
      color: #909399;
    }

    .variable-tag {
      margin-right: 8px;
      margin-bottom: 4px;
    }
  }
}
</style>
