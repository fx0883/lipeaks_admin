<template>
  <div class="feedback-dashboard-container">
    <h2>{{ t("feedback.dashboard") }}</h2>

    <div class="dashboard-grid">
      <!-- 关键指标卡片 -->
      <el-card class="metric-card" shadow="hover">
        <div class="metric-content">
          <div class="metric-icon total">
            <IconifyIconOffline
              :icon="Document"
              :style="{ fontSize: '32px' }"
            />
          </div>
          <div class="metric-info">
            <div class="metric-label">
              {{ t("feedback.stats.totalFeedbacks") }}
            </div>
            <div class="metric-value">
              {{ statistics?.total_feedbacks || 0 }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="metric-card" shadow="hover">
        <div class="metric-content">
          <div class="metric-icon open">
            <IconifyIconOffline :icon="Clock" :style="{ fontSize: '32px' }" />
          </div>
          <div class="metric-info">
            <div class="metric-label">
              {{ t("feedback.stats.openFeedbacks") }}
            </div>
            <div class="metric-value">
              {{ statistics?.open_feedbacks || 0 }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="metric-card" shadow="hover">
        <div class="metric-content">
          <div class="metric-icon resolved">
            <IconifyIconOffline
              :icon="CircleCheck"
              :style="{ fontSize: '32px' }"
            />
          </div>
          <div class="metric-info">
            <div class="metric-label">
              {{ t("feedback.stats.resolvedFeedbacks") }}
            </div>
            <div class="metric-value">
              {{ statistics?.resolved_feedbacks || 0 }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="metric-card" shadow="hover">
        <div class="metric-content">
          <div class="metric-icon time">
            <IconifyIconOffline :icon="Timer" :style="{ fontSize: '32px' }" />
          </div>
          <div class="metric-info">
            <div class="metric-label">
              {{ t("feedback.stats.avgResolutionTime") }}
            </div>
            <div class="metric-value">
              {{ statistics?.avg_resolution_time || "N/A" }}
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <!-- 反馈类型分布 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span>{{ t("feedback.stats.feedbacksByType") }}</span>
        </template>
        <div ref="typeChartRef" class="chart-container"></div>
      </el-card>

      <!-- 反馈状态分布 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span>{{ t("feedback.stats.feedbacksByStatus") }}</span>
        </template>
        <div ref="statusChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <!-- 热门反馈列表 -->
    <el-card class="top-feedbacks-card" shadow="never" v-loading="loading">
      <template #header>
        <span>{{ t("feedback.stats.topVoted") }}</span>
      </template>
      <el-table :data="statistics?.top_voted_feedbacks || []" stripe>
        <el-table-column
          prop="title"
          :label="t('feedback.feedbacks.title')"
          min-width="300"
        />
        <el-table-column
          prop="vote_count"
          :label="t('feedback.feedbacks.votes')"
          width="100"
          align="center"
        >
          <template #default="{ row }">
            <el-tag type="success">{{ row.vote_count }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          :label="t('feedback.feedbacks.status')"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('buttons.actions')" width="100">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewFeedback(row.id)"
            >
              {{ t("buttons.view") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 最新反馈列表 -->
    <el-card class="recent-feedbacks-card" shadow="never" v-loading="loading">
      <template #header>
        <span>{{ t("feedback.stats.recentFeedbacks") }}</span>
      </template>
      <el-table :data="statistics?.recent_feedbacks || []" stripe>
        <el-table-column
          prop="title"
          :label="t('feedback.feedbacks.title')"
          min-width="300"
        />
        <el-table-column
          prop="created_at"
          :label="t('feedback.feedbacks.createdAt')"
          width="180"
        >
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="status"
          :label="t('feedback.feedbacks.status')"
          width="120"
        >
          <template #default="{ row }">
            <el-tag :type="getStatusTag(row.status)" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('buttons.actions')" width="100">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewFeedback(row.id)"
            >
              {{ t("buttons.view") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
// Application 管理已移至 @/composables/useApplication
import { getFeedbackStatistics } from "@/api/modules/feedback";
import type { FeedbackStatistics } from "@/types/feedback";
import { Plus } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
import type { ECharts } from "echarts";

// Icons
const Document = "ep:document";
const Clock = "ep:clock";
const CircleCheck = "ep:circle-check";
const Timer = "ep:timer";
const Search = "ep:search";

const { t } = useI18n();
const router = useRouter();

// 筛选器状态（应用选择已移至 Application 管理模块）

// 数据状态
const statistics = ref<FeedbackStatistics | null>(null);
const loading = ref(false);

// 图表引用
const typeChartRef = ref<HTMLDivElement>();
const statusChartRef = ref<HTMLDivElement>();
let typeChart: ECharts | null = null;
let statusChart: ECharts | null = null;

// 筛选器
const filterCategoryId = ref<number | null>(null);
const filterStatus = ref<string>("");
const searchText = ref("");

// 创建对话框
const createDialogVisible = ref(false);

/**
 * 获取统计数据
 */
const fetchStatistics = async () => {
  loading.value = true;

  try {
    const response = await getFeedbackStatistics();

    if (response.success && response.data) {
      statistics.value = response.data;

      // 更新图表
      updateCharts();
    }
  } catch (error) {
    console.error("获取统计数据失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 初始化图表
 */
const initCharts = () => {
  if (typeChartRef.value) {
    typeChart = echarts.init(typeChartRef.value);
  }
  if (statusChartRef.value) {
    statusChart = echarts.init(statusChartRef.value);
  }
};

/**
 * 更新图表
 */
const updateCharts = () => {
  if (!statistics.value) return;

  // 类型分布饼图
  if (typeChart && statistics.value.feedbacks_by_type) {
    const typeData = Object.entries(statistics.value.feedbacks_by_type).map(
      ([name, value]) => ({
        name: getTypeLabel(name),
        value
      })
    );

    typeChart.setOption({
      tooltip: {
        trigger: "item"
      },
      series: [
        {
          type: "pie",
          radius: "50%",
          data: typeData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: "rgba(0, 0, 0, 0.5)"
            }
          }
        }
      ]
    });
  }

  // 状态分布柱状图
  if (statusChart && statistics.value.feedbacks_by_status) {
    const statusData = Object.entries(statistics.value.feedbacks_by_status);

    statusChart.setOption({
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "shadow"
        }
      },
      xAxis: {
        type: "category",
        data: statusData.map(([name]) => name)
      },
      yAxis: {
        type: "value"
      },
      series: [
        {
          type: "bar",
          data: statusData.map(([, value]) => value),
          itemStyle: {
            color: "#409eff"
          }
        }
      ]
    });
  }
};

/**
 * 处理筛选器变化
 */
const handleFilterChange = () => {
  // 在实际项目中可能需要根据筛选器重新获取数据
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  // 搜索逻辑
};

/**
 * 查看反馈详情
 */
const handleViewFeedback = (id: number) => {
  router.push(`/feedback/feedbacks/detail/${id}`);
};

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

/**
 * 获取类型标签文本
 */
const getTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    bug: "Bug",
    feature: "功能",
    improvement: "改进",
    question: "问题",
    other: "其他"
  };
  return typeLabels[type] || type;
};

/**
 * 获取状态标签颜色
 */
const getStatusTag = (status: string) => {
  const statusMap: Record<string, any> = {
    submitted: "info",
    reviewing: "warning",
    confirmed: "primary",
    in_progress: "warning",
    resolved: "success",
    closed: "info",
    rejected: "danger",
    duplicate: "info"
  };
  return statusMap[status] || "info";
};

// 页面加载时
onMounted(() => {
  fetchStatistics();
  initCharts();

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
});

// 页面卸载时
onUnmounted(() => {
  typeChart?.dispose();
  statusChart?.dispose();
  window.removeEventListener("resize", handleResize);
});

// 窗口大小变化时重绘图表
const handleResize = () => {
  typeChart?.resize();
  statusChart?.resize();
};

// 监听统计数据变化，更新图表
watch(
  () => statistics.value,
  () => {
    updateCharts();
  }
);
</script>

<style lang="scss" scoped>
.feedback-dashboard-container {
  padding: 20px;

  h2 {
    margin: 0 0 24px 0;
    font-size: 24px;
    font-weight: 600;
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .metric-card {
      .metric-content {
        display: flex;
        align-items: center;
        gap: 20px;

        .metric-icon {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;

          &.total {
            background-color: #ecf5ff;
            color: #409eff;
          }

          &.open {
            background-color: #fef0f0;
            color: #f56c6c;
          }

          &.resolved {
            background-color: #f0f9ff;
            color: #67c23a;
          }

          &.time {
            background-color: #fdf6ec;
            color: #e6a23c;
          }
        }

        .metric-info {
          flex: 1;

          .metric-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .metric-value {
            font-size: 28px;
            font-weight: 600;
            color: #303133;
          }
        }
      }
    }
  }

  .charts-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 24px;

    .chart-card {
      .chart-container {
        width: 100%;
        height: 350px;
      }
    }
  }

  .top-feedbacks-card,
  .recent-feedbacks-card {
    margin-bottom: 24px;
  }
}
</style>
