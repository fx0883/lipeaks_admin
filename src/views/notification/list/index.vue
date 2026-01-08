<template>
  <div class="notification-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ $t("notification.notificationManagement") }}</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ $t("notification.create") }}
      </el-button>
    </div>

    <!-- 筛选区 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item :label="$t('notification.filters.application')">
          <el-select
            v-model="filterForm.application"
            :placeholder="$t('notification.filters.allApplications')"
            clearable
            filterable
            style="width: 180px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="app in applications"
              :key="app.id"
              :label="app.name"
              :value="app.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('notification.filters.scope')">
          <el-select
            v-model="filterForm.scope"
            :placeholder="$t('notification.filters.allScopes')"
            clearable
            style="width: 140px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="opt in NOTIFICATION_SCOPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('notification.filters.status')">
          <el-select
            v-model="filterForm.status"
            :placeholder="$t('notification.filters.allStatuses')"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="opt in NOTIFICATION_STATUS_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('notification.filters.type')">
          <el-select
            v-model="filterForm.type"
            :placeholder="$t('notification.filters.allTypes')"
            clearable
            style="width: 140px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="opt in NOTIFICATION_TYPE_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('notification.filters.priority')">
          <el-select
            v-model="filterForm.priority"
            :placeholder="$t('notification.filters.allPriorities')"
            clearable
            style="width: 120px"
            @change="handleFilterChange"
          >
            <el-option
              v-for="opt in NOTIFICATION_PRIORITY_OPTIONS"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button :icon="Refresh" @click="handleRefresh">
            {{ $t("common.refresh") }}
          </el-button>
          <el-button @click="handleResetFilters">
            {{ $t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 通知列表 -->
    <el-card shadow="never" class="table-card">
      <el-table :data="notifications" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="title" :label="$t('notification.fields.title')" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="handleViewDetail(row)">
              {{ row.title }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="scope_display" :label="$t('notification.fields.scope')" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.scope_display }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="application_name" :label="$t('notification.fields.application')" width="140">
          <template #default="{ row }">
            {{ row.application_name || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="type_display" :label="$t('notification.fields.type')" width="110">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.notification_type)" size="small">
              {{ row.type_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority_display" :label="$t('notification.fields.priority')" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityTagType(row.priority)" size="small">
              {{ row.priority_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status_display" :label="$t('notification.fields.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" size="small">
              {{ row.status_display }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('notification.fields.readStats')" width="120" align="center">
          <template #default="{ row }">
            <span v-if="row.status !== 'draft'">
              {{ row.read_count }} / {{ row.recipient_count }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('notification.fields.createdAt')" width="170">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('common.actions')" width="200" fixed="right">
          <template #default="{ row }">
            <!-- 草稿状态可编辑 -->
            <el-button
              v-if="row.status === 'draft'"
              link
              type="primary"
              size="small"
              @click="handleEdit(row)"
            >
              {{ $t("common.edit") }}
            </el-button>
            <!-- 草稿状态可发布 -->
            <el-button
              v-if="row.status === 'draft'"
              link
              type="success"
              size="small"
              @click="handlePublish(row)"
            >
              {{ $t("notification.actions.publish") }}
            </el-button>
            <!-- 已发布状态可归档 -->
            <el-button
              v-if="row.status === 'published'"
              link
              type="warning"
              size="small"
              @click="handleArchive(row)"
            >
              {{ $t("notification.actions.archive") }}
            </el-button>
            <!-- 查看详情 -->
            <el-button link type="primary" size="small" @click="handleViewDetail(row)">
              {{ $t("common.detail") }}
            </el-button>
            <!-- 删除（仅草稿） -->
            <el-button
              v-if="row.status === 'draft'"
              link
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >
              {{ $t("common.delete") }}
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
import { Plus, Refresh } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import {
  useNotificationList,
  useNotificationActions
} from "@/composables/useNotification";
import { useApplicationSelector } from "@/composables/useApplication";
import {
  NOTIFICATION_SCOPE_OPTIONS,
  NOTIFICATION_TYPE_OPTIONS,
  NOTIFICATION_PRIORITY_OPTIONS,
  NOTIFICATION_STATUS_OPTIONS
} from "@/types/notification";
import type {
  Notification,
  NotificationScope,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from "@/types/notification";

const router = useRouter();

// 应用选择器
const { applications, fetchApplications } = useApplicationSelector(false);

// 通知列表
const {
  notifications,
  loading,
  pagination,
  params,
  fetchNotifications,
  refresh,
  updateParams,
  changePage,
  changePageSize,
  resetFilters
} = useNotificationList();

// 通知操作
const { publish, archive, remove } = useNotificationActions();

// 筛选表单
const filterForm = reactive({
  application: null as number | null,
  scope: null as NotificationScope | null,
  status: null as NotificationStatus | null,
  type: null as NotificationType | null,
  priority: null as NotificationPriority | null
});

// 初始化
onMounted(() => {
  fetchApplications();
  fetchNotifications();
});

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

/**
 * 获取类型标签类型
 */
const getTypeTagType = (type: NotificationType): string => {
  const map: Record<NotificationType, string> = {
    info: "info",
    warning: "warning",
    error: "danger",
    update: "success",
    announcement: ""
  };
  return map[type] || "";
};

/**
 * 获取优先级标签类型
 */
const getPriorityTagType = (priority: NotificationPriority): string => {
  const map: Record<NotificationPriority, string> = {
    low: "info",
    normal: "",
    high: "warning",
    urgent: "danger"
  };
  return map[priority] || "";
};

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status: NotificationStatus): string => {
  const map: Record<NotificationStatus, string> = {
    draft: "info",
    published: "success",
    archived: ""
  };
  return map[status] || "";
};

/**
 * 筛选变化
 */
const handleFilterChange = () => {
  updateParams({
    application: filterForm.application || undefined,
    scope: filterForm.scope || undefined,
    status: filterForm.status || undefined,
    type: filterForm.type || undefined,
    priority: filterForm.priority || undefined
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
  filterForm.application = null;
  filterForm.scope = null;
  filterForm.status = null;
  filterForm.type = null;
  filterForm.priority = null;
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
 * 创建通知
 */
const handleCreate = () => {
  router.push("/notification/create");
};

/**
 * 编辑通知
 */
const handleEdit = (row: Notification) => {
  router.push(`/notification/edit/${row.id}`);
};

/**
 * 查看详情
 */
const handleViewDetail = (row: Notification) => {
  router.push(`/notification/detail/${row.id}`);
};

/**
 * 发布通知
 */
const handlePublish = async (row: Notification) => {
  try {
    await ElMessageBox.confirm(
      `确定要发布通知 "${row.title}" 吗？发布后将无法编辑。`,
      "发布确认",
      {
        confirmButtonText: "确定发布",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const result = await publish(row.id);
    if (result) {
      refresh();
    }
  } catch {
    // 用户取消
  }
};

/**
 * 归档通知
 */
const handleArchive = async (row: Notification) => {
  try {
    await ElMessageBox.confirm(
      `确定要归档通知 "${row.title}" 吗？归档后成员将无法看到该通知。`,
      "归档确认",
      {
        confirmButtonText: "确定归档",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const result = await archive(row.id);
    if (result) {
      refresh();
    }
  } catch {
    // 用户取消
  }
};

/**
 * 删除通知
 */
const handleDelete = async (row: Notification) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除通知 "${row.title}" 吗？`,
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
.notification-list-container {
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
