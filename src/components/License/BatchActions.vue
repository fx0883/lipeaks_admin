<template>
  <div class="batch-actions" v-show="selectedItems.length > 0">
    <div class="batch-info">
      <el-icon><Select /></el-icon>
      <span class="selected-count">
        {{ t('license.common.selectedCount', { count: selectedItems.length }) }}
      </span>
    </div>
    
    <div class="batch-buttons">
      <!-- Delete Action -->
      <el-button
        type="danger"
        size="small"
        :icon="Delete"
        @click="handleBatchDelete"
        :loading="loading.delete"
        v-if="showDelete && hasPerms(deletePermission)"
      >
        {{ t('license.common.batchDelete') }}
      </el-button>
      
      <!-- Revoke Action (for licenses/activations) -->
      <el-button
        type="warning"
        size="small"
        :icon="Close"
        @click="handleBatchRevoke"
        :loading="loading.revoke"
        v-if="showRevoke && hasPerms(revokePermission)"
      >
        {{ t('license.common.batchRevoke') }}
      </el-button>
      
      <!-- Unbind Action (for machines) -->
      <el-button
        type="info"
        size="small"
        :icon="Unlock"
        @click="handleBatchUnbind"
        :loading="loading.unbind"
        v-if="showUnbind && hasPerms(unbindPermission)"
      >
        {{ t('license.machines.batchUnbind') }}
      </el-button>
      
      <!-- Status Update Action -->
      <el-dropdown
        @command="handleStatusUpdate"
        v-if="showStatusUpdate && hasPerms(updatePermission)"
      >
        <el-button size="small" :icon="Edit" :loading="loading.statusUpdate">
          {{ t('license.common.updateStatus') }}
          <el-icon class="el-icon--right"><ArrowDown /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item 
              v-for="status in statusOptions" 
              :key="status.value"
              :command="status.value"
            >
              <StatusTag :status="status.value" size="small" />
              {{ status.label }}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      
      <!-- Export Action -->
      <el-button
        type="success"
        size="small"
        :icon="Download"
        @click="handleBatchExport"
        :loading="loading.export"
        v-if="showExport && hasPerms(exportPermission)"
      >
        {{ t('license.common.export') }}
      </el-button>
      
      <!-- Clear Selection -->
      <el-button
        size="small"
        :icon="Close"
        @click="handleClearSelection"
        class="clear-btn"
      >
        {{ t('license.common.clearSelection') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Select,
  Delete,
  Close,
  Unlock,
  Edit,
  Download,
  ArrowDown
} from '@element-plus/icons-vue'
import { hasPerms } from '@/utils/auth'
import StatusTag from './StatusTag.vue'

export interface BatchActionsProps {
  selectedItems: any[]
  resourceType: 'license' | 'machine' | 'activation' | 'product' | 'plan'
  showDelete?: boolean
  showRevoke?: boolean
  showUnbind?: boolean
  showStatusUpdate?: boolean
  showExport?: boolean
  statusOptions?: Array<{ value: string; label: string }>
}

const props = withDefaults(defineProps<BatchActionsProps>(), {
  showDelete: true,
  showRevoke: false,
  showUnbind: false,
  showStatusUpdate: false,
  showExport: true,
  statusOptions: () => []
})

const emit = defineEmits<{
  batchDelete: [items: any[]]
  batchRevoke: [items: any[]]
  batchUnbind: [items: any[]]
  batchStatusUpdate: [items: any[], status: string]
  batchExport: [items: any[]]
  clearSelection: []
}>()

const { t } = useI18n()

// Loading states
const loading = ref({
  delete: false,
  revoke: false,
  unbind: false,
  statusUpdate: false,
  export: false
})

// Permission mappings
const deletePermission = computed(() => `${props.resourceType}:delete`)
const revokePermission = computed(() => `${props.resourceType}:revoke`)
const unbindPermission = computed(() => `${props.resourceType}:unbind`)
const updatePermission = computed(() => `${props.resourceType}:edit`)
const exportPermission = computed(() => `${props.resourceType}:export`)

// Handle batch delete
const handleBatchDelete = async () => {
  if (props.selectedItems.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      t('license.common.confirmBatchDeleteMessage', { count: props.selectedItems.length }),
      t('license.common.confirmBatchDelete'),
      {
        type: 'warning',
        confirmButtonText: t('license.common.confirm'),
        cancelButtonText: t('license.common.cancel')
      }
    )
    
    loading.value.delete = true
    emit('batchDelete', props.selectedItems)
  } catch (error) {
    // User cancelled
  } finally {
    loading.value.delete = false
  }
}

// Handle batch revoke
const handleBatchRevoke = async () => {
  if (props.selectedItems.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      t('license.common.confirmBatchRevokeMessage', { count: props.selectedItems.length }),
      t('license.common.confirmBatchRevoke'),
      {
        type: 'warning',
        confirmButtonText: t('license.common.confirm'),
        cancelButtonText: t('license.common.cancel')
      }
    )
    
    loading.value.revoke = true
    emit('batchRevoke', props.selectedItems)
  } catch (error) {
    // User cancelled
  } finally {
    loading.value.revoke = false
  }
}

// Handle batch unbind
const handleBatchUnbind = async () => {
  if (props.selectedItems.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      t('license.machines.confirmBatchUnbindMessage', { count: props.selectedItems.length }),
      t('license.machines.confirmBatchUnbind'),
      {
        type: 'warning',
        confirmButtonText: t('license.common.confirm'),
        cancelButtonText: t('license.common.cancel')
      }
    )
    
    loading.value.unbind = true
    emit('batchUnbind', props.selectedItems)
  } catch (error) {
    // User cancelled
  } finally {
    loading.value.unbind = false
  }
}

// Handle status update
const handleStatusUpdate = async (status: string) => {
  if (props.selectedItems.length === 0) return
  
  try {
    await ElMessageBox.confirm(
      t('license.common.confirmBatchStatusUpdateMessage', { 
        count: props.selectedItems.length,
        status: status 
      }),
      t('license.common.confirmBatchStatusUpdate'),
      {
        type: 'info',
        confirmButtonText: t('license.common.confirm'),
        cancelButtonText: t('license.common.cancel')
      }
    )
    
    loading.value.statusUpdate = true
    emit('batchStatusUpdate', props.selectedItems, status)
  } catch (error) {
    // User cancelled
  } finally {
    loading.value.statusUpdate = false
  }
}

// Handle batch export
const handleBatchExport = () => {
  if (props.selectedItems.length === 0) return
  
  loading.value.export = true
  emit('batchExport', props.selectedItems)
  
  // Reset loading after a short delay
  setTimeout(() => {
    loading.value.export = false
  }, 2000)
}

// Handle clear selection
const handleClearSelection = () => {
  emit('clearSelection')
}
</script>

<style scoped>
.batch-actions {
  position: sticky;
  bottom: 20px;
  z-index: 100;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  padding: 12px 16px;
  box-shadow: var(--el-box-shadow-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 16px 0;
}

.batch-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.selected-count {
  font-size: 14px;
}

.batch-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.clear-btn {
  border-color: var(--el-border-color);
  color: var(--el-text-color-regular);
}

.clear-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .batch-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .batch-buttons {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>
