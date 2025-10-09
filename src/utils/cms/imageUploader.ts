/**
 * 图片上传工具
 * 负责串行上传图片文件
 */

import { uploadFile } from "@/api/modules/common";
import logger from "@/utils/logger";

/**
 * 上传单张图片（带重试）
 * @param file 图片文件
 * @param folder 上传文件夹
 * @param retryCount 重试次数（默认2次）
 * @returns 图片URL
 */
export async function uploadSingleImage(
  file: File,
  folder: string = "article_images",
  retryCount: number = 2
): Promise<string> {
  let lastError: any;

  for (let i = 0; i <= retryCount; i++) {
    try {
      if (i > 0) {
        logger.debug(`[ImageUploader] 重试上传 ${file.name}，第 ${i} 次`);
        // 重试前等待一段时间
        await new Promise(resolve => setTimeout(resolve, 1000 * i));
      }

      logger.debug(`[ImageUploader] 开始上传: ${file.name}`);
      const response = await uploadFile(file, folder);

      if (response.success && response.data?.url) {
        logger.debug(`[ImageUploader] 上传成功: ${file.name} -> ${response.data.url}`);
        return response.data.url;
      } else {
        throw new Error(response.message || "上传失败");
      }
    } catch (error) {
      lastError = error;
      logger.error(`[ImageUploader] 上传失败 (尝试 ${i + 1}/${retryCount + 1}):`, error);
    }
  }

  throw lastError;
}

/**
 * 串行上传图片列表
 * @param images 图片文件数组
 * @param folder 上传文件夹
 * @param onProgress 进度回调
 * @returns Map<文件名, URL>
 */
export async function uploadImagesSequentially(
  images: File[],
  folder: string = "article_images",
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<Map<string, string>> {
  logger.debug(`[ImageUploader] 开始串行上传 ${images.length} 张图片`);

  const urlMap = new Map<string, string>();
  const total = images.length;

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const current = i + 1;

    try {
      // 调用进度回调
      if (onProgress) {
        onProgress(current, total, file.name);
      }

      // 上传图片
      const url = await uploadSingleImage(file, folder);
      urlMap.set(file.name, url);

      logger.debug(
        `[ImageUploader] 进度: ${current}/${total} - ${file.name}`
      );
    } catch (error) {
      logger.error(`[ImageUploader] 上传图片失败: ${file.name}`, error);
      // 继续上传下一张，不中断流程
    }
  }

  logger.debug(
    `[ImageUploader] 串行上传完成，成功: ${urlMap.size}/${total}`
  );

  return urlMap;
}

/**
 * 批量上传图片（使用 File 对象作为 key）
 * @param images 图片文件数组
 * @param folder 上传文件夹
 * @param onProgress 进度回调
 * @returns Map<File, URL>
 */
export async function uploadImagesByFile(
  images: File[],
  folder: string = "article_images",
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<Map<File, string>> {
  logger.debug(`[ImageUploader] 开始上传 ${images.length} 张图片（File映射）`);

  const urlMap = new Map<File, string>();
  const total = images.length;

  for (let i = 0; i < images.length; i++) {
    const file = images[i];
    const current = i + 1;

    try {
      // 调用进度回调
      if (onProgress) {
        onProgress(current, total, file.name);
      }

      // 上传图片
      const url = await uploadSingleImage(file, folder);
      urlMap.set(file, url);

      logger.debug(
        `[ImageUploader] 进度: ${current}/${total} - ${file.name}`
      );
    } catch (error) {
      logger.error(`[ImageUploader] 上传图片失败: ${file.name}`, error);
      // 继续上传下一张，不中断流程
    }
  }

  logger.debug(
    `[ImageUploader] 上传完成，成功: ${urlMap.size}/${total}`
  );

  return urlMap;
}

