<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t("license.dashboard") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/licenses' }">
            {{ $t("license.licenses.title") }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{
            $t("license.licenses.edit")
          }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="edit-container">
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="140px"
          label-position="left"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.licenseKey')">
                <el-input
                  v-model="form.license_key"
                  :placeholder="$t('license.licenses.licenseKeyPlaceholder')"
                  readonly
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.tenant')"
                prop="tenantId"
              >
                <el-select
                  v-model="form.tenantId"
                  :placeholder="$t('license.licenses.selectTenant')"
                  style="width: 100%"
                >
                  <el-option
                    v-for="tenant in availableTenants"
                    :key="tenant.id"
                    :label="tenant.name"
                    :value="tenant.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item
                :label="$t('license.licenses.product')"
                prop="productId"
              >
                <el-select
                  v-model="form.productId"
                  :placeholder="$t('license.licenses.selectProduct')"
                  :disabled="productLocked"
                  style="width: 100%"
                  @change="handleProductChange"
                >
                  <el-option
                    v-for="product in availableProducts"
                    :key="product.id"
                    :label="`${product.name} v${product.version}`"
                    :value="product.id"
                  />
                </el-select>
                <div class="form-tip" v-if="productLocked">
                  {{ $t("license.licenses.productLockedByPlan") }}
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.plan')" prop="planId">
                <el-select
                  v-model="form.planId"
                  :placeholder="$t('license.licenses.selectPlan')"
                  style="width: 100%"
                  @change="handlePlanChange"
                >
                  <el-option
                    v-for="plan in availablePlans"
                    :key="plan.id"
                    :label="`${plan.name} ($${plan.price})`"
                    :value="plan.id"
                  />
                </el-select>
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
              <el-form-item :label="$t('license.licenses.customerCompany')">
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
              <el-form-item :label="$t('license.licenses.customerPhone')">
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
              <el-form-item :label="$t('license.licenses.maxActivations')">
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
                :label="$t('license.licenses.status')"
                prop="status"
              >
                <el-select v-model="form.status" style="width: 100%">
                  <el-option
                    value="generated"
                    :label="$t('license.licenses.statusGenerated')"
                  />
                  <el-option
                    value="activated"
                    :label="$t('license.licenses.statusActivated')"
                  />
                  <el-option
                    value="suspended"
                    :label="$t('license.licenses.statusSuspended')"
                  />
                  <el-option
                    value="revoked"
                    :label="$t('license.licenses.statusRevoked')"
                  />
                  <el-option
                    value="expired"
                    :label="$t('license.licenses.statusExpired')"
                  />
                </el-select>
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
import {
  getProductList,
  getPlanList,
  getLicenseDetail,
  updateLicense
} from "@/api/modules/license";
import { getTenantList } from "@/api/modules/tenantManagement";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const loading = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();

interface LicenseForm {
  id?: number;
  license_key: string;
  productId: number | null;
  planId: number | null;
  tenantId: number | null;
  customerInfo: {
    name: string;
    email: string;
    company: string;
    phone: string;
  };
  maxActivations: number | null;
  status: "generated" | "activated" | "suspended" | "revoked" | "expired";
  notes: string;
}

interface Product {
  id: number;
  name: string;
  version: string;
}

interface Plan {
  id: number;
  name: string;
  product: number;
  price: string;
  product_name: string;
}

interface Tenant {
  id: number;
  name: string;
}

const form = reactive<LicenseForm>({
  license_key: "",
  productId: null,
  planId: null,
  tenantId: null,
  customerInfo: {
    name: "",
    email: "",
    company: "",
    phone: ""
  },
  maxActivations: null,
  status: "generated",
  notes: ""
});

const availableProducts = ref<Product[]>([]);
const availablePlans = ref<Plan[]>([]);
const availableTenants = ref<Tenant[]>([]);
const allPlans = ref<Plan[]>([]); // 存储所有方案，用于过滤
const productLocked = ref(false); // 产品是否被锁定（通过方案选择）

const rules = reactive<FormRules<LicenseForm>>({
  planId: [
    {
      required: true,
      message: t("license.licenses.planIdRequired"),
      trigger: "change"
    }
  ],
  tenantId: [
    {
      required: true,
      message: t("license.licenses.tenantRequired"),
      trigger: "change"
    }
  ],
  "customerInfo.name": [
    {
      required: true,
      message: t("license.licenses.customerNameRequired"),
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
  status: [
    {
      required: true,
      message: t("license.licenses.statusRequired"),
      trigger: "change"
    }
  ]
});

// 加载产品列表
const loadAvailableProducts = async () => {
  try {
    logger.debug("[LicenseEdit] 开始加载产品列表");
    const response = await getProductList({ page_size: 1000 }); // 获取所有产品
    
    if (response.success && response.data) {
      availableProducts.value = response.data.results.map(product => ({
        id: product.id,
        name: product.name,
        version: product.version
      }));
      logger.debug("[LicenseEdit] 产品列表加载成功", availableProducts.value);
    } else {
      throw new Error(response.message || "获取产品列表失败");
    }
  } catch (error) {
    logger.error("[LicenseEdit] 加载产品列表失败", error);
    ElMessage.error(t("license.licenses.loadProductsFailed"));
  }
};

// 加载所有方案
const loadAllPlans = async () => {
  try {
    logger.debug("[LicenseEdit] 开始加载方案列表");
    const response = await getPlanList({ page_size: 1000 }); // 获取所有方案
    
    if (response.success && response.data) {
      allPlans.value = response.data.results.map(plan => ({
        id: plan.id,
        name: plan.name,
        product: plan.product,
        price: plan.price?.toString() || "0.00",
        product_name: plan.product_name || ""
      }));
      
      // 初始显示所有方案
      availablePlans.value = [...allPlans.value];
      logger.debug("[LicenseEdit] 方案列表加载成功", allPlans.value);
    } else {
      throw new Error(response.message || "获取方案列表失败");
    }
  } catch (error) {
    logger.error("[LicenseEdit] 加载方案列表失败", error);
    ElMessage.error(t("license.licenses.loadPlansFailed"));
  }
};

// 加载租户列表
const loadAvailableTenants = async () => {
  try {
    logger.debug("[LicenseEdit] 开始加载租户列表");
    const response = await getTenantList({ page_size: 1000 }); // 获取所有租户
    
    if (response.success && response.data) {
      availableTenants.value = response.data.results.map(tenant => ({
        id: tenant.id,
        name: tenant.name
      }));
      logger.debug("[LicenseEdit] 租户列表加载成功", availableTenants.value);
    } else {
      throw new Error(response.message || "获取租户列表失败");
    }
  } catch (error) {
    logger.error("[LicenseEdit] 加载租户列表失败", error);
    ElMessage.error(t("license.licenses.loadTenantsFailed"));
  }
};

// 产品变更处理（级联选择）
const handleProductChange = (productId: number | null) => {
  if (productId) {
    // 过滤出属于该产品的方案
    availablePlans.value = allPlans.value.filter(
      plan => plan.product === productId
    );

    // 如果当前选择的方案不属于新选择的产品，清空方案选择
    if (form.planId) {
      const selectedPlan = allPlans.value.find(p => p.id === form.planId);
      if (!selectedPlan || selectedPlan.product !== productId) {
        form.planId = null;
        ElMessage.warning(t("license.licenses.planResetDueToProduct"));
      }
    }
  } else {
    // 显示所有方案
    availablePlans.value = [...allPlans.value];
  }

  productLocked.value = false;
  validateProductPlanConsistency();
};

// 方案变更处理（反向级联）
const handlePlanChange = (planId: number | null) => {
  if (planId && !productLocked.value) {
    const selectedPlan = allPlans.value.find(p => p.id === planId);
    if (selectedPlan && selectedPlan.product !== form.productId) {
      // 自动设置产品并锁定
      form.productId = selectedPlan.product;
      productLocked.value = true;

      // 过滤出属于该产品的方案
      availablePlans.value = allPlans.value.filter(
        plan => plan.product === selectedPlan.product
      );

      ElMessage.success(t("license.licenses.productAutoSelected"));
    }
  } else if (!planId) {
    // 如果清空方案选择，解锁产品并显示所有方案
    productLocked.value = false;
    availablePlans.value = [...allPlans.value];
  }

  validateProductPlanConsistency();
};

// 产品-方案一致性验证
const validateProductPlanConsistency = () => {
  if (!form.productId || !form.planId) {
    return true; // 如果没有选择，跳过验证
  }

  const selectedPlan = allPlans.value.find(p => p.id === form.planId);
  if (!selectedPlan || selectedPlan.product !== form.productId) {
    ElMessage.error(t("license.licenses.productPlanMismatch"));
    return false;
  }

  return true;
};

const loadLicenseData = async () => {
  const licenseId = route.params.id;
  if (!licenseId) {
    ElMessage.error(t("license.licenses.invalidId"));
    router.push("/license/licenses");
    return;
  }

  loading.value = true;
  try {
    logger.debug("[LicenseEdit] 开始加载许可证详情", { licenseId });
    const response = await getLicenseDetail(parseInt(licenseId as string));
    
    if (response.success && response.data) {
      const licenseData = response.data;
      
      // 填充表单数据
      Object.assign(form, {
        id: licenseData.id,
        license_key: licenseData.license_key,
        productId: licenseData.product,
        planId: licenseData.plan,
        tenantId: licenseData.tenant,
        customerInfo: {
          name: licenseData.customer_name,
          email: licenseData.customer_email,
          company: "", // API中可能没有此字段，需要根据实际API调整
          phone: "" // API中可能没有此字段，需要根据实际API调整
        },
        maxActivations: licenseData.max_activations,
        status: licenseData.status,
        notes: licenseData.notes || ""
      });
      
      logger.debug("[LicenseEdit] 许可证数据加载成功", form);

      // 设置级联选择状态
      if (form.planId) {
        const selectedPlan = allPlans.value.find(p => p.id === form.planId);
        if (selectedPlan) {
          // 过滤方案列表以匹配当前产品
          availablePlans.value = allPlans.value.filter(
            plan => plan.product === selectedPlan.product
          );
          if (form.productId !== selectedPlan.product) {
            form.productId = selectedPlan.product;
            productLocked.value = true;
          }
        }
      }
    } else {
      throw new Error(response.message || "获取许可证详情失败");
    }
  } catch (error) {
    logger.error("[LicenseEdit] 加载许可证详情失败", error);
    ElMessage.error(t("license.licenses.loadFailed"));
    router.push("/license/licenses");
  } finally {
    loading.value = false;
  }
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

    // 准备提交数据
    const submitData = {
      product: form.productId,
      plan: form.planId,
      tenant: form.tenantId,
      customer_name: form.customerInfo.name,
      customer_email: form.customerInfo.email,
      max_activations: form.maxActivations,
      status: form.status,
      notes: form.notes
    };

    // 调用更新许可证API
    logger.debug("[LicenseEdit] 开始更新许可证", { id: form.id, data: submitData });
    const response = await updateLicense(form.id!, submitData);
    
    if (!response.success) {
      throw new Error(response.message || "更新许可证失败");
    }
    
    logger.debug("[LicenseEdit] 许可证更新成功", response.data);

    ElMessage.success(t("license.licenses.updateSuccess"));
    router.push("/license/licenses");
  } catch (error) {
    console.error("Update license failed:", error);
    ElMessage.error(t("license.licenses.updateFailed"));
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
  Promise.all([
    loadAvailableProducts(),
    loadAllPlans(),
    loadAvailableTenants()
  ]).then(() => {
    loadLicenseData();
  });
});
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.edit-container {
  max-width: 900px;
  margin: 0 auto;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
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
