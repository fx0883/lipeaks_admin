<template>
  <div class="feedback-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ t("feedback.feedbacks.list") }}</h2>
      <el-button type="primary" :icon="Plus" @click="handleCreate">
        {{ t("feedback.feedbacks.submit") }}
      </el-button>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="params">
        <el-form-item :label="t('feedback.filters.type')">
          <el-select
            v-model="params.feedback_type"
            :placeholder="t('feedback.filters.allTypes')"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="Bug报告" value="bug" />
            <el-option label="功能请求" value="feature" />
            <el-option label="改进建议" value="improvement" />
            <el-option label="问题咨询" value="question" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.filters.status')">
          <el-select
            v-model="params.status"
            :placeholder="t('feedback.filters.allStatuses')"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="已提交" value="submitted" />
            <el-option label="审核中" value="reviewing" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已关闭" value="closed" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="重复" value="duplicate" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.filters.priority')">
          <el-select
            v-model="params.priority"
            :placeholder="t('feedback.filters.allPriorities')"
            clearable
            @change="handleFilterChange"
          >
            <el-option label="紧急" value="critical" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('feedback.filters.ordering')">
          <el-select v-model="params.ordering" @change="handleFilterChange">
            <el-option label="最新发布" value="-created_at" />
            <el-option label="最多投票" value="-vote_count" />
            <el-option label="最多回复" value="-reply_count" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-input
            v-model="searchText"
            :placeholder="t('feedback.filters.search')"
            clearable
            @input="handleSearch"
          >
            <template #prefix>
              <IconifyIconOffline :icon="Search" />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 反馈列表 -->
    <el-card class="list-card" shadow="never" v-loading="loading">
      <div v-if="feedbacks.length === 0 && !loading" class="empty-state">
        <el-empty :description="t('feedback.feedbacks.noData')" />
      </div>

      <div v-else class="feedback-list">
        <div
          v-for="feedback in feedbacks"
          :key="feedback.id"
          class="feedback-item"
          @click="handleViewDetail(feedback.id)"
        >
          <!-- 反馈头部 -->
          <div class="feedback-header">
            <h3 class="feedback-title">{{ feedback.title }}</h3>
            <div class="feedback-tags">
              <el-tag
                :type="getFeedbackTypeTag(feedback.feedback_type)"
                size="small"
              >
                {{ feedback.type_display }}
              </el-tag>
              <el-tag :type="getStatusTag(feedback.status)" size="small">
                {{ feedback.status_display }}
              </el-tag>
              <el-tag :type="getPriorityTag(feedback.priority)" size="small">
                {{ feedback.priority_display }}
              </el-tag>
            </div>
          </div>

          <!-- 反馈元信息 -->
          <div class="feedback-meta">
            <span class="meta-item">
              <IconifyIconOffline :icon="User" />
              {{ feedback.submitter?.username || t("feedback.anonymous") }}
            </span>
            <span class="meta-item">
              <IconifyIconOffline :icon="Folder" />
              {{ feedback.software_name }}
            </span>
            <span v-if="feedback.version_number" class="meta-item">
              <IconifyIconOffline :icon="DocumentCopy" />
              {{ feedback.version_number }}
            </span>
            <span class="meta-item">
              <IconifyIconOffline :icon="Clock" />
              {{ formatDate(feedback.created_at) }}
            </span>
          </div>

          <!-- 反馈统计 -->
          <div class="feedback-stats">
            <span class="stat-item">
              <IconifyIconOffline :icon="ThumbsUp" />
              {{ feedback.vote_count }}
            </span>
            <span class="stat-item">
              <IconifyIconOffline :icon="ChatDotRound" />
              {{ feedback.reply_count }}
            </span>
            <span class="stat-item">
              <IconifyIconOffline :icon="View" />
              {{ feedback.view_count }}
            </span>
          </div>
        </div>
      </div>

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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useFeedbackList } from "@/composables/useFeedback";
import { ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { useDebounceFn } from "@vueuse/core";
import dayjs from "dayjs";

// Icons
const Search = "ep:search";
const User = "ep:user";
const Folder = "ep:folder";
const DocumentCopy = "ep:document-copy";
const Clock = "ep:clock";
const ThumbsUp = "ep:thumb-up";
const ChatDotRound = "ep:chat-dot-round";
const View = "ep:view";

const { t } = useI18n();
const router = useRouter();

// 使用 Composable
const {
  feedbacks,
  loading,
  pagination,
  params,
  fetchFeedbacks,
  updateParams,
  changePage
} = useFeedbackList();

// 搜索文本（用于防抖）
const searchText = ref("");

// 页面加载时获取数据
onMounted(() => {
  fetchFeedbacks();
});

/**
 * 处理筛选器变化
 */
const handleFilterChange = () => {
  updateParams({ ...params });
};

/**
 * 处理搜索（带防抖）
 */
const handleSearch = useDebounceFn(() => {
  updateParams({ search: searchText.value });
}, 300);

/**
 * 处理分页变化
 */
const handlePageChange = (page: number) => {
  changePage(page);
};

/**
 * 处理每页大小变化
 */
const handleSizeChange = (size: number) => {
  params.page_size = size;
  params.page = 1;
  fetchFeedbacks();
};

/**
 * 查看详情
 */
const handleViewDetail = (id: number) => {
  router.push(`/feedback/feedbacks/detail/${id}`);
};

/**
 * 创建反馈
 */
const handleCreate = () => {
  router.push("/feedback/feedbacks/submit");
};

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm");
};

/**
 * 获取反馈类型标签颜色
 */
const getFeedbackTypeTag = (type: string) => {
  const typeMap: Record<string, any> = {
    bug: "danger",
    feature: "primary",
    improvement: "success",
    question: "warning",
    other: "info"
  };
  return typeMap[type] || "info";
};

/**
 * 获取状态标签颜色
 */
const getStatusTag = (status: string) => {
  const statusMap: Record<string, any> = {
    submitted: "info",
    reviewing: "warning",
    confirmed: "primary",
    in_progress: "warning",
    resolved: "success",
    closed: "info",
    rejected: "danger",
    duplicate: "info"
  };
  return statusMap[status] || "info";
};

/**
 * 获取优先级标签颜色
 */
const getPriorityTag = (priority: string) => {
  const priorityMap: Record<string, any> = {
    critical: "danger",
    high: "warning",
    medium: "primary",
    low: "info"
  };
  return priorityMap[priority] || "info";
};
</script>

<style lang="scss" scoped>
.feedback-list-container {
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

    :deep(.el-form) {
      margin-bottom: 0;
    }
  }

  .list-card {
    .empty-state {
      padding: 60px 0;
      text-align: center;
    }

    .feedback-list {
      .feedback-item {
        padding: 20px;
        border-bottom: 1px solid #ebeef5;
        cursor: pointer;
        transition: background-color 0.2s;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background-color: #f5f7fa;
        }

        .feedback-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;

          .feedback-title {
            margin: 0;
            font-size: 18px;
            font-weight: 500;
            color: #303133;
            flex: 1;
          }

          .feedback-tags {
            display: flex;
            gap: 8px;
            flex-shrink: 0;
            margin-left: 20px;
          }
        }

        .feedback-meta {
          display: flex;
          gap: 20px;
          margin-bottom: 12px;
          font-size: 14px;
          color: #909399;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }

        .feedback-stats {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: #606266;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }
        }
      }
    }

    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
