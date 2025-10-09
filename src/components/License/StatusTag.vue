<template>
  <el-tag
    :type="getTagType(status)"
    :effect="effect"
    :size="size"
    :closable="closable"
    @close="handleClose"
  >
    {{ getStatusText(status) }}
  </el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface StatusTagProps {
  status: string
  effect?: 'dark' | 'light' | 'plain'
  size?: 'large' | 'default' | 'small'
  closable?: boolean
  statusType?: 'license' | 'machine' | 'activation' | 'product' | 'plan'
}

const props = withDefaults(defineProps<StatusTagProps>(), {
  effect: 'light',
  size: 'default',
  closable: false,
  statusType: 'license'
})

const emit = defineEmits<{
  close: []
}>()

const { t } = useI18n()

// 获取标签类型（颜色）
const getTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    // License statuses
    active: 'success',
    expired: 'warning',
    revoked: 'danger',
    suspended: 'info',
    
    // Machine statuses
    inactive: 'info',
    blacklisted: 'danger',
    
    // Product/Plan statuses
    deprecated: 'warning',
    archived: 'info',
    
    // Default
    default: ''
  }
  
  return statusMap[status.toLowerCase()] || statusMap.default
}

// 获取状态文本
const getStatusText = (status: string) => {
  const statusKey = `license.common.statusTag${status.charAt(0).toUpperCase() + status.slice(1)}`
  return t(statusKey, status)
}

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
.el-tag {
  margin-right: 8px;
}
</style>
