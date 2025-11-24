import { defineStore } from "pinia";
import { store } from "@/store";
import type { PaginationData } from "@/types/api";
import type {
  Application,
  ApplicationListParams,
  ApplicationCreateUpdateParams,
  ApplicationStatistics,
  ApplicationArticle
} from "@/types/application";
import {
  getApplicationList,
  getApplicationDetail,
  createApplication,
  patchApplication,
  deleteApplication,
  getApplicationStatistics,
  getApplicationArticles,
  uploadApplicationLogo
} from "@/api/modules/application";
import logger from "@/utils/logger";

interface ApplicationState {
  // 应用列表数据
  applicationList: PaginationData<Application>;
  // 当前选中的应用
  currentApplication: Application | null;
  // 当前应用的统计信息
  statistics: ApplicationStatistics | null;
  // 当前应用的关联文章
  articles: ApplicationArticle[];
  // 加载状态
  loading: {
    list: boolean;
    detail: boolean;
    create: boolean;
    update: boolean;
    delete: boolean;
    statistics: boolean;
    articles: boolean;
    uploadAvatar: boolean;
  };
  // 错误信息
  error: string | null;
}

export const useApplicationStore = defineStore("application", {
  state: (): ApplicationState => ({
    applicationList: {
      total: 0,
      page: 1,
      limit: 10,
      data: []
    },
    currentApplication: null,
    statistics: null,
    articles: [],
    loading: {
      list: false,
      detail: false,
      create: false,
      update: false,
      delete: false,
      statistics: false,
      articles: false,
      uploadAvatar: false
    },
    error: null
  }),

  actions: {
    /**
     * 获取应用列表
     */
    async fetchApplicationList(params?: ApplicationListParams) {
      this.loading.list = true;
      this.error = null;
      try {
        logger.debug("获取应用列表", params);
        const response = await getApplicationList(params || {});

        if (response.success && response.data) {
          // 处理分页数据结构适配
          if ('results' in response.data && 'pagination' in response.data) {
            // DRF风格的分页响应
            this.applicationList = {
              total: (response.data as any).pagination?.count || 0,
              page: params?.page || 1,
              limit: params?.page_size || 10,
              total_pages: (response.data as any).pagination?.total_pages,
              data: (response.data as any).results || []
            };
          } else {
            // 标准分页响应
            this.applicationList = {
              total: (response.data as any).total || 0,
              page: (response.data as any).page || 1,
              limit: (response.data as any).limit || 10,
              total_pages: (response.data as any).total_pages,
              data: Array.isArray((response.data as any).data) ? (response.data as any).data : []
            };
          }
          logger.debug("应用列表获取成功", {
            count: this.applicationList.data.length
          });
        }

        return response;
      } catch (error) {
        logger.error("获取应用列表失败", error);
        this.error = error instanceof Error ? error.message : "获取应用列表失败";
        throw error;
      } finally {
        this.loading.list = false;
      }
    },

    /**
     * 获取应用详情
     */
    async fetchApplicationDetail(id: number) {
      this.loading.detail = true;
      this.error = null;
      try {
        logger.debug("获取应用详情", { id });
        const response = await getApplicationDetail(id);

        if (response.success && response.data) {
          this.currentApplication = response.data;
          logger.debug("应用详情获取成功", { id, name: response.data.name });
        }

        return response;
      } catch (error) {
        logger.error("获取应用详情失败", error);
        this.error = error instanceof Error ? error.message : "获取应用详情失败";
        throw error;
      } finally {
        this.loading.detail = false;
      }
    },

    /**
     * 创建应用
     */
    async createApplication(data: ApplicationCreateUpdateParams) {
      this.loading.create = true;
      this.error = null;
      try {
        logger.debug("创建应用", data);
        const response = await createApplication(data);

        if (response.success) {
          logger.debug("应用创建成功", { code: data.code });
          // 刷新列表
          await this.fetchApplicationList();
        }

        return response;
      } catch (error) {
        logger.error("创建应用失败", error);
        this.error = error instanceof Error ? error.message : "创建应用失败";
        throw error;
      } finally {
        this.loading.create = false;
      }
    },

    /**
     * 更新应用
     */
    async updateApplication(
      id: number,
      data: Partial<ApplicationCreateUpdateParams>
    ) {
      this.loading.update = true;
      this.error = null;
      try {
        logger.debug("更新应用", { id, data });
        const response = await patchApplication(id, data);

        if (response.success) {
          logger.debug("应用更新成功", { id });
          // 更新当前应用数据
          if (this.currentApplication && this.currentApplication.id === id && response.data) {
            this.currentApplication = { ...this.currentApplication, ...response.data };
          }
          // 刷新列表
          await this.fetchApplicationList();
        }

        return response;
      } catch (error) {
        logger.error("更新应用失败", error);
        this.error = error instanceof Error ? error.message : "更新应用失败";
        throw error;
      } finally {
        this.loading.update = false;
      }
    },

    /**
     * 删除应用
     */
    async deleteApplication(id: number) {
      this.loading.delete = true;
      this.error = null;
      try {
        logger.debug("删除应用", { id });
        const response = await deleteApplication(id);

        if (response.success) {
          logger.debug("应用删除成功", { id });
          // 刷新列表
          await this.fetchApplicationList();
        }

        return response;
      } catch (error) {
        logger.error("删除应用失败", error);
        this.error = error instanceof Error ? error.message : "删除应用失败";
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },

    /**
     * 获取应用统计信息
     */
    async fetchApplicationStatistics(id: number) {
      this.loading.statistics = true;
      this.error = null;
      try {
        logger.debug("获取应用统计信息", { id });
        const response = await getApplicationStatistics(id);

        if (response.success && response.data) {
          this.statistics = response.data;
          logger.debug("应用统计信息获取成功", { id });
        }

        return response;
      } catch (error) {
        logger.error("获取应用统计信息失败", error);
        this.error = error instanceof Error ? error.message : "获取应用统计信息失败";
        throw error;
      } finally {
        this.loading.statistics = false;
      }
    },

    /**
     * 获取应用关联文章
     */
    async fetchApplicationArticles(id: number) {
      this.loading.articles = true;
      this.error = null;
      try {
        logger.debug("获取应用关联文章", { id });
        const response = await getApplicationArticles(id);

        if (response.success && response.data) {
          this.articles = response.data;
          logger.debug("应用关联文章获取成功", {
            id,
            count: response.data.length
          });
        }

        return response;
      } catch (error) {
        logger.error("获取应用关联文章失败", error);
        this.error = error instanceof Error ? error.message : "获取应用关联文章失败";
        throw error;
      } finally {
        this.loading.articles = false;
      }
    },

    /**
     * 上传应用Logo
     */
    async uploadLogo(id: number, file: File) {
      this.loading.uploadAvatar = true;
      this.error = null;
      try {
        logger.debug("上传应用Logo", { id, fileName: file.name });
        const response = await uploadApplicationLogo(id, file);

        if (response.success && response.data) {
          const logoUrl = response.data.logo_url || response.data.logo;
          logger.debug("应用Logo上传成功", { id, logoUrl });

          // 更新当前应用的logo
          if (this.currentApplication && this.currentApplication.id === id && logoUrl) {
            this.currentApplication.logo = logoUrl;
          }
        }

        return response;
      } catch (error) {
        logger.error("上传应用Logo失败", error);
        this.error = error instanceof Error ? error.message : "上传应用Logo失败";
        throw error;
      } finally {
        this.loading.uploadAvatar = false;
      }
    },

    /**
     * 清除当前应用
     */
    clearCurrent() {
      this.currentApplication = null;
      this.statistics = null;
      this.articles = [];
      this.error = null;
    }
  }
});

export function useApplicationStoreHook() {
  return useApplicationStore(store);
}
