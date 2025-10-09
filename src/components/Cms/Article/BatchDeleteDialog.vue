<template>
  <el-dialog
    v-model="visible"
    title="批量删除文章"
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="batch-delete-content">
      <!-- 警告提示 -->
      <el-alert
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      >
        <template #title>
          <span style="font-weight: 600;">
            您确定要删除选中的 {{ selectedCount }} 篇文章吗？
          </span>
        </template>
        <div class="mt-2">此操作不可逆，请谨慎操作！</div>
      </el-alert>

      <!-- 选中的文章列表 -->
      <div v-if="articles.length > 0" class="selected-articles">
        <div class="selected-articles__header">将要删除的文章：</div>
        <div class="selected-articles__list">
          <div
            v-for="article in articles.slice(0, 5)"
            :key="article.id"
            class="selected-articles__item"
          >
            <el-tag size="small" type="info">ID: {{ article.id }}</el-tag>
            <span class="article-title">{{ article.title }}</span>
          </div>
          <div v-if="articles.length > 5" class="selected-articles__more">
            还有 {{ articles.length - 5 }} 篇文章...
          </div>
        </div>
      </div>

      <!-- Force删除选项 -->
      <div class="force-option">
        <el-checkbox v-model="forceDelete">
          强制删除（忽略关联检查）
        </el-checkbox>
        <el-tooltip
          effect="dark"
          content="启用后将删除文章及其所有关联数据（评论、标签关系等）"
          placement="top"
        >
          <el-icon class="info-icon"><InfoFilled /></el-icon>
        </el-tooltip>
      </div>

      <!-- 删除进度 -->
      <div v-if="deleting" class="delete-progress">
        <el-progress :percentage="progress" />
        <div class="progress-text">
          正在删除... ({{ deletedCount }}/{{ selectedCount }})
        </div>
      </div>

      <!-- 删除结果 -->
      <div v-if="showResult" class="delete-result">
        <el-result
          :icon="resultIcon"
          :title="resultTitle"
          :sub-title="resultSubtitle"
        >
          <template #extra>
            <el-button type="primary" @click="handleClose">
              关闭
            </el-button>
          </template>
        </el-result>
      </div>
    </div>

    <template #footer v-if="!showResult">
      <div class="dialog-footer">
        <el-button @click="handleClose" :disabled="deleting">
          取消
        </el-button>
        <el-button
          type="danger"
          @click="handleConfirm"
          :loading="deleting"
          :disabled="deleting"
        >
          {{ deleting ? '删除中...' : '确认删除' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import type { Article } from '@/types/cms';

export interface BatchDeleteDialogProps {
  articles: Article[];
  onConfirm?: (articleIds: number[], force: boolean) => Promise<{ deleted_count: number; requested_count: number }>;
}

const props = defineProps<BatchDeleteDialogProps>();
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success', deletedCount: number): void;
}>();

const visible = ref(true);
const forceDelete = ref(false);
const deleting = ref(false);
const progress = ref(0);
const deletedCount = ref(0);
const showResult = ref(false);
const resultData = ref<{ deleted_count: number; requested_count: number } | null>(null);

const selectedCount = computed(() => props.articles.length);

const resultIcon = computed(() => {
  if (!resultData.value) return 'success';
  const { deleted_count, requested_count } = resultData.value;
  return deleted_count === requested_count ? 'success' : 'warning';
});

const resultTitle = computed(() => {
  if (!resultData.value) return '';
  const { deleted_count, requested_count } = resultData.value;
  
  if (deleted_count === requested_count) {
    return '删除成功';
  } else if (deleted_count > 0) {
    return '部分删除成功';
  } else {
    return '删除失败';
  }
});

const resultSubtitle = computed(() => {
  if (!resultData.value) return '';
  const { deleted_count, requested_count } = resultData.value;
  return `成功删除 ${deleted_count}/${requested_count} 篇文章`;
});

const handleConfirm = async () => {
  if (!props.onConfirm) return;

  deleting.value = true;
  deletedCount.value = 0;
  progress.value = 0;

  try {
    const article_ids = props.articles.map(a => a.id);
    const result = await props.onConfirm(article_ids, forceDelete.value);
    
    // 模拟进度更新
    const interval = setInterval(() => {
      if (progress.value < 90) {
        progress.value += 10;
      }
    }, 100);

    // 等待一会儿让用户看到进度
    await new Promise(resolve => setTimeout(resolve, 500));
    
    clearInterval(interval);
    progress.value = 100;
    
    resultData.value = result;
    deletedCount.value = result.deleted_count;
    
    // 显示结果页
    showResult.value = true;
    
    // 触发成功事件
    emit('success', result.deleted_count);
  } catch (error) {
    // 错误会被调用者处理
    visible.value = false;
    throw error;
  } finally {
    deleting.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
  emit('close');
};
</script>

<style scoped lang="scss">
.batch-delete-content {
  .mb-4 {
    margin-bottom: 16px;
  }

  .mt-2 {
    margin-top: 8px;
    font-size: 14px;
  }
}

.selected-articles {
  margin: 16px 0;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;

  &__header {
    font-weight: 600;
    color: #495057;
    margin-bottom: 12px;
    font-size: 14px;
  }

  &__list {
    max-height: 200px;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    margin-bottom: 6px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid #dee2e6;

    .article-title {
      flex: 1;
      font-size: 14px;
      color: #212529;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__more {
    padding: 8px;
    text-align: center;
    color: #6c757d;
    font-size: 13px;
  }
}

.force-option {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 16px 0;
  padding: 12px;
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;

  .info-icon {
    color: #856404;
    cursor: help;
  }
}

.delete-progress {
  margin: 16px 0;

  .progress-text {
    margin-top: 8px;
    text-align: center;
    color: #606266;
    font-size: 14px;
  }
}

.delete-result {
  margin: 20px 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
