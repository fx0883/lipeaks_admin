<template>
  <div class="article-export-page">
    <PageHeader
      title="导出文章"
      description="选择分类或搜索文章，导出为txt、md、html或json格式"
      :show-back="true"
    />

    <el-card class="filter-card">
      <template #header>
        <span>筛选和搜索</span>
      </template>

      <el-form :model="filterForm" label-width="100px">
        <el-row :gutter="20">
          <!-- 分类选择 -->
          <el-col :span="8">
            <el-form-item label="选择分类">
              <el-select
                v-model="filterForm.category_id"
                placeholder="全部分类"
                clearable
                filterable
                @change="handleCategoryChange"
              >
                <el-option label="全部分类" :value="undefined" />
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 文章状态 -->
          <el-col :span="8">
            <el-form-item label="文章状态">
              <el-select
                v-model="filterForm.status"
                placeholder="全部状态"
                clearable
                @change="handleFilterChange"
              >
                <el-option label="全部状态" :value="undefined" />
                <el-option label="已发布" value="published" />
                <el-option label="草稿" value="draft" />
                <el-option label="待审核" value="pending" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 搜索 -->
          <el-col :span="8">
            <el-form-item label="关键词">
              <el-input
                v-model="filterForm.search"
                placeholder="搜索文章标题或内容"
                clearable
                @clear="handleFilterChange"
                @keyup.enter="handleFilterChange"
              >
                <template #append>
                  <el-button :icon="Search" @click="handleFilterChange" />
                </template>
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 导出配置 -->
        <el-divider content-position="left">导出配置</el-divider>
        
        <el-row :gutter="20">
          <!-- 导出格式 -->
          <el-col :span="8">
            <el-form-item label="导出格式">
              <el-select v-model="exportConfig.format" placeholder="选择格式">
                <el-option label="Markdown (.md)" value="md" />
                <el-option label="HTML (.html)" value="html" />
                <el-option label="纯文本 (.txt)" value="txt" />
                <el-option label="JSON (.json)" value="json" />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 包含图片 -->
          <el-col :span="8">
            <el-form-item label="包含图片">
              <el-switch
                v-model="exportConfig.includeImages"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>

          <!-- 快速操作 -->
          <el-col :span="8">
            <el-form-item label=" ">
              <el-button 
                type="primary" 
                @click="handleSelectAll"
                :disabled="articles.length === 0"
              >
                全选所有
              </el-button>
              <el-button 
                @click="handleClearSelection"
                :disabled="selectedArticles.length === 0"
              >
                清空选择
              </el-button>
              <el-button
                v-if="articles.length < pagination.total && !loadingAll"
                type="warning"
                @click="fetchAllArticles"
                :loading="loadingAll"
              >
                加载更多
              </el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <!-- 文章列表 -->
    <el-card class="article-list-card">
      <template #header>
        <div class="card-header">
          <span>文章列表</span>
          <div class="header-actions">
            <el-tag type="info">
              找到 {{ pagination.total }} 篇文章
            </el-tag>
            <el-tag v-if="selectedArticles.length > 0" type="primary">
              已选 {{ selectedArticles.length }} 篇
            </el-tag>
          </div>
        </div>
      </template>

      <!-- 加载状态 -->
      <div v-if="loading || loadingAll" class="loading-container">
        <el-skeleton :rows="5" animated />
        <div v-if="loadingAll && allArticles.length > 0" class="loading-progress">
          <el-progress 
            :percentage="Math.round((allArticles.length / pagination.total) * 100)" 
            :format="() => `正在加载... ${allArticles.length} / ${pagination.total}`"
          />
        </div>
      </div>

      <!-- 文章表格 -->
      <el-table
        v-else
        ref="articleTableRef"
        :data="articles"
        @selection-change="handleSelectionChange"
        border
        stripe
        max-height="500px"
      >
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="预览" width="80">
          <template #default="{ row }">
            <el-button
              size="small"
              text
              type="primary"
              @click="handlePreview(row)"
            >
              预览
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 提示信息 -->
      <div class="info-container">
        <el-alert
          v-if="articles.length >= pagination.total"
          type="success"
          :closable="false"
          show-icon
        >
          <template #title>
            ✓ 已加载全部 {{ articles.length }} 篇文章，可直接选择导出
          </template>
        </el-alert>
        <el-alert
          v-else
          type="warning"
          :closable="false"
          show-icon
        >
          <template #title>
            当前显示 {{ articles.length }} / {{ pagination.total }} 篇文章，点击"加载更多"查看全部
          </template>
          <template #default>
            <el-button 
              size="small" 
              type="primary" 
              @click="fetchAllArticles"
              :loading="loadingAll"
            >
              {{ loadingAll ? '加载中...' : '立即加载全部' }}
            </el-button>
          </template>
        </el-alert>
      </div>
    </el-card>

    <!-- 导出操作区 -->
    <el-card class="export-action-card">
      <div class="export-summary">
        <div class="summary-item">
          <span class="label">已选文章：</span>
          <span class="value">{{ selectedArticles.length }} 篇</span>
        </div>
        <div class="summary-item">
          <span class="label">导出格式：</span>
          <span class="value">{{ getFormatLabel(exportConfig.format) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">包含图片：</span>
          <span class="value">{{ exportConfig.includeImages ? '是' : '否' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">预计大小：</span>
          <span class="value">{{ estimatedSize }}</span>
        </div>
      </div>

      <el-button
        type="primary"
        size="large"
        :icon="Download"
        :disabled="selectedArticles.length === 0"
        :loading="exporting"
        @click="handleExport"
        class="export-button"
      >
        {{ exporting ? '导出中...' : `导出 ${selectedArticles.length} 篇文章` }}
      </el-button>
    </el-card>

    <!-- 导出进度对话框 -->
    <el-dialog
      v-model="progressDialog.visible"
      title="导出进度"
      width="600px"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="!exporting"
    >
      <div class="progress-content">
        <!-- 文章导出进度 -->
        <div class="progress-section">
          <div class="progress-label">
            <span>正在导出文章...</span>
            <span class="progress-count">
              {{ progressDialog.articleCurrent }} / {{ progressDialog.articleTotal }}
            </span>
          </div>
          <el-progress
            :percentage="articleProgress"
            :status="articleProgress === 100 ? 'success' : undefined"
          />
        </div>

        <!-- 图片下载进度 -->
        <div v-if="exportConfig.includeImages" class="progress-section">
          <div class="progress-label">
            <span>正在下载图片...</span>
            <span class="progress-count">
              {{ progressDialog.imageCurrent }} / {{ progressDialog.imageTotal }}
            </span>
          </div>
          <el-progress
            :percentage="imageProgress"
            :status="imageProgress === 100 ? 'success' : undefined"
          />
        </div>

        <!-- 导出结果 -->
        <div v-if="exportResult" class="export-result">
          <el-result
            icon="success"
            title="导出完成"
            :sub-title="`成功导出 ${exportResult.exportedArticles} 篇文章，${exportResult.downloadedImages} 张图片`"
          >
            <template #extra>
              <div class="result-stats">
                <div class="stat-item">
                  <span class="stat-label">文章数量：</span>
                  <span class="stat-value">{{ exportResult.exportedArticles }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">图片数量：</span>
                  <span class="stat-value">{{ exportResult.downloadedImages }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">耗时：</span>
                  <span class="stat-value">{{ formatDuration(exportResult.duration) }}</span>
                </div>
              </div>
            </template>
          </el-result>
        </div>
      </div>

      <template #footer v-if="!exporting">
        <el-button type="primary" @click="progressDialog.visible = false">
          关闭
        </el-button>
      </template>
    </el-dialog>

    <!-- 文章预览对话框 -->
    <el-dialog
      v-model="previewDialog.visible"
      :title="previewDialog.article?.title"
      width="800px"
      class="preview-dialog"
    >
      <div class="preview-content" v-html="previewDialog.article?.content" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Search, Download } from '@element-plus/icons-vue';
import { useCmsStoreHook } from '@/store/modules/cms';
import { useErrorHandling } from '@/composables/useErrorHandling';
import { exportService, type ExportOptions, type ExportStats } from '@/utils/export/exportService';
import { getCategoryList } from '@/api/modules/cms';
import type { Article, Category, ArticleListParams } from '@/types/cms';
import PageHeader from '@/components/PageHeader.vue';
import dayjs from 'dayjs';
import logger from '@/utils/logger';

const cmsStore = useCmsStoreHook();
const { handleError, showSuccess } = useErrorHandling();

// 表格ref
const articleTableRef = ref();

// 分类列表
const categories = ref<Category[]>([]);

// 筛选表单
const filterForm = reactive<ArticleListParams>({
  category_id: undefined,
  status: undefined,
  search: '',
  page: 1,
  page_size: 100 // 导出页面使用更大的分页，或后续改为全部加载
});

// 导出配置
const exportConfig = reactive({
  format: 'md' as 'txt' | 'md' | 'html' | 'json',
  includeImages: true
});

// 文章列表
const articles = ref<Article[]>([]);
const allArticles = ref<Article[]>([]); // 存储所有加载的文章
const selectedArticles = ref<Article[]>([]);
const loading = ref(false);
const loadingAll = ref(false);
const exporting = ref(false);

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 100, // 导出页面增大分页
  total: 0
});

// 进度对话框
const progressDialog = reactive({
  visible: false,
  articleCurrent: 0,
  articleTotal: 0,
  imageCurrent: 0,
  imageTotal: 0
});

// 导出结果
const exportResult = ref<ExportStats | null>(null);

// 预览对话框
const previewDialog = reactive({
  visible: false,
  article: null as Article | null
});

// 计算属性
const articleProgress = computed(() => {
  if (progressDialog.articleTotal === 0) return 0;
  return Math.round((progressDialog.articleCurrent / progressDialog.articleTotal) * 100);
});

const imageProgress = computed(() => {
  if (progressDialog.imageTotal === 0) return 0;
  return Math.round((progressDialog.imageCurrent / progressDialog.imageTotal) * 100);
});

const estimatedSize = computed(() => {
  if (selectedArticles.value.length === 0) return '0 B';
  const size = exportService.estimateSize(selectedArticles.value, exportConfig.includeImages);
  return exportService.formatFileSize(size);
});

const selectedCategoryName = computed(() => {
  if (!filterForm.category_id) return undefined;
  const category = categories.value.find(c => c.id === filterForm.category_id);
  return category?.name;
});

// 方法
const fetchCategories = async () => {
  try {
    logger.info('开始获取分类列表');
    
    // 直接调用API而不是通过store
    const response = await getCategoryList({});
    logger.info('分类列表API响应:', response);
    
    if (response) {
      // 处理可能的不同响应格式
      if (Array.isArray(response)) {
        // 直接是数组
        categories.value = response;
        logger.info(`获取到${categories.value.length}个分类`);
      } else if (response.data) {
        if (Array.isArray(response.data)) {
          // response.data是数组
          categories.value = response.data;
          logger.info(`获取到${categories.value.length}个分类`);
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // response.data.results是数组
          categories.value = response.data.results;
          logger.info(`获取到${categories.value.length}个分类`);
        } else {
          logger.warn('分类数据格式异常:', response.data);
          categories.value = [];
        }
      } else {
        logger.warn('分类响应格式不符:', response);
        categories.value = [];
      }
    } else {
      logger.warn('分类响应为空');
      categories.value = [];
    }
    
    // 打印第一个分类用于调试
    if (categories.value.length > 0) {
      logger.info('第一个分类示例:', categories.value[0]);
    }
  } catch (error) {
    logger.error('获取分类列表失败:', error);
    categories.value = [];
    // 不显示错误提示，允许用户继续使用其他功能
  }
};

const fetchArticles = async () => {
  loading.value = true;
  try {
    const params: ArticleListParams = {
      ...filterForm,
      page: pagination.currentPage,
      page_size: pagination.pageSize
    };

    const response = await cmsStore.fetchArticleList(params);
    
    if (response && response.data) {
      articles.value = response.data.results || [];
      pagination.total = response.data.count || 0;
      
      logger.info(`加载了${articles.value.length}篇文章，总共${pagination.total}篇`);
    }
  } catch (error) {
    logger.error('获取文章列表失败', error);
    await handleError(error);
  } finally {
    loading.value = false;
  }
};

/**
 * 加载所有文章（循环获取所有分页）
 */
const fetchAllArticles = async () => {
  loadingAll.value = true;
  allArticles.value = [];
  
  try {
    logger.info('开始加载所有文章...');
    
    // 第一次请求获取总数
    const firstParams: ArticleListParams = {
      ...filterForm,
      page: 1,
      page_size: 100
    };

    const firstResponse = await cmsStore.fetchArticleList(firstParams);
    
    if (!firstResponse || !firstResponse.data) {
      throw new Error('获取文章列表失败');
    }

    const total = firstResponse.data.count || 0;
    const firstPageArticles = firstResponse.data.results || [];
    
    allArticles.value = [...firstPageArticles];
    logger.info(`第1页加载${firstPageArticles.length}篇，总共${total}篇`);

    // 计算需要加载的页数
    const totalPages = Math.ceil(total / 100);
    
    // 如果有多页，继续加载
    if (totalPages > 1) {
      for (let page = 2; page <= totalPages; page++) {
        const params: ArticleListParams = {
          ...filterForm,
          page,
          page_size: 100
        };

        const response = await cmsStore.fetchArticleList(params);
        
        if (response && response.data && response.data.results) {
          allArticles.value.push(...response.data.results);
          logger.info(`第${page}页加载${response.data.results.length}篇，累计${allArticles.value.length}篇`);
        }
      }
    }

    // 更新显示
    articles.value = allArticles.value;
    pagination.total = allArticles.value.length;
    
    logger.info(`所有文章加载完成，共${allArticles.value.length}篇`);
    showSuccess(`已加载全部${allArticles.value.length}篇文章`);
  } catch (error) {
    logger.error('加载所有文章失败', error);
    await handleError(error);
  } finally {
    loadingAll.value = false;
  }
};

const handleCategoryChange = () => {
  pagination.currentPage = 1;
  fetchAllArticles(); // 导出页面始终加载全部
};

const handleFilterChange = () => {
  pagination.currentPage = 1;
  fetchAllArticles(); // 导出页面始终加载全部
};

const handleSelectionChange = (selection: Article[]) => {
  selectedArticles.value = selection;
};

const handleSelectAll = () => {
  // 使用el-table的toggleAllSelection方法
  if (articleTableRef.value) {
    articleTableRef.value.toggleAllSelection();
    logger.info(`全选${articles.value.length}篇文章`);
  } else {
    // 降级方案：直接设置
    selectedArticles.value = [...articles.value];
  }
};

const handleClearSelection = () => {
  // 使用el-table的clearSelection方法
  if (articleTableRef.value) {
    articleTableRef.value.clearSelection();
    logger.info('清空选择');
  } else {
    // 降级方案：直接清空
    selectedArticles.value = [];
  }
};

const handlePreview = (article: Article) => {
  previewDialog.article = article;
  previewDialog.visible = true;
};

const handleExport = async () => {
  if (selectedArticles.value.length === 0) {
    showWarning('请先选择要导出的文章');
    return;
  }

  // 重置进度
  progressDialog.articleCurrent = 0;
  progressDialog.articleTotal = selectedArticles.value.length;
  progressDialog.imageCurrent = 0;
  progressDialog.imageTotal = 0;
  exportResult.value = null;

  // 显示进度对话框
  progressDialog.visible = true;
  exporting.value = true;

  try {
    const options: ExportOptions = {
      articles: selectedArticles.value,
      format: exportConfig.format,
      includeImages: exportConfig.includeImages,
      categoryName: selectedCategoryName.value,
      onProgress: (current, total, stage) => {
        if (stage === 'articles') {
          progressDialog.articleCurrent = current;
          progressDialog.articleTotal = total;
        } else if (stage === 'images') {
          progressDialog.imageCurrent = current;
          progressDialog.imageTotal = total;
        }
      },
      onComplete: (stats) => {
        exportResult.value = stats;
        showSuccess(`导出完成！共导出${stats.exportedArticles}篇文章`);
      }
    };

    const stats = await exportService.exportArticles(options);
    
    logger.info('导出统计:', stats);
  } catch (error) {
    logger.error('导出失败', error);
    progressDialog.visible = false;
    await handleError(error);
  } finally {
    exporting.value = false;
  }
};

// 辅助函数
const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    published: 'success',
    draft: 'info',
    pending: 'warning',
    archived: 'info'
  };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    pending: '待审核',
    archived: '已归档'
  };
  return map[status] || status;
};

const getFormatLabel = (format: string) => {
  const map: Record<string, string> = {
    md: 'Markdown',
    html: 'HTML',
    txt: '纯文本',
    json: 'JSON'
  };
  return map[format] || format;
};

const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  return dayjs(dateString).format('YYYY-MM-DD HH:mm');
};

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}分${remainSeconds}秒`;
};

const showWarning = (message: string) => {
  ElMessage.warning(message);
};

// 生命周期
onMounted(() => {
  fetchCategories();
  fetchAllArticles(); // 初始加载所有文章
});
</script>

<style scoped lang="scss">
.article-export-page {
  padding: 20px;
}

.filter-card,
.article-list-card,
.export-action-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.loading-container {
  padding: 20px;
}

.info-container {
  margin-top: 20px;
}

.loading-progress {
  margin-top: 16px;
  padding: 0 20px;
}

.export-summary {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 6px;

  .summary-item {
    display: flex;
    align-items: center;
    gap: 8px;

    .label {
      color: #606266;
      font-size: 14px;
    }

    .value {
      color: #303133;
      font-weight: 600;
      font-size: 16px;
    }
  }
}

.export-button {
  width: 100%;
  height: 50px;
  font-size: 16px;
}

.progress-content {
  .progress-section {
    margin-bottom: 24px;

    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
      color: #606266;

      .progress-count {
        font-weight: 600;
        color: #409eff;
      }
    }
  }

  .export-result {
    margin-top: 20px;

    .result-stats {
      display: flex;
      gap: 20px;
      justify-content: center;
      margin-top: 16px;

      .stat-item {
        text-align: center;

        .stat-label {
          display: block;
          font-size: 12px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: #303133;
        }
      }
    }
  }
}

.preview-dialog {
  .preview-content {
    padding: 20px;
    max-height: 600px;
    overflow-y: auto;
    line-height: 1.6;

    :deep(img) {
      max-width: 100%;
      height: auto;
    }

    :deep(pre) {
      background-color: #f6f8fa;
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .article-export-page {
    padding: 10px;
  }

  .export-summary {
    flex-direction: column;
    gap: 12px;
  }

  .export-button {
    font-size: 14px;
  }
}</style>
