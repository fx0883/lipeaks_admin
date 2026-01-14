<template>
  <div class="cycle-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>21天打卡周期</h2>
    </div>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select
            v-model="filterForm.is_active"
            placeholder="全部"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option label="活跃" :value="true" />
            <el-option label="已结束" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="handleRefresh">
            刷新
          </el-button>
          <el-button @click="handleResetFilters">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="cycles" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="member_name" label="成员" width="120" />
        <el-table-column prop="start_date" label="开始日期" width="110" />
        <el-table-column prop="end_date" label="结束日期" width="110" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? "活跃" : "已结束" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前天数" width="90" align="center">
          <template #default="{ row }">
            第{{ row.current_day }}天
          </template>
        </el-table-column>
        <el-table-column label="进度" width="150">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column label="选中主题数" width="100" align="center">
          <template #default="{ row }">
            {{ row.selected_themes?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Refresh } from "@element-plus/icons-vue";
import { useCycleList } from "@/composables/useCheckSystem";
import type { CheckinCycle } from "@/types/checkSystem";

const router = useRouter();

// 列表数据
const {
  cycles,
  loading,
  pagination,
  fetchCycles,
  refresh,
  updateParams,
  changePage,
  changePageSize,
  resetFilters
} = useCycleList();

// 筛选表单
const filterForm = reactive({
  is_active: null as boolean | null
});

// 初始化
onMounted(() => {
  fetchCycles();
});

/**
 * 筛选变化
 */
const handleFilterChange = () => {
  updateParams({
    is_active: filterForm.is_active ?? undefined
  });
};

/**
 * 刷新
 */
const handleRefresh = () => {
  refresh();
};

/**
 * 重置筛选
 */
const handleResetFilters = () => {
  filterForm.is_active = null;
  resetFilters();
};

/**
 * 分页
 */
const handlePageChange = (page: number) => {
  changePage(page);
};

const handleSizeChange = (size: number) => {
  changePageSize(size);
};

/**
 * 查看详情
 */
const handleViewDetail = (row: CheckinCycle) => {
  router.push(`/check-system/cycles/detail/${row.id}`);
};
</script>

<style lang="scss" scoped>
.cycle-list-container {
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
    margin-bottom: 16px;

    :deep(.el-card__body) {
      padding-bottom: 2px;
    }
  }

  .table-card {
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}
</style>
