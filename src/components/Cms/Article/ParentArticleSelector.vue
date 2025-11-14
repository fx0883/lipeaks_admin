<script lang="ts" setup>
import { ref, reactive, watch, computed } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { Search } from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import type { Article } from "@/types/cms";

const { t } = useI18n();
const cmsStore = useCmsStoreHook();

// Props
interface Props {
  modelValue: boolean;
  currentArticleId?: number | null;
  selectedParentId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  currentArticleId: null,
  selectedParentId: null
});

// Emits
const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "select", article: Article): void;
}>();

// 对话框可见性
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val)
});

// 搜索表单
const searchForm = reactive({
  search: "",
  page: 1,
  page_size: 10
});

// 文章列表
const articles = ref<Article[]>([]);
const total = ref(0);
const loading = ref(false);

// 选中的文章
const selectedArticle = ref<Article | null>(null);

// 获取文章列表
const fetchArticles = async () => {
  loading.value = true;
  try {
    const response = await cmsStore.fetchArticleList({
      ...searchForm,
      status: "published"  // 只显示已发布的文章
    });

    if (response.success && response.data) {
      // 过滤掉当前文章（防止自己选自己为父文章）
      let filteredArticles = response.data.results || [];
      if (props.currentArticleId) {
        filteredArticles = filteredArticles.filter(
          (item: Article) => item.id !== props.currentArticleId
        );
      }

      articles.value = filteredArticles;

      if (response.data.pagination) {
        total.value = response.data.pagination.count || 0;
      } else {
        total.value = response.data.count || 0;
      }
    }
  } catch (error) {
    console.error("获取文章列表失败:", error);
    ElMessage.error(t("cms.article.fetchListFailed"));
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  searchForm.page = 1;
  fetchArticles();
};

// 重置搜索
const resetSearch = () => {
  searchForm.search = "";
  searchForm.page = 1;
  fetchArticles();
};

// 分页改变
const handlePageChange = (page: number) => {
  searchForm.page = page;
  fetchArticles();
};

// 选择文章
const handleSelectArticle = (article: Article) => {
  selectedArticle.value = article;
};

// 确认选择
const handleConfirm = () => {
  if (selectedArticle.value) {
    emit("select", selectedArticle.value);
    dialogVisible.value = false;
    selectedArticle.value = null;
  } else {
    ElMessage.warning(t("cms.article.noParentArticleSelected"));
  }
};

// 取消
const handleCancel = () => {
  dialogVisible.value = false;
  selectedArticle.value = null;
};

// 监听对话框打开
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      searchForm.search = "";
      searchForm.page = 1;
      selectedArticle.value = null;
      fetchArticles();
    }
  }
);
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    :title="t('cms.article.parentArticleSelector')"
    width="800px"
    destroy-on-close
  >
    <!-- 搜索栏 -->
    <div class="search-container">
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-input
            v-model="searchForm.search"
            :placeholder="t('cms.article.searchParentArticlePlaceholder')"
            clearable
            @keyup.enter="handleSearch"
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">
            {{ t("common.search") }}
          </el-button>
          <el-button @click="resetSearch">
            {{ t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 文章列表 -->
    <el-table
      v-loading="loading"
      :data="articles"
      highlight-current-row
      @current-change="handleSelectArticle"
      style="width: 100%"
      max-height="400px"
    >
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="title" :label="t('cms.article.title')" min-width="200">
        <template #default="{ row }">
          <div class="article-title-cell">
            <el-tooltip v-if="row.is_featured" content="特色" placement="top">
              <el-tag size="small" type="danger" class="mr-1">特</el-tag>
            </el-tooltip>
            <el-tooltip v-if="row.is_pinned" content="置顶" placement="top">
              <el-tag size="small" type="warning" class="mr-1">顶</el-tag>
            </el-tooltip>
            <span>{{ row.title }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="author_info.username" :label="t('cms.article.author')" width="120" />
      <el-table-column :label="t('cms.article.createTime')" width="180">
        <template #default="{ row }">
          {{ new Date(row.created_at).toLocaleString() }}
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="searchForm.page"
        v-model:page-size="searchForm.page_size"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        :total="total"
        @current-change="handlePageChange"
      />
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">{{ t("common.cancel") }}</el-button>
        <el-button type="primary" @click="handleConfirm">
          {{ t("common.confirm") }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.search-container {
  margin-bottom: 16px;
}

.article-title-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mr-1 {
  margin-right: 4px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
</style>
