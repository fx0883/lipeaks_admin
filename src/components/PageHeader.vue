<template>
  <div class="page-header">
    <div class="page-header__left">
      <el-button
        v-if="showBack"
        :icon="ArrowLeft"
        circle
        @click="handleBack"
        class="back-button"
      />
      <div class="page-header__content">
        <h2 class="page-header__title">{{ title }}</h2>
        <p v-if="description" class="page-header__description">{{ description }}</p>
      </div>
    </div>
    
    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ArrowLeft } from '@element-plus/icons-vue';

export interface PageHeaderProps {
  title: string;
  description?: string;
  showBack?: boolean;
  backRoute?: string;
}

const props = withDefaults(defineProps<PageHeaderProps>(), {
  showBack: false
});

const router = useRouter();

const handleBack = () => {
  if (props.backRoute) {
    router.push(props.backRoute);
  } else {
    router.back();
  }
};
</script>

<style scoped lang="scss">
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.page-header__left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex: 1;
}

.back-button {
  flex-shrink: 0;
  margin-top: 4px;
}

.page-header__content {
  flex: 1;
  min-width: 0;
}

.page-header__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
}

.page-header__description {
  margin: 8px 0 0 0;
  font-size: 14px;
  color: #606266;
  line-height: 1.5;
}

.page-header__actions {
  flex-shrink: 0;
  margin-left: 16px;
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .page-header__actions {
    width: 100%;
    margin-left: 0;

    :deep(.el-button) {
      width: 100%;
    }
  }

  .page-header__title {
    font-size: 20px;
  }
}</style>
