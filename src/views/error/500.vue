<template>
  <ErrorPage
    type="500"
    :show-retry="true"
    :show-contact="true"
    :on-retry="handleRetry"
  />
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import ErrorPage from '@/components/ErrorHandling/ErrorPage.vue';

const router = useRouter();

const handleRetry = async () => {
  // 重新加载当前页面
  window.location.reload();
};
</script>