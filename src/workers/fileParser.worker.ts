/**
 * 文件解析 Web Worker
 * 在后台线程解析文章文件内容
 */

import type {
  WorkerParseRequest,
  WorkerParseResponse,
  ParsedArticleFile,
  MarkdownImage
} from "@/types/import";

/**
 * 提取 Markdown 标题（第一个 # 标题）
 */
function extractMarkdownTitle(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * 提取 HTML 标题（<title> 标签）
 */
function extractHtmlTitle(content: string): string | null {
  const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

/**
 * 提取 Markdown 中的图片引用
 */
function extractMarkdownImages(content: string): MarkdownImage[] {
  const images: MarkdownImage[] = [];
  const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    images.push({
      alt: match[1] || "",
      originalPath: match[2]
    });
  }

  return images;
}

/**
 * 获取文件扩展名
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return "";
  return fileName.substring(lastDot + 1).toLowerCase();
}

/**
 * 获取不含扩展名的文件名
 */
function getFileNameWithoutExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return fileName;
  return fileName.substring(0, lastDot);
}

/**
 * 生成唯一ID
 */
function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 解析单个文件
 */
async function parseFile(
  articleFile: File,
  coverImage: File | undefined,
  filePath: string
): Promise<ParsedArticleFile> {
  // 读取文件内容
  const content = await articleFile.text();
  const ext = getFileExtension(articleFile.name);
  const fileType = ext === "md" ? "markdown" : "html";

  // 提取标题
  let title: string | null = null;
  if (fileType === "markdown") {
    title = extractMarkdownTitle(content);
  } else {
    title = extractHtmlTitle(content);
  }

  // 如果没有提取到标题，使用文件名
  if (!title) {
    title = getFileNameWithoutExtension(articleFile.name);
  }

  // 提取 Markdown 图片引用
  const markdownImages: MarkdownImage[] =
    fileType === "markdown" ? extractMarkdownImages(content) : [];

  return {
    id: generateUniqueId(),
    fileName: getFileNameWithoutExtension(articleFile.name),
    fileNameWithExt: articleFile.name,
    filePath,
    fileType,
    title,
    content,
    coverImage,
    coverImageName: coverImage?.name,
    markdownImages,
    file: articleFile
  };
}

/**
 * 处理消息
 */
self.addEventListener("message", async (event: MessageEvent) => {
  const request = event.data as WorkerParseRequest;

  if (request.type === "parse") {
    try {
      const results: ParsedArticleFile[] = [];
      const total = request.files.length;

      for (let i = 0; i < total; i++) {
        const { articleFile, coverImage, filePath } = request.files[i];

        // 发送进度
        const progress: WorkerParseResponse = {
          type: "progress",
          current: i + 1,
          total
        };
        self.postMessage(progress);

        // 解析文件
        const parsed = await parseFile(articleFile, coverImage, filePath);
        results.push(parsed);
      }

      // 发送完成消息
      const response: WorkerParseResponse = {
        type: "complete",
        data: results
      };
      self.postMessage(response);
    } catch (error) {
      // 发送错误消息
      const errorResponse: WorkerParseResponse = {
        type: "error",
        error: error instanceof Error ? error.message : String(error)
      };
      self.postMessage(errorResponse);
    }
  }
});

// 导出空对象以符合 TypeScript 模块要求
export { };

