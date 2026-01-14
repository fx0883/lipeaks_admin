<template>
  <div class="task-template-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>任务模板管理</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        创建模板
      </el-button>
    </div>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="系统预设">
          <el-select
            v-model="filterForm.is_system"
            placeholder="全部"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option label="是" :value="true" />
            <el-option label="否" :value="false" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="filterForm.search"
            placeholder="名称或描述"
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
      <el-table :data="templates" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="translated_name" label="名称" min-width="150" />
        <el-table-column prop="translated_description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category_name" label="关联类型" width="120" />
        <el-table-column label="系统预设" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.is_system ? 'warning' : 'info'" size="small">
              {{ row.is_system ? "是" : "否" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提醒" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.reminder ? 'success' : 'info'" size="small">
              {{ row.reminder ? "开启" : "关闭" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reminder_time" label="提醒时间" width="100">
          <template #default="{ row }">
            {{ row.reminder_time || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              删除
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
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Plus, Search } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import {
  useTaskTemplateList,
  useTaskTemplateActions
} from "@/composables/useCheckSystem";
import type { TaskTemplate } from "@/types/checkSystem";

const router = useRouter();

// 列表数据
const {
  templates,
  loading,
  pagination,
  fetchTemplates,
  refresh,
  updateParams,
  changePage,
  changePageSize,
  resetFilters
} = useTaskTemplateList();

// 操作
const { remove } = useTaskTemplateActions();

// 筛选表单
const filterForm = reactive({
  is_system: null as boolean | null,
  search: ""
});

// 初始化
onMounted(() => {
  fetchTemplates();
});

/**
 * 筛选变化
 */
const handleFilterChange = () => {
  updateParams({
    is_system: filterForm.is_system ?? undefined,
    search: filterForm.search || undefined
  });
};

/**
 * 重置筛选
 */
const handleResetFilters = () => {
  filterForm.is_system = null;
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
 * 创建
 */
const handleCreate = () => {
  router.push("/check-system/task-templates/create");
};

/**
 * 编辑
 */
const handleEdit = (row: TaskTemplate) => {
  router.push(`/check-system/task-templates/edit/${row.id}`);
};

/**
 * 删除
 */
const handleDelete = async (row: TaskTemplate) => {

  try {
    await ElMessageBox.confirm(
      `确定要删除任务模板 "${row.translated_name}" 吗？`,
      "删除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const success = await remove(row.id);
    if (success) {
      refresh();
    }
  } catch {
    // 用户取消
  }
};
</script>

<style lang="scss" scoped>
.task-template-list-container {
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
