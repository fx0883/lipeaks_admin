<script lang="ts" setup>
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getFeeds, syncFeed } from "@/api/modules/weRss";
import type { WechatFeed, WeRssQueryParams } from "@/types/weRss";

const loading = ref(false);
const feedList = ref<WechatFeed[]>([]);
const total = ref(0);

const queryParams = reactive<WeRssQueryParams>({
  page: 1,
  page_size: 10,
  search: ""
});

const fetchFeeds = async () => {
  loading.value = true;
  try {
    const res: any = await getFeeds(queryParams);
    const data = res?.data?.results || res?.data || [];
    feedList.value = Array.isArray(data) ? data : [];
    total.value = res?.data?.count || feedList.value.length;
  } catch (err: any) {
    ElMessage.error(err.message || "获取公众号列表失败");
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  queryParams.page = 1;
  fetchFeeds();
};

const handleReset = () => {
  queryParams.search = "";
  queryParams.page = 1;
  fetchFeeds();
};

const handlePageChange = (val: number) => {
  queryParams.page = val;
  fetchFeeds();
};

const handleSync = async (row: WechatFeed) => {
  try {
    await syncFeed(row.id);
    ElMessage.success(`已为「${row.mp_name}」下发最新文章同步任务`);
  } catch (err: any) {
    ElMessage.error(err.message || "同步任务触发失败");
  }
};

onMounted(() => {
  fetchFeeds();
});
</script>

<template>
  <div class="p-4">
    <!-- 检索与操作卡片 -->
    <el-card shadow="never" class="mb-4">
      <div class="flex justify-between items-center">
        <el-form :inline="true" :model="queryParams" class="mb-0">
          <el-form-item label="公众号名称" class="mb-0">
            <el-input v-model="queryParams.search" placeholder="输入公众号名称" clearable style="width: 220px" />
          </el-form-item>
          <el-form-item class="mb-0">
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" plain @click="fetchFeeds">刷新列表</el-button>
      </div>
    </el-card>

    <!-- 表格卡片 -->
    <el-card shadow="never">
      <el-table :data="feedList" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="75" align="center" />
        <el-table-column label="公众号信息" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-avatar :size="36" :src="row.mp_cover" icon="UserFilled" />
              <div>
                <div class="font-bold text-gray-800">{{ row.mp_name }}</div>
                <div class="text-xs text-gray-400 line-clamp-1 mt-0.5">{{ row.mp_intro || '暂无介绍' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="last_synced_at" label="最近同步时间" width="170">
          <template #default="{ row }">
            {{ row.last_synced_at || '尚未同步' }}
          </template>
        </el-table-column>
        <el-table-column prop="article_count" label="收录文章数" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.article_count || 0 }} 篇</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'active' ? '正常' : '已停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="handleSync(row)">
              抓取同步
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
