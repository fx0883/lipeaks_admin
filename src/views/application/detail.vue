<template>
  <div class="application-detail-container">
    <el-card shadow="never" v-loading="applicationStore.loading.detail">
      <template #header>
        <div class="card-header">
          <span>{{ t('application.detail') }}</span>
          <div>
            <el-button type="primary" @click="handleEdit">
              {{ t('application.actions.edit') }}
            </el-button>
            <el-button link @click="router.back()">
              {{ t('common.back') }}
            </el-button>
          </div>
        </div>
      </template>

      <el-descriptions v-if="application" :column="2" border>
        <el-descriptions-item :label="t('application.fields.id')">
          {{ application.id }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.name')">
          {{ application.name }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.code')">
          {{ application.code }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.currentVersion')">
          {{ application.current_version }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.status')">
          <StatusTag :status="application.status" />
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.owner')">
          {{ application.owner || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.team')" :span="2">
          {{ application.team || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.description')" :span="2">
          {{ application.description || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.createdAt')">
          {{ formatDate(application.created_at) }}
        </el-descriptions-item>
        <el-descriptions-item :label="t('application.fields.updatedAt')">
          {{ formatDate(application.updated_at) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 统计信息 -->
    <el-card v-if="statistics" shadow="never" class="statistics-card">
      <template #header>
        <span>{{ t('application.statistics.title') }}</span>
      </template>
      <el-row :gutter="16">
        <el-col :span="8">
          <el-statistic :title="t('application.statistics.licenseTotal')" :value="statistics.licenses.total" />
        </el-col>
        <el-col :span="8">
          <el-statistic :title="t('application.statistics.feedbackTotal')" :value="statistics.feedbacks.total" />
        </el-col>
        <el-col :span="8">
          <el-statistic :title="t('application.statistics.articleTotal')" :value="statistics.articles.total" />
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import StatusTag from "@/components/Application/StatusTag.vue";
import { useApplicationStoreHook } from "@/store/modules/application";
import { formatDate } from "@/utils/dateUtil";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const applicationStore = useApplicationStoreHook();

const application = computed(() => applicationStore.currentApplication);
const statistics = computed(() => applicationStore.statistics);

const fetchData = async () => {
  const id = Number(route.params.id);
  await applicationStore.fetchApplicationDetail(id);
  await applicationStore.fetchApplicationStatistics(id);
};

const handleEdit = () => {
  const id = route.params.id;
  router.push(`/application/edit/${id}`);
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.application-detail-container {
  padding: 16px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .statistics-card {
    margin-top: 16px;
  }
}
</style>
