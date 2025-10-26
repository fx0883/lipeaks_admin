/**
 * useSoftware Composable
 * 封装软件管理相关的数据获取和操作逻辑
 */

import { ref, reactive, watch } from "vue";
import type { Ref } from "vue";
import {
  getSoftwareCategoryList,
  getSoftwareList,
  getSoftwareVersions,
  createSoftwareCategory,
  createSoftware,
  updateSoftwareCategory,
  updateSoftware,
  deleteSoftwareCategory,
  deleteSoftware
} from "@/api/modules/feedback";
import type {
  SoftwareCategory,
  SoftwareCategoryListParams,
  SoftwareCategoryCreateParams,
  SoftwareCategoryUpdateParams,
  Software,
  SoftwareListParams,
  SoftwareCreateParams,
  SoftwareUpdateParams,
  SoftwareVersion
} from "@/types/feedback";
import { message } from "@/utils/message";
import logger from "@/utils/logger";

/**
 * 软件分类 Composable
 */
export function useSoftwareCategories(autoFetch = true) {
  const categories = ref<SoftwareCategory[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取分类列表
   */
  const fetchCategories = async (params?: SoftwareCategoryListParams) => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getSoftwareCategoryList(params);

      logger.debug("软件分类API响应", response);

      if (response.success && response.data) {
        // 处理自定义分页响应格式
        if (response.data.results && Array.isArray(response.data.results)) {
          categories.value = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 处理双层嵌套数据格式 {data: {data: [...]}}
          categories.value = response.data.data;
        } else if (Array.isArray(response.data)) {
          // 兼容直接返回数组的情况
          categories.value = response.data;
        } else {
          logger.warn("分类数据格式异常", response.data);
          categories.value = [];
        }
        logger.debug("获取软件分类成功", { count: categories.value.length });
      } else {
        throw new Error(response.message || "获取软件分类失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取软件分类失败";
      logger.error("获取软件分类失败", err);
      message(error.value, { type: "error" });
      categories.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建分类
   */
  const createCategory = async (data: SoftwareCategoryCreateParams) => {
    loading.value = true;

    try {
      const response = await createSoftwareCategory(data);

      if (response.success && response.data) {
        categories.value.push(response.data);
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

  /**
   * 更新分类
   */
  const updateCategory = async (
    id: number,
    data: SoftwareCategoryUpdateParams
  ) => {
    loading.value = true;

    try {
      const response = await updateSoftwareCategory(id, data);

      if (response.success && response.data) {
        const index = categories.value.findIndex(c => c.id === id);
        if (index !== -1) {
          categories.value[index] = response.data;
        }
        message("更新成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除分类
   */
  const deleteCategory = async (id: number) => {
    loading.value = true;

    try {
      const response = await deleteSoftwareCategory(id);

      if (response.success) {
        categories.value = categories.value.filter(c => c.id !== id);
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

  // 自动获取
  if (autoFetch) {
    fetchCategories({ is_active: true, ordering: "sort_order" });
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}

/**
 * 软件产品列表 Composable
 */
export function useSoftwareList(initialParams?: SoftwareListParams) {
  const softwareList = ref<Software[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const pagination = reactive({
    total: 0,
    page: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false
  });

  const params = reactive<SoftwareListParams>({
    page: 1,
    page_size: 20,
    ordering: "name",
    ...initialParams
  });

  /**
   * 获取软件列表
   */
  const fetchSoftwareList = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await getSoftwareList(params);

      logger.debug("软件列表API响应", response);

      if (response.success && response.data) {
        // 处理自定义分页响应
        if (response.data.results && Array.isArray(response.data.results)) {
          softwareList.value = response.data.results;
          
          // 提取分页信息
          if (response.data.pagination) {
            pagination.total = response.data.pagination.count || 0;
            pagination.page = response.data.pagination.current_page || params.page || 1;
            pagination.pageSize = response.data.pagination.page_size || params.page_size || 20;
            pagination.hasNext = !!response.data.pagination.next;
            pagination.hasPrevious = !!response.data.pagination.previous;
          } else {
            // 兼容 DRF 格式
            pagination.total = response.data.count || 0;
            pagination.page = params.page || 1;
            pagination.pageSize = params.page_size || 20;
            pagination.hasNext = !!response.data.next;
            pagination.hasPrevious = !!response.data.previous;
          }
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 处理双层嵌套数据格式 {data: {data: [...]}}
          softwareList.value = response.data.data;
          pagination.total = response.data.data.length;
          pagination.page = params.page || 1;
          pagination.pageSize = params.page_size || 20;
        } else if (Array.isArray(response.data)) {
          // 如果直接是数组
          softwareList.value = response.data;
          pagination.total = response.data.length;
          pagination.page = params.page || 1;
          pagination.pageSize = params.page_size || 20;
        } else {
          logger.warn("软件列表数据格式异常", response.data);
          softwareList.value = [];
        }

        logger.debug("获取软件列表成功", {
          count: softwareList.value.length,
          total: pagination.total
        });
      } else {
        throw new Error(response.message || "获取软件列表失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取软件列表失败";
      logger.error("获取软件列表失败", err);
      message(error.value, { type: "error" });
      softwareList.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 刷新列表
   */
  const refresh = () => {
    fetchSoftwareList();
  };

  /**
   * 更新查询参数
   */
  const updateParams = (newParams: Partial<SoftwareListParams>) => {
    Object.assign(params, newParams);
    params.page = 1;
    fetchSoftwareList();
  };

  /**
   * 翻页
   */
  const changePage = (page: number) => {
    params.page = page;
    fetchSoftwareList();
  };

  /**
   * 创建软件
   */
  const createSoftwareItem = async (data: SoftwareCreateParams) => {
    loading.value = true;

    try {
      const response = await createSoftware(data);

      if (response.success && response.data) {
        message("创建成功", { type: "success" });
        await fetchSoftwareList(); // 刷新列表
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

  /**
   * 更新软件
   */
  const updateSoftwareItem = async (
    id: number,
    data: SoftwareUpdateParams
  ) => {
    loading.value = true;

    try {
      const response = await updateSoftware(id, data);

      if (response.success && response.data) {
        const index = softwareList.value.findIndex(s => s.id === id);
        if (index !== -1) {
          softwareList.value[index] = response.data;
        }
        message("更新成功", { type: "success" });
        return true;
      } else {
        throw new Error(response.message || "更新失败");
      }
    } catch (err: any) {
      message(err.message || "更新失败", { type: "error" });
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 删除软件
   */
  const deleteSoftwareItem = async (id: number) => {
    loading.value = true;

    try {
      const response = await deleteSoftware(id);

      if (response.success) {
        softwareList.value = softwareList.value.filter(s => s.id !== id);
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

  return {
    softwareList,
    loading,
    error,
    pagination,
    params,
    fetchSoftwareList,
    refresh,
    updateParams,
    changePage,
    createSoftwareItem,
    updateSoftwareItem,
    deleteSoftwareItem
  };
}

/**
 * 软件版本 Composable
 */
export function useSoftwareVersions(softwareId: Ref<number | null> | number | null) {
  const versions = ref<SoftwareVersion[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 获取版本列表
   */
  const fetchVersions = async () => {
    const id = typeof softwareId === "number" ? softwareId : softwareId?.value;
    if (!id) {
      versions.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const response = await getSoftwareVersions(id);

      logger.debug("软件版本API响应", response);

      if (response.success && response.data) {
        // 处理自定义分页响应
        if (response.data.results && Array.isArray(response.data.results)) {
          versions.value = response.data.results;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // 处理双层嵌套数据格式 {data: {data: [...]}}
          versions.value = response.data.data;
        } else if (Array.isArray(response.data)) {
          // 兼容直接返回数组的情况
          versions.value = response.data;
        } else {
          logger.warn("版本数据格式异常", response.data);
          versions.value = [];
        }
        logger.debug("获取软件版本成功", { count: versions.value.length });
      } else {
        throw new Error(response.message || "获取软件版本失败");
      }
    } catch (err: any) {
      error.value = err.message || "获取软件版本失败";
      logger.error("获取软件版本失败", err);
      versions.value = [];
    } finally {
      loading.value = false;
    }
  };

  // 监听 softwareId 变化
  if (typeof softwareId !== "number") {
    watch(
      () => (softwareId as Ref<number | null>)?.value,
      (newId) => {
        if (newId) {
          fetchVersions();
        } else {
          versions.value = [];
        }
      },
      { immediate: true }
    );
  }

  return {
    versions,
    loading,
    error,
    fetchVersions
  };
}

/**
 * 软件选择器 Composable
 * 用于反馈提交等场景的级联选择
 */
export function useSoftwareSelector() {
  const { categories, loading: loadingCategories } = useSoftwareCategories(true);

  const selectedCategoryId = ref<number | null>(null);
  const selectedSoftwareId = ref<number | null>(null);
  const selectedVersionId = ref<number | null>(null);

  const {
    softwareList,
    loading: loadingSoftware,
    updateParams: updateSoftwareParams
  } = useSoftwareList();

  const {
    versions,
    loading: loadingVersions
  } = useSoftwareVersions(selectedSoftwareId);

  /**
   * 选择分类
   */
  const selectCategory = (categoryId: number | null) => {
    selectedCategoryId.value = categoryId;
    selectedSoftwareId.value = null;
    selectedVersionId.value = null;

    if (categoryId) {
      updateSoftwareParams({
        category: categoryId,
        is_active: true
      });
    } else {
      softwareList.value = [];
    }
  };

  /**
   * 选择软件
   */
  const selectSoftware = (softwareId: number | null) => {
    selectedSoftwareId.value = softwareId;
    selectedVersionId.value = null;
  };

  /**
   * 选择版本
   */
  const selectVersion = (versionId: number | null) => {
    selectedVersionId.value = versionId;
  };

  /**
   * 重置选择
   */
  const reset = () => {
    selectedCategoryId.value = null;
    selectedSoftwareId.value = null;
    selectedVersionId.value = null;
  };

  const loading = ref(false);
  watch([loadingCategories, loadingSoftware, loadingVersions], ([c, s, v]) => {
    loading.value = c || s || v;
  });

  return {
    // 数据
    categories,
    softwareList,
    versions,
    // 选中的ID
    selectedCategoryId,
    selectedSoftwareId,
    selectedVersionId,
    // 加载状态
    loading,
    // 操作方法
    selectCategory,
    selectSoftware,
    selectVersion,
    reset
  };
}

