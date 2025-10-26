<template>
  <div class="software-product-detail-container" v-loading="loading">
    <div v-if="software" class="product-content">
      <!-- 返回按钮 -->
      <div class="page-header">
        <el-button :icon="ArrowLeft" @click="handleBack">
          {{ t("buttons.back") }}
        </el-button>
      </div>

      <!-- 软件基本信息 -->
      <el-card class="info-card" shadow="never">
        <div class="product-header">
          <el-avatar v-if="software.logo" :src="software.logo" :size="80" />
          <div class="product-info">
            <h1>{{ software.name }}</h1>
            <div class="product-tags">
              <el-tag :type="getStatusTag(software.status)">
                {{ getStatusLabel(software.status) }}
              </el-tag>
              <el-tag v-if="software.current_version" type="primary">
                {{ software.current_version }}
              </el-tag>
            </div>
          </div>
        </div>

        <el-descriptions :column="2" border style="margin-top: 20px">
          <el-descriptions-item :label="t('feedback.software.productCode')">
            {{ software.code }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('feedback.software.category')">
            {{ getCategoryName(software) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('feedback.software.owner')">
            {{ software.owner || "-" }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('feedback.software.team')">
            {{ software.team || "-" }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="t('feedback.software.website')"
            :span="2"
          >
            <a v-if="software.website" :href="software.website" target="_blank">
              {{ software.website }}
            </a>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item
            :label="t('feedback.software.contactEmail')"
            :span="2"
          >
            {{ software.contact_email || "-" }}
          </el-descriptions-item>
          <el-descriptions-item
            :label="t('feedback.software.description')"
            :span="2"
          >
            {{ software.description || "-" }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 统计信息 -->
      <el-card class="stats-card" shadow="never">
        <h3>{{ t("feedback.software.statistics") }}</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">
              {{ t("feedback.software.totalFeedbacks") }}
            </div>
            <div class="stat-value">{{ software.total_feedbacks || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">
              {{ t("feedback.software.openFeedbacks") }}
            </div>
            <div class="stat-value">{{ software.open_feedbacks || 0 }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">
              {{ t("feedback.software.versionCount") }}
            </div>
            <div class="stat-value">{{ software.version_count || 0 }}</div>
          </div>
        </div>
      </el-card>

      <!-- 版本列表 -->
      <el-card
        v-if="software.versions && software.versions.length > 0"
        class="versions-card"
        shadow="never"
      >
        <h3>{{ t("feedback.software.versions") }}</h3>
        <el-table :data="software.versions" stripe>
          <el-table-column
            prop="version"
            :label="t('feedback.software.versionNumber')"
            width="120"
          />
          <el-table-column
            prop="version_code"
            :label="t('feedback.software.versionCode')"
            width="100"
          />
          <el-table-column
            prop="release_date"
            :label="t('feedback.software.releaseDate')"
            width="120"
          />
          <el-table-column
            prop="release_notes"
            :label="t('feedback.software.releaseNotes')"
            min-width="200"
          />
          <el-table-column
            prop="is_stable"
            :label="t('feedback.software.stable')"
            width="100"
            align="center"
          >
            <template #default="{ row }">
              <el-tag
                :type="row.is_stable ? 'success' : 'warning'"
                size="small"
              >
                {{ row.is_stable ? t("common.yes") : t("common.no") }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="!loading" class="error-state">
      <el-empty :description="t('feedback.software.notFound')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { getSoftwareDetail } from "@/api/modules/feedback";
import type { Software } from "@/types/feedback";
import { ArrowLeft } from "@element-plus/icons-vue";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

// 软件ID
const softwareId = computed(() => parseInt(route.params.id as string));

// 数据状态
const software = ref<Software | null>(null);
const loading = ref(false);

/**
 * 获取软件详情
 */
const fetchDetail = async () => {
  loading.value = true;

  try {
    const response = await getSoftwareDetail(softwareId.value);

    if (response.success && response.data) {
      software.value = response.data;
    }
  } catch (error) {
    console.error("获取软件详情失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 返回
 */
const handleBack = () => {
  router.back();
};

/**
 * 获取状态标签颜色
 */
const getStatusTag = (status: string) => {
  const statusMap: Record<string, any> = {
    development: "info",
    testing: "warning",
    released: "success",
    maintenance: "primary",
    deprecated: "danger"
  };
  return statusMap[status] || "info";
};

/**
 * 获取状态标签文本
 */
const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    development: "开发中",
    testing: "测试中",
    released: "已发布",
    maintenance: "维护中",
    deprecated: "已废弃"
  };
  return statusLabels[status] || status;
};

/**
 * 获取分类名称
 */
const getCategoryName = (soft: Software) => {
  if (typeof soft.category === "object" && soft.category !== null) {
    return soft.category.name;
  }
  return soft.category_name || "-";
};

// 页面加载
onMounted(() => {
  fetchDetail();
});
</script>

<style lang="scss" scoped>
.software-product-detail-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 20px;
  }

  .product-content {
    .info-card {
      margin-bottom: 20px;

      .product-header {
        display: flex;
        align-items: center;
        gap: 20px;
        margin-bottom: 20px;

        .product-info {
          flex: 1;

          h1 {
            margin: 0 0 12px 0;
            font-size: 28px;
            font-weight: 600;
          }

          .product-tags {
            display: flex;
            gap: 10px;
          }
        }
      }
    }

    .stats-card {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 20px;

        .stat-item {
          text-align: center;
          padding: 20px;
          background-color: #f5f7fa;
          border-radius: 8px;

          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #409eff;
          }
        }
      }
    }

    .versions-card {
      h3 {
        margin: 0 0 20px 0;
        font-size: 18px;
        font-weight: 600;
      }
    }
  }

  .error-state {
    padding: 60px 0;
    text-align: center;
  }
}
</style>
