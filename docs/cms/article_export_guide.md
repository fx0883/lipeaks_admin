# CMS文章导出功能使用指南

## 概述

CMS文章导出功能允许用户批量导出文章为txt、md、html或json格式，支持图片下载并打包为zip文件。

## 功能特点

✅ **多种格式支持**：txt、md、html、json  
✅ **图片下载**：自动下载文章中的图片并包含在zip中  
✅ **批量导出**：支持批量选择和导出  
✅ **分类筛选**：按分类查找文章  
✅ **搜索功能**：按关键词搜索文章  
✅ **进度显示**：实时显示导出和下载进度  
✅ **错误处理**：集成统一错误处理系统  

## 使用方法

### 1. 访问导出页面

**方式1：从文章列表页跳转**
```
文章列表页 → 点击"导出文章"按钮 → 导出页面
```

**方式2：直接访问URL**
```
/cms/article/export
```

### 2. 选择文章

**按分类筛选：**
1. 在"选择分类"下拉框中选择分类
2. 系统自动加载该分类下的所有文章

**搜索文章：**
1. 在"关键词"输入框输入搜索词
2. 点击搜索按钮或按Enter键
3. 系统显示匹配的文章

**多选文章：**
1. 勾选要导出的文章
2. 或点击"全选当前页"按钮选择当前页所有文章

### 3. 配置导出选项

**导出格式：**
- **Markdown (.md)**：适合文档编辑和版本控制
- **HTML (.html)**：适合网页发布和浏览
- **纯文本 (.txt)**：适合简单查看和编辑
- **JSON (.json)**：适合程序处理和数据交换

**包含图片：**
- **是**：下载文章中的图片并包含在zip中
- **否**：只导出文章内容，图片使用原始URL链接

### 4. 开始导出

1. 确认已选择文章
2. 确认导出配置
3. 点击"导出"按钮
4. 等待导出完成
5. 浏览器自动下载zip文件

## 导出格式说明

### Markdown格式 (.md)

```markdown
# 文章标题

文章内容...

![图片](images/article_123_image.jpg)
```

**特点：**
- 纯文本格式，易于编辑
- 支持版本控制（Git）
- 可在各种Markdown编辑器中打开
- 图片使用相对路径引用

### HTML格式 (.html)

```html
<!DOCTYPE html>
<html>
<head>
  <title>文章标题</title>
  <style>/* 样式 */</style>
</head>
<body>
  <h1>文章标题</h1>
  <div class="content">文章内容...</div>
</body>
</html>
```

**特点：**
- 包含完整的HTML结构
- 内置CSS样式
- 可在浏览器中直接打开
- 图片嵌入或引用

### 纯文本格式 (.txt)

```
文章标题

文章内容...
```

**特点：**
- 最简单的格式
- 任何文本编辑器都可打开
- 文件体积最小
- 不包含格式信息

### JSON格式 (.json)

```json
{
  "id": 123,
  "title": "文章标题",
  "content": "文章内容..."
}
```

**特点：**
- 结构化数据
- 适合程序处理
- 便于数据迁移
- 包含原始数据

## 文件命名规则

### 单个文章文件
```
格式：{文章ID}-{文章标题}.{格式}
示例：123-Vue3响应式原理详解.md
```

### ZIP包文件
```
格式：articles_{分类名}_{日期}.zip
示例：articles_技术博客_2025-01-08.zip

如果未选择分类：
articles_2025-01-08.zip
```

### 图片文件
```
格式：article_{文章ID}_{原始文件名}
示例：article_123_screenshot.png
```

## ZIP包结构

```
articles_技术博客_2025-01-08.zip
├── articles/
│   ├── 123-Vue3响应式原理详解.md
│   ├── 124-TypeScript高级技巧.md
│   └── 125-性能优化实践.md
└── images/
    ├── article_123_diagram.png
    ├── article_124_code.png
    └── article_125_chart.jpg
```

## 导出进度

### 进度显示

**文章导出进度：**
```
正在导出文章... 3 / 10
[████████░░░░] 80%
```

**图片下载进度：**
```
正在下载图片... 15 / 20
[█████████░░░] 75%
```

### 导出完成统计

```
✓ 导出完成

文章数量: 10
图片数量: 20
耗时: 5.2秒
```

## API调用示例

### 使用导出服务

```typescript
import { exportService } from '@/utils/export/exportService';

// 导出多篇文章
const stats = await exportService.exportArticles({
  articles: selectedArticles,
  format: 'md',
  includeImages: true,
  categoryName: '技术博客',
  onProgress: (current, total, stage) => {
    console.log(`${stage}: ${current}/${total}`);
  },
  onComplete: (stats) => {
    console.log('导出完成:', stats);
  }
});

// 导出单篇文章
await exportService.exportSingleArticle(article, 'md');
```

### 使用便捷函数

```typescript
import { exportArticles, exportSingleArticle } from '@/utils/export/exportService';

// 批量导出
await exportArticles({
  articles: [article1, article2, article3],
  format: 'md',
  includeImages: true
});

// 单个导出
await exportSingleArticle(article, 'html');
```

## 图片处理

### 图片URL解析

系统自动识别以下格式的图片：

**HTML格式：**
```html
<img src="/uploads/image.jpg">
<img src="https://example.com/image.png">
```

**Markdown格式：**
```markdown
![描述](/uploads/image.jpg)
![描述](https://example.com/image.png)
```

### 图片下载逻辑

1. 从文章内容中提取所有图片URL
2. 解析为绝对URL
3. 并发下载图片（最多3次重试）
4. 添加到zip的images文件夹
5. 下载失败的图片记录日志，继续处理

### 图片文件命名

```
article_{文章ID}_{原始文件名}

示例：
article_123_screenshot.png
article_124_diagram_20250108_abc123.jpg（原始文件名不可用时）
```

## 错误处理

### 常见错误

**1. 没有选择文章**
```
提示：请先选择要导出的文章
```

**2. 文章加载失败**
```
错误：网络连接失败，请稍后重试
操作：提供重试按钮
```

**3. 图片下载失败**
```
处理：记录失败的图片，继续导出其他内容
提示：部分图片下载失败，已跳过
```

**4. 导出失败**
```
错误：文章导出失败
操作：显示详细错误信息，提供重试选项
```

## 性能优化

### 大批量导出建议

**文章数量限制：**
- 建议单次导出 ≤ 100篇文章
- 超过100篇建议分批导出

**图片处理：**
- 图片并发下载，提升速度
- 失败图片自动跳过，不阻塞整体进度
- 图片缓存，避免重复下载

**内存优化：**
- 导出完成后自动清理缓存
- 大文件采用分块处理
- 进度实时更新，避免假死

### 预估文件大小

系统会自动估算导出文件大小：
- 文章内容：按字符数计算
- 图片：平均每张100KB
- 显示在导出按钮上方

## 快捷操作

### 在文章列表页添加导出按钮

```vue
<template>
  <!-- 文章列表页 -->
  <el-button @click="handleGotoExport">
    导出文章
  </el-button>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const handleGotoExport = () => {
  router.push('/cms/article/export');
};
</script>
```

### 导出选中文章

```vue
<script setup>
import { exportArticles } from '@/utils/export/exportService';

const handleQuickExport = async () => {
  if (selectedArticles.length === 0) {
    ElMessage.warning('请先选择文章');
    return;
  }

  await exportArticles({
    articles: selectedArticles,
    format: 'md',
    includeImages: true,
    onProgress: (current, total) => {
      console.log(`${current}/${total}`);
    }
  });
};
</script>
```

## 国际化支持

### 添加导出相关翻译

`locales/zh-CN.yaml`:
```yaml
cms:
  article:
    export: "导出文章"
    exportSuccess: "导出成功"
    exportFailed: "导出失败"
    selectArticlesToExport: "请选择要导出的文章"
```

`locales/en.yaml`:
```yaml
cms:
  article:
    export: "Export Articles"
    exportSuccess: "Export successful"
    exportFailed: "Export failed"
    selectArticlesToExport: "Please select articles to export"
```

## 故障排除

### 常见问题

**Q: 导出的zip文件打不开？**  
A: 确保浏览器支持Blob下载，清除浏览器缓存后重试。

**Q: 图片显示不出来？**  
A: 检查图片URL是否可访问，确保有正确的CORS配置。

**Q: 导出速度慢？**  
A: 关闭"包含图片"选项，或减少单次导出的文章数量。

**Q: 部分图片丢失？**  
A: 查看浏览器控制台，确认哪些图片下载失败，检查图片URL。

**Q: Markdown格式不正确？**  
A: 如果文章内容是HTML格式，会自动转换为Markdown，可能有些格式丢失。

## 最佳实践

1. **分批导出**：大量文章建议分批导出，每批50-100篇
2. **选择合适格式**：Markdown适合文档，HTML适合网页，JSON适合数据处理
3. **图片处理**：如果不需要离线阅读，可关闭图片下载加快速度
4. **网络状况**：网络不稳定时建议关闭图片下载
5. **文件命名**：文章标题避免使用特殊字符

## 技术架构

### 核心模块

```
src/utils/export/
├── articleExporter.ts   # 文章导出核心类
├── imageHandler.ts      # 图片下载处理
└── exportService.ts     # 导出服务封装

src/views/cms/article/
└── export.vue          # 导出页面

src/components/
└── PageHeader.vue      # 页面头部组件
```

### 依赖库

- **jszip** (3.10.1): 创建zip文件
- **file-saver** (2.0.5): 触发浏览器下载

### 工作流程

```
1. 用户选择文章 
   ↓
2. 配置导出格式
   ↓  
3. 点击导出按钮
   ↓
4. 生成文章文件（txt/md/html/json）
   ↓
5. 下载文章图片（如果启用）
   ↓
6. 打包为zip文件
   ↓
7. 触发浏览器下载
   ↓
8. 显示导出统计
```

## 示例代码

### 完整导出示例

```vue
<template>
  <div>
    <el-button @click="handleExport">导出文章</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { exportArticles } from '@/utils/export/exportService';
import { useErrorHandling } from '@/composables/useErrorHandling';

const { handleError, showSuccess } = useErrorHandling();
const selectedArticles = ref([]);

const handleExport = async () => {
  try {
    const stats = await exportArticles({
      articles: selectedArticles.value,
      format: 'md',
      includeImages: true,
      categoryName: '技术博客',
      onProgress: (current, total, stage) => {
        console.log(`${stage}: ${current}/${total}`);
      },
      onComplete: (stats) => {
        showSuccess(`导出完成！${stats.exportedArticles}篇文章`);
      }
    });
    
    console.log('导出统计:', stats);
  } catch (error) {
    await handleError(error);
  }
};
</script>
```

### 自定义格式转换

```typescript
// 扩展ArticleExporter类
class CustomArticleExporter extends ArticleExporter {
  protected generateCustomFormat(article: Article): string {
    // 自定义格式逻辑
    return `自定义内容`;
  }
}
```

## 路由配置

```typescript
// src/router/modules/remaining.ts
{
  path: "/cms/article/export",
  name: "ArticleExport",
  component: () => import("@/views/cms/article/export.vue"),
  meta: {
    title: "导出文章",
    showLink: false,
    rank: 105
  }
}
```

## 更新日志

### v1.0.0 (2025-01-08)
- ✅ 初始版本发布
- ✅ 支持txt、md、html、json格式
- ✅ 支持图片下载和打包
- ✅ 集成统一错误处理系统
- ✅ 实现进度显示和统计
- ✅ 支持分类筛选和搜索

## 后续计划

- [ ] 支持更多格式（PDF、DOCX）
- [ ] 支持自定义模板
- [ ] 支持导出历史记录
- [ ] 支持定时导出任务
- [ ] 支持导出配置预设

---

**维护者**: Lipeaks CMS Team  
**最后更新**: 2025-01-08  
**版本**: 1.0.0
