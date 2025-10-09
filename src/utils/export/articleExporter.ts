/**
 * 文章导出工具类
 * 支持导出为txt、md、html、json格式
 */

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Article } from '@/types/cms';
import { ImageHandler } from './imageHandler';
import logger from '@/utils/logger';

// 导出格式类型
export type ExportFormat = 'txt' | 'md' | 'html' | 'json';

// 导出配置接口
export interface ExportConfig {
  format: ExportFormat;
  includeImages: boolean;
  categoryName?: string;
  onProgress?: (current: number, total: number) => void;
}

// 图片信息接口
export interface ImageInfo {
  url: string;
  filename: string;
  blob?: Blob;
}

/**
 * 文章导出器类
 */
export class ArticleExporter {
  private zip: JSZip;
  private config: ExportConfig;
  private imageHandler: ImageHandler;

  constructor(config: ExportConfig) {
    this.zip = new JSZip();
    this.config = config;
    this.imageHandler = new ImageHandler();
  }

  /**
   * 导出文章列表
   */
  async exportArticles(articles: Article[]): Promise<void> {
    if (articles.length === 0) {
      throw new Error('没有要导出的文章');
    }

    logger.info(`开始导出${articles.length}篇文章，格式：${this.config.format}`);

    try {
      // 创建文章文件夹
      const articlesFolder = this.zip.folder('articles');
      if (!articlesFolder) {
        throw new Error('创建文章文件夹失败');
      }

      // 如果需要包含图片，创建images文件夹
      let imagesFolder: JSZip | null = null;
      if (this.config.includeImages) {
        imagesFolder = this.zip.folder('images');
      }

      // 处理每篇文章
      for (let i = 0; i < articles.length; i++) {
        const article = articles[i];

        // 生成文件内容
        const fileContent = this.generateFileContent(article);

        // 生成文件名
        const fileName = this.generateFileName(article);

        // 添加到zip
        articlesFolder.file(fileName, fileContent);

        // 处理图片
        if (this.config.includeImages && imagesFolder) {
          await this.processArticleImages(article, imagesFolder);
        }

        // 更新进度
        this.config.onProgress?.(i + 1, articles.length);
      }

      // 生成并下载zip文件
      await this.downloadZip();

      logger.info('文章导出成功');
    } catch (error) {
      logger.error('文章导出失败:', error);
      throw error;
    }
  }

  /**
   * 生成文件内容（根据格式）
   */
  private generateFileContent(article: Article): string {
    switch (this.config.format) {
      case 'txt':
        return this.generateTxt(article);
      case 'md':
        return this.generateMarkdown(article);
      case 'html':
        return this.generateHtml(article);
      case 'json':
        return this.generateJson(article);
      default:
        throw new Error(`不支持的格式: ${this.config.format}`);
    }
  }

  /**
   * 生成TXT格式
   */
  private generateTxt(article: Article): string {
    return `${article.title}\n\n${article.content || ''}`;
  }

  /**
   * 生成Markdown格式
   */
  private generateMarkdown(article: Article): string {
    const content = article.content || '';

    // 如果内容已经是Markdown格式，直接使用
    if (this.isMarkdown(content)) {
      return `# ${article.title}\n\n${content}`;
    }

    // 如果是HTML，尝试转换为Markdown（简单转换）
    if (this.isHtml(content)) {
      const mdContent = this.htmlToMarkdown(content);
      return `# ${article.title}\n\n${mdContent}`;
    }

    // 纯文本
    return `# ${article.title}\n\n${content}`;
  }

  /**
   * 生成HTML格式
   */
  private generateHtml(article: Article): string {
    const template = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(article.title)}</title>
  <style>
    body {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    h1 {
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    img {
      max-width: 100%;
      height: auto;
    }
    pre {
      background-color: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    code {
      background-color: #f6f8fa;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    }
  </style>
</head>
<body>
  <article>
    <h1>${this.escapeHtml(article.title)}</h1>
    <div class="content">
      ${article.content || ''}
    </div>
  </article>
</body>
</html>`;

    return template;
  }

  /**
   * 生成JSON格式
   */
  private generateJson(article: Article): string {
    const exportData = {
      id: article.id,
      title: article.title,
      content: article.content
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * 生成文件名
   */
  private generateFileName(article: Article): string {
    // 清理文章标题，移除不合法的文件名字符
    const cleanTitle = this.sanitizeFileName(article.title);

    // 格式：文章ID-文章标题.格式
    return `${article.id}-${cleanTitle}.${this.config.format}`;
  }

  /**
   * 清理文件名（移除非法字符）
   */
  private sanitizeFileName(fileName: string): string {
    // 移除或替换非法字符
    return fileName
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // 移除Windows非法字符
      .replace(/\s+/g, '_') // 空格替换为下划线
      .replace(/\.+$/, '') // 移除末尾的点
      .substring(0, 100); // 限制长度
  }

  /**
   * 处理文章中的图片
   */
  private async processArticleImages(article: Article, imagesFolder: JSZip): Promise<void> {
    await this.imageHandler.addImagesToZip(
      this.zip,
      article.content || '',
      article.id
    );
  }

  /**
   * 下载ZIP文件
   */
  private async downloadZip(): Promise<void> {
    // 生成zip文件名
    const zipFileName = this.generateZipFileName();

    logger.info(`生成ZIP文件: ${zipFileName}`);

    // 生成ZIP Blob
    const blob = await this.zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: {
        level: 9
      }
    });

    // 触发下载
    saveAs(blob, zipFileName);
  }

  /**
   * 生成ZIP文件名
   */
  private generateZipFileName(): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const categoryPart = this.config.categoryName
      ? `${this.sanitizeFileName(this.config.categoryName)}_`
      : '';

    return `articles_${categoryPart}${date}.zip`;
  }

  /**
   * 判断是否为Markdown格式
   */
  private isMarkdown(content: string): boolean {
    // 简单判断：包含Markdown特征
    return /^#{1,6}\s|^\*\s|^\-\s|^\d+\.\s|\[.*\]\(.*\)|\*\*.*\*\*|\_\_.*\_\_/m.test(content);
  }

  /**
   * 判断是否为HTML格式
   */
  private isHtml(content: string): boolean {
    return /<[a-z][\s\S]*>/i.test(content);
  }

  /**
   * HTML转Markdown（简单转换）
   */
  private htmlToMarkdown(html: string): string {
    let md = html;

    // 转换标题
    md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n');
    md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n');
    md = md.replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n');
    md = md.replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n');

    // 转换加粗
    md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');

    // 转换斜体
    md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');

    // 转换链接
    md = md.replace(/<a[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

    // 转换图片
    md = md.replace(/<img[^>]*src=["']([^"']*)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
    md = md.replace(/<img[^>]*src=["']([^"']*)["'][^>]*>/gi, '![]($1)');

    // 转换段落
    md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');

    // 转换换行
    md = md.replace(/<br\s*\/?>/gi, '\n');

    // 转换列表
    md = md.replace(/<ul[^>]*>(.*?)<\/ul>/gis, '$1\n');
    md = md.replace(/<ol[^>]*>(.*?)<\/ol>/gis, '$1\n');
    md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');

    // 转换代码块
    md = md.replace(/<pre[^>]*><code[^>]*>(.*?)<\/code><\/pre>/gis, '```\n$1\n```\n');
    md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`');

    // 移除其他HTML标签
    md = md.replace(/<[^>]+>/g, '');

    // 解码HTML实体
    md = this.decodeHtmlEntities(md);

    // 清理多余的空行
    md = md.replace(/\n{3,}/g, '\n\n');

    return md.trim();
  }

  /**
   * HTML实体解码
   */
  private decodeHtmlEntities(text: string): string {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 清理图片缓存
   */
  clearImageCache(): void {
    this.imageHandler.reset();
  }

  /**
   * 获取缓存的图片数量
   */
  getCachedImageCount(): number {
    return this.imageHandler.getStats().cached;
  }

  /**
   * 获取图片下载统计
   */
  getImageStats() {
    return this.imageHandler.getStats();
  }
}

/**
 * 便捷的导出函数
 */
export async function exportArticlesToZip(
  articles: Article[],
  config: ExportConfig
): Promise<void> {
  const exporter = new ArticleExporter(config);
  await exporter.exportArticles(articles);
  exporter.clearImageCache();
}

/**
 * 导出单篇文章
 */
export function exportSingleArticle(article: Article, format: ExportFormat): void {
  const exporter = new ArticleExporter({
    format,
    includeImages: false
  });

  let content: string;
  let fileName: string;

  switch (format) {
    case 'txt':
      content = `${article.title}\n\n${article.content || ''}`;
      fileName = `${article.id}-${exporter['sanitizeFileName'](article.title)}.txt`;
      break;
    case 'md':
      content = exporter['generateMarkdown'](article);
      fileName = `${article.id}-${exporter['sanitizeFileName'](article.title)}.md`;
      break;
    case 'html':
      content = exporter['generateHtml'](article);
      fileName = `${article.id}-${exporter['sanitizeFileName'](article.title)}.html`;
      break;
    case 'json':
      content = exporter['generateJson'](article);
      fileName = `${article.id}-${exporter['sanitizeFileName'](article.title)}.json`;
      break;
    default:
      throw new Error(`不支持的格式: ${format}`);
  }

  // 创建Blob并下载
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, fileName);
}
