/**
 * 文章导出服务
 * 统一的导出功能封装
 */

import type { Article } from '@/types/cms';
import { ArticleExporter, type ExportFormat, type ExportConfig } from './articleExporter';
import { errorService } from '@/utils/errorService';
import logger from '@/utils/logger';

// 导出选项接口
export interface ExportOptions {
  articles: Article[];
  format: ExportFormat;
  includeImages?: boolean;
  categoryName?: string;
  onProgress?: (current: number, total: number, stage: 'articles' | 'images') => void;
  onComplete?: (stats: ExportStats) => void;
  onError?: (error: any) => void;
}

// 导出统计接口
export interface ExportStats {
  totalArticles: number;
  exportedArticles: number;
  totalImages: number;
  downloadedImages: number;
  failedImages: number;
  fileSize: number;
  duration: number;
}

/**
 * 导出服务类
 */
export class ExportService {
  private static instance: ExportService;

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  /**
   * 导出文章
   */
  async exportArticles(options: ExportOptions): Promise<ExportStats> {
    const startTime = Date.now();

    try {
      // 验证参数
      this.validateOptions(options);

      logger.info('开始导出文章', {
        count: options.articles.length,
        format: options.format,
        includeImages: options.includeImages
      });

      // 创建导出器
      const exporter = new ArticleExporter({
        format: options.format,
        includeImages: options.includeImages ?? true,
        categoryName: options.categoryName,
        onProgress: (current, total) => {
          options.onProgress?.(current, total, 'articles');
        }
      });

      // 执行导出
      await exporter.exportArticles(options.articles);

      // 收集统计信息
      const imageStats = exporter.getImageStats();
      const stats: ExportStats = {
        totalArticles: options.articles.length,
        exportedArticles: options.articles.length,
        totalImages: imageStats.downloaded + imageStats.failed,
        downloadedImages: imageStats.downloaded,
        failedImages: imageStats.failed,
        fileSize: 0, // ZIP文件大小（实际下载后才知道）
        duration: Date.now() - startTime
      };

      logger.info('文章导出完成', stats);

      // 清理
      exporter.clearImageCache();

      // 回调
      options.onComplete?.(stats);

      return stats;
    } catch (error) {
      logger.error('文章导出失败', error);

      // 错误回调
      options.onError?.(error);

      // 显示错误提示
      await errorService.handleApiError({
        success: false,
        code: 5000,
        message: '文章导出失败',
        data: error,
        error_code: 'EXPORT_FAILED'
      });

      throw error;
    }
  }

  /**
   * 导出单篇文章（不打包为zip）
   */
  async exportSingleArticle(
    article: Article,
    format: ExportFormat
  ): Promise<void> {
    try {
      logger.info(`导出单篇文章: ${article.title}`, { format });

      const exporter = new ArticleExporter({
        format,
        includeImages: false
      });

      const content = exporter['generateFileContent'](article);
      const fileName = exporter['generateFileName'](article);

      // 创建Blob并下载
      const mimeType = this.getMimeType(format);
      const blob = new Blob([content], { type: mimeType });
      saveAs(blob, fileName);

      logger.info('单篇文章导出成功');
    } catch (error) {
      logger.error('单篇文章导出失败', error);

      await errorService.showError('文章导出失败');
      throw error;
    }
  }

  /**
   * 验证导出选项
   */
  private validateOptions(options: ExportOptions): void {
    if (!options.articles || options.articles.length === 0) {
      throw new Error('没有要导出的文章');
    }

    if (!options.format) {
      throw new Error('未指定导出格式');
    }

    const supportedFormats: ExportFormat[] = ['txt', 'md', 'html', 'json'];
    if (!supportedFormats.includes(options.format)) {
      throw new Error(`不支持的格式: ${options.format}`);
    }
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(format: ExportFormat): string {
    const mimeTypes: Record<ExportFormat, string> = {
      txt: 'text/plain;charset=utf-8',
      md: 'text/markdown;charset=utf-8',
      html: 'text/html;charset=utf-8',
      json: 'application/json;charset=utf-8'
    };

    return mimeTypes[format] || 'text/plain;charset=utf-8';
  }

  /**
   * 预估导出文件大小
   */
  estimateSize(articles: Article[], includeImages = true): number {
    let totalSize = 0;

    articles.forEach(article => {
      // 文章内容大小
      const contentSize = (article.title?.length || 0) + (article.content?.length || 0);
      totalSize += contentSize * 2; // UTF-8估算

      // 图片大小估算（平均每张100KB）
      if (includeImages && article.content) {
        const imageCount = (article.content.match(/<img/gi) || []).length +
          (article.content.match(/!\[/g) || []).length;
        totalSize += imageCount * 100 * 1024;
      }
    });

    return totalSize;
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// 导出单例
export const exportService = ExportService.getInstance();

// 便捷导出函数
export async function exportArticles(options: ExportOptions): Promise<ExportStats> {
  return await exportService.exportArticles(options);
}

export async function exportSingleArticle(article: Article, format: ExportFormat): Promise<void> {
  return await exportService.exportSingleArticle(article, format);
}
