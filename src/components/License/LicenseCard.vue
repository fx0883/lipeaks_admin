<template>
  <el-card 
    class="license-card" 
    :shadow="shadow"
    :body-style="{ padding: '16px' }"
  >
    <template #header>
      <div class="card-header">
        <div class="license-info">
          <h4 class="license-title">{{ license.key || t('license.licenses.key') }}</h4>
          <StatusTag :status="license.status" status-type="license" />
        </div>
        <div class="card-actions" v-if="showActions">
          <el-dropdown trigger="click" @command="handleCommand">
            <el-button type="text" :icon="MoreFilled" />
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="view" :icon="View">
                  {{ t('license.licenses.viewBtn') }}
                </el-dropdown-item>
                <el-dropdown-item command="edit" :icon="Edit" v-if="hasPerms('license:edit')">
                  {{ t('license.licenses.editBtn') }}
                </el-dropdown-item>
                <el-dropdown-item command="copy" :icon="CopyDocument">
                  {{ t('license.licenses.copyBtn') }}
                </el-dropdown-item>
                <el-dropdown-item command="download" :icon="Download">
                  {{ t('license.licenses.downloadBtn') }}
                </el-dropdown-item>
                <el-dropdown-item 
                  command="revoke" 
                  :icon="Close"
                  divided
                  v-if="license.status === 'active' && hasPerms('license:revoke')"
                >
                  {{ t('license.licenses.revokeBtn') }}
                </el-dropdown-item>
                <el-dropdown-item 
                  command="delete" 
                  :icon="Delete"
                  class="danger-item"
                  v-if="hasPerms('license:delete')"
                >
                  {{ t('license.licenses.deleteBtn') }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </template>

    <div class="license-content">
      <!-- Basic Info -->
      <div class="info-section">
        <div class="info-row">
          <span class="label">{{ t('license.licenses.customer') }}:</span>
          <span class="value">{{ license.customer || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ t('license.licenses.plan') }}:</span>
          <span class="value">{{ license.planName || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="label">{{ t('license.licenses.expiresAt') }}:</span>
          <span class="value" :class="{ 'expired': isExpired }">
            {{ formatDate(license.expiresAt) }}
          </span>
        </div>
      </div>

      <!-- Usage Stats -->
      <div class="stats-section" v-if="showStats">
        <div class="stat-item">
          <div class="stat-label">{{ t('license.licenses.activationsUsed') }}</div>
          <div class="stat-value">
            {{ license.activationsUsed || 0 }} / {{ license.maxActivations || 0 }}
          </div>
          <el-progress 
            :percentage="getUsagePercentage(license.activationsUsed, license.maxActivations)"
            :stroke-width="4"
            :show-text="false"
            :status="getProgressStatus(license.activationsUsed, license.maxActivations)"
          />
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{{ t('license.licenses.machinesUsed') }}</div>
          <div class="stat-value">
            {{ license.machinesUsed || 0 }} / {{ license.maxMachines || 0 }}
          </div>
          <el-progress 
            :percentage="getUsagePercentage(license.machinesUsed, license.maxMachines)"
            :stroke-width="4"
            :show-text="false"
            :status="getProgressStatus(license.machinesUsed, license.maxMachines)"
          />
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { 
  MoreFilled, 
  View, 
  Edit, 
  Delete, 
  Download, 
  CopyDocument, 
  Close 
} from '@element-plus/icons-vue'
import { hasPerms } from '@/utils/auth'
import { formatDate } from '@/utils/dateUtil'
import StatusTag from './StatusTag.vue'

export interface License {
  id: string
  key: string
  customer: string
  customerEmail: string
  planName: string
  status: 'active' | 'expired' | 'revoked' | 'suspended'
  expiresAt: string
  activationsUsed: number
  maxActivations: number
  machinesUsed: number
  maxMachines: number
  createdAt: string
}

export interface LicenseCardProps {
  license: License
  shadow?: 'always' | 'hover' | 'never'
  showActions?: boolean
  showStats?: boolean
}

const props = withDefaults(defineProps<LicenseCardProps>(), {
  shadow: 'hover',
  showActions: true,
  showStats: true
})

const emit = defineEmits<{
  view: [license: License]
  edit: [license: License]
  delete: [license: License]
  revoke: [license: License]
  copy: [license: License]
  download: [license: License]
}>()

const { t } = useI18n()

// 检查是否过期
const isExpired = computed(() => {
  if (!props.license.expiresAt) return false
  return new Date(props.license.expiresAt) < new Date()
})

// 获取使用百分比
const getUsagePercentage = (used: number, max: number): number => {
  if (!max || max === 0) return 0
  return Math.round((used / max) * 100)
}

// 获取进度条状态
const getProgressStatus = (used: number, max: number): string => {
  const percentage = getUsagePercentage(used, max)
  if (percentage >= 90) return 'exception'
  if (percentage >= 70) return 'warning'
  return 'success'
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  switch (command) {
    case 'view':
      emit('view', props.license)
      break
    case 'edit':
      emit('edit', props.license)
      break
    case 'copy':
      handleCopyLicenseKey()
      break
    case 'download':
      emit('download', props.license)
      break
    case 'revoke':
      emit('revoke', props.license)
      break
    case 'delete':
      emit('delete', props.license)
      break
  }
}

// 复制许可证密钥
const handleCopyLicenseKey = async () => {
  try {
    await navigator.clipboard.writeText(props.license.key)
    ElMessage.success(t('license.licenses.copySuccess'))
    emit('copy', props.license)
  } catch (error) {
    ElMessage.error(t('license.licenses.copyError'))
  }
}
</script>

<style scoped>
.license-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.license-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.license-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.card-actions {
  flex-shrink: 0;
}

.license-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.label {
  font-weight: 500;
  color: var(--el-text-color-regular);
  flex-shrink: 0;
}

.value {
  color: var(--el-text-color-primary);
  text-align: right;
  word-break: break-all;
}

.value.expired {
  color: var(--el-color-danger);
  font-weight: 500;
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.stat-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

:deep(.el-dropdown-menu__item.danger-item) {
  color: var(--el-color-danger);
}

:deep(.el-dropdown-menu__item.danger-item:hover) {
  background-color: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
</style>
