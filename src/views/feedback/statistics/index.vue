<template>
  <div class="feedback-statistics-container">
    <div class="page-header">
      <h2>{{ t("feedback.statistics") }}</h2>
      <div class="header-actions">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          :start-placeholder="t('feedback.stats.startDate')"
          :end-placeholder="t('feedback.stats.endDate')"
          @change="handleDateChange"
        />
        <el-button :icon="Refresh" @click="handleRefresh">
          {{ t("buttons.refresh") }}
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-grid" v-loading="loading">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div
            class="stat-icon"
            style="background-color: #ecf5ff; color: #409eff"
          >
            <IconifyIconOffline
              :icon="TotalIcon"
              :style="{ fontSize: '36px' }"
            />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ t("feedback.stats.total") }}</div>
            <div class="stat-value">{{ statistics?.total_feedbacks || 0 }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div
            class="stat-icon"
            style="background-color: #fef0f0; color: #f56c6c"
          >
            <IconifyIconOffline
              :icon="OpenIcon"
              :style="{ fontSize: '36px' }"
            />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ t("feedback.stats.open") }}</div>
            <div class="stat-value">{{ statistics?.open_feedbacks || 0 }}</div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div
            class="stat-icon"
            style="background-color: #f0f9ff; color: #67c23a"
          >
            <IconifyIconOffline
              :icon="ResolvedIcon"
              :style="{ fontSize: '36px' }"
            />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ t("feedback.stats.resolved") }}</div>
            <div class="stat-value">
              {{ statistics?.resolved_feedbacks || 0 }}
            </div>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div
            class="stat-icon"
            style="background-color: #fdf6ec; color: #e6a23c"
          >
            <IconifyIconOffline
              :icon="TimeIcon"
              :style="{ fontSize: '36px' }"
            />
          </div>
          <div class="stat-info">
            <div class="stat-label">{{ t("feedback.stats.avgTime") }}</div>
            <div class="stat-value stat-value-small">
              {{ statistics?.avg_resolution_time || "N/A" }}
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <div class="charts-grid">
      <!-- 每日趋势图 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span>{{ t("feedback.stats.dailyTrend") }}</span>
        </template>
        <div ref="trendChartRef" class="chart-container"></div>
      </el-card>

      <!-- 优先级分布 -->
      <el-card class="chart-card" shadow="never">
        <template #header>
          <span>{{ t("feedback.stats.priorityDistribution") }}</span>
        </template>
        <div ref="priorityChartRef" class="chart-container"></div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { getFeedbackStatistics } from "@/api/modules/feedback";
import type { FeedbackStatistics } from "@/types/feedback";
import { Refresh } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import * as echarts from "echarts";
import type { ECharts } from "echarts";

// Icons
const TotalIcon = "ep:document";
const OpenIcon = "ep:folder-opened";
const ResolvedIcon = "ep:circle-check";
const TimeIcon = "ep:timer";

const { t } = useI18n();

// 统计数据
const statistics = ref<FeedbackStatistics | null>(null);
const loading = ref(false);

// 日期范围
const dateRange = ref<[Date, Date] | null>(null);

// 图表引用
const trendChartRef = ref<HTMLDivElement>();
const priorityChartRef = ref<HTMLDivElement>();
let trendChart: ECharts | null = null;
let priorityChart: ECharts | null = null;

/**
 * 获取统计数据
 */
const fetchStatistics = async () => {
  loading.value = true;

  try {
    const params: any = {};

    if (dateRange.value) {
      params.date_from = dayjs(dateRange.value[0]).format("YYYY-MM-DD");
      params.date_to = dayjs(dateRange.value[1]).format("YYYY-MM-DD");
    }

    const response = await getFeedbackStatistics(params);

    if (response.success && response.data) {
      statistics.value = response.data;
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
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
  }
  if (priorityChartRef.value) {
    priorityChart = echarts.init(priorityChartRef.value);
  }
};

/**
 * 更新图表
 */
const updateCharts = () => {
  if (!statistics.value) return;

  // 每日趋势折线图
  if (trendChart && statistics.value.daily_trend) {
    const trendData = statistics.value.daily_trend;

    trendChart.setOption({
      tooltip: {
        trigger: "axis"
      },
      xAxis: {
        type: "category",
        data: trendData.map(item => item.date)
      },
      yAxis: {
        type: "value"
      },
      series: [
        {
          type: "line",
          data: trendData.map(item => item.count),
          smooth: true,
          itemStyle: {
            color: "#409eff"
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(64, 158, 255, 0.3)" },
              { offset: 1, color: "rgba(64, 158, 255, 0.05)" }
            ])
          }
        }
      ]
    });
  }

  // 优先级分布饼图
  if (priorityChart && statistics.value.feedbacks_by_priority) {
    const priorityData = Object.entries(
      statistics.value.feedbacks_by_priority
    ).map(([name, value]) => ({
      name: getPriorityLabel(name),
      value
    }));

    priorityChart.setOption({
      tooltip: {
        trigger: "item"
      },
      legend: {
        bottom: "0%"
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: priorityData,
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
};

/**
 * 处理日期变化
 */
const handleDateChange = () => {
  fetchStatistics();
};

/**
 * 刷新数据
 */
const handleRefresh = () => {
  fetchStatistics();
};

/**
 * 获取优先级标签
 */
const getPriorityLabel = (priority: string) => {
  const priorityLabels: Record<string, string> = {
    critical: "紧急",
    high: "高",
    medium: "中",
    low: "低"
  };
  return priorityLabels[priority] || priority;
};

// 窗口大小变化处理
const handleResize = () => {
  trendChart?.resize();
  priorityChart?.resize();
};

// 页面加载
onMounted(() => {
  fetchStatistics();
  initCharts();
  window.addEventListener("resize", handleResize);
});

// 页面卸载
onUnmounted(() => {
  trendChart?.dispose();
  priorityChart?.dispose();
  window.removeEventListener("resize", handleResize);
});

// 监听统计数据变化
watch(
  () => statistics.value,
  () => {
    updateCharts();
  }
);
</script>

<style lang="scss" scoped>
.feedback-statistics-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 24px;

    .stat-card {
      .stat-content {
        display: flex;
        align-items: center;
        gap: 20px;

        .stat-icon {
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
        }

        .stat-info {
          flex: 1;

          .stat-label {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }

          .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #303133;

            &.stat-value-small {
              font-size: 18px;
            }
          }
        }
      }
    }
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;

    .chart-card {
      .chart-container {
        width: 100%;
        height: 400px;
      }
    }
  }
}
</style>
