<template>
  <div class="feedback-detail-container" v-loading="loading">
    <div v-if="feedback" class="feedback-content">
      <!-- 返回按钮 -->
      <div class="page-header">
        <el-button :icon="ArrowLeft" @click="handleBack">
          {{ t("buttons.back") }}
        </el-button>
      </div>

      <!-- 反馈标题和标签 -->
      <el-card class="title-card" shadow="never">
        <h1 class="feedback-title">{{ feedback.title }}</h1>
        <div class="feedback-tags">
          <el-tag
            :type="getFeedbackTypeTag(feedback.feedback_type)"
            size="large"
          >
            {{ feedback.type_display }}
          </el-tag>
          <el-tag :type="getStatusTag(feedback.status)" size="large">
            {{ feedback.status_display }}
          </el-tag>
          <el-tag :type="getPriorityTag(feedback.priority)" size="large">
            {{ feedback.priority_display }}
          </el-tag>
        </div>
      </el-card>

      <!-- 反馈基本信息 -->
      <el-card class="info-card" shadow="never">
        <div class="info-row">
          <span class="info-label">{{ t("feedback.detail.submitter") }}:</span>
          <span class="info-value">
            {{
              feedback.user_info?.username ||
              feedback.contact_name ||
              t("feedback.anonymous")
            }}
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t("feedback.detail.software") }}:</span>
          <span class="info-value">
            {{ feedback.software_detail?.name || feedback.software_name }}
            <span v-if="feedback.version_detail?.version" class="version-tag">
              {{ feedback.version_detail.version }}
            </span>
          </span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t("feedback.detail.createdAt") }}:</span>
          <span class="info-value">{{ formatDate(feedback.created_at) }}</span>
        </div>
        <div v-if="feedback.resolved_at" class="info-row">
          <span class="info-label">{{ t("feedback.detail.resolvedAt") }}:</span>
          <span class="info-value">{{ formatDate(feedback.resolved_at) }}</span>
        </div>
      </el-card>

      <!-- 反馈描述 -->
      <el-card class="description-card" shadow="never">
        <h3>{{ t("feedback.detail.description") }}</h3>
        <div class="description-content">{{ feedback.description }}</div>
      </el-card>

      <!-- 环境信息 -->
      <el-card
        v-if="
          feedback.environment_info &&
          Object.keys(feedback.environment_info).length > 0
        "
        class="environment-card"
        shadow="never"
      >
        <h3>{{ t("feedback.detail.environmentInfo") }}</h3>
        <pre class="environment-content">{{
          JSON.stringify(feedback.environment_info, null, 2)
        }}</pre>
      </el-card>

      <!-- 附件 -->
      <el-card
        v-if="feedback.attachments && feedback.attachments.length > 0"
        class="attachments-card"
        shadow="never"
      >
        <h3>
          {{ t("feedback.detail.attachments") }} ({{
            feedback.attachments.length
          }})
        </h3>
        <div class="attachments-list">
          <div
            v-for="attachment in feedback.attachments"
            :key="attachment.id"
            class="attachment-item"
          >
            <a :href="attachment.file" target="_blank" class="attachment-link">
              <IconifyIconOffline :icon="Document" />
              <span class="attachment-name">{{ attachment.file_name }}</span>
              <span class="attachment-size"
                >({{ formatFileSize(attachment.file_size) }})</span
              >
            </a>
          </div>
        </div>
      </el-card>

      <!-- 投票区域 -->
      <el-card class="vote-card" shadow="never">
        <div class="vote-buttons">
          <el-button
            :type="feedback.user_vote === 1 ? 'success' : 'default'"
            :icon="ThumbsUp"
            @click="handleVote(1)"
          >
            {{ t("feedback.detail.voteUp") }} ({{ feedback.vote_count }})
          </el-button>
          <el-button
            :type="feedback.user_vote === -1 ? 'danger' : 'default'"
            :icon="ThumbsDown"
            @click="handleVote(-1)"
          >
            {{ t("feedback.detail.voteDown") }}
          </el-button>
        </div>
      </el-card>

      <!-- 回复列表 -->
      <el-card class="replies-card" shadow="never">
        <div class="replies-header">
          <h3>
            {{ t("feedback.detail.replies") }} ({{ displayReplies.length }})
          </h3>
        </div>

        <!-- 回复表单（仅管理员） -->
        <div v-if="true" class="reply-form">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="4"
            :placeholder="t('feedback.detail.replyPlaceholder')"
          />
          <div class="reply-actions">
            <el-checkbox v-model="isInternalNote">
              {{ t("feedback.detail.internalNote") }}
            </el-checkbox>
            <el-button
              type="primary"
              :loading="submittingReply"
              @click="handleAddReply"
            >
              {{ t("feedback.detail.sendReply") }}
            </el-button>
          </div>
        </div>

        <!-- 回复列表 -->
        <div v-if="displayReplies.length > 0" class="replies-list">
          <div
            v-for="reply in displayReplies"
            :key="reply.id"
            class="reply-item"
          >
            <div class="reply-header">
              <span class="reply-author">{{ reply.user.username }}</span>
              <el-tag v-if="reply.is_internal_note" type="warning" size="small">
                {{ t("feedback.detail.internal") }}
              </el-tag>
              <span class="reply-time">{{ formatDate(reply.created_at) }}</span>
            </div>
            <div class="reply-content">{{ reply.content }}</div>
          </div>
        </div>

        <div v-else class="no-replies">
          <el-empty :description="t('feedback.detail.noReplies')" />
        </div>
      </el-card>

      <!-- 状态历史 -->
      <el-card
        v-if="feedback.status_history && feedback.status_history.length > 0"
        class="history-card"
        shadow="never"
      >
        <h3>{{ t("feedback.detail.statusHistory") }}</h3>
        <el-timeline>
          <el-timeline-item
            v-for="history in feedback.status_history"
            :key="history.id"
            :timestamp="formatDate(history.created_at)"
          >
            <div class="history-content">
              <span class="history-change">
                {{ history.old_status }} → {{ history.new_status }}
              </span>
              <span class="history-user">{{ history.changed_by }}</span>
              <p v-if="history.reason" class="history-reason">
                {{ history.reason }}
              </p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </el-card>

      <!-- 管理操作区（仅管理员） -->
      <el-card v-if="true" class="admin-actions-card" shadow="never">
        <h3>{{ t("feedback.detail.adminActions") }}</h3>
        <div class="admin-buttons">
          <el-select
            v-model="newStatus"
            :placeholder="t('feedback.detail.selectStatus')"
            style="width: 200px; margin-right: 10px"
          >
            <el-option
              v-for="status in allowedStatuses"
              :key="status.value"
              :label="status.label"
              :value="status.value"
            />
          </el-select>
          <el-button
            type="primary"
            :disabled="!newStatus"
            @click="handleChangeStatus"
          >
            {{ t("feedback.detail.changeStatus") }}
          </el-button>
        </div>
      </el-card>
    </div>

    <!-- 加载状态 -->
    <div v-else-if="loading" class="loading-state">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-state">
      <el-empty :description="error || t('feedback.detail.notFound')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  useFeedbackDetail,
  useFeedbackReplies
} from "@/composables/useFeedback";
import { useUserStoreHook } from "@/store/modules/user";
import { ElMessageBox } from "element-plus";
import { ArrowLeft } from "@element-plus/icons-vue";
import { message } from "@/utils/message";
import dayjs from "dayjs";
import type { FeedbackStatus } from "@/types/feedback";

// Icons
const Document = "ep:document";
const ThumbsUp = "ep:thumb-up";
const ThumbsDown = "ep:thumb-down";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const userStore = useUserStoreHook();

// 反馈ID
const feedbackId = computed(() => parseInt(route.params.id as string));

// 使用 Composable
const {
  feedback,
  loading,
  error,
  fetchDetail,
  refresh,
  changeStatus,
  vote,
  cancelVote
} = useFeedbackDetail(feedbackId);

const { replies, addReply, fetchReplies } = useFeedbackReplies(feedbackId);

// 回复相关状态
const replyContent = ref("");
const isInternalNote = ref(false);
const submittingReply = ref(false);

// 合并的回复列表（优先使用独立获取的回复）
const displayReplies = computed(() => {
  if (replies.value && replies.value.length > 0) {
    return replies.value;
  }
  return feedback.value?.replies || [];
});

// 状态修改
const newStatus = ref<FeedbackStatus | "">("");

// 是否为管理员
const isAdmin = computed(() => {
  const admin = userStore.isAdmin || userStore.isSuperAdmin;
  console.log("权限检查:", {
    isAdmin: userStore.isAdmin,
    isSuperAdmin: userStore.isSuperAdmin,
    result: admin,
    userStore: userStore
  });
  return admin;
});

// 允许的状态转换
const statusTransitions: Record<FeedbackStatus, FeedbackStatus[]> = {
  submitted: ["reviewing", "rejected", "duplicate"],
  reviewing: ["confirmed", "rejected", "duplicate"],
  confirmed: ["in_progress", "rejected", "duplicate"],
  in_progress: ["resolved", "rejected"],
  resolved: ["closed", "in_progress"],
  closed: ["submitted"],
  rejected: ["submitted"],
  duplicate: ["submitted"]
};

// 当前允许的状态
const allowedStatuses = computed(() => {
  if (!feedback.value) return [];

  const currentStatus = feedback.value.status;
  const allowed = statusTransitions[currentStatus] || [];

  const statusLabels: Record<FeedbackStatus, string> = {
    submitted: "已提交",
    reviewing: "审核中",
    confirmed: "已确认",
    in_progress: "处理中",
    resolved: "已解决",
    closed: "已关闭",
    rejected: "已拒绝",
    duplicate: "重复"
  };

  return allowed.map(status => ({
    value: status,
    label: statusLabels[status]
  }));
});

// 页面加载时获取数据
onMounted(() => {
  fetchDetail();
  fetchReplies(); // 加载回复列表
});

/**
 * 返回列表
 */
const handleBack = () => {
  router.back();
};

/**
 * 投票处理
 */
const handleVote = async (voteType: 1 | -1) => {
  if (!feedback.value) return;

  // 如果点击的是当前投票类型，则取消投票
  if (feedback.value.user_vote === voteType) {
    await cancelVote();
  } else {
    await vote(voteType);
  }

  refresh();
};

/**
 * 添加回复
 */
const handleAddReply = async () => {
  if (!replyContent.value.trim()) {
    message(t("feedback.detail.replyRequired"), { type: "warning" });
    return;
  }

  submittingReply.value = true;

  const success = await addReply({
    content: replyContent.value,
    is_internal_note: isInternalNote.value
  });

  if (success) {
    replyContent.value = "";
    isInternalNote.value = false;
    // 刷新回复列表和反馈详情
    fetchReplies();
    refresh();
  }

  submittingReply.value = false;
};

/**
 * 修改状态
 */
const handleChangeStatus = async () => {
  if (!newStatus.value) return;

  try {
    const { value: reason } = await ElMessageBox.prompt(
      t("feedback.detail.statusChangeReason"),
      t("feedback.detail.changeStatus"),
      {
        confirmButtonText: t("buttons.confirm"),
        cancelButtonText: t("buttons.cancel"),
        inputPattern: /.+/,
        inputErrorMessage: t("feedback.detail.reasonRequired")
      }
    );

    const success = await changeStatus({
      status: newStatus.value as FeedbackStatus,
      reason
    });

    if (success) {
      newStatus.value = "";
      refresh();
    }
  } catch {
    // 用户取消
  }
};

/**
 * 格式化日期
 */
const formatDate = (date: string) => {
  return dayjs(date).format("YYYY-MM-DD HH:mm:ss");
};

/**
 * 格式化文件大小
 */
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
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
.feedback-detail-container {
  padding: 20px;

  .page-header {
    margin-bottom: 20px;
  }

  .feedback-content {
    max-width: 1200px;
    margin: 0 auto;

    .title-card {
      margin-bottom: 20px;

      .feedback-title {
        margin: 0 0 16px 0;
        font-size: 28px;
        font-weight: 600;
        color: #303133;
      }

      .feedback-tags {
        display: flex;
        gap: 10px;
      }
    }

    .info-card {
      margin-bottom: 20px;

      .info-row {
        display: flex;
        padding: 10px 0;
        border-bottom: 1px solid #ebeef5;

        &:last-child {
          border-bottom: none;
        }

        .info-label {
          width: 120px;
          color: #909399;
          font-weight: 500;
        }

        .info-value {
          flex: 1;
          color: #606266;

          .version-tag {
            margin-left: 8px;
            padding: 2px 8px;
            background-color: #f4f4f5;
            border-radius: 4px;
            font-size: 12px;
          }
        }
      }
    }

    .description-card {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .description-content {
        line-height: 1.8;
        color: #606266;
        white-space: pre-wrap;
      }
    }

    .environment-card {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .environment-content {
        background-color: #f5f7fa;
        padding: 16px;
        border-radius: 4px;
        overflow-x: auto;
        font-family: monospace;
        font-size: 14px;
      }
    }

    .attachments-card {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .attachments-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 12px;

        .attachment-item {
          .attachment-link {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            background-color: #f5f7fa;
            border-radius: 4px;
            text-decoration: none;
            color: #409eff;
            transition: background-color 0.2s;

            &:hover {
              background-color: #ecf5ff;
            }

            .attachment-name {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .attachment-size {
              font-size: 12px;
              color: #909399;
            }
          }
        }
      }
    }

    .vote-card {
      margin-bottom: 20px;

      .vote-buttons {
        display: flex;
        gap: 12px;
        justify-content: center;
      }
    }

    .replies-card {
      margin-bottom: 20px;

      .replies-header {
        h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }
      }

      .reply-form {
        margin-bottom: 24px;
        padding-bottom: 24px;
        border-bottom: 1px solid #ebeef5;

        .reply-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }
      }

      .replies-list {
        .reply-item {
          padding: 16px;
          background-color: #f5f7fa;
          border-radius: 4px;
          margin-bottom: 12px;

          &:last-child {
            margin-bottom: 0;
          }

          .reply-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;

            .reply-author {
              font-weight: 600;
              color: #303133;
            }

            .reply-time {
              margin-left: auto;
              font-size: 12px;
              color: #909399;
            }
          }

          .reply-content {
            line-height: 1.6;
            color: #606266;
            white-space: pre-wrap;
          }
        }
      }

      .no-replies {
        padding: 40px 0;
      }
    }

    .history-card {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .history-content {
        .history-change {
          font-weight: 600;
          color: #409eff;
        }

        .history-user {
          margin-left: 12px;
          color: #909399;
          font-size: 14px;
        }

        .history-reason {
          margin: 8px 0 0 0;
          color: #606266;
          font-size: 14px;
        }
      }
    }

    .admin-actions-card {
      h3 {
        margin: 0 0 16px 0;
        font-size: 18px;
        font-weight: 600;
      }

      .admin-buttons {
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
