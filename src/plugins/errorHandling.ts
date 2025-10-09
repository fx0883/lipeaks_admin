/**
 * 错误处理插件
 * 为Vue应用提供全局错误处理功能
 */

import type { App } from 'vue';
import { globalErrorHandler } from '@/composables/useErrorHandling';
import logger from '@/utils/logger';

// 全局错误处理配置
export interface ErrorHandlingConfig {
  enableGlobalHandler?: boolean;
  enableUnhandledRejectionHandler?: boolean;
  enableConsoleErrorHandler?: boolean;
  reportToMonitoring?: boolean;
  monitoringEndpoint?: string;
}

const defaultConfig: ErrorHandlingConfig = {
  enableGlobalHandler: true,
  enableUnhandledRejectionHandler: true,
  enableConsoleErrorHandler: true,
  reportToMonitoring: false,
  monitoringEndpoint: '/api/v1/monitoring/frontend-errors/'
};

export function setupErrorHandling(app: App, config: Partial<ErrorHandlingConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  // 全局错误处理
  if (finalConfig.enableGlobalHandler) {
    app.config.errorHandler = (error: any, instance: any, info: string) => {
      logger.error('Vue全局错误:', { error, instance, info });

      // 处理错误
      globalErrorHandler.handleError({
        success: false,
        code: 5000,
        message: error.message || '应用程序错误',
        data: null,
        error_code: 'VUE_ERROR'
      }, { showDetails: import.meta.env.DEV });

      // 上报错误
      if (finalConfig.reportToMonitoring) {
        reportVueError(error, instance, info, finalConfig.monitoringEndpoint!);
      }
    };
  }

  // 全局未捕获的Promise拒绝处理
  if (finalConfig.enableUnhandledRejectionHandler) {
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('未处理的Promise拒绝:', event.reason);

      // 尝试从错误中提取有用信息
      const error = event.reason;
      let message = '发生了未处理的错误';

      if (error && typeof error === 'object') {
        if (error.message) {
          message = error.message;
        } else if (error.toString) {
          message = error.toString();
        }
      } else if (typeof error === 'string') {
        message = error;
      }

      // 显示错误提示
      globalErrorHandler.showError(message);

      // 上报错误
      if (finalConfig.reportToMonitoring) {
        reportUnhandledRejection(event.reason, finalConfig.monitoringEndpoint!);
      }

      // 阻止默认处理（避免在控制台显示）
      event.preventDefault();
    });
  }

  // 全局console.error拦截（可选）
  if (finalConfig.enableConsoleErrorHandler) {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      // 调用原始console.error
      originalError.apply(console, args);

      // 如果是生产环境，可以选择上报console错误
      if (!import.meta.env.DEV && finalConfig.reportToMonitoring) {
        reportConsoleError(args, finalConfig.monitoringEndpoint!);
      }
    };
  }

  logger.info('错误处理插件已初始化', finalConfig);
}

/**
 * 上报Vue错误到监控系统
 */
function reportVueError(error: Error, instance: any, info: string, endpoint: string) {
  const errorData = {
    type: 'vue_error',
    message: error.message,
    stack: error.stack,
    componentInfo: info,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    vue_version: app?.version || 'unknown'
  };

  sendErrorReport(errorData, endpoint);
}

/**
 * 上报未处理的Promise拒绝
 */
function reportUnhandledRejection(reason: any, endpoint: string) {
  const errorData = {
    type: 'unhandled_rejection',
    reason: String(reason),
    stack: reason?.stack,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  sendErrorReport(errorData, endpoint);
}

/**
 * 上报console错误
 */
function reportConsoleError(args: any[], endpoint: string) {
  const errorData = {
    type: 'console_error',
    message: args.map(arg => String(arg)).join(' '),
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  sendErrorReport(errorData, endpoint);
}

/**
 * 发送错误报告
 */
function sendErrorReport(errorData: any, endpoint: string) {
  // 防抖：避免同一个错误重复上报
  const errorKey = `${errorData.type}_${errorData.message}`;
  const lastReportTime = sessionStorage.getItem(`error_report_${errorKey}`);
  const now = Date.now();

  if (lastReportTime && (now - parseInt(lastReportTime)) < 60000) {
    return; // 1分钟内不重复上报同样的错误
  }

  sessionStorage.setItem(`error_report_${errorKey}`, String(now));

  // 异步上报，不影响用户体验
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(errorData)
  }).catch(err => {
    // 上报失败也不要影响用户，只记录到控制台
    console.warn('错误上报失败:', err);
  });
}

export default setupErrorHandling;
