/**
 * 通知管理系统类型定义
 * 
 * 基于 Admin API 文档：/api/v1/admin/notifications/
 */

import type { ApiResponse, DRFPaginationData } from "./api";

// ==================== 枚举类型 ====================

/**
 * 通知范围
 * - tenant: 面向租户（自动发送给租户下所有激活的Member）
 * - application: 面向应用（自动发送给租户下所有激活的Member）
 * - members: 面向特定成员（需要管理员手动添加接收者）
 */
export type NotificationScope = "tenant" | "application" | "members";

/**
 * 通知类型
 */
export type NotificationType = "info" | "warning" | "error" | "update" | "announcement";

/**
 * 通知优先级
 */
export type NotificationPriority = "low" | "normal" | "high" | "urgent";

/**
 * 通知状态
 * - draft: 草稿（可编辑、可发布、可删除）
 * - published: 已发布（可归档、不可编辑）
 * - archived: 已归档（不可编辑、不在成员端显示）
 */
export type NotificationStatus = "draft" | "published" | "archived";

// ==================== 实体类型 ====================

/**
 * 通知实体
 */
export interface Notification {
  id: number;
  title: string;
  content?: string;
  scope: NotificationScope;
  scope_display: string;
  application: number | null;
  application_name: string | null;
  notification_type: NotificationType;
  type_display: string;
  priority: NotificationPriority;
  priority_display: string;
  status: NotificationStatus;
  status_display: string;
  send_email: boolean;
  email_sent_at: string | null;
  published_at: string | null;
  created_by: number;
  created_by_name: string;
  recipient_count: number;
  read_count: number;
  unread_count?: number;
  tenant?: number;
  created_at: string;
  updated_at: string;
}

/**
 * 通知接收者
 */
export interface NotificationRecipient {
  id: number;
  member: number;
  member_username: string;
  member_email: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * 通知统计
 */
export interface NotificationStatistics {
  total_recipients: number;
  read_count: number;
  unread_count: number;
  read_rate: number;
}

// ==================== 查询参数类型 ====================

/**
 * 通知列表查询参数
 */
export interface NotificationListParams {
  application?: number;
  scope?: NotificationScope;
  status?: NotificationStatus;
  type?: NotificationType;
  priority?: NotificationPriority;
  page?: number;
  page_size?: number;
}

/**
 * 接收者列表查询参数
 */
export interface NotificationRecipientListParams {
  page?: number;
  page_size?: number;
}

// ==================== 创建/更新参数类型 ====================

/**
 * 创建通知参数
 */
export interface NotificationCreateParams {
  title: string;
  content: string;
  scope: NotificationScope;
  application?: number | null;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  send_email?: boolean;
}

/**
 * 更新通知参数
 */
export interface NotificationUpdateParams {
  title?: string;
  content?: string;
  scope?: NotificationScope;
  application?: number | null;
  notification_type?: NotificationType;
  priority?: NotificationPriority;
  send_email?: boolean;
}

/**
 * 添加/移除接收者参数
 */
export interface NotificationRecipientsParams {
  member_ids: number[];
}

// ==================== API响应类型 ====================

/**
 * 自定义分页数据（包含 pagination 对象）
 */
export interface NotificationPaginationData<T> {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
  pagination?: {
    count: number;
    current_page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
}

/**
 * 通知列表响应
 */
export interface NotificationListResponse extends ApiResponse<NotificationPaginationData<Notification>> {}

/**
 * 通知详情响应
 */
export interface NotificationResponse extends ApiResponse<Notification> {}

/**
 * 接收者列表响应
 */
export interface NotificationRecipientListResponse extends ApiResponse<NotificationPaginationData<NotificationRecipient>> {}

/**
 * 统计响应
 */
export interface NotificationStatisticsResponse extends ApiResponse<NotificationStatistics> {}

/**
 * 添加/移除接收者响应
 */
export interface NotificationRecipientsActionResponse extends ApiResponse<{
  detail: string;
  added_count?: number;
  removed_count?: number;
}> {}

// ==================== 辅助类型 ====================

/**
 * 通知范围选项
 */
export const NOTIFICATION_SCOPE_OPTIONS: Array<{
  value: NotificationScope;
  label: string;
  description: string;
}> = [
  { value: "tenant", label: "面向租户", description: "发送给租户下所有激活的成员" },
  { value: "application", label: "面向应用", description: "发送给租户下所有激活的成员" },
  { value: "members", label: "面向特定成员", description: "需要手动添加接收者" }
];

/**
 * 通知类型选项
 */
export const NOTIFICATION_TYPE_OPTIONS: Array<{
  value: NotificationType;
  label: string;
  color: string;
}> = [
  { value: "info", label: "信息通知", color: "info" },
  { value: "warning", label: "警告通知", color: "warning" },
  { value: "error", label: "错误通知", color: "danger" },
  { value: "update", label: "更新通知", color: "success" },
  { value: "announcement", label: "公告", color: "primary" }
];

/**
 * 优先级选项
 */
export const NOTIFICATION_PRIORITY_OPTIONS: Array<{
  value: NotificationPriority;
  label: string;
  color: string;
}> = [
  { value: "low", label: "低", color: "info" },
  { value: "normal", label: "普通", color: "" },
  { value: "high", label: "高", color: "warning" },
  { value: "urgent", label: "紧急", color: "danger" }
];

/**
 * 状态选项
 */
export const NOTIFICATION_STATUS_OPTIONS: Array<{
  value: NotificationStatus;
  label: string;
  color: string;
}> = [
  { value: "draft", label: "草稿", color: "info" },
  { value: "published", label: "已发布", color: "success" },
  { value: "archived", label: "已归档", color: "" }
];
