<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Edit,
  Delete,
  Key,
  Box,
  Refresh
} from "@element-plus/icons-vue";
import { useLicenseStoreHook } from "@/store/modules/license";
import type { SoftwareProduct } from "@/types/license";
import { hasPerms } from "@/utils/auth";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const licenseStore = useLicenseStoreHook();

// 检查用户权限
const checkPermission = () => {
  return hasPerms("license:view");
};

if (!checkPermission()) {
  ElMessage.error("无权限访问此页面");
  router.push("/license/products");
}

// 获取产品ID
const productId = Number(route.params.id);

// 加载状态
const pageLoading = ref(false);

// 产品数据
const product = ref<SoftwareProduct | null>(null);

// 获取产品详情
const fetchProduct = async () => {
  try {
    pageLoading.value = true;
    const response = await licenseStore.fetchProductDetail(productId);
    product.value = response.data;
    await fetchStats();
  } catch (error) {
    logger.error("获取产品详情失败", error);
    ElMessage.error(t("license.products.fetchError"));
    router.push("/license/products");
  } finally {
    pageLoading.value = false;
  }
};

// 获取统计数据
const fetchStats = async () => {
  try {
    const statsResponse = await licenseStore.fetchProductStatistics(productId);
    if (statsResponse.success) {
      stats.value = statsResponse.data;
    }
  } catch (error) {
    logger.error("获取统计数据失败", error);
    // 如果统计API失败，回退到原有方式
    try {
      await licenseStore.fetchPlanList({
        product_id: productId,
        page: 1,
        page_size: 1
      });
      stats.value.plansCount = licenseStore.plans.total || 0;

      await licenseStore.fetchLicenseList({
        product: productId,
        page: 1,
        page_size: 1
      });
      stats.value.licensesCount = licenseStore.licenses.total || 0;

      await licenseStore.fetchLicenseList({
        product: productId,
        status: "active",
        page: 1,
        page_size: 1
      });
      stats.value.activeLicensesCount = licenseStore.licenses.total || 0;
    } catch (fallbackError) {
      logger.error("回退统计数据获取失败", fallbackError);
    }
  }
};

// 统计数据
const stats = ref<any>({
  plansCount: 0,
  licensesCount: 0,
  activeLicensesCount: 0,
  totalRevenue: 0,
  monthlyRevenue: 0,
  totalActivations: 0,
  activeMachines: 0
});

// 返回列表
const handleBack = () => {
  router.push("/license/products");
};

// 编辑产品
const handleEdit = () => {
  router.push(`/license/products/${productId}/edit`);
};

// 查看计划
const handleViewPlans = () => {
  router.push(`/license/plans?product_id=${productId}`);
};

// 查看许可证
const handleViewLicenses = () => {
  router.push(`/license/licenses?product_id=${productId}`);
};

// 重新生成密钥对
const handleRegenerateKeypair = async () => {
  try {
    await ElMessageBox.confirm(
      "重新生成密钥对将使所有使用旧密钥的许可证失效。此操作不可逆，确定继续？",
      "警告",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const response = await licenseStore.regenerateProductKeypair(productId);
    if (response.success) {
      ElMessage.success("密钥对重新生成成功");
      // 重新获取产品信息
      await fetchProduct();
    }
  } catch (error: any) {
    if (error !== "cancel") {
      logger.error("重新生成密钥对失败", error);
      ElMessage.error("重新生成密钥对失败");
    }
  }
};

// 格式化创建时间
const formatCreatedAt = (createdAt: string) => {
  return new Date(createdAt).toLocaleString();
};

// 格式化更新时间
const formatUpdatedAt = (updatedAt: string) => {
  return new Date(updatedAt).toLocaleString();
};

// 页面加载时获取数据
onMounted(() => {
  fetchProduct();
});
</script>

<template>
  <div class="product-detail">
    <!-- 页面头部 -->
    <el-card class="header-card">
      <div class="header-content">
        <div class="header-left">
          <el-button :icon="ArrowLeft" @click="handleBack">
            {{ t("common.back") }}
          </el-button>
          <h2 class="page-title">{{ t("license.products.detail") }}</h2>
        </div>

        <div v-if="product" class="header-right">
          <el-button
            type="warning"
            :icon="Refresh"
            :loading="licenseStore.loading.productUpdate"
            style="margin-right: 8px"
            @click="handleRegenerateKeypair"
          >
            {{ t("license.products.regenerateKeypair") }}
          </el-button>
          <el-button type="primary" :icon="Edit" @click="handleEdit">
            {{ t("common.edit") }}
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 产品信息 -->
    <el-card v-loading="pageLoading" class="info-card">
      <template v-if="product">
        <div class="product-header">
          <div class="product-basic">
            <div class="product-title">
              <el-icon class="product-icon"><Box /></el-icon>
              <h3>{{ product.name }}</h3>
              <el-tag :type="product.is_active ? 'success' : 'info'">
                {{
                  product.is_active ? t("common.active") : t("common.inactive")
                }}
              </el-tag>
            </div>
            <div class="product-version">
              <span class="version-label"
                >{{ t("license.products.version") }}:</span
              >
              <code class="version-code">v{{ product.version }}</code>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- 基本信息 -->
        <div class="info-section">
          <h4 class="section-title">{{ t("license.products.basicInfo") }}</h4>

          <el-row :gutter="24">
            <el-col :span="12">
              <div class="info-item">
                <span class="info-label">{{ t("license.products.id") }}:</span>
                <span class="info-value">{{ product.id }}</span>
              </div>
            </el-col>

            <el-col :span="12" />

            <el-col :span="12">
              <div class="info-item">
                <span class="info-label"
                  >{{ t("license.products.createdAt") }}:</span
                >
                <span class="info-value">{{
                  formatCreatedAt(product.created_at)
                }}</span>
              </div>
            </el-col>

            <el-col :span="12">
              <div class="info-item">
                <span class="info-label"
                  >{{ t("license.products.updatedAt") }}:</span
                >
                <span class="info-value">{{
                  formatUpdatedAt(product.updated_at)
                }}</span>
              </div>
            </el-col>
          </el-row>

          <div v-if="product.description" class="info-item full-width">
            <span class="info-label"
              >{{ t("license.products.description") }}:</span
            >
            <p class="info-value description">{{ product.description }}</p>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-section">
          <h4 class="section-title">{{ t("license.products.statistics") }}</h4>

          <el-row :gutter="24">
            <el-col :span="6">
              <el-card class="stat-card" @click="handleViewPlans">
                <div class="stat-content">
                  <div class="stat-icon plans">
                    <el-icon><Key /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">
                      {{ stats.plansCount || product.license_plans_count || 0 }}
                    </div>
                    <div class="stat-label">
                      {{ t("license.products.plansCount") }}
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card class="stat-card" @click="handleViewLicenses">
                <div class="stat-content">
                  <div class="stat-icon licenses">
                    <el-icon><Key /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">
                      {{ stats.licensesCount || product.total_licenses || 0 }}
                    </div>
                    <div class="stat-label">
                      {{ t("license.products.licensesCount") }}
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon active">
                    <el-icon><Key /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">
                      {{ stats.activeLicensesCount || 0 }}
                    </div>
                    <div class="stat-label">
                      {{ t("license.products.activeLicensesCount") }}
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>

            <el-col :span="6">
              <el-card class="stat-card">
                <div class="stat-content">
                  <div class="stat-icon revenue">
                    <el-icon><Key /></el-icon>
                  </div>
                  <div class="stat-info">
                    <div class="stat-number">
                      {{ stats.totalActivations || 0 }}
                    </div>
                    <div class="stat-label">
                      {{ t("license.products.totalActivations") }}
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.product-detail {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.info-card {
  background: #ffffff;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-title {
  margin: 0;
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.product-header {
  margin-bottom: 24px;
}

.product-basic {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.product-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-icon {
  font-size: 24px;
  color: #409eff;
}

.product-title h3 {
  margin: 0;
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}

.product-version {
  display: flex;
  align-items: center;
  gap: 8px;
}

.version-label {
  color: #909399;
  font-size: 14px;
}

.version-code {
  background: #f0f9ff;
  color: #0369a1;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
  font-size: 14px;
  font-weight: 500;
}

.info-section,
.stats-section {
  margin-bottom: 32px;
}

.section-title {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.info-item.full-width {
  flex-direction: column;
  gap: 8px;
}

.info-label {
  color: #606266;
  font-weight: 500;
  min-width: 120px;
  flex-shrink: 0;
}

.info-value {
  color: #303133;
}

.description {
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.plans {
  background: #e3f2fd;
  color: #1976d2;
}

.stat-icon.licenses {
  background: #f3e5f5;
  color: #7b1fa2;
}

.stat-icon.active {
  background: #e8f5e8;
  color: #388e3c;
}

.stat-icon.revenue {
  background: #fff3e0;
  color: #f57c00;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 4px;
}
</style>
