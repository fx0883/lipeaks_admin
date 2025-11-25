<template>
  <div class="main-container">
    <el-card v-loading="loading" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t("license.dashboard") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/licenses' }">
            {{ $t("license.licenses.title") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{
            $t("license.licenses.create")
          }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="create-container">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="140px"
          label-position="left"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.licenseKey')"
                prop="licenseKey"
              >
                <el-input
                  v-model="form.licenseKey"
                  :placeholder="$t('license.licenses.licenseKeyPlaceholder')"
                  readonly
                />
                <el-button
                  type="primary"
                  size="small"
                  style="margin-top: 5px"
                  @click="generateLicenseKey"
                >
                  {{ $t("license.licenses.generateKey") }}
                </el-button>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.application')" prop="applicationId">
                <el-select
                  v-model="form.applicationId"
                  :placeholder="$t('license.licenses.selectApplication')"
                  style="width: 100%"
                  filterable
                  @change="onApplicationChange"
                >
                  <el-option
                    v-for="app in availableApplications"
                    :key="app.id"
                    :label="app.name"
                    :value="app.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.plan')" prop="planId">
                <el-select
                  v-model="form.planId"
                  :placeholder="$t('license.licenses.selectPlan')"
                  style="width: 100%"
                  filterable
                  @change="onPlanChange"
                >
                  <el-option
                    v-for="plan in availablePlans"
                    :key="plan.id"
                    :label="`${plan.name} - ¥${plan.price}`"
                    :value="plan.id"
                  >
                    <div
                      style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                      "
                    >
                      <span>{{ plan.name }}</span>
                      <div style="font-size: 12px; color: #999">
                        <span>¥{{ plan.price }}</span>
                        <span v-if="plan.application_name" style="margin-left: 8px">
                          {{ plan.application_name }}
                        </span>
                      </div>
                    </div>
                  </el-option>
                </el-select>
                <!-- 显示方案数量提示，帮助用户理解级联选择 -->
                <div v-if="form.applicationId" class="form-tip">
                  {{
                    $t("license.licenses.plansFilteredByApplication", {
                      count: availablePlans.length,
                      total: allPlans.length
                    })
                  }}
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.customerName')"
                prop="customerInfo.name"
              >
                <el-input
                  v-model="form.customerInfo.name"
                  :placeholder="$t('license.licenses.customerNamePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.customerEmail')"
                prop="customerInfo.email"
              >
                <el-input
                  v-model="form.customerInfo.email"
                  :placeholder="$t('license.licenses.customerEmailPlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.customerCompany')"
                prop="customerInfo.company"
              >
                <el-input
                  v-model="form.customerInfo.company"
                  :placeholder="
                    $t('license.licenses.customerCompanyPlaceholder')
                  "
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.customerPhone')"
                prop="customerInfo.phone"
              >
                <el-input
                  v-model="form.customerInfo.phone"
                  :placeholder="$t('license.licenses.customerPhonePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>


          <el-form-item :label="$t('license.licenses.notes')" prop="notes">
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="3"
              :placeholder="$t('license.licenses.notesPlaceholder')"
            />
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              :loading="submitting"
              @click="handleSubmit"
            >
              {{ $t("common.create") }}
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
import { useRouter } from "vue-router";
import {
  ElMessage,
  ElMessageBox,
  type FormInstance,
  type FormRules
} from "element-plus";
import { useI18n } from "vue-i18n";
import { getPlanList, createLicense } from "@/api/modules/license";
import { getApplicationList } from "@/api/modules/application";
import type { LicensePlan } from "@/types/license";
import type { Application } from "@/types/application";

const { t } = useI18n();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

interface LicenseForm {
  licenseKey: string;
  applicationId: number | null;
  planId: number | null;
  customerInfo: {
    name: string;
    email: string;
    company: string;
    phone: string;
  };
  notes: string;
}

const form = reactive<LicenseForm>({
  licenseKey: "",
  applicationId: null,
  planId: null,
  customerInfo: {
    name: "",
    email: "",
    company: "",
    phone: ""
  },
  notes: ""
});

const availableApplications = ref<Application[]>([]);
const availablePlans = ref<LicensePlan[]>([]);
const allPlans = ref<LicensePlan[]>([]); // 存储所有方案，用于过滤

const rules = reactive<FormRules<LicenseForm>>({
  // application是必填字段
  applicationId: [
    {
      required: true,
      message: t("license.licenses.applicationRequired"),
      trigger: "change"
    }
  ],
  // plan是必填字段
  planId: [
    {
      required: true,
      message: t("license.licenses.planRequired"),
      trigger: "change"
    }
  ],
  // 客户信息验证：根据API文档的customer_info结构
  "customerInfo.name": [
    {
      required: true,
      message: t("license.licenses.customerNameRequired"),
      trigger: "blur"
    },
    {
      max: 100,
      message: t("license.licenses.customerNameMaxLength", { max: 100 }),
      trigger: "blur"
    }
  ],
  "customerInfo.email": [
    {
      required: true,
      message: t("license.licenses.customerEmailRequired"),
      trigger: "blur"
    },
    {
      type: "email",
      message: t("license.licenses.customerEmailInvalid"),
      trigger: "blur"
    }
  ],
  "customerInfo.company": [
    {
      max: 200,
      message: t("license.licenses.customerCompanyMaxLength", { max: 200 }),
      trigger: "blur"
    }
  ],
  notes: [
    {
      max: 1000,
      message: t("license.licenses.notesMaxLength", { max: 1000 }),
      trigger: "blur"
    }
  ]
});

// 加载应用列表
const loadAvailableApplications = async () => {
  try {
    const result = await getApplicationList({ page_size: 100, is_active: true });
    if (result.success && result.data?.results) {
      availableApplications.value = result.data.results;
    } else {
      availableApplications.value = [];
      ElMessage.warning(t("license.licenses.noApplicationsAvailable"));
    }
  } catch (error) {
    console.error("Load applications failed:", error);
    ElMessage.error(t("license.licenses.loadApplicationsFailed"));
    availableApplications.value = [];
  }
};

// 加载所有方案列表
const loadAllPlans = async () => {
  try {
    const result = await getPlanList({ page_size: 100 });
    if (result.success && result.data?.results) {
      allPlans.value = result.data.results;
      // 初始显示所有方案
      availablePlans.value = [...allPlans.value];
    } else {
      allPlans.value = [];
      availablePlans.value = [];
      ElMessage.warning(t("license.licenses.noPlansAvailable"));
    }
  } catch (error) {
    console.error("Load plans failed:", error);
    ElMessage.error(t("license.licenses.loadPlansFailed"));
    allPlans.value = [];
    availablePlans.value = [];
  }
};

// 获取选中的应用信息
const getSelectedApplication = () => {
  if (!form.applicationId) return null;
  return availableApplications.value.find(app => app.id === form.applicationId);
};

// 应用变化时的处理逻辑（级联选择）
const onApplicationChange = (applicationId: number | null) => {
  // 清空已选择的方案
  form.planId = null;
  
  if (applicationId) {
    // 根据应用过滤方案
    availablePlans.value = allPlans.value.filter(
      plan => plan.application === applicationId
    );
    if (availablePlans.value.length === 0) {
      ElMessage.info(t("license.licenses.noPlansForApplication"));
    }
  } else {
    // 未选择应用时，显示所有方案
    availablePlans.value = [...allPlans.value];
  }
};


// 方案变化时的处理逻辑
const onPlanChange = (planId: number | null) => {
  if (planId) {
    const selectedPlan = allPlans.value.find(plan => plan.id === planId);
    if (selectedPlan) {
      // 如果尚未选择应用，自动设置对应的应用
      if (!form.applicationId && selectedPlan.application) {
        form.applicationId = selectedPlan.application;
        ElMessage.success(
          t("license.licenses.applicationAutoSelectedByPlan", {
            application: selectedPlan.application_name
          })
        );
        // 更新可用方案列表
        availablePlans.value = allPlans.value.filter(
          plan => plan.application === selectedPlan.application
        );
      }
    }
  }

  validateApplicationPlanConsistency();
};

// 验证应用-方案一致性
const validateApplicationPlanConsistency = () => {
  if (form.applicationId && form.planId) {
    const selectedPlan = allPlans.value.find(plan => plan.id === form.planId);
    if (!selectedPlan) {
      ElMessage.error(t("license.licenses.invalidPlanSelection"));
      return false;
    }

    if (selectedPlan.application !== form.applicationId) {
      ElMessage.error(
        t("license.licenses.applicationPlanMismatchDetailed", {
          planName: selectedPlan.name,
          planApplication: selectedPlan.application_name,
          selectedApplication: availableApplications.value.find(
            app => app.id === form.applicationId
          )?.name
        })
      );
      return false;
    }
  }
  return true;
};

const generateLicenseKey = () => {
  // 生成许可证密钥的逻辑
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let key = "";
  for (let i = 0; i < 25; i++) {
    if (i > 0 && i % 5 === 0) key += "-";
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.licenseKey = key;
};

const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    // 表单验证
    await formRef.value.validate();

    // 应用-方案一致性验证
    if (!validateApplicationPlanConsistency()) {
      return;
    }

    submitting.value = true;

    // 提交数据：application和plan都是必选参数
    const submitData = {
      application: form.applicationId!,
      plan: form.planId!,
      customer_info: {
        name: form.customerInfo.name,
        email: form.customerInfo.email,
        ...(form.customerInfo.company && {
          company: form.customerInfo.company
        }),
        ...(form.customerInfo.phone && {
          phone: form.customerInfo.phone
        })
      },
      // 可选参数：只在有值时传递
      ...(form.notes?.trim() && { notes: form.notes.trim() })
    };

    console.log("提交数据（遵循API推荐格式）:", submitData);

    // 调用真实的API (类型断言，因为租户信息由后端从token获取)
    const result = await createLicense(submitData as any);

    if (result.success) {
      ElMessage.success(
        t("license.licenses.createSuccess", {
          planName: allPlans.value.find(p => p.id === form.planId)?.name
        })
      );
      router.push("/license/licenses");
    } else {
      throw new Error(result.message || "创建失败");
    }
  } catch (error) {
    console.error("Create license failed:", error);

    // 根据API文档的错误处理格式
    if (error.response?.data) {
      const responseData = error.response.data;

      // 处理验证错误（400 Bad Request）
      if (responseData.data && typeof responseData.data === "object") {
        const errorData = responseData.data;

        if (errorData.plan && errorData.plan.length > 0) {
          ElMessage.error(
            t("license.licenses.planValidationError", {
              message: errorData.plan[0]
            })
          );
        } else if (
          errorData.customer_info &&
          errorData.customer_info.length > 0
        ) {
          ElMessage.error(
            t("license.licenses.customerInfoError", {
              message: errorData.customer_info[0]
            })
          );
        } else {
          // 显示第一个错误信息
          const firstError = Object.values(errorData)[0];
          const errorMessage = Array.isArray(firstError)
            ? firstError[0]
            : firstError;
          ElMessage.error(errorMessage || t("license.licenses.createFailed"));
        }
      } else if (responseData.message) {
        ElMessage.error(responseData.message);
      } else {
        ElMessage.error(t("license.licenses.createFailed"));
      }
    } else if (error.message) {
      ElMessage.error(error.message);
    } else {
      ElMessage.error(t("license.licenses.createFailed"));
    }
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

onMounted(() => {
  Promise.all([loadAvailableApplications(), loadAllPlans()]);
  generateLicenseKey();
});
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.create-container {
  max-width: 900px;
  margin: 0 auto;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
}

.product-display {
  min-height: 32px;
  line-height: 32px;
  padding: 0 11px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.placeholder-text {
  color: var(--el-text-color-placeholder);
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

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}
</style>
