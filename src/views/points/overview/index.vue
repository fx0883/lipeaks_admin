<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getPointsStatistics } from "@/api/modules/points";
import type { PointsStatistics } from "@/types/points";

const loading = ref(false);
const stats = ref<PointsStatistics>({
  total_points_issued: 0,
  total_points_available: 0,
  total_profiles: 0,
  active_members_count: 0,
  level_distribution: []
});

const fetchStats = async () => {
  loading.value = true;
  try {
    const res = await getPointsStatistics();
    if (res && res.data) {
      stats.value = res.data;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "获取积分统计大屏数据失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <div class="p-4" v-loading="loading">
    <div class="mb-4">
      <h2 class="text-xl font-bold text-gray-800">积分体系监控大屏与发行指标</h2>
      <p class="text-sm text-gray-500 mt-1">展示租户积分总发放量、当前可用存量与会员成长等级分布</p>
    </div>

    <!-- 顶部核心指标四宫格卡片 -->
    <el-row :gutter="16" class="mb-6">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="text-sm text-gray-500">累计总发放积分</div>
          <div class="text-2xl font-bold text-blue-600 mt-2">
            {{ stats.total_points_issued?.toLocaleString() || 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="text-sm text-gray-500">当前可用积分存量</div>
          <div class="text-2xl font-bold text-green-600 mt-2">
            {{ stats.total_points_available?.toLocaleString() || 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="text-sm text-gray-500">会员积分档案总数</div>
          <div class="text-2xl font-bold text-purple-600 mt-2">
            {{ stats.total_profiles?.toLocaleString() || 0 }}
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card shadow="hover" class="metric-card">
          <div class="text-sm text-gray-500">活跃积分成员</div>
          <div class="text-2xl font-bold text-amber-600 mt-2">
            {{ stats.active_members_count?.toLocaleString() || 0 }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会员等级梯队分布卡片 -->
    <el-card shadow="hover" class="mb-6">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="font-bold">会员等级梯队分布</span>
          <el-button size="small" type="primary" link @click="fetchStats">刷新数据</el-button>
        </div>
      </template>

      <div v-if="stats.level_distribution && stats.level_distribution.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          v-for="item in stats.level_distribution"
          :key="item.level_code"
          class="border rounded-lg p-4 flex items-center justify-between bg-gray-50"
        >
          <div>
            <div class="font-bold text-gray-800">{{ item.level_name }}</div>
            <div class="text-xs text-gray-400 mt-1">代号: {{ item.level_code }}</div>
          </div>
          <div class="text-right">
            <div class="text-xl font-bold" :style="{ color: item.color || '#409EFF' }">
              {{ item.count }} 人
            </div>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无成长等级分布数据" />
    </el-card>
  </div>
</template>

<style scoped>
.metric-card {
  border-radius: 8px;
}
</style>
