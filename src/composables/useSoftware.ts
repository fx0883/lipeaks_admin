/**
 * 软件产品管理 Composable
 */

import { ref, reactive } from "vue";
import {
  getSoftwareList,
  getSoftwareDetail,
  createSoftware,
  updateSoftware,
  deleteSoftware,
  getSoftwareCategories,
  createSoftwareCategory,
  updateSoftwareCategory,
  deleteSoftwareCategory
} from "@/api/modules/feedback";
import type {
  Software,
  SoftwareCategory,
  SoftwareListParams,
  SoftwareCreateParams,
  SoftwareCategoryCreateParams
} from "@/types/feedback";
import { message } from "@/utils/message";

/**
 * 软件分类管理 Composable
 * @param autoFetch 是否自动获取分类列表
 */
export function useSoftwareCategories(autoFetch = false) {
  const categories = ref<SoftwareCategory[]>([]);
  const loading = ref(false);

  /**
   * 获取分类列表
   */
  const fetchCategories = async () => {
    loading.value = true;
    try {
      const response = await getSoftwareCategories();
      if (response.success && response.data) {
        categories.value = response.data;
      }
    } catch (error) {
      console.error("获取分类列表失败:", error);
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建分类
   */
  const createCategory = async (data: SoftwareCategoryCreateParams) => {
    try {
      const response = await createSoftwareCategory(data);
      if (response.success && response.data) {
        message("创建成功", { type: "success" });
        return response.data;
      }
    } catch (error) {
      console.error("创建分类失败:", error);
      message("创建失败", { type: "error" });
    }
    return null;
  };

  /**
   * 更新分类
   */
  const updateCategory = async (
    id: number,
    data: Partial<SoftwareCategoryCreateParams>
  ) => {
    try {
      const response = await updateSoftwareCategory(id, data);
      if (response.success && response.data) {
        message("更新成功", { type: "success" });
        return true;
      }
    } catch (error) {
      console.error("更新分类失败:", error);
      message("更新失败", { type: "error" });
    }
    return false;
  };

  /**
   * 删除分类
   */
  const deleteCategory = async (id: number) => {
    try {
      const response = await deleteSoftwareCategory(id);
      if (response.success) {
        message("删除成功", { type: "success" });
        return true;
      }
    } catch (error) {
      console.error("删除分类失败:", error);
      message("删除失败", { type: "error" });
    }
    return false;
  };

  // 自动获取
  if (autoFetch) {
    fetchCategories();
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
}

/**
 * 软件产品列表管理 Composable
 */
export function useSoftwareList() {
  const softwareList = ref<Software[]>([]);
  const loading = ref(false);

  const pagination = reactive({
    page: 1,
    pageSize: 10,
    total: 0
  });

  const params = reactive<SoftwareListParams>({
    page: 1,
    page_size: 10
  });

  /**
   * 获取软件列表
   */
  const fetchSoftwareList = async () => {
    loading.value = true;
    try {
      const response = await getSoftwareList(params);
      if (response.success && response.data) {
        softwareList.value = response.data.results || [];
        pagination.total = response.data.pagination?.count || 0;
        pagination.page = response.data.pagination?.current_page || 1;
        pagination.pageSize = response.data.pagination?.page_size || 10;
      }
    } catch (error) {
      console.error("获取软件列表失败:", error);
    } finally {
      loading.value = false;
    }
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
    pagination.page = page;
    fetchSoftwareList();
  };

  /**
   * 删除软件
   */
  const deleteSoftwareItem = async (id: number) => {
    try {
      const response = await deleteSoftware(id);
      if (response.success) {
        message("删除成功", { type: "success" });
        fetchSoftwareList();
        return true;
      }
    } catch (error) {
      console.error("删除软件失败:", error);
      message("删除失败", { type: "error" });
    }
    return false;
  };

  return {
    softwareList,
    loading,
    pagination,
    params,
    fetchSoftwareList,
    updateParams,
    changePage,
    deleteSoftwareItem
  };
}

/**
 * 软件产品详情管理 Composable
 */
export function useSoftwareDetail() {
  const software = ref<Software | null>(null);
  const loading = ref(false);

  /**
   * 获取软件详情
   */
  const fetchDetail = async (id: number) => {
    loading.value = true;
    try {
      const response = await getSoftwareDetail(id);
      if (response.success && response.data) {
        software.value = response.data;
        return response.data;
      }
    } catch (error) {
      console.error("获取软件详情失败:", error);
    } finally {
      loading.value = false;
    }
    return null;
  };

  /**
   * 更新软件
   */
  const updateSoftwareItem = async (
    id: number,
    data: Partial<SoftwareCreateParams>
  ) => {
    try {
      const response = await updateSoftware(id, data as any);
      if (response.success && response.data) {
        software.value = response.data;
        message("更新成功", { type: "success" });
        return true;
      }
    } catch (error) {
      console.error("更新软件失败:", error);
      message("更新失败", { type: "error" });
    }
    return false;
  };

  return {
    software,
    loading,
    fetchDetail,
    updateSoftwareItem
  };
}
