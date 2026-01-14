<template>
  <div class="check-record-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>打卡记录</h2>
    </div>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="打卡日期">
          <el-date-picker
            v-model="filterForm.check_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 150px"
            @change="handleFilterChange"
          />
        </el-form-item>
        <el-form-item label="延迟打卡">
          <el-select
            v-model="filterForm.delayed"
            placeholder="全部"
            clearable
            style="width: 100px"
            @change="handleFilterChange"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
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
      <el-table :data="records" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="task_name" label="任务名称" min-width="150" />
        <el-table-column prop="theme_name" label="主题" width="120" />
        <el-table-column prop="member_name" label="成员" width="100" />
        <el-table-column prop="check_date" label="打卡日期" width="110" />
        <el-table-column prop="check_time" label="打卡时间" width="90" />
        <el-table-column label="延迟" width="70" align="center">
          <template #default="{ row }">
            <el-tag :type="row.delayed ? 'warning' : 'success'" size="small">
              {{ row.delayed ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="completion_time" label="完成时长" width="90">
          <template #default="{ row }">
            {{ row.completion_time ? `${row.completion_time}分钟` : "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="remarks" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="comment" label="评论" min-width="150" show-overflow-tooltip />
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
import { Refresh } from "@element-plus/icons-vue";
import { useCheckRecordList } from "@/composables/useCheckSystem";

// 列表数据
const {
  records,
  loading,
  pagination,
  fetchRecords,
  refresh,
  updateParams,
  changePage,
  changePageSize,
  resetFilters
} = useCheckRecordList();

// 筛选表单
const filterForm = reactive({
  check_date: null as string | null,
  delayed: null as boolean | null
});

// 初始化
onMounted(() => {
  fetchRecords();
});

/**
 * 筛选变化
 */
const handleFilterChange = () => {
  updateParams({
    check_date: filterForm.check_date || undefined,
    delayed: filterForm.delayed ?? undefined
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
  filterForm.check_date = null;
  filterForm.delayed = null;
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
</script>

<style lang="scss" scoped>
.check-record-list-container {
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
