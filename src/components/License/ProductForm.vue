<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="120px"
    class="product-form"
  >
    <el-form-item :label="t('license.products.name')" prop="name">
      <el-input
        v-model="formData.name"
        :placeholder="t('license.products.namePlaceholder')"
        clearable
        maxlength="100"
        show-word-limit
      />
    </el-form-item>

    <el-form-item :label="t('license.products.description')" prop="description">
      <el-input
        v-model="formData.description"
        type="textarea"
        :rows="3"
        :placeholder="t('license.products.descriptionPlaceholder')"
        maxlength="500"
        show-word-limit
      />
    </el-form-item>

    <el-form-item :label="t('license.products.version')" prop="version">
      <el-input
        v-model="formData.version"
        :placeholder="t('license.products.versionPlaceholder')"
        clearable
      />
    </el-form-item>

    <el-form-item :label="t('license.products.category')" prop="category">
      <el-select
        v-model="formData.category"
        :placeholder="t('license.products.categoryPlaceholder')"
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
        />
      </el-select>
    </el-form-item>

    <el-form-item :label="t('license.products.status')" prop="status" v-if="showStatus">
      <el-select
        v-model="formData.status"
        :placeholder="t('license.common.selectPlaceholder')"
        style="width: 100%"
      >
        <el-option value="active" :label="t('license.products.statusActive')" />
        <el-option value="inactive" :label="t('license.products.statusInactive')" />
        <el-option value="deprecated" :label="t('license.products.statusDeprecated')" />
      </el-select>
    </el-form-item>

    <!-- Metadata Section -->
    <el-divider>{{ t('license.products.metadata') }}</el-divider>
    
    <div class="metadata-section">
      <div 
        v-for="(field, index) in metadataFields" 
        :key="field.id"
        class="metadata-field"
      >
        <el-row :gutter="12">
          <el-col :span="10">
            <el-input
              v-model="field.key"
              :placeholder="t('license.products.metadataKeyPlaceholder')"
              size="small"
            />
          </el-col>
          <el-col :span="10">
            <el-input
              v-model="field.value"
              :placeholder="t('license.products.metadataValuePlaceholder')"
              size="small"
            />
          </el-col>
          <el-col :span="4">
            <el-button
              type="danger"
              size="small"
              :icon="Delete"
              @click="removeMetadataField(index)"
              :disabled="metadataFields.length <= 1"
            />
          </el-col>
        </el-row>
      </div>
      
      <el-button
        type="text"
        :icon="Plus"
        @click="addMetadataField"
        size="small"
        class="add-metadata-btn"
      >
        {{ t('license.products.addMetadata') }}
      </el-button>
    </div>

    <!-- Form Actions -->
    <el-form-item class="form-actions">
      <el-button @click="handleCancel">
        {{ t('license.common.cancel') }}
      </el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">
        {{ isEdit ? t('license.common.update') : t('license.common.create') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'

export interface ProductFormData {
  name: string
  description: string
  version: string
  category: string
  status?: 'active' | 'inactive' | 'deprecated'
  metadata?: Record<string, string>
}

export interface Category {
  label: string
  value: string
}

export interface MetadataField {
  id: number
  key: string
  value: string
}

export interface ProductFormProps {
  modelValue: ProductFormData
  categories: Category[]
  isEdit?: boolean
  showStatus?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<ProductFormProps>(), {
  isEdit: false,
  showStatus: false,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: ProductFormData]
  submit: [data: ProductFormData]
  cancel: []
}>()

const { t } = useI18n()
const formRef = ref<FormInstance>()

// Form data
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Metadata fields
const metadataFields = ref<MetadataField[]>([
  { id: 1, key: '', value: '' }
])
let metadataIdCounter = 2

// Form validation rules
const formRules: FormRules = {
  name: [
    { required: true, message: t('license.products.nameRequired'), trigger: 'blur' },
    { min: 2, max: 100, message: t('license.products.nameLength'), trigger: 'blur' }
  ],
  description: [
    { required: true, message: t('license.products.descriptionRequired'), trigger: 'blur' }
  ],
  version: [
    { required: true, message: t('license.products.versionRequired'), trigger: 'blur' },
    { 
      pattern: /^\d+\.\d+\.\d+.*$/, 
      message: t('license.products.versionInvalid'), 
      trigger: 'blur' 
    }
  ],
  category: [
    { required: true, message: t('license.products.categoryRequired'), trigger: 'change' }
  ]
}

// Initialize metadata fields from form data
const initializeMetadataFields = () => {
  if (formData.value.metadata && Object.keys(formData.value.metadata).length > 0) {
    metadataFields.value = Object.entries(formData.value.metadata).map(([key, value], index) => ({
      id: index + 1,
      key,
      value
    }))
    metadataIdCounter = metadataFields.value.length + 1
  }
}

// Add metadata field
const addMetadataField = () => {
  metadataFields.value.push({
    key: '',
    value: '',
    id: metadataIdCounter++
  })
}

// Remove metadata field
const removeMetadataField = (index: number) => {
  if (metadataFields.value.length > 1) {
    metadataFields.value.splice(index, 1)
  }
}

// Convert metadata fields to object
const getMetadataObject = (): Record<string, string> => {
  const metadata: Record<string, string> = {}
  metadataFields.value.forEach(field => {
    if (field.key.trim() && field.value.trim()) {
      metadata[field.key.trim()] = field.value.trim()
    }
  })
  return metadata
}

// Handle form submission
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // Update metadata in form data
    const updatedFormData = {
      ...formData.value,
      metadata: getMetadataObject()
    }
    
    emit('submit', updatedFormData)
  } catch (error) {
    console.error('Form validation failed:', error)
  }
}

// Handle form cancellation
const handleCancel = () => {
  emit('cancel')
}

// Reset form
const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  metadataFields.value = [{ id: 1, key: '', value: '' }]
  metadataIdCounter = 2
}

// Validate form
const validateForm = () => {
  return formRef.value?.validate()
}

// Watch for changes in form data to initialize metadata
watch(() => props.modelValue, () => {
  initializeMetadataFields()
}, { immediate: true })

// Expose methods
defineExpose({
  resetForm,
  validateForm
})
</script>

<style scoped>
.product-form {
  max-width: 600px;
}

.metadata-section {
  margin: 20px 0;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
}

.metadata-field {
  margin-bottom: 12px;
}

.metadata-field:last-of-type {
  margin-bottom: 16px;
}

.add-metadata-btn {
  width: 100%;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  height: 32px;
}

.add-metadata-btn:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.form-actions {
  margin-top: 30px;
  text-align: right;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-divider__text) {
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
