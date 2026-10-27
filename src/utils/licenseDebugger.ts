/**
 * 许可证更新调试工具
 * 基于temp0930文档的调试指南实现
 */

export interface LicenseDebugger {
  enableVerboseLogging(): void;
  disableVerboseLogging(): void;
  simulateApiError(errorType: string): void;
  monitorFormState(formElement: HTMLFormElement): MutationObserver;
  validateApiResponse(response: any, expectedFields: string[]): { missing: string[], extra: string[], valid: boolean };
  analyzePerformance<T>(operationName: string, fn: (...args: any[]) => Promise<T>): (...args: any[]) => Promise<T>;
}

class LicenseDebuggerImpl implements LicenseDebugger {
  private originalFetch: typeof window.fetch;

  constructor() {
    this.originalFetch = window.fetch.bind(window);
  }

  enableVerboseLogging(): void {
    (window as any).LICENSE_DEBUG = true;
    console.log('许可证调试模式已启用');
  }

  disableVerboseLogging(): void {
    (window as any).LICENSE_DEBUG = false;
    console.log('许可证调试模式已禁用');
  }

  simulateApiError(errorType: string): void {
    window.fetch = (...args: Parameters<typeof fetch>) => {
      if (args[0].toString().includes('/licenses/admin/licenses/')) {
        switch (errorType) {
          case '400':
            return Promise.resolve({
              ok: false,
              status: 400,
              json: () => Promise.resolve({
                success: false,
                data: { customer_email: ['邮箱格式无效'] }
              })
            } as Response);
          case '401':
            return Promise.resolve({
              ok: false,
              status: 401,
              json: () => Promise.resolve({
                success: false,
                message: '认证失败'
              })
            } as Response);
          case '500':
            return Promise.resolve({
              ok: false,
              status: 500,
              json: () => Promise.resolve({
                success: false,
                message: '服务器内部错误'
              })
            } as Response);
          case 'network':
            return Promise.reject(new Error('Network error'));
        }
      }
      return this.originalFetch(...args);
    };

    console.log(`API错误模拟已启用: ${errorType}`);

    // 5秒后自动恢复
    setTimeout(() => {
      window.fetch = this.originalFetch;
      console.log('API错误模拟已禁用');
    }, 5000);
  }

  monitorFormState(formElement: HTMLFormElement): MutationObserver {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
          const target = mutation.target as HTMLInputElement;
          console.log('表单字段变化:', target.name, target.value);
        }
      });
    });

    const inputs = formElement.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      observer.observe(input, { attributes: true, attributeFilter: ['value'] });

      input.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        console.log('输入事件:', target.name, target.value);
      });
    });

    console.log('表单状态监控已启用');
    return observer;
  }

  validateApiResponse(response: any, expectedFields: string[]): { missing: string[], extra: string[], valid: boolean } {
    const missing = expectedFields.filter(field => !(field in response));
    const extra = Object.keys(response).filter(field => !expectedFields.includes(field));

    console.group('API响应验证');
    console.log('预期字段:', expectedFields);
    console.log('实际字段:', Object.keys(response));

    if (missing.length > 0) {
      console.warn('缺少字段:', missing);
    }

    if (extra.length > 0) {
      console.info('额外字段:', extra);
    }

    if (missing.length === 0) {
      console.log('✅ 响应格式正确');
    }

    console.groupEnd();

    return { missing, extra, valid: missing.length === 0 };
  }

  analyzePerformance<T>(operationName: string, fn: (...args: any[]) => Promise<T>) {
    return async (...args: any[]): Promise<T> => {
      const startTime = performance.now();
      const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

      console.time(operationName);

      try {
        const result = await fn(...args);

        const endTime = performance.now();
        const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

        console.timeEnd(operationName);
        console.group(`性能分析: ${operationName}`);
        console.log(`执行时间: ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`内存变化: ${(endMemory - startMemory)} bytes`);
        console.groupEnd();

        return result;

      } catch (error) {
        console.timeEnd(operationName);
        console.error(`操作失败: ${operationName}`, error);
        throw error;
      }
    };
  }
}

// 问题诊断工具
interface LicenseUpdateDiagnostic {
  diagnoseAuthIssues(): Promise<boolean>;
  diagnoseNetworkIssues(): Promise<void>;
  diagnoseValidationIssues(formData: Record<string, any>): boolean;
}

class LicenseUpdateDiagnosticImpl implements LicenseUpdateDiagnostic {
  async diagnoseAuthIssues(): Promise<boolean> {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    console.group('🔐 认证诊断');

    if (!token) {
      console.error('❌ 未找到认证Token');
      console.info('💡 解决方案: 重新登录获取Token');
      console.groupEnd();
      return false;
    }

    console.log('✅ Token存在');

    // 检查Token格式
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Token格式无效');
      console.info('💡 解决方案: 重新登录获取新Token');
      console.groupEnd();
      return false;
    }

    console.log('✅ Token格式正确');

    // 检查Token过期时间
    try {
      const payload = JSON.parse(atob(tokenParts[1]));
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp && payload.exp < now) {
        console.error('❌ Token已过期');
        console.info('💡 解决方案: 重新登录获取新Token');
        console.groupEnd();
        return false;
      }

      console.log('✅ Token未过期');
      console.log('Token信息:', {
        用户ID: payload.user_id,
        用户名: payload.username,
        过期时间: new Date(payload.exp * 1000).toLocaleString()
      });

    } catch (e) {
      console.warn('⚠️ 无法解析Token内容');
    }

    console.groupEnd();
    return true;
  }

  async diagnoseNetworkIssues(): Promise<void> {
    console.group('🌐 网络诊断');

    const testUrls = [
      '/api/v1/licenses/admin/licenses/',
      '/api/v1/auth/user/',
      '/api/v1/health/'
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        console.log(`✅ ${url} - 状态: ${response.status}`);
      } catch (error) {
        console.error(`❌ ${url} - 错误: ${(error as Error).message}`);
      }
    }

    console.groupEnd();
  }

  diagnoseValidationIssues(formData: Record<string, any>): boolean {
    console.group('✅ 表单验证诊断');

    const validationRules = {
      customer_name: {
        required: true,
        minLength: 1,
        maxLength: 100
      },
      customer_email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      },
      max_activations: {
        type: 'number',
        min: 1,
        max: 1000
      },
      expires_at: {
        type: 'datetime',
        futureDate: true
      }
    };

    let isValid = true;

    Object.entries(validationRules).forEach(([field, r]) => {
      const rules = r as any;
      const value = formData[field];

      console.group(`字段: ${field}`);

      if (rules.required && (!value || value.toString().trim() === '')) {
        console.error('❌ 必填字段为空');
        isValid = false;
      } else if (value) {
        if (rules.minLength && value.toString().length < rules.minLength) {
          console.error(`❌ 长度不足 (最少${rules.minLength}字符)`);
          isValid = false;
        }

        if (rules.maxLength && value.toString().length > rules.maxLength) {
          console.error(`❌ 长度超限 (最多${rules.maxLength}字符)`);
          isValid = false;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          console.error('❌ 格式不正确');
          isValid = false;
        }

        if (rules.type === 'number' && isNaN(value)) {
          console.error('❌ 不是有效数字');
          isValid = false;
        } else if (rules.type === 'number') {
          if (rules.min && value < rules.min) {
            console.error(`❌ 数值过小 (最小${rules.min})`);
            isValid = false;
          }
          if (rules.max && value > rules.max) {
            console.error(`❌ 数值过大 (最大${rules.max})`);
            isValid = false;
          }
        }

        if (rules.futureDate && new Date(value) <= new Date()) {
          console.error('❌ 日期必须是未来时间');
          isValid = false;
        }

        if (isValid) {
          console.log('✅ 验证通过');
        }
      } else {
        console.log('ℹ️ 可选字段，跳过验证');
      }

      console.groupEnd();
    });

    console.log(`总体验证结果: ${isValid ? '✅ 通过' : '❌ 失败'}`);
    console.groupEnd();

    return isValid;
  }
}

// 创建单例实例
const licenseDebugger = new LicenseDebuggerImpl();
const licenseUpdateDiagnostic = new LicenseUpdateDiagnosticImpl();

// 全局调试函数
const diagnoseLicenseUpdate = async (formData?: Record<string, any>) => {
  console.clear();
  console.log('🔍 许可证更新问题诊断开始...');

  const authOk = await licenseUpdateDiagnostic.diagnoseAuthIssues();
  await licenseUpdateDiagnostic.diagnoseNetworkIssues();

  if (formData) {
    licenseUpdateDiagnostic.diagnoseValidationIssues(formData);
  }

  console.log('✨ 诊断完成');

  if (!authOk) {
    console.info('🎯 建议: 优先解决认证问题');
  }
};

// 导出调试工具
export { licenseDebugger, licenseUpdateDiagnostic, diagnoseLicenseUpdate };

// 在开发环境下将调试工具挂载到全局对象
if (process.env.NODE_ENV === 'development') {
  (window as any).licenseDebugger = licenseDebugger;
  (window as any).diagnoseLicenseUpdate = diagnoseLicenseUpdate;
  console.log('许可证调试工具已加载，使用 window.licenseDebugger 访问');
}
