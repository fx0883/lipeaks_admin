/**
 * 文件解析工具
 * 负责组织文件列表，匹配文章和图片
 */

import type { ParsedArticleFile } from "@/types/import";
import logger from "@/utils/logger";

// 支持的图片扩展名
const IMAGE_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "svg",
  "ico"
];

// 支持的文章文件扩展名
const ARTICLE_EXTENSIONS = ["md", "html", "htm"];

/**
 * 判断是否为图片文件
 */
export function isImageFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return IMAGE_EXTENSIONS.includes(ext);
}

/**
 * 判断是否为文章文件
 */
export function isArticleFile(fileName: string): boolean {
  const ext = getFileExtension(fileName);
  return ARTICLE_EXTENSIONS.includes(ext);
}

/**
 * 获取文件扩展名（小写）
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "";
  return fileName.substring(lastDot + 1).toLowerCase();
}

/**
 * 获取不含扩展名的文件名
 */
export function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return fileName;
  return fileName.substring(0, lastDot);
}

/**
 * 组织文件列表，分离文章文件和图片文件
 */
export function organizeFiles(fileList: FileList | File[]): {
  articleFiles: File[];
  imageFiles: Map<string, File[]>; // key: 不含扩展名的文件名, value: 所有同名图片
  allFilesMap: Map<string, File>; // key: 文件完整路径, value: File对象
} {
  logger.debug("[FileParser] 开始组织文件列表");

  const articleFiles: File[] = [];
  const imageFiles = new Map<string, File[]>();
  const allFilesMap = new Map<string, File>();

  // 将 FileList 转换为数组
  const files = Array.from(fileList);

  logger.debug(`[FileParser] 总文件数: ${files.length}`);

  files.forEach(file => {
    // 获取文件路径（webkitRelativePath 或 name）
    const filePath = (file as any).webkitRelativePath || file.name;
    allFilesMap.set(filePath, file);

    const fileName = file.name;

    if (isArticleFile(fileName)) {
      articleFiles.push(file);
      logger.debug(`[FileParser] 找到文章文件: ${fileName}`);
    } else if (isImageFile(fileName)) {
      const baseName = getFileNameWithoutExtension(fileName);
      if (!imageFiles.has(baseName)) {
        imageFiles.set(baseName, []);
      }
      imageFiles.get(baseName)!.push(file);
      logger.debug(`[FileParser] 找到图片文件: ${fileName}`);
    }
  });

  logger.debug(
    `[FileParser] 组织完成 - 文章: ${articleFiles.length}, 图片组: ${imageFiles.size}`
  );

  return { articleFiles, imageFiles, allFilesMap };
}

/**
 * 匹配文章的封面图（返回第一个找到的）
 */
export function matchCoverImage(
  articleFileName: string,
  imageFiles: Map<string, File[]>
): File | undefined {
  const baseName = getFileNameWithoutExtension(articleFileName);
  const images = imageFiles.get(baseName);

  if (images && images.length > 0) {
    logger.debug(
      `[FileParser] 为 ${articleFileName} 找到封面图: ${images[0].name}`
    );
    return images[0];
  }

  logger.debug(`[FileParser] ${articleFileName} 没有封面图`);
  return undefined;
}

/**
 * 获取文章文件的相对路径目录
 */
export function getFileDirectory(filePath: string): string {
  const lastSlash = Math.max(filePath.lastIndexOf("/"), filePath.lastIndexOf("\\"));
  if (lastSlash === -1) return "";
  return filePath.substring(0, lastSlash);
}

/**
 * 解析相对路径为绝对路径
 * @param relativePath 相对路径（如 ./images/pic.png 或 ../pics/img.jpg）
 * @param baseDir 基础目录路径
 */
export function resolveRelativePath(
  relativePath: string,
  baseDir: string
): string {
  // 移除前导的 ./
  let path = relativePath.replace(/^\.\//, "");

  // 处理 ../ (返回上级目录)
  while (path.startsWith("../")) {
    path = path.substring(3);
    const lastSlash = Math.max(baseDir.lastIndexOf("/"), baseDir.lastIndexOf("\\"));
    if (lastSlash > 0) {
      baseDir = baseDir.substring(0, lastSlash);
    } else {
      baseDir = "";
    }
  }

  // 组合路径
  if (baseDir) {
    return `${baseDir}/${path}`;
  }
  return path;
}

/**
 * 从文件路径映射中查找图片文件
 */
export function findImageFile(
  imagePath: string,
  allFilesMap: Map<string, File>
): File | undefined {
  // 首先尝试直接匹配
  if (allFilesMap.has(imagePath)) {
    return allFilesMap.get(imagePath);
  }

  // 尝试忽略大小写匹配
  const lowerPath = imagePath.toLowerCase();
  for (const [path, file] of allFilesMap.entries()) {
    if (path.toLowerCase() === lowerPath) {
      return file;
    }
  }

  // 尝试只匹配文件名（忽略路径）
  const fileName = imagePath.split(/[/\\]/).pop();
  if (fileName) {
    for (const [path, file] of allFilesMap.entries()) {
      if (file.name === fileName) {
        logger.debug(
          `[FileParser] 通过文件名匹配到图片: ${fileName} -> ${path}`
        );
        return file;
      }
    }
  }

  logger.warn(`[FileParser] 找不到图片文件: ${imagePath}`);
  return undefined;
}

/**
 * 生成唯一ID
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

