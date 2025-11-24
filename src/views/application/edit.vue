<template>
  <div class="application-edit-container">
    <el-card shadow="never" v-loading="applicationStore.loading.detail">
      <template #header>
        <div class="card-header">
          <span>{{ t('application.edit') }}</span>
          <el-button link @click="router.back()">
            {{ t('common.back') }}
          </el-button>
        </div>
      </template>

      <el-form
        v-if="formData"
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item :label="t('application.fields.name')" prop="name">
          <el-input v-model="formData.name" />
        </el-form-item>

        <el-form-item :label="t('application.fields.code')" prop="code">
          <el-input v-model="formData.code" disabled />
        </el-form-item>

        <el-form-item :label="t('application.fields.description')">
          <el-input v-model="formData.description" type="textarea" :rows="4" />
        </el-form-item>

        <el-form-item :label="t('application.fields.currentVersion')">
          <el-input v-model="formData.current_version" />
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

        <el-form-item>
          <el-button
            type="primary"
            :loading="applicationStore.loading.update"
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
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import type { FormInstance } from "element-plus";
import { useApplicationStoreHook } from "@/store/modules/application";
import type { ApplicationStatus } from "@/types/application";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const applicationStore = useApplicationStoreHook();

const formRef = ref<FormInstance>();
const formData = reactive<any>({});

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
  ]
};

const fetchData = async () => {
  const id = Number(route.params.id);
  const response = await applicationStore.fetchApplicationDetail(id);
  if (response.success && response.data) {
    Object.assign(formData, response.data);
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const id = Number(route.params.id);
        await applicationStore.updateApplication(id, formData);
        ElMessage.success(t("application.updateSuccess"));
        router.back();
      } catch (error) {
        ElMessage.error(t("application.updateFailed"));
      }
    }
  });
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.application-edit-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
