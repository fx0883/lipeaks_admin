<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getPointsRecords } from "@/api/modules/points";
import type { TenantUserPoints, PointsQueryParams } from "@/types/points";

const loading = ref(false);
const recordList = ref<TenantUserPoints[]>([]);
const total = ref(0);

const queryParams = reactive<PointsQueryParams>({
  page: 1,
  page_size: 10,
  point_type: undefined,
  category: undefined
});

const fetchRecords = async () => {
  loading.value = true;
  try {
    const res: any = await getPointsRecords(queryParams);
    const data = res?.data?.results || res?.data || [];
    recordList.value = Array.isArray(data) ? data : [];
    total.value = res?.data?.count || recordList.value.length;
  } catch (err: any) {
    ElMessage.error(err.message || "获取积分流水失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  queryParams.page = 1;
  fetchRecords();
};

const handleReset = () => {
  queryParams.point_type = undefined;
  queryParams.category = undefined;
  queryParams.page = 1;
  fetchRecords();
};

const handlePageChange = (val: number) => {
  queryParams.page = val;
  fetchRecords();
};

onMounted(() => {
  fetchRecords();
});
</script>

<template>
  <div class="p-4">
    <!-- 检索卡片 -->
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="变动类型">
          <el-select v-model="queryParams.point_type" placeholder="全部类型" clearable style="width: 140px">
            <el-option label="获得" value="earn" />
            <el-option label="消费" value="spend" />
            <el-option label="过期" value="expire" />
            <el-option label="调整" value="adjust" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务分类">
          <el-select v-model="queryParams.category" placeholder="全部分类" clearable style="width: 140px">
            <el-option label="登录奖励" value="login" />
            <el-option label="许可证相关" value="license" />
            <el-option label="推荐奖励" value="referral" />
            <el-option label="系统调整" value="system" />
            <el-option label="人工操作" value="manual" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格卡片 -->
    <el-card shadow="never">
      <el-table :data="recordList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="流水ID" width="80" align="center" />
        <el-table-column prop="earned_at" label="发生时间" width="170" />
        <el-table-column prop="point_type" label="类型" width="90" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.point_type === 'earn' ? 'success' : row.point_type === 'spend' ? 'warning' : 'info'"
              size="small"
            >
              {{ row.point_type === 'earn' ? '增加' : row.point_type === 'spend' ? '扣减' : row.point_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="变动积分" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.points > 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'">
              {{ row.points > 0 ? `+${row.points}` : row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_before" label="变动前结余" width="110" align="right" />
        <el-table-column prop="balance_after" label="变动后结余" width="110" align="right" />
        <el-table-column prop="category" label="业务来源" width="110" />
        <el-table-column prop="operation_reason" label="变动原因说明" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="85" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">
              {{ row.status === 'active' ? '正常' : row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page="queryParams.page"
          :page-size="queryParams.page_size"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>
