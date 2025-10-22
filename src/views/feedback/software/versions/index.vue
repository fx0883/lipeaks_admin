<template>
  <div class="software-versions-container">
    <div class="page-header">
      <h2>{{ t("feedback.software.versions") }}</h2>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item :label="t('feedback.software.software')">
          <el-select
            v-model="filterSoftwareId"
            :placeholder="t('feedback.software.selectSoftware')"
            clearable
            filterable
            @change="handleFilterChange"
          >
            <el-option
              v-for="software in softwareList"
              :key="software.id"
              :label="software.name"
              :value="software.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.software.stable')">
          <el-select
            v-model="filterStable"
            :placeholder="t('feedback.filters.all')"
            clearable
            @change="handleFilterChange"
          >
            <el-option :label="t('common.yes')" :value="true" />
            <el-option :label="t('common.no')" :value="false" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 版本列表 -->
    <el-card shadow="never" v-loading="loading">
      <el-table :data="versions" stripe style="width: 100%">
        <el-table-column
          prop="software_name"
          :label="t('feedback.software.software')"
          min-width="150"
        />
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
          min-width="250"
        />
        <el-table-column
          prop="is_stable"
          :label="t('feedback.software.stable')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_stable ? 'success' : 'warning'" size="small">
              {{ row.is_stable ? t("common.yes") : t("common.no") }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="is_active"
          :label="t('feedback.software.status')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? t("common.active") : t("common.inactive") }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  getSoftwareVersionList,
  getSoftwareList
} from "@/api/modules/feedback";
import type { SoftwareVersion, Software } from "@/types/feedback";

const { t } = useI18n();

// 数据状态
const versions = ref<SoftwareVersion[]>([]);
const softwareList = ref<Software[]>([]);
const loading = ref(false);

// 筛选器
const filterSoftwareId = ref<number | null>(null);
const filterStable = ref<boolean | null>(null);

/**
 * 获取版本列表
 */
const fetchVersions = async () => {
  loading.value = true;

  try {
    const params: any = {
      ordering: "-version_code"
    };

    if (filterSoftwareId.value) {
      params.software = filterSoftwareId.value;
    }
    if (filterStable.value !== null) {
      params.is_stable = filterStable.value;
    }

    const response = await getSoftwareVersionList(params);

    if (response.success && response.data) {
      versions.value = response.data;
    }
  } catch (error) {
    console.error("获取版本列表失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 获取软件列表（用于筛选）
 */
const fetchSoftwareList = async () => {
  try {
    const response = await getSoftwareList({ is_active: true });

    if (response.success && response.data) {
      softwareList.value = response.data.results || [];
    }
  } catch (error) {
    console.error("获取软件列表失败:", error);
  }
};

/**
 * 处理筛选器变化
 */
const handleFilterChange = () => {
  fetchVersions();
};

// 页面加载
onMounted(() => {
  fetchSoftwareList();
  fetchVersions();
});
</script>

<style lang="scss" scoped>
.software-versions-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }
}
</style>
