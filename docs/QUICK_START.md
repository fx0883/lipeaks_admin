# 🚀 Lipeaks Admin 新功能快速上手指南

## 📌 本次更新内容

本次更新为Lipeaks Admin系统添加了两大核心功能：

1. **🛡️ 统一错误处理系统** - 让错误提示更友好
2. **📥 CMS文章导出功能** - 批量导出文章为多种格式

---

## 🛡️ 统一错误处理系统

### 什么变了？

**以前：**
```javascript
catch (error) {
  ElMessage.error(error.message || '操作失败');
}
```

**现在：**
```javascript
catch (error) {
  await handleError(error); // 自动智能处理
}
```

### 立即开始使用

#### 1. 在组件中使用

```vue
<script setup>
import { useErrorHandling } from '@/composables/useErrorHandling';

const { showSuccess, showError, handleError } = useErrorHandling();

// 成功提示
showSuccess('操作成功');

// 错误提示
showError('操作失败');

// 处理API错误
try {
  await someApiCall();
} catch (error) {
  await handleError(error); // 自动分类和显示
}
</script>
```

#### 2. 表单错误处理

```vue
<template>
  <FormFieldWrapper label="用户名" :error="getFieldError('username')" required>
    <el-input 
      v-model="form.username" 
      @input="clearFieldError('username')" 
    />
  </FormFieldWrapper>
  
  <el-button @click="handleSubmit" :loading="errorState.isSubmitting">
    提交
  </el-button>
</template>

<script setup>
import { useFormErrorHandling } from '@/composables/useErrorHandling';
import { FormFieldWrapper } from '@/components/ErrorHandling';

const { safeSubmit, getFieldError, clearFieldError, errorState } = useFormErrorHandling();

const handleSubmit = async () => {
  await safeSubmit(async () => {
    return await createUser(form);
  });
};
</script>
```

#### 3. 列表加载错误处理

```vue
<script setup>
import { useListErrorHandling } from '@/composables/useErrorHandling';

const { loading, error, safeLoad, retry } = useListErrorHandling();

const loadData = async () => {
  const result = await safeLoad(async () => {
    return await getUserList();
  });
  
  if (result) {
    users.value = result.data.results;
  }
};
</script>
```

### 核心特性

✅ **自动Token刷新** - Token过期时自动刷新，无需手动处理  
✅ **智能错误提示** - 根据错误严重程度选择提示方式  
✅ **字段级验证** - 表单验证错误精确显示在字段下  
✅ **操作指引** - 明确告诉用户下一步怎么做  
✅ **错误恢复** - 网络错误自动重试  

### 测试工具

**开发环境控制台测试：**
```javascript
// 快速测试各种错误类型
window.testErrorHandling.quick()

// 完整测试套件
window.testErrorHandling.full()

// 测试特定错误
window.testErrorHandling.showError('licenseExpired')

// 列出所有错误类型
window.testErrorHandling.listTypes()
```

---

## 📥 CMS文章导出功能

### 如何使用？

#### 方式1：从文章列表页

1. 打开文章列表：`/cms/article`
2. 点击**绿色的"导出文章"按钮**
3. 进入导出页面

#### 方式2：直接访问

直接访问：`http://localhost:3000/cms/article/export`

### 导出步骤

#### Step 1: 筛选文章

**按分类筛选：**
- 在"选择分类"下拉框选择分类
- 系统自动加载该分类的文章

**按关键词搜索：**
- 在"关键词"输入框输入搜索词
- 点击搜索或按Enter

**按状态筛选：**
- 选择"已发布"、"草稿"或"待审核"

#### Step 2: 选择文章

- 勾选要导出的文章
- 或点击"全选当前页"
- 可点击"预览"查看文章内容

#### Step 3: 配置导出

**选择导出格式：**
- **Markdown (.md)** - 推荐用于文档编辑
- **HTML (.html)** - 推荐用于网页发布
- **纯文本 (.txt)** - 最简单格式
- **JSON (.json)** - 程序处理

**是否包含图片：**
- **是** - 下载图片并打包（耗时更长）
- **否** - 只保留图片URL链接（快速）

#### Step 4: 开始导出

1. 确认已选择文章
2. 点击"导出 X 篇文章"按钮
3. 等待进度完成
4. 浏览器自动下载zip文件

### 导出示例

**示例1：导出技术博客为Markdown**
```
1. 选择分类："技术博客"
2. 格式：Markdown (.md)
3. 包含图片：是
4. 选择所有文章
5. 点击导出
6. 下载：articles_技术博客_2025-01-08.zip
```

**示例2：快速导出为文本**
```
1. 搜索关键词："Vue3"
2. 格式：纯文本 (.txt)
3. 包含图片：否
4. 选择相关文章
5. 点击导出
6. 下载：articles_2025-01-08.zip
```

### ZIP包结构

```
articles_技术博客_2025-01-08.zip
├── articles/
│   ├── 123-Vue3响应式原理.md
│   ├── 124-TypeScript进阶.md
│   └── 125-性能优化技巧.md
└── images/ (如果包含图片)
    ├── article_123_diagram.png
    └── article_124_screenshot.jpg
```

### 常见问题

**Q: 导出按钮是灰色的？**  
A: 需要先选择文章，勾选复选框即可。

**Q: 导出速度慢？**  
A: 
- 关闭"包含图片"选项可以大幅加速
- 减少单次导出的文章数量
- 确保网络连接稳定

**Q: 部分图片丢失？**  
A: 
- 检查浏览器控制台，查看哪些图片下载失败
- 图片URL可能无法访问或有CORS限制
- 失败的图片会自动跳过，不影响整体导出

**Q: 想要导出PDF格式？**  
A: 当前版本暂不支持PDF，计划在后续版本添加。暂时可以导出为HTML后用浏览器打印为PDF。

---

## 🎯 实用技巧

### 技巧1：快速导出全部文章

1. 访问导出页面
2. 不选择分类（显示全部）
3. 点击"全选当前页"
4. 翻页继续选择
5. 导出

### 技巧2：只导出图片

虽然系统暂不支持单独导出图片，但可以：
1. 导出为HTML格式
2. 包含图片：是
3. 解压后images文件夹包含所有图片

### 技巧3：批量备份

定期备份策略：
1. 每周导出"已发布"分类
2. 格式选择Markdown
3. 包含图片：是
4. 保存到本地或云盘

### 技巧4：迁移到其他平台

1. 导出为JSON格式（包含原始数据）
2. 或导出为Markdown格式（通用格式）
3. 使用目标平台的导入工具导入

---

## 📚 相关文档

### 详细文档

- **错误处理系统**: `src/components/ErrorHandling/README.md`
- **文章导出功能**: `docs/cms/article_export_guide.md`
- **实施总结**: `docs/IMPLEMENTATION_SUMMARY.md`

### 在线测试

- **错误处理示例**: http://localhost:3000/error-example (开发环境)
- **文章导出页面**: http://localhost:3000/cms/article/export

---

## 🆘 需要帮助？

### 遇到问题

1. **查看文档** - 详细的使用指南
2. **查看控制台** - 开发环境有详细日志
3. **使用测试工具** - `window.testErrorHandling`
4. **联系技术支持** - 提交issue或联系开发团队

### 反馈建议

如果您有任何建议或发现bug，请：
- 提交GitHub Issue
- 联系开发团队
- 在团队协作工具中反馈

---

**更新日期**: 2025-01-08  
**版本**: v1.0.0  
**文档维护**: Lipeaks Admin Team

祝您使用愉快！🎉
