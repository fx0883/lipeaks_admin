/**
 * Feedback System 类型定义
 * 
 * 注意：反馈系统现在使用 Application 管理模块
 * Application 相关类型定义在 @/types/application.ts
 */

import type { ApiResponse, DRFPaginationResponse } from "./api";
import type { Application } from "./application";

// ==================== 反馈管理相关类型 ====================

/**
 * 反馈类型
 */
export type FeedbackType = "bug" | "feature" | "improvement" | "question" | "other";

/**
 * 反馈优先级
 */
export type FeedbackPriority = "critical" | "high" | "medium" | "low";

/**
 * 反馈状态
 */
export type FeedbackStatus =
  | "submitted"
  | "reviewing"
  | "confirmed"
  | "in_progress"
  | "resolved"
  | "closed"
  | "rejected"
  | "duplicate";

/**
 * 用户信息（简化版）
 */
export interface FeedbackUser {
  id: number;
  username: string;
  email: string;
}

/**
 * 反馈附件
 */
export interface FeedbackAttachment {
  id: number;
  feedback: number;
  file: string;
  file_name: string;
  file_size: number;
  file_type: string;
  description?: string;
  created_at: string;
}

/**
 * 反馈回复
 */
export interface FeedbackReply {
  id: number;
  feedback: number;
  content: string;
  user: FeedbackUser;
  is_internal_note: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 反馈状态历史
 */
export interface FeedbackStatusHistory {
  id: number;
  old_status: FeedbackStatus;
  new_status: FeedbackStatus;
  changed_by: string;
  reason?: string;
  created_at: string;
}

/**
 * 反馈（列表项）
 */
export interface Feedback {
  id: number;
  title: string;
  description: string;
  feedback_type: FeedbackType;
  type_display: string;
  priority: FeedbackPriority;
  priority_display: string;
  status: FeedbackStatus;
  status_display: string;
  application: number;
  application_name?: string;
  submitter?: FeedbackUser;
  contact_email?: string;
  contact_name?: string;
  email_verified: boolean;
  vote_count: number;
  reply_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

/**
 * 反馈详情
 */
export interface FeedbackDetail extends Feedback {
  application_detail?: Application;
  user_info?: FeedbackUser;
  environment_info?: Record<string, any>;
  email_notification_enabled: boolean;
  attachments: FeedbackAttachment[];
  replies: FeedbackReply[];
  user_vote?: 1 | -1 | null;
  status_history: FeedbackStatusHistory[];
}

/**
 * 反馈列表查询参数
 */
export interface FeedbackListParams {
  application?: number; // 可选，用于按应用过滤
  feedback_type?: FeedbackType;
  status?: FeedbackStatus;
  priority?: FeedbackPriority;
  user?: number;
  email_verified?: boolean;
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

/**
 * 反馈创建参数
 */
export interface FeedbackCreateParams {
  title: string;
  description: string;
  feedback_type: FeedbackType;
  priority?: FeedbackPriority;
  application: number;
  contact_email?: string;
  contact_name?: string;
  environment_info?: Record<string, any>;
}

/**
 * 反馈更新参数
 * 注意：更新时不能修改 application
 */
export interface FeedbackUpdateParams {
  title?: string;
  description?: string;
  priority?: FeedbackPriority;
  status?: FeedbackStatus;
  assigned_to?: number;
  resolution_notes?: string;
  email_notification_enabled?: boolean;
}

/**
 * 反馈状态修改参数
 */
export interface FeedbackStatusChangeParams {
  status: FeedbackStatus;
  reason?: string;
}

/**
 * 反馈回复创建参数
 */
export interface FeedbackReplyCreateParams {
  content: string;
  is_internal_note?: boolean;
}

/**
 * 反馈投票参数
 */
export interface FeedbackVoteParams {
  vote_type: 1 | -1;
}

/**
 * 反馈统计数据
 */
export interface FeedbackStatistics {
  total_feedbacks: number;
  open_feedbacks: number;
  resolved_feedbacks: number;
  avg_resolution_time?: string;
  feedbacks_by_type: Record<FeedbackType, number>;
  feedbacks_by_status: Record<FeedbackStatus, number>;
  feedbacks_by_priority: Record<FeedbackPriority, number>;
  top_voted_feedbacks: Array<{
    id: number;
    title: string;
    vote_count: number;
    status: FeedbackStatus;
  }>;
  recent_feedbacks: Array<{
    id: number;
    title: string;
    created_at: string;
    status: FeedbackStatus;
  }>;
  daily_trend: Array<{
    date: string;
    count: number;
  }>;
}

// ==================== 邮件系统相关类型 ====================

/**
 * 邮件模板类型
 */
export type EmailTemplateType = "reply" | "status_change" | "verification" | "summary";

/**
 * 邮件模板
 */
export interface EmailTemplate {
  id: number;
  template_type: EmailTemplateType;
  name: string;
  subject: string;
  body_html: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 邮件模板列表查询参数
 */
export interface EmailTemplateListParams {
  template_type?: EmailTemplateType;
  is_active?: boolean;
  search?: string;
}

/**
 * 邮件模板创建参数
 */
export interface EmailTemplateCreateParams {
  template_type: EmailTemplateType;
  name: string;
  subject: string;
  body_html: string;
  is_active?: boolean;
}

/**
 * 邮件模板更新参数
 */
export interface EmailTemplateUpdateParams extends Partial<EmailTemplateCreateParams> { }

/**
 * 邮件日志状态
 */
export type EmailLogStatus = "pending" | "sending" | "sent" | "failed" | "bounced";

/**
 * 邮件日志
 */
export interface EmailLog {
  id: number;
  feedback: number;
  feedback_title?: string;
  recipient_email: string;
  recipient_name?: string;
  email_type: EmailTemplateType;
  status: EmailLogStatus;
  subject: string;
  body?: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
}

/**
 * 邮件日志列表查询参数
 */
export interface EmailLogListParams {
  feedback?: number;
  status?: EmailLogStatus;
  email_type?: EmailTemplateType;
  page?: number;
  page_size?: number;
}

// ==================== 系统监控相关类型 ====================

/**
 * 系统健康状态
 */
export interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  components: {
    redis: {
      available: boolean;
      mode: string;
      version?: string;
      connected_clients?: number;
      used_memory_human?: string;
      error?: string;
    };
    database: {
      available: boolean;
      type: string;
    };
    celery: {
      available: boolean;
      mode: string;
      fallback_enabled: boolean;
      broker?: string;
    };
    email: {
      available: boolean;
      mode: string;
      backend?: string;
    };
  };
  recommendations: string[];
}

/**
 * Redis 状态
 */
export interface RedisStatus {
  available: boolean;
  mode: string;
  error?: string;
  version?: string;
  connected_clients?: number;
  used_memory_human?: string;
  uptime_days?: number;
  suggestions?: Array<{
    priority: string;
    title: string;
    description: string;
    link?: string;
    config?: string;
  }>;
}

// ==================== 自定义分页响应类型 ====================

/**
 * 自定义分页响应格式（后端使用）
 */
export interface CustomPaginationResponse<T = any> {
  pagination: {
    count: number;
    next: string | null;
    previous: string | null;
    page_size: number;
    current_page: number;
    total_pages: number;
  };
  results: T[];
}

// ==================== API 响应类型 ====================

export type FeedbackResponse = ApiResponse<FeedbackDetail>;
export type FeedbackListResponse = ApiResponse<CustomPaginationResponse<Feedback>>;

export type FeedbackReplyResponse = ApiResponse<FeedbackReply>;
export type FeedbackReplyListResponse = ApiResponse<CustomPaginationResponse<FeedbackReply>>;

export type FeedbackAttachmentResponse = ApiResponse<FeedbackAttachment>;
export type FeedbackAttachmentListResponse = ApiResponse<CustomPaginationResponse<FeedbackAttachment>>;

export type EmailTemplateResponse = ApiResponse<EmailTemplate>;
export type EmailTemplateListResponse = ApiResponse<CustomPaginationResponse<EmailTemplate>>;

export type EmailLogResponse = ApiResponse<EmailLog>;
export type EmailLogListResponse = ApiResponse<CustomPaginationResponse<EmailLog>>;

export type FeedbackStatisticsResponse = ApiResponse<FeedbackStatistics>;
export type SystemHealthResponse = ApiResponse<SystemHealth>;
export type RedisStatusResponse = ApiResponse<RedisStatus>;

