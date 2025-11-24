import { http } from "@/utils/http";
import type { ApiResponse } from "@/types/api";
import logger from "@/utils/logger";

/**
 * 通用文件上传
 * @param file 文件对象
 * @param folder 可选的文件夹名称
 */
export function uploadFile(file: File, folder?: string) {
  logger.debug("API请求: 上传文件", {
    fileName: file.name,
    fileSize: file.size,
    folder
  });

  const formData = new FormData();
  formData.append("file", file);

  if (folder) {
    formData.append("folder", folder);
  }

  return http.request<
    ApiResponse<{
      url: string;
      filename: string;
      size: number;
    }>
  >("post", "/common/upload-file/", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}

/**
 * 上传图片并生成缩略图
 * @param file 图片文件对象
 * @param folder 可选的文件夹名称
 */
export function uploadImageWithThumbnail(file: File, folder?: string) {
  logger.debug("API请求: 上传图片并生成缩略图", {
    fileName: file.name,
    fileSize: file.size,
    folder
  });

  const formData = new FormData();
  formData.append("file", file);

  if (folder) {
    formData.append("folder", folder);
  }

  return http.request<
    ApiResponse<{
      url: string;
      filename: string;
      size: number;
      thumbnail_url: string;
      thumbnail_filename: string;
      thumbnail_size: number;
    }>
  >("post", "/common/upload-image-with-thumbnail/", {
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
}
