import { defineStore } from "pinia";
import * as licenseApi from "@/api/modules/license";
import type {
  LicensePlan,
  PlanListParams,
  PlanCreateParams,
  PlanUpdateParams,
  License,
  LicenseListParams,
  LicenseCreateParams,
  MachineBinding,
  MachineBindingListParams,
  MachineBindingBlockParams,
  LicenseActivation,
  ActivationListParams,
  AuditLog,
  LicenseStatistics,
  ActivationTrend,
  RevenueReport
} from "@/types/license";
import type { PaginationData } from "@/types/api";
import logger from "@/utils/logger";
import { store } from "../index";

/**
 * License模块状态接口
 */
interface LicenseState {
  // 数据状态
  plans: PaginationData<LicensePlan>;
  licenses: PaginationData<License>;
  machineBindings: PaginationData<MachineBinding>;
  activations: PaginationData<LicenseActivation>;
  auditLogs: PaginationData<AuditLog>;

  // 当前选中项
  currentPlan: LicensePlan | null;
  currentLicense: License | null;
  currentMachineBinding: MachineBinding | null;
  currentActivation: LicenseActivation | null;

  // 统计数据
  statistics: LicenseStatistics | null;
  activationTrend: ActivationTrend[];
  revenueReport: RevenueReport[];

  // 加载状态
  loading: {
    // 计划相关
    planList: boolean;
    planDetail: boolean;
    planCreate: boolean;
    planUpdate: boolean;
    planDelete: boolean;

    // 许可证相关
    licenseList: boolean;
    licenseDetail: boolean;
    licenseCreate: boolean;
    licenseUpdate: boolean;
    licenseRevoke: boolean;
    licenseRestore: boolean;
    batchLicenseOperation: boolean;

    // 机器绑定相关
    machineBindingList: boolean;
    machineBindingDetail: boolean;
    machineUnbind: boolean;

    // 激活相关
    activationList: boolean;
    activationDetail: boolean;
    activationDeactivate: boolean;

    // 审计日志相关
    auditLogList: boolean;
    auditLogDetail: boolean;

    // 统计报表相关
    statistics: boolean;
    activationTrend: boolean;
    revenueReport: boolean;

    // 导出相关
    exportLicenses: boolean;
    exportActivations: boolean;
    exportAuditLogs: boolean;
  };
}

/**
 * License模块状态管理
 */
export const useLicenseStore = defineStore("license", {
  state: (): LicenseState => ({
    // 数据初始化
    plans: { data: [], total: 0, page: 1, limit: 10 },
    licenses: { data: [], total: 0, page: 1, limit: 10 },
    machineBindings: { data: [], total: 0, page: 1, limit: 10 },
    activations: { data: [], total: 0, page: 1, limit: 10 },
    auditLogs: { data: [], total: 0, page: 1, limit: 10 },

    // 当前选中项初始化
    currentPlan: null,
    currentLicense: null,
    currentMachineBinding: null,
    currentActivation: null,

    // 统计数据初始化
    statistics: null,
    activationTrend: [],
    revenueReport: [],

    // 加载状态初始化
    loading: {
      planList: false,
      planDetail: false,
      planCreate: false,
      planUpdate: false,
      planDelete: false,

      licenseList: false,
      licenseDetail: false,
      licenseCreate: false,
      licenseUpdate: false,
      licenseRevoke: false,
      licenseRestore: false,
      batchLicenseOperation: false,

      machineBindingList: false,
      machineBindingDetail: false,
      machineUnbind: false,

      activationList: false,
      activationDetail: false,
      activationDeactivate: false,

      auditLogList: false,
      auditLogDetail: false,

      statistics: false,
      activationTrend: false,
      revenueReport: false,

      exportLicenses: false,
      exportActivations: false,
      exportAuditLogs: false
    }
  }),

  actions: {
    // ============================
    // 许可证计划管理 Actions
    // ============================

    /**
     * 获取计划列表
     */
    async fetchPlanList(params: PlanListParams = {}) {
      this.loading.planList = true;
      try {
        const response = (await licenseApi.getPlanList(params)) as any;
        if (response.success) {
          // 正确解构Django REST Framework返回的数据结构
          this.plans = {
            data: response.data.results || [],
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10
          };
          return response;
        } else {
          logger.error(response.message || "获取计划列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取计划列表失败", error);
        throw error;
      } finally {
        this.loading.planList = false;
      }
    },

    /**
     * 创建计划
     */
    async createPlan(data: PlanCreateParams) {
      this.loading.planCreate = true;
      try {
        const response = await licenseApi.createPlan(data);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "创建计划失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建计划失败", error);
        throw error;
      } finally {
        this.loading.planCreate = false;
      }
    },

    /**
     * 获取计划详情
     */
    async getPlanDetail(id: number) {
      this.loading.planDetail = true;
      try {
        const response = await licenseApi.getPlanDetail(id);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "获取计划详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取计划详情失败", error);
        throw error;
      } finally {
        this.loading.planDetail = false;
      }
    },

    /**
     * 更新计划
     */
    async updatePlan(id: number, data: PlanUpdateParams) {
      this.loading.planUpdate = true;
      try {
        const response = await licenseApi.updatePlan(id, data);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "更新计划失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新计划失败", error);
        throw error;
      } finally {
        this.loading.planUpdate = false;
      }
    },

    /**
     * 删除计划
     */
    async deletePlan(id: number) {
      this.loading.planDelete = true;
      try {
        const response = await licenseApi.deletePlan(id);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "删除计划失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除计划失败", error);
        throw error;
      } finally {
        this.loading.planDelete = false;
      }
    },

    // ============================
    // 许可证管理 Actions
    // ============================

    /**
     * 获取许可证列表
     */
    async fetchLicenseList(params: LicenseListParams = {}) {
      this.loading.licenseList = true;
      try {
        const response = (await licenseApi.getLicenseList(params)) as any;
        if (response.success) {
          // 正确解构API返回的数据结构
          this.licenses = {
            data: response.data.results || [],
            total: response.data.pagination?.count || 0,
            page: response.data.pagination?.current_page || params.page || 1,
            limit: response.data.pagination?.page_size || params.page_size || 10
          };
          return response;
        } else {
          logger.error(response.message || "获取许可证列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取许可证列表失败", error);
        throw error;
      } finally {
        this.loading.licenseList = false;
      }
    },

    /**
     * 创建许可证
     */
    async createLicense(data: LicenseCreateParams) {
      this.loading.licenseCreate = true;
      try {
        const response = await licenseApi.createLicense(data);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "创建许可证失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建许可证失败", error);
        throw error;
      } finally {
        this.loading.licenseCreate = false;
      }
    },

    /**
     * 批量创建许可证
     */
    async batchCreateLicenses(
      data: LicenseCreateParams & { quantity: number }
    ) {
      this.loading.licenseCreate = true;
      try {
        const response = await licenseApi.batchCreateLicenses(data);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "批量创建许可证失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("批量创建许可证失败", error);
        throw error;
      } finally {
        this.loading.licenseCreate = false;
      }
    },

    /**
     * 撤销许可证
     */
    async revokeLicense(id: number, params: { reason?: string } = {}) {
      this.loading.licenseRevoke = true;
      try {
        const response = await licenseApi.revokeLicense(id, params);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "撤销许可证失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("撤销许可证失败", error);
        throw error;
      } finally {
        this.loading.licenseRevoke = false;
      }
    },

    /**
     * 延长许可证有效期
     */
    async extendLicense(id: number, days: number) {
      this.loading.licenseUpdate = true;
      try {
        const response = await licenseApi.extendLicense(id, { days });
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "延长许可证失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("延长许可证失败", error);
        throw error;
      } finally {
        this.loading.licenseUpdate = false;
      }
    },

    /**
     * 批量操作许可证
     */
    async batchOperationLicenses(params: {
      license_ids: number[];
      operation: "revoke" | "suspend" | "activate" | "extend";
      parameters?: Record<string, any>;
      reason?: string;
    }) {
      this.loading.batchLicenseOperation = true;
      try {
        const response = await licenseApi.batchOperation(params);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "批量操作失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("批量操作失败", error);
        throw error;
      } finally {
        this.loading.batchLicenseOperation = false;
      }
    },

    /**
     * 获取许可证详情
     */
    async fetchLicenseDetail(id: number) {
      this.loading.licenseDetail = true;
      try {
        const response = await licenseApi.getLicenseDetail(id);
        if (response.success) {
          this.currentLicense = response.data;
          return response;
        } else {
          logger.error(response.message || "获取许可证详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取许可证详情失败", error);
        throw error;
      } finally {
        this.loading.licenseDetail = false;
      }
    },

    /**
     * 获取许可证使用统计
     */
    async fetchLicenseUsageStats(id: number) {
      this.loading.statistics = true;
      try {
        const response = await licenseApi.getLicenseUsageStats(id);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "获取使用统计失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取使用统计失败", error);
        throw error;
      } finally {
        this.loading.statistics = false;
      }
    },

    /**
     * 下载许可证文件
     */
    async downloadLicense(id: number, format: "json" | "txt" | "xml" = "json") {
      console.log("Store downloadLicense 被调用", { id, format });
      this.loading.exportLicenses = true;
      try {
        console.log("调用 API downloadLicense");
        // API返回的是原始blob数据，不是标准的{success, data}格式
        const blob = await licenseApi.downloadLicense(id, format);
        console.log("API 调用完成", { blob, blobType: typeof blob });

        // 确保获得的是Blob对象
        if (!(blob instanceof Blob)) {
          console.error("响应不是Blob", { blob, type: typeof blob });
          throw new Error("响应数据不是有效的文件格式");
        }

        console.log("开始创建下载链接");
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `license_${id}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        console.log("下载链接已触发");

        return { success: true };
      } catch (error) {
        console.error("Store downloadLicense 错误", error);
        logger.error("下载许可证失败", error);
        throw error;
      } finally {
        this.loading.exportLicenses = false;
      }
    },

    /**
     * 删除许可证
     */
    async deleteLicense(id: number) {
      this.loading.licenseUpdate = true;
      try {
        const response = await licenseApi.deleteLicense(id);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "删除许可证失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除许可证失败", error);
        throw error;
      } finally {
        this.loading.licenseUpdate = false;
      }
    },

    /**
     * 批量删除许可证
     */
    async batchDeleteLicenses(licenseIds: number[], reason?: string) {
      this.loading.batchLicenseOperation = true;
      try {
        const response = await licenseApi.batchDeleteLicenses(
          licenseIds,
          reason
        );
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "批量删除许可证失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("批量删除许可证失败", error);
        throw error;
      } finally {
        this.loading.batchLicenseOperation = false;
      }
    },

    // ============================
    // 统计报表 Actions
    // ============================

    /**
     * 获取许可证统计数据
     */
    async fetchLicenseStatistics() {
      this.loading.statistics = true;
      try {
        const response = await licenseApi.getLicenseStatistics();
        if (response.success) {
          this.statistics = response.data;
          return response;
        } else {
          logger.error(response.message || "获取统计数据失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取统计数据失败", error);
        throw error;
      } finally {
        this.loading.statistics = false;
      }
    },

    /**
     * 获取激活趋势数据
     */
    async fetchActivationTrend(params: { period: string; days?: number }) {
      this.loading.activationTrend = true;
      try {
        const response = await licenseApi.getActivationTrend(params);
        if (response.success) {
          this.activationTrend = response.data;
          return response;
        } else {
          logger.error(response.message || "获取激活趋势失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取激活趋势失败", error);
        throw error;
      } finally {
        this.loading.activationTrend = false;
      }
    },

    // ============================
    // 激活记录管理 Actions
    // ============================

    /**
     * 获取激活记录列表
     */
    async fetchActivationList(params: ActivationListParams = {}) {
      this.loading.activationList = true;
      try {
        const response = (await licenseApi.getActivationList(params)) as any;
        if (response.success) {
          this.activations = {
            data: response.data.results || [],
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10
          };
          return response;
        } else {
          logger.error(response.message || "获取激活记录列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取激活记录列表失败", error);
        throw error;
      } finally {
        this.loading.activationList = false;
      }
    },

    /**
     * 获取激活记录详情
     */
    async fetchActivationDetail(id: number) {
      this.loading.activationDetail = true;
      try {
        const response = await licenseApi.getActivationDetail(id);
        if (response.success) {
          this.currentActivation = response.data;
          return response;
        } else {
          logger.error(response.message || "获取激活记录详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取激活记录详情失败", error);
        throw error;
      } finally {
        this.loading.activationDetail = false;
      }
    },

    /**
     * 撤销激活 (停用激活)
     */
    async revokeActivation(id: number, reason?: string) {
      this.loading.activationDeactivate = true;
      try {
        const response = await licenseApi.deactivateActivation(id, reason);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "撤销激活失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("撤销激活失败", error);
        throw error;
      } finally {
        this.loading.activationDeactivate = false;
      }
    },

    /**
     * 删除激活记录
     */
    async deleteActivation(id: number) {
      this.loading.activationDeactivate = true;
      try {
        // 注意：如果后端没有删除激活记录的API，这里使用停用API
        const response = await licenseApi.deactivateActivation(id, "Deleted by admin");
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "删除激活记录失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除激活记录失败", error);
        throw error;
      } finally {
        this.loading.activationDeactivate = false;
      }
    },

    /**
     * 批量撤销激活
     */
    async batchRevokeActivations(activationIds: number[]) {
      this.loading.activationDeactivate = true;
      try {
        // 逐个撤销激活
        const results = await Promise.all(
          activationIds.map(id => licenseApi.deactivateActivation(id, "Batch revoked by admin"))
        );
        return { success: true, data: results };
      } catch (error) {
        logger.error("批量撤销激活失败", error);
        throw error;
      } finally {
        this.loading.activationDeactivate = false;
      }
    },

    /**
     * 获取机器列表（用于激活记录过滤）
     */
    async fetchMachineList(params: MachineBindingListParams = {}) {
      return this.fetchMachineBindingList(params);
    },

    // ============================
    // 机器绑定管理 Actions
    // ============================

    /**
     * 获取机器绑定列表
     */
    async fetchMachineBindingList(params: MachineBindingListParams = {}) {
      this.loading.machineBindingList = true;
      try {
        const response = (await licenseApi.getMachineBindingList(params)) as any;
        if (response.success) {
          this.machineBindings = {
            data: response.data.results || [],
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 20
          };
          return response;
        } else {
          logger.error(response.message || "获取机器绑定列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取机器绑定列表失败", error);
        throw error;
      } finally {
        this.loading.machineBindingList = false;
      }
    },

    /**
     * 获取机器绑定详情
     */
    async fetchMachineBindingDetail(id: number) {
      this.loading.machineBindingDetail = true;
      try {
        const response = await licenseApi.getMachineBindingDetail(id);
        if (response.success) {
          this.currentMachineBinding = response.data;
          return response;
        } else {
          logger.error(response.message || "获取机器绑定详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取机器绑定详情失败", error);
        throw error;
      } finally {
        this.loading.machineBindingDetail = false;
      }
    },

    /**
     * 阻止机器绑定
     */
    async blockMachineBinding(id: number, params: MachineBindingBlockParams = {}) {
      this.loading.machineBindingDetail = true;
      try {
        const response = await licenseApi.blockMachineBinding(id, params);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "阻止机器绑定失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("阻止机器绑定失败", error);
        throw error;
      } finally {
        this.loading.machineBindingDetail = false;
      }
    }
  }
});

export function useLicenseStoreHook() {
  return useLicenseStore(store);
}
