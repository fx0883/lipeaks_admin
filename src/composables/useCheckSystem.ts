/**
 * useCheckSystem Composables
 * 封装打卡系统相关的数据获取和操作逻辑
 */

import { ref, reactive, computed } from "vue";
import type { Ref, ComputedRef } from "vue";
import {
  getTaskCategoryList,
  getTaskCategoryDetail,
  createTaskCategory,
  updateTaskCategory,
  deleteTaskCategory,
  getTaskList,
  getTaskDetail,
  createTask,
  updateTask,
  deleteTask,
  getCheckRecordList,
  getCheckRecordDetail,
  getTaskTemplateList,
  getTaskTemplateDetail,
  createTaskTemplate,
  updateTaskTemplate,
  deleteTaskTemplate,
  getCycleList,
  getCycleDetail,
  getCurrentCycle,
  getCycleStatistics
} from "@/api/modules/checkSystem";
import type {
  TaskCategory,
  Task,
  CheckRecord,
  TaskTemplate,
  CheckinCycle,
  CycleStatistics,
  TaskCategoryListParams,
  TaskCategoryCreateParams,
  TaskCategoryUpdateParams,
  TaskListParams,
  TaskCreateParams,
  TaskUpdateParams,
  CheckRecordListParams,
  TaskTemplateListParams,
  TaskTemplateCreateParams,
  TaskTemplateUpdateParams,
  CycleListParams
} from "@/types/checkSystem";
import { message } from "@/utils/message";
import logger from "@/utils/logger";

// ==================== 任务类型(TaskCategory) Composables ====================

/**
 * 任务类型列表 Composable
 */
export function useTaskCategoryList(initialParams?: TaskCategoryListParams) {
  const categories = ref<TaskCategory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  const params = reactive<TaskCategoryListParams>({
    page: 1,
    page_size: 10,
    ...initialParams
  });

  const fetchCategories = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getTaskCategoryList(params);
      logger.debug("任务类型列表API响应", response);

      if (response.success && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          categories.value = response.data.results;

          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 10;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 10;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          categories.value = response.data;
          pagination.total = response.data.length;
        }
      } else {
        throw new Error(response.message || "获取任务类型列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取任务类型列表失败";
      logger.error("获取任务类型列表失败", err);
      message(error.value, { type: "error" });
      categories.value = [];
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetchCategories();

  const updateParams = (newParams: Partial<TaskCategoryListParams>) => {
    Object.assign(params, newParams);
    params.page = 1;
    fetchCategories();
  };

  const changePage = (page: number) => {
    params.page = page;
    fetchCategories();
  };

  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    fetchCategories();
  };

  const resetFilters = () => {
    params.is_system = undefined;
    params.form_type = undefined;
    params.search = undefined;
    params.page = 1;
    fetchCategories();
  };

  return {
    categories,
    loading,
    error,
    pagination,
    params,
    fetchCategories,
    refresh,
    updateParams,
    changePage,
    changePageSize,
    resetFilters
  };
}

/**
 * 任务类型操作 Composable
 */
export function useTaskCategoryActions() {
  const loading = ref(false);

  const create = async (data: TaskCategoryCreateParams): Promise<TaskCategory | null> => {
    loading.value = true;
    try {
      const response = await createTaskCategory(data);
      if (response.success && response.data) {
        message("创建成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "创建失败");
      }
    } catch (err: any) {
      message(err.message || "创建失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  const update = async (id: number, data: TaskCategoryUpdateParams): Promise<TaskCategory | null> => {
    loading.value = true;
    try {
      const response = await updateTaskCategory(id, data);
      if (response.success && response.data) {
        message("更新成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    loading.value = true;
    try {
      const response = await deleteTaskCategory(id);
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

  const fetchDetail = async (id: number): Promise<TaskCategory | null> => {
    loading.value = true;
    try {
      const response = await getTaskCategoryDetail(id);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || "获取详情失败");
      }
    } catch (err: any) {
      message(err.message || "获取详情失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { loading, create, update, remove, fetchDetail };
}

// ==================== 任务(Task) Composables ====================

/**
 * 任务列表 Composable
 */
export function useTaskList(initialParams?: TaskListParams) {
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  const params = reactive<TaskListParams>({
    page: 1,
    page_size: 10,
    ...initialParams
  });

  const fetchTasks = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getTaskList(params);
      logger.debug("任务列表API响应", response);

      if (response.success && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          tasks.value = response.data.results;

          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 10;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 10;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          tasks.value = response.data;
          pagination.total = response.data.length;
        }
      } else {
        throw new Error(response.message || "获取任务列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取任务列表失败";
      logger.error("获取任务列表失败", err);
      message(error.value, { type: "error" });
      tasks.value = [];
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetchTasks();

  const updateParams = (newParams: Partial<TaskListParams>) => {
    Object.assign(params, newParams);
    params.page = 1;
    fetchTasks();
  };

  const changePage = (page: number) => {
    params.page = page;
    fetchTasks();
  };

  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    fetchTasks();
  };

  const resetFilters = () => {
    params.category = undefined;
    params.status = undefined;
    params.search = undefined;
    params.page = 1;
    fetchTasks();
  };

  return {
    tasks,
    loading,
    error,
    pagination,
    params,
    fetchTasks,
    refresh,
    updateParams,
    changePage,
    changePageSize,
    resetFilters
  };
}

/**
 * 任务详情 Composable
 */
export function useTaskDetail(taskId?: Ref<number> | ComputedRef<number>) {
  const task = ref<Task | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchDetail = async (id?: number) => {
    const targetId = id || taskId?.value;
    if (!targetId) {
      error.value = "缺少任务ID";
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await getTaskDetail(targetId);
      if (response.success && response.data) {
        task.value = response.data;
      } else {
        throw new Error(response.message || "获取任务详情失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取任务详情失败";
      logger.error("获取任务详情失败", err);
      message(error.value, { type: "error" });
      task.value = null;
    } finally {
      loading.value = false;
    }
  };

  return { task, loading, error, fetchDetail };
}

/**
 * 任务操作 Composable
 */
export function useTaskActions() {
  const loading = ref(false);

  const create = async (data: TaskCreateParams): Promise<Task | null> => {
    loading.value = true;
    try {
      const response = await createTask(data);
      if (response.success && response.data) {
        message("创建成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "创建失败");
      }
    } catch (err: any) {
      message(err.message || "创建失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  const update = async (id: number, data: TaskUpdateParams): Promise<Task | null> => {
    loading.value = true;
    try {
      const response = await updateTask(id, data);
      if (response.success && response.data) {
        message("更新成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    loading.value = true;
    try {
      const response = await deleteTask(id);
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

  return { loading, create, update, remove };
}

// ==================== 打卡记录(CheckRecord) Composables ====================

/**
 * 打卡记录列表 Composable
 */
export function useCheckRecordList(initialParams?: CheckRecordListParams) {
  const records = ref<CheckRecord[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  const params = reactive<CheckRecordListParams>({
    page: 1,
    page_size: 10,
    ...initialParams
  });

  const fetchRecords = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getCheckRecordList(params);
      logger.debug("打卡记录列表API响应", response);

      if (response.success && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          records.value = response.data.results;

          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 10;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 10;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          records.value = response.data;
          pagination.total = response.data.length;
        }
      } else {
        throw new Error(response.message || "获取打卡记录列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取打卡记录列表失败";
      logger.error("获取打卡记录列表失败", err);
      message(error.value, { type: "error" });
      records.value = [];
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetchRecords();

  const updateParams = (newParams: Partial<CheckRecordListParams>) => {
    Object.assign(params, newParams);
    params.page = 1;
    fetchRecords();
  };

  const changePage = (page: number) => {
    params.page = page;
    fetchRecords();
  };

  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    fetchRecords();
  };

  const resetFilters = () => {
    params.task = undefined;
    params.theme = undefined;
    params.check_date = undefined;
    params.delayed = undefined;
    params.page = 1;
    fetchRecords();
  };

  return {
    records,
    loading,
    error,
    pagination,
    params,
    fetchRecords,
    refresh,
    updateParams,
    changePage,
    changePageSize,
    resetFilters
  };
}

// ==================== 任务模板(TaskTemplate) Composables ====================

/**
 * 任务模板列表 Composable
 */
export function useTaskTemplateList(initialParams?: TaskTemplateListParams) {
  const templates = ref<TaskTemplate[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  const params = reactive<TaskTemplateListParams>({
    page: 1,
    page_size: 10,
    ...initialParams
  });

  const fetchTemplates = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getTaskTemplateList(params);
      logger.debug("任务模板列表API响应", response);

      if (response.success && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          templates.value = response.data.results;

          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 10;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 10;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          templates.value = response.data;
          pagination.total = response.data.length;
        }
      } else {
        throw new Error(response.message || "获取任务模板列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取任务模板列表失败";
      logger.error("获取任务模板列表失败", err);
      message(error.value, { type: "error" });
      templates.value = [];
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetchTemplates();

  const updateParams = (newParams: Partial<TaskTemplateListParams>) => {
    Object.assign(params, newParams);
    params.page = 1;
    fetchTemplates();
  };

  const changePage = (page: number) => {
    params.page = page;
    fetchTemplates();
  };

  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    fetchTemplates();
  };

  const resetFilters = () => {
    params.category = undefined;
    params.is_system = undefined;
    params.search = undefined;
    params.page = 1;
    fetchTemplates();
  };

  return {
    templates,
    loading,
    error,
    pagination,
    params,
    fetchTemplates,
    refresh,
    updateParams,
    changePage,
    changePageSize,
    resetFilters
  };
}

/**
 * 任务模板操作 Composable
 */
export function useTaskTemplateActions() {
  const loading = ref(false);

  const create = async (data: TaskTemplateCreateParams): Promise<TaskTemplate | null> => {
    loading.value = true;
    try {
      const response = await createTaskTemplate(data);
      if (response.success && response.data) {
        message("创建成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "创建失败");
      }
    } catch (err: any) {
      message(err.message || "创建失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  const update = async (id: number, data: TaskTemplateUpdateParams): Promise<TaskTemplate | null> => {
    loading.value = true;
    try {
      const response = await updateTaskTemplate(id, data);
      if (response.success && response.data) {
        message("更新成功", { type: "success" });
        return response.data;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  const remove = async (id: number): Promise<boolean> => {
    loading.value = true;
    try {
      const response = await deleteTaskTemplate(id);
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

  const fetchDetail = async (id: number): Promise<TaskTemplate | null> => {
    loading.value = true;
    try {
      const response = await getTaskTemplateDetail(id);
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || "获取详情失败");
      }
    } catch (err: any) {
      message(err.message || "获取详情失败", { type: "error" });
      return null;
    } finally {
      loading.value = false;
    }
  };

  return { loading, create, update, remove, fetchDetail };
}

// ==================== 21天周期(CheckinCycle) Composables ====================

/**
 * 周期列表 Composable
 */
export function useCycleList(initialParams?: CycleListParams) {
  const cycles = ref<CheckinCycle[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 10,
    hasNext: false,
    hasPrevious: false
  });

  const params = reactive<CycleListParams>({
    page: 1,
    page_size: 10,
    ...initialParams
  });

  const fetchCycles = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getCycleList(params);
      logger.debug("周期列表API响应", response);

      if (response.success && response.data) {
        if (response.data.results && Array.isArray(response.data.results)) {
          cycles.value = response.data.results;

          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 10;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 10;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (Array.isArray(response.data)) {
          cycles.value = response.data;
          pagination.total = response.data.length;
        }
      } else {
        throw new Error(response.message || "获取周期列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取周期列表失败";
      logger.error("获取周期列表失败", err);
      message(error.value, { type: "error" });
      cycles.value = [];
    } finally {
      loading.value = false;
    }
  };

  const refresh = () => fetchCycles();

  const updateParams = (newParams: Partial<CycleListParams>) => {
    Object.assign(params, newParams);
    params.page = 1;
    fetchCycles();
  };

  const changePage = (page: number) => {
    params.page = page;
    fetchCycles();
  };

  const changePageSize = (size: number) => {
    params.page_size = size;
    params.page = 1;
    fetchCycles();
  };

  const resetFilters = () => {
    params.is_active = undefined;
    params.page = 1;
    fetchCycles();
  };

  return {
    cycles,
    loading,
    error,
    pagination,
    params,
    fetchCycles,
    refresh,
    updateParams,
    changePage,
    changePageSize,
    resetFilters
  };
}

/**
 * 周期详情 Composable
 */
export function useCycleDetail(cycleId?: Ref<number> | ComputedRef<number>) {
  const cycle = ref<CheckinCycle | null>(null);
  const statistics = ref<CycleStatistics | null>(null);
  const loading = ref(false);
  const statisticsLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchDetail = async (id?: number) => {
    const targetId = id || cycleId?.value;
    if (!targetId) {
      error.value = "缺少周期ID";
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await getCycleDetail(targetId);
      if (response.success && response.data) {
        cycle.value = response.data;
      } else {
        throw new Error(response.message || "获取周期详情失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取周期详情失败";
      logger.error("获取周期详情失败", err);
      message(error.value, { type: "error" });
      cycle.value = null;
    } finally {
      loading.value = false;
    }
  };

  const fetchStatistics = async (id?: number) => {
    const targetId = id || cycleId?.value;
    if (!targetId) return;

    statisticsLoading.value = true;

    try {
      const response = await getCycleStatistics(targetId);
      if (response.success && response.data) {
        statistics.value = response.data;
      } else {
        throw new Error(response.message || "获取周期统计失败");
      }
    } catch (err: any) {
      logger.error("获取周期统计失败", err);
      statistics.value = null;
    } finally {
      statisticsLoading.value = false;
    }
  };

  const refresh = async (id?: number) => {
    await Promise.all([fetchDetail(id), fetchStatistics(id)]);
  };

  return {
    cycle,
    statistics,
    loading,
    statisticsLoading,
    error,
    fetchDetail,
    fetchStatistics,
    refresh
  };
}

/**
 * 当前活跃周期 Composable
 */
export function useCurrentCycle() {
  const cycle = ref<CheckinCycle | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchCurrentCycle = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getCurrentCycle();
      if (response.success && response.data) {
        cycle.value = response.data;
      } else {
        throw new Error(response.message || "获取当前周期失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取当前周期失败";
      logger.error("获取当前周期失败", err);
      cycle.value = null;
    } finally {
      loading.value = false;
    }
  };

  return { cycle, loading, error, fetchCurrentCycle };
}
