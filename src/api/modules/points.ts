import { http } from "@/utils/http";
import type { ApiResponse, DRFPaginationResponse } from "@/types/api";
import type {
  UserLevel,
  UserTypeTag,
  TenantUserProfile,
  TenantUserPoints,
  TenantUserTypeTag,
  PointsStatistics,
  PointsQueryParams
} from "@/types/points";
import logger from "@/utils/logger";

// ============================
// 积分成长与等级 API
// ============================

/**
 * 获取会员成长梯队列表
 */
export function getUserLevels(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取成长等级列表", params);
  return http.request<DRFPaginationResponse<UserLevel>>(
    "get",
    "/points/user-levels/",
    { params }
  );
}

/**
 * 获取特权标签字典列表
 */
export function getUserTypeTags(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取特权标签列表", params);
  return http.request<DRFPaginationResponse<UserTypeTag>>(
    "get",
    "/points/user-type-tags/",
    { params }
  );
}

/**
 * 分页查询成员积分档案
 */
export function getProfiles(params: PointsQueryParams = {}) {
  logger.debug("API请求: 查询成员积分档案", params);
  return http.request<DRFPaginationResponse<TenantUserProfile>>(
    "get",
    "/points/profiles/",
    { params }
  );
}

/**
 * 获取指定成员积分画像及明细
 */
export function getProfileDetail(id: number) {
  logger.debug("API请求: 获取成员积分详情", { id });
  return http.request<ApiResponse<TenantUserProfile>>(
    "get",
    `/points/profiles/${id}/`
  );
}

/**
 * 获取成员收支月度统计
 */
export function getProfileSummary(id: number) {
  logger.debug("API请求: 获取成员积分收支统计", { id });
  return http.request<ApiResponse<any>>(
    "get",
    `/points/profiles/${id}/summary/`
  );
}

/**
 * 为成员人工增发积分
 */
export function earnPoints(id: number, data: { points: number; category?: string; operation_reason?: string }) {
  logger.debug("API请求: 发放积分", { id, data });
  return http.request<ApiResponse<any>>(
    "post",
    `/points/profiles/${id}/earn_points/`,
    { data }
  );
}

/**
 * 扣减成员积分
 */
export function spendPoints(id: number, data: { points: number; category?: string; operation_reason?: string }) {
  logger.debug("API请求: 扣减积分", { id, data });
  return http.request<ApiResponse<any>>(
    "post",
    `/points/profiles/${id}/spend_points/`,
    { data }
  );
}

/**
 * 人工调账纠偏
 */
export function adjustPoints(id: number, data: { points: number; category?: string; operation_reason?: string }) {
  logger.debug("API请求: 人工调账", { id, data });
  return http.request<ApiResponse<any>>(
    "post",
    `/points/profiles/${id}/adjust_points/`,
    { data }
  );
}

/**
 * 分页检索积分变动流水
 */
export function getPointsRecords(params: PointsQueryParams = {}) {
  logger.debug("API请求: 检索积分变动流水", params);
  return http.request<DRFPaginationResponse<TenantUserPoints>>(
    "get",
    "/points/points-records/",
    { params }
  );
}

/**
 * 检索已被授予的 VIP 记录
 */
export function getVipTags(params: Record<string, any> = {}) {
  logger.debug("API请求: 检索VIP记录", params);
  return http.request<DRFPaginationResponse<TenantUserTypeTag>>(
    "get",
    "/points/vip-tags/",
    { params }
  );
}

/**
 * 向成员授予 VIP 标签
 */
export function grantVipTag(data: { member: number; tag: number; duration_days?: number }) {
  logger.debug("API请求: 授予VIP标签", data);
  return http.request<ApiResponse<any>>(
    "post",
    "/points/vip-tags/grant_vip_tag/",
    { data }
  );
}

/**
 * 积分大屏与发行指标统计
 */
export function getPointsStatistics() {
  logger.debug("API请求: 获取积分总览统计");
  return http.request<ApiResponse<PointsStatistics>>(
    "get",
    "/points/statistics/"
  );
}

/**
 * 积分收支趋势
 */
export function getPointsTrend(days: number = 30) {
  logger.debug("API请求: 获取积分收支趋势", { days });
  return http.request<ApiResponse<any>>(
    "get",
    "/points/statistics/points_trend/",
    { params: { days } }
  );
}
