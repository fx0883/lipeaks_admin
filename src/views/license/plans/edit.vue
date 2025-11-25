<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t("license.dashboard") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/plans' }">
            {{ $t("license.plans.title") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{
            $t("license.plans.edit")
          }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="edit-container">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="120px"
          label-position="left"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.application')" prop="application">
                <el-select
                  v-model="form.application"
                  :placeholder="$t('license.plans.applicationPlaceholder')"
                  clearable
                  filterable
                  style="width: 100%"
                >
                  <el-option
                    v-for="app in applicationOptions"
                    :key="app.value"
                    :label="app.label"
                    :value="app.value"
                  />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.type')" prop="plan_type">
                <el-select
                  v-model="form.plan_type"
                  :placeholder="$t('license.plans.typePlaceholder')"
                  clearable
                  style="width: 100%"
                >
                  <el-option label="Trial" value="trial" />
                  <el-option label="Basic" value="basic" />
                  <el-option label="Professional" value="professional" />
                  <el-option label="Enterprise" value="enterprise" />
                  <el-option label="Custom" value="custom" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.name')" prop="name">
                <el-input
                  v-model="form.name"
                  :placeholder="$t('license.plans.namePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.code')" prop="code">
                <el-input
                  v-model="form.code"
                  :placeholder="$t('license.plans.codePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.price')" prop="price">
                <el-input
                  v-model="form.price"
                  :placeholder="$t('license.plans.pricePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item
                :label="$t('license.plans.currency')"
                prop="currency"
              >
                <el-select v-model="form.currency" style="width: 100%">
                  <el-option label="USD" value="USD" />
                  <el-option label="EUR" value="EUR" />
                  <el-option label="CNY" value="CNY" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.status')" prop="status">
                <el-select v-model="form.status" style="width: 100%">
                  <el-option
                    :label="$t('license.plans.active')"
                    value="active"
                  />
                  <el-option
                    :label="$t('license.plans.inactive')"
                    value="inactive"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                :label="$t('license.plans.defaultMaxActivations')"
                prop="default_max_activations"
              >
                <el-input-number
                  v-model="form.default_max_activations"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="$t('license.plans.defaultValidityDays')"
                prop="default_validity_days"
              >
                <el-input-number
                  v-model="form.default_validity_days"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('license.plans.features')" prop="features">
            <el-input
              v-model="form.features"
              type="textarea"
              :rows="4"
              :placeholder="$t('license.plans.featuresPlaceholder')"
            />
            <div class="help-text">
              {{ $t("license.plans.featuresHelp") }}
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              @click="handleSubmit"
              :loading="submitting"
            >
              {{ $t("common.save") }}
            </el-button>
            <el-button @click="handleCancel">
              {{ $t("common.cancel") }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from "element-plus";
import { useI18n } from "vue-i18n";
import { useLicenseStoreHook } from "@/store/modules/license";
import { getApplicationList } from "@/api/modules/application";
import type { PlanUpdateParams } from "@/types/license";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const licenseStore = useLicenseStoreHook();

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

// 应用选项
const applicationOptions = ref<Array<{ value: number; label: string }>>([]);

interface PlanForm {
  id?: number;
  application: number | null;
  name: string;
  code: string;
  plan_type: string;
  default_max_activations: number | null;
  default_validity_days: number | null;
  features: string;
  price: string;
  currency: string;
  status: string;
}

const form = reactive<PlanForm>({
  application: null,
  name: "",
  code: "",
  plan_type: "",
  default_max_activations: null,
  default_validity_days: null,
  features: "{}",
  price: "0.00",
  currency: "CNY",
  status: "active"
});

const rules = reactive<FormRules<PlanForm>>({
  application: [
    {
      required: true,
      message: t("license.plans.applicationRequired"),
      trigger: "change"
    }
  ],
  name: [
    {
      required: true,
      message: t("license.plans.nameRequired"),
      trigger: "blur"
    }
  ],
  code: [
    {
      required: true,
      message: t("license.plans.codeRequired"),
      trigger: "blur"
    },
    {
      pattern: /^[a-zA-Z0-9_-]+$/,
      message: t("license.plans.codeFormat"),
      trigger: "blur"
    }
  ],
  plan_type: [
    {
      required: true,
      message: t("license.plans.typeRequired"),
      trigger: "change"
    }
  ],
  default_max_activations: [
    {
      required: true,
      message: t("license.plans.defaultMaxActivationsRequired"),
      trigger: "blur"
    }
  ],
  default_validity_days: [
    {
      required: true,
      message: t("license.plans.defaultValidityDaysRequired"),
      trigger: "blur"
    }
  ],
  price: [
    {
      required: true,
      message: t("license.plans.priceRequired"),
      trigger: "blur"
    }
  ],
  currency: [
    {
      required: true,
      message: t("license.plans.currencyRequired"),
      trigger: "change"
    }
  ],
  status: [
    {
      required: true,
      message: t("license.plans.statusRequired"),
      trigger: "change"
    }
  ]
});

const loadPlanData = async () => {
  const planId = route.params.id;
  if (!planId) {
    ElMessage.error(t("license.plans.invalidId"));
    router.push("/license/plans");
    return;
  }

  loading.value = true;
  try {
    const response = await licenseStore.getPlanDetail(Number(planId));
    if (response.success && response.data) {
      const plan = response.data;
      Object.assign(form, {
        id: plan.id,
        application: plan.application,
        name: plan.name,
        code: plan.code,
        plan_type: plan.plan_type,
        default_max_activations: plan.default_max_activations,
        default_validity_days: plan.default_validity_days,
        features: plan.features ? JSON.stringify(plan.features, null, 2) : "{}",
        price: plan.price,
        currency: plan.currency,
        status: plan.status
      });
    }
  } catch (error) {
    console.error("Load plan data failed:", error);
    ElMessage.error(t("license.plans.loadFailed"));
    router.push("/license/plans");
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value || !form.id) return;

  try {
    await formRef.value.validate();

    submitting.value = true;

    // 处理features字段，将JSON字符串转为对象
    let featuresObj = {};
    if (form.features) {
      try {
        featuresObj = JSON.parse(form.features);
      } catch (e) {
        ElMessage.error(t("license.plans.featuresFormatError"));
        return;
      }
    }

    const updateData: PlanUpdateParams = {
      application: form.application!,
      name: form.name,
      code: form.code,
      plan_type: form.plan_type as any,
      default_max_activations: form.default_max_activations!,
      default_validity_days: form.default_validity_days!,
      features: featuresObj,
      price: form.price,
      currency: form.currency,
      status: form.status as any
    };

    await licenseStore.updatePlan(form.id, updateData);
    ElMessage.success(t("license.plans.updateSuccess"));
    router.push("/license/plans");
  } catch (error) {
    console.error("Update plan failed:", error);
    ElMessage.error(t("license.plans.updateFailed"));
  } finally {
    submitting.value = false;
  }
};

const handleCancel = () => {
  ElMessageBox.confirm(
    t("common.unsavedChangesMessage"),
    t("common.confirmTitle"),
    {
      confirmButtonText: t("common.confirm"),
      cancelButtonText: t("common.cancel"),
      type: "warning"
    }
  )
    .then(() => {
      router.back();
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 获取应用选项
const fetchApplicationOptions = async () => {
  try {
    const response = await getApplicationList({
      page: 1,
      page_size: 100,
      is_active: true
    });
    if (response.success && response.data?.results) {
      applicationOptions.value = response.data.results.map(app => ({
        value: app.id,
        label: app.name
      }));
    }
  } catch (error) {
    console.error("获取应用选项失败", error);
  }
};

onMounted(async () => {
  await fetchApplicationOptions();
  await loadPlanData();
});
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.edit-container {
  max-width: 800px;
  margin: 0 auto;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

:deep(.el-input-number) {
  width: 100%;
}

.help-text {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}
</style>
