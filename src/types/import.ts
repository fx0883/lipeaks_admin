/**
 * 文章导入相关类型定义
 */

// 文件类型枚举
export type ArticleFileType = "markdown" | "html";

// Markdown 图片信息
export interface MarkdownImage {
  alt: string; // 图片 alt 文本
  originalPath: string; // 原始路径（如 ./images/pic.png）
  resolvedPath?: string; // 解析后的文件路径
  file?: File; // 对应的 File 对象
}

// 文件解析结果
export interface ParsedArticleFile {
  id: string; // 唯一标识（用于列表渲染）
  fileName: string; // 原始文件名（不含扩展名）
  fileNameWithExt: string; // 原始文件名（含扩展名）
  filePath: string; // 文件相对路径
  fileType: ArticleFileType; // 文件类型
  title: string; // 提取的标题
  content: string; // 文件原始内容
  coverImage?: File; // 封面图文件对象
  coverImageName?: string; // 封面图文件名
  markdownImages: MarkdownImage[]; // Markdown 中的图片引用
  file: File; // 原始 File 对象
}

// 导入状态
export type ImportStatus = "pending" | "uploading" | "success" | "failed";

// 导入进度项
export interface ImportProgressItem extends ParsedArticleFile {
  status: ImportStatus;
  error?: string;
  articleId?: number; // 创建成功后的文章ID
  currentStep?: string; // 当前步骤描述
}

// 导入统计
export interface ImportStatistics {
  total: number;
  success: number;
  failed: number;
  pending: number;
}

// Worker 请求消息
export interface WorkerParseRequest {
  type: "parse";
  files: Array<{
    articleFile: File;
    coverImage?: File;
    filePath: string;
  }>;
}

// Worker 响应消息
export interface WorkerParseResponse {
  type: "progress" | "complete" | "error";
  data?: ParsedArticleFile[];
  current?: number;
  total?: number;
  error?: string;
}

// 导入配置
export interface ImportConfig {
  categoryId: number; // 目标分类ID
  status: "draft" | "published"; // 默认文章状态
  uploadFolder: string; // 图片上传文件夹
}

