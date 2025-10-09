<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload, FolderOpened, Document, Picture, Loading } from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import type {
  ParsedArticleFile,
  ImportProgressItem,
  ImportStatistics,
  WorkerParseRequest,
  WorkerParseResponse
} from "@/types/import";
import type { Category } from "@/types/cms";
import { organizeFiles, matchCoverImage } from "@/utils/cms/fileParser";
import { processMarkdownImages } from "@/utils/cms/markdownProcessor";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const cmsStore = useCmsStoreHook();

// 步骤状态
const currentStep = ref<1 | 2 | 3 | 4>(1);

// 步骤1: 分类和标签选择
const selectedCategoryIds = ref<number[]>([]);
const selectedTagIds = ref<number[]>([]);
const categories = ref<Category[]>([]);
const tags = ref<any[]>([]);
const loadingCategories = ref(false);
const loadingTags = ref(false);

// 步骤2: 文件选择
const fileInputRef = ref<HTMLInputElement | null>(null);
const selectedFolderName = ref("");
const isParsingFiles = ref(false);

// 步骤3: 预览列表
const parsedArticles = ref<ParsedArticleFile[]>([]);
const selectedArticles = ref<string[]>([]); // 选中的文章IDs
const editingTitleId = ref<string | null>(null);
const editingTitleValue = ref("");

// 步骤4: 导入进度
const importProgress = ref<ImportProgressItem[]>([]);
const isImporting = ref(false);
const importStatistics = ref<ImportStatistics>({
  total: 0,
  success: 0,
  failed: 0,
  pending: 0
});

// Worker 相关
let worker: Worker | null = null;
let allFilesMap = new Map<string, File>();

// 统计信息
const statistics = computed(() => {
  const total = parsedArticles.value.length;
  const markdown = parsedArticles.value.filter(
    a => a.fileType === "markdown"
  ).length;
  const html = total - markdown;
  const withCover = parsedArticles.value.filter(a => a.coverImage).length;

  return {
    total,
    markdown,
    html,
    withCover
  };
});

// 获取分类列表
const fetchCategories = async () => {
  console.log("[ArticleImport] 开始获取分类列表");
  loadingCategories.value = true;
  try {
    const response = await cmsStore.fetchCategoryList();
    console.log("[ArticleImport] 获取分类列表成功:", response);

    // 从响应中提取分类数据 - 兼容多种响应格式
    if (response && Array.isArray(response)) {
      categories.value = response;
      console.log(
        "[ArticleImport] 分类数据已更新, 数量:",
        categories.value.length
      );
    } else if (response && response.data && Array.isArray(response.data)) {
      categories.value = response.data;
      console.log(
        "[ArticleImport] 分类数据已更新(从data字段), 数量:",
        categories.value.length
      );
    } else {
      console.warn("[ArticleImport] 分类数据格式异常:", response);
      categories.value = [];
    }

    logger.debug("[ArticleImport] 分类列表加载成功:", categories.value.length);
  } catch (error) {
    console.error("[ArticleImport] 获取分类列表失败:", error);
    logger.error("[ArticleImport] 获取分类列表失败:", error);
    ElMessage.error(t("cms.category.fetchListFailed"));
    categories.value = [];
  } finally {
    loadingCategories.value = false;
  }
};

// 获取标签列表
const fetchTags = async () => {
  console.log("[ArticleImport] 开始获取标签列表");
  loadingTags.value = true;
  try {
    const response = await cmsStore.fetchTagList();
    console.log("[ArticleImport] 获取标签列表成功:", response);

    // 从响应中提取标签数据
    if (
      response &&
      response.data &&
      response.data.results &&
      Array.isArray(response.data.results)
    ) {
      tags.value = response.data.results;
      console.log(
        "[ArticleImport] 标签数据已更新(分页格式), 数量:",
        tags.value.length
      );
    } else if (response && response.data && Array.isArray(response.data)) {
      tags.value = response.data;
      console.log(
        "[ArticleImport] 标签数据已更新(数组格式), 数量:",
        tags.value.length
      );
    } else if (response && Array.isArray(response)) {
      tags.value = response;
      console.log(
        "[ArticleImport] 标签数据已更新(直接数组), 数量:",
        tags.value.length
      );
    } else {
      console.warn("[ArticleImport] 标签数据格式异常:", response);
      tags.value = [];
    }

    logger.debug("[ArticleImport] 标签列表加载成功:", tags.value.length);
  } catch (error) {
    console.error("[ArticleImport] 获取标签列表失败:", error);
    logger.error("[ArticleImport] 获取标签列表失败:", error);
    ElMessage.error(t("cms.tag.fetchListFailed"));
    tags.value = [];
  } finally {
    loadingTags.value = false;
  }
};

// 步骤导航
const goToStep = (step: 1 | 2 | 3 | 4) => {
  if (step === 2 && selectedCategoryIds.value.length === 0) {
    ElMessage.warning(t("cms.article.noCategorySelected"));
    return;
  }
  if (step === 3 && parsedArticles.value.length === 0) {
    ElMessage.warning(t("cms.article.noFilesSelected"));
    return;
  }
  currentStep.value = step;
};

// 触发文件选择
const handleSelectFolder = () => {
  fileInputRef.value?.click();
};

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = input.files;

  if (!files || files.length === 0) {
    return;
  }

  // 获取文件夹名称
  const firstFile = files[0] as any;
  if (firstFile.webkitRelativePath) {
    const pathParts = firstFile.webkitRelativePath.split("/");
    selectedFolderName.value = pathParts[0];
  } else {
    selectedFolderName.value = t("cms.article.folderSelected");
  }

  await parseFiles(files);
};

// 解析文件
const parseFiles = async (fileList: FileList) => {
  isParsingFiles.value = true;
  parsedArticles.value = [];

  try {
    logger.debug("[ArticleImport] 开始解析文件");

    // 组织文件
    const { articleFiles, imageFiles, allFilesMap: filesMap } =
      organizeFiles(fileList);
    allFilesMap = filesMap;

    logger.debug(
      `[ArticleImport] 文件组织完成: ${articleFiles.length} 篇文章`
    );

    if (articleFiles.length === 0) {
      ElMessage.warning(t("cms.article.noArticlesToImport"));
      isParsingFiles.value = false;
      return;
    }

    // 准备 Worker 数据
    const workerFiles = articleFiles.map(file => {
      const coverImage = matchCoverImage(file.name, imageFiles);
      const filePath = (file as any).webkitRelativePath || file.name;
      return {
        articleFile: file,
        coverImage,
        filePath
      };
    });

    // 初始化 Worker
    worker = new Worker(
      new URL("@/workers/fileParser.worker.ts", import.meta.url),
      { type: "module" }
    );

    // 监听 Worker 消息
    worker.onmessage = (event: MessageEvent<WorkerParseResponse>) => {
      const response = event.data;

      if (response.type === "progress") {
        logger.debug(
          `[ArticleImport] 解析进度: ${response.current}/${response.total}`
        );
      } else if (response.type === "complete") {
        logger.debug("[ArticleImport] 解析完成");
        parsedArticles.value = response.data || [];
        isParsingFiles.value = false;
        goToStep(3);

        // 清理 Worker
        if (worker) {
          worker.terminate();
          worker = null;
        }
      } else if (response.type === "error") {
        logger.error("[ArticleImport] 解析失败:", response.error);
        ElMessage.error(t("cms.article.parsedFailed") + ": " + response.error);
        isParsingFiles.value = false;

        // 清理 Worker
        if (worker) {
          worker.terminate();
          worker = null;
        }
      }
    };

    worker.onerror = error => {
      logger.error("[ArticleImport] Worker 错误:", error);
      ElMessage.error(t("cms.article.parsedFailed"));
      isParsingFiles.value = false;

      if (worker) {
        worker.terminate();
        worker = null;
      }
    };

    // 发送解析请求
    const request: WorkerParseRequest = {
      type: "parse",
      files: workerFiles
    };
    worker.postMessage(request);
  } catch (error) {
    logger.error("[ArticleImport] 解析文件失败:", error);
    ElMessage.error(t("cms.article.parsedFailed"));
    isParsingFiles.value = false;
  }
};

// 删除文章
const handleDeleteArticle = (id: string) => {
  parsedArticles.value = parsedArticles.value.filter(a => a.id !== id);
  // 同时从选中列表中移除
  const index = selectedArticles.value.indexOf(id);
  if (index > -1) {
    selectedArticles.value.splice(index, 1);
  }
};

// 批量删除
const handleBatchDelete = () => {
  if (selectedArticles.value.length === 0) {
    ElMessage.warning(t("cms.article.selectArticlesToDelete"));
    return;
  }

  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedArticles.value.length} 篇文章吗？`,
    t("common.confirm"),
    {
      type: "warning"
    }
  )
    .then(() => {
      parsedArticles.value = parsedArticles.value.filter(
        a => !selectedArticles.value.includes(a.id)
      );
      selectedArticles.value = [];
      ElMessage.success(t("common.deleteSuccess"));
    })
    .catch(() => {
      // 取消删除
    });
};

// 编辑标题
const startEditTitle = (article: ParsedArticleFile) => {
  editingTitleId.value = article.id;
  editingTitleValue.value = article.title;
};

const saveEditTitle = (article: ParsedArticleFile) => {
  if (editingTitleValue.value.trim()) {
    article.title = editingTitleValue.value.trim();
  }
  editingTitleId.value = null;
};

const cancelEditTitle = () => {
  editingTitleId.value = null;
};

// 全选/反选
const handleSelectionChange = (selection: ParsedArticleFile[]) => {
  selectedArticles.value = selection.map(a => a.id);
};

// 开始导入
const startImport = async () => {
  if (parsedArticles.value.length === 0) {
    ElMessage.warning(t("cms.article.noArticlesToImport"));
    return;
  }

  if (selectedCategoryIds.value.length === 0) {
    ElMessage.warning(t("cms.article.noCategorySelected"));
    return;
  }

  try {
    await ElMessageBox.confirm(
      t("cms.article.confirmImport", { count: parsedArticles.value.length }),
      t("common.confirm"),
      {
        type: "info"
      }
    );
  } catch {
    return;
  }

  isImporting.value = true;
  currentStep.value = 4;

  // 初始化进度
  importProgress.value = parsedArticles.value.map(article => ({
    ...article,
    status: "pending" as const,
    currentStep: t("cms.article.importStatusPending")
  }));

  importStatistics.value = {
    total: parsedArticles.value.length,
    success: 0,
    failed: 0,
    pending: parsedArticles.value.length
  };

  // 逐个导入
  for (const article of importProgress.value) {
    try {
      // 更新状态
      article.status = "uploading";
      article.currentStep = t("cms.article.preparing");

      // 处理 Markdown 图片
      if (article.fileType === "markdown" && article.markdownImages.length > 0) {
        article.currentStep = t("cms.article.uploadingImages");
        const processedContent = await processMarkdownImages(
          article.content,
          article.filePath,
          allFilesMap,
          (current, total, fileName) => {
            article.currentStep = `${t("cms.article.uploadingImages")} (${current}/${total}) - ${fileName}`;
          }
        );
        article.content = processedContent;
      }

      // 上传封面图
      let coverImageUrl = "";
      if (article.coverImage) {
        article.currentStep = t("cms.article.uploadingCover");
        const coverResponse = await cmsStore.uploadCoverImage(
          article.coverImage,
          "article_covers"
        );
        coverImageUrl = coverResponse.url;
      }

      // 创建文章
      article.currentStep = t("cms.article.creatingArticle");
      const articleData: any = {
        title: article.title,
        content: article.content,
        content_type: article.fileType === "markdown" ? "markdown" : "html",
        status: "published",
        category_ids: selectedCategoryIds.value,
        tag_ids: selectedTagIds.value,
        cover_image: coverImageUrl || undefined,
        visibility: "public",
        allow_comment: true,
        is_featured: false,
        is_pinned: false
      };

      const response = await cmsStore.createArticle(articleData);

      // 成功
      article.status = "success";
      article.articleId = response.data?.id;
      article.currentStep = t("cms.article.importStatusSuccess");
      importStatistics.value.success++;
      importStatistics.value.pending--;
    } catch (error) {
      // 失败
      article.status = "failed";
      article.error = error instanceof Error ? error.message : String(error);
      article.currentStep = t("cms.article.importStatusFailed");
      importStatistics.value.failed++;
      importStatistics.value.pending--;
      logger.error(`[ArticleImport] 导入文章失败: ${article.title}`, error);
    }
  }

  isImporting.value = false;
  ElMessage.success(
    `${t("cms.article.importComplete")} 成功: ${importStatistics.value.success}, 失败: ${importStatistics.value.failed}`
  );
};

// 返回列表
const backToList = () => {
  router.push("/cms/article");
};

// 组件挂载
onMounted(() => {
  fetchCategories();
  fetchTags();
});

// 组件卸载
onUnmounted(() => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
});
</script>

<template>
  <div class="article-import-container">
    <!-- 标题 -->
    <div class="import-header">
      <h2 class="import-title">{{ t("cms.article.importTitle") }}</h2>
      <el-button @click="backToList">
        {{ t("cms.article.backToList") }}
      </el-button>
    </div>

    <!-- 步骤指示器 -->
    <el-steps :active="currentStep - 1" align-center class="import-steps">
      <el-step :title="t('cms.article.importStep1')" />
      <el-step :title="t('cms.article.importStep2')" />
      <el-step :title="t('cms.article.importStep3')" />
      <el-step :title="t('cms.article.importStep4')" />
    </el-steps>

    <!-- 步骤内容 -->
    <el-card class="step-content">
      <!-- 步骤1: 选择分类和标签 -->
      <div v-if="currentStep === 1" class="step-1">
        <h3>{{ t("cms.article.importSelectCategory") }}</h3>
        <el-form label-width="120px">
          <el-form-item :label="t('cms.article.categories')">
            <el-select
              v-model="selectedCategoryIds"
              multiple
              filterable
              :placeholder="t('cms.article.categoriesPlaceholder')"
              :loading="loadingCategories"
              class="w-full"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
            <div class="selection-info">
              {{ categories.length }} {{ t("cms.article.categoriesAvailable") }}
            </div>
          </el-form-item>

          <el-form-item :label="t('cms.article.tags')">
            <el-select
              v-model="selectedTagIds"
              multiple
              filterable
              :placeholder="t('cms.article.tagsPlaceholder')"
              :loading="loadingTags"
              class="w-full"
            >
              <el-option
                v-for="tag in tags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              />
            </el-select>
            <div class="selection-info">
              {{ tags.length }} {{ t("cms.article.tagsAvailable") }}
            </div>
          </el-form-item>
        </el-form>

        <div class="step-actions">
          <el-button
            type="primary"
            :disabled="selectedCategoryIds.length === 0"
            @click="goToStep(2)"
          >
            {{ t("common.button.next") }}
          </el-button>
        </div>
      </div>

      <!-- 步骤2: 选择文件夹 -->
      <div v-if="currentStep === 2" class="step-2">
        <h3>{{ t("cms.article.selectFolder") }}</h3>

        <div class="folder-selector" @click="handleSelectFolder">
          <el-icon :size="48"><FolderOpened /></el-icon>
          <p>{{ t("cms.article.selectFolderTip") }}</p>
          <p v-if="selectedFolderName" class="selected-folder">
            {{ selectedFolderName }}
          </p>
        </div>

        <input
          ref="fileInputRef"
          type="file"
          webkitdirectory
          directory
          multiple
          style="display: none"
          @change="handleFileChange"
        />

        <div v-if="isParsingFiles" class="parsing-status">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>{{ t("cms.article.parsingFiles") }}</span>
        </div>

        <div class="step-actions">
          <el-button @click="goToStep(1)">
            {{ t("common.button.previous") }}
          </el-button>
        </div>
      </div>

      <!-- 步骤3: 预览列表 -->
      <div v-if="currentStep === 3" class="step-3">
        <div class="preview-header">
          <h3>{{ t("cms.article.previewList") }}</h3>
          <div class="statistics">
            <el-tag>{{ t("cms.article.totalArticles") }}: {{ statistics.total }}</el-tag>
            <el-tag type="success">{{ t("cms.article.markdownCount") }}: {{ statistics.markdown }}</el-tag>
            <el-tag type="info">{{ t("cms.article.htmlCount") }}: {{ statistics.html }}</el-tag>
            <el-tag type="warning">{{ t("cms.article.hasCoverImage") }}: {{ statistics.withCover }}</el-tag>
          </div>
        </div>

        <div class="table-actions">
          <el-button
            type="danger"
            size="small"
            :disabled="selectedArticles.length === 0"
            @click="handleBatchDelete"
          >
            {{ t("cms.article.deleteSelected") }} ({{ selectedArticles.length }})
          </el-button>
        </div>

        <el-table
          :data="parsedArticles"
          style="width: 100%"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column :label="t('cms.article.title')" min-width="200">
            <template #default="{ row }">
              <div v-if="editingTitleId === row.id" class="edit-title">
                <el-input
                  v-model="editingTitleValue"
                  size="small"
                  @keyup.enter="saveEditTitle(row)"
                  @keyup.esc="cancelEditTitle"
                />
                <el-button size="small" type="primary" @click="saveEditTitle(row)">
                  {{ t("common.save") }}
                </el-button>
                <el-button size="small" @click="cancelEditTitle">
                  {{ t("common.cancel") }}
                </el-button>
              </div>
              <div v-else @dblclick="startEditTitle(row)">
                {{ row.title }}
              </div>
            </template>
          </el-table-column>

          <el-table-column :label="t('cms.article.fileName')" width="180">
            <template #default="{ row }">
              {{ row.fileNameWithExt }}
            </template>
          </el-table-column>

          <el-table-column :label="t('cms.article.fileType')" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.fileType === 'markdown'" type="success">
                {{ t("cms.article.articleTypeMarkdown") }}
              </el-tag>
              <el-tag v-else type="info">
                {{ t("cms.article.articleTypeHtml") }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column :label="t('cms.article.importCoverImage')" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.coverImage" type="success">
                <el-icon><Picture /></el-icon>
                {{ t("cms.article.hasCoverImage") }}
              </el-tag>
              <el-tag v-else type="info">
                {{ t("cms.article.noCoverImage") }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column :label="t('common.operation')" width="100" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                size="small"
                text
                @click="handleDeleteArticle(row.id)"
              >
                {{ t("cms.article.removeArticle") }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="step-actions">
          <el-button @click="goToStep(2)">
            {{ t("common.button.previous") }}
          </el-button>
          <el-button
            type="primary"
            :disabled="parsedArticles.length === 0"
            @click="startImport"
          >
            {{ t("cms.article.startImport") }} ({{ parsedArticles.length }})
          </el-button>
        </div>
      </div>

      <!-- 步骤4: 导入进度 -->
      <div v-if="currentStep === 4" class="step-4">
        <h3>{{ t("cms.article.importing") }}</h3>

        <div class="import-statistics">
          <el-tag>{{ t("cms.article.totalArticles") }}: {{ importStatistics.total }}</el-tag>
          <el-tag type="success">{{ t("cms.article.successCount") }}: {{ importStatistics.success }}</el-tag>
          <el-tag type="danger">{{ t("cms.article.failedCount") }}: {{ importStatistics.failed }}</el-tag>
          <el-tag type="warning">{{ t("cms.article.pendingCount") }}: {{ importStatistics.pending }}</el-tag>
        </div>

        <el-progress
          :percentage="
            importStatistics.total > 0
              ? Math.round(
                  ((importStatistics.success + importStatistics.failed) /
                    importStatistics.total) *
                    100
                )
              : 0
          "
          :status="
            importStatistics.pending === 0
              ? importStatistics.failed === 0
                ? 'success'
                : 'warning'
              : undefined
          "
        />

        <el-table :data="importProgress" style="width: 100%; margin-top: 20px" border max-height="500">
          <el-table-column :label="t('cms.article.title')" min-width="200" prop="title" />
          <el-table-column :label="t('cms.article.importStatus')" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'pending'" type="info">
                {{ t("cms.article.importStatusPending") }}
              </el-tag>
              <el-tag v-else-if="row.status === 'uploading'" type="warning">
                {{ t("cms.article.importStatusUploading") }}
              </el-tag>
              <el-tag v-else-if="row.status === 'success'" type="success">
                {{ t("cms.article.importStatusSuccess") }}
              </el-tag>
              <el-tag v-else-if="row.status === 'failed'" type="danger">
                {{ t("cms.article.importStatusFailed") }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column :label="t('cms.article.currentStep')" min-width="200">
            <template #default="{ row }">
              {{ row.currentStep }}
            </template>
          </el-table-column>

          <el-table-column :label="t('cms.article.errorMessage')" min-width="200">
            <template #default="{ row }">
              <span v-if="row.error" class="error-message">{{ row.error }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="step-actions">
          <el-button v-if="!isImporting" type="primary" @click="backToList">
            {{ t("cms.article.backToList") }}
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.article-import-container {
  padding: 20px;
}

.import-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.import-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.import-steps {
  margin-bottom: 30px;
}

.step-content {
  min-height: 400px;
}

.step-1,
.step-2,
.step-3,
.step-4 {
  h3 {
    font-size: 18px;
    margin-bottom: 20px;
  }
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 30px;
}

.w-full {
  width: 100%;
}

.folder-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    background-color: #ecf5ff;
  }

  p {
    margin: 10px 0;
    color: #606266;
  }

  .selected-folder {
    color: #409eff;
    font-weight: 500;
  }
}

.parsing-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  color: #409eff;
  font-size: 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  .statistics {
    display: flex;
    gap: 10px;
  }
}

.table-actions {
  margin-bottom: 10px;
}

.edit-title {
  display: flex;
  gap: 5px;
  align-items: center;
}

.import-statistics {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
}

.selection-info {
  margin-top: 5px;
  color: #909399;
  font-size: 12px;
}
</style>

