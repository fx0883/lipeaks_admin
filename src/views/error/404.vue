<template>
  <ErrorPage
    type="404"
    :show-contact="false"
  />
</template>

<script setup lang="ts">
import ErrorPage from '@/components/ErrorHandling/ErrorPage.vue';
</script>