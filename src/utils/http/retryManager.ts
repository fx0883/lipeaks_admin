/**
 * 请求重试管理器
 * 处理可重试错误的自动重试逻辑
 */

import type { AxiosRequestConfig } from 'axios';
import { isRetryableError } from './errorCodes';
import logger from '@/utils/logger';

// 重试配置接口
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number[];
  retryableErrors: string[];
}

// 重试选项接口
export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number[];
  onRetry?: (attempt: number, error: any) => void;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

// 默认重试配置
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: [1000, 2000, 4000], // 指数退避
  retryableErrors: [
    'NETWORK_ERROR',
    'REQUEST_TIMEOUT',
    'INTERNAL_SERVER_ERROR',
    'DATABASE_ERROR',
    'EXTERNAL_SERVICE_ERROR'
  ]
};

export class RetryManager {
  private config: RetryConfig;
  private retryMap = new Map<string, number>(); // 请求URL -> 重试次数

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  /**
   * 判断错误是否应该重试
   */
  shouldRetry(error: any, attempt = 0): boolean {
    // 超过最大重试次数
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    // 检查错误类型
    if (error.error_code) {
      return isRetryableError(error.error_code);
    }

    // 检查HTTP状态码
    if (error.code >= 5000) {
      return true;
    }

    // 网络错误
    if (!error.code && error.message) {
      return error.message.includes('Network Error') ||
        error.message.includes('timeout');
    }

    return false;
  }

  /**
   * 获取重试延迟时间
   */
  getRetryDelay(attempt: number): number {
    if (attempt < this.config.retryDelay.length) {
      return this.config.retryDelay[attempt];
    }

    // 如果超出配置的延迟数组，使用指数退避
    return Math.min(Math.pow(2, attempt) * 1000, 30000); // 最大30秒
  }

  /**
   * 延迟执行
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 执行带重试的请求
   */
  async executeWithRetry<T>(
    requestFn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const maxRetries = options.maxRetries ?? this.config.maxRetries;
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`执行请求 (尝试 ${attempt + 1}/${maxRetries + 1})`);

        const result = await requestFn();

        // 成功则返回结果
        if (attempt > 0) {
          logger.info(`请求在第${attempt + 1}次尝试后成功`);
        }

        return result;
      } catch (error) {
        lastError = error;

        // 检查是否应该重试
        const shouldRetryCustom = options.shouldRetry?.(error, attempt) ??
          this.shouldRetry(error, attempt);

        if (!shouldRetryCustom) {
          logger.debug(`第${attempt + 1}次请求失败，不重试:`, error.message);
          break;
        }

        if (attempt < maxRetries) {
          // 计算延迟时间
          const delayTime = options.retryDelay?.[attempt] ??
            this.getRetryDelay(attempt);

          logger.warn(`第${attempt + 1}次请求失败，${delayTime}ms后重试:`, error.message);

          // 调用重试回调
          options.onRetry?.(attempt + 1, error);

          // 延迟后重试
          await this.delay(delayTime);
        }
      }
    }

    // 所有重试都失败了
    logger.error(`请求失败，已重试${maxRetries}次:`, lastError);
    throw lastError;
  }

  /**
   * 重置请求的重试计数
   */
  resetRetryCount(requestKey: string): void {
    this.retryMap.delete(requestKey);
  }

  /**
   * 获取请求的重试计数
   */
  getRetryCount(requestKey: string): number {
    return this.retryMap.get(requestKey) || 0;
  }

  /**
   * 增加请求的重试计数
   */
  incrementRetryCount(requestKey: string): number {
    const currentCount = this.getRetryCount(requestKey);
    const newCount = currentCount + 1;
    this.retryMap.set(requestKey, newCount);
    return newCount;
  }

  /**
   * 生成请求的唯一键
   */
  generateRequestKey(config: AxiosRequestConfig): string {
    const method = config.method?.toLowerCase() || 'get';
    const url = config.url || '';
    const params = config.params ? JSON.stringify(config.params) : '';
    const data = config.data ? JSON.stringify(config.data) : '';

    // 简单的哈希函数
    const hash = this.simpleHash(`${method}:${url}:${params}:${data}`);
    return `request_${hash}`;
  }

  /**
   * 简单的哈希函数
   */
  private simpleHash(str: string): number {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }

    return Math.abs(hash);
  }
}

// 导出默认实例
export const retryManager = new RetryManager();

/**
 * 便捷的重试函数
 */
export async function withRetry<T>(
  requestFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retryManager.executeWithRetry(requestFn, options);
}
