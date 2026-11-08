import { http } from "@/utils/http";
import type { ApiResponse, DRFPaginationResponse } from "@/types/api";
import type {
  UserLevel,
  UserTypeTag,
  TenantUserProfile,
  TenantUserPoints,
  TenantUserTypeTag,
  PointsStatistics,
  PointsQueryParams,
  ApplicationUserLevel,
  AppUserPointsAccount,
  CheckinConfig,
  CheckinLadderItem,
  UserCheckinStreak,
  UserCheckinRecord
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

// ==========================================
// 应用专属积分等级与应用积分账户 API
// ==========================================

/**
 * 获取应用专属积分等级列表
 */
export function getApplicationPointsLevels(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取应用专属积分等级列表", params);
  return http.request<DRFPaginationResponse<ApplicationUserLevel>>(
    "get",
    "/points/app-levels/",
    { params }
  );
}

/**
 * 创建应用专属积分等级
 */
export function createApplicationPointsLevel(data: Partial<ApplicationUserLevel>) {
  logger.debug("API请求: 创建应用专属积分等级", data);
  return http.request<ApiResponse<ApplicationUserLevel>>(
    "post",
    "/points/app-levels/",
    { data }
  );
}

/**
 * 更新应用专属积分等级
 */
export function updateApplicationPointsLevel(id: number, data: Partial<ApplicationUserLevel>) {
  logger.debug("API请求: 更新应用专属积分等级", { id, data });
  return http.request<ApiResponse<ApplicationUserLevel>>(
    "patch",
    `/points/app-levels/${id}/`,
    { data }
  );
}

/**
 * 删除应用专属积分等级
 */
export function deleteApplicationPointsLevel(id: number) {
  logger.debug("API请求: 删除应用专属积分等级", { id });
  return http.request<ApiResponse<any>>(
    "delete",
    `/points/app-levels/${id}/`
  );
}

/**
 * 获取系统预置的等级透明图标列表
 */
export function getPresetLevelIcons() {
  logger.debug("API请求: 获取预置等级图标列表");
  return http.request<ApiResponse<Array<{ filename: string; name: string; relative_path: string; url: string }>>>(
    "get",
    "/points/app-levels/preset_icons/"
  );
}

/**
 * 上传自定义等级图标
 */
export function uploadLevelIcon(formData: FormData) {
  logger.debug("API请求: 上传自定义等级图标");
  return http.request<ApiResponse<{ filename: string; path: string; url: string }>>(
    "post",
    "/points/app-levels/upload_icon/",
    {
      data: formData,
      headers: { "Content-Type": "multipart/form-data" }
    }
  );
}

/**
 * 获取应用用户积分账户列表
 */
export function getApplicationPointsAccounts(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取应用用户积分账户列表", params);
  return http.request<DRFPaginationResponse<AppUserPointsAccount>>(
    "get",
    "/points/app-accounts/",
    { params }
  );
}

/**
 * 管理员对应用用户积分进行调账
 */
export function adjustAppUserPoints(id: number, data: { points: number; reason?: string; category?: string }) {
  logger.debug("API请求: 调账应用用户积分", { id, data });
  return http.request<ApiResponse<any>>(
    "post",
    `/points/app-accounts/${id}/adjust/`,
    { data }
  );
}

/**
 * 获取应用用户积分账户明细流水
 */
export function getAppUserPointsRecords(id: number, params: Record<string, any> = {}) {
  logger.debug("API请求: 获取应用用户账户流水", { id, params });
  return http.request<DRFPaginationResponse<TenantUserPoints>>(
    "get",
    `/points/app-accounts/${id}/records/`,
    { params }
  );
}

// ============================
// 每日签到规则配置 API
// ============================

/**
 * 获取签到规则配置列表
 */
export function getCheckinConfigs(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取签到规则配置列表", params);
  return http.request<DRFPaginationResponse<CheckinConfig>>(
    "get",
    "/points/checkin-configs/",
    { params: { ...params, _t: Date.now() } }
  );
}

/**
 * 获取系统预设的默认7天阶梯奖励
 */
export function getDefaultCheckinLadder() {
  logger.debug("API请求: 获取默认阶梯奖励");
  return http.request<ApiResponse<CheckinLadderItem[]> | CheckinLadderItem[]>(
    "get",
    "/points/checkin-configs/default_ladder/"
  );
}

/**
 * 创建签到规则配置
 */
export function createCheckinConfig(data: Partial<CheckinConfig>) {
  logger.debug("API请求: 创建签到规则配置", data);
  return http.request<ApiResponse<CheckinConfig>>(
    "post",
    "/points/checkin-configs/",
    { data }
  );
}

/**
 * 更新签到规则配置
 */
export function updateCheckinConfig(id: number, data: Partial<CheckinConfig>) {
  logger.debug("API请求: 更新签到规则配置", { id, data });
  return http.request<ApiResponse<CheckinConfig>>(
    "put",
    `/points/checkin-configs/${id}/`,
    { data }
  );
}

/**
 * 删除签到规则配置
 */
export function deleteCheckinConfig(id: number) {
  logger.debug("API请求: 删除签到规则配置", id);
  return http.request<ApiResponse<any>>(
    "delete",
    `/points/checkin-configs/${id}/`
  );
}

// ==========================================
// 用户签到管理与打卡/补签 API
// ==========================================

/**
 * 获取用户连续签到统计列表（管理端）
 */
export function getCheckinStreaks(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取用户连续签到统计", params);
  return http.request<DRFPaginationResponse<UserCheckinStreak>>(
    "get",
    "/points/checkin-streaks/",
    { params: { ...params, _t: Date.now() } }
  );
}

/**
 * 获取签到打卡流水记录（管理端）
 */
export function getCheckinRecords(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取签到打卡流水记录", params);
  return http.request<DRFPaginationResponse<UserCheckinRecord>>(
    "get",
    "/points/checkin-records/",
    { params: { ...params, _t: Date.now() } }
  );
}

/**
 * 个人每日打卡签到接口
 */
export function userCheckin(application_id?: number) {
  logger.debug("API请求: 执行每日打卡签到", { application_id });
  return http.request<ApiResponse<any>>(
    "post",
    "/points/checkin/execute/",
    { data: application_id ? { application_id } : {} }
  );
}

/**
 * 个人补签接口
 */
export function userRecheckin(target_date: string, application_id?: number) {
  logger.debug("API请求: 执行补签操作", { target_date, application_id });
  return http.request<ApiResponse<any>>(
    "post",
    "/points/checkin/recheckin/",
    { data: { target_date, application_id } }
  );
}

/**
 * 查询个人签到状态与日历
 */
export function getUserCheckinStatus(application_id?: number) {
  logger.debug("API请求: 获取个人签到状态", { application_id });
  return http.request<ApiResponse<any>>(
    "get",
    "/points/checkin/status/",
    { params: application_id ? { application_id, _t: Date.now() } : { _t: Date.now() } }
  );
}



