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
    "/api/v1/licenses/products/",
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
    `/api/v1/licenses/products/${id}/`
  );
}

/**
 * 创建产品
 */
export function createProduct(data: ProductCreateParams) {
  logger.debug("API请求: 创建产品", data);
  
  return http.request<ApiResponse<SoftwareProduct>>(
    "post",
    "/api/v1/licenses/products/",
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
    `/api/v1/licenses/products/${id}/`,
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
    `/api/v1/licenses/products/${id}/`
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
    "/api/v1/licenses/plans/",
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
    `/api/v1/licenses/plans/${id}/`
  );
}

/**
 * 创建计划
 */
export function createPlan(data: PlanCreateParams) {
  logger.debug("API请求: 创建计划", data);
  
  return http.request<ApiResponse<LicensePlan>>(
    "post",
    "/api/v1/licenses/plans/",
    { data }
  );
}

/**
 * 更新计划
 */
export function updatePlan(id: number, data: PlanUpdateParams) {
  logger.debug("API请求: 更新计划", { id, data });
  
  return http.request<ApiResponse<LicensePlan>>(
    "put",
    `/api/v1/licenses/plans/${id}/`,
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
    `/api/v1/licenses/plans/${id}/`
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
    "/api/v1/licenses/licenses/",
    { params }
  );
}

/**
 * 获取许可证详情
 */
export function getLicenseDetail(id: string) {
  logger.debug("API请求: 获取许可证详情", { id });
  
  return http.request<ApiResponse<License>>(
    "get",
    `/api/v1/licenses/licenses/${id}/`
  );
}

/**
 * 创建许可证
 */
export function createLicense(data: LicenseCreateParams) {
  logger.debug("API请求: 创建许可证", data);
  
  return http.request<ApiResponse<License>>(
    "post",
    "/api/v1/licenses/licenses/",
    { data }
  );
}

/**
 * 批量创建许可证
 */
export function batchCreateLicenses(data: LicenseCreateParams & { quantity: number }) {
  logger.debug("API请求: 批量创建许可证", data);
  
  return http.request<ApiResponse<License[]>>(
    "post",
    "/api/v1/licenses/licenses/batch/",
    { data }
  );
}

/**
 * 更新许可证
 */
export function updateLicense(id: string, data: LicenseUpdateParams) {
  logger.debug("API请求: 更新许可证", { id, data });
  
  return http.request<ApiResponse<License>>(
    "put",
    `/api/v1/licenses/licenses/${id}/`,
    { data }
  );
}

/**
 * 撤销许可证
 */
export function revokeLicense(id: string, reason?: string) {
  logger.debug("API请求: 撤销许可证", { id, reason });
  
  return http.request<ApiResponse<License>>(
    "post",
    `/api/v1/licenses/licenses/${id}/revoke/`,
    { data: { reason } }
  );
}

/**
 * 恢复许可证
 */
export function restoreLicense(id: string) {
  logger.debug("API请求: 恢复许可证", { id });
  
  return http.request<ApiResponse<License>>(
    "post",
    `/api/v1/licenses/licenses/${id}/restore/`
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
    "/api/v1/licenses/machine-bindings/",
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
    `/api/v1/licenses/machine-bindings/${id}/`
  );
}

/**
 * 解绑机器
 */
export function unbindMachine(id: number, reason?: string) {
  logger.debug("API请求: 解绑机器", { id, reason });
  
  return http.request<ApiResponse<void>>(
    "post",
    `/api/v1/licenses/machine-bindings/${id}/unbind/`,
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
    "/api/v1/licenses/activations/",
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
    `/api/v1/licenses/activations/${id}/`
  );
}

/**
 * 停用激活
 */
export function deactivateActivation(id: number, reason?: string) {
  logger.debug("API请求: 停用激活", { id, reason });
  
  return http.request<ApiResponse<void>>(
    "post",
    `/api/v1/licenses/activations/${id}/deactivate/`,
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
    "/api/v1/licenses/audit-logs/",
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
    `/api/v1/licenses/audit-logs/${id}/`
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
    "/api/v1/licenses/statistics/"
  );
}

/**
 * 获取激活趋势数据
 */
export function getActivationTrend(params: { period: string; days?: number }) {
  logger.debug("API请求: 获取激活趋势数据", params);
  
  return http.request<ApiResponse<ActivationTrend[]>>(
    "get",
    "/api/v1/licenses/statistics/activation-trend/",
    { params }
  );
}

/**
 * 获取收入报表
 */
export function getRevenueReport(params: { period: string; start_date?: string; end_date?: string }) {
  logger.debug("API请求: 获取收入报表", params);
  
  return http.request<ApiResponse<RevenueReport[]>>(
    "get",
    "/api/v1/licenses/statistics/revenue-report/",
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
    "/api/v1/licenses/licenses/batch-delete/",
    { data: { ids } }
  );
}

/**
 * 批量撤销许可证
 */
export function batchRevokeLicenses(ids: string[], reason?: string) {
  logger.debug("API请求: 批量撤销许可证", { ids, reason });
  
  return http.request<ApiResponse<BatchOperationResult>>(
    "post",
    "/api/v1/licenses/licenses/batch-revoke/",
    { data: { ids, reason } }
  );
}

/**
 * 批量操作
 */
export function batchOperation(params: BatchOperationParams) {
  logger.debug("API请求: 批量操作", params);
  
  return http.request<ApiResponse<BatchOperationResult>>(
    "post",
    "/api/v1/licenses/batch-operation/",
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
  
  return http.request<ApiResponse<ExportResult>>(
    "post",
    "/api/v1/licenses/licenses/export/",
    { data: params }
  );
}

/**
 * 导出激活记录
 */
export function exportActivations(params: ExportParams) {
  logger.debug("API请求: 导出激活记录", params);
  
  return http.request<ApiResponse<ExportResult>>(
    "post",
    "/api/v1/licenses/activations/export/",
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
    "/api/v1/licenses/audit-logs/export/",
    { data: params }
  );
}
