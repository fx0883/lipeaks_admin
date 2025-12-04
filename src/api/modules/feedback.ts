/**
 * Feedback System API 封装
 * 
 * 注意：反馈系统现在使用 Application 管理模块
 * Application 相关 API 在 @/api/modules/application.ts
 */

import { http } from "@/utils/http";
import type {
  // 反馈管理类型
  FeedbackListParams,
  FeedbackCreateParams,
  FeedbackUpdateParams,
  FeedbackStatusChangeParams,
  FeedbackResponse,
  FeedbackListResponse,
  // 反馈互动类型
  FeedbackReplyCreateParams,
  FeedbackReplyResponse,
  FeedbackReplyListResponse,
  FeedbackVoteParams,
  FeedbackAttachmentResponse,
  FeedbackAttachmentListResponse,
  // 邮件系统类型
  EmailTemplateListParams,
  EmailTemplateCreateParams,
  EmailTemplateUpdateParams,
  EmailTemplateResponse,
  EmailTemplateListResponse,
  EmailLogListParams,
  EmailLogResponse,
  EmailLogListResponse,
  // 统计监控类型
  FeedbackStatisticsResponse,
  SystemHealthResponse,
  RedisStatusResponse,
  // 通知配置类型
  NotificationConfigListParams,
  NotificationConfigCreateParams,
  NotificationConfigUpdateParams,
  NotificationConfigResponse,
  NotificationConfigListResponse,
  RecipientCreateParams,
  RecipientUpdateParams,
  RecipientResponse,
  RecipientListResponse,
  TestNotificationParams
} from "@/types/feedback";
import type { ApiResponse } from "@/types/api";
import logger from "@/utils/logger";

// ==================== 反馈管理 API ====================

/**
 * 获取反馈列表
 * @param params 查询参数
 */
export function getFeedbackList(params?: FeedbackListParams) {
  logger.debug("API请求: 获取反馈列表", params);
  return http.request<FeedbackListResponse>("get", "/feedbacks/feedbacks/", {
    params
  });
}

/**
 * 创建反馈（提交反馈）
 * @param data 反馈数据
 */
export function createFeedback(data: FeedbackCreateParams) {
  logger.debug("API请求: 创建反馈", data);
  return http.request<FeedbackResponse>("post", "/feedbacks/feedbacks/", {
    data
  });
}

/**
 * 获取反馈详情
 * @param id 反馈ID
 */
export function getFeedbackDetail(id: number) {
  logger.debug("API请求: 获取反馈详情", { id });
  return http.request<FeedbackResponse>("get", `/feedbacks/feedbacks/${id}/`);
}

/**
 * 更新反馈
 * @param id 反馈ID
 * @param data 更新数据
 */
export function updateFeedback(id: number, data: FeedbackUpdateParams) {
  logger.debug("API请求: 更新反馈", { id, data });
  return http.request<FeedbackResponse>(
    "patch",
    `/feedbacks/feedbacks/${id}/`,
    { data }
  );
}

/**
 * 删除反馈
 * @param id 反馈ID
 */
export function deleteFeedback(id: number) {
  logger.debug("API请求: 删除反馈", { id });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/feedbacks/${id}/`
  );
}

/**
 * 修改反馈状态
 * @param id 反馈ID
 * @param data 状态修改数据
 */
export function changeFeedbackStatus(
  id: number,
  data: FeedbackStatusChangeParams
) {
  logger.debug("API请求: 修改反馈状态", { id, data });
  return http.request<FeedbackResponse>(
    "patch",
    `/feedbacks/feedbacks/${id}/status/`,
    { data }
  );
}

/**
 * 验证反馈邮箱
 * @param id 反馈ID
 * @param token 验证token
 */
export function verifyFeedbackEmail(id: number, token: string) {
  logger.debug("API请求: 验证反馈邮箱", { id });
  return http.request<ApiResponse<{ message: string }>>(
    "post",
    `/feedbacks/feedbacks/${id}/verify-email/`,
    { data: { token } }
  );
}

/**
 * 开启/关闭反馈邮件通知
 * @param id 反馈ID
 * @param enabled 是否启用
 */
export function toggleFeedbackNotifications(id: number, enabled: boolean) {
  logger.debug("API请求: 开启/关闭反馈邮件通知", { id, enabled });
  return http.request<ApiResponse<{ message: string; email_notification_enabled: boolean }>>(
    "patch",
    `/feedbacks/feedbacks/${id}/notifications/`,
    { data: { enabled } }
  );
}

// ==================== 反馈互动 API (10个) ====================

/**
 * 回复管理 API (6个)
 */

/**
 * 获取反馈的所有回复
 * @param feedbackId 反馈ID
 */
export function getFeedbackReplies(feedbackId: number) {
  logger.debug("API请求: 获取反馈的所有回复", { feedbackId });
  return http.request<FeedbackReplyListResponse>(
    "get",
    `/feedbacks/feedbacks/${feedbackId}/replies/`
  );
}

/**
 * 添加回复
 * @param feedbackId 反馈ID
 * @param data 回复数据
 */
export function addFeedbackReply(
  feedbackId: number,
  data: FeedbackReplyCreateParams
) {
  logger.debug("API请求: 添加回复", { feedbackId, data });
  return http.request<FeedbackReplyResponse>(
    "post",
    `/feedbacks/feedbacks/${feedbackId}/replies/`,
    { data }
  );
}

/**
 * 获取回复详情
 * @param feedbackId 反馈ID
 * @param replyId 回复ID
 */
export function getFeedbackReplyDetail(feedbackId: number, replyId: number) {
  logger.debug("API请求: 获取回复详情", { feedbackId, replyId });
  return http.request<FeedbackReplyResponse>(
    "get",
    `/feedbacks/feedbacks/${feedbackId}/replies/${replyId}/`
  );
}

/**
 * 更新回复
 * @param feedbackId 反馈ID
 * @param replyId 回复ID
 * @param data 更新数据
 */
export function updateFeedbackReply(
  feedbackId: number,
  replyId: number,
  data: Partial<FeedbackReplyCreateParams>
) {
  logger.debug("API请求: 更新回复", { feedbackId, replyId, data });
  return http.request<FeedbackReplyResponse>(
    "patch",
    `/feedbacks/feedbacks/${feedbackId}/replies/${replyId}/`,
    { data }
  );
}

/**
 * 删除回复
 * @param feedbackId 反馈ID
 * @param replyId 回复ID
 */
export function deleteFeedbackReply(feedbackId: number, replyId: number) {
  logger.debug("API请求: 删除回复", { feedbackId, replyId });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/feedbacks/${feedbackId}/replies/${replyId}/`
  );
}

/**
 * 投票功能 API (2个)
 */

/**
 * 对反馈投票
 * @param feedbackId 反馈ID
 * @param data 投票数据
 */
export function voteFeedback(feedbackId: number, data: FeedbackVoteParams) {
  logger.debug("API请求: 对反馈投票", { feedbackId, data });
  return http.request<ApiResponse<{ message: string; vote_type: number; total_votes: number }>>(
    "post",
    `/feedbacks/feedbacks/${feedbackId}/vote/`,
    { data }
  );
}

/**
 * 取消投票
 * @param feedbackId 反馈ID
 */
export function removeVote(feedbackId: number) {
  logger.debug("API请求: 取消投票", { feedbackId });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/feedbacks/${feedbackId}/vote/`
  );
}

/**
 * 附件管理 API (4个)
 */

/**
 * 获取反馈的所有附件
 * @param feedbackId 反馈ID
 */
export function getFeedbackAttachments(feedbackId: number) {
  logger.debug("API请求: 获取反馈的所有附件", { feedbackId });
  return http.request<FeedbackAttachmentListResponse>(
    "get",
    `/feedbacks/feedbacks/${feedbackId}/attachments/`
  );
}

/**
 * 上传附件
 * @param feedbackId 反馈ID
 * @param file 文件
 * @param description 描述
 */
export function uploadFeedbackAttachment(
  feedbackId: number,
  file: File,
  description?: string
) {
  logger.debug("API请求: 上传附件", { feedbackId, fileName: file.name });

  const formData = new FormData();
  formData.append("file", file);
  if (description) {
    formData.append("description", description);
  }

  return http.request<FeedbackAttachmentResponse>(
    "post",
    `/feedbacks/feedbacks/${feedbackId}/attachments/`,
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}

/**
 * 获取附件详情
 * @param feedbackId 反馈ID
 * @param attachmentId 附件ID
 */
export function getFeedbackAttachmentDetail(
  feedbackId: number,
  attachmentId: number
) {
  logger.debug("API请求: 获取附件详情", { feedbackId, attachmentId });
  return http.request<FeedbackAttachmentResponse>(
    "get",
    `/feedbacks/feedbacks/${feedbackId}/attachments/${attachmentId}/`
  );
}

/**
 * 删除附件
 * @param feedbackId 反馈ID
 * @param attachmentId 附件ID
 */
export function deleteFeedbackAttachment(
  feedbackId: number,
  attachmentId: number
) {
  logger.debug("API请求: 删除附件", { feedbackId, attachmentId });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/feedbacks/${feedbackId}/attachments/${attachmentId}/`
  );
}

// ==================== 邮件系统 API (8个) ====================

/**
 * 邮件模板管理 API (6个)
 */

/**
 * 获取邮件模板列表
 * @param params 查询参数
 */
export function getEmailTemplateList(params?: EmailTemplateListParams) {
  logger.debug("API请求: 获取邮件模板列表", params);
  return http.request<EmailTemplateListResponse>(
    "get",
    "/feedbacks/email-templates/",
    { params }
  );
}

/**
 * 创建邮件模板
 * @param data 模板数据
 */
export function createEmailTemplate(data: EmailTemplateCreateParams) {
  logger.debug("API请求: 创建邮件模板", data);
  return http.request<EmailTemplateResponse>(
    "post",
    "/feedbacks/email-templates/",
    { data }
  );
}

/**
 * 获取邮件模板详情
 * @param id 模板ID
 */
export function getEmailTemplateDetail(id: number) {
  logger.debug("API请求: 获取邮件模板详情", { id });
  return http.request<EmailTemplateResponse>(
    "get",
    `/feedbacks/email-templates/${id}/`
  );
}

/**
 * 更新邮件模板
 * @param id 模板ID
 * @param data 更新数据
 */
export function updateEmailTemplate(
  id: number,
  data: EmailTemplateUpdateParams
) {
  logger.debug("API请求: 更新邮件模板", { id, data });
  return http.request<EmailTemplateResponse>(
    "patch",
    `/feedbacks/email-templates/${id}/`,
    { data }
  );
}

/**
 * 删除邮件模板
 * @param id 模板ID
 */
export function deleteEmailTemplate(id: number) {
  logger.debug("API请求: 删除邮件模板", { id });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/email-templates/${id}/`
  );
}

/**
 * 邮件日志查询 API (2个)
 */

/**
 * 获取邮件日志列表
 * @param params 查询参数
 */
export function getEmailLogList(params?: EmailLogListParams) {
  logger.debug("API请求: 获取邮件日志列表", params);
  return http.request<EmailLogListResponse>(
    "get",
    "/feedbacks/email-logs/",
    { params }
  );
}

/**
 * 获取邮件日志详情
 * @param id 日志ID
 */
export function getEmailLogDetail(id: number) {
  logger.debug("API请求: 获取邮件日志详情", { id });
  return http.request<EmailLogResponse>("get", `/feedbacks/email-logs/${id}/`);
}

// ==================== 统计与监控 API (3个) ====================

/**
 * 获取反馈统计数据
 * @param params 查询参数
 */
export function getFeedbackStatistics(params?: {
  application?: number;
  date_from?: string;
  date_to?: string;
}) {
  logger.debug("API请求: 获取反馈统计数据", params);
  return http.request<FeedbackStatisticsResponse>(
    "get",
    "/feedbacks/statistics/",
    { params }
  );
}

/**
 * 系统健康检查
 */
export function getSystemHealth() {
  logger.debug("API请求: 系统健康检查");
  return http.request<SystemHealthResponse>("get", "/feedbacks/health/");
}

/**
 * 获取 Redis 状态
 */
export function getRedisStatus() {
  logger.debug("API请求: 获取 Redis 状态");
  return http.request<RedisStatusResponse>("get", "/feedbacks/health/redis/");
}

// ==================== 反馈通知配置 API ====================

/**
 * 获取通知配置列表
 * @param params 查询参数
 */
export function getNotificationConfigList(params?: NotificationConfigListParams) {
  logger.debug("API请求: 获取通知配置列表", params);
  return http.request<NotificationConfigListResponse>(
    "get",
    "/feedbacks/notification-configs/",
    { params }
  );
}

/**
 * 创建通知配置
 * @param data 配置数据
 */
export function createNotificationConfig(data: NotificationConfigCreateParams) {
  logger.debug("API请求: 创建通知配置", data);
  return http.request<NotificationConfigResponse>(
    "post",
    "/feedbacks/notification-configs/",
    { data }
  );
}

/**
 * 获取通知配置详情
 * @param id 配置ID
 */
export function getNotificationConfigDetail(id: number) {
  logger.debug("API请求: 获取通知配置详情", { id });
  return http.request<NotificationConfigResponse>(
    "get",
    `/feedbacks/notification-configs/${id}/`
  );
}

/**
 * 更新通知配置
 * @param id 配置ID
 * @param data 更新数据
 */
export function updateNotificationConfig(
  id: number,
  data: NotificationConfigUpdateParams
) {
  logger.debug("API请求: 更新通知配置", { id, data });
  return http.request<NotificationConfigResponse>(
    "patch",
    `/feedbacks/notification-configs/${id}/`,
    { data }
  );
}

/**
 * 删除通知配置
 * @param id 配置ID
 */
export function deleteNotificationConfig(id: number) {
  logger.debug("API请求: 删除通知配置", { id });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/notification-configs/${id}/`
  );
}

/**
 * 获取配置的接收者列表
 * @param configId 配置ID
 */
export function getNotificationRecipients(configId: number) {
  logger.debug("API请求: 获取接收者列表", { configId });
  return http.request<RecipientListResponse>(
    "get",
    `/feedbacks/notification-configs/${configId}/recipients/`
  );
}

/**
 * 添加接收者
 * @param configId 配置ID
 * @param data 接收者数据
 */
export function addNotificationRecipient(
  configId: number,
  data: RecipientCreateParams
) {
  logger.debug("API请求: 添加接收者", { configId, data });
  return http.request<RecipientResponse>(
    "post",
    `/feedbacks/notification-configs/${configId}/recipients/add/`,
    { data }
  );
}

/**
 * 更新接收者
 * @param configId 配置ID
 * @param recipientId 接收者ID
 * @param data 更新数据
 */
export function updateNotificationRecipient(
  configId: number,
  recipientId: number,
  data: RecipientUpdateParams
) {
  logger.debug("API请求: 更新接收者", { configId, recipientId, data });
  return http.request<RecipientResponse>(
    "patch",
    `/feedbacks/notification-configs/${configId}/recipients/${recipientId}/update/`,
    { data }
  );
}

/**
 * 删除接收者
 * @param configId 配置ID
 * @param recipientId 接收者ID
 */
export function deleteNotificationRecipient(
  configId: number,
  recipientId: number
) {
  logger.debug("API请求: 删除接收者", { configId, recipientId });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/notification-configs/${configId}/recipients/${recipientId}/`
  );
}

/**
 * 发送测试通知邮件
 * @param configId 配置ID
 * @param data 测试邮件数据
 */
export function sendTestNotification(
  configId: number,
  data: TestNotificationParams
) {
  logger.debug("API请求: 发送测试通知", { configId, data });
  return http.request<ApiResponse<{ message: string }>>(
    "post",
    `/feedbacks/notification-configs/${configId}/test/`,
    { data }
  );
}

/**
 * 根据应用ID获取通知配置
 * @param applicationId 应用ID
 */
export function getNotificationConfigByApplication(applicationId: number) {
  logger.debug("API请求: 根据应用获取通知配置", { applicationId });
  return http.request<NotificationConfigResponse>(
    "get",
    `/feedbacks/notification-configs/by-application/${applicationId}/`
  );
}
