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
          <el-breadcrumb-item>{{ $t('license.licenses.detail') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ licenseData.customerName }}</h2>
            <el-tag :type="getStatusType(licenseData.status)">
              {{ $t(`license.licenses.${licenseData.status}`) }}
            </el-tag>
            <el-tag v-if="licenseData.autoRenew" type="success">
              {{ $t('license.licenses.autoRenewEnabled') }}
            </el-tag>
            <el-tag v-if="isExpiringSoon" type="warning">
              {{ $t('license.licenses.expiringSoon') }}
            </el-tag>
          </div>
          <div class="action-section">
            <el-dropdown @command="handleAction">
              <el-button type="primary">
                {{ $t('common.actions') }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">{{ $t('common.edit') }}</el-dropdown-item>
                  <el-dropdown-item command="activate" :disabled="licenseData.status === 'active'">
                    {{ $t('license.licenses.activate') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="suspend" :disabled="licenseData.status !== 'active'">
                    {{ $t('license.licenses.suspend') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="renew">{{ $t('license.licenses.renew') }}</el-dropdown-item>
                  <el-dropdown-item command="export" divided>{{ $t('license.licenses.exportLicense') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button @click="handleBack">
              {{ $t('common.back') }}
            </el-button>
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.basicInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.licenses.licenseKey')" :span="2">
                  <div class="license-key">
                    <code>{{ licenseData.licenseKey }}</code>
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="copyLicenseKey"
                      style="margin-left: 10px;"
                    >
                      {{ $t('common.copy') }}
                    </el-button>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.customerName')">
                  {{ licenseData.customerName }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.customerEmail')">
                  {{ licenseData.customerEmail }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.planName')">
                  {{ licenseData.planName }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.planVersion')">
                  {{ licenseData.planVersion }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.description')" :span="2">
                  {{ licenseData.description }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.validity') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.licenses.issueDate')">
                  {{ formatDate(licenseData.issueDate) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.expiryDate')">
                  <span :class="{ 'expiring-soon': isExpiringSoon, 'expired': isExpired }">
                    {{ formatDate(licenseData.expiryDate) }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.validityDays')">
                  {{ licenseData.validityDays }} {{ $t('common.days') }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.remainingDays')">
                  <span :class="{ 'expiring-soon': remainingDays <= 30, 'expired': remainingDays <= 0 }">
                    {{ remainingDays }} {{ $t('common.days') }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.limitations') }}</span>
              </template>
              
              <el-descriptions :column="3" border>
                <el-descriptions-item :label="$t('license.licenses.maxUsers')">
                  <span class="usage-info">
                    {{ usageData.currentUsers }} / {{ licenseData.maxUsers || $t('common.unlimited') }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.maxDevices')">
                  <span class="usage-info">
                    {{ usageData.currentDevices }} / {{ licenseData.maxDevices || $t('common.unlimited') }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.activations')">
                  <span class="usage-info">
                    {{ usageData.totalActivations }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.security') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('license.licenses.allowedIPs')">
                  <div v-if="licenseData.allowedIPs">
                    <el-tag v-for="ip in licenseData.allowedIPs.split(',')" :key="ip.trim()" class="ip-tag">
                      {{ ip.trim() }}
                    </el-tag>
                  </div>
                  <span v-else class="no-restriction">{{ $t('license.licenses.noRestriction') }}</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.licenses.allowedDomains')">
                  <div v-if="licenseData.allowedDomains">
                    <el-tag v-for="domain in licenseData.allowedDomains.split(',')" :key="domain.trim()" class="domain-tag">
                      {{ domain.trim() }}
                    </el-tag>
                  </div>
                  <span v-else class="no-restriction">{{ $t('license.licenses.noRestriction') }}</span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.features') }}</span>
              </template>
              
              <div class="features-grid">
                <div 
                  v-for="feature in licenseData.features" 
                  :key="feature" 
                  class="feature-item"
                >
                  <el-icon class="feature-icon" color="#67C23A"><check /></el-icon>
                  <span>{{ $t(`license.licenses.feature${capitalizeFirst(feature)}`) }}</span>
                </div>
              </div>
            </el-card>

            <el-card v-if="licenseData.metadata" class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.metadata') }}</span>
              </template>
              
              <div class="metadata-content">
                <pre>{{ formatMetadata(licenseData.metadata) }}</pre>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.usageStatistics') }}</span>
              </template>
              
              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">{{ usageData.totalActivations }}</div>
                  <div class="stat-label">{{ $t('license.licenses.totalActivations') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ usageData.activeDevices }}</div>
                  <div class="stat-label">{{ $t('license.licenses.activeDevices') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ usageData.currentUsers }}</div>
                  <div class="stat-label">{{ $t('license.licenses.currentUsers') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ formatBytes(usageData.dataUsage) }}</div>
                  <div class="stat-label">{{ $t('license.licenses.dataUsage') }}</div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.recentActivity') }}</span>
              </template>
              
              <el-timeline>
                <el-timeline-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  :timestamp="formatDate(activity.timestamp)"
                  :type="activity.type"
                >
                  {{ activity.description }}
                </el-timeline-item>
              </el-timeline>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.licenses.timeline') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('common.createdAt')">
                  {{ formatDate(licenseData.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedAt')">
                  {{ formatDate(licenseData.updatedAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.createdBy')">
                  {{ licenseData.createdBy }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedBy')">
                  {{ licenseData.updatedBy }}
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
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown, Check } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)

interface LicenseData {
  id: string
  licenseKey: string
  planName: string
  planVersion: string
  customerName: string
  customerEmail: string
  description: string
  maxUsers: number | null
  maxDevices: number | null
  validityDays: number
  issueDate: string
  expiryDate: string
  allowedIPs: string
  allowedDomains: string
  status: string
  autoRenew: boolean
  features: string[]
  metadata: string
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
}

interface UsageData {
  totalActivations: number
  activeDevices: number
  currentUsers: number
  currentDevices: number
  dataUsage: number
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
}

const licenseData = reactive<LicenseData>({
  id: '',
  licenseKey: '',
  planName: '',
  planVersion: '',
  customerName: '',
  customerEmail: '',
  description: '',
  maxUsers: null,
  maxDevices: null,
  validityDays: 0,
  issueDate: '',
  expiryDate: '',
  allowedIPs: '',
  allowedDomains: '',
  status: 'active',
  autoRenew: false,
  features: [],
  metadata: '',
  createdAt: '',
  updatedAt: '',
  createdBy: '',
  updatedBy: ''
})

const usageData = reactive<UsageData>({
  totalActivations: 0,
  activeDevices: 0,
  currentUsers: 0,
  currentDevices: 0,
  dataUsage: 0
})

const recentActivities = ref<Activity[]>([])

const remainingDays = computed(() => {
  if (!licenseData.expiryDate) return 0
  const now = new Date()
  const expiry = new Date(licenseData.expiryDate)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
})

const isExpiringSoon = computed(() => remainingDays.value <= 30 && remainingDays.value > 0)
const isExpired = computed(() => remainingDays.value <= 0)

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'info'
    case 'suspended': return 'danger'
    default: return 'info'
  }
}

const loadLicenseData = async () => {
  const licenseId = route.params.id
  if (!licenseId) {
    ElMessage.error(t('license.licenses.invalidId'))
    router.push('/license/licenses')
    return
  }

  loading.value = true
  try {
    // TODO: 实现获取许可证详情的API调用
    // const [licenseResult, usageResult, activityResult] = await Promise.all([
    //   getLicenseById(licenseId),
    //   getLicenseUsage(licenseId),
    //   getLicenseActivities(licenseId)
    // ])
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟许可证数据
    Object.assign(licenseData, {
      id: licenseId,
      licenseKey: 'ABC12-DEF34-GHI56-JKL78-MNO90',
      planName: 'Professional Plan',
      planVersion: '2.1.0',
      customerName: 'Acme Corporation',
      customerEmail: 'licenses@acme.com',
      description: 'Enterprise license for development and production environments',
      maxUsers: 50,
      maxDevices: 100,
      validityDays: 365,
      issueDate: '2024-01-15T10:30:00Z',
      expiryDate: '2025-01-15T10:30:00Z',
      allowedIPs: '192.168.1.0/24, 10.0.0.0/8, 172.16.0.1',
      allowedDomains: 'acme.com, dev.acme.com, staging.acme.com',
      status: 'active',
      autoRenew: true,
      features: ['analytics', 'api_access', 'priority_support', 'cloud_storage', 'multi_user'],
      metadata: '{"department": "Engineering", "project": "MainApp", "environment": "production", "priority": "critical"}',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-10T14:45:00Z',
      createdBy: 'admin@example.com',
      updatedBy: 'manager@example.com'
    })

    // 模拟使用统计数据
    Object.assign(usageData, {
      totalActivations: 1247,
      activeDevices: 87,
      currentUsers: 42,
      currentDevices: 87,
      dataUsage: 2.4 * 1024 * 1024 * 1024 // 2.4GB
    })

    // 模拟活动记录
    recentActivities.value = [
      {
        id: '1',
        type: 'success',
        description: t('license.licenses.deviceActivated'),
        timestamp: '2024-03-08T09:15:00Z'
      },
      {
        id: '2',
        type: 'info',
        description: t('license.licenses.licenseValidated'),
        timestamp: '2024-03-07T14:22:00Z'
      },
      {
        id: '3',
        type: 'warning',
        description: t('license.licenses.unusualActivity'),
        timestamp: '2024-03-06T16:45:00Z'
      }
    ]
  } catch (error) {
    console.error('Load license data failed:', error)
    ElMessage.error(t('license.licenses.loadFailed'))
    router.push('/license/licenses')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const formatMetadata = (metadata: string) => {
  try {
    return JSON.stringify(JSON.parse(metadata), null, 2)
  } catch {
    return metadata
  }
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const capitalizeFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, '')
}

const copyLicenseKey = async () => {
  try {
    await navigator.clipboard.writeText(licenseData.licenseKey)
    ElMessage.success(t('license.licenses.licenseKeyCopied'))
  } catch (error) {
    ElMessage.error(t('common.copyFailed'))
  }
}

const handleAction = (command: string) => {
  switch (command) {
    case 'edit':
      router.push(`/license/licenses/edit/${licenseData.id}`)
      break
    case 'activate':
    case 'suspend':
    case 'renew':
      // TODO: 实现相应的许可证操作
      ElMessage.info(t('common.featureComingSoon'))
      break
    case 'export':
      // TODO: 实现许可证导出功能
      ElMessage.info(t('common.featureComingSoon'))
      break
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadLicenseData()
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

.license-key {
  display: flex;
  align-items: center;
}

.license-key code {
  background-color: var(--el-bg-color-page);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.stats-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 15px 10px;
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

.usage-info {
  font-weight: 500;
}

.expiring-soon {
  color: var(--el-color-warning);
  font-weight: 500;
}

.expired {
  color: var(--el-color-danger);
  font-weight: 500;
}

.ip-tag, .domain-tag {
  margin-right: 8px;
  margin-bottom: 4px;
}

.no-restriction {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
}

.feature-icon {
  font-size: 16px;
}

.metadata-content {
  background-color: var(--el-bg-color-page);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.metadata-content pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
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

:deep(.el-timeline-item__timestamp) {
  font-size: 12px;
}
</style>
