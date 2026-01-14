<template>
  <div class="task-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>任务管理</h2>
    </div>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="任务类型">
          <el-select
            v-model="filterForm.category"
            placeholder="全部"
            clearable
            filterable
            style="width: 150px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="cat in categories"
              :key="cat.id"
              :label="cat.translated_name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="filterForm.status"
            placeholder="全部"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="opt in TASK_STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.search"
            placeholder="任务名称"
            style="width: 180px"
            clearable
            @keyup.enter="handleFilterChange"
            @clear="handleFilterChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button :icon="Search" @click="handleFilterChange">
            搜索
          </el-button>
          <el-button @click="handleResetFilters">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="tasks" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="任务名称" min-width="150" />
        <el-table-column prop="category_name" label="任务类型" width="120" />
        <el-table-column prop="member_name" label="成员" width="100" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="频率" width="80">
          <template #default="{ row }">
            {{ getFrequencyLabel(row.frequency_type) }}
          </template>
        </el-table-column>
        <el-table-column prop="start_date" label="开始日期" width="110" />
        <el-table-column prop="end_date" label="结束日期" width="110">
          <template #default="{ row }">
            {{ row.end_date || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="提醒" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.reminder ? 'success' : 'info'" size="small">
              {{ row.reminder ? "开启" : "关闭" }}
            </el-tag>
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
import { Search } from "@element-plus/icons-vue";
import {
  useTaskList,
  useTaskCategoryList
} from "@/composables/useCheckSystem";
import {
  TASK_STATUS_OPTIONS,
  FREQUENCY_TYPE_OPTIONS
} from "@/types/checkSystem";
import type { Task, TaskStatus, FrequencyType } from "@/types/checkSystem";

const router = useRouter();

// 任务类型列表
const { categories, fetchCategories } = useTaskCategoryList({ page_size: 100 });

// 列表数据
const {
  tasks,
  loading,
  pagination,
  fetchTasks,
  updateParams,
  changePage,
  changePageSize,
  resetFilters
} = useTaskList();

// 筛选表单
const filterForm = reactive({
  category: null as number | null,
  status: null as TaskStatus | null,
  search: ""
});

// 初始化
onMounted(() => {
  fetchCategories();
  fetchTasks();
});

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
 * 筛选变化
 */
const handleFilterChange = () => {
  updateParams({
    category: filterForm.category ?? undefined,
    status: filterForm.status ?? undefined,
    search: filterForm.search || undefined
  });
};

/**
 * 重置筛选
 */
const handleResetFilters = () => {
  filterForm.category = null;
  filterForm.status = null;
  filterForm.search = "";
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
const handleViewDetail = (row: Task) => {
  router.push(`/check-system/tasks/detail/${row.id}`);
};
</script>

<style lang="scss" scoped>
.task-list-container {
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
