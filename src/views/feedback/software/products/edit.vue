<template>
  <div class="software-product-edit-container" v-loading="loading">
    <div class="page-header">
      <h2>{{ t("feedback.software.productEdit") }}</h2>
    </div>

    <el-card shadow="never" v-if="!loading">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="140px"
      >
        <el-form-item :label="t('feedback.software.productName')" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="t('feedback.software.productNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.productCode')" prop="code">
          <el-input
            v-model="formData.code"
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
            v-model="formData.category_id"
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
            v-model="formData.description"
            type="textarea"
            :rows="4"
            :placeholder="t('feedback.software.descriptionPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.website')">
          <el-input
            v-model="formData.website"
            :placeholder="t('feedback.software.websitePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.owner')">
          <el-input
            v-model="formData.owner"
            :placeholder="t('feedback.software.ownerPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.team')">
          <el-input
            v-model="formData.team"
            :placeholder="t('feedback.software.teamPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.contactEmail')">
          <el-input
            v-model="formData.contact_email"
            :placeholder="t('feedback.software.emailPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('feedback.software.productStatus')">
          <el-select v-model="formData.status">
            <el-option label="开发中" value="development" />
            <el-option label="测试中" value="testing" />
            <el-option label="已发布" value="released" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="已废弃" value="deprecated" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.software.status')">
          <el-switch v-model="formData.is_active" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ t("buttons.save") }}
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
import { ref, reactive, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useSoftwareCategories } from "@/composables/useSoftware";
import { getSoftwareDetail, updateSoftware } from "@/api/modules/feedback";
import type { FormInstance, FormRules } from "element-plus";
import type { SoftwareUpdateParams } from "@/types/feedback";
import { message } from "@/utils/message";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// 软件ID
const softwareId = computed(() => parseInt(route.params.id as string));

// 获取分类列表
const { categories } = useSoftwareCategories(true);

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<SoftwareUpdateParams>({
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

// 加载状态
const loading = ref(false);
const submitting = ref(false);

// 表单验证规则
const rules = reactive<FormRules>({
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

/**
 * 加载软件详情
 */
const loadDetail = async () => {
  loading.value = true;

  try {
    const response = await getSoftwareDetail(softwareId.value);

    if (response.success && response.data) {
      const software = response.data;
      formData.name = software.name;
      formData.code = software.code;
      formData.description = software.description || "";
      // 处理category字段，可能是number或对象
      if (typeof software.category === "object" && software.category !== null) {
        formData.category_id = software.category.id;
      } else {
        formData.category_id = software.category_id || software.category || 0;
      }
      formData.website = software.website || "";
      formData.owner = software.owner || "";
      formData.team = software.team || "";
      formData.contact_email = software.contact_email || "";
      formData.status = software.status;
      formData.is_active = software.is_active;
    }
  } catch (error) {
    console.error("加载失败:", error);
    message(t("common.loadFailed"), { type: "error" });
  } finally {
    loading.value = false;
  }
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    submitting.value = true;

    try {
      const response = await updateSoftware(softwareId.value, formData);

      if (response.success && response.data) {
        message(t("common.updateSuccess"), { type: "success" });
        router.push(`/feedback/software/products/detail/${softwareId.value}`);
      }
    } catch (error) {
      console.error("更新失败:", error);
    } finally {
      submitting.value = false;
    }
  });
};

/**
 * 取消
 */
const handleCancel = () => {
  router.back();
};

// 页面加载
onMounted(() => {
  loadDetail();
});
</script>

<style lang="scss" scoped>
.software-product-edit-container {
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
