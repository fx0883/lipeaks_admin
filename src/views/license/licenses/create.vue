<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t('license.dashboard') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/licenses' }">
            {{ $t('license.licenses.title') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('license.licenses.create') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="create-container">
        <el-form
          ref="formRef"
          :model="form" 
          :rules="rules"
          label-width="140px"
          label-position="left"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.licenseKey')" prop="licenseKey">
                <el-input
                  v-model="form.licenseKey"
                  :placeholder="$t('license.licenses.licenseKeyPlaceholder')"
                  readonly
                />
                <el-button 
                  type="primary" 
                  size="small" 
                  @click="generateLicenseKey"
                  style="margin-top: 5px;"
                >
                  {{ $t('license.licenses.generateKey') }}
                </el-button>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.planId')" prop="planId">
                <el-select v-model="form.planId" :placeholder="$t('license.licenses.selectPlan')" style="width: 100%">
                  <el-option
                    v-for="plan in availablePlans"
                    :key="plan.id"
                    :label="plan.name"
                    :value="plan.id"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.customerName')" prop="customerName">
                <el-input
                  v-model="form.customerName"
                  :placeholder="$t('license.licenses.customerNamePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.customerEmail')" prop="customerEmail">
                <el-input
                  v-model="form.customerEmail"
                  :placeholder="$t('license.licenses.customerEmailPlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('license.licenses.description')" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              :placeholder="$t('license.licenses.descriptionPlaceholder')"
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item :label="$t('license.licenses.maxUsers')" prop="maxUsers">
                <el-input-number
                  v-model="form.maxUsers"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('license.licenses.maxDevices')" prop="maxDevices">
                <el-input-number
                  v-model="form.maxDevices"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('license.licenses.validityDays')" prop="validityDays">
                <el-input-number
                  v-model="form.validityDays"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.issueDate')" prop="issueDate">
                <el-date-picker
                  v-model="form.issueDate"
                  type="datetime"
                  :placeholder="$t('license.licenses.issueDatePlaceholder')"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.expiryDate')" prop="expiryDate">
                <el-date-picker
                  v-model="form.expiryDate"
                  type="datetime"
                  :placeholder="$t('license.licenses.expiryDatePlaceholder')"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('license.licenses.allowedIPs')" prop="allowedIPs">
            <el-input
              v-model="form.allowedIPs"
              :placeholder="$t('license.licenses.allowedIPsPlaceholder')"
              clearable
            />
            <div class="form-tip">{{ $t('license.licenses.allowedIPsTip') }}</div>
          </el-form-item>

          <el-form-item :label="$t('license.licenses.allowedDomains')" prop="allowedDomains">
            <el-input
              v-model="form.allowedDomains"
              :placeholder="$t('license.licenses.allowedDomainsPlaceholder')"
              clearable
            />
            <div class="form-tip">{{ $t('license.licenses.allowedDomainsTip') }}</div>
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.status')" prop="status">
                <el-radio-group v-model="form.status">
                  <el-radio value="active">{{ $t('license.licenses.active') }}</el-radio>
                  <el-radio value="inactive">{{ $t('license.licenses.inactive') }}</el-radio>
                  <el-radio value="suspended">{{ $t('license.licenses.suspended') }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.licenses.autoRenew')" prop="autoRenew">
                <el-switch v-model="form.autoRenew" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('license.licenses.features')" prop="features">
            <el-checkbox-group v-model="form.features">
              <el-checkbox value="analytics">{{ $t('license.licenses.featureAnalytics') }}</el-checkbox>
              <el-checkbox value="api_access">{{ $t('license.licenses.featureApiAccess') }}</el-checkbox>
              <el-checkbox value="priority_support">{{ $t('license.licenses.featurePrioritySupport') }}</el-checkbox>
              <el-checkbox value="cloud_storage">{{ $t('license.licenses.featureCloudStorage') }}</el-checkbox>
              <el-checkbox value="multi_user">{{ $t('license.licenses.featureMultiUser') }}</el-checkbox>
              <el-checkbox value="custom_integration">{{ $t('license.licenses.featureCustomIntegration') }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item :label="$t('license.licenses.metadata')" prop="metadata">
            <el-input
              v-model="form.metadata"
              type="textarea"
              :rows="3"
              :placeholder="$t('license.licenses.metadataPlaceholder')"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">
              {{ $t('common.create') }}
            </el-button>
            <el-button @click="handleCancel">
              {{ $t('common.cancel') }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

interface LicenseForm {
  licenseKey: string
  planId: string
  customerName: string
  customerEmail: string
  description: string
  maxUsers: number | null
  maxDevices: number | null
  validityDays: number | null
  issueDate: Date | null
  expiryDate: Date | null
  allowedIPs: string
  allowedDomains: string
  status: string
  autoRenew: boolean
  features: string[]
  metadata: string
}

interface Plan {
  id: string
  name: string
  version: string
}

const form = reactive<LicenseForm>({
  licenseKey: '',
  planId: '',
  customerName: '',
  customerEmail: '',
  description: '',
  maxUsers: null,
  maxDevices: null,
  validityDays: null,
  issueDate: new Date(),
  expiryDate: null,
  allowedIPs: '',
  allowedDomains: '',
  status: 'active',
  autoRenew: false,
  features: [],
  metadata: ''
})

const availablePlans = ref<Plan[]>([])

const rules = reactive<FormRules<LicenseForm>>({
  licenseKey: [
    { required: true, message: t('license.licenses.licenseKeyRequired'), trigger: 'blur' }
  ],
  planId: [
    { required: true, message: t('license.licenses.planIdRequired'), trigger: 'change' }
  ],
  customerName: [
    { required: true, message: t('license.licenses.customerNameRequired'), trigger: 'blur' }
  ],
  customerEmail: [
    { required: true, message: t('license.licenses.customerEmailRequired'), trigger: 'blur' },
    { type: 'email', message: t('license.licenses.customerEmailInvalid'), trigger: 'blur' }
  ],
  issueDate: [
    { required: true, message: t('license.licenses.issueDateRequired'), trigger: 'change' }
  ],
  expiryDate: [
    { required: true, message: t('license.licenses.expiryDateRequired'), trigger: 'change' }
  ],
  status: [
    { required: true, message: t('license.licenses.statusRequired'), trigger: 'change' }
  ]
})

const loadAvailablePlans = async () => {
  try {
    // TODO: 实现获取可用计划的API调用
    // const result = await getAvailablePlans()
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 300))
    
    availablePlans.value = [
      { id: '1', name: 'Basic Plan', version: '1.0.0' },
      { id: '2', name: 'Professional Plan', version: '2.1.0' },
      { id: '3', name: 'Enterprise Plan', version: '3.0.0' }
    ]
  } catch (error) {
    console.error('Load plans failed:', error)
    ElMessage.error(t('license.licenses.loadPlansFailed'))
  }
}

const generateLicenseKey = () => {
  // 生成许可证密钥的逻辑
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let key = ''
  for (let i = 0; i < 25; i++) {
    if (i > 0 && i % 5 === 0) key += '-'
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.licenseKey = key
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // TODO: 实现创建许可证的API调用
    // const result = await createLicense(form)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(t('license.licenses.createSuccess'))
    router.push('/license/licenses')
  } catch (error) {
    console.error('Create license failed:', error)
    ElMessage.error(t('license.licenses.createFailed'))
  } finally {
    submitting.value = false
  }
}

const handleCancel = () => {
  ElMessageBox.confirm(
    t('common.unsavedChangesMessage'),
    t('common.confirmTitle'),
    {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning'
    }
  ).then(() => {
    router.back()
  }).catch(() => {
    // 用户取消操作
  })
}

onMounted(() => {
  loadAvailablePlans()
  generateLicenseKey()
})
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.create-container {
  max-width: 900px;
  margin: 0 auto;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 5px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}

:deep(.el-input-number) {
  width: 100%;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}
</style>
