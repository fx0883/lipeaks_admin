<template>
  <div class="feedback-submit-container">
    <div class="page-header">
      <h2>{{ t("feedback.feedbacks.submit") }}</h2>
    </div>

    <el-card shadow="never">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <!-- 软件分类选择 -->
        <el-form-item :label="t('feedback.form.category')" prop="categoryId">
          <el-select
            v-model="formData.categoryId"
            :placeholder="t('feedback.form.selectCategory')"
            :loading="loading"
            @change="handleCategoryChange"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <!-- 软件产品选择 -->
        <el-form-item :label="t('feedback.form.software')" prop="software">
          <el-select
            v-model="formData.software"
            :placeholder="t('feedback.form.selectSoftware')"
            :loading="loading"
            :disabled="!formData.categoryId"
            @change="handleSoftwareChange"
          >
            <el-option
              v-for="software in softwareList"
              :key="software.id"
              :label="`${software.name} (${software.current_version || 'N/A'})`"
              :value="software.id"
            />
          </el-select>
        </el-form-item>

        <!-- 软件版本选择（可选） -->
        <el-form-item :label="t('feedback.form.version')">
          <el-select
            v-model="formData.software_version"
            :placeholder="t('feedback.form.selectVersion')"
            :loading="loading"
            :disabled="!formData.software"
            clearable
          >
            <el-option
              v-for="version in versions"
              :key="version.id"
              :label="version.version"
              :value="version.id"
            />
          </el-select>
        </el-form-item>

        <!-- 反馈类型 -->
        <el-form-item :label="t('feedback.form.type')" prop="feedback_type">
          <el-radio-group v-model="formData.feedback_type">
            <el-radio value="bug">Bug报告</el-radio>
            <el-radio value="feature">功能请求</el-radio>
            <el-radio value="improvement">改进建议</el-radio>
            <el-radio value="question">问题咨询</el-radio>
            <el-radio value="other">其他</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 优先级 -->
        <el-form-item :label="t('feedback.form.priority')" prop="priority">
          <el-radio-group v-model="formData.priority">
            <el-radio value="critical">紧急</el-radio>
            <el-radio value="high">高</el-radio>
            <el-radio value="medium">中</el-radio>
            <el-radio value="low">低</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 标题 -->
        <el-form-item :label="t('feedback.form.title')" prop="title">
          <el-input
            v-model="formData.title"
            :placeholder="t('feedback.form.titlePlaceholder')"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 详细描述 -->
        <el-form-item
          :label="t('feedback.form.description')"
          prop="description"
        >
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="8"
            :placeholder="t('feedback.form.descriptionPlaceholder')"
          />
        </el-form-item>

        <!-- 联系邮箱（可选） -->
        <el-form-item
          :label="t('feedback.form.contactEmail')"
          prop="contact_email"
        >
          <el-input
            v-model="formData.contact_email"
            :placeholder="t('feedback.form.emailPlaceholder')"
          />
          <template #extra>
            <span class="form-tip">{{ t("feedback.form.emailTip") }}</span>
          </template>
        </el-form-item>

        <!-- 联系人姓名（可选） -->
        <el-form-item :label="t('feedback.form.contactName')">
          <el-input
            v-model="formData.contact_name"
            :placeholder="t('feedback.form.namePlaceholder')"
          />
        </el-form-item>

        <!-- 提交按钮 -->
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ t("feedback.form.submit") }}
          </el-button>
          <el-button @click="handleReset">
            {{ t("buttons.reset") }}
          </el-button>
          <el-button @click="handleCancel">
            {{ t("buttons.cancel") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSoftwareSelector } from "@/composables/useSoftware";
import { useFeedbackActions } from "@/composables/useFeedback";
import type { FormInstance, FormRules } from "element-plus";
import type { FeedbackCreateParams } from "@/types/feedback";

const { t } = useI18n();
const router = useRouter();

// 软件选择器
const {
  categories,
  softwareList,
  versions,
  loading,
  selectedCategoryId,
  selectedSoftwareId,
  selectedVersionId,
  selectCategory,
  selectSoftware,
  selectVersion
} = useSoftwareSelector();

// 反馈操作
const { create } = useFeedbackActions();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<{
  categoryId: number | null;
  software: number | null;
  software_version: number | null;
  feedback_type: string;
  priority: string;
  title: string;
  description: string;
  contact_email: string;
  contact_name: string;
}>({
  categoryId: null,
  software: null,
  software_version: null,
  feedback_type: "bug",
  priority: "medium",
  title: "",
  description: "",
  contact_email: "",
  contact_name: ""
});

// 提交状态
const submitting = ref(false);

// 表单验证规则
const rules = reactive<FormRules>({
  categoryId: [
    {
      required: true,
      message: t("feedback.form.categoryRequired"),
      trigger: "change"
    }
  ],
  software: [
    {
      required: true,
      message: t("feedback.form.softwareRequired"),
      trigger: "change"
    }
  ],
  feedback_type: [
    {
      required: true,
      message: t("feedback.form.typeRequired"),
      trigger: "change"
    }
  ],
  priority: [
    {
      required: true,
      message: t("feedback.form.priorityRequired"),
      trigger: "change"
    }
  ],
  title: [
    {
      required: true,
      message: t("feedback.form.titleRequired"),
      trigger: "blur"
    },
    {
      min: 5,
      max: 200,
      message: t("feedback.form.titleLength"),
      trigger: "blur"
    }
  ],
  description: [
    {
      required: true,
      message: t("feedback.form.descriptionRequired"),
      trigger: "blur"
    },
    { min: 10, message: t("feedback.form.descriptionLength"), trigger: "blur" }
  ],
  contact_email: [
    { type: "email", message: t("feedback.form.emailInvalid"), trigger: "blur" }
  ]
});

/**
 * 处理分类变化
 */
const handleCategoryChange = (categoryId: number) => {
  selectCategory(categoryId);
  formData.software = null;
  formData.software_version = null;
};

/**
 * 处理软件变化
 */
const handleSoftwareChange = (softwareId: number) => {
  selectSoftware(softwareId);
  formData.software_version = null;
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    submitting.value = true;

    // 收集环境信息
    const environment_info = {
      os: navigator.platform,
      browser: navigator.userAgent,
      screen_resolution: `${screen.width}x${screen.height}`,
      language: navigator.language
    };

    // 构建提交数据
    const submitData: FeedbackCreateParams = {
      title: formData.title,
      description: formData.description,
      feedback_type: formData.feedback_type as any,
      priority: formData.priority as any,
      software: formData.software!,
      software_version: formData.software_version || undefined,
      contact_email: formData.contact_email || undefined,
      contact_name: formData.contact_name || undefined,
      environment_info
    };

    const result = await create(submitData);

    submitting.value = false;

    if (result) {
      // 跳转到详情页
      router.push(`/feedback/feedbacks/detail/${result.id}`);
    }
  });
};

/**
 * 重置表单
 */
const handleReset = () => {
  formRef.value?.resetFields();
  formData.categoryId = null;
  formData.software = null;
  formData.software_version = null;
};

/**
 * 取消提交
 */
const handleCancel = () => {
  router.back();
};
</script>

<style lang="scss" scoped>
.feedback-submit-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;

  .page-header {
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
}
</style>
