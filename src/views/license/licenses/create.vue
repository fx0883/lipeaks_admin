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
              <el-form-item :label="$t('license.licenses.product')">
                <div class="product-display">
                  <span v-if="form.productId && getSelectedProduct()">
                    {{ getSelectedProduct()?.name }} v{{
                      getSelectedProduct()?.version
                    }}
                  </span>
                  <span v-else class="placeholder-text">
                    {{ $t("license.licenses.selectPlanFirst") }}
                  </span>
                </div>
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
                        <span v-if="plan.product_name" style="margin-left: 8px">
                          {{ plan.product_name }}
                        </span>
                      </div>
                    </div>
                  </el-option>
                </el-select>
                <!-- 显示方案数量提示，帮助用户理解级联选择 -->
                <div v-if="form.productId" class="form-tip">
                  {{
                    $t("license.licenses.plansFilteredByProduct", {
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

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.maxActivations')"
                prop="maxActivations"
              >
                <el-input-number
                  v-model="form.maxActivations"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                  :placeholder="
                    $t('license.licenses.maxActivationsPlaceholder')
                  "
                />
                <div class="form-tip">
                  {{ $t("license.licenses.maxActivationsTip") }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.validityDays')"
                prop="validityDays"
              >
                <el-input-number
                  v-model="form.validityDays"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                  :placeholder="$t('license.licenses.validityDaysPlaceholder')"
                />
                <div class="form-tip">
                  {{ $t("license.licenses.validityDaysTip") }}
                </div>
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
import {
  getProductList,
  getPlanList,
  createLicense
} from "@/api/modules/license";
import type { SoftwareProduct, LicensePlan } from "@/types/license";

const { t } = useI18n();
const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

interface LicenseForm {
  licenseKey: string;
  productId: number | null;
  planId: number | null;
  customerInfo: {
    name: string;
    email: string;
    company: string;
    phone: string;
  };
  maxActivations: number | null;
  validityDays: number | null;
  notes: string;
}

// 使用真实的API类型
type Product = SoftwareProduct;
type Plan = LicensePlan;

const form = reactive<LicenseForm>({
  licenseKey: "",
  productId: null,
  planId: null,
  customerInfo: {
    name: "",
    email: "",
    company: "",
    phone: ""
  },
  maxActivations: null,
  validityDays: null,
  notes: ""
});

const availableProducts = ref<Product[]>([]);
const availablePlans = ref<Plan[]>([]);
const allPlans = ref<Plan[]>([]); // 存储所有方案，用于过滤

const rules = reactive<FormRules<LicenseForm>>({
  // 根据API文档：plan是必填字段，product可由plan自动设置
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
  // 可选字段的验证
  maxActivations: [
    {
      type: "number",
      min: 1,
      message: t("license.licenses.maxActivationsMinValue"),
      trigger: "blur"
    }
  ],
  validityDays: [
    {
      type: "number",
      min: 1,
      message: t("license.licenses.validityDaysMinValue"),
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

// 加载产品列表
const loadAvailableProducts = async () => {
  try {
    const result = await getProductList({ page_size: 100 });
    if (result.success && result.data?.results) {
      availableProducts.value = result.data.results;
    } else {
      availableProducts.value = [];
      ElMessage.warning(t("license.licenses.noProductsAvailable"));
    }
  } catch (error) {
    console.error("Load products failed:", error);
    ElMessage.error(t("license.licenses.loadProductsFailed"));
    availableProducts.value = [];
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

// 获取选中的产品信息
const getSelectedProduct = () => {
  if (!form.productId) return null;
  return availableProducts.value.find(product => product.id === form.productId);
};

// 方案变化时的处理逻辑（级联选择）
const onPlanChange = (planId: number | null) => {
  if (planId) {
    const selectedPlan = allPlans.value.find(plan => plan.id === planId);
    if (selectedPlan) {
      // 当用户选择方案时，自动设置对应的产品
      if (form.productId !== selectedPlan.product) {
        form.productId = selectedPlan.product;
        ElMessage.success(
          t("license.licenses.productAutoSelectedByPlan", {
            product: selectedPlan.product_name
          })
        );
      }
    }
  } else {
    // 清空方案选择时，显示所有方案
    availablePlans.value = [...allPlans.value];
  }

  validateProductPlanConsistency();
};

// 验证产品-方案一致性（实时验证提示 - 方案C）
const validateProductPlanConsistency = () => {
  if (form.productId && form.planId) {
    const selectedPlan = allPlans.value.find(plan => plan.id === form.planId);
    if (!selectedPlan) {
      ElMessage.error(t("license.licenses.invalidPlanSelection"));
      return false;
    }

    if (selectedPlan.product !== form.productId) {
      ElMessage.error(
        t("license.licenses.productPlanMismatchDetailed", {
          planName: selectedPlan.name,
          planProduct: selectedPlan.product_name,
          selectedProduct: availableProducts.value.find(
            p => p.id === form.productId
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

    // 产品-方案一致性验证
    if (!validateProductPlanConsistency()) {
      return;
    }

    submitting.value = true;

    // 根据API文档推荐做法：只提供plan参数，让系统自动设置product
    // 租户信息将由后端从管理员token中获取
    const submitData = {
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
      ...(form.maxActivations && { max_activations: form.maxActivations }),
      ...(form.validityDays && { validity_days: form.validityDays }),
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
        } else if (
          errorData.max_activations &&
          errorData.max_activations.length > 0
        ) {
          ElMessage.error(errorData.max_activations[0]);
        } else if (
          errorData.validity_days &&
          errorData.validity_days.length > 0
        ) {
          ElMessage.error(errorData.validity_days[0]);
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
  Promise.all([loadAvailableProducts(), loadAllPlans()]);
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
