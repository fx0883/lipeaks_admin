/**
 * Markdown 处理器
 * 负责处理 Markdown 内容中的图片引用，上传并替换 URL
 */

import type { MarkdownImage } from "@/types/import";
import { uploadSingleImage } from "./imageUploader";
import {
  resolveRelativePath,
  getFileDirectory,
  findImageFile
} from "./fileParser";
import logger from "@/utils/logger";

/**
 * 提取 Markdown 中的图片引用
 * 匹配格式: ![alt](path)
 */
export function extractMarkdownImages(content: string): MarkdownImage[] {
  const images: MarkdownImage[] = [];
  // 匹配 ![alt](path) 格式
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    images.push({
      alt: match[1] || "",
      originalPath: match[2]
    });
  }

  logger.debug(`[MarkdownProcessor] 提取到 ${images.length} 个图片引用`);
  return images;
}

/**
 * 解析 Markdown 图片的相对路径
 * @param images 图片引用列表
 * @param articleFilePath 文章文件路径
 * @param allFilesMap 所有文件映射
 */
export function resolveMarkdownImagePaths(
  images: MarkdownImage[],
  articleFilePath: string,
  allFilesMap: Map<string, File>
): MarkdownImage[] {
  const articleDir = getFileDirectory(articleFilePath);
  logger.debug(`[MarkdownProcessor] 文章目录: ${articleDir}`);

  return images.map(img => {
    // 跳过外部链接（http/https）
    if (
      img.originalPath.startsWith("http://") ||
      img.originalPath.startsWith("https://")
    ) {
      logger.debug(
        `[MarkdownProcessor] 跳过外部链接: ${img.originalPath}`
      );
      return { ...img, resolvedPath: img.originalPath };
    }

    // 解析相对路径
    const resolvedPath = resolveRelativePath(img.originalPath, articleDir);
    logger.debug(
      `[MarkdownProcessor] 解析路径: ${img.originalPath} -> ${resolvedPath}`
    );

    // 查找文件
    const file = findImageFile(resolvedPath, allFilesMap);

    return {
      ...img,
      resolvedPath,
      file
    };
  });
}

/**
 * 处理 Markdown 内容中的图片
 * 1. 提取所有图片引用
 * 2. 上传图片
 * 3. 替换 URL
 */
export async function processMarkdownImages(
  content: string,
  articleFilePath: string,
  allFilesMap: Map<string, File>,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<string> {
  logger.debug(
    `[MarkdownProcessor] 开始处理 Markdown 图片，文章: ${articleFilePath}`
  );

  // 1. 提取图片引用
  const images = extractMarkdownImages(content);
  if (images.length === 0) {
    logger.debug("[MarkdownProcessor] 没有图片引用，跳过处理");
    return content;
  }

  // 2. 解析图片路径
  const resolvedImages = resolveMarkdownImagePaths(
    images,
    articleFilePath,
    allFilesMap
  );

  // 3. 上传图片
  const urlMap = new Map<string, string>(); // originalPath -> serverUrl
  const imagesToUpload = resolvedImages.filter(img => img.file);

  logger.debug(
    `[MarkdownProcessor] 需要上传 ${imagesToUpload.length} 张图片`
  );

  for (let i = 0; i < imagesToUpload.length; i++) {
    const img = imagesToUpload[i];
    const current = i + 1;
    const total = imagesToUpload.length;

    try {
      if (onProgress) {
        onProgress(current, total, img.file!.name);
      }

      const url = await uploadSingleImage(img.file!, "article_images");
      urlMap.set(img.originalPath, url);
      logger.debug(
        `[MarkdownProcessor] 图片上传成功: ${img.originalPath} -> ${url}`
      );
    } catch (error) {
      logger.error(
        `[MarkdownProcessor] 图片上传失败: ${img.originalPath}`,
        error
      );
      // 上传失败不中断流程
    }
  }

  // 4. 替换内容中的图片 URL
  let processedContent = content;
  urlMap.forEach((serverUrl, originalPath) => {
    // 转义特殊字符
    const escapedPath = originalPath.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
    const regex = new RegExp(
      `!\\[([^\\]]*)\\]\\(${escapedPath}\\)`,
      "g"
    );
    processedContent = processedContent.replace(
      regex,
      `![$1](${serverUrl})`
    );
  });

  logger.debug(
    `[MarkdownProcessor] Markdown 处理完成，已替换 ${urlMap.size} 个图片 URL`
  );

  return processedContent;
}

/**
 * 替换内容中的图片 URL（简化版本）
 * @param content 内容
 * @param urlMap 原始路径 -> 服务器URL 的映射
 */
export function replaceImageUrls(
  content: string,
  urlMap: Map<string, string>
): string {
  let result = content;

  urlMap.forEach((serverUrl, originalPath) => {
    // 转义特殊字符以用于正则表达式
    const escapedPath = originalPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedPath}\\)`, "g");
    result = result.replace(regex, `![$1](${serverUrl})`);
  });

  return result;
}

