/**
 * 打卡系统(Check System)类型定义
 *
 * 基于 Admin API 文档：/api/v1/check-system/
 */

import type { ApiResponse } from "./api";

// ==================== 枚举类型 ====================

/**
 * 表单类型
 */
export type FormType = "text" | "sleep" | "exercise" | "diet";

/**
 * 任务类型翻译内容
 */
export interface TaskCategoryTranslation {
  name: string;
  description?: string;
  goal?: string;
  tip?: string;
  quote?: string;
}

/**
 * 任务类型多语言翻译对象
 */
export interface TaskCategoryTranslations {
  "zh-hans"?: TaskCategoryTranslation;
  "en"?: TaskCategoryTranslation;
  "zh-hant"?: TaskCategoryTranslation;
  "ja"?: TaskCategoryTranslation;
  "ko"?: TaskCategoryTranslation;
  "fr"?: TaskCategoryTranslation;
  [key: string]: TaskCategoryTranslation | undefined;
}

/**
 * 任务模版翻译内容
 */
export interface TaskTemplateTranslation {
  name: string;
  description?: string;
}

/**
 * 任务模版多语言翻译对象
 */
export interface TaskTemplateTranslations {
  "zh-hans"?: TaskTemplateTranslation;
  "en"?: TaskTemplateTranslation;
  "zh-hant"?: TaskTemplateTranslation;
  "ja"?: TaskTemplateTranslation;
  "ko"?: TaskTemplateTranslation;
  "fr"?: TaskTemplateTranslation;
  [key: string]: TaskTemplateTranslation | undefined;
}

/**
 * 任务状态
 */
export type TaskStatus = "active" | "completed" | "paused" | "cancelled";

/**
 * 频率类型
 */
export type FrequencyType = "daily" | "weekly" | "custom";

// ==================== 实体类型 ====================

/**
 * 任务类型(TaskCategory)
 */
export interface TaskCategory {
  id: number;
  name: string;
  description: string;
  is_system: boolean;
  icon: string;
  color: string;
  goal: string;
  tip: string;
  quote: string;
  form_type: FormType;
  sort_order: number;
  translations: TaskCategoryTranslations;
  created_at: string;
  updated_at: string;
  translated_name: string;
  translated_description: string;
}

/**
 * 任务(Task)
 */
export interface Task {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name: string;
  member: number;
  member_name: string;
  start_date: string;
  end_date: string;
  status: TaskStatus;
  reminder: boolean;
  reminder_time: string | null;
  frequency_type: FrequencyType;
  frequency_days: number[];
  created_at: string;
  updated_at: string;
}

/**
 * 打卡记录(CheckRecord)
 */
export interface CheckRecord {
  id: number;
  task: number;
  task_name: string;
  theme: number;
  theme_name: string;
  member: number;
  member_name: string;
  check_date: string;
  check_time: string;
  remarks: string;
  comment: string;
  completion_time: number;
  extra_data: Record<string, any>;
  delayed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 任务模板(TaskTemplate)
 */
export interface TaskTemplate {
  id: number;
  name: string;
  description: string;
  category: number;
  category_name: string;
  is_system: boolean;
  translations: TaskTemplateTranslations;
  reminder: boolean;
  reminder_time: string | null;
  translated_name: string;
  translated_description: string;
  created_at: string;
  updated_at: string;
}

/**
 * 21天打卡周期(CheckinCycle)
 */
export interface CheckinCycle {
  id: number;
  member: number;
  member_name: string;
  start_date: string;
  end_date: string;
  selected_themes: number[];
  is_active: boolean;
  current_day: number;
  progress: number;
  themes: Array<{
    id: number;
    name: string;
  }>;
  created_at: string;
  updated_at: string;
}

/**
 * 周期统计
 */
export interface CycleStatistics {
  cycle_id: number;
  current_day: number;
  progress: number;
  total_checkins: number;
  unique_days: number;
  themes_completed: number;
  selected_themes_count: number;
}

// ==================== 查询参数类型 ====================

/**
 * 任务类型列表查询参数
 */
export interface TaskCategoryListParams {
  is_system?: boolean;
  form_type?: FormType;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * 任务列表查询参数
 */
export interface TaskListParams {
  category?: number;
  status?: TaskStatus;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * 打卡记录列表查询参数
 */
export interface CheckRecordListParams {
  task?: number;
  theme?: number;
  check_date?: string;
  delayed?: boolean;
  page?: number;
  page_size?: number;
}

/**
 * 任务模板列表查询参数
 */
export interface TaskTemplateListParams {
  category?: number;
  is_system?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

/**
 * 周期列表查询参数
 */
export interface CycleListParams {
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

// ==================== 创建/更新参数类型 ====================

/**
 * 创建任务类型参数
 */
export interface TaskCategoryCreateParams {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  goal?: string;
  tip?: string;
  quote?: string;
  form_type?: FormType;
  sort_order?: number;
  translations?: TaskCategoryTranslations;
}

/**
 * 更新任务类型参数
 */
export interface TaskCategoryUpdateParams {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  goal?: string;
  tip?: string;
  quote?: string;
  form_type?: FormType;
  sort_order?: number;
  translations?: TaskCategoryTranslations;
}

/**
 * 创建任务参数
 */
export interface TaskCreateParams {
  name: string;
  description?: string;
  category: number;
  start_date: string;
  end_date?: string;
  reminder?: boolean;
  reminder_time?: string;
  frequency_type?: FrequencyType;
  frequency_days?: number[];
}

/**
 * 更新任务参数
 */
export interface TaskUpdateParams {
  name?: string;
  description?: string;
  category?: number;
  start_date?: string;
  end_date?: string;
  status?: TaskStatus;
  reminder?: boolean;
  reminder_time?: string;
  frequency_type?: FrequencyType;
  frequency_days?: number[];
}

/**
 * 创建任务模板参数
 */
export interface TaskTemplateCreateParams {
  name: string;
  description?: string;
  category: number;
  reminder?: boolean;
  reminder_time?: string;
  translations?: TaskTemplateTranslations;
}

/**
 * 更新任务模板参数
 */
export interface TaskTemplateUpdateParams {
  name?: string;
  description?: string;
  category?: number;
  reminder?: boolean;
  reminder_time?: string;
  translations?: TaskTemplateTranslations;
}

// ==================== API响应类型 ====================

/**
 * 分页数据结构
 */
export interface CheckSystemPaginationData<T> {
  results: T[];
  pagination?: {
    count: number;
    current_page: number;
    page_size: number;
    total_pages: number;
    next: string | null;
    previous: string | null;
  };
  // DRF 标准格式兼容
  count?: number;
  next?: string | null;
  previous?: string | null;
}

/**
 * 任务类型列表响应
 */
export type TaskCategoryListResponse = ApiResponse<CheckSystemPaginationData<TaskCategory>>;

/**
 * 任务类型详情响应
 */
export type TaskCategoryResponse = ApiResponse<TaskCategory>;

/**
 * 任务列表响应
 */
export type TaskListResponse = ApiResponse<CheckSystemPaginationData<Task>>;

/**
 * 任务详情响应
 */
export type TaskResponse = ApiResponse<Task>;

/**
 * 打卡记录列表响应
 */
export type CheckRecordListResponse = ApiResponse<CheckSystemPaginationData<CheckRecord>>;

/**
 * 打卡记录详情响应
 */
export type CheckRecordResponse = ApiResponse<CheckRecord>;

/**
 * 任务模板列表响应
 */
export type TaskTemplateListResponse = ApiResponse<CheckSystemPaginationData<TaskTemplate>>;

/**
 * 任务模板详情响应
 */
export type TaskTemplateResponse = ApiResponse<TaskTemplate>;

/**
 * 周期列表响应
 */
export type CycleListResponse = ApiResponse<CheckSystemPaginationData<CheckinCycle>>;

/**
 * 周期详情响应
 */
export type CycleResponse = ApiResponse<CheckinCycle>;

/**
 * 周期统计响应
 */
export type CycleStatisticsResponse = ApiResponse<CycleStatistics>;

// ==================== 辅助类型/选项常量 ====================

/**
 * 表单类型选项
 */
export const FORM_TYPE_OPTIONS: Array<{
  value: FormType;
  label: string;
}> = [
    { value: "text", label: "文本表单" },
    { value: "sleep", label: "睡眠表单" },
    { value: "exercise", label: "运动表单" },
    { value: "diet", label: "饮食表单" }
  ];

/**
 * 任务状态选项
 */
export const TASK_STATUS_OPTIONS: Array<{
  value: TaskStatus;
  label: string;
  color: string;
}> = [
    { value: "active", label: "进行中", color: "success" },
    { value: "completed", label: "已完成", color: "info" },
    { value: "paused", label: "已暂停", color: "warning" },
    { value: "cancelled", label: "已取消", color: "danger" }
  ];

/**
 * 频率类型选项
 */
export const FREQUENCY_TYPE_OPTIONS: Array<{
  value: FrequencyType;
  label: string;
}> = [
    { value: "daily", label: "每天" },
    { value: "weekly", label: "每周" },
    { value: "custom", label: "自定义" }
  ];
