/**
 * useApplication Composable
 * 封装应用管理相关的数据获取和操作逻辑
 * 用于 Feedback 模块中选择应用
 */

import { ref, reactive, computed } from "vue";
import { getApplicationList } from "@/api/modules/application";
import type { Application, ApplicationListParams } from "@/types/application";
import { message } from "@/utils/message";
import logger from "@/utils/logger";

/**
 * 应用列表 Composable
 */
export function useApplicationList(initialParams?: ApplicationListParams) {
  const applications = ref<Application[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  });

  // 查询参数
  const params = reactive<ApplicationListParams>({
    page: 1,
    page_size: 20,
    ordering: "name",
    is_active: true,
    ...initialParams
  });

  /**
   * 获取应用列表
   */
  const fetchApplications = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getApplicationList(params);

      logger.debug("应用列表API响应", response);

      if (response.success && response.data) {
        const data = response.data as any;
        // 处理分页响应
        if (data.results && Array.isArray(data.results)) {
          applications.value = data.results;

          // 提取分页信息
          if (data.pagination) {
            pagination.total = data.pagination.count || 0;
            pagination.page = data.pagination.current_page || params.page || 1;
            pagination.pageSize = data.pagination.page_size || params.page_size || 20;
            pagination.hasNext = !!data.pagination.next;
            pagination.hasPrevious = !!data.pagination.previous;
          } else {
            // 兼容 DRF 格式
            pagination.total = data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 20;
            pagination.hasNext = !!data.next;
            pagination.hasPrevious = !!data.previous;
          }
        } else if (data.data && Array.isArray(data.data)) {
          // 标准分页响应
          applications.value = data.data;
          pagination.total = data.total || data.data.length;
          pagination.page = data.page || params.page || 1;
          pagination.pageSize = data.limit || params.page_size || 20;
        } else if (Array.isArray(data)) {
          // 如果直接是数组
          applications.value = data;
          pagination.total = data.length;
          pagination.page = params.page || 1;
          pagination.pageSize = params.page_size || 20;
        } else {
          logger.warn("应用列表数据格式异常", data);
          applications.value = [];
        }

        logger.debug("获取应用列表成功", {
          count: applications.value.length,
          total: pagination.total
        });
      } else {
        throw new Error(response.message || "获取应用列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取应用列表失败";
      logger.error("获取应用列表失败", err);
      message(error.value, { type: "error" });
      applications.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新列表
   */
  const refresh = () => {
    fetchApplications();
  };

  /**
   * 更新查询参数
   */
  const updateParams = (newParams: Partial<ApplicationListParams>) => {
    Object.assign(params, newParams);
    params.page = 1; // 重置到第一页
    fetchApplications();
  };

  /**
   * 翻页
   */
  const changePage = (page: number) => {
    params.page = page;
    fetchApplications();
  };

  return {
    applications,
    loading,
    error,
    pagination,
    params,
    fetchApplications,
    refresh,
    updateParams,
    changePage
  };
}

/**
 * 应用选择器 Composable
 * 用于反馈提交等场景的应用选择
 */
export function useApplicationSelector(autoFetch = true) {
  const applications = ref<Application[]>([]);
  const loading = ref(false);
  const selectedApplicationId = ref<number | null>(null);

  /**
   * 获取应用列表（仅获取活跃的应用）
   */
  const fetchApplications = async () => {
    loading.value = true;

    try {
      const response = await getApplicationList({
        is_active: true,
        page_size: 100, // 获取足够多的应用供选择
        ordering: "name"
      });

      logger.debug("应用选择器API响应", response);

      if (response.success && response.data) {
        const data = response.data as any;
        // 处理分页响应
        if (data.results && Array.isArray(data.results)) {
          applications.value = data.results;
        } else if (data.data && Array.isArray(data.data)) {
          applications.value = data.data;
        } else if (Array.isArray(data)) {
          applications.value = data;
        } else {
          applications.value = [];
        }

        logger.debug("获取应用选择器列表成功", { count: applications.value.length });
      }
    } catch (err: any) {
      logger.error("获取应用选择器列表失败", err);
      applications.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 选择应用
   */
  const selectApplication = (applicationId: number | null) => {
    selectedApplicationId.value = applicationId;
  };

  /**
   * 获取选中的应用对象
   */
  const selectedApplication = computed(() => {
    if (!selectedApplicationId.value) return null;
    return applications.value.find(app => app.id === selectedApplicationId.value) || null;
  });

  /**
   * 重置选择
   */
  const reset = () => {
    selectedApplicationId.value = null;
  };

  // 自动获取
  if (autoFetch) {
    fetchApplications();
  }

  return {
    // 数据
    applications,
    // 选中的ID
    selectedApplicationId,
    // 选中的应用对象
    selectedApplication,
    // 加载状态
    loading,
    // 操作方法
    fetchApplications,
    selectApplication,
    reset
  };
}
