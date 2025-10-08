/**
 * 错误处理器
 * 实现不同类型错误的处理策略
 */

import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getErrorCode,
  getUserFriendlyMessage,
  getErrorSeverity,
  getActionGuidance,
  shouldClearAuth,
  isRetryableError
} from "./errorCodes";
import logger from "@/utils/logger";

// 标准错误响应接口
export interface StandardErrorResponse {
  success: false;
  code: number;
  message: string;
  data: any;
  error_code: string;
}

// 错误处理结果接口
export interface ErrorHandleResult {
  handled: boolean;
  shouldRetry?: boolean;
  retryAfter?: number; // 重试延迟时间(ms)
}

/**
 * 错误分类器
 */
export class ErrorClassifier {
  /**
   * 根据错误码分类错误
   */
  static classify(errorResponse: StandardErrorResponse): string {
    const { code, error_code } = errorResponse;

    // 优先使用 error_code
    if (error_code && error_code !== 'UNKNOWN_ERROR') {
      return error_code;
    }

    // 根据错误码范围分类
    if (code >= 4001 && code <= 4004) {
      return 'authentication';
    } else if (code === 4003 || code === 4303) {
      return 'permission';
    } else if (code === 4000) {
      return 'validation';
    } else if (code >= 4100 && code < 4200) {
      return 'tenant';
    } else if (code >= 4200 && code < 4300) {
      return 'license';
    } else if (code >= 4300 && code < 4400) {
      return 'user';
    } else if (code >= 4400 && code < 4500) {
      return 'points';
    } else if (code >= 4500 && code < 4600) {
      return 'cms';
    } else if (code >= 5000) {
      return 'server';
    } else {
      return 'business';
    }
  }
}

/**
 * 基础错误处理器
 */
abstract class BaseErrorHandler {
  abstract canHandle(errorType: string): boolean;
  abstract handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult>;

  protected logError(errorResponse: StandardErrorResponse, context?: string): void {
    logger.error(`${context || '错误处理'}:`, {
      code: errorResponse.code,
      error_code: errorResponse.error_code,
      message: errorResponse.message,
      data: errorResponse.data
    });
  }
}

/**
 * 认证错误处理器
 */
export class AuthenticationErrorHandler extends BaseErrorHandler {
  canHandle(errorType: string): boolean {
    return errorType === 'authentication' ||
      shouldClearAuth(errorType);
  }

  async handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult> {
    this.logError(errorResponse, '认证错误');

    const { error_code } = errorResponse;

    // 清除认证信息
    this.clearAuthInfo();

    // 显示提示消息
    const userMessage = getUserFriendlyMessage(error_code, errorResponse.message);
    ElMessage.warning(userMessage);

    // 延迟跳转到登录页，让用户看到提示
    setTimeout(() => {
      this.redirectToLogin();
    }, 1500);

    return { handled: true, shouldRetry: false };
  }

  private clearAuthInfo(): void {
    // 清除本地存储
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // 保存当前页面路径用于登录后跳转
    const currentPath = window.location.pathname + window.location.search;
    if (currentPath !== '/login') {
      sessionStorage.setItem('returnUrl', currentPath);
    }

    // 使用store的登出方法
    try {
      useUserStoreHook().logOut();
    } catch (error) {
      logger.error('调用store登出方法失败:', error);
    }
  }

  private redirectToLogin(): void {
    window.location.href = "/login";
  }
}

/**
 * 权限错误处理器
 */
export class PermissionErrorHandler extends BaseErrorHandler {
  canHandle(errorType: string): boolean {
    return errorType === 'permission' ||
      errorType === 'AUTH_PERMISSION_DENIED' ||
      errorType === 'USER_PERMISSION_DENIED';
  }

  async handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult> {
    this.logError(errorResponse, '权限错误');

    const { error_code } = errorResponse;
    const userMessage = getUserFriendlyMessage(error_code, errorResponse.message);
    const guidance = getActionGuidance(error_code);

    // 显示权限错误对话框
    try {
      await ElMessageBox.alert(userMessage, '权限不足', {
        confirmButtonText: guidance?.action || '我知道了',
        type: 'warning'
      });

      // 如果有指引路由，跳转
      if (guidance?.route) {
        window.location.href = guidance.route;
      }
    } catch (error) {
      // 用户关闭对话框
      logger.debug('用户关闭权限错误对话框');
    }

    return { handled: true, shouldRetry: false };
  }
}

/**
 * 验证错误处理器
 */
export class ValidationErrorHandler extends BaseErrorHandler {
  canHandle(errorType: string): boolean {
    return errorType === 'validation' || errorType === 'VALIDATION_ERROR';
  }

  async handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult> {
    this.logError(errorResponse, '验证错误');

    // 验证错误通常需要组件级处理，这里只显示通用提示
    ElMessage.error('请检查表单输入');

    // 验证错误不会在这里完全处理，需要组件级处理字段错误
    return { handled: false, shouldRetry: false };
  }
}

/**
 * 业务错误处理器
 */
export class BusinessErrorHandler extends BaseErrorHandler {
  canHandle(errorType: string): boolean {
    return ['tenant', 'license', 'user', 'points', 'cms', 'business'].includes(errorType) ||
      this.isBusinessErrorCode(errorType);
  }

  private isBusinessErrorCode(errorType: string): boolean {
    // 检查是否是业务错误码
    return errorType.startsWith('TENANT_') ||
      errorType.startsWith('LICENSE_') ||
      errorType.startsWith('USER_') ||
      errorType.startsWith('POINTS_') ||
      errorType.startsWith('CONTENT_');
  }

  async handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult> {
    this.logError(errorResponse, '业务错误');

    const { error_code } = errorResponse;
    const userMessage = getUserFriendlyMessage(error_code, errorResponse.message);
    const guidance = getActionGuidance(error_code);
    const severity = getErrorSeverity(error_code);

    // 根据严重程度和指引决定显示方式
    if (guidance && (severity === 'medium' || severity === 'high')) {
      // 显示对话框带操作按钮
      try {
        await ElMessageBox.confirm(
          userMessage,
          this.getDialogTitle(error_code),
          {
            confirmButtonText: guidance.action || '确定',
            cancelButtonText: '取消',
            type: this.getDialogType(severity)
          }
        );

        // 执行指引操作
        if (guidance.route) {
          window.location.href = guidance.route;
        }
      } catch (error) {
        // 用户取消
        logger.debug('用户取消业务错误操作');
      }
    } else {
      // 显示简单提示
      const messageType = severity === 'high' ? 'error' : 'warning';
      ElMessage({
        type: messageType,
        message: userMessage,
        duration: this.getMessageDuration(severity)
      });
    }

    return { handled: true, shouldRetry: false };
  }

  private getDialogTitle(errorCode: string): string {
    if (errorCode.includes('QUOTA')) return '配额已满';
    if (errorCode.includes('EXPIRED')) return '已过期';
    if (errorCode.includes('NOT_FOUND')) return '资源不存在';
    if (errorCode.includes('INSUFFICIENT')) return '余额不足';
    return '操作提示';
  }

  private getDialogType(severity: string): 'success' | 'warning' | 'error' | 'info' {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      default: return 'info';
    }
  }

  private getMessageDuration(severity: string): number {
    switch (severity) {
      case 'high': return 5000;
      case 'medium': return 4000;
      default: return 3000;
    }
  }
}

/**
 * 服务器错误处理器
 */
export class ServerErrorHandler extends BaseErrorHandler {
  canHandle(errorType: string): boolean {
    return errorType === 'server' ||
      isRetryableError(errorType);
  }

  async handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult> {
    this.logError(errorResponse, '服务器错误');

    const { error_code } = errorResponse;
    const userMessage = getUserFriendlyMessage(error_code, errorResponse.message);
    const canRetry = isRetryableError(error_code);

    if (canRetry) {
      // 显示可重试的错误
      try {
        await ElMessageBox.confirm(
          userMessage,
          '服务器错误',
          {
            confirmButtonText: '重试',
            cancelButtonText: '取消',
            type: 'error'
          }
        );

        return { handled: true, shouldRetry: true, retryAfter: 1000 };
      } catch (error) {
        // 用户取消重试
        return { handled: true, shouldRetry: false };
      }
    } else {
      // 显示不可重试的错误
      ElMessage.error(userMessage);
      return { handled: true, shouldRetry: false };
    }
  }
}

/**
 * 网络错误处理器
 */
export class NetworkErrorHandler extends BaseErrorHandler {
  canHandle(errorType: string): boolean {
    return errorType === 'NETWORK_ERROR' || errorType === 'REQUEST_TIMEOUT';
  }

  async handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult> {
    this.logError(errorResponse, '网络错误');

    const { error_code } = errorResponse;
    const userMessage = getUserFriendlyMessage(error_code, errorResponse.message);

    // 显示网络错误提示
    ElNotification({
      title: '网络连接失败',
      message: userMessage,
      type: 'error',
      duration: 0, // 不自动关闭
      showClose: true
    });

    return { handled: true, shouldRetry: true, retryAfter: 2000 };
  }
}

/**
 * 错误处理器链
 */
export class ErrorHandlerChain {
  private handlers: BaseErrorHandler[] = [];

  constructor() {
    // 按优先级注册处理器
    this.handlers = [
      new AuthenticationErrorHandler(),
      new PermissionErrorHandler(),
      new ValidationErrorHandler(),
      new NetworkErrorHandler(),
      new ServerErrorHandler(),
      new BusinessErrorHandler() // 放在最后作为兜底
    ];
  }

  /**
   * 处理错误
   */
  async handle(errorResponse: StandardErrorResponse): Promise<ErrorHandleResult> {
    const errorType = ErrorClassifier.classify(errorResponse);

    logger.debug('错误分类结果:', {
      errorType,
      code: errorResponse.code,
      error_code: errorResponse.error_code
    });

    // 找到能处理该错误的处理器
    for (const handler of this.handlers) {
      if (handler.canHandle(errorType)) {
        logger.debug(`使用处理器: ${handler.constructor.name}`);
        return await handler.handle(errorResponse);
      }
    }

    // 没有找到合适的处理器，使用默认处理
    logger.warn('没有找到合适的错误处理器，使用默认处理');
    ElMessage.error(errorResponse.message || '操作失败');

    return { handled: true, shouldRetry: false };
  }
}

// 导出单例
export const errorHandlerChain = new ErrorHandlerChain();
