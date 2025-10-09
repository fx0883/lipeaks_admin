<template>
  <ErrorPage
    type="403"
    :show-contact="false"
    :custom-actions="customActions"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import ErrorPage from '@/components/ErrorHandling/ErrorPage.vue';
import type { CustomAction } from '@/components/ErrorHandling/ErrorPage.vue';

const router = useRouter();

const customActions = computed<CustomAction[]>(() => [
  {
    key: 'contact',
    text: '联系管理员',
    type: 'primary',
    handler: () => {
      // 这里可以打开客服对话框或跳转到联系页面
      window.open('mailto:admin@example.com');
    }
  }
]);
</script>