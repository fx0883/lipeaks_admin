<template>
  <div class="email-logs-container">
    <div class="page-header">
      <h2>{{ t("feedback.email.logs") }}</h2>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true">
        <el-form-item :label="t('feedback.email.emailType')">
          <el-select
            v-model="filterType"
            :placeholder="t('feedback.filters.allTypes')"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="回复通知" value="reply" />
            <el-option label="状态变更" value="status_change" />
            <el-option label="邮箱验证" value="verification" />
            <el-option label="每日摘要" value="summary" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.email.status')">
          <el-select
            v-model="filterStatus"
            :placeholder="t('feedback.filters.allStatuses')"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="待发送" value="pending" />
            <el-option label="发送中" value="sending" />
            <el-option label="已发送" value="sent" />
            <el-option label="失败" value="failed" />
            <el-option label="退回" value="bounced" />
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card shadow="never" v-loading="loading">
      <el-table :data="logs" stripe style="width: 100%">
        <el-table-column
          prop="recipient_email"
          :label="t('feedback.email.recipient')"
          min-width="200"
        />
        <el-table-column
          prop="email_type"
          :label="t('feedback.email.type')"
          width="120"
        >
          <template #default="{ row }">
            <el-tag size="small">{{
              getEmailTypeLabel(row.email_type)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="subject"
          :label="t('feedback.email.subject')"
          min-width="250"
        />
        <el-table-column
          prop="status"
          :label="t('feedback.email.status')"
          width="100"
        >
          <template #default="{ row }">
            <el-tag :type="getEmailStatusTag(row.status)" size="small">
              {{ getEmailStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="sent_at"
          :label="t('feedback.email.sentAt')"
          width="180"
        >
          <template #default="{ row }">
            {{ row.sent_at ? formatDate(row.sent_at) : "-" }}
          </template>
        </el-table-column>
        <el-table-column
          prop="retry_count"
          :label="t('feedback.email.retryCount')"
          width="100"
          align="center"
        />
        <el-table-column :label="t('buttons.actions')" width="100">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              size="small"
              @click="handleViewDetail(row)"
            >
              {{ t("buttons.view") }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div v-if="pagination.total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="t('feedback.email.logDetail')"
      width="700px"
    >
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item :label="t('feedback.email.recipient')">
            {{ selectedLog.recipient_email }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('feedback.email.type')">
            {{ getEmailTypeLabel(selectedLog.email_type) }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('feedback.email.status')">
            <el-tag :type="getEmailStatusTag(selectedLog.status)">
              {{ getEmailStatusLabel(selectedLog.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item :label="t('feedback.email.retryCount')">
            {{ selectedLog.retry_count }}
          </el-descriptions-item>
          <el-descriptions-item :label="t('feedback.email.subject')" :span="2">
            {{ selectedLog.subject }}
          </el-descriptions-item>
          <el-descriptions-item
            v-if="selectedLog.error_message"
            :label="t('common.error')"
            :span="2"
          >
            <el-alert
              :title="selectedLog.error_message"
              type="error"
              :closable="false"
            />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { getEmailLogList } from "@/api/modules/feedback";
import type { EmailLog, EmailLogListParams } from "@/types/feedback";
import dayjs from "dayjs";

const { t } = useI18n();

// 数据状态
const logs = ref<EmailLog[]>([]);
const loading = ref(false);

// 分页
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 20,
  hasNext: false,
  hasPrevious: false
});

// 筛选器
const filterType = ref<string>("");
const filterStatus = ref<string>("");

// 详情对话框
const detailDialogVisible = ref(false);
const selectedLog = ref<EmailLog | null>(null);

/**
 * 获取日志列表
 */
const fetchLogs = async () => {
  loading.value = true;

  try {
    const params: EmailLogListParams = {
      page: pagination.page,
      page_size: pagination.pageSize
    };

    if (filterType.value) {
      params.email_type = filterType.value as any;
    }
    if (filterStatus.value) {
      params.status = filterStatus.value as any;
    }

    const response = await getEmailLogList(params);

    if (response.success && response.data) {
      logs.value = response.data.results || [];
      pagination.total = response.data.count || 0;
      pagination.hasNext = !!response.data.next;
      pagination.hasPrevious = !!response.data.previous;
    }
  } catch (error) {
    console.error("获取邮件日志失败:", error);
  } finally {
    loading.value = false;
  }
};

/**
 * 处理筛选器变化
 */
const handleFilterChange = () => {
  pagination.page = 1;
  fetchLogs();
};

/**
 * 处理分页变化
 */
const handlePageChange = (page: number) => {
  pagination.page = page;
  fetchLogs();
};

/**
 * 处理每页大小变化
 */
const handleSizeChange = (size: number) => {
  pagination.pageSize = size;
  pagination.page = 1;
  fetchLogs();
};

/**
 * 查看详情
 */
const handleViewDetail = (log: EmailLog) => {
  selectedLog.value = log;
  detailDialogVisible.value = true;
};

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * 获取邮件类型标签
 */
const getEmailTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    reply: "回复通知",
    status_change: "状态变更",
    verification: "邮箱验证",
    summary: "每日摘要"
  };
  return typeLabels[type] || type;
};

/**
 * 获取邮件状态标签颜色
 */
const getEmailStatusTag = (status: string) => {
  const statusMap: Record<string, any> = {
    pending: "info",
    sending: "warning",
    sent: "success",
    failed: "danger",
    bounced: "danger"
  };
  return statusMap[status] || "info";
};

/**
 * 获取邮件状态标签文本
 */
const getEmailStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    pending: "待发送",
    sending: "发送中",
    sent: "已发送",
    failed: "失败",
    bounced: "退回"
  };
  return statusLabels[status] || status;
};

// 页面加载
onMounted(() => {
  fetchLogs();
});
</script>

<style lang="scss" scoped>
.email-logs-container {
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
    margin-bottom: 20px;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .log-detail {
    :deep(.el-alert) {
      margin-bottom: 0;
    }
  }
}
</style>
