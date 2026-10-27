import { http } from "@/utils/http";
import type { ApiResponse, DRFPaginationResponse } from "@/types/api";
import type {
  WechatCredential,
  WechatFeed,
  WechatArticle,
  WechatSyncTask,
  WeRssQueryParams
} from "@/types/weRss";
import logger from "@/utils/logger";

// ============================
// We-RSS 微信聚合 API
// ============================

/**
 * 获取托管微信公众号凭证列表
 */
export function getCredentials(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取微信托管凭证列表", params);
  return http.request<DRFPaginationResponse<WechatCredential>>(
    "get",
    "/we-rss/credentials/",
    { params }
  );
}

/**
 * 实时探测凭证有效性
 */
export function checkCredential(id: number) {
  logger.debug("API请求: 探测凭证有效性", { id });
  return http.request<ApiResponse<any>>(
    "post",
    `/we-rss/credentials/${id}/check/`
  );
}

/**
 * 设为租户默认抓取凭证
 */
export function setDefaultCredential(id: number) {
  logger.debug("API请求: 设为默认凭证", { id });
  return http.request<ApiResponse<any>>(
    "post",
    `/we-rss/credentials/${id}/set_default/`
  );
}

/**
 * 获取已收录的公众号列表
 */
export function getFeeds(params: WeRssQueryParams = {}) {
  logger.debug("API请求: 获取公众号列表", params);
  return http.request<DRFPaginationResponse<WechatFeed>>(
    "get",
    "/we-rss/feeds/",
    { params }
  );
}

/**
 * 检索微信公众号源
 */
export function searchFeeds(keyword: string) {
  logger.debug("API请求: 检索微信公众号", { keyword });
  return http.request<ApiResponse<any[]>>(
    "get",
    "/we-rss/feeds/search/",
    { params: { keyword } }
  );
}

/**
 * 一键订阅公众号
 */
export function subscribeFeed(data: { mp_name: string; faker_id?: string; biz?: string }) {
  logger.debug("API请求: 订阅公众号", data);
  return http.request<ApiResponse<any>>(
    "post",
    "/we-rss/feeds/subscribe/",
    { data }
  );
}

/**
 * 触发公众号最新文章同步抓取
 */
export function syncFeed(id: number) {
  logger.debug("API请求: 触发公众号同步", { id });
  return http.request<ApiResponse<any>>(
    "post",
    `/we-rss/feeds/${id}/sync/`
  );
}

/**
 * 清空指定源历史文章
 */
export function clearFeedArticles(id: number) {
  logger.debug("API请求: 清空公众号文章", { id });
  return http.request<ApiResponse<any>>(
    "delete",
    `/we-rss/feeds/${id}/articles/`
  );
}

/**
 * 多条件分页检索微信文章列表
 */
export function getArticles(params: WeRssQueryParams = {}) {
  logger.debug("API请求: 查询微信文章列表", params);
  return http.request<DRFPaginationResponse<WechatArticle>>(
    "get",
    "/we-rss/articles/",
    { params }
  );
}

/**
 * 获取文章正文详情
 */
export function getArticleDetail(id: number) {
  logger.debug("API请求: 获取文章详情", { id });
  return http.request<ApiResponse<WechatArticle>>(
    "get",
    `/we-rss/articles/${id}/`
  );
}

/**
 * 切换文章收藏状态
 */
export function setArticleFavorite(id: number, is_favorite: boolean) {
  logger.debug("API请求: 更新收藏状态", { id, is_favorite });
  return http.request<ApiResponse<any>>(
    "put",
    `/we-rss/articles/${id}/favorite/`,
    { data: { is_favorite } }
  );
}

/**
 * 单篇微信文章链接导入
 */
export function importArticleByUrl(url: string) {
  logger.debug("API请求: 按URL导入微信文章", { url });
  return http.request<ApiResponse<any>>(
    "post",
    "/we-rss/articles/import_by_url/",
    { data: { url } }
  );
}

/**
 * 获取后台同步任务列表
 */
export function getSyncTasks(params: Record<string, any> = {}) {
  logger.debug("API请求: 获取后台抓取任务", params);
  return http.request<DRFPaginationResponse<WechatSyncTask>>(
    "get",
    "/we-rss/tasks/",
    { params }
  );
}
