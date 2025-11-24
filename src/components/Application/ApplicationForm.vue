<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="form"
    :rules="rules"
    label-width="120px"
    :disabled="disabled"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.name')" prop="name" required>
          <el-input
            v-model="form.name"
            :placeholder="$t('application.formTips.nameRequired')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.code')" prop="code" required>
          <el-input
            v-model="form.code"
            :placeholder="$t('application.formTips.codeRequired')"
            :disabled="isEdit"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item :label="$t('application.fields.description')">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        :placeholder="$t('application.formTips.descriptionOptional')"
      />
    </el-form-item>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.currentVersion')">
          <el-input
            v-model="form.current_version"
            placeholder="1.0.0"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.status')" prop="status">
          <el-select v-model="form.status" style="width: 100%">
            <el-option
              v-for="status in statusOptions"
              :key="status"
              :label="$t(`application.status.${status}`)"
              :value="status"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.owner')">
          <el-input
            v-model="form.owner"
            :placeholder="$t('application.formTips.ownerOptional')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.team')">
          <el-input
            v-model="form.team"
            :placeholder="$t('application.formTips.teamOptional')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.website')">
          <el-input
            v-model="form.website"
            :placeholder="$t('application.formTips.websiteOptional')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="$t('application.fields.contactEmail')">
          <el-input
            v-model="form.contact_email"
            type="email"
            :placeholder="$t('application.formTips.emailOptional')"
            autocomplete="off"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- 按钮组 -->
    <el-form-item>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ $t("common.submit") }}
      </el-button>
      <el-button @click="handleCancel">
        {{ $t("common.cancel") }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, watch, defineProps, defineEmits } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type {
  Application,
  ApplicationCreateUpdateParams,
  ApplicationStatus
} from "@/types/application";

const { t } = useI18n();

// Props
const props = defineProps<{
  loading?: boolean;
  disabled?: boolean;
  applicationData?: Application | null;
  isEdit?: boolean;
}>();

// Emits
const emit = defineEmits<{
  submit: [data: ApplicationCreateUpdateParams];
  cancel: [];
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const form = reactive<ApplicationCreateUpdateParams>({
  name: "",
  code: "",
  description: "",
  current_version: "1.0.0",
  status: "active",
  owner: "",
  team: "",
  website: "",
  contact_email: ""
});

// 状态选项
const statusOptions: ApplicationStatus[] = [
  "development",
  "testing",
  "active",
  "maintenance",
  "deprecated",
  "archived"
];

// 表单验证规则
const rules = reactive<FormRules>({
  name: [
    {
      required: true,
      message: t("application.formTips.nameRequired"),
      trigger: "blur"
    }
  ],
  code: [
    {
      required: true,
      message: t("application.formTips.codeRequired"),
      trigger: "blur"
    }
  ],
  status: [
    {
      required: true,
      message: t("application.formTips.statusRequired"),
      trigger: "change"
    }
  ]
});

// 监听props变化，更新表单数据
watch(
  () => props.applicationData,
  (newData) => {
    if (newData) {
      Object.assign(form, {
        name: newData.name || "",
        code: newData.code || "",
        description: newData.description || "",
        current_version: newData.current_version || "1.0.0",
        status: newData.status || "active",
        owner: newData.owner || "",
        team: newData.team || "",
        website: newData.website || "",
        contact_email: newData.contact_email || ""
      });
    }
  },
  { immediate: true, deep: true }
);

// 处理提交
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid) => {
    if (valid) {
      emit("submit", { ...form });
    }
  });
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
};

// 重置表单
const resetForm = () => {
  formRef.value?.resetFields();
  Object.assign(form, {
    name: "",
    code: "",
    description: "",
    current_version: "1.0.0",
    status: "active",
    owner: "",
    team: "",
    website: "",
    contact_email: ""
  });
};

// 暴露方法给父组件
defineExpose({
  resetForm
});
</script>

<style scoped lang="scss">
.el-form {
  padding: 20px 20px 0;
}
</style>
