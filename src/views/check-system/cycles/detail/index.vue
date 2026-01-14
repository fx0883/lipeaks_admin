<template>
  <div class="cycle-detail-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="page-title">周期详情</span>
        </template>
      </el-page-header>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20" v-if="cycle">
        <!-- 左侧：周期信息 -->
        <el-col :span="16">
          <el-card shadow="never" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>周期信息</span>
                <el-tag :type="cycle.is_active ? 'success' : 'info'">
                  {{ cycle.is_active ? "活跃" : "已结束" }}
                </el-tag>
              </div>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="成员">
                {{ cycle.member_name }}
              </el-descriptions-item>
              <el-descriptions-item label="当前天数">
                第{{ cycle.current_day }}天 / 21天
              </el-descriptions-item>
              <el-descriptions-item label="开始日期">
                {{ cycle.start_date }}
              </el-descriptions-item>
              <el-descriptions-item label="结束日期">
                {{ cycle.end_date }}
              </el-descriptions-item>
              <el-descriptions-item label="进度" :span="2">
                <el-progress :percentage="cycle.progress" :stroke-width="12" style="max-width: 300px" />
              </el-descriptions-item>
            </el-descriptions>

            <!-- 选中主题 -->
            <div class="themes-section" v-if="cycle.themes && cycle.themes.length">
              <h4>选中的主题</h4>
              <div class="themes-list">
                <el-tag
                  v-for="theme in cycle.themes"
                  :key="theme.id"
                  style="margin-right: 8px; margin-bottom: 8px"
                >
                  {{ theme.name }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：统计信息 -->
        <el-col :span="8">
          <el-card shadow="never" class="stats-card" v-loading="statisticsLoading">
            <template #header>
              <span>统计信息</span>
            </template>

            <div class="stats-grid" v-if="statistics">
              <div class="stat-item">
                <div class="stat-value">{{ statistics.total_checkins }}</div>
                <div class="stat-label">总打卡次数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value success">{{ statistics.unique_days }}</div>
                <div class="stat-label">打卡天数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value primary">{{ statistics.themes_completed }}</div>
                <div class="stat-label">完成主题数</div>
              </div>
              <div class="stat-item">
                <div class="stat-value warning">{{ statistics.selected_themes_count }}</div>
                <div class="stat-label">选中主题数</div>
              </div>
            </div>

            <el-empty v-else :description="'暂无统计数据'" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-else-if="!loading" description="周期不存在" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useCycleDetail } from "@/composables/useCheckSystem";

const router = useRouter();
const route = useRoute();

// 周期ID
const cycleId = computed(() => Number(route.params.id) || 0);

// 周期详情
const {
  cycle,
  statistics,
  loading,
  statisticsLoading,
  refresh
} = useCycleDetail(cycleId);

// 初始化
onMounted(() => {
  if (cycleId.value) {
    refresh(cycleId.value);
  }
});

/**
 * 返回列表
 */
const handleBack = () => {
  router.push("/check-system/cycles/list");
};
</script>

<style lang="scss" scoped>
.cycle-detail-container {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;

    .page-title {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-card {
    margin-bottom: 20px;

    .themes-section {
      margin-top: 24px;

      h4 {
        margin: 0 0 12px;
        font-size: 14px;
        color: #606266;
      }

      .themes-list {
        display: flex;
        flex-wrap: wrap;
      }
    }
  }

  .stats-card {
    margin-bottom: 20px;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .stat-item {
        text-align: center;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;

          &.success {
            color: #67c23a;
          }

          &.primary {
            color: #409eff;
          }

          &.warning {
            color: #e6a23c;
          }
        }

        .stat-label {
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }
}
</style>
