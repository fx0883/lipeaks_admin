<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getUserLevels } from "@/api/modules/points";
import type { UserLevel } from "@/types/points";

const loading = ref(false);
const levelList = ref<UserLevel[]>([]);

const fetchLevels = async () => {
  loading.value = true;
  try {
    const res: any = await getUserLevels();
    const data = res?.data?.results || res?.data || [];
    levelList.value = Array.isArray(data) ? data : [];
  } catch (err: any) {
    ElMessage.error(err.message || "获取等级梯队失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchLevels();
});
</script>

<template>
  <div class="p-4">
    <el-card shadow="never" class="mb-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-lg font-bold">会员成长梯队与权益等级</h2>
          <p class="text-sm text-gray-500 mt-1">管理租户多级成长体系，设置各梯队升级门槛积分与专属特权</p>
        </div>
        <el-button type="primary" @click="fetchLevels">刷新等级</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="levelList" v-loading="loading" stripe border>
        <el-table-column prop="level_order" label="权重排序" width="90" align="center" />
        <el-table-column prop="level_name" label="等级名称" min-width="120">
          <template #default="{ row }">
            <span class="font-bold" :style="{ color: row.level_color }">
              {{ row.level_name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="level_code" label="等级代码" width="120" />
        <el-table-column prop="min_points" label="升级门槛积分" width="130" align="right">
          <template #default="{ row }">
            {{ row.min_points?.toLocaleString() }} 分
          </template>
        </el-table-column>
        <el-table-column prop="max_points" label="积分上限" width="130" align="right">
          <template #default="{ row }">
            {{ row.max_points ? `${row.max_points?.toLocaleString()} 分` : '无上限' }}
          </template>
        </el-table-column>
        <el-table-column prop="level_color" label="标识色" width="100" align="center">
          <template #default="{ row }">
            <div class="flex items-center justify-center gap-1">
              <span class="inline-block w-4 h-4 rounded-full border" :style="{ backgroundColor: row.level_color }"></span>
              <span class="text-xs">{{ row.level_color }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="is_default" label="初始等级" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_default ? 'success' : 'info'" size="small">
              {{ row.is_default ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="启用状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'primary' : 'danger'" size="small">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>
