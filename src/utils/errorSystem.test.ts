/**
 * 错误处理系统测试工具
 * 提供各种错误场景的测试方法
 */

import type { StandardErrorResponse } from '@/utils/http/errorHandlers';
import { errorService } from '@/utils/errorService';

// 测试用的模拟错误数据
export const mockErrors = {
  // 认证错误
  authNotAuthenticated: {
    success: false,
    code: 4001,
    message: '认证失败，请登录',
    data: null,
    error_code: 'AUTH_NOT_AUTHENTICATED'
  } as StandardErrorResponse,

  tokenExpired: {
    success: false,
    code: 4004,
    message: 'Token已过期',
    data: null,
    error_code: 'AUTH_TOKEN_EXPIRED'
  } as StandardErrorResponse,

  // 权限错误
  permissionDenied: {
    success: false,
    code: 4003,
    message: '您没有执行该操作的权限',
    data: null,
    error_code: 'AUTH_PERMISSION_DENIED'
  } as StandardErrorResponse,

  // 验证错误
  validationError: {
    success: false,
    code: 4000,
    message: '数据验证失败',
    data: {
      username: ['该字段不能为空', '用户名长度至少3位'],
      email: ['请输入有效的邮箱地址'],
      password: ['密码长度至少8位'],
      age: ['年龄必须是正整数']
    },
    error_code: 'VALIDATION_ERROR'
  } as StandardErrorResponse,

  // 业务错误
  tenantNotFound: {
    success: false,
    code: 4101,
    message: '租户ID 123 不存在',
    data: null,
    error_code: 'TENANT_NOT_FOUND'
  } as StandardErrorResponse,

  licenseExpired: {
    success: false,
    code: 4201,
    message: '许可证已于 2024-01-15 过期',
    data: null,
    error_code: 'LICENSE_EXPIRED'
  } as StandardErrorResponse,

  quotaExceeded: {
    success: false,
    code: 4203,
    message: '您的试用许可证数量已达上限（1个）',
    data: null,
    error_code: 'LICENSE_QUOTA_EXCEEDED'
  } as StandardErrorResponse,

  pointsInsufficient: {
    success: false,
    code: 4401,
    message: '积分余额不足，当前可用: 100，需要: 500',
    data: null,
    error_code: 'POINTS_INSUFFICIENT'
  } as StandardErrorResponse,

  // 服务器错误
  internalServerError: {
    success: false,
    code: 5000,
    message: '服务器内部错误',
    data: null,
    error_code: 'INTERNAL_SERVER_ERROR'
  } as StandardErrorResponse,

  networkError: {
    success: false,
    code: 5002,
    message: '网络连接错误，请检查网络设置',
    data: null,
    error_code: 'NETWORK_ERROR'
  } as StandardErrorResponse,

  requestTimeout: {
    success: false,
    code: 5001,
    message: '请求超时，请稍后重试',
    data: null,
    error_code: 'REQUEST_TIMEOUT'
  } as StandardErrorResponse
};

/**
 * 错误处理测试套件
 */
export class ErrorHandlingTestSuite {
  /**
   * 测试认证错误处理
   */
  async testAuthenticationErrors(): Promise<void> {
    console.group('🔐 测试认证错误处理');

    try {
      console.log('测试场景：用户未登录');
      await errorService.handleApiError(mockErrors.authNotAuthenticated, { showDetails: true });

      console.log('测试场景：Token已过期');
      await errorService.handleApiError(mockErrors.tokenExpired, { showDetails: true });
    } catch (error) {
      console.error('认证错误测试失败:', error);
    }

    console.groupEnd();
  }

  /**
   * 测试权限错误处理
   */
  async testPermissionErrors(): Promise<void> {
    console.group('🚫 测试权限错误处理');

    try {
      console.log('测试场景：权限不足');
      await errorService.handleApiError(mockErrors.permissionDenied, { showModal: true });
    } catch (error) {
      console.error('权限错误测试失败:', error);
    }

    console.groupEnd();
  }

  /**
   * 测试验证错误处理
   */
  async testValidationErrors(): Promise<void> {
    console.group('📝 测试验证错误处理');

    try {
      console.log('测试场景：表单验证失败');
      const fieldErrors = await errorService.handleFormError(mockErrors.validationError);
      console.log('解析的字段错误:', fieldErrors);
    } catch (error) {
      console.error('验证错误测试失败:', error);
    }

    console.groupEnd();
  }

  /**
   * 测试业务错误处理
   */
  async testBusinessErrors(): Promise<void> {
    console.group('💼 测试业务错误处理');

    try {
      console.log('测试场景：租户不存在');
      await errorService.handleApiError(mockErrors.tenantNotFound);

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('测试场景：许可证过期');
      await errorService.handleApiError(mockErrors.licenseExpired);

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('测试场景：配额超限');
      await errorService.handleApiError(mockErrors.quotaExceeded);

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('测试场景：积分不足');
      await errorService.handleApiError(mockErrors.pointsInsufficient);
    } catch (error) {
      console.error('业务错误测试失败:', error);
    }

    console.groupEnd();
  }

  /**
   * 测试服务器错误处理
   */
  async testServerErrors(): Promise<void> {
    console.group('🖥️ 测试服务器错误处理');

    try {
      console.log('测试场景：服务器内部错误');
      await errorService.handleApiError(mockErrors.internalServerError, { showModal: true });

      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('测试场景：网络连接错误');
      await errorService.handleNetworkError(mockErrors.networkError);

      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('测试场景：请求超时');
      await errorService.handleApiError(mockErrors.requestTimeout, { showModal: true });
    } catch (error) {
      console.error('服务器错误测试失败:', error);
    }

    console.groupEnd();
  }

  /**
   * 测试Toast提示
   */
  testToastMessages(): void {
    console.group('🍞 测试Toast提示');

    setTimeout(() => errorService.showSuccess('这是成功提示'), 500);
    setTimeout(() => errorService.showWarning('这是警告提示'), 1500);
    setTimeout(() => errorService.showError('这是错误提示'), 2500);

    console.log('Toast提示测试已开始，请查看页面效果');
    console.groupEnd();
  }

  /**
   * 运行完整测试套件
   */
  async runFullTestSuite(): Promise<void> {
    console.log('🚀 开始运行错误处理系统完整测试套件...');

    try {
      // 测试Toast（不阻塞）
      this.testToastMessages();

      await new Promise(resolve => setTimeout(resolve, 4000));

      // 测试认证错误
      await this.testAuthenticationErrors();

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 测试权限错误
      await this.testPermissionErrors();

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 测试验证错误
      await this.testValidationErrors();

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 测试业务错误
      await this.testBusinessErrors();

      await new Promise(resolve => setTimeout(resolve, 2000));

      // 测试服务器错误
      await this.testServerErrors();

      console.log('✅ 错误处理系统测试套件运行完成');
    } catch (error) {
      console.error('❌ 测试套件运行失败:', error);
    }
  }

  /**
   * 快速测试（仅Toast）
   */
  quickTest(): void {
    console.log('⚡ 运行快速测试...');
    this.testToastMessages();
  }

  /**
   * 测试重试机制
   */
  async testRetryMechanism(): Promise<void> {
    console.group('🔄 测试重试机制');

    let attemptCount = 0;
    const maxAttempts = 3;

    const simulateFailingRequest = async (): Promise<string> => {
      attemptCount++;
      console.log(`模拟请求第${attemptCount}次尝试...`);

      if (attemptCount < maxAttempts) {
        throw mockErrors.networkError;
      }

      return '请求最终成功';
    };

    try {
      // 这里应该测试retryManager，但由于UI交互的复杂性，
      // 我们只在控制台模拟测试
      console.log('开始测试重试机制...');
      const result = await simulateFailingRequest();
      console.log('重试测试结果:', result);
    } catch (error) {
      console.error('重试测试失败:', error);
    }

    console.groupEnd();
  }
}

// 导出测试实例
export const errorTestSuite = new ErrorHandlingTestSuite();

// 全局测试方法（可在浏览器控制台调用）
if (import.meta.env.DEV) {
  (window as any).testErrorHandling = {
    // 快速测试
    quick: () => errorTestSuite.quickTest(),

    // 完整测试
    full: () => errorTestSuite.runFullTestSuite(),

    // 分类测试
    auth: () => errorTestSuite.testAuthenticationErrors(),
    permission: () => errorTestSuite.testPermissionErrors(),
    validation: () => errorTestSuite.testValidationErrors(),
    business: () => errorTestSuite.testBusinessErrors(),
    server: () => errorTestSuite.testServerErrors(),
    retry: () => errorTestSuite.testRetryMechanism(),

    // 单个错误测试
    showError: (type: keyof typeof mockErrors) => {
      if (mockErrors[type]) {
        errorService.handleApiError(mockErrors[type]);
      }
    },

    // 显示所有可用的错误类型
    listTypes: () => {
      console.log('可用的错误类型:', Object.keys(mockErrors));
    }
  };

  console.log(`
🎯 错误处理系统测试工具已加载！

使用方法（在浏览器控制台执行）：
• window.testErrorHandling.quick() - 快速测试
• window.testErrorHandling.full() - 完整测试
• window.testErrorHandling.auth() - 测试认证错误
• window.testErrorHandling.showError('licenseExpired') - 测试特定错误
• window.testErrorHandling.listTypes() - 显示所有错误类型

访问测试页面：/error-example
`);
}
