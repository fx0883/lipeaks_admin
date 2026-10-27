<template>
  <el-tag :type="tagType" :size="size" :effect="effect">
    {{ statusText }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ApplicationStatus } from "@/types/application";

interface Props {
  status: ApplicationStatus;
  size?: "large" | "default" | "small";
  effect?: "dark" | "light" | "plain";
}

const props = withDefaults(defineProps<Props>(), {
  size: "default",
  effect: "light"
});

const { t } = useI18n();

// 状态对应的标签类型
const tagType = computed<"primary" | "success" | "warning" | "danger" | "info">(() => {
  const typeMap: Record<ApplicationStatus, "primary" | "success" | "warning" | "danger" | "info"> = {
    development: "info",
    testing: "warning",
    active: "success",
    inactive: "info",
    deprecated: "danger",
    archived: "info",
    maintenance: "warning"
  };
  return typeMap[props.status] || "info";
});

// 状态文本
const statusText = computed(() => {
  return t(`application.status.${props.status}`);
});
</script>
