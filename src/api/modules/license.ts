import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  SoftwareProduct,
  ProductListParams,
  ProductCreateParams,
  ProductUpdateParams,
  LicensePlan,
  PlanListParams,
  PlanCreateParams,
  PlanUpdateParams,
  License,
  LicenseListParams,
  LicenseCreateParams,
  LicenseUpdateParams,
  MachineBinding,
  MachineBindingListParams,
  LicenseActivation,
  ActivationListParams,
  AuditLog,
  AuditLogListParams,
  LicenseStatistics,
  ActivationTrend,
  RevenueReport,
  BatchOperationParams,
  BatchOperationResult,
  ExportParams,
  ExportResult
} from "@/types/license";
import logger from "@/utils/logger";

// ============================
// 软件产品管理 API
// ============================

/**
 * 获取产品列表
 */
export function getProductList(params: ProductListParams = {}) {
  logger.debug("API请求: 获取产品列表", params);

  return http.request<PaginationResponse<SoftwareProduct>>(
    "get",
    "/licenses/admin/products/",
    { params }
  );
}

/**
 * 获取产品详情
 */
export function getProductDetail(id: number) {
  logger.debug("API请求: 获取产品详情", { id });

  return http.request<ApiResponse<SoftwareProduct>>(
    "get",
    `/licenses/admin/products/${id}/`
  );
}

/**
 * 创建产品
 */
export function createProduct(data: ProductCreateParams) {
  logger.debug("API请求: 创建产品", data);

  return http.request<ApiResponse<SoftwareProduct>>(
    "post",
    "/licenses/admin/products/",
    { data }
  );
}

/**
 * 更新产品
 */
export function updateProduct(id: number, data: ProductUpdateParams) {
  logger.debug("API请求: 更新产品", { id, data });

  return http.request<ApiResponse<SoftwareProduct>>(
    "put",
    `/licenses/admin/products/${id}/`,
    { data }
  );
}

/**
 * 部分更新产品
 */
export function patchProduct(id: number, data: Partial<ProductUpdateParams>) {
  logger.debug("API请求: 部分更新产品", { id, data });

  return http.request<ApiResponse<SoftwareProduct>>(
    "patch",
    `/licenses/admin/products/${id}/`,
    { data }
  );
}

/**
 * 删除产品
 */
export function deleteProduct(id: number) {
  logger.debug("API请求: 删除产品", { id });

  return http.request<ApiResponse<void>>(
    "delete",
    `/licenses/admin/products/${id}/`
  );
}

/**
 * 重新生成产品密钥对
 */
export function regenerateProductKeypair(id: number) {
  logger.debug("API请求: 重新生成产品密钥对", { id });

  return http.request<ApiResponse<{ public_key: string; private_key: string }>>(
    "post",
    `/licenses/admin/products/${id}/regenerate_keypair/`
  );
}

/**
 * 获取产品统计信息
 */
export function getProductStatistics(id: number) {
  logger.debug("API请求: 获取产品统计信息", { id });

  return http.request<ApiResponse<any>>(
    "get",
    `/licenses/admin/products/${id}/statistics/`
  );
}

// ============================
// 许可证计划管理 API
// ============================

/**
 * 获取计划列表
 */
export function getPlanList(params: PlanListParams = {}) {
  logger.debug("API请求: 获取计划列表", params);

  return http.request<PaginationResponse<LicensePlan>>(
    "get",
    "/licenses/admin/plans/",
    { params }
  );
}

/**
 * 获取计划详情
 */
export function getPlanDetail(id: number) {
  logger.debug("API请求: 获取计划详情", { id });

  return http.request<ApiResponse<LicensePlan>>(
    "get",
    `/licenses/admin/plans/${id}/`
  );
}

/**
 * 创建计划
 */
export function createPlan(data: PlanCreateParams) {
  logger.debug("API请求: 创建计划", data);

  return http.request<ApiResponse<LicensePlan>>(
    "post",
    "/licenses/admin/plans/",
    {
      data
    }
  );
}

/**
 * 更新计划
 */
export function updatePlan(id: number, data: PlanUpdateParams) {
  logger.debug("API请求: 更新计划", { id, data });

  return http.request<ApiResponse<LicensePlan>>(
    "put",
    `/licenses/admin/plans/${id}/`,
    { data }
  );
}

/**
 * 部分更新计划
 */
export function patchPlan(id: number, data: Partial<PlanUpdateParams>) {
  logger.debug("API请求: 部分更新计划", { id, data });

  return http.request<ApiResponse<LicensePlan>>(
    "patch",
    `/licenses/admin/plans/${id}/`,
    { data }
  );
}

/**
 * 删除计划
 */
export function deletePlan(id: number) {
  logger.debug("API请求: 删除计划", { id });

  return http.request<ApiResponse<void>>(
    "delete",
    `/licenses/admin/plans/${id}/`
  );
}

/**
 * 复制许可证方案
 */
export function duplicatePlan(id: number) {
  logger.debug("API请求: 复制许可证方案", { id });

  return http.request<ApiResponse<LicensePlan>>(
    "post",
    `/licenses/admin/plans/${id}/duplicate/`
  );
}

// ============================
// 许可证管理 API
// ============================

/**
 * 获取许可证列表
 */
export function getLicenseList(params: LicenseListParams = {}) {
  logger.debug("API请求: 获取许可证列表", params);

  return http.request<PaginationResponse<License>>(
    "get",
    "/licenses/admin/licenses/",
    {
      params
    }
  );
}

/**
 * 获取许可证详情
 */
export function getLicenseDetail(id: string) {
  logger.debug("API请求: 获取许可证详情", { id });

  return http.request<ApiResponse<License>>(
    "get",
    `/licenses/admin/licenses/${id}/`
  );
}

/**
 * 创建许可证
 */
export function createLicense(data: LicenseCreateParams) {
  logger.debug("API请求: 创建许可证", data);

  return http.request<ApiResponse<License>>(
    "post",
    "/licenses/admin/licenses/",
    {
      data
    }
  );
}

/**
 * 批量创建许可证
 */
export function batchCreateLicenses(
  data: LicenseCreateParams & { quantity: number }
) {
  logger.debug("API请求: 批量创建许可证", data);

  return http.request<ApiResponse<License[]>>(
    "post",
    "/licenses/admin/licenses/batch/",
    {
      data
    }
  );
}

/**
 * 更新许可证
 */
export function updateLicense(id: string, data: LicenseUpdateParams) {
  logger.debug("API请求: 更新许可证", { id, data });

  return http.request<ApiResponse<License>>(
    "put",
    `/licenses/admin/licenses/${id}/`,
    {
      data
    }
  );
}

/**
 * 部分更新许可证
 */
export function patchLicense(id: string, data: Partial<LicenseUpdateParams>) {
  logger.debug("API请求: 部分更新许可证", { id, data });

  return http.request<ApiResponse<License>>(
    "patch",
    `/licenses/admin/licenses/${id}/`,
    {
      data
    }
  );
}

/**
 * 撤销许可证
 */
export function revokeLicense(id: string, reason?: string) {
  logger.debug("API请求: 撤销许可证", { id, reason });

  return http.request<ApiResponse<License>>(
    "post",
    `/licenses/admin/licenses/${id}/revoke/`,
    {
      data: { reason }
    }
  );
}

/**
 * 恢复许可证
 */
export function restoreLicense(id: string) {
  logger.debug("API请求: 恢复许可证", { id });

  return http.request<ApiResponse<License>>(
    "post",
    `/licenses/admin/licenses/${id}/restore/`
  );
}

/**
 * 延长许可证有效期
 */
export function extendLicense(
  id: string,
  data: { extend_days: number; reason?: string }
) {
  logger.debug("API请求: 延长许可证有效期", { id, data });

  return http.request<ApiResponse<License>>(
    "post",
    `/licenses/admin/licenses/${id}/extend/`,
    {
      data
    }
  );
}

/**
 * 获取许可证使用统计
 */
export function getLicenseUsageStats(id: string) {
  logger.debug("API请求: 获取许可证使用统计", { id });

  return http.request<ApiResponse<any>>(
    "get",
    `/licenses/admin/licenses/${id}/usage_stats/`
  );
}

// ============================
// 机器绑定管理 API
// ============================

/**
 * 获取机器绑定列表
 */
export function getMachineBindingList(params: MachineBindingListParams = {}) {
  logger.debug("API请求: 获取机器绑定列表", params);

  return http.request<PaginationResponse<MachineBinding>>(
    "get",
    "/licenses/admin/machine-bindings/",
    { params }
  );
}

/**
 * 获取机器绑定详情
 */
export function getMachineBindingDetail(id: number) {
  logger.debug("API请求: 获取机器绑定详情", { id });

  return http.request<ApiResponse<MachineBinding>>(
    "get",
    `/licenses/admin/machine-bindings/${id}/`
  );
}

/**
 * 阻止机器绑定
 */
export function blockMachine(id: number, reason?: string) {
  logger.debug("API请求: 阻止机器绑定", { id, reason });

  return http.request<ApiResponse<void>>(
    "post",
    `/licenses/admin/machine-bindings/${id}/block/`,
    { data: { reason } }
  );
}

// ============================
// 许可证激活管理 API
// ============================

/**
 * 获取激活记录列表
 */
export function getActivationList(params: ActivationListParams = {}) {
  logger.debug("API请求: 获取激活记录列表", params);

  return http.request<PaginationResponse<LicenseActivation>>(
    "get",
    "/licenses/admin/activations/",
    { params }
  );
}

/**
 * 获取激活记录详情
 */
export function getActivationDetail(id: number) {
  logger.debug("API请求: 获取激活记录详情", { id });

  return http.request<ApiResponse<LicenseActivation>>(
    "get",
    `/licenses/admin/activations/${id}/`
  );
}

/**
 * 停用激活
 */
export function deactivateActivation(id: number, reason?: string) {
  logger.debug("API请求: 停用激活", { id, reason });

  return http.request<ApiResponse<void>>(
    "post",
    `/licenses/admin/activations/${id}/deactivate/`,
    { data: { reason } }
  );
}

// ============================
// 审计日志 API
// ============================

/**
 * 获取审计日志列表
 */
export function getAuditLogList(params: AuditLogListParams = {}) {
  logger.debug("API请求: 获取审计日志列表", params);

  return http.request<PaginationResponse<AuditLog>>(
    "get",
    "/licenses/admin/audit-logs/",
    { params }
  );
}

/**
 * 获取审计日志详情
 */
export function getAuditLogDetail(id: number) {
  logger.debug("API请求: 获取审计日志详情", { id });

  return http.request<ApiResponse<AuditLog>>(
    "get",
    `/licenses/admin/audit-logs/${id}/`
  );
}

// ============================
// 统计和报表 API
// ============================

/**
 * 获取许可证统计数据
 */
export function getLicenseStatistics() {
  logger.debug("API请求: 获取许可证统计数据");

  return http.request<ApiResponse<LicenseStatistics>>(
    "get",
    "/licenses/statistics/"
  );
}

/**
 * 获取激活趋势数据
 */
export function getActivationTrend(params: { period: string; days?: number }) {
  logger.debug("API请求: 获取激活趋势数据", params);

  return http.request<ApiResponse<ActivationTrend[]>>(
    "get",
    "/licenses/statistics/activation-trend/",
    { params }
  );
}

/**
 * 获取收入报表
 */
export function getRevenueReport(params: {
  period: string;
  start_date?: string;
  end_date?: string;
}) {
  logger.debug("API请求: 获取收入报表", params);

  return http.request<ApiResponse<RevenueReport[]>>(
    "get",
    "/licenses/statistics/revenue-report/",
    { params }
  );
}

// ============================
// 批量操作 API
// ============================

/**
 * 批量删除许可证
 */
export function batchDeleteLicenses(ids: string[]) {
  logger.debug("API请求: 批量删除许可证", { ids });

  return http.request<ApiResponse<BatchOperationResult>>(
    "post",
    "/licenses/admin/licenses/batch_operation/",
    { data: { operation: "delete", ids } }
  );
}

/**
 * 批量撤销许可证
 */
export function batchRevokeLicenses(ids: string[], reason?: string) {
  logger.debug("API请求: 批量撤销许可证", { ids, reason });

  return http.request<ApiResponse<BatchOperationResult>>(
    "post",
    "/licenses/admin/licenses/batch_operation/",
    { data: { operation: "revoke", ids, reason } }
  );
}

/**
 * 批量操作
 */
export function batchOperation(params: BatchOperationParams) {
  logger.debug("API请求: 批量操作", params);

  return http.request<ApiResponse<BatchOperationResult>>(
    "post",
    "/licenses/admin/licenses/batch_operation/",
    { data: params }
  );
}

// ============================
// 导出功能 API
// ============================

/**
 * 导出许可证数据
 */
export function exportLicenses(params: ExportParams) {
  logger.debug("API请求: 导出许可证数据", params);

  return http.request<ApiResponse<ExportResult>>("post", "/licenses/export/", {
    data: params
  });
}

/**
 * 导出激活记录
 */
export function exportActivations(params: ExportParams) {
  logger.debug("API请求: 导出激活记录", params);

  return http.request<ApiResponse<ExportResult>>(
    "post",
    "/licenses/activations/export/",
    { data: params }
  );
}

/**
 * 导出审计日志
 */
export function exportAuditLogs(params: ExportParams) {
  logger.debug("API请求: 导出审计日志", params);

  return http.request<ApiResponse<ExportResult>>(
    "post",
    "/licenses/audit-logs/export/",
    { data: params }
  );
}

// ============================
// 租户许可证配额管理 API
// ============================

/**
 * 获取租户许可证配额列表
 */
export function getTenantQuotaList(params: any = {}) {
  logger.debug("API请求: 获取租户许可证配额列表", params);

  return http.request<PaginationResponse<any>>(
    "get",
    "/licenses/admin/quotas/",
    { params }
  );
}

/**
 * 获取租户许可证配额详情
 */
export function getTenantQuotaDetail(id: number) {
  logger.debug("API请求: 获取租户许可证配额详情", { id });

  return http.request<ApiResponse<any>>("get", `/licenses/admin/quotas/${id}/`);
}

/**
 * 创建租户许可证配额
 */
export function createTenantQuota(data: any) {
  logger.debug("API请求: 创建租户许可证配额", data);

  return http.request<ApiResponse<any>>("post", "/licenses/admin/quotas/", {
    data
  });
}

/**
 * 更新租户许可证配额
 */
export function updateTenantQuota(id: number, data: any) {
  logger.debug("API请求: 更新租户许可证配额", { id, data });

  return http.request<ApiResponse<any>>(
    "put",
    `/licenses/admin/quotas/${id}/`,
    {
      data
    }
  );
}

/**
 * 部分更新租户许可证配额
 */
export function patchTenantQuota(id: number, data: any) {
  logger.debug("API请求: 部分更新租户许可证配额", { id, data });

  return http.request<ApiResponse<any>>(
    "patch",
    `/licenses/admin/quotas/${id}/`,
    {
      data
    }
  );
}

/**
 * 删除租户许可证配额
 */
export function deleteTenantQuota(id: number) {
  logger.debug("API请求: 删除租户许可证配额", { id });

  return http.request<ApiResponse<void>>(
    "delete",
    `/licenses/admin/quotas/${id}/`
  );
}

// ============================
// 许可证信息查询 API
// ============================

/**
 * 获取许可证信息
 */
export function getLicenseInfo(licenseKey: string) {
  logger.debug("API请求: 获取许可证信息", { licenseKey });

  return http.request<ApiResponse<any>>("get", `/licenses/info/${licenseKey}/`);
}

// ============================
// 许可证仪表板 API
// ============================

/**
 * 获取仪表板统计数据
 */
export function getLicenseDashboard() {
  logger.debug("API请求: 获取仪表板统计数据");

  return http.request<ApiResponse<any>>("get", "/licenses/reports/dashboard/");
}

// ============================
// 许可证报表 API
// ============================

/**
 * 生成自定义报表
 */
export function generateCustomReport(data: any) {
  logger.debug("API请求: 生成自定义报表", data);

  return http.request<ApiResponse<any>>("post", "/licenses/reports/generate/", {
    data
  });
}

// ============================
// 许可证服务状态 API
// ============================

/**
 * 获取服务器状态
 */
export function getLicenseServiceStatus() {
  logger.debug("API请求: 获取服务器状态");

  return http.request<ApiResponse<any>>("get", "/licenses/status/");
}
