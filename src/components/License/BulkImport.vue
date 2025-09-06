<template>
  <el-dialog
    v-model="visible"
    :title="t('license.common.bulkImport')"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="bulk-import-content">
      <!-- Step 1: Download Template -->
      <div class="import-step" v-if="currentStep === 1">
        <div class="step-header">
          <el-icon><Document /></el-icon>
          <h3>{{ t('license.common.step1Template') }}</h3>
        </div>
        <div class="step-content">
          <p>{{ t('license.common.downloadTemplateDesc') }}</p>
          <el-button
            type="primary"
            :icon="Download"
            @click="downloadTemplate"
            :loading="downloading"
          >
            {{ t('license.common.downloadTemplate') }}
          </el-button>
        </div>
      </div>

      <!-- Step 2: Upload File -->
      <div class="import-step" v-if="currentStep === 2">
        <div class="step-header">
          <el-icon><Upload /></el-icon>
          <h3>{{ t('license.common.step2Upload') }}</h3>
        </div>
        <div class="step-content">
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            :action="uploadUrl"
            :headers="uploadHeaders"
            :data="uploadData"
            :before-upload="beforeUpload"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :on-progress="handleUploadProgress"
            :file-list="fileList"
            :limit="1"
            accept=".xlsx,.xls"
            :auto-upload="false"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              {{ t('license.common.dragFileHere') }}
              <br>
              <em>{{ t('license.common.clickToUpload') }}</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                {{ t('license.common.uploadTip') }}
              </div>
            </template>
          </el-upload>
          
          <div class="upload-progress" v-if="uploading">
            <el-progress
              :percentage="uploadProgress"
              :status="uploadStatus"
              :stroke-width="6"
            />
            <p class="progress-text">{{ uploadProgressText }}</p>
          </div>
        </div>
      </div>

      <!-- Step 3: Preview & Validate -->
      <div class="import-step" v-if="currentStep === 3">
        <div class="step-header">
          <el-icon><View /></el-icon>
          <h3>{{ t('license.common.step3Preview') }}</h3>
        </div>
        <div class="step-content">
          <div class="import-summary">
            <el-alert
              :title="t('license.common.importSummary')"
              type="info"
              :closable="false"
              show-icon
            >
              <div class="summary-stats">
                <div class="stat-item">
                  <span class="stat-label">{{ t('license.common.totalRows') }}:</span>
                  <span class="stat-value">{{ importData.totalRows }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">{{ t('license.common.validRows') }}:</span>
                  <span class="stat-value success">{{ importData.validRows }}</span>
                </div>
                <div class="stat-item" v-if="importData.errorRows > 0">
                  <span class="stat-label">{{ t('license.common.errorRows') }}:</span>
                  <span class="stat-value error">{{ importData.errorRows }}</span>
                </div>
              </div>
            </el-alert>
          </div>

          <!-- Error Details -->
          <div class="error-details" v-if="importData.errors.length > 0">
            <h4>{{ t('license.common.errorDetails') }}</h4>
            <el-table
              :data="importData.errors"
              size="small"
              max-height="200"
              style="width: 100%"
            >
              <el-table-column
                :label="t('license.common.rowNumber')"
                prop="row"
                width="80"
              />
              <el-table-column
                :label="t('license.common.field')"
                prop="field"
                width="120"
              />
              <el-table-column
                :label="t('license.common.errorMessage')"
                prop="message"
              />
            </el-table>
          </div>

          <!-- Preview Data -->
          <div class="preview-data" v-if="importData.previewData.length > 0">
            <h4>{{ t('license.common.previewData') }}</h4>
            <el-table
              :data="importData.previewData"
              size="small"
              max-height="300"
              style="width: 100%"
            >
              <el-table-column
                v-for="column in previewColumns"
                :key="column.prop"
                :label="column.label"
                :prop="column.prop"
                show-overflow-tooltip
              />
            </el-table>
          </div>
        </div>
      </div>

      <!-- Step 4: Import Result -->
      <div class="import-step" v-if="currentStep === 4">
        <div class="step-header">
          <el-icon><SuccessFilled /></el-icon>
          <h3>{{ t('license.common.step4Result') }}</h3>
        </div>
        <div class="step-content">
          <el-result
            :icon="importResult.success ? 'success' : 'warning'"
            :title="importResult.title"
            :sub-title="importResult.subtitle"
          >
            <template #extra>
              <div class="result-stats">
                <div class="stat-card success" v-if="importResult.successCount > 0">
                  <div class="stat-number">{{ importResult.successCount }}</div>
                  <div class="stat-label">{{ t('license.common.successCount') }}</div>
                </div>
                <div class="stat-card error" v-if="importResult.failedCount > 0">
                  <div class="stat-number">{{ importResult.failedCount }}</div>
                  <div class="stat-label">{{ t('license.common.failedCount') }}</div>
                </div>
              </div>
            </template>
          </el-result>
        </div>
      </div>
    </div>

    <!-- Dialog Footer -->
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          {{ currentStep === 4 ? t('license.common.close') : t('license.common.cancel') }}
        </el-button>
        
        <el-button
          v-if="currentStep === 1"
          type="primary"
          @click="nextStep"
          :disabled="!templateDownloaded"
        >
          {{ t('license.common.next') }}
        </el-button>
        
        <el-button
          v-if="currentStep === 2"
          type="primary"
          @click="uploadFile"
          :disabled="fileList.length === 0"
          :loading="uploading"
        >
          {{ t('license.common.upload') }}
        </el-button>
        
        <el-button
          v-if="currentStep === 3"
          type="primary"
          @click="performImport"
          :disabled="importData.validRows === 0"
          :loading="importing"
        >
          {{ t('license.common.import') }}
        </el-button>
        
        <el-button
          v-if="currentStep === 4"
          type="primary"
          @click="handleClose"
        >
          {{ t('license.common.finish') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import {
  Document,
  Download,
  Upload,
  UploadFilled,
  View,
  SuccessFilled
} from '@element-plus/icons-vue'
import type { UploadInstance, UploadProps, UploadUserFile } from 'element-plus'
import { getToken } from '@/utils/auth'

export interface BulkImportProps {
  modelValue: boolean
  resourceType: 'license' | 'product' | 'plan'
  templateUrl: string
  importUrl: string
}

const props = defineProps<BulkImportProps>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'success': [result: any]
}>()

const { t } = useI18n()

// Dialog visibility
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Steps
const currentStep = ref(1)
const templateDownloaded = ref(false)

// Upload
const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadUserFile[]>([])
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref<'success' | 'exception' | undefined>()
const uploadProgressText = ref('')
const downloading = ref(false)

// Import data
const importData = ref({
  totalRows: 0,
  validRows: 0,
  errorRows: 0,
  errors: [] as Array<{ row: number; field: string; message: string }>,
  previewData: [] as any[]
})

// Import result
const importResult = ref({
  success: false,
  title: '',
  subtitle: '',
  successCount: 0,
  failedCount: 0
})

const importing = ref(false)

// Upload configuration
const uploadUrl = computed(() => props.importUrl)
const uploadHeaders = computed(() => ({
  'Authorization': `Bearer ${getToken()}`
}))
const uploadData = computed(() => ({
  resource_type: props.resourceType
}))

// Preview columns (dynamic based on resource type)
const previewColumns = computed(() => {
  const columnMap = {
    license: [
      { prop: 'customer', label: t('license.licenses.customer') },
      { prop: 'customerEmail', label: t('license.licenses.customerEmail') },
      { prop: 'planName', label: t('license.licenses.plan') },
      { prop: 'expiresAt', label: t('license.licenses.expiresAt') }
    ],
    product: [
      { prop: 'name', label: t('license.products.name') },
      { prop: 'version', label: t('license.products.version') },
      { prop: 'category', label: t('license.products.category') },
      { prop: 'description', label: t('license.products.description') }
    ],
    plan: [
      { prop: 'name', label: t('license.plans.name') },
      { prop: 'productName', label: t('license.plans.product') },
      { prop: 'type', label: t('license.plans.type') },
      { prop: 'price', label: t('license.plans.price') }
    ]
  }
  return columnMap[props.resourceType] || []
})

// Download template
const downloadTemplate = async () => {
  downloading.value = true
  try {
    const response = await fetch(props.templateUrl, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    
    if (response.ok) {
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${props.resourceType}_import_template.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
      
      templateDownloaded.value = true
      ElMessage.success(t('license.common.downloadTemplateSuccess'))
    } else {
      throw new Error('Download failed')
    }
  } catch (error) {
    ElMessage.error(t('license.common.downloadTemplateFailed'))
  } finally {
    downloading.value = false
  }
}

// Next step
const nextStep = () => {
  if (currentStep.value < 4) {
    currentStep.value += 1
  }
}

// Before upload validation
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                  file.type === 'application/vnd.ms-excel'
  
  if (!isExcel) {
    ElMessage.error(t('license.common.invalidFileType'))
    return false
  }
  
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error(t('license.common.fileTooLarge'))
    return false
  }
  
  return true
}

// Upload file
const uploadFile = () => {
  uploadRef.value?.submit()
}

// Upload progress
const handleUploadProgress: UploadProps['onProgress'] = (event) => {
  uploading.value = true
  uploadProgress.value = Math.round(event.percent || 0)
  uploadProgressText.value = t('license.common.uploadingFile', { 
    name: fileList.value[0]?.name || '' 
  })
}

// Upload success
const handleUploadSuccess: UploadProps['onSuccess'] = (response) => {
  uploading.value = false
  uploadStatus.value = 'success'
  
  // Parse response data
  importData.value = {
    totalRows: response.total_rows || 0,
    validRows: response.valid_rows || 0,
    errorRows: response.error_rows || 0,
    errors: response.errors || [],
    previewData: response.preview_data || []
  }
  
  nextStep()
  ElMessage.success(t('license.common.uploadSuccess'))
}

// Upload error
const handleUploadError: UploadProps['onError'] = (error) => {
  uploading.value = false
  uploadStatus.value = 'exception'
  ElMessage.error(t('license.common.uploadFailed'))
}

// Perform import
const performImport = async () => {
  importing.value = true
  try {
    // Call actual import API
    const response = await fetch(`${props.importUrl}/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        resource_type: props.resourceType,
        file_id: fileList.value[0]?.response?.file_id
      })
    })
    
    const result = await response.json()
    
    importResult.value = {
      success: result.success_count > 0,
      title: result.success_count > 0 ? 
        t('license.common.importSuccess') : 
        t('license.common.importFailed'),
      subtitle: t('license.common.importResultDesc', {
        success: result.success_count,
        failed: result.failed_count
      }),
      successCount: result.success_count || 0,
      failedCount: result.failed_count || 0
    }
    
    nextStep()
    emit('success', result)
    
  } catch (error) {
    ElMessage.error(t('license.common.importFailed'))
  } finally {
    importing.value = false
  }
}

// Handle close
const handleClose = () => {
  // Reset state
  currentStep.value = 1
  templateDownloaded.value = false
  fileList.value = []
  uploading.value = false
  uploadProgress.value = 0
  uploadStatus.value = undefined
  uploadProgressText.value = ''
  importing.value = false
  
  importData.value = {
    totalRows: 0,
    validRows: 0,
    errorRows: 0,
    errors: [],
    previewData: []
  }
  
  importResult.value = {
    success: false,
    title: '',
    subtitle: '',
    successCount: 0,
    failedCount: 0
  }
  
  visible.value = false
}

// Watch dialog visibility
watch(visible, (newVal) => {
  if (newVal) {
    currentStep.value = 1
    templateDownloaded.value = false
  }
})
</script>

<style scoped>
.bulk-import-content {
  min-height: 400px;
}

.import-step {
  padding: 20px 0;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.step-header h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.step-content {
  padding-left: 32px;
}

.upload-area {
  margin: 20px 0;
}

.upload-progress {
  margin-top: 20px;
}

.progress-text {
  text-align: center;
  margin-top: 8px;
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.import-summary {
  margin-bottom: 20px;
}

.summary-stats {
  display: flex;
  gap: 20px;
  margin-top: 12px;
}

.stat-item {
  display: flex;
  gap: 8px;
  align-items: center;
}

.stat-label {
  color: var(--el-text-color-regular);
}

.stat-value {
  font-weight: 600;
}

.stat-value.success {
  color: var(--el-color-success);
}

.stat-value.error {
  color: var(--el-color-danger);
}

.error-details,
.preview-data {
  margin: 20px 0;
}

.error-details h4,
.preview-data h4 {
  margin: 0 0 12px 0;
  color: var(--el-text-color-primary);
  font-size: 14px;
}

.result-stats {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 20px 0;
}

.stat-card {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  min-width: 100px;
}

.stat-card.success {
  background: var(--el-color-success-light-9);
  border: 1px solid var(--el-color-success-light-7);
}

.stat-card.error {
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
