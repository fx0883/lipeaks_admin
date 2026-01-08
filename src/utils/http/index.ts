import Axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type CustomParamsSerializer
} from "axios";
import type {
  PureHttpError,
  RequestMethods,
  PureHttpResponse,
  PureHttpRequestConfig
} from "./types.d";
import { stringify } from "qs";
import NProgress from "../progress";
import { useUserStoreHook } from "@/store/modules/user";
import logger from "@/utils/logger";
import {
  getErrorCode,
  getUserFriendlyMessage,
  shouldClearAuth
} from "./errorCodes";
import {
  errorHandlerChain,
  type StandardErrorResponse
} from "./errorHandlers";
import { tokenManager } from "./tokenManager";

// 相关配置请参考：www.axios-js.com/zh-cn/docs/#axios-request-config-1
const defaultConfig: AxiosRequestConfig = {
  // 请求基础地址
  baseURL: import.meta.env.VITE_BASE_API || "http://43.142.76.105:8000/api/v1",
  // 请求超时时间
  timeout: 10000,
  headers: {
    Accept: "application/json, text/plain, */*",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  },
  // 数组格式参数序列化（https://github.com/axios/axios/issues/5142）
  paramsSerializer: {
    serialize: stringify as unknown as CustomParamsSerializer
  }
};

// 添加一个辅助函数来格式化错误消息，放在PureHttp类外面
/**
 * 格式化错误消息
 * @param errors - 错误对象
 * @returns 格式化后的错误消息
 */
function formatErrorMessage(errors: any): string {
  // 如果是字符串，直接返回
  if (typeof errors === "string") {
    return errors;
  }

  // 如果是空值，返回默认消息
  if (!errors) {
    return "请求失败";
  }

  // 处理数组情况
  if (Array.isArray(errors)) {
    return errors
      .map(err => {
        if (typeof err === "string") {
          return err;
        } else if (typeof err === "object" && err !== null) {
          // 处理ErrorDetail对象 - DRF特有的错误对象
          if ("string" in err) {
            return err.string;
          }
          // 处理可能的嵌套错误对象
          if (err.message) {
            return err.message;
          }
          return JSON.stringify(err);
        }
        return String(err);
      })
      .join(", ");
  }

  // 处理对象情况
  if (typeof errors === "object") {
    // 尝试直接提取non_field_errors
    if (errors.non_field_errors && Array.isArray(errors.non_field_errors)) {
      return formatErrorMessage(errors.non_field_errors);
    }

    // 尝试处理特殊情况：errors对象可能是Django格式的{'field': [ErrorDetail...]}
    const fieldErrors: string[] = [];
    let hasValidationErrors = false;

    Object.entries(errors).forEach(([field, fieldError]) => {
      if (Array.isArray(fieldError) && fieldError.length > 0) {
        hasValidationErrors = true;
        // 这里处理Django的字段错误，格式为：字段名: 错误消息
        fieldErrors.push(`${field}: ${formatErrorMessage(fieldError)}`);
      } else if (fieldError !== null && typeof fieldError === "object") {
        fieldErrors.push(`${field}: ${formatErrorMessage(fieldError)}`);
      } else if (fieldError !== undefined) {
        fieldErrors.push(`${field}: ${String(fieldError)}`);
      }
    });

    // 如果有字段错误，返回拼接后的错误消息
    if (hasValidationErrors && fieldErrors.length > 0) {
      return fieldErrors.join("; ");
    }

    // 如果有message字段，优先使用
    if (errors.message) {
      return errors.message;
    }

    // 如果有detail字段，使用它
    if (errors.detail) {
      return errors.detail;
    }

    // 尝试提取第一个字段错误（兜底处理）
    if (fieldErrors.length > 0) {
      return fieldErrors[0];
    }
  }

  // 默认情况，转为字符串
  return String(errors);
}

class PureHttp {
  constructor() {
    this.httpInterceptorsRequest();
    this.httpInterceptorsResponse();
  }

  /** 是否正在刷新Token */
  private static isRefreshing = false;

  /** 等待Token刷新的请求队列 */
  private static pendingRequests: Array<() => Promise<void>> = [];

  /** 初始化配置对象 */
  private static initConfig: PureHttpRequestConfig = {};

  /** 保存当前`Axios`实例对象 */
  private static axiosInstance: AxiosInstance = Axios.create(defaultConfig);

  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.pendingRequests.push(() => {
        // 获取新token
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }
        resolve(config);
        return Promise.resolve();
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 开启进度条动画
        NProgress.start();
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }

        // 添加CSRF Token
        const csrfToken = document.cookie.match(/csrftoken=([^;]*)/)?.[1];
        if (csrfToken) {
          config.headers["X-CSRFTOKEN"] = csrfToken;
        }

        /** 请求白名单，放置一些不需要`token`的接口 */
        const whiteList = ["/auth/login/"];
        if (whiteList.some(url => config.url.endsWith(url))) {
          // 记录请求日志
          logger.logRequest(config);
          return config;
        }

        // 使用TokenManager获取token
        const token = tokenManager.getAccessToken();
        if (token) {
          config.headers["Authorization"] = `Bearer ${token}`;
        }

        // 记录请求日志
        logger.logRequest(config);

        // 特别记录撤销超级管理员的请求
        if (config.url && config.url.includes("revoke-super-admin")) {
          logger.info("发送撤销超级管理员请求:", {
            url: config.url,
            method: config.method,
            data: config.data,
            headers: config.headers
          });
        }

        return config;
      },
      error => {
        // 记录错误日志
        logger.error("请求拦截器错误", error);
        return Promise.reject(error);
      }
    );
  }

  /** 响应拦截 */
  private httpInterceptorsResponse(): void {
    const instance = PureHttp.axiosInstance;
    instance.interceptors.response.use(
      (response: PureHttpResponse) => {
        const $config = response.config;
        // 关闭进度条动画
        NProgress.done();
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof $config.beforeResponseCallback === "function") {
          $config.beforeResponseCallback(response);
          // 记录响应日志
          logger.logResponse(response);

          // 特别记录撤销超级管理员的响应
          if (
            response.config.url &&
            response.config.url.includes("revoke-super-admin")
          ) {
            logger.info("收到撤销超级管理员响应:", {
              url: response.config.url,
              status: response.status,
              data: response.data
            });
          }

          return response.data;
        }
        if (PureHttp.initConfig.beforeResponseCallback) {
          PureHttp.initConfig.beforeResponseCallback(response);
          // 记录响应日志
          logger.logResponse(response);

          // 特别记录撤销超级管理员的响应
          if (
            response.config.url &&
            response.config.url.includes("revoke-super-admin")
          ) {
            logger.info("收到撤销超级管理员响应:", {
              url: response.config.url,
              status: response.status,
              data: response.data
            });
          }

          return response.data;
        }

        // 统一处理API响应格式
        const res = response.data;

        // 如果是Blob类型的响应，直接返回原始响应
        if (response.config.responseType === "blob") {
          // 为Blob响应添加headers属性，以便后续处理可以访问到headers
          const blobWithHeaders = response.data;
          blobWithHeaders.headers = response.headers;
          return blobWithHeaders;
        }

        // 已经符合标准格式的响应直接返回
        if (
          res.success !== undefined &&
          res.code !== undefined &&
          res.message !== undefined
        ) {
          // 记录响应日志
          logger.logResponse(response);

          // 特别记录撤销超级管理员的响应
          if (
            response.config.url &&
            response.config.url.includes("revoke-super-admin")
          ) {
            logger.info("收到撤销超级管理员响应:", {
              url: response.config.url,
              status: response.status,
              data: response.data
            });
          }

          return res;
        }

        // 处理不符合标准格式的响应，将其转换为标准格式
        const standardResponse = {
          success: true,
          code: 2000,
          message: "操作成功",
          data: res
        };

        // 记录响应日志
        logger.logResponse({ ...response, data: standardResponse });

        return standardResponse;
      },
      async (error: PureHttpError) => {
        const $error = error;
        $error.isCancelRequest = Axios.isCancel($error);
        // 关闭进度条动画
        NProgress.done();

        // 特别记录撤销超级管理员的错误
        if (
          error.config?.url &&
          error.config.url.includes("revoke-super-admin")
        ) {
          logger.error("撤销超级管理员请求错误:", {
            url: error.config.url,
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
        }

        // 添加更多的调试日志，以便更好地理解错误响应结构
        if (error.response) {
          logger.debug("API错误响应:", {
            status: error.response.status,
            data: error.response.data,
            url: error.config?.url
          });
        }

        // 创建统一的标准错误响应格式
        let errorResponse: StandardErrorResponse = {
          success: false,
          code: 5000, // 默认服务器错误
          message: "服务器内部错误",
          data: null,
          error_code: "INTERNAL_SERVER_ERROR"
        };

        if (error.response) {
          const { status, config: errorConfig } = error.response;

          // 处理401未授权（Token过期）
          if (status === 401) {
            // 防止重复刷新
            if (!PureHttp.isRefreshing) {
              PureHttp.isRefreshing = true;

              try {
                // 使用TokenManager刷新Token
                const newToken = await tokenManager.refreshToken();
                if (newToken) {
                  // Token刷新成功，重试原请求
                  const newConfig = {
                    ...errorConfig,
                    headers: {
                      ...errorConfig.headers,
                      'Authorization': `Bearer ${newToken}`
                    }
                  };
                  return await PureHttp.axiosInstance(newConfig);
                } else {
                  // Token刷新失败
                  errorResponse = {
                    success: false,
                    code: 4001,
                    message: "登录已过期，请重新登录",
                    data: null,
                    error_code: "AUTH_TOKEN_EXPIRED"
                  };
                }
              } catch (refreshError) {
                // 刷新Token出错
                logger.error("刷新Token失败", refreshError);
                errorResponse = {
                  success: false,
                  code: 4001,
                  message: "登录已过期，请重新登录",
                  data: null,
                  error_code: "AUTH_TOKEN_EXPIRED"
                };
              } finally {
                PureHttp.isRefreshing = false;
              }
            } else {
              // 已经在刷新Token，等待刷新完成
              try {
                const newToken = await tokenManager.waitForTokenRefresh();
                const newConfig = {
                  ...errorConfig,
                  headers: {
                    ...errorConfig.headers,
                    'Authorization': `Bearer ${newToken}`
                  }
                };
                return await PureHttp.axiosInstance(newConfig);
              } catch (waitError) {
                logger.error('等待Token刷新失败:', waitError);
                errorResponse = {
                  success: false,
                  code: 4001,
                  message: "登录已过期，请重新登录",
                  data: null,
                  error_code: "AUTH_TOKEN_EXPIRED"
                };
              }
            }
          } else if (status === 403) {
            const errorCode = getErrorCode(4003);
            errorResponse = {
              success: false,
              code: 4003,
              message: getUserFriendlyMessage(errorCode, "没有权限执行此操作"),
              data: error.response.data,
              error_code: errorCode
            };
          } else if (status === 404) {
            const errorCode = getErrorCode(4004) || "RESOURCE_NOT_FOUND";
            errorResponse = {
              success: false,
              code: 4004,
              message: "请求的资源不存在",
              data: null,
              error_code: errorCode
            };
          } else if (status === 400) {
            // 处理表单验证错误
            const data = error.response.data as Record<string, any>;
            let errorMsg = "请求参数错误";
            let errorDetails = null;

            if (data && typeof data === "object") {
              logger.debug("处理400错误响应数据:", data);

              // 保存原始错误详情
              errorDetails = data.errors || data;

              // 尝试从errors字段提取结构化错误信息
              if (data.errors && typeof data.errors === "object") {
                // 使用格式化函数处理errors对象
                errorMsg = formatErrorMessage(data.errors);
                logger.debug("从errors字段提取错误消息:", errorMsg);
              }
              // 处理message字段可能是JSON字符串的情况
              else if (data.message && typeof data.message === "string") {
                try {
                  // 尝试解析可能是JSON字符串的message
                  let parsedMessage;
                  // 处理Python字典字符串转JSON的情况（单引号替换为双引号）
                  if (
                    data.message.includes("'") &&
                    !data.message.includes('"')
                  ) {
                    const preparedMessage = data.message
                      .replace(/'/g, '"') // 替换单引号为双引号
                      .replace(/\bTrue\b/g, "true") // 替换Python的True为JSON的true
                      .replace(/\bFalse\b/g, "false") // 替换Python的False为JSON的false
                      .replace(/\bNone\b/g, "null"); // 替换Python的None为JSON的null

                    parsedMessage = JSON.parse(preparedMessage);
                  } else {
                    parsedMessage = JSON.parse(data.message);
                  }

                  if (parsedMessage && typeof parsedMessage === "object") {
                    // 将解析后的对象用于错误消息格式化
                    errorMsg = formatErrorMessage(parsedMessage);
                    // 同时更新errorDetails
                    errorDetails = parsedMessage;
                    logger.debug("从JSON字符串解析的错误消息:", errorMsg);
                  } else {
                    errorMsg = data.message;
                  }
                } catch (parseError) {
                  // 如果解析失败，使用原始消息
                  logger.debug(
                    "无法解析message字段为JSON:",
                    data.message,
                    parseError
                  );
                  errorMsg = data.message;
                }
              }
              // 直接处理DRF风格的错误响应
              else if (Object.keys(data).length > 0) {
                // 使用格式化函数处理整个data对象
                errorMsg = formatErrorMessage(data);
                logger.debug("从整个响应对象提取错误消息:", errorMsg);
              }
              // 如果有message字段，使用它
              else if (data.message) {
                errorMsg = data.message;
              }
            }

            errorResponse = {
              success: false,
              code: 4000,
              message: errorMsg,
              data: errorDetails, // 验证错误时，data字段包含字段错误信息
              error_code: "VALIDATION_ERROR"
            };
          } else if (status >= 500) {
            const errorCode = getErrorCode(5000);
            errorResponse = {
              success: false,
              code: 5000,
              message: getUserFriendlyMessage(errorCode, "服务器内部错误"),
              data: null,
              error_code: errorCode
            };
          }
        } else if (error.message && error.message.includes("timeout")) {
          const errorCode = getErrorCode(5001);
          errorResponse = {
            success: false,
            code: 5001,
            message: getUserFriendlyMessage(errorCode, "请求超时，请稍后重试"),
            data: null,
            error_code: errorCode
          };
        } else if (error.message && error.message.includes("Network Error")) {
          const errorCode = getErrorCode(5002);
          errorResponse = {
            success: false,
            code: 5002,
            message: getUserFriendlyMessage(errorCode, "网络连接错误，请检查网络设置"),
            data: null,
            error_code: errorCode
          };
        }

        // 记录错误日志
        logger.logError(error);

        // 使用错误处理器链处理错误
        try {
          const handleResult = await errorHandlerChain.handle(errorResponse);

          // 如果需要重试，在一定延迟后重试
          if (handleResult.shouldRetry && handleResult.retryAfter) {
            await new Promise(resolve => setTimeout(resolve, handleResult.retryAfter!));
            return this.retryRequest(error.config);
          }
        } catch (handlerError) {
          logger.error('错误处理器执行失败:', handlerError);
        }

        return Promise.reject(errorResponse);
      }
    );
  }

  // 移除旧的refreshToken方法，使用TokenManager

  // 移除旧的retryRequest方法，直接在拦截器中处理

  // 移除旧的logout方法，由TokenManager和错误处理器处理

  /**
   * 通用请求工具函数
   * @param method - 请求方法
   * @param url - 请求地址
   * @param param - 请求参数
   * @param axiosConfig - axios配置
   */
  public request<T>(
    method: RequestMethods,
    url: string,
    param?: AxiosRequestConfig,
    axiosConfig?: PureHttpRequestConfig
  ): Promise<T> {
    const config = {
      method,
      url,
      ...param,
      ...axiosConfig
    } as PureHttpRequestConfig;

    // 单独处理自定义请求/响应回调
    return new Promise((resolve, reject) => {
      PureHttp.axiosInstance
        .request(config)
        .then(response => {
          resolve(response as T);
        })
        .catch(error => {
          reject(error);
        });
    });
  }

  /**
   * POST请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public post<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("post", url, params, config);
  }

  /**
   * GET请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public get<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("get", url, params, config);
  }

  /**
   * PUT请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public put<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("put", url, params, config);
  }

  /**
   * PATCH请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public patch<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("patch", url, params, config);
  }

  /**
   * DELETE请求
   * @param url - 请求地址
   * @param params - 请求参数
   * @param config - axios配置
   */
  public delete<T, P>(
    url: string,
    params?: AxiosRequestConfig<P>,
    config?: PureHttpRequestConfig
  ): Promise<T> {
    return this.request<T>("delete", url, params, config);
  }
}

export const http = new PureHttp();
