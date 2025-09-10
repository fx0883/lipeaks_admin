import { defineStore } from "pinia";
import * as licenseApi from "@/api/modules/license";
import type {
  SoftwareProduct,
  ProductListParams,
  ProductCreateParams,
  ProductUpdateParams,
  LicensePlan,
  PlanListParams,
  PlanCreateParams,
  License,
  LicenseListParams,
  LicenseCreateParams,
  MachineBinding,
  LicenseActivation,
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
  products: PaginationData<SoftwareProduct>;
  plans: PaginationData<LicensePlan>;
  licenses: PaginationData<License>;
  machineBindings: PaginationData<MachineBinding>;
  activations: PaginationData<LicenseActivation>;
  auditLogs: PaginationData<AuditLog>;

  // 当前选中项
  currentProduct: SoftwareProduct | null;
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
    // 产品相关
    productList: boolean;
    productDetail: boolean;
    productCreate: boolean;
    productUpdate: boolean;
    productDelete: boolean;

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
    products: { data: [], total: 0, page: 1, limit: 10 },
    plans: { data: [], total: 0, page: 1, limit: 10 },
    licenses: { data: [], total: 0, page: 1, limit: 10 },
    machineBindings: { data: [], total: 0, page: 1, limit: 10 },
    activations: { data: [], total: 0, page: 1, limit: 10 },
    auditLogs: { data: [], total: 0, page: 1, limit: 10 },

    // 当前选中项初始化
    currentProduct: null,
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
      productList: false,
      productDetail: false,
      productCreate: false,
      productUpdate: false,
      productDelete: false,

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
    // 软件产品管理 Actions
    // ============================

    /**
     * 获取产品列表
     */
    async fetchProductList(params: ProductListParams = {}) {
      this.loading.productList = true;
      try {
        const response = (await licenseApi.getProductList(params)) as any;
        if (response.success) {
          // 正确解构Django REST Framework返回的数据结构
          this.products = {
            data: response.data.results || [],
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10
          };
          return response;
        } else {
          logger.error(response.message || "获取产品列表失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取产品列表失败", error);
        throw error;
      } finally {
        this.loading.productList = false;
      }
    },

    /**
     * 获取产品详情
     */
    async fetchProductDetail(id: number) {
      this.loading.productDetail = true;
      try {
        const response = await licenseApi.getProductDetail(id);
        if (response.success) {
          this.currentProduct = response.data;
          return response;
        } else {
          logger.error(response.message || "获取产品详情失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取产品详情失败", error);
        throw error;
      } finally {
        this.loading.productDetail = false;
      }
    },

    /**
     * 创建产品
     */
    async createProduct(data: ProductCreateParams) {
      this.loading.productCreate = true;
      try {
        const response = await licenseApi.createProduct(data);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "创建产品失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("创建产品失败", error);
        throw error;
      } finally {
        this.loading.productCreate = false;
      }
    },

    /**
     * 更新产品
     */
    async updateProduct(id: number, data: ProductUpdateParams) {
      this.loading.productUpdate = true;
      try {
        const response = await licenseApi.updateProduct(id, data);
        if (response.success) {
          if (this.currentProduct && this.currentProduct.id === id) {
            this.currentProduct = response.data;
          }
          return response;
        } else {
          logger.error(response.message || "更新产品失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("更新产品失败", error);
        throw error;
      } finally {
        this.loading.productUpdate = false;
      }
    },

    /**
     * 删除产品
     */
    async deleteProduct(id: number) {
      this.loading.productDelete = true;
      try {
        const response = await licenseApi.deleteProduct(id);
        if (response.success) {
          if (this.currentProduct && this.currentProduct.id === id) {
            this.currentProduct = null;
          }
          return response;
        } else {
          logger.error(response.message || "删除产品失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("删除产品失败", error);
        throw error;
      } finally {
        this.loading.productDelete = false;
      }
    },

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
          // 正确解构Django REST Framework返回的数据结构
          this.licenses = {
            data: response.data.results || [],
            total: response.data.count || 0,
            page: params.page || 1,
            limit: params.page_size || 10
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
    async revokeLicense(id: string, reason?: string) {
      this.loading.licenseRevoke = true;
      try {
        const response = await licenseApi.revokeLicense(id, reason);
        if (response.success) {
          if (this.currentLicense && this.currentLicense.id === id) {
            this.currentLicense = response.data;
          }
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

    /**
     * 获取产品统计信息
     */
    async fetchProductStatistics(id: number) {
      this.loading.statistics = true;
      try {
        const response = await licenseApi.getProductStatistics(id);
        if (response.success) {
          return response;
        } else {
          logger.error(response.message || "获取产品统计信息失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("获取产品统计信息失败", error);
        throw error;
      } finally {
        this.loading.statistics = false;
      }
    },

    /**
     * 重新生成产品密钥对
     */
    async regenerateProductKeypair(id: number) {
      this.loading.productUpdate = true;
      try {
        const response = await licenseApi.regenerateProductKeypair(id);
        if (response.success) {
          // 更新当前产品信息
          if (this.currentProduct && this.currentProduct.id === id) {
            // 重新获取产品详情以获取最新信息
            await this.fetchProductDetail(id);
          }
          return response;
        } else {
          logger.error(response.message || "重新生成密钥对失败");
          return Promise.reject(new Error(response.message));
        }
      } catch (error) {
        logger.error("重新生成密钥对失败", error);
        throw error;
      } finally {
        this.loading.productUpdate = false;
      }
    }
  }
});

export function useLicenseStoreHook() {
  return useLicenseStore(store);
}
