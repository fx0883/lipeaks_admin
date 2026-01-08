/**
 * 通知管理系统 API 封装
 * 
 * 基于 Admin API 文档：/api/v1/admin/notifications/
 */

import { http } from "@/utils/http";
import type {
  NotificationListParams,
  NotificationCreateParams,
  NotificationUpdateParams,
  NotificationRecipientListParams,
  NotificationRecipientsParams,
  NotificationListResponse,
  NotificationResponse,
  NotificationRecipientListResponse,
  NotificationStatisticsResponse,
  NotificationRecipientsActionResponse
} from "@/types/notification";
import type { ApiResponse } from "@/types/api";
import logger from "@/utils/logger";

// API 基础路径
const BASE_URL = "/admin/notifications";

// ==================== 通知管理 CRUD ====================

/**
 * 获取通知列表
 * @param params 查询参数
 */
export function getNotificationList(params?: NotificationListParams) {
  logger.debug("API请求: 获取通知列表", params);
  return http.request<NotificationListResponse>("get", `${BASE_URL}/`, {
    params
  });
}

/**
 * 创建通知
 * @param data 通知数据
 */
export function createNotification(data: NotificationCreateParams) {
  logger.debug("API请求: 创建通知", data);
  return http.request<NotificationResponse>("post", `${BASE_URL}/`, {
    data
  });
}

/**
 * 获取通知详情
 * @param id 通知ID
 */
export function getNotificationDetail(id: number) {
  logger.debug("API请求: 获取通知详情", { id });
  return http.request<NotificationResponse>("get", `${BASE_URL}/${id}/`);
}

/**
 * 更新通知
 * @param id 通知ID
 * @param data 更新数据
 */
export function updateNotification(id: number, data: NotificationUpdateParams) {
  logger.debug("API请求: 更新通知", { id, data });
  return http.request<NotificationResponse>("patch", `${BASE_URL}/${id}/`, {
    data
  });
}

/**
 * 删除通知
 * @param id 通知ID
 */
export function deleteNotification(id: number) {
  logger.debug("API请求: 删除通知", { id });
  return http.request<ApiResponse<null>>("delete", `${BASE_URL}/${id}/`);
}

// ==================== 发布与状态管理 ====================

/**
 * 发布通知
 * @param id 通知ID
 */
export function publishNotification(id: number) {
  logger.debug("API请求: 发布通知", { id });
  return http.request<NotificationResponse>("post", `${BASE_URL}/${id}/publish/`);
}

/**
 * 归档通知
 * @param id 通知ID
 */
export function archiveNotification(id: number) {
  logger.debug("API请求: 归档通知", { id });
  return http.request<NotificationResponse>("post", `${BASE_URL}/${id}/archive/`);
}

// ==================== 接收者管理 ====================

/**
 * 获取通知接收者列表
 * @param id 通知ID
 * @param params 查询参数
 */
export function getNotificationRecipients(
  id: number,
  params?: NotificationRecipientListParams
) {
  logger.debug("API请求: 获取通知接收者列表", { id, params });
  return http.request<NotificationRecipientListResponse>(
    "get",
    `${BASE_URL}/${id}/recipients/`,
    { params }
  );
}

/**
 * 添加接收者
 * @param id 通知ID
 * @param data 接收者数据
 */
export function addNotificationRecipients(
  id: number,
  data: NotificationRecipientsParams
) {
  logger.debug("API请求: 添加通知接收者", { id, data });
  return http.request<NotificationRecipientsActionResponse>(
    "post",
    `${BASE_URL}/${id}/add-recipients/`,
    { data }
  );
}

/**
 * 移除接收者
 * @param id 通知ID
 * @param data 接收者数据
 */
export function removeNotificationRecipients(
  id: number,
  data: NotificationRecipientsParams
) {
  logger.debug("API请求: 移除通知接收者", { id, data });
  return http.request<NotificationRecipientsActionResponse>(
    "post",
    `${BASE_URL}/${id}/remove-recipients/`,
    { data }
  );
}

// ==================== 统计信息 ====================

/**
 * 获取通知统计
 * @param id 通知ID
 */
export function getNotificationStatistics(id: number) {
  logger.debug("API请求: 获取通知统计", { id });
  return http.request<NotificationStatisticsResponse>(
    "get",
    `${BASE_URL}/${id}/statistics/`
  );
}
