/**
 * 图片处理工具
 * 处理文章中的图片下载和打包
 */

import type JSZip from 'jszip';
import logger from '@/utils/logger';

// 图片下载配置
export interface ImageDownloadConfig {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

const DEFAULT_CONFIG: ImageDownloadConfig = {
  timeout: 10000,
  maxRetries: 3,
  retryDelay: 1000
};

/**
 * 图片处理器类
 */
export class ImageHandler {
  private config: ImageDownloadConfig;
  private downloadedImages = new Map<string, Blob>();
  private failedImages = new Set<string>();

  constructor(config: Partial<ImageDownloadConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 提取内容中的所有图片URL
   */
  extractImageUrls(content: string): string[] {
    const urls: string[] = [];

    // 匹配HTML img标签: <img src="...">
    const htmlImgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = htmlImgRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    // 匹配Markdown图片: ![alt](url)
    const mdImgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
    while ((match = mdImgRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    // 匹配HTML背景图片: style="background-image: url(...)"
    const bgImgRegex = /background-image:\s*url\(['"]?([^'"]+)['"]?\)/gi;
    while ((match = bgImgRegex.exec(content)) !== null) {
      urls.push(match[1]);
    }

    // 去重并过滤
    return [...new Set(urls)]
      .filter(url => this.isValidImageUrl(url))
      .map(url => url.trim());
  }

  /**
   * 判断是否为有效的图片URL
   */
  private isValidImageUrl(url: string): boolean {
    if (!url || url.length === 0) return false;

    // 排除data URL
    if (url.startsWith('data:')) return false;

    // 排除明显不是图片的URL
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.ico'];
    const urlLower = url.toLowerCase();

    // 检查扩展名或常见图片URL特征
    return imageExtensions.some(ext => urlLower.includes(ext)) ||
      urlLower.includes('image') ||
      urlLower.includes('img') ||
      urlLower.includes('photo');
  }

  /**
   * 下载单张图片（带重试）
   */
  async downloadImage(url: string): Promise<Blob | null> {
    // 检查缓存
    if (this.downloadedImages.has(url)) {
      return this.downloadedImages.get(url)!;
    }

    // 检查失败记录
    if (this.failedImages.has(url)) {
      return null;
    }

    // 尝试下载
    for (let attempt = 0; attempt < this.config.maxRetries!; attempt++) {
      try {
        const blob = await this.fetchImage(url);

        if (blob) {
          this.downloadedImages.set(url, blob);
          return blob;
        }
      } catch (error) {
        logger.warn(`图片下载失败 (尝试 ${attempt + 1}/${this.config.maxRetries}):`, url, error);

        if (attempt < this.config.maxRetries! - 1) {
          // 等待后重试
          await this.delay(this.config.retryDelay!);
        }
      }
    }

    // 所有重试都失败
    this.failedImages.add(url);
    return null;
  }

  /**
   * 获取图片
   */
  private async fetchImage(url: string): Promise<Blob | null> {
    const absoluteUrl = this.resolveUrl(url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(absoluteUrl, {
        signal: controller.signal,
        mode: 'cors',
        credentials: 'omit'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // 验证是否真的是图片
      if (!blob.type.startsWith('image/')) {
        logger.warn(`URL不是图片类型: ${url}, type: ${blob.type}`);
        return null;
      }

      return blob;
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('下载超时');
      }

      throw error;
    }
  }

  /**
   * 批量下载图片
   */
  async downloadImages(
    urls: string[],
    onProgress?: (current: number, total: number) => void
  ): Promise<Map<string, Blob>> {
    const results = new Map<string, Blob>();

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const blob = await this.downloadImage(url);

      if (blob) {
        results.set(url, blob);
      }

      onProgress?.(i + 1, urls.length);
    }

    logger.info(`图片下载完成: 成功${results.size}/${urls.length}`);
    return results;
  }

  /**
   * 添加图片到ZIP
   */
  async addImagesToZip(
    zip: JSZip,
    content: string,
    articleId: number,
    onProgress?: (current: number, total: number) => void
  ): Promise<void> {
    // 提取图片URL
    const imageUrls = this.extractImageUrls(content);

    if (imageUrls.length === 0) {
      logger.debug(`文章${articleId}没有图片`);
      return;
    }

    logger.info(`文章${articleId}包含${imageUrls.length}张图片`);

    // 创建images文件夹
    const imagesFolder = zip.folder('images') || zip;

    // 下载图片
    const images = await this.downloadImages(imageUrls, onProgress);

    // 添加到zip
    images.forEach((blob, url) => {
      const fileName = this.generateImageFileName(url, articleId);
      imagesFolder.file(fileName, blob);
    });
  }

  /**
   * 生成图片文件名
   */
  private generateImageFileName(url: string, articleId: number): string {
    try {
      // 尝试从URL提取文件名
      const urlObj = new URL(url, window.location.origin);
      const pathname = urlObj.pathname;
      let fileName = pathname.split('/').pop() || '';

      // 清理文件名
      fileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

      // 确保有扩展名
      if (!fileName.includes('.')) {
        fileName += '.jpg';
      }

      // 添加文章ID前缀避免重名
      return `article_${articleId}_${fileName}`;
    } catch (error) {
      // 生成随机文件名
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      return `article_${articleId}_${timestamp}_${random}.jpg`;
    }
  }

  /**
   * 解析URL为绝对路径
   */
  private resolveUrl(url: string): string {
    // 如果已经是完整URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // 如果是绝对路径
    if (url.startsWith('/')) {
      const origin = window.location.origin;
      return `${origin}${url}`;
    }

    // 相对路径，使用当前页面的base
    const base = import.meta.env.VITE_BASE_URL || window.location.origin;
    return new URL(url, base).href;
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取下载统计
   */
  getStats() {
    return {
      downloaded: this.downloadedImages.size,
      failed: this.failedImages.size,
      cached: this.downloadedImages.size
    };
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.downloadedImages.clear();
    this.failedImages.clear();
  }
}

/**
 * 创建图片处理器实例
 */
export function createImageHandler(config?: Partial<ImageDownloadConfig>): ImageHandler {
  return new ImageHandler(config);
}
