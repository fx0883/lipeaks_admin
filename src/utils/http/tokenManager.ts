/**
 * Token管理器
 * 处理Token的存储、刷新和并发请求队列
 */

import Axios from 'axios';
import logger from '@/utils/logger';
import { useUserStoreHook } from '@/store/modules/user';

// 刷新Token响应接口
interface RefreshTokenResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    token: string;
    refresh_token: string;
  };
}

// 等待队列中的请求项
interface PendingRequest {
  resolve: (token: string) => void;
  reject: (error: any) => void;
}

export class TokenManager {
  private static instance: TokenManager;
  private isRefreshing = false;
  private pendingRequests: PendingRequest[] = [];
  private refreshPromise: Promise<string | null> | null = null;

  // 单例模式
  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * 获取访问Token
   */
  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * 获取刷新Token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  /**
   * 保存Token
   */
  saveTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem('access_token', accessToken);

    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    logger.debug('Token已保存');
  }

  /**
   * 清除所有Token
   */
  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // 清除用户信息
    try {
      useUserStoreHook().logOut();
    } catch (error) {
      logger.error('清除用户信息失败:', error);
    }

    logger.info('所有Token已清除');
  }

  /**
   * 检查Token是否存在
   */
  hasValidToken(): boolean {
    const token = this.getAccessToken();
    return Boolean(token);
  }

  /**
   * 刷新Token（支持并发请求队列）
   */
  async refreshToken(): Promise<string | null> {
    // 如果正在刷新，返回现有的Promise
    if (this.isRefreshing && this.refreshPromise) {
      logger.debug('Token正在刷新中，等待完成...');
      return this.refreshPromise;
    }

    this.isRefreshing = true;

    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;

      // 处理等待队列中的请求
      if (newToken) {
        // 成功刷新，通知所有等待的请求
        this.pendingRequests.forEach(({ resolve }) => {
          resolve(newToken);
        });
        logger.debug(`处理了${this.pendingRequests.length}个等待的请求`);
      } else {
        // 刷新失败，拒绝所有等待的请求
        const error = new Error('Token刷新失败');
        this.pendingRequests.forEach(({ reject }) => {
          reject(error);
        });
      }

      // 清空等待队列
      this.pendingRequests = [];

      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  /**
   * 执行实际的Token刷新
   */
  private async performTokenRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      logger.warn('没有refresh token，无法刷新');
      this.clearTokens();
      return null;
    }

    try {
      logger.debug('开始刷新Token...');

      const response = await Axios.post<RefreshTokenResponse>(
        `${import.meta.env.VITE_BASE_API || "http://43.142.76.105:8000/api/v1"}/auth/refresh/`,
        { refresh_token: refreshToken },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data?.success && response.data?.data?.token) {
        const newAccessToken = response.data.data.token;
        const newRefreshToken = response.data.data.refresh_token;

        // 保存新Token
        this.saveTokens(newAccessToken, newRefreshToken);

        logger.info('Token刷新成功');
        return newAccessToken;
      } else {
        logger.warn('Token刷新响应异常:', response.data);
        this.clearTokens();
        return null;
      }
    } catch (error: any) {
      logger.error('Token刷新失败:', error);

      // 如果是401错误，说明refresh token也过期了
      if (error.response?.status === 401) {
        logger.warn('Refresh token已过期，需要重新登录');
      }

      this.clearTokens();
      return null;
    }
  }

  /**
   * 等待Token刷新完成
   * 用于并发请求的等待机制
   */
  waitForTokenRefresh(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.isRefreshing) {
        // 没有在刷新，直接获取当前Token
        const token = this.getAccessToken();
        if (token) {
          resolve(token);
        } else {
          reject(new Error('Token不存在'));
        }
        return;
      }

      // 加入等待队列
      this.pendingRequests.push({ resolve, reject });
      logger.debug(`请求加入等待队列，当前队列长度: ${this.pendingRequests.length}`);
    });
  }

  /**
   * 检查Token是否即将过期
   * @param threshold - 提前多少秒刷新，默认5分钟
   */
  isTokenNearExpiry(threshold = 300): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // 解析JWT Token的payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 转换为毫秒
      const now = Date.now();

      return (exp - now) < (threshold * 1000);
    } catch (error) {
      logger.warn('解析Token过期时间失败:', error);
      return false;
    }
  }

  /**
   * 预先刷新Token
   * 在Token即将过期时主动刷新
   */
  async preemptiveRefresh(): Promise<void> {
    if (this.isTokenNearExpiry() && !this.isRefreshing) {
      logger.info('Token即将过期，开始预先刷新...');
      await this.refreshToken();
    }
  }

  /**
   * 定期检查Token状态
   */
  startTokenWatcher(): void {
    // 每分钟检查一次Token状态
    setInterval(() => {
      if (this.hasValidToken()) {
        this.preemptiveRefresh();
      }
    }, 60000);

    logger.debug('Token监控器已启动');
  }

  /**
   * 停止Token监控
   */
  stopTokenWatcher(): void {
    // 这里可以实现停止监控的逻辑
    logger.debug('Token监控器已停止');
  }
}

// 导出单例实例
export const tokenManager = TokenManager.getInstance();

// 启动Token监控（在应用初始化时调用）
export function initTokenManager(): void {
  tokenManager.startTokenWatcher();
  logger.info('Token管理器已初始化');
}
