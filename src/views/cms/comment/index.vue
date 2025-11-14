<script lang="ts" setup>
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import {
  Search,
  Edit,
  Delete,
  View,
  Check,
  Close,
  Warning,
  Document
} from "@element-plus/icons-vue";
import { useCmsStoreHook } from "@/store/modules/cms";
import { useUserStoreHook } from "@/store/modules/user";
import ConfirmDialog from "@/components/Cms/Comment/ConfirmDialog.vue";
import CommentForm from "@/components/Cms/Comment/CommentForm.vue";
import type {
  Comment,
  CommentStatus,
  CommentListParams,
  CommentUpdateParams
} from "@/types/cms";
import logger from "@/utils/logger";

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const cmsStore = useCmsStoreHook();
const userStore = useUserStoreHook();

// 检查用户权限
const checkPermission = () => {
  // 这里可以根据实际需求检查权限
  return true;
};

// 表格加载状态
const tableLoading = computed(() => cmsStore.loading.commentList);

// 表格数据
const comments = computed(() => cmsStore.comments.data);

// 分页信息
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => cmsStore.comments.total)
});

// 搜索表单
const searchForm = reactive<CommentListParams>({
  search: "",
  status: undefined,
  article: undefined,
  user: undefined,
  date_from: "",
  date_to: "",
  page: 1,
  page_size: 10,
  parent: undefined,
  has_parent: undefined
});

// 回复对话框状态
const replyDialog = reactive({
  visible: false,
  commentId: null as number | null,
  articleId: null as number | null,
  loading: false
});

// 编辑对话框状态
const editDialog = reactive({
  visible: false,
  comment: null as Comment | null,
  loading: false
});

// 确认对话框
const confirmDialog = reactive({
  visible: false,
  title: "",
  content: "",
  type: "warning" as const,
  confirmAction: null as (() => Promise<void>) | null
});

// 状态选项
const statusOptions = [
  { value: "", label: t("cms.comment.statusAll") },
  { value: "pending", label: t("cms.comment.statusPending") },
  { value: "approved", label: t("cms.comment.statusApproved") },
  { value: "spam", label: t("cms.comment.statusSpam") },
  { value: "trash", label: t("cms.comment.statusTrash") },
  { value: "rejected", label: t("cms.comment.statusRejected") }
];

// 评论类型选项
const parentFilterOptions = [
  { value: "", label: "全部评论" },
  { value: "false", label: "顶级评论" },
  { value: "true", label: "回复评论" }
];

// 多选相关
const multipleSelection = ref<Comment[]>([]);
const handleSelectionChange = (val: Comment[]) => {
  multipleSelection.value = val;
};

// 获取评论列表
const fetchComments = async () => {
  try {
    searchForm.page = pagination.currentPage;
    searchForm.page_size = pagination.pageSize;

    await cmsStore.fetchCommentList(searchForm);
  } catch (error) {
    logger.error("获取评论列表失败", error);
    ElMessage.error(t("cms.comment.fetchListFailed"));
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  fetchComments();
};

// 重置搜索
const resetSearch = () => {
  searchForm.search = "";
  searchForm.status = undefined;
  searchForm.article = undefined;
  searchForm.user = undefined;
  searchForm.date_from = "";
  searchForm.date_to = "";
  searchForm.parent = undefined;
  searchForm.has_parent = undefined;
  pagination.currentPage = 1;
  fetchComments();
};

// 监视分页参数变化
watch(
  () => pagination.currentPage,
  newPage => {
    if (newPage) {
      fetchComments();
    }
  }
);

watch(
  () => pagination.pageSize,
  newSize => {
    if (newSize) {
      pagination.currentPage = 1; // 当每页条数变化时，重置为第一页
      fetchComments();
    }
  }
);

// 查看评论详情
const handleDetail = (row: Comment) => {
  router.push(`/cms/comment/detail/${row.id}`);
};

// 编辑评论
const handleEdit = (row: Comment) => {
  editDialog.comment = row;
  editDialog.visible = true;
};

// 提交编辑
const handleEditSubmit = async (formData: CommentUpdateParams) => {
  if (!editDialog.comment) return;

  editDialog.loading = true;
  try {
    await cmsStore.updateComment(editDialog.comment.id, formData);
    editDialog.visible = false;
    fetchComments();
  } catch (error) {
    logger.error("更新评论失败", error);
  } finally {
    editDialog.loading = false;
  }
};

// 回复评论
const handleReply = (row: Comment) => {
  replyDialog.commentId = row.id;
  replyDialog.articleId = row.article;
  replyDialog.visible = true;
};

// 提交回复
const handleReplySubmit = async formData => {
  replyDialog.loading = true;
  try {
    await cmsStore.createComment(formData);
    replyDialog.visible = false;
    fetchComments();
  } catch (error) {
    logger.error("回复评论失败", error);
  } finally {
    replyDialog.loading = false;
  }
};

// 批准评论
const handleApprove = (row: Comment) => {
  confirmDialog.title = t("cms.comment.confirmApprove");
  confirmDialog.content = t("cms.comment.confirmApproveMessage");
  confirmDialog.type = "info";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.approveComment(row.id);
      fetchComments();
    } catch (error) {
      logger.error("批准评论失败", error);
    }
  };
  confirmDialog.visible = true;
};

// 拒绝评论
const handleReject = (row: Comment) => {
  confirmDialog.title = t("cms.comment.confirmReject");
  confirmDialog.content = t("cms.comment.confirmRejectMessage");
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.rejectComment(row.id);
      fetchComments();
    } catch (error) {
      logger.error("拒绝评论失败", error);
    }
  };
  confirmDialog.visible = true;
};

// 标记为垃圾评论
const handleMarkAsSpam = (row: Comment) => {
  confirmDialog.title = t("cms.comment.confirmMarkAsSpam");
  confirmDialog.content = t("cms.comment.confirmMarkAsSpamMessage");
  confirmDialog.type = "warning";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.markCommentAsSpam(row.id);
      fetchComments();
    } catch (error) {
      logger.error("标记为垃圾评论失败", error);
    }
  };
  confirmDialog.visible = true;
};

// 删除评论
const handleDelete = (row: Comment) => {
  confirmDialog.title = t("cms.comment.confirmDelete");
  confirmDialog.content = t("cms.comment.confirmDeleteMessage");
  confirmDialog.type = "error";
  confirmDialog.confirmAction = async () => {
    try {
      await cmsStore.deleteComment(row.id);
      ElMessage.success(t("cms.comment.deleteSuccess"));
      fetchComments();
    } catch (error) {
      logger.error("删除评论失败", error);
      ElMessage.error(t("cms.comment.deleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 批量操作
const handleBatchAction = (action: string) => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("cms.comment.selectCommentsFirst"));
    return;
  }

  const actionLabels = {
    approve: t("cms.comment.batchApprove"),
    spam: t("cms.comment.batchMarkAsSpam"),
    reject: t("cms.comment.batchReject")
  };

  confirmDialog.title = t("cms.comment.confirmBatchAction", {
    action: actionLabels[action]
  });
  confirmDialog.content = t("cms.comment.confirmBatchActionMessage", {
    count: multipleSelection.value.length
  });
  confirmDialog.type = action === "approve" ? "info" : "warning";
  confirmDialog.confirmAction = async () => {
    try {
      const ids = multipleSelection.value.map(item => item.id);
      await cmsStore.batchComments(ids, action);
      ElMessage.success(t("cms.comment.batchActionSuccess"));
      fetchComments();
      multipleSelection.value = [];
    } catch (error) {
      logger.error("批量操作失败", error);
      ElMessage.error(t("cms.comment.batchActionFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 批量删除
const handleBatchDelete = () => {
  if (multipleSelection.value.length === 0) {
    ElMessage.warning(t("cms.comment.selectCommentsToDelete"));
    return;
  }

  confirmDialog.title = t("cms.comment.confirmBatchDelete");
  confirmDialog.content = t("cms.comment.confirmBatchDeleteMessage", {
    count: multipleSelection.value.length
  });
  confirmDialog.type = "error";
  confirmDialog.confirmAction = async () => {
    try {
      const promises = multipleSelection.value.map(item =>
        cmsStore.deleteComment(item.id)
      );
      await Promise.all(promises);
      ElMessage.success(t("cms.comment.batchDeleteSuccess"));
      fetchComments();
      multipleSelection.value = [];
    } catch (error) {
      logger.error("批量删除评论失败", error);
      ElMessage.error(t("cms.comment.batchDeleteFailed"));
    }
  };
  confirmDialog.visible = true;
};

// 格式化日期
const formatDate = (date: string) => {
  if (!date) return "";
  return new Date(date).toLocaleString();
};

// 格式化评论状态
const formatStatus = (status: CommentStatus) => {
  const statusMap = {
    pending: { label: t("cms.comment.statusPending"), type: "warning" },
    approved: { label: t("cms.comment.statusApproved"), type: "success" },
    spam: { label: t("cms.comment.statusSpam"), type: "danger" },
    trash: { label: t("cms.comment.statusTrash"), type: "info" },
    rejected: { label: t("cms.comment.statusRejected"), type: "danger" }
  };

  return statusMap[status] || { label: status, type: "default" };
};

// 格式化作者类型
const formatAuthorType = (comment: Comment) => {
  const authorType = comment.author_type;
  if (authorType === "admin") {
    return { label: "管理员", type: "success" };
  } else if (authorType === "member") {
    return { label: "会员", type: "primary" };
  } else if (authorType === "guest") {
    return { label: "游客", type: "info" };
  }
  return { label: "未知", type: "default" };
};

// 获取作者显示名称
const getAuthorName = (comment: Comment) => {
  if (comment.author_info) {
    return comment.author_info.username || comment.author_info.nick_name || comment.author_info.name;
  } else if (comment.user_info) {
    return comment.user_info.username;
  } else if (comment.guest_name) {
    return comment.guest_name;
  }
  return t("cms.comment.anonymous");
};

// 获取评论内容预览
const getContentPreview = (content: string, maxLength = 100) => {
  if (!content) return "";

  if (content.length <= maxLength) {
    return content;
  }

  return content.substring(0, maxLength) + "...";
};

// 当前筛选的文章信息
const currentArticle = ref<{ id: number; title?: string } | null>(null);

// 从URL获取文章ID并筛选
const initFromUrlParams = () => {
  const articleId = route.query.article;
  if (articleId) {
    const id = Number(articleId);
    if (!isNaN(id)) {
      searchForm.article = id;
      currentArticle.value = { id };
      // 获取文章信息（可选）
      fetchArticleInfo(id);
    }
  }
};

// 获取文章信息
const fetchArticleInfo = async (articleId: number) => {
  try {
    const response = await cmsStore.fetchArticleDetail(articleId);
    if (response && cmsStore.currentArticle) {
      currentArticle.value = {
        id: articleId,
        title: cmsStore.currentArticle.title
      };
    }
  } catch (error) {
    logger.warn("获取文章信息失败", error);
  }
};

// 返回文章详情页
const backToArticle = () => {
  if (currentArticle.value) {
    const routeUrl = router.resolve({
      path: `/preview/article/${currentArticle.value.id}`
    });
    window.open(routeUrl.href, '_blank');
  }
};

// 清除文章筛选
const clearArticleFilter = () => {
  searchForm.article = undefined;
  currentArticle.value = null;
  // 移除URL参数
  router.replace({ query: {} });
  fetchComments();
};

// 页面加载时获取数据
onMounted(() => {
  if (checkPermission()) {
    // 先初始化URL参数
    initFromUrlParams();
    // 然后获取评论列表
    fetchComments();
  }
});
</script>

<template>
  <div class="comment-list-container">
    <!-- 标题 -->
    <div class="comment-list-header">
      <h2 class="comment-list-title">
        {{ t("cms.comment.commentManagement") }}
      </h2>
    </div>

    <!-- 文章信息提示 -->
    <el-alert
      v-if="currentArticle"
      type="info"
      :closable="false"
      class="article-filter-alert"
    >
      <template #title>
        <div class="article-filter-content">
          <div class="article-info-text">
            <el-icon :size="18"><Document /></el-icon>
            <span v-if="currentArticle.title">
              正在查看文章《<strong>{{ currentArticle.title }}</strong>》的评论
            </span>
            <span v-else>
              正在查看文章 ID: <strong>{{ currentArticle.id }}</strong> 的评论
            </span>
          </div>
          <div class="article-filter-actions">
            <el-button
              size="small"
              type="primary"
              :icon="View"
              @click="backToArticle"
              link
            >
              查看文章
            </el-button>
            <el-button
              size="small"
              type="info"
              :icon="Close"
              @click="clearArticleFilter"
              link
            >
              清除筛选
            </el-button>
          </div>
        </div>
      </template>
    </el-alert>

    <!-- 搜索和筛选 -->
    <el-card class="search-card">
      <el-form
        :model="searchForm"
        label-width="100px"
        @keyup.enter="handleSearch"
      >
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item :label="t('cms.comment.keyword')">
              <el-input
                v-model="searchForm.search"
                :placeholder="t('cms.comment.searchPlaceholder')"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item :label="t('cms.comment.status')">
              <el-select v-model="searchForm.status" clearable class="w-full">
                <el-option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item label="评论类型">
              <el-select v-model="searchForm.has_parent" clearable class="w-full">
                <el-option
                  v-for="option in parentFilterOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="5">
            <el-form-item :label="t('cms.comment.article')">
              <el-input
                v-model="searchForm.article"
                type="number"
                :placeholder="t('cms.comment.articleIdPlaceholder')"
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item
              :label="t('cms.comment.dateRange')"
              class="date-range-form-item"
            >
              <el-date-picker
                v-model="searchForm.date_from"
                type="date"
                :placeholder="t('cms.comment.startDate')"
                style="width: 45%"
                value-format="YYYY-MM-DD"
                clearable
              />
              <span class="date-separator">-</span>
              <el-date-picker
                v-model="searchForm.date_to"
                type="date"
                :placeholder="t('cms.comment.endDate')"
                style="width: 45%"
                value-format="YYYY-MM-DD"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item class="search-buttons">
          <el-button type="primary" :icon="Search" @click="handleSearch">
            {{ t("common.search") }}
          </el-button>
          <el-button @click="resetSearch">
            {{ t("common.reset") }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 批量操作 -->
    <el-card class="action-card">
      <div class="batch-actions">
        <el-button
          type="success"
          :disabled="multipleSelection.length === 0"
          @click="handleBatchAction('approve')"
        >
          {{ t("cms.comment.batchApprove") }}
        </el-button>
        <el-button
          type="warning"
          :disabled="multipleSelection.length === 0"
          @click="handleBatchAction('spam')"
        >
          {{ t("cms.comment.batchMarkAsSpam") }}
        </el-button>
        <el-button
          type="info"
          :disabled="multipleSelection.length === 0"
          @click="handleBatchAction('reject')"
        >
          {{ t("cms.comment.batchReject") }}
        </el-button>
        <el-button
          type="danger"
          :disabled="multipleSelection.length === 0"
          @click="handleBatchDelete"
        >
          {{ t("cms.comment.batchDelete") }}
        </el-button>
      </div>
    </el-card>

    <!-- 评论列表表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="tableLoading"
        :data="comments"
        style="width: 100%"
        border
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column prop="id" label="ID" width="80" />

        <el-table-column :label="t('cms.comment.content')" min-width="220">
          <template #default="{ row }">
            <div class="comment-content">
              <div class="content-preview">
                {{ getContentPreview(row.content) }}
              </div>
              <div class="comment-meta">
                {{ getAuthorName(row) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="作者类型" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.author_type" :type="formatAuthorType(row).type" size="small">
              {{ formatAuthorType(row).label }}
            </el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>

        <el-table-column :label="t('cms.comment.article')" width="100">
          <template #default="{ row }">
            <el-link
              type="primary"
              @click="
                searchForm.article = row.article;
                handleSearch();
              "
            >
              ID: {{ row.article }}
            </el-link>
          </template>
        </el-table-column>

        <el-table-column :label="t('cms.comment.status')" width="100">
          <template #default="{ row }">
            <el-tag :type="formatStatus(row.status).type" size="small">
              {{ formatStatus(row.status).label }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="点赞" width="60" align="center">
          <template #default="{ row }">
            {{ row.likes_count || 0 }}
          </template>
        </el-table-column>

        <el-table-column label="回复" width="60" align="center">
          <template #default="{ row }">
            {{ row.replies_count || 0 }}
          </template>
        </el-table-column>

        <el-table-column :label="t('cms.comment.createTime')" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>

        <el-table-column
          :label="t('common.operation')"
          fixed="right"
          width="280"
        >
          <template #default="{ row }">
            <el-button
              size="small"
              :icon="View"
              @click="handleDetail(row)"
              title="查看"
              text
            />
            <el-button
              size="small"
              :icon="Edit"
              type="primary"
              @click="handleEdit(row)"
              title="编辑"
              text
            />
            <el-button
              v-if="row.status !== 'approved'"
              size="small"
              :icon="Check"
              type="success"
              @click="handleApprove(row)"
              title="批准"
              text
            />
            <el-button
              v-if="row.status !== 'trash'"
              size="small"
              :icon="Close"
              type="info"
              @click="handleReject(row)"
              title="拒绝"
              text
            />
            <el-button
              v-if="row.status !== 'spam'"
              size="small"
              :icon="Warning"
              type="warning"
              @click="handleMarkAsSpam(row)"
              title="垃圾评论"
              text
            />
            <el-button
              size="small"
              :icon="Delete"
              type="danger"
              @click="handleDelete(row)"
              title="删除"
              text
            />
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:currentPage="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="editDialog.visible"
      :title="t('cms.comment.editComment')"
      width="50%"
      destroy-on-close
    >
      <CommentForm
        v-if="editDialog.comment"
        mode="edit"
        :comment="editDialog.comment"
        :loading="editDialog.loading"
        @submit="handleEditSubmit"
        @cancel="editDialog.visible = false"
      />
    </el-dialog>

    <!-- 回复对话框 -->
    <el-dialog
      v-model="replyDialog.visible"
      :title="t('cms.comment.replyComment')"
      width="50%"
      destroy-on-close
    >
      <CommentForm
        mode="reply"
        :article-id="replyDialog.articleId"
        :parent-id="replyDialog.commentId"
        :loading="replyDialog.loading"
        @submit="handleReplySubmit"
        @cancel="replyDialog.visible = false"
      />
    </el-dialog>

    <!-- 确认对话框 -->
    <ConfirmDialog
      v-model:visible="confirmDialog.visible"
      :title="confirmDialog.title"
      :content="confirmDialog.content"
      :type="confirmDialog.type"
      @confirm="confirmDialog.confirmAction && confirmDialog.confirmAction()"
    />
  </div>
</template>

<style scoped>
.comment-list-container {
  padding: 20px;
}

.comment-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.comment-list-title {
  font-size: 20px;
  font-weight: 500;
  margin: 0;
}

.search-card {
  margin-bottom: 20px;
}

.action-card {
  margin-bottom: 20px;
}

.batch-actions {
  display: flex;
  gap: 10px;
}

.search-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 0;
}

.table-card {
  margin-bottom: 20px;
}

.comment-content {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.content-preview {
  font-size: 14px;
  word-break: break-word;
}

.comment-meta {
  font-size: 12px;
  color: #606266;
}

.date-range-form-item :deep(.el-form-item__content) {
  display: flex;
  align-items: center;
}

.date-separator {
  margin: 0 5px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.w-full {
  width: 100%;
}

/* 文章筛选提示样式 */
.article-filter-alert {
  margin-bottom: 20px;
}

.article-filter-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.article-info-text {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.article-filter-actions {
  display: flex;
  gap: 8px;
}
</style>
