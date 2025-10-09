<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="120px"
    class="plan-form"
  >
    <el-form-item :label="t('license.plans.name')" prop="name">
      <el-input
        v-model="formData.name"
        :placeholder="t('license.plans.namePlaceholder')"
        clearable
        maxlength="100"
        show-word-limit
      />
    </el-form-item>

    <el-form-item :label="t('license.plans.product')" prop="productId">
      <el-select
        v-model="formData.productId"
        :placeholder="t('license.plans.productPlaceholder')"
        filterable
        clearable
        style="width: 100%"
      >
        <el-option
          v-for="product in products"
          :key="product.id"
          :label="product.name"
          :value="product.id"
        >
          <div class="product-option">
            <span class="product-name">{{ product.name }}</span>
            <span class="product-version">v{{ product.version }}</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item :label="t('license.plans.type')" prop="type">
      <el-select
        v-model="formData.type"
        :placeholder="t('license.plans.typePlaceholder')"
        style="width: 100%"
      >
        <el-option value="basic" :label="t('license.plans.typeBasic')" />
        <el-option value="pro" :label="t('license.plans.typePro')" />
        <el-option value="enterprise" :label="t('license.plans.typeEnterprise')" />
        <el-option value="custom" :label="t('license.plans.typeCustom')" />
      </el-select>
    </el-form-item>

    <el-form-item :label="t('license.plans.description')" prop="description">
      <el-input
        v-model="formData.description"
        type="textarea"
        :rows="3"
        :placeholder="t('license.plans.descriptionPlaceholder')"
        maxlength="500"
        show-word-limit
      />
    </el-form-item>

    <!-- Pricing Section -->
    <el-divider>{{ t('license.common.pricing') }}</el-divider>
    
    <el-row :gutter="16">
      <el-col :span="12">
        <el-form-item :label="t('license.plans.price')" prop="price">
          <el-input-number
            v-model="formData.price"
            :min="0"
            :precision="2"
            :placeholder="t('license.plans.pricePlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item :label="t('license.plans.currency')" prop="currency">
          <el-select
            v-model="formData.currency"
            style="width: 100%"
          >
            <el-option value="USD" :label="t('license.plans.currencyUSD')" />
            <el-option value="EUR" :label="t('license.plans.currencyEUR')" />
            <el-option value="CNY" :label="t('license.plans.currencyCNY')" />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Limits Section -->
    <el-divider>{{ t('license.common.limits') }}</el-divider>
    
    <el-row :gutter="16">
      <el-col :span="8">
        <el-form-item :label="t('license.plans.defaultValidityDays')" prop="defaultValidityDays">
          <el-input-number
            v-model="formData.defaultValidityDays"
            :min="1"
            :placeholder="t('license.plans.defaultValidityDaysPlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="t('license.plans.defaultMaxActivations')" prop="defaultMaxActivations">
          <el-input-number
            v-model="formData.defaultMaxActivations"
            :min="1"
            :placeholder="t('license.plans.defaultMaxActivationsPlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
      <el-col :span="8">
        <el-form-item :label="t('license.plans.maxActivations')" prop="maxActivations">
          <el-input-number
            v-model="formData.maxActivations"
            :min="1"
            :placeholder="t('license.plans.maxActivationsPlaceholder')"
            style="width: 100%"
          />
        </el-form-item>
      </el-col>
    </el-row>

    <!-- Features Section -->
    <el-divider>{{ t('license.plans.features') }}</el-divider>
    
    <el-form-item :label="t('license.plans.features')" prop="features">
      <el-input
        v-model="formData.features"
        type="textarea"
        :rows="4"
        :placeholder="t('license.plans.featuresPlaceholder')"
        maxlength="1000"
        show-word-limit
      />
    </el-form-item>

    <el-form-item :label="t('license.plans.restrictions')" prop="restrictions">
      <el-input
        v-model="formData.restrictions"
        type="textarea"
        :rows="3"
        :placeholder="t('license.plans.restrictionsPlaceholder')"
        maxlength="1000"
        show-word-limit
      />
    </el-form-item>

    <el-form-item :label="t('license.plans.status')" prop="status" v-if="showStatus">
      <el-select
        v-model="formData.status"
        :placeholder="t('license.common.selectPlaceholder')"
        style="width: 100%"
      >
        <el-option value="active" :label="t('license.plans.statusActive')" />
        <el-option value="inactive" :label="t('license.plans.statusInactive')" />
        <el-option value="archived" :label="t('license.plans.statusArchived')" />
      </el-select>
    </el-form-item>

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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance, FormRules } from 'element-plus'

export interface PlanFormData {
  name: string
  productId: string
  type: 'basic' | 'pro' | 'enterprise' | 'custom'
  description: string
  price: number
  currency: string
  defaultValidityDays: number      // 新字段名：默认有效天数
  defaultMaxActivations: number   // 新字段名：默认最大激活数
  features: string
  restrictions: string
  status?: 'active' | 'inactive' | 'archived'
}

export interface Product {
  id: string
  name: string
  version: string
}

export interface PlanFormProps {
  modelValue: PlanFormData
  products: Product[]
  isEdit?: boolean
  showStatus?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<PlanFormProps>(), {
  isEdit: false,
  showStatus: false,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: PlanFormData]
  submit: [data: PlanFormData]
  cancel: []
}>()

const { t } = useI18n()
const formRef = ref<FormInstance>()

// Form data
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form validation rules
const formRules: FormRules = {
  name: [
    { required: true, message: t('license.plans.nameRequired'), trigger: 'blur' },
    { min: 2, max: 100, message: t('license.plans.nameLength'), trigger: 'blur' }
  ],
  productId: [
    { required: true, message: t('license.plans.productRequired'), trigger: 'change' }
  ],
  type: [
    { required: true, message: t('license.plans.typeRequired'), trigger: 'change' }
  ],
  price: [
    { required: true, message: t('license.plans.priceRequired'), trigger: 'blur' },
    { type: 'number', min: 0, message: t('license.plans.priceInvalid'), trigger: 'blur' }
  ],
  defaultValidityDays: [
    { required: true, message: t('license.plans.defaultValidityDaysRequired'), trigger: 'blur' },
    { type: 'number', min: 1, message: t('license.plans.defaultValidityDaysInvalid'), trigger: 'blur' }
  ],
  defaultMaxActivations: [
    { required: true, message: t('license.plans.defaultMaxActivationsRequired'), trigger: 'blur' },
    { type: 'number', min: 1, message: t('license.plans.defaultMaxActivationsInvalid'), trigger: 'blur' }
  ],
  maxActivations: [
    { required: true, message: t('license.plans.maxActivationsRequired'), trigger: 'blur' },
    { type: 'number', min: 1, message: t('license.plans.maxActivationsInvalid'), trigger: 'blur' }
  ]
}

// Handle form submission
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    emit('submit', formData.value)
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
}

// Validate form
const validateForm = () => {
  return formRef.value?.validate()
}

// Expose methods
defineExpose({
  resetForm,
  validateForm
})
</script>

<style scoped>
.plan-form {
  max-width: 800px;
}

.product-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.product-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.product-version {
  color: var(--el-text-color-secondary);
  font-size: 12px;
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
