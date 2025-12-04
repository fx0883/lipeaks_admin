<script lang="ts" setup>
import { ref, reactive, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { FormInstance, FormRules } from "element-plus";
import type { ResetPasswordParams } from "@/types/adminUser";

const { t } = useI18n();

const props = defineProps<{
  visible: boolean;
  username: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:visible", visible: boolean): void;
  (e: "confirm", formData: ResetPasswordParams): void;
  (e: "cancel"): void;
}>();

// 表单引用
const formRef = ref<FormInstance>();

// 表单数据
const formData = reactive<ResetPasswordParams>({
  password: "",
  password_confirm: ""
});

// 验证确认密码
const validateConfirmPassword = (rule: any, value: any, callback: any) => {
  if (value === "") {
    callback(new Error(t("adminUser.confirmPasswordRequired")));
  } else if (value !== formData.password) {
    callback(new Error(t("adminUser.passwordMismatch")));
  } else {
    callback();
  }
};

// 表单验证规则
const rules = reactive<FormRules>({
  password: [
    {
      required: true,
      message: t("adminUser.passwordRequired"),
      trigger: "blur"
    },
    {
      min: 8,
      message: t("adminUser.passwordLength"),
      trigger: "blur"
    }
  ],
  password_confirm: [
    {
      required: true,
      message: t("adminUser.confirmPasswordRequired"),
      trigger: "blur"
    },
    { validator: validateConfirmPassword, trigger: "blur" }
  ]
});

// 重置表单
const resetForm = () => {
  formData.password = "";
  formData.password_confirm = "";
  if (formRef.value) {
    formRef.value.clearValidate();
  }
};

// 监听对话框关闭，重置表单
watch(
  () => props.visible,
  newVal => {
    if (!newVal) {
      resetForm();
    }
  }
);

// 处理确认
const handleConfirm = async () => {
  if (!formRef.value) return;

  await formRef.value.validate((valid, fields) => {
    if (valid) {
      emit("confirm", { ...formData });
    }
  });
};

// 处理取消
const handleCancel = () => {
  emit("cancel");
  emit("update:visible", false);
};

// 处理对话框关闭
const handleClose = () => {
  emit("update:visible", false);
  resetForm();
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="t('adminUser.resetPassword')"
    width="500px"
    :close-on-click-modal="false"
    @update:model-value="val => $emit('update:visible', val)"
    @closed="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      :disabled="loading"
    >
      <el-form-item :label="t('adminUser.username')">
        <el-input :value="username" disabled />
      </el-form-item>

      <el-form-item :label="t('adminUser.newPassword')" prop="password">
        <el-input
          v-model="formData.password"
          type="password"
          :placeholder="t('adminUser.newPasswordPlaceholder')"
          show-password
        />
      </el-form-item>

      <el-form-item
        :label="t('adminUser.confirmNewPassword')"
        prop="password_confirm"
      >
        <el-input
          v-model="formData.password_confirm"
          type="password"
          :placeholder="t('adminUser.confirmNewPasswordPlaceholder')"
          show-password
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button :disabled="loading" @click="handleCancel">
          {{ t("adminUser.cancel") }}
        </el-button>
        <el-button type="primary" :loading="loading" @click="handleConfirm">
          {{ t("buttons.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
