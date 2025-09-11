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
            $t("license.plans.detail")
          }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ planData.name }}</h2>
            <el-tag :type="planData.status === 'active' ? 'success' : 'danger'">
              {{
                planData.status === "active"
                  ? $t("license.plans.active")
                  : $t("license.plans.inactive")
              }}
            </el-tag>
            <el-tag
              v-if="planData.plan_type"
              :type="getPlanTypeTagType(planData.plan_type)"
            >
              {{
                $t(
                  `license.plans.type${planData.plan_type.charAt(0).toUpperCase() + planData.plan_type.slice(1)}`
                )
              }}
            </el-tag>
          </div>
          <div class="action-section">
            <el-button type="primary" @click="handleEdit">
              {{ $t("common.edit") }}
            </el-button>
            <el-button @click="handleBack">
              {{ $t("common.back") }}
            </el-button>
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.plans.basicInfo") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.plans.name')">
                  {{ planData.name }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.code')">
                  {{ planData.code }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.product')">
                  {{ planData.product_name || "-" }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.type')">
                  {{
                    $t(
                      `license.plans.type${planData.plan_type?.charAt(0).toUpperCase() + planData.plan_type?.slice(1)}`
                    )
                  }}
                </el-descriptions-item>
                <el-descriptions-item
                  :label="$t('license.plans.price')"
                  :span="2"
                >
                  {{ planData.price }} {{ planData.currency }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.plans.limits") }}</span>
              </template>

              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.plans.maxMachines')">
                  {{ planData.max_machines || $t("common.unlimited") }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.validityDays')">
                  {{
                    planData.validity_days
                      ? `${planData.validity_days} ${$t("common.days")}`
                      : $t("common.unlimited")
                  }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card
              v-if="
                planData.features && Object.keys(planData.features).length > 0
              "
              class="detail-card"
              shadow="never"
            >
              <template #header>
                <span>{{ $t("license.plans.features") }}</span>
              </template>

              <div class="features-content">
                <pre>{{ formatFeatures(planData.features) }}</pre>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span>{{ $t("license.plans.statistics") }}</span>
              </template>

              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.totalLicenses }}</div>
                  <div class="stat-label">
                    {{ $t("license.plans.totalLicenses") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.activeLicenses }}</div>
                  <div class="stat-label">
                    {{ $t("license.plans.activeLicenses") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.revenue }}</div>
                  <div class="stat-label">
                    {{ $t("license.plans.totalRevenue") }}
                  </div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.activeUsers }}</div>
                  <div class="stat-label">
                    {{ $t("license.plans.activeUsers") }}
                  </div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t("license.plans.timeline") }}</span>
              </template>

              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('common.createdAt')">
                  {{ formatDate(planData.created_at) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedAt')">
                  {{ formatDate(planData.updated_at) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useLicenseStoreHook } from "@/store/modules/license";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const licenseStore = useLicenseStoreHook();

const loading = ref(false);

interface PlanData {
  id: number;
  product: number;
  product_name?: string;
  name: string;
  code: string;
  plan_type: string;
  max_machines: number;
  validity_days: number;
  features?: Record<string, any>;
  price: string;
  currency: string;
  status: string;
  licenses_count?: number;
  created_at: string;
  updated_at: string;
}

interface Statistics {
  totalLicenses: number;
  activeLicenses: number;
  revenue: string;
  activeUsers: number;
}

const planData = reactive<PlanData>({
  id: 0,
  product: 0,
  product_name: "",
  name: "",
  code: "",
  plan_type: "",
  max_machines: 0,
  validity_days: 0,
  features: {},
  price: "0.00",
  currency: "CNY",
  status: "active",
  licenses_count: 0,
  created_at: "",
  updated_at: ""
});

const statistics = reactive<Statistics>({
  totalLicenses: 0,
  activeLicenses: 0,
  revenue: "$0",
  activeUsers: 0
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
      Object.assign(planData, {
        id: plan.id,
        product: plan.product,
        product_name: plan.product_name,
        name: plan.name,
        code: plan.code,
        plan_type: plan.plan_type,
        max_machines: plan.max_machines,
        validity_days: plan.validity_days,
        features: plan.features,
        price: plan.price,
        currency: plan.currency,
        status: plan.status,
        licenses_count: plan.licenses_count,
        created_at: plan.created_at,
        updated_at: plan.updated_at
      });

      // 模拟统计数据 - 在实际项目中可能需要单独的API
      Object.assign(statistics, {
        totalLicenses: plan.licenses_count || 0,
        activeLicenses: Math.floor((plan.licenses_count || 0) * 0.9),
        revenue: `${plan.currency} ${(parseFloat(plan.price) * (plan.licenses_count || 0)).toFixed(2)}`,
        activeUsers: Math.floor(
          (plan.licenses_count || 0) * plan.max_machines * 0.8
        )
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

const formatFeatures = (features?: Record<string, any>) => {
  if (!features || typeof features !== "object") return "-";
  return JSON.stringify(features, null, 2);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
};

const getPlanTypeTagType = (type: string) => {
  const typeMap = {
    trial: "",
    basic: "success",
    professional: "warning",
    enterprise: "danger",
    custom: "info"
  };
  return typeMap[type as keyof typeof typeMap] || "";
};

const handleEdit = () => {
  router.push(`/license/plans/edit/${planData.id}`);
};

const handleBack = () => {
  router.back();
};

onMounted(() => {
  loadPlanData();
});
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-section h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.action-section {
  display: flex;
  gap: 10px;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card :deep(.el-card__header) {
  background-color: var(--el-bg-color-page);
  font-weight: 600;
}

.stats-card :deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.stats-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  background-color: var(--el-bg-color);
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.features-content,
.limitations-content,
.metadata-content {
  background-color: var(--el-bg-color-page);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.features-content pre,
.limitations-content pre,
.metadata-content pre {
  margin: 0;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.el-descriptions__body) {
  background-color: var(--el-bg-color);
}

:deep(.el-descriptions-item__label) {
  font-weight: 500;
  background-color: var(--el-bg-color-page);
}
</style>
