import { http } from "@/utils/http";
import type { ApiResponse, PaginationResponse } from "@/types/api";
import type {
  Application,
  ApplicationListParams,
  ApplicationCreateUpdateParams,
  ApplicationStatistics,
  ApplicationArticle,
  ApplicationLogoUploadResponse
} from "@/types/application";
import logger from "@/utils/logger";

/**
 * 获取应用列表
 */
export function getApplicationList(params: ApplicationListParams = {}) {
  logger.debug("API请求: 获取应用列表", params);

  return http.request<PaginationResponse<Application>>(
    "get",
    "/applications/",
    { params }
  );
}

/**
 * 获取应用详情
 */
export function getApplicationDetail(id: number) {
  logger.debug("API请求: 获取应用详情", { id });

  return http.request<ApiResponse<Application>>(
    "get",
    `/applications/${id}/`
  );
}

/**
 * 创建应用
 */
export function createApplication(data: ApplicationCreateUpdateParams) {
  logger.debug("API请求: 创建应用", data);

  return http.request<ApiResponse<Application>>(
    "post",
    "/applications/",
    { data }
  );
}

/**
 * 完整更新应用
 */
export function updateApplication(
  id: number,
  data: ApplicationCreateUpdateParams
) {
  logger.debug("API请求: 完整更新应用", { id, data });

  return http.request<ApiResponse<Application>>(
    "put",
    `/applications/${id}/`,
    { data }
  );
}

/**
 * 部分更新应用（推荐使用）
 */
export function patchApplication(
  id: number,
  data: Partial<ApplicationCreateUpdateParams>
) {
  logger.debug("API请求: 部分更新应用", { id, data });

  return http.request<ApiResponse<Application>>(
    "patch",
    `/applications/${id}/`,
    { data }
  );
}

/**
 * 删除应用
 */
export function deleteApplication(id: number) {
  logger.debug("API请求: 删除应用", { id });

  return http.request<ApiResponse<any>>(
    "delete",
    `/applications/${id}/`
  );
}

/**
 * 获取应用统计信息
 */
export function getApplicationStatistics(id: number) {
  logger.debug("API请求: 获取应用统计信息", { id });

  return http.request<ApiResponse<ApplicationStatistics>>(
    "get",
    `/applications/${id}/statistics/`
  );
}

/**
 * 获取应用关联文章
 */
export function getApplicationArticles(id: number) {
  logger.debug("API请求: 获取应用关联文章", { id });

  return http.request<ApiResponse<ApplicationArticle[]>>(
    "get",
    `/applications/${id}/articles/`
  );
}

/**
 * 上传应用Logo
 */
export function uploadApplicationLogo(id: number, file: File) {
  logger.debug("API请求: 上传应用Logo", { id, fileName: file.name });

  const formData = new FormData();
  formData.append("logo", file);

  return http.request<ApiResponse<ApplicationLogoUploadResponse>>(
    "post",
    `/applications/${id}/upload-logo/`,
    {
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data"
      }
    }
  );
}
