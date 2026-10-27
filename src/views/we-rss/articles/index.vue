<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getArticles, setArticleFavorite } from "@/api/modules/weRss";
import type { WechatArticle, WeRssQueryParams } from "@/types/weRss";

const loading = ref(false);
const articleList = ref<WechatArticle[]>([]);
const total = ref(0);

const queryParams = reactive<WeRssQueryParams>({
  page: 1,
  page_size: 10,
  search: "",
  article_type: undefined,
  favorite_only: undefined
});

const fetchArticles = async () => {
  loading.value = true;
  try {
    const res: any = await getArticles(queryParams);
    const data = res?.data?.results || res?.data || [];
    articleList.value = Array.isArray(data) ? data : [];
    total.value = res?.data?.count || articleList.value.length;
  } catch (err: any) {
    ElMessage.error(err.message || "获取微信文章列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  queryParams.page = 1;
  fetchArticles();
};

const handleReset = () => {
  queryParams.search = "";
  queryParams.article_type = undefined;
  queryParams.favorite_only = undefined;
  queryParams.page = 1;
  fetchArticles();
};

const handlePageChange = (val: number) => {
  queryParams.page = val;
  fetchArticles();
};

const toggleFavorite = async (row: WechatArticle) => {
  try {
    const nextState = !row.is_favorite;
    await setArticleFavorite(row.id, nextState);
    row.is_favorite = nextState;
    ElMessage.success(nextState ? "已加入收藏" : "已取消收藏");
  } catch (err: any) {
    ElMessage.error(err.message || "更新收藏状态失败");
  }
};

const openOriginalUrl = (url: string) => {
  if (url) {
    window.open(url, "_blank");
  }
};

onMounted(() => {
  fetchArticles();
});
</script>

<template>
  <div class="p-4">
    <!-- 检索卡片 -->
    <el-card shadow="never" class="mb-4">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="文章标题">
          <el-input v-model="queryParams.search" placeholder="输入标题或关键词" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="queryParams.article_type" placeholder="全部类型" clearable style="width: 130px">
            <el-option label="普通图文" value="news" />
            <el-option label="图片长文" value="newspic" />
          </el-select>
        </el-form-item>
        <el-form-item label="收藏过滤">
          <el-select v-model="queryParams.favorite_only" placeholder="全部" clearable style="width: 120px">
            <el-option label="仅看已收藏" value="true" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 文章表格卡片 -->
    <el-card shadow="never">
      <el-table :data="articleList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="75" align="center" />
        <el-table-column prop="title" label="文章标题" min-width="250">
          <template #default="{ row }">
            <div class="font-medium text-blue-600 hover:underline cursor-pointer" @click="openOriginalUrl(row.url)">
              {{ row.title }}
            </div>
            <div class="text-xs text-gray-400 mt-1 line-clamp-1">
              {{ row.description || '暂无摘要' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="mp_name" label="来源公众号" width="160">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.mp_name || row.feed_name || '公众号' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publish_time" label="发布时间" width="160" />
        <el-table-column label="数据指标" width="180">
          <template #default="{ row }">
            <div class="text-xs text-gray-500 space-x-2">
              <span>阅读: {{ row.read_num || 0 }}</span>
              <span>点赞: {{ row.like_num || 0 }}</span>
              <span>在看: {{ row.share_num || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="center">
          <template #default="{ row }">
            <el-button
              size="small"
              :type="row.is_favorite ? 'warning' : 'default'"
              link
              @click="toggleFavorite(row)"
            >
              {{ row.is_favorite ? '★ 已收藏' : '☆ 收藏' }}
            </el-button>
            <el-button size="small" type="primary" link @click="openOriginalUrl(row.url)">
              微信原文
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :current-page="queryParams.page"
          :page-size="queryParams.page_size"
          :total="total"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>
