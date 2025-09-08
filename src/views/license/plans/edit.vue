<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t('license.dashboard') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/plans' }">
            {{ $t('license.plans.title') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('license.plans.edit') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="edit-container">
        <el-form
          ref="formRef"
          :model="form" 
          :rules="rules"
          label-width="120px"
          label-position="left"
        >
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.name')" prop="name">
                <el-input
                  v-model="form.name"
                  :placeholder="$t('license.plans.namePlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.version')" prop="version">
                <el-input
                  v-model="form.version"
                  :placeholder="$t('license.plans.versionPlaceholder')"
                  clearable
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('license.plans.description')" prop="description">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              :placeholder="$t('license.plans.descriptionPlaceholder')"
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.price')" prop="price">
                <el-input-number
                  v-model="form.price"
                  :min="0"
                  :precision="2"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.currency')" prop="currency">
                <el-select v-model="form.currency" style="width: 100%">
                  <el-option label="USD" value="USD" />
                  <el-option label="EUR" value="EUR" />
                  <el-option label="CNY" value="CNY" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.billingCycle')" prop="billingCycle">
                <el-select v-model="form.billingCycle" style="width: 100%">
                  <el-option :label="$t('license.plans.monthly')" value="monthly" />
                  <el-option :label="$t('license.plans.yearly')" value="yearly" />
                  <el-option :label="$t('license.plans.lifetime')" value="lifetime" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.maxUsers')" prop="maxUsers">
                <el-input-number
                  v-model="form.maxUsers"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.maxDevices')" prop="maxDevices">
                <el-input-number
                  v-model="form.maxDevices"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('license.plans.validityDays')" prop="validityDays">
                <el-input-number
                  v-model="form.validityDays"
                  :min="1"
                  :step="1"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('license.plans.features')" prop="features">
            <el-input
              v-model="form.features"
              type="textarea"
              :rows="4"
              :placeholder="$t('license.plans.featuresPlaceholder')"
            />
          </el-form-item>

          <el-form-item :label="$t('license.plans.limitations')" prop="limitations">
            <el-input
              v-model="form.limitations"
              type="textarea"
              :rows="3"
              :placeholder="$t('license.plans.limitationsPlaceholder')"
            />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.status')" prop="status">
                <el-radio-group v-model="form.status">
                  <el-radio value="active">{{ $t('license.plans.active') }}</el-radio>
                  <el-radio value="inactive">{{ $t('license.plans.inactive') }}</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item :label="$t('license.plans.isPopular')" prop="isPopular">
                <el-switch v-model="form.isPopular" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item :label="$t('license.plans.metadata')" prop="metadata">
            <el-input
              v-model="form.metadata"
              type="textarea"
              :rows="3"
              :placeholder="$t('license.plans.metadataPlaceholder')"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSubmit" :loading="submitting">
              {{ $t('common.save') }}
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
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

interface PlanForm {
  id?: string
  name: string
  version: string
  description: string
  price: number
  currency: string
  billingCycle: string
  maxUsers: number | null
  maxDevices: number | null
  validityDays: number | null
  features: string
  limitations: string
  status: string
  isPopular: boolean
  metadata: string
}

const form = reactive<PlanForm>({
  name: '',
  version: '1.0.0',
  description: '',
  price: 0,
  currency: 'USD',
  billingCycle: 'monthly',
  maxUsers: null,
  maxDevices: null,
  validityDays: null,
  features: '',
  limitations: '',
  status: 'active',
  isPopular: false,
  metadata: ''
})

const rules = reactive<FormRules<PlanForm>>({
  name: [
    { required: true, message: t('license.plans.nameRequired'), trigger: 'blur' }
  ],
  version: [
    { required: true, message: t('license.plans.versionRequired'), trigger: 'blur' }
  ],
  description: [
    { required: true, message: t('license.plans.descriptionRequired'), trigger: 'blur' }
  ],
  price: [
    { required: true, message: t('license.plans.priceRequired'), trigger: 'blur' }
  ],
  currency: [
    { required: true, message: t('license.plans.currencyRequired'), trigger: 'change' }
  ],
  billingCycle: [
    { required: true, message: t('license.plans.billingCycleRequired'), trigger: 'change' }
  ],
  status: [
    { required: true, message: t('license.plans.statusRequired'), trigger: 'change' }
  ]
})

const loadPlanData = async () => {
  const planId = route.params.id
  if (!planId) {
    ElMessage.error(t('license.plans.invalidId'))
    router.push('/license/plans')
    return
  }

  loading.value = true
  try {
    // TODO: 实现获取计划详情的API调用
    // const result = await getPlanById(planId)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟数据
    Object.assign(form, {
      id: planId,
      name: 'Basic Plan',
      version: '1.0.0',
      description: 'A basic license plan for individual users',
      price: 29.99,
      currency: 'USD',
      billingCycle: 'monthly',
      maxUsers: 1,
      maxDevices: 2,
      validityDays: 30,
      features: 'Basic features\nEmail support\nCloud storage: 10GB',
      limitations: 'Limited API calls\nNo premium features',
      status: 'active',
      isPopular: false,
      metadata: '{"category": "individual", "priority": 1}'
    })
  } catch (error) {
    console.error('Load plan data failed:', error)
    ElMessage.error(t('license.plans.loadFailed'))
    router.push('/license/plans')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    // TODO: 实现更新计划的API调用
    // const result = await updatePlan(form.id, form)
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    ElMessage.success(t('license.plans.updateSuccess'))
    router.push('/license/plans')
  } catch (error) {
    console.error('Update plan failed:', error)
    ElMessage.error(t('license.plans.updateFailed'))
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
  loadPlanData()
})
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.edit-container {
  max-width: 800px;
  margin: 0 auto;
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
</style>
