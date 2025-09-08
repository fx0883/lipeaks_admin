<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t('license.dashboard') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/activations' }">
            {{ $t('license.activations.title') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('license.activations.detail') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ activationData.activationId }}</h2>
            <el-tag :type="getStatusType(activationData.status)">
              {{ $t(`license.activations.${activationData.status}`) }}
            </el-tag>
            <el-tag v-if="activationData.isActive" type="success">
              {{ $t('license.activations.active') }}
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
                  <el-dropdown-item command="deactivate" :disabled="!activationData.isActive">
                    {{ $t('license.activations.deactivate') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="refresh">{{ $t('license.activations.refresh') }}</el-dropdown-item>
                  <el-dropdown-item command="export" divided>{{ $t('license.activations.export') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button @click="handleBack">{{ $t('common.back') }}</el-button>
          </div>
        </div>

        <el-row :gutter="20">
          <el-col :span="16">
            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.activations.basicInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.activations.activationId')" :span="2">
                  <code>{{ activationData.activationId }}</code>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.licenseKey')">
                  <code>{{ activationData.licenseKey }}</code>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.machineId')">
                  <code>{{ activationData.machineId }}</code>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.customerName')">
                  {{ activationData.customerName }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.planName')">
                  {{ activationData.planName }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.activations.timing') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.activations.activatedAt')">
                  {{ formatDate(activationData.activatedAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.lastVerified')">
                  {{ formatDate(activationData.lastVerified) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.expiresAt')">
                  <span :class="{ 'expiring-soon': isExpiringSoon }">
                    {{ formatDate(activationData.expiresAt) }}
                  </span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.remainingTime')">
                  <span :class="{ 'expiring-soon': isExpiringSoon }">
                    {{ remainingTime }}
                  </span>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.activations.usage') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.activations.verificationCount')">
                  {{ activationData.verificationCount }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.lastIpAddress')">
                  {{ activationData.lastIpAddress }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.userAgent')">
                  <div class="user-agent">{{ activationData.userAgent }}</div>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.activations.dataTransferred')">
                  {{ formatBytes(activationData.dataTransferred) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span>{{ $t('license.activations.statistics') }}</span>
              </template>
              
              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">{{ activationData.verificationCount }}</div>
                  <div class="stat-label">{{ $t('license.activations.totalVerifications') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ remainingDays }}</div>
                  <div class="stat-label">{{ $t('license.activations.remainingDays') }}</div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.activations.timeline') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('common.createdAt')">
                  {{ formatDate(activationData.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedAt')">
                  {{ formatDate(activationData.updatedAt) }}
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
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)

interface ActivationData {
  id: string
  activationId: string
  licenseKey: string
  machineId: string
  customerName: string
  planName: string
  activatedAt: string
  lastVerified: string
  expiresAt: string
  verificationCount: number
  lastIpAddress: string
  userAgent: string
  dataTransferred: number
  isActive: boolean
  status: string
  createdAt: string
  updatedAt: string
}

const activationData = reactive<ActivationData>({
  id: '',
  activationId: '',
  licenseKey: '',
  machineId: '',
  customerName: '',
  planName: '',
  activatedAt: '',
  lastVerified: '',
  expiresAt: '',
  verificationCount: 0,
  lastIpAddress: '',
  userAgent: '',
  dataTransferred: 0,
  isActive: false,
  status: 'active',
  createdAt: '',
  updatedAt: ''
})

const remainingDays = computed(() => {
  if (!activationData.expiresAt) return 0
  const now = new Date()
  const expiry = new Date(activationData.expiresAt)
  const diff = expiry.getTime() - now.getTime()
  return Math.ceil(diff / (1000 * 3600 * 24))
})

const remainingTime = computed(() => {
  const days = remainingDays.value
  if (days <= 0) return t('license.activations.expired')
  if (days === 1) return `${days} ${t('common.day')}`
  return `${days} ${t('common.days')}`
})

const isExpiringSoon = computed(() => remainingDays.value <= 30 && remainingDays.value > 0)

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'info'
    case 'expired': return 'danger'
    default: return 'info'
  }
}

const loadActivationData = async () => {
  const activationId = route.params.id
  if (!activationId) {
    ElMessage.error(t('license.activations.invalidId'))
    router.push('/license/activations')
    return
  }

  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    Object.assign(activationData, {
      id: activationId,
      activationId: 'ACT-789ABC-DEF123-456789',
      licenseKey: 'ABC12-DEF34-GHI56-JKL78-MNO90',
      machineId: 'MACH-7F8E9D-A1B2C3-456789',
      customerName: 'Acme Corporation',
      planName: 'Professional Plan',
      activatedAt: '2024-01-15T10:30:00Z',
      lastVerified: '2024-03-10T16:45:00Z',
      expiresAt: '2025-01-15T10:30:00Z',
      verificationCount: 2847,
      lastIpAddress: '192.168.1.100',
      userAgent: 'LicenseClient/2.1.0 (Ubuntu 22.04; x86_64)',
      dataTransferred: 1.2 * 1024 * 1024 * 1024,
      isActive: true,
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-10T16:45:00Z'
    })
  } catch (error) {
    console.error('Load activation data failed:', error)
    ElMessage.error(t('license.activations.loadFailed'))
    router.push('/license/activations')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const handleAction = (command: string) => {
  switch (command) {
    case 'deactivate':
    case 'refresh':
    case 'export':
      ElMessage.info(t('common.featureComingSoon'))
      break
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadActivationData()
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

.expiring-soon {
  color: var(--el-color-warning);
  font-weight: 500;
}

.user-agent {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}

:deep(.el-descriptions__body) {
  background-color: var(--el-bg-color);
}

:deep(.el-descriptions-item__label) {
  font-weight: 500;
  background-color: var(--el-bg-color-page);
}
</style>
