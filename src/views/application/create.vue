<template>
  <div class="application-create-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ t('application.create') }}</span>
          <el-button link @click="router.back()">
            {{ t('common.back') }}
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item :label="t('application.fields.name')" prop="name">
          <el-input
            v-model="formData.name"
            :placeholder="t('application.formTips.nameRequired')"
          />
        </el-form-item>

        <el-form-item :label="t('application.fields.code')" prop="code">
          <el-input
            v-model="formData.code"
            :placeholder="t('application.formTips.codeRequired')"
          />
        </el-form-item>

        <el-form-item :label="t('application.fields.description')">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
          />
        </el-form-item>

        <el-form-item :label="t('application.fields.currentVersion')">
          <el-input v-model="formData.current_version" placeholder="1.0.0" />
        </el-form-item>

        <el-form-item :label="t('application.fields.status')">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option
              v-for="status in statusOptions"
              :key="status"
              :label="t(`application.status.${status}`)"
              :value="status"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('application.fields.owner')">
          <el-input v-model="formData.owner" />
        </el-form-item>

        <el-form-item :label="t('application.fields.team')">
          <el-input v-model="formData.team" />
        </el-form-item>

        <el-form-item :label="t('application.fields.website')">
          <el-input v-model="formData.website" />
        </el-form-item>

        <el-form-item :label="t('application.fields.contactEmail')">
          <el-input v-model="formData.contact_email" type="email" />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="applicationStore.loading.create"
            @click="handleSubmit"
          >
            {{ t('common.submit') }}
          </el-button>
          <el-button @click="router.back()">
            {{ t('common.cancel') }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { useApplicationStoreHook } from "@/store/modules/application";
import type { ApplicationStatus, ApplicationCreateUpdateParams } from "@/types/application";

const { t } = useI18n();
const router = useRouter();
const applicationStore = useApplicationStoreHook();

const formRef = ref<FormInstance>();
const formData = reactive<ApplicationCreateUpdateParams>({
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

const statusOptions: ApplicationStatus[] = [
  "development",
  "testing",
  "active",
  "maintenance",
  "deprecated",
  "archived"
];

const rules = {
  name: [
    { required: true, message: t("application.formTips.nameRequired"), trigger: "blur" }
  ],
  code: [
    { required: true, message: t("application.formTips.codeRequired"), trigger: "blur" }
  ]
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await applicationStore.createApplication(formData);
        ElMessage.success(t("application.createSuccess"));
        router.push("/application");
      } catch (error) {
        ElMessage.error(t("application.createFailed"));
      }
    }
  });
};
</script>

<style scoped lang="scss">
.application-create-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
