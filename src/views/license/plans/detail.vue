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
          <el-breadcrumb-item>{{ $t('license.plans.detail') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ planData.name }}</h2>
            <el-tag :type="planData.status === 'active' ? 'success' : 'danger'">
              {{ planData.status === 'active' ? $t('license.plans.active') : $t('license.plans.inactive') }}
            </el-tag>
            <el-tag v-if="planData.isPopular" type="warning">
              {{ $t('license.plans.popular') }}
            </el-tag>
          </div>
          <div class="action-section">
            <el-button type="primary" @click="handleEdit">
              {{ $t('common.edit') }}
            </el-button>
            <el-button @click="handleBack">
              {{ $t('common.back') }}
            </el-button>
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.plans.basicInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.plans.name')">
                  {{ planData.name }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.version')">
                  {{ planData.version }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.price')" :span="2">
                  {{ planData.price }} {{ planData.currency }} / {{ $t(`license.plans.${planData.billingCycle}`) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.description')" :span="2">
                  {{ planData.description }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.plans.limitations') }}</span>
              </template>
              
              <el-descriptions :column="3" border>
                <el-descriptions-item :label="$t('license.plans.maxUsers')">
                  {{ planData.maxUsers || $t('common.unlimited') }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.maxDevices')">
                  {{ planData.maxDevices || $t('common.unlimited') }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.plans.validityDays')">
                  {{ planData.validityDays ? `${planData.validityDays} ${$t('common.days')}` : $t('common.unlimited') }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.plans.features') }}</span>
              </template>
              
              <div class="features-content">
                <pre>{{ planData.features }}</pre>
              </div>
            </el-card>

            <el-card v-if="planData.limitations" class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.plans.limitations') }}</span>
              </template>
              
              <div class="limitations-content">
                <pre>{{ planData.limitations }}</pre>
              </div>
            </el-card>

            <el-card v-if="planData.metadata" class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.plans.metadata') }}</span>
              </template>
              
              <div class="metadata-content">
                <pre>{{ formatMetadata(planData.metadata) }}</pre>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span>{{ $t('license.plans.statistics') }}</span>
              </template>
              
              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.totalLicenses }}</div>
                  <div class="stat-label">{{ $t('license.plans.totalLicenses') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.activeLicenses }}</div>
                  <div class="stat-label">{{ $t('license.plans.activeLicenses') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.revenue }}</div>
                  <div class="stat-label">{{ $t('license.plans.totalRevenue') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ statistics.activeUsers }}</div>
                  <div class="stat-label">{{ $t('license.plans.activeUsers') }}</div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.plans.timeline') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('common.createdAt')">
                  {{ formatDate(planData.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedAt')">
                  {{ formatDate(planData.updatedAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.createdBy')">
                  {{ planData.createdBy }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedBy')">
                  {{ planData.updatedBy }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)

interface PlanData {
  id: string
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
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

interface Statistics {
  totalLicenses: number
  activeLicenses: number
  revenue: string
  activeUsers: number
}

const planData = reactive<PlanData>({
  id: '',
  name: '',
  version: '',
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
  metadata: '',
  createdAt: '',
  updatedAt: '',
  createdBy: '',
  updatedBy: ''
})

const statistics = reactive<Statistics>({
  totalLicenses: 0,
  activeLicenses: 0,
  revenue: '$0',
  activeUsers: 0
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
    // const [planResult, statsResult] = await Promise.all([
    //   getPlanById(planId),
    //   getPlanStatistics(planId)
    // ])
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟计划数据
    Object.assign(planData, {
      id: planId,
      name: 'Professional Plan',
      version: '2.1.0',
      description: 'A professional license plan for teams and businesses',
      price: 99.99,
      currency: 'USD',
      billingCycle: 'monthly',
      maxUsers: 10,
      maxDevices: 25,
      validityDays: 30,
      features: `Advanced Analytics
Multi-user Support
Priority Support
Custom Integrations
API Access
Cloud Storage: 100GB
Advanced Security Features`,
      limitations: `API Rate Limit: 10,000/day
Storage Limit: 100GB
Support: Business Hours Only`,
      status: 'active',
      isPopular: true,
      metadata: '{"category": "business", "priority": 2, "features": ["analytics", "multi-user", "api"]}',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-10T14:45:00Z',
      createdBy: 'admin@example.com',
      updatedBy: 'manager@example.com'
    })

    // 模拟统计数据
    Object.assign(statistics, {
      totalLicenses: 156,
      activeLicenses: 142,
      revenue: '$14,158.44',
      activeUsers: 1240
    })
  } catch (error) {
    console.error('Load plan data failed:', error)
    ElMessage.error(t('license.plans.loadFailed'))
    router.push('/license/plans')
  } finally {
    loading.value = false
  }
}

const formatMetadata = (metadata: string) => {
  try {
    return JSON.stringify(JSON.parse(metadata), null, 2)
  } catch {
    return metadata
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const handleEdit = () => {
  router.push(`/license/plans/edit/${planData.id}`)
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadPlanData()
})
</script>

<style scoped>
.main-container {
  padding: 20px;
}

.detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.title-section {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-section h2 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.action-section {
  display: flex;
  gap: 10px;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-card :deep(.el-card__header) {
  background-color: var(--el-bg-color-page);
  font-weight: 600;
}

.stats-card :deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.stats-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 10px;
  border-radius: 4px;
  background-color: var(--el-bg-color);
}

.stat-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.features-content,
.limitations-content,
.metadata-content {
  background-color: var(--el-bg-color-page);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.features-content pre,
.limitations-content pre,
.metadata-content pre {
  margin: 0;
  font-family: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
}

:deep(.el-descriptions__body) {
  background-color: var(--el-bg-color);
}

:deep(.el-descriptions-item__label) {
  font-weight: 500;
  background-color: var(--el-bg-color-page);
}
</style>
