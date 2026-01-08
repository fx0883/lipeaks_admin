<template>
  <div class="notification-detail-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-page-header @back="handleBack">
        <template #content>
          <span class="page-title">{{ $t("notification.detail") }}</span>
        </template>
      </el-page-header>
      <div class="header-actions" v-if="notification">
        <el-button
          v-if="notification.status === 'draft'"
          type="primary"
          @click="handleEdit"
        >
          {{ $t("common.edit") }}
        </el-button>
        <el-button
          v-if="notification.status === 'draft'"
          type="success"
          @click="handlePublish"
        >
          {{ $t("notification.actions.publish") }}
        </el-button>
        <el-button
          v-if="notification.status === 'published'"
          type="warning"
          @click="handleArchive"
        >
          {{ $t("notification.actions.archive") }}
        </el-button>
      </div>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20">
        <!-- 左侧：通知详情 -->
        <el-col :span="16">
          <el-card shadow="never" class="detail-card">
            <template #header>
              <div class="card-header">
                <span>{{ $t("notification.sections.basicInfo") }}</span>
                <el-tag :type="getStatusTagType(notification?.status)" v-if="notification">
                  {{ notification.status_display }}
                </el-tag>
              </div>
            </template>

            <el-descriptions :column="2" border v-if="notification">
              <el-descriptions-item :label="$t('notification.fields.title')" :span="2">
                {{ notification.title }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.scope')">
                <el-tag size="small">{{ notification.scope_display }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.application')">
                {{ notification.application_name || "-" }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.type')">
                <el-tag :type="getTypeTagType(notification.notification_type)" size="small">
                  {{ notification.type_display }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.priority')">
                <el-tag :type="getPriorityTagType(notification.priority)" size="small">
                  {{ notification.priority_display }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.sendEmail')">
                <el-tag :type="notification.send_email ? 'success' : 'info'" size="small">
                  {{ notification.send_email ? "是" : "否" }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.createdBy')">
                {{ notification.created_by_name }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.createdAt')">
                {{ formatDate(notification.created_at) }}
              </el-descriptions-item>
              <el-descriptions-item :label="$t('notification.fields.publishedAt')">
                {{ notification.published_at ? formatDate(notification.published_at) : "-" }}
              </el-descriptions-item>
            </el-descriptions>

            <!-- 通知内容 -->
            <div class="content-section" v-if="notification?.content">
              <h4>{{ $t("notification.fields.content") }}</h4>
              <div class="content-box">
                <pre>{{ notification.content }}</pre>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧：统计信息 -->
        <el-col :span="8">
          <el-card shadow="never" class="stats-card" v-loading="statisticsLoading">
            <template #header>
              <span>{{ $t("notification.sections.statistics") }}</span>
            </template>

            <div class="stats-grid" v-if="statistics">
              <div class="stat-item">
                <div class="stat-value">{{ statistics.total_recipients }}</div>
                <div class="stat-label">{{ $t("notification.stats.totalRecipients") }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value success">{{ statistics.read_count }}</div>
                <div class="stat-label">{{ $t("notification.stats.readCount") }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value warning">{{ statistics.unread_count }}</div>
                <div class="stat-label">{{ $t("notification.stats.unreadCount") }}</div>
              </div>
              <div class="stat-item">
                <div class="stat-value primary">{{ statistics.read_rate.toFixed(1) }}%</div>
                <div class="stat-label">{{ $t("notification.stats.readRate") }}</div>
              </div>
            </div>

            <el-empty v-else :description="$t('notification.stats.noData')" :image-size="60" />
          </el-card>
        </el-col>
      </el-row>

      <!-- 接收者管理 -->
      <el-card shadow="never" class="recipients-card" v-if="notification">
        <template #header>
          <div class="card-header">
            <span>{{ $t("notification.sections.recipients") }}</span>
            <el-button
              v-if="notification.scope === 'members' && notification.status === 'draft'"
              type="primary"
              size="small"
              :icon="Plus"
              @click="showAddRecipientsDialog = true"
            >
              {{ $t("notification.actions.addRecipients") }}
            </el-button>
          </div>
        </template>

        <!-- 接收者列表 -->
        <el-table :data="recipients" v-loading="recipientsLoading" stripe style="width: 100%">
          <el-table-column prop="member_username" :label="$t('notification.recipients.username')" width="150" />
          <el-table-column prop="member_email" :label="$t('notification.recipients.email')" min-width="200" />
          <el-table-column :label="$t('notification.recipients.readStatus')" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.is_read ? 'success' : 'info'" size="small">
                {{ row.is_read ? "已读" : "未读" }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('notification.recipients.readAt')" width="170">
            <template #default="{ row }">
              {{ row.read_at ? formatDate(row.read_at) : "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" :label="$t('notification.recipients.addedAt')" width="170">
            <template #default="{ row }">
              {{ formatDate(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column
            v-if="notification.scope === 'members' && notification.status === 'draft'"
            :label="$t('common.actions')"
            width="100"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button link type="danger" size="small" @click="handleRemoveRecipient(row)">
                {{ $t("common.remove") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper" v-if="recipientsPagination.total > 0">
          <el-pagination
            :current-page="recipientsPagination.page"
            :page-size="recipientsPagination.pageSize"
            :total="recipientsPagination.total"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next"
            @size-change="handleRecipientsPageSizeChange"
            @current-change="handleRecipientsPageChange"
          />
        </div>
      </el-card>
    </div>

    <!-- 添加接收者对话框 -->
    <el-dialog
      v-model="showAddRecipientsDialog"
      :title="$t('notification.actions.addRecipients')"
      width="500px"
    >
      <el-form :model="addRecipientsForm" label-width="100px">
        <el-form-item :label="$t('notification.recipients.memberIds')">
          <el-input
            v-model="addRecipientsForm.memberIdsText"
            type="textarea"
            :rows="4"
            :placeholder="$t('notification.placeholders.memberIds')"
          />
          <div class="form-tip">{{ $t("notification.tips.memberIds") }}</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddRecipientsDialog = false">{{ $t("common.cancel") }}</el-button>
        <el-button type="primary" :loading="actionLoading" @click="handleAddRecipients">
          {{ $t("common.confirm") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Plus } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import {
  useNotificationDetail,
  useNotificationActions,
  useNotificationRecipients
} from "@/composables/useNotification";
import type {
  NotificationRecipient,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from "@/types/notification";
import { message } from "@/utils/message";

const router = useRouter();
const route = useRoute();

// 通知ID
const notificationId = computed(() => Number(route.params.id) || 0);

// 通知详情
const {
  notification,
  statistics,
  loading,
  statisticsLoading,
  fetchDetail,
  fetchStatistics,
  refresh: refreshDetail
} = useNotificationDetail(notificationId);

// 通知操作
const { publish, archive } = useNotificationActions();

// 接收者管理
const {
  recipients,
  loading: recipientsLoading,
  actionLoading,
  pagination: recipientsPagination,
  fetchRecipients,
  addRecipients,
  removeRecipients,
  changePage: changeRecipientsPage,
  changePageSize: changeRecipientsPageSize
} = useNotificationRecipients(notificationId);

// 添加接收者对话框
const showAddRecipientsDialog = ref(false);
const addRecipientsForm = reactive({
  memberIdsText: ""
});

// 初始化
onMounted(async () => {
  if (notificationId.value) {
    await refreshDetail(notificationId.value);
    await fetchRecipients();
  }
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
const getTypeTagType = (type?: NotificationType): string => {
  if (!type) return "";
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
const getPriorityTagType = (priority?: NotificationPriority): string => {
  if (!priority) return "";
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
const getStatusTagType = (status?: NotificationStatus): string => {
  if (!status) return "";
  const map: Record<NotificationStatus, string> = {
    draft: "info",
    published: "success",
    archived: ""
  };
  return map[status] || "";
};

/**
 * 返回列表
 */
const handleBack = () => {
  router.push("/notification/list");
};

/**
 * 编辑
 */
const handleEdit = () => {
  router.push(`/notification/edit/${notificationId.value}`);
};

/**
 * 发布
 */
const handlePublish = async () => {
  if (!notification.value) return;

  // 检查 members 范围是否有接收者
  if (notification.value.scope === "members" && recipients.value.length === 0) {
    message("请先添加接收者后再发布", { type: "warning" });
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要发布通知 "${notification.value.title}" 吗？发布后将无法编辑。`,
      "发布确认",
      {
        confirmButtonText: "确定发布",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const result = await publish(notificationId.value);
    if (result) {
      await refreshDetail(notificationId.value);
      await fetchRecipients();
    }
  } catch {
    // 用户取消
  }
};

/**
 * 归档
 */
const handleArchive = async () => {
  if (!notification.value) return;

  try {
    await ElMessageBox.confirm(
      `确定要归档通知 "${notification.value.title}" 吗？归档后成员将无法看到该通知。`,
      "归档确认",
      {
        confirmButtonText: "确定归档",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const result = await archive(notificationId.value);
    if (result) {
      await refreshDetail(notificationId.value);
    }
  } catch {
    // 用户取消
  }
};

/**
 * 接收者分页
 */
const handleRecipientsPageChange = (page: number) => {
  changeRecipientsPage(page);
};

const handleRecipientsPageSizeChange = (size: number) => {
  changeRecipientsPageSize(size);
};

/**
 * 添加接收者
 */
const handleAddRecipients = async () => {
  const text = addRecipientsForm.memberIdsText.trim();
  if (!text) {
    message("请输入成员ID", { type: "warning" });
    return;
  }

  // 解析成员ID
  const ids = text.split(/[\s,，\n]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
  if (ids.length === 0) {
    message("请输入有效的成员ID", { type: "warning" });
    return;
  }

  const success = await addRecipients(ids);
  if (success) {
    showAddRecipientsDialog.value = false;
    addRecipientsForm.memberIdsText = "";
    await fetchStatistics(notificationId.value);
  }
};

/**
 * 移除接收者
 */
const handleRemoveRecipient = async (row: NotificationRecipient) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除接收者 "${row.member_username}" 吗？`,
      "移除确认",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      }
    );

    const success = await removeRecipients([row.member]);
    if (success) {
      await fetchStatistics(notificationId.value);
    }
  } catch {
    // 用户取消
  }
};
</script>

<style lang="scss" scoped>
.notification-detail-container {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      font-size: 18px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-card {
    margin-bottom: 20px;

    .content-section {
      margin-top: 24px;

      h4 {
        margin: 0 0 12px;
        font-size: 14px;
        color: #606266;
      }

      .content-box {
        padding: 16px;
        background: #f5f7fa;
        border-radius: 4px;

        pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
          font-family: inherit;
          font-size: 14px;
          line-height: 1.6;
        }
      }
    }
  }

  .stats-card {
    margin-bottom: 20px;

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;

      .stat-item {
        text-align: center;
        padding: 16px;
        background: #f5f7fa;
        border-radius: 8px;

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #303133;

          &.success {
            color: #67c23a;
          }

          &.warning {
            color: #e6a23c;
          }

          &.primary {
            color: #409eff;
          }
        }

        .stat-label {
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .recipients-card {
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }

  .form-tip {
    margin-top: 8px;
    font-size: 12px;
    color: #909399;
  }
}
</style>
