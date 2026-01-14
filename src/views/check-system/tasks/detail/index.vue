<template>
  <div class="task-detail-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="page-title">任务详情</span>
        </template>
      </el-page-header>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20" v-if="task">
        <!-- 左侧：任务信息 -->
        <el-col :span="16">
          <el-card shadow="never" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>任务信息</span>
                <el-tag :type="getStatusTagType(task.status)">
                  {{ getStatusLabel(task.status) }}
                </el-tag>
              </div>
            </template>

            <el-descriptions :column="2" border>
              <el-descriptions-item label="任务名称" :span="2">
                {{ task.name }}
              </el-descriptions-item>
              <el-descriptions-item label="任务描述" :span="2">
                {{ task.description || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="任务类型">
                {{ task.category_name }}
              </el-descriptions-item>
              <el-descriptions-item label="所属成员">
                {{ task.member_name }}
              </el-descriptions-item>
              <el-descriptions-item label="开始日期">
                {{ task.start_date }}
              </el-descriptions-item>
              <el-descriptions-item label="结束日期">
                {{ task.end_date || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="频率类型">
                {{ getFrequencyLabel(task.frequency_type) }}
              </el-descriptions-item>
              <el-descriptions-item label="频率天数">
                {{ task.frequency_days?.join(", ") || "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="提醒开关">
                <el-tag :type="task.reminder ? 'success' : 'info'" size="small">
                  {{ task.reminder ? "开启" : "关闭" }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="提醒时间">
                {{ task.reminder_time || "-" }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>

        <!-- 右侧：时间信息 -->
        <el-col :span="8">
          <el-card shadow="never" class="info-card">
            <template #header>
              <span>时间信息</span>
            </template>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="创建时间">
                {{ formatDate(task.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item label="更新时间">
                {{ formatDate(task.updated_at) }}
              </el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-else-if="!loading" description="任务不存在" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import dayjs from "dayjs";
import { useTaskDetail } from "@/composables/useCheckSystem";
import { TASK_STATUS_OPTIONS, FREQUENCY_TYPE_OPTIONS } from "@/types/checkSystem";
import type { TaskStatus, FrequencyType } from "@/types/checkSystem";

const router = useRouter();
const route = useRoute();

// 任务ID
const taskId = computed(() => Number(route.params.id) || 0);

// 任务详情
const { task, loading, fetchDetail } = useTaskDetail(taskId);

// 初始化
onMounted(() => {
  if (taskId.value) {
    fetchDetail(taskId.value);
  }
});

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status: TaskStatus): string => {
  const opt = TASK_STATUS_OPTIONS.find(o => o.value === status);
  return opt?.color || "";
};

/**
 * 获取状态标签
 */
const getStatusLabel = (status: TaskStatus): string => {
  const opt = TASK_STATUS_OPTIONS.find(o => o.value === status);
  return opt?.label || status;
};

/**
 * 获取频率标签
 */
const getFrequencyLabel = (type: FrequencyType): string => {
  const opt = FREQUENCY_TYPE_OPTIONS.find(o => o.value === type);
  return opt?.label || type;
};

/**
 * 返回列表
 */
const handleBack = () => {
  router.push("/check-system/tasks/list");
};
</script>

<style lang="scss" scoped>
.task-detail-container {
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
  }

  .info-card {
    margin-bottom: 20px;
  }
}
</style>
