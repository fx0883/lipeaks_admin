/**
 * 打卡系统(Check System) API 封装
 *
 * 基于 Admin API 文档：/api/v1/check-system/
 */

import { http } from "@/utils/http";
import type {
  TaskCategoryListParams,
  TaskCategoryCreateParams,
  TaskCategoryUpdateParams,
  TaskCategoryListResponse,
  TaskCategoryResponse,
  TaskListParams,
  TaskCreateParams,
  TaskUpdateParams,
  TaskListResponse,
  TaskResponse,
  CheckRecordListParams,
  CheckRecordListResponse,
  CheckRecordResponse,
  TaskTemplateListParams,
  TaskTemplateCreateParams,
  TaskTemplateUpdateParams,
  TaskTemplateListResponse,
  TaskTemplateResponse,
  CycleListParams,
  CycleListResponse,
  CycleResponse,
  CycleStatisticsResponse
} from "@/types/checkSystem";
import type { ApiResponse } from "@/types/api";
import logger from "@/utils/logger";

// API 基础路径
const BASE_URL = "/check-system";

// ==================== 任务类型(TaskCategory) API ====================

/**
 * 获取任务类型列表
 * @param params 查询参数
 */
export function getTaskCategoryList(params?: TaskCategoryListParams) {
  logger.debug("API请求: 获取任务类型列表", params);
  return http.request<TaskCategoryListResponse>("get", `${BASE_URL}/task-categories/`, {
    params
  });
}

/**
 * 获取任务类型详情
 * @param id 任务类型ID
 */
export function getTaskCategoryDetail(id: number) {
  logger.debug("API请求: 获取任务类型详情", { id });
  return http.request<TaskCategoryResponse>("get", `${BASE_URL}/task-categories/${id}/`);
}

/**
 * 创建任务类型
 * @param data 创建数据
 */
export function createTaskCategory(data: TaskCategoryCreateParams) {
  logger.debug("API请求: 创建任务类型", data);
  return http.request<TaskCategoryResponse>("post", `${BASE_URL}/task-categories/`, {
    data
  });
}

/**
 * 更新任务类型
 * @param id 任务类型ID
 * @param data 更新数据
 */
export function updateTaskCategory(id: number, data: TaskCategoryUpdateParams) {
  logger.debug("API请求: 更新任务类型", { id, data });
  return http.request<TaskCategoryResponse>("patch", `${BASE_URL}/task-categories/${id}/`, {
    data
  });
}

/**
 * 删除任务类型
 * @param id 任务类型ID
 */
export function deleteTaskCategory(id: number) {
  logger.debug("API请求: 删除任务类型", { id });
  return http.request<ApiResponse<null>>("delete", `${BASE_URL}/task-categories/${id}/`);
}

// ==================== 任务(Task) API ====================

/**
 * 获取任务列表
 * @param params 查询参数
 */
export function getTaskList(params?: TaskListParams) {
  logger.debug("API请求: 获取任务列表", params);
  return http.request<TaskListResponse>("get", `${BASE_URL}/tasks/`, {
    params
  });
}

/**
 * 获取任务详情
 * @param id 任务ID
 */
export function getTaskDetail(id: number) {
  logger.debug("API请求: 获取任务详情", { id });
  return http.request<TaskResponse>("get", `${BASE_URL}/tasks/${id}/`);
}

/**
 * 创建任务
 * @param data 创建数据
 */
export function createTask(data: TaskCreateParams) {
  logger.debug("API请求: 创建任务", data);
  return http.request<TaskResponse>("post", `${BASE_URL}/tasks/`, {
    data
  });
}

/**
 * 更新任务
 * @param id 任务ID
 * @param data 更新数据
 */
export function updateTask(id: number, data: TaskUpdateParams) {
  logger.debug("API请求: 更新任务", { id, data });
  return http.request<TaskResponse>("patch", `${BASE_URL}/tasks/${id}/`, {
    data
  });
}

/**
 * 删除任务
 * @param id 任务ID
 */
export function deleteTask(id: number) {
  logger.debug("API请求: 删除任务", { id });
  return http.request<ApiResponse<null>>("delete", `${BASE_URL}/tasks/${id}/`);
}

// ==================== 打卡记录(CheckRecord) API ====================

/**
 * 获取打卡记录列表
 * @param params 查询参数
 */
export function getCheckRecordList(params?: CheckRecordListParams) {
  logger.debug("API请求: 获取打卡记录列表", params);
  return http.request<CheckRecordListResponse>("get", `${BASE_URL}/check-records/`, {
    params
  });
}

/**
 * 获取打卡记录详情
 * @param id 记录ID
 */
export function getCheckRecordDetail(id: number) {
  logger.debug("API请求: 获取打卡记录详情", { id });
  return http.request<CheckRecordResponse>("get", `${BASE_URL}/check-records/${id}/`);
}

// ==================== 任务模板(TaskTemplate) API ====================

/**
 * 获取任务模板列表
 * @param params 查询参数
 */
export function getTaskTemplateList(params?: TaskTemplateListParams) {
  logger.debug("API请求: 获取任务模板列表", params);
  return http.request<TaskTemplateListResponse>("get", `${BASE_URL}/task-templates/`, {
    params
  });
}

/**
 * 获取任务模板详情
 * @param id 模板ID
 */
export function getTaskTemplateDetail(id: number) {
  logger.debug("API请求: 获取任务模板详情", { id });
  return http.request<TaskTemplateResponse>("get", `${BASE_URL}/task-templates/${id}/`);
}

/**
 * 创建任务模板
 * @param data 创建数据
 */
export function createTaskTemplate(data: TaskTemplateCreateParams) {
  logger.debug("API请求: 创建任务模板", data);
  return http.request<TaskTemplateResponse>("post", `${BASE_URL}/task-templates/`, {
    data
  });
}

/**
 * 更新任务模板
 * @param id 模板ID
 * @param data 更新数据
 */
export function updateTaskTemplate(id: number, data: TaskTemplateUpdateParams) {
  logger.debug("API请求: 更新任务模板", { id, data });
  return http.request<TaskTemplateResponse>("patch", `${BASE_URL}/task-templates/${id}/`, {
    data
  });
}

/**
 * 删除任务模板
 * @param id 模板ID
 */
export function deleteTaskTemplate(id: number) {
  logger.debug("API请求: 删除任务模板", { id });
  return http.request<ApiResponse<null>>("delete", `${BASE_URL}/task-templates/${id}/`);
}

// ==================== 21天周期(CheckinCycle) API ====================

/**
 * 获取周期列表
 * @param params 查询参数
 */
export function getCycleList(params?: CycleListParams) {
  logger.debug("API请求: 获取周期列表", params);
  return http.request<CycleListResponse>("get", `${BASE_URL}/cycles/`, {
    params
  });
}

/**
 * 获取周期详情
 * @param id 周期ID
 */
export function getCycleDetail(id: number) {
  logger.debug("API请求: 获取周期详情", { id });
  return http.request<CycleResponse>("get", `${BASE_URL}/cycles/${id}/`);
}

/**
 * 获取当前活跃周期
 */
export function getCurrentCycle() {
  logger.debug("API请求: 获取当前活跃周期");
  return http.request<CycleResponse>("get", `${BASE_URL}/cycles/current/`);
}

/**
 * 获取周期统计
 * @param id 周期ID
 */
export function getCycleStatistics(id: number) {
  logger.debug("API请求: 获取周期统计", { id });
  return http.request<CycleStatisticsResponse>("get", `${BASE_URL}/cycles/${id}/stats/`);
}
