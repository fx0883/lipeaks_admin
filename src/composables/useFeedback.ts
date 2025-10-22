/**
 * useFeedback Composable
 * 封装反馈相关的数据获取和操作逻辑
 */

import { ref, reactive, computed } from "vue";
import type { Ref } from "vue";
import {
  getFeedbackList,
  getFeedbackDetail,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  changeFeedbackStatus,
  voteFeedback,
  removeVote,
  getFeedbackReplies,
  addFeedbackReply,
  getFeedbackAttachments,
  uploadFeedbackAttachment
} from "@/api/modules/feedback";
import type {
  Feedback,
  FeedbackDetail,
  FeedbackListParams,
  FeedbackCreateParams,
  FeedbackUpdateParams,
  FeedbackStatusChangeParams,
  FeedbackReplyCreateParams,
  FeedbackReply,
  FeedbackAttachment
} from "@/types/feedback";
import { message } from "@/utils/message";
import logger from "@/utils/logger";

/**
 * 反馈列表 Composable
 */
export function useFeedbackList(initialParams?: FeedbackListParams) {
  const feedbacks = ref<Feedback[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  });

  // 查询参数
  const params = reactive<FeedbackListParams>({
    page: 1,
    page_size: 20,
    ordering: "-created_at",
    ...initialParams
  });

  /**
   * 获取反馈列表
   */
  const fetchFeedbacks = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getFeedbackList(params);

      if (response.success && response.data) {
        feedbacks.value = response.data.results || [];
        pagination.total = response.data.count || 0;
        pagination.page = params.page || 1;
        pagination.pageSize = params.page_size || 20;
        pagination.hasNext = !!response.data.next;
        pagination.hasPrevious = !!response.data.previous;

        logger.debug("获取反馈列表成功", {
          count: feedbacks.value.length,
          total: pagination.total
        });
      } else {
        throw new Error(response.message || "获取反馈列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取反馈列表失败";
      logger.error("获取反馈列表失败", err);
      message(error.value, { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新列表
   */
  const refresh = () => {
    fetchFeedbacks();
  };

  /**
   * 更新查询参数
   */
  const updateParams = (newParams: Partial<FeedbackListParams>) => {
    Object.assign(params, newParams);
    params.page = 1; // 重置到第一页
    fetchFeedbacks();
  };

  /**
   * 翻页
   */
  const changePage = (page: number) => {
    params.page = page;
    fetchFeedbacks();
  };

  return {
    feedbacks,
    loading,
    error,
    pagination,
    params,
    fetchFeedbacks,
    refresh,
    updateParams,
    changePage
  };
}

/**
 * 反馈详情 Composable
 */
export function useFeedbackDetail(feedbackId: Ref<number> | number) {
  const feedback = ref<FeedbackDetail | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取反馈详情
   */
  const fetchDetail = async () => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await getFeedbackDetail(id);

      if (response.success && response.data) {
        feedback.value = response.data;
        logger.debug("获取反馈详情成功", { id });
      } else {
        throw new Error(response.message || "获取反馈详情失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取反馈详情失败";
      logger.error("获取反馈详情失败", err);
      message(error.value, { type: "error" });
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新详情
   */
  const refresh = () => {
    fetchDetail();
  };

  /**
   * 更新反馈
   */
  const update = async (data: FeedbackUpdateParams) => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return false;

    loading.value = true;

    try {
      const response = await updateFeedback(id, data);

      if (response.success && response.data) {
        feedback.value = response.data;
        message("更新成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 修改状态
   */
  const changeStatus = async (data: FeedbackStatusChangeParams) => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return false;

    loading.value = true;

    try {
      const response = await changeFeedbackStatus(id, data);

      if (response.success && response.data) {
        feedback.value = response.data;
        message("状态修改成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "状态修改失败");
      }
    } catch (err: any) {
      message(err.message || "状态修改失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 投票
   */
  const vote = async (voteType: 1 | -1) => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return false;

    try {
      const response = await voteFeedback(id, { vote_type: voteType });

      if (response.success) {
        // 更新投票数
        if (feedback.value) {
          feedback.value.vote_count = response.data.total_votes;
          feedback.value.user_vote = voteType;
        }
        message("投票成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "投票失败");
      }
    } catch (err: any) {
      message(err.message || "投票失败", { type: "error" });
      return false;
    }
  };

  /**
   * 取消投票
   */
  const cancelVote = async () => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return false;

    try {
      await removeVote(id);

      // 更新投票数
      if (feedback.value) {
        const oldVote = feedback.value.user_vote;
        if (oldVote === 1) {
          feedback.value.vote_count -= 1;
        } else if (oldVote === -1) {
          feedback.value.vote_count += 1;
        }
        feedback.value.user_vote = null;
      }

      message("取消投票成功", { type: "success" });
      return true;
    } catch (err: any) {
      message(err.message || "取消投票失败", { type: "error" });
      return false;
    }
  };

  return {
    feedback,
    loading,
    error,
    fetchDetail,
    refresh,
    update,
    changeStatus,
    vote,
    cancelVote
  };
}

/**
 * 反馈操作 Composable
 */
export function useFeedbackActions() {
  const loading = ref(false);

  /**
   * 创建反馈
   */
  const create = async (data: FeedbackCreateParams) => {
    loading.value = true;

    try {
      const response = await createFeedback(data);

      if (response.success && response.data) {
        message("提交成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "提交失败");
      }
    } catch (err: any) {
      message(err.message || "提交失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除反馈
   */
  const remove = async (id: number) => {
    loading.value = true;

    try {
      const response = await deleteFeedback(id);

      if (response.success) {
        message("删除成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "删除失败");
      }
    } catch (err: any) {
      message(err.message || "删除失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    create,
    remove
  };
}

/**
 * 反馈回复 Composable
 */
export function useFeedbackReplies(feedbackId: Ref<number> | number) {
  const replies = ref<FeedbackReply[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取回复列表
   */
  const fetchReplies = async () => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await getFeedbackReplies(id);

      if (response.success && response.data) {
        replies.value = response.data;
        logger.debug("获取回复列表成功", { count: replies.value.length });
      } else {
        throw new Error(response.message || "获取回复失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取回复失败";
      logger.error("获取回复失败", err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 添加回复
   */
  const addReply = async (data: FeedbackReplyCreateParams) => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return false;

    loading.value = true;

    try {
      const response = await addFeedbackReply(id, data);

      if (response.success && response.data) {
        replies.value.push(response.data);
        message("回复成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "回复失败");
      }
    } catch (err: any) {
      message(err.message || "回复失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  return {
    replies,
    loading,
    error,
    fetchReplies,
    addReply
  };
}

/**
 * 反馈附件 Composable
 */
export function useFeedbackAttachments(feedbackId: Ref<number> | number) {
  const attachments = ref<FeedbackAttachment[]>([]);
  const loading = ref(false);
  const uploading = ref(false);
  const uploadProgress = ref(0);

  /**
   * 获取附件列表
   */
  const fetchAttachments = async () => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return;

    loading.value = true;

    try {
      const response = await getFeedbackAttachments(id);

      if (response.success && response.data) {
        attachments.value = response.data;
      }
    } catch (err: any) {
      logger.error("获取附件列表失败", err);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 上传附件
   */
  const uploadAttachment = async (file: File, description?: string) => {
    const id = typeof feedbackId === "number" ? feedbackId : feedbackId.value;
    if (!id) return false;

    // 检查文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      message("文件大小不能超过 10MB", { type: "error" });
      return false;
    }

    uploading.value = true;
    uploadProgress.value = 0;

    try {
      const response = await uploadFeedbackAttachment(id, file, description);

      if (response.success && response.data) {
        attachments.value.push(response.data);
        message("上传成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "上传失败");
      }
    } catch (err: any) {
      message(err.message || "上传失败", { type: "error" });
      return false;
    } finally {
      uploading.value = false;
      uploadProgress.value = 0;
    }
  };

  return {
    attachments,
    loading,
    uploading,
    uploadProgress,
    fetchAttachments,
    uploadAttachment
  };
}

