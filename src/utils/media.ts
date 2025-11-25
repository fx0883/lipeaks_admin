/**
 * 媒体文件 URL 处理工具
 */

/**
 * 获取后端基础 URL（不含 /api/v1/）
 */
function getBaseUrl(): string {
  const apiUrl = import.meta.env.VITE_BASE_API || 'http://localhost:8000/api/v1/';
  return apiUrl.replace('/api/v1/', '').replace(/\/$/, '');
}

/**
 * 获取媒体文件的完整 URL
 * 用于展示图片时，将相对路径转换为完整 URL
 * 
 * @param relativePath 相对路径（如 /media/xxx.jpg 或 media/xxx.jpg）
 * @returns 完整 URL（如 http://localhost:8000/media/xxx.jpg）
 * 
 * @example
 * getMediaUrl('/media/category_covers/image.jpg')
 * // => 'http://localhost:8000/media/category_covers/image.jpg'
 * 
 * getMediaUrl('http://example.com/image.jpg')
 * // => 'http://example.com/image.jpg' (已是完整URL，直接返回)
 */
export function getMediaUrl(relativePath: string | undefined | null): string {
  // 空值处理
  if (!relativePath) {
    return '';
  }

  // 如果已经是完整的 URL，直接返回
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
    return relativePath;
  }

  const baseUrl = getBaseUrl();

  // 以 /media/ 开头
  if (relativePath.startsWith('/media/')) {
    return baseUrl + relativePath;
  }

  // 以 media/ 开头（无前导斜杠）
  if (relativePath.startsWith('media/')) {
    return baseUrl + '/' + relativePath;
  }

  // 以 / 开头的其他相对路径
  if (relativePath.startsWith('/')) {
    return baseUrl + relativePath;
  }

  // 其他情况（纯文件名或相对路径），默认添加 /media/ 前缀
  return baseUrl + '/media/' + relativePath;
}

/**
 * 判断是否为相对路径
 * @param path 路径字符串
 */
export function isRelativePath(path: string | undefined | null): boolean {
  if (!path) return false;
  return !path.startsWith('http://') && !path.startsWith('https://');
}
