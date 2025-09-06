<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    label-width="120px"
    class="license-form"
  >
    <el-form-item :label="t('license.licenses.plan')" prop="planId">
      <el-select
        v-model="formData.planId"
        :placeholder="t('license.licenses.planPlaceholder')"
        filterable
        clearable
        @change="handlePlanChange"
      >
        <el-option
          v-for="plan in plans"
          :key="plan.id"
          :label="`${plan.name} (${plan.productName})`"
          :value="plan.id"
        >
          <div class="plan-option">
            <span class="plan-name">{{ plan.name }}</span>
            <span class="plan-product">{{ plan.productName }}</span>
            <span class="plan-price">${{ plan.price }}/{{ plan.duration }}d</span>
          </div>
        </el-option>
      </el-select>
    </el-form-item>

    <el-form-item :label="t('license.licenses.customer')" prop="customer">
      <el-input
        v-model="formData.customer"
        :placeholder="t('license.licenses.customerPlaceholder')"
        clearable
      />
    </el-form-item>

    <el-form-item :label="t('license.licenses.customerEmail')" prop="customerEmail">
      <el-input
        v-model="formData.customerEmail"
        type="email"
        :placeholder="t('license.licenses.customerEmailPlaceholder')"
        clearable
      />
    </el-form-item>

    <el-form-item :label="t('license.licenses.expiresAt')" prop="expiresAt">
      <el-date-picker
        v-model="formData.expiresAt"
        type="datetime"
        :placeholder="t('license.licenses.expiresAtPlaceholder')"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        :disabled-date="disabledDate"
        style="width: 100%"
      />
    </el-form-item>

    <el-form-item :label="t('license.licenses.status')" prop="status" v-if="showStatus">
      <el-select
        v-model="formData.status"
        :placeholder="t('license.common.selectPlaceholder')"
      >
        <el-option value="active" :label="t('license.licenses.statusActive')" />
        <el-option value="suspended" :label="t('license.licenses.statusSuspended')" />
        <el-option value="revoked" :label="t('license.licenses.statusRevoked')" />
      </el-select>
    </el-form-item>

    <el-form-item :label="t('license.licenses.notes')" prop="notes">
      <el-input
        v-model="formData.notes"
        type="textarea"
        :rows="3"
        :placeholder="t('license.licenses.notesPlaceholder')"
        maxlength="500"
        show-word-limit
      />
    </el-form-item>

    <!-- Plan Details (Read-only) -->
    <div class="plan-details" v-if="selectedPlan">
      <el-divider>{{ t('license.plans.detail') }}</el-divider>
      
      <el-form-item :label="t('license.plans.maxActivations')">
        <el-input :value="selectedPlan.maxActivations || '∞'" readonly />
      </el-form-item>

      <el-form-item :label="t('license.plans.maxMachines')">
        <el-input :value="selectedPlan.maxMachines || '∞'" readonly />
      </el-form-item>

      <el-form-item :label="t('license.plans.duration')">
        <el-input :value="`${selectedPlan.duration} ${t('license.common.days')}`" readonly />
      </el-form-item>

      <el-form-item :label="t('license.plans.features')" v-if="selectedPlan.features">
        <el-tag
          v-for="feature in parsedFeatures"
          :key="feature"
          size="small"
          style="margin-right: 8px; margin-bottom: 4px;"
        >
          {{ feature }}
        </el-tag>
      </el-form-item>
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

export interface LicenseFormData {
  planId: string
  customer: string
  customerEmail: string
  expiresAt: string
  status?: 'active' | 'suspended' | 'revoked'
  notes?: string
}

export interface Plan {
  id: string
  name: string
  productName: string
  price: number
  duration: number
  maxActivations?: number
  maxMachines?: number
  features?: string | string[]
}

export interface LicenseFormProps {
  modelValue: LicenseFormData
  plans: Plan[]
  isEdit?: boolean
  showStatus?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<LicenseFormProps>(), {
  isEdit: false,
  showStatus: false,
  loading: false
})

const emit = defineEmits<{
  'update:modelValue': [value: LicenseFormData]
  submit: [data: LicenseFormData]
  cancel: []
}>()

const { t } = useI18n()
const formRef = ref<FormInstance>()

// Form data
const formData = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Selected plan
const selectedPlan = computed(() => {
  return props.plans.find(p => p.id === formData.value.planId)
})

// Parsed features
const parsedFeatures = computed(() => {
  if (!selectedPlan.value?.features) return []
  if (Array.isArray(selectedPlan.value.features)) {
    return selectedPlan.value.features
  }
  return selectedPlan.value.features.split('\n').filter(f => f.trim())
})

// Form validation rules
const formRules: FormRules = {
  planId: [
    { required: true, message: t('license.licenses.planRequired'), trigger: 'change' }
  ],
  customer: [
    { required: true, message: t('license.licenses.customerRequired'), trigger: 'blur' },
    { min: 2, max: 100, message: t('license.common.lengthLimit', { min: 2, max: 100 }), trigger: 'blur' }
  ],
  customerEmail: [
    { required: true, message: t('license.licenses.customerEmailRequired'), trigger: 'blur' },
    { type: 'email', message: t('license.licenses.customerEmailInvalid'), trigger: 'blur' }
  ],
  expiresAt: [
    { required: true, message: t('license.licenses.expiresAtRequired'), trigger: 'change' }
  ]
}

// Disabled dates (can't select past dates)
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

// Handle plan change
const handlePlanChange = (planId: string) => {
  const plan = props.plans.find(p => p.id === planId)
  if (plan && plan.duration) {
    // Auto-calculate expiration date based on plan duration
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + plan.duration)
    formData.value.expiresAt = expiresAt.toISOString().slice(0, 19).replace('T', ' ')
  }
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
.license-form {
  max-width: 600px;
}

.plan-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.plan-name {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.plan-product {
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.plan-price {
  color: var(--el-color-primary);
  font-weight: 500;
  font-size: 12px;
}

.plan-details {
  background: var(--el-bg-color-page);
  padding: 16px;
  border-radius: 8px;
  margin: 20px 0;
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
