/**
 * 统一错误处理服务
 * 整合所有错误处理功能的高级接口
 */

import { type StandardErrorResponse } from '@/utils/http/errorHandlers';
import {
  showErrorToast,
  showWarningToast,
  showErrorToastMessage,
  showSuccessToast,
  showConfirmModal,
  showWarningModal,
  showErrorDetailModal
} from '@/components/ErrorHandling';
import {
  getErrorSeverity,
  getUserFriendlyMessage,
  getActionGuidance
} from '@/utils/http/errorCodes';
import { parseValidationErrors } from '@/utils/validation';
import logger from '@/utils/logger';

// 错误处理选项
export interface ErrorHandleOptions {
  showToast?: boolean;
  showModal?: boolean;
  showDetails?: boolean;
  customMessage?: string;
  onAction?: () => void | Promise<void>;
}

// 表单错误处理选项
export interface FormErrorOptions extends ErrorHandleOptions {
  formRef?: any; // 表单引用
  scrollToError?: boolean;
  shakeDuration?: number;
}

export class ErrorService {
  private static instance: ErrorService;

  static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * 处理API错误响应
   */
  async handleApiError(
    error: StandardErrorResponse | any,
    options: ErrorHandleOptions = {}
  ): Promise<void> {
    // 标准化错误对象
    const standardError = this.normalizeError(error);

    logger.debug('错误服务处理API错误:', standardError);

    const { error_code, message } = standardError;
    const severity = getErrorSeverity(error_code);
    const userMessage = options.customMessage ||
      getUserFriendlyMessage(error_code, message);
    const guidance = getActionGuidance(error_code);

    // 根据严重程度和选项决定提示方式
    if (options.showModal || severity === 'high' || severity === 'critical') {
      // 显示Modal对话框
      await this.showErrorModal(standardError, userMessage, guidance, options);
    } else if (options.showToast !== false) {
      // 显示Toast提示
      this.showErrorToast(standardError, userMessage, guidance, options);
    }
  }

  /**
   * 处理表单验证错误
   */
  async handleFormError(
    error: StandardErrorResponse | any,
    options: FormErrorOptions = {}
  ): Promise<Record<string, string[]>> {
    const standardError = this.normalizeError(error);

    logger.debug('错误服务处理表单错误:', standardError);

    // 如果是验证错误，解析字段错误
    if (standardError.error_code === 'VALIDATION_ERROR' && standardError.data) {
      const fieldErrors = parseValidationErrors(standardError.data);

      // 滚动到第一个错误字段
      if (options.scrollToError !== false) {
        this.scrollToFirstError(fieldErrors, options.formRef);
      }

      // 显示全局提示
      if (options.showToast !== false) {
        const errorCount = Object.keys(fieldErrors).length;
        showWarningToast(`请检查${errorCount}个字段的输入`, 3000);
      }

      return fieldErrors;
    } else {
      // 非验证错误，按普通错误处理
      await this.handleApiError(standardError, options);
      return {};
    }
  }

  /**
   * 处理网络错误
   */
  async handleNetworkError(error: any, options: ErrorHandleOptions = {}): Promise<void> {
    logger.error('网络错误:', error);

    const networkError: StandardErrorResponse = {
      success: false,
      code: 5002,
      message: '网络连接失败，请检查您的网络设置',
      data: null,
      error_code: 'NETWORK_ERROR'
    };

    await this.handleApiError(networkError, {
      ...options,
      showModal: true // 网络错误通常显示Modal
    });
  }

  /**
   * 显示成功提示
   */
  showSuccess(message: string, duration = 3000): void {
    showSuccessToast(message, duration);
  }

  /**
   * 显示警告提示
   */
  showWarning(message: string, duration = 4000): void {
    showWarningToast(message, duration);
  }

  /**
   * 显示错误提示
   */
  showError(message: string, duration = 5000): void {
    showErrorToastMessage(message, duration);
  }

  /**
   * 显示确认对话框
   */
  async confirm(options: {
    message: string;
    title?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'error' | 'warning' | 'info';
  }): Promise<boolean> {
    try {
      await showConfirmModal(options);
      return true;
    } catch (error) {
      return false; // 用户取消
    }
  }

  /**
   * 标准化错误对象
   */
  private normalizeError(error: any): StandardErrorResponse {
    // 如果已经是标准格式
    if (error && typeof error === 'object' &&
      'success' in error && 'code' in error && 'error_code' in error) {
      return error as StandardErrorResponse;
    }

    // 如果是Axios错误
    if (error.response?.data) {
      const responseData = error.response.data;

      // 如果响应数据是标准格式
      if (responseData.success === false && responseData.code && responseData.error_code) {
        return responseData as StandardErrorResponse;
      }

      // 转换为标准格式
      return {
        success: false,
        code: responseData.code || 5000,
        message: responseData.message || error.message || '操作失败',
        data: responseData.data || null,
        error_code: responseData.error_code || 'UNKNOWN_ERROR'
      };
    }

    // 如果是字符串错误
    if (typeof error === 'string') {
      return {
        success: false,
        code: 5000,
        message: error,
        data: null,
        error_code: 'UNKNOWN_ERROR'
      };
    }

    // 默认错误格式
    return {
      success: false,
      code: 5000,
      message: error?.message || '未知错误',
      data: null,
      error_code: 'UNKNOWN_ERROR'
    };
  }

  /**
   * 显示错误Toast
   */
  private showErrorToast(
    error: StandardErrorResponse,
    userMessage: string,
    guidance: any,
    options: ErrorHandleOptions
  ): void {
    const severity = getErrorSeverity(error.error_code);
    const duration = this.getToastDuration(severity);

    if (guidance?.action && options.onAction) {
      // 带操作的Toast
      showErrorToast({
        message: userMessage,
        type: severity === 'critical' ? 'error' : 'warning',
        duration: 0, // 带操作的不自动关闭
        showClose: true,
        action: guidance.action,
        onAction: options.onAction
      });
    } else {
      // 普通Toast
      const toastType = severity === 'critical' || severity === 'high' ? 'error' : 'warning';
      showErrorToast({
        message: userMessage,
        type: toastType,
        duration
      });
    }
  }

  /**
   * 显示错误Modal
   */
  private async showErrorModal(
    error: StandardErrorResponse,
    userMessage: string,
    guidance: any,
    options: ErrorHandleOptions
  ): Promise<void> {
    const title = this.getModalTitle(error.error_code);
    const suggestions = this.getErrorSuggestions(error.error_code);

    if (guidance?.action) {
      // 带操作指引的Modal
      await showWarningModal({
        message: userMessage,
        title,
        actionText: guidance.action,
        guidance: suggestions,
        onAction: async () => {
          if (guidance.route) {
            window.location.href = guidance.route;
          }
          await options.onAction?.();
        }
      });
    } else {
      // 普通错误详情Modal
      await showErrorDetailModal({
        message: userMessage,
        details: options.showDetails ? JSON.stringify(error, null, 2) : undefined,
        guidance: suggestions,
        onAction: options.onAction
      });
    }
  }

  /**
   * 获取Toast显示时长
   */
  private getToastDuration(severity: string): number {
    switch (severity) {
      case 'low': return 2000;
      case 'medium': return 3000;
      case 'high': return 4000;
      case 'critical': return 5000;
      default: return 3000;
    }
  }

  /**
   * 获取Modal标题
   */
  private getModalTitle(errorCode: string): string {
    if (errorCode.includes('EXPIRED')) return '已过期';
    if (errorCode.includes('QUOTA')) return '配额已满';
    if (errorCode.includes('PERMISSION')) return '权限不足';
    if (errorCode.includes('NOT_FOUND')) return '资源不存在';
    if (errorCode.includes('NETWORK')) return '网络错误';
    if (errorCode.includes('SERVER')) return '服务器错误';
    return '操作失败';
  }

  /**
   * 获取错误建议
   */
  private getErrorSuggestions(errorCode: string): string[] {
    const suggestions: Record<string, string[]> = {
      'LICENSE_EXPIRED': [
        '立即续费可继续使用',
        '查看续费优惠活动',
        '联系客服了解续费政策'
      ],
      'LICENSE_QUOTA_EXCEEDED': [
        '升级到更高配额的套餐',
        '释放不使用的许可证',
        '联系销售了解企业套餐'
      ],
      'AUTH_PERMISSION_DENIED': [
        '联系管理员申请权限',
        '切换到有权限的账户',
        '查看权限说明文档'
      ],
      'NETWORK_ERROR': [
        '检查网络连接是否正常',
        '尝试刷新页面',
        '检查防火墙设置',
        '联系网络管理员'
      ],
      'INTERNAL_SERVER_ERROR': [
        '稍后重新尝试',
        '清除浏览器缓存',
        '联系技术支持'
      ]
    };

    return suggestions[errorCode] || [
      '请稍后重试',
      '如问题持续，请联系客服'
    ];
  }

  /**
   * 滚动到第一个错误字段
   */
  private scrollToFirstError(
    fieldErrors: Record<string, string[]>,
    formRef?: any
  ): void {
    const firstErrorField = Object.keys(fieldErrors)[0];
    if (!firstErrorField) return;

    try {
      // 尝试通过表单引用滚动
      if (formRef && formRef.scrollToField) {
        formRef.scrollToField(firstErrorField);
        return;
      }

      // 通过DOM查找并滚动到错误字段
      const errorElement = document.querySelector(
        `[data-field="${firstErrorField}"], .el-form-item.is-error, .field-error`
      ) as HTMLElement;

      if (errorElement) {
        errorElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });

        // 短暂高亮错误字段
        errorElement.classList.add('error-highlight');
        setTimeout(() => {
          errorElement.classList.remove('error-highlight');
        }, 2000);
      }
    } catch (error) {
      logger.warn('滚动到错误字段失败:', error);
    }
  }
}

// 导出单例实例
export const errorService = ErrorService.getInstance();

// 便捷方法导出
export const {
  handleApiError,
  handleFormError,
  handleNetworkError,
  showSuccess,
  showWarning,
  showError,
  confirm
} = errorService;
