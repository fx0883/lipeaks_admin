/**
 * Feedback System API 封装
 * 基于文档：temp1022_2/
 */

import { http } from "@/utils/http";
import type {
  // 软件管理类型
  SoftwareCategory,
  SoftwareCategoryListParams,
  SoftwareCategoryCreateParams,
  SoftwareCategoryUpdateParams,
  SoftwareCategoryResponse,
  SoftwareCategoryListResponse,
  Software,
  SoftwareListParams,
  SoftwareCreateParams,
  SoftwareUpdateParams,
  SoftwareResponse,
  SoftwareListResponse,
  SoftwareVersion,
  SoftwareVersionListParams,
  SoftwareVersionCreateParams,
  SoftwareVersionUpdateParams,
  SoftwareVersionResponse,
  SoftwareVersionListResponse,
  // 反馈管理类型
  Feedback,
  FeedbackDetail,
  FeedbackListParams,
  FeedbackCreateParams,
  FeedbackUpdateParams,
  FeedbackStatusChangeParams,
  FeedbackResponse,
  FeedbackListResponse,
  // 反馈互动类型
  FeedbackReply,
  FeedbackReplyCreateParams,
  FeedbackReplyResponse,
  FeedbackReplyListResponse,
  FeedbackVoteParams,
  FeedbackAttachment,
  FeedbackAttachmentResponse,
  FeedbackAttachmentListResponse,
  // 邮件系统类型
  EmailTemplate,
  EmailTemplateListParams,
  EmailTemplateCreateParams,
  EmailTemplateUpdateParams,
  EmailTemplateResponse,
  EmailTemplateListResponse,
  EmailLog,
  EmailLogListParams,
  EmailLogResponse,
  EmailLogListResponse,
  // 统计监控类型
  FeedbackStatistics,
  FeedbackStatisticsResponse,
  SystemHealth,
  SystemHealthResponse,
  RedisStatus,
  RedisStatusResponse
} from "@/types/feedback";
import type { ApiResponse } from "@/types/api";
import logger from "@/utils/logger";

// ==================== 软件管理 API (18个) ====================

/**
 * 软件分类 API (6个)
 */

/**
 * 获取软件分类列表
 * @param params 查询参数
 */
export function getSoftwareCategoryList(params?: SoftwareCategoryListParams) {
  logger.debug("API请求: 获取软件分类列表", params);
  return http.request<SoftwareCategoryListResponse>(
    "get",
    "/feedbacks/software-categories/",
    { params }
  );
}

/**
 * 创建软件分类
 * @param data 分类数据
 */
export function createSoftwareCategory(data: SoftwareCategoryCreateParams) {
  logger.debug("API请求: 创建软件分类", data);
  return http.request<SoftwareCategoryResponse>(
    "post",
    "/feedbacks/software-categories/",
    { data }
  );
}

/**
 * 获取软件分类详情
 * @param id 分类ID
 */
export function getSoftwareCategoryDetail(id: number) {
  logger.debug("API请求: 获取软件分类详情", { id });
  return http.request<SoftwareCategoryResponse>(
    "get",
    `/feedbacks/software-categories/${id}/`
  );
}

/**
 * 更新软件分类
 * @param id 分类ID
 * @param data 更新数据
 */
export function updateSoftwareCategory(
  id: number,
  data: SoftwareCategoryUpdateParams
) {
  logger.debug("API请求: 更新软件分类", { id, data });
  return http.request<SoftwareCategoryResponse>(
    "patch",
    `/feedbacks/software-categories/${id}/`,
    { data }
  );
}

/**
 * 删除软件分类
 * @param id 分类ID
 */
export function deleteSoftwareCategory(id: number) {
  logger.debug("API请求: 删除软件分类", { id });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/software-categories/${id}/`
  );
}

/**
 * 获取分类树形结构
 */
export function getSoftwareCategoryTree() {
  logger.debug("API请求: 获取分类树形结构");
  return http.request<SoftwareCategoryListResponse>(
    "get",
    "/feedbacks/software-categories/tree/"
  );
}

/**
 * 软件产品 API (8个)
 */

/**
 * 获取软件产品列表
 * @param params 查询参数
 */
export function getSoftwareList(params?: SoftwareListParams) {
  logger.debug("API请求: 获取软件产品列表", params);
  return http.request<SoftwareListResponse>(
    "get",
    "/feedbacks/software/",
    { params }
  );
}

/**
 * 创建软件产品
 * @param data 软件数据
 */
export function createSoftware(data: SoftwareCreateParams) {
  logger.debug("API请求: 创建软件产品", data);
  return http.request<SoftwareResponse>("post", "/feedbacks/software/", {
    data
  });
}

/**
 * 获取软件产品详情
 * @param id 软件ID
 */
export function getSoftwareDetail(id: number) {
  logger.debug("API请求: 获取软件产品详情", { id });
  return http.request<SoftwareResponse>("get", `/feedbacks/software/${id}/`);
}

/**
 * 更新软件产品
 * @param id 软件ID
 * @param data 更新数据
 */
export function updateSoftware(id: number, data: SoftwareUpdateParams) {
  logger.debug("API请求: 更新软件产品", { id, data });
  return http.request<SoftwareResponse>(
    "patch",
    `/feedbacks/software/${id}/`,
    { data }
  );
}

/**
 * 删除软件产品
 * @param id 软件ID
 */
export function deleteSoftware(id: number) {
  logger.debug("API请求: 删除软件产品", { id });
  return http.request<ApiResponse<null>>("delete", `/feedbacks/software/${id}/`);
}

/**
 * 为软件添加版本
 * @param softwareId 软件ID
 * @param data 版本数据
 */
export function addSoftwareVersion(
  softwareId: number,
  data: SoftwareVersionCreateParams
) {
  logger.debug("API请求: 为软件添加版本", { softwareId, data });
  return http.request<SoftwareVersionResponse>(
    "post",
    `/feedbacks/software/${softwareId}/versions/`,
    { data }
  );
}

/**
 * 获取软件的所有版本
 * @param softwareId 软件ID
 */
export function getSoftwareVersions(softwareId: number) {
  logger.debug("API请求: 获取软件的所有版本", { softwareId });
  return http.request<SoftwareVersionListResponse>(
    "get",
    `/feedbacks/software/${softwareId}/versions/`
  );
}

/**
 * 软件版本 API (4个)
 */

/**
 * 获取所有版本列表
 * @param params 查询参数
 */
export function getSoftwareVersionList(params?: SoftwareVersionListParams) {
  logger.debug("API请求: 获取所有版本列表", params);
  return http.request<SoftwareVersionListResponse>(
    "get",
    "/feedbacks/software-versions/",
    { params }
  );
}

/**
 * 获取版本详情
 * @param id 版本ID
 */
export function getSoftwareVersionDetail(id: number) {
  logger.debug("API请求: 获取版本详情", { id });
  return http.request<SoftwareVersionResponse>(
    "get",
    `/feedbacks/software-versions/${id}/`
  );
}

/**
 * 更新软件版本
 * @param id 版本ID
 * @param data 更新数据
 */
export function updateSoftwareVersion(
  id: number,
  data: SoftwareVersionUpdateParams
) {
  logger.debug("API请求: 更新软件版本", { id, data });
  return http.request<SoftwareVersionResponse>(
    "patch",
    `/feedbacks/software-versions/${id}/`,
    { data }
  );
}

/**
 * 删除软件版本
 * @param id 版本ID
 */
export function deleteSoftwareVersion(id: number) {
  logger.debug("API请求: 删除软件版本", { id });
  return http.request<ApiResponse<null>>(
    "delete",
    `/feedbacks/software-versions/${id}/`
  );
}

// ==================== 反馈管理 API (13个) ====================

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
  software?: number;
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

