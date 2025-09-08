<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t('license.dashboard') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/machines' }">
            {{ $t('license.machines.title') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('license.machines.detail') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ machineData.name || machineData.machineId }}</h2>
            <el-tag :type="getStatusType(machineData.status)">
              {{ $t(`license.machines.${machineData.status}`) }}
            </el-tag>
            <el-tag v-if="machineData.isOnline" type="success">
              {{ $t('license.machines.online') }}
            </el-tag>
            <el-tag v-else type="danger">
              {{ $t('license.machines.offline') }}
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
                  <el-dropdown-item command="activate" :disabled="machineData.status === 'active'">
                    {{ $t('license.machines.activate') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="deactivate" :disabled="machineData.status !== 'active'">
                    {{ $t('license.machines.deactivate') }}
                  </el-dropdown-item>
                  <el-dropdown-item command="reset" divided>{{ $t('license.machines.reset') }}</el-dropdown-item>
                  <el-dropdown-item command="blacklist" type="danger">{{ $t('license.machines.blacklist') }}</el-dropdown-item>
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
                <span>{{ $t('license.machines.basicInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.machines.machineId')" :span="2">
                  <div class="machine-id">
                    <code>{{ machineData.machineId }}</code>
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="copyMachineId"
                      style="margin-left: 10px;"
                    >
                      {{ $t('common.copy') }}
                    </el-button>
                  </div>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.name')">
                  {{ machineData.name }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.fingerprint')">
                  {{ machineData.fingerprint }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.ipAddress')">
                  {{ machineData.ipAddress }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.macAddress')">
                  {{ machineData.macAddress }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.description')" :span="2">
                  {{ machineData.description || '-' }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.machines.systemInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.machines.operatingSystem')">
                  {{ machineData.operatingSystem }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.architecture')">
                  {{ machineData.architecture }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.hostname')">
                  {{ machineData.hostname }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.domain')">
                  {{ machineData.domain || '-' }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.cpuInfo')">
                  {{ machineData.cpuInfo }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.memoryInfo')">
                  {{ formatBytes(machineData.totalMemory) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.machines.licenseInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.machines.activeLicenses')">
                  {{ machineData.activeLicensesCount }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.totalActivations')">
                  {{ machineData.totalActivations }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.firstActivation')">
                  {{ formatDate(machineData.firstActivationDate) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.lastActivation')">
                  {{ formatDate(machineData.lastActivationDate) }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.machines.activeLicensesList') }}</span>
              </template>
              
              <el-table :data="activeLicenses" style="width: 100%">
                <el-table-column prop="licenseKey" :label="$t('license.machines.licenseKey')" width="200">
                  <template #default="{ row }">
                    <code class="license-key-cell">{{ row.licenseKey }}</code>
                  </template>
                </el-table-column>
                <el-table-column prop="planName" :label="$t('license.machines.plan')" />
                <el-table-column prop="customerName" :label="$t('license.machines.customer')" />
                <el-table-column prop="activationDate" :label="$t('license.machines.activationDate')">
                  <template #default="{ row }">
                    {{ formatDate(row.activationDate) }}
                  </template>
                </el-table-column>
                <el-table-column prop="expiryDate" :label="$t('license.machines.expiryDate')">
                  <template #default="{ row }">
                    <span :class="{ 'expiring-soon': isExpiringSoon(row.expiryDate) }">
                      {{ formatDate(row.expiryDate) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('common.actions')" width="100">
                  <template #default="{ row }">
                    <el-button 
                      type="text" 
                      size="small" 
                      @click="viewLicense(row.licenseId)"
                    >
                      {{ $t('common.view') }}
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <el-card v-if="machineData.metadata" class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.machines.metadata') }}</span>
              </template>
              
              <div class="metadata-content">
                <pre>{{ formatMetadata(machineData.metadata) }}</pre>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="stats-card" shadow="never">
              <template #header>
                <span>{{ $t('license.machines.statistics') }}</span>
              </template>
              
              <div class="stats-content">
                <div class="stat-item">
                  <div class="stat-number">{{ machineData.activeLicensesCount }}</div>
                  <div class="stat-label">{{ $t('license.machines.activeLicenses') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ machineData.totalActivations }}</div>
                  <div class="stat-label">{{ $t('license.machines.totalActivations') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ formatUptime(machineData.uptime) }}</div>
                  <div class="stat-label">{{ $t('license.machines.uptime') }}</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">{{ machineData.securityScore }}/100</div>
                  <div class="stat-label">{{ $t('license.machines.securityScore') }}</div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.machines.connectionInfo') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('license.machines.isOnline')">
                  <el-tag :type="machineData.isOnline ? 'success' : 'danger'">
                    {{ machineData.isOnline ? $t('license.machines.online') : $t('license.machines.offline') }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.lastSeen')">
                  {{ formatDate(machineData.lastSeenDate) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.connectionCount')">
                  {{ machineData.connectionCount }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.userAgent')">
                  <div class="user-agent">{{ machineData.userAgent }}</div>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.machines.recentActivity') }}</span>
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
                <span>{{ $t('license.machines.timeline') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('common.createdAt')">
                  {{ formatDate(machineData.createdAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('common.updatedAt')">
                  {{ formatDate(machineData.updatedAt) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.machines.registeredBy')">
                  {{ machineData.registeredBy }}
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

const loading = ref(false)

interface MachineData {
  id: string
  machineId: string
  name: string
  fingerprint: string
  ipAddress: string
  macAddress: string
  description: string
  operatingSystem: string
  architecture: string
  hostname: string
  domain: string
  cpuInfo: string
  totalMemory: number
  activeLicensesCount: number
  totalActivations: number
  firstActivationDate: string
  lastActivationDate: string
  isOnline: boolean
  lastSeenDate: string
  connectionCount: number
  userAgent: string
  uptime: number
  securityScore: number
  status: string
  metadata: string
  createdAt: string
  updatedAt: string
  registeredBy: string
}

interface License {
  licenseId: string
  licenseKey: string
  planName: string
  customerName: string
  activationDate: string
  expiryDate: string
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
}

const machineData = reactive<MachineData>({
  id: '',
  machineId: '',
  name: '',
  fingerprint: '',
  ipAddress: '',
  macAddress: '',
  description: '',
  operatingSystem: '',
  architecture: '',
  hostname: '',
  domain: '',
  cpuInfo: '',
  totalMemory: 0,
  activeLicensesCount: 0,
  totalActivations: 0,
  firstActivationDate: '',
  lastActivationDate: '',
  isOnline: false,
  lastSeenDate: '',
  connectionCount: 0,
  userAgent: '',
  uptime: 0,
  securityScore: 0,
  status: 'active',
  metadata: '',
  createdAt: '',
  updatedAt: '',
  registeredBy: ''
})

const activeLicenses = ref<License[]>([])
const recentActivities = ref<Activity[]>([])

const getStatusType = (status: string) => {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'info'
    case 'blacklisted': return 'danger'
    default: return 'info'
  }
}

const loadMachineData = async () => {
  const machineId = route.params.id
  if (!machineId) {
    ElMessage.error(t('license.machines.invalidId'))
    router.push('/license/machines')
    return
  }

  loading.value = true
  try {
    // TODO: 实现获取机器详情的API调用
    // const [machineResult, licensesResult, activityResult] = await Promise.all([
    //   getMachineById(machineId),
    //   getMachineLicenses(machineId),
    //   getMachineActivities(machineId)
    // ])
    
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟机器数据
    Object.assign(machineData, {
      id: machineId,
      machineId: 'MACH-7F8E9D-A1B2C3-456789',
      name: 'Production Server 01',
      fingerprint: 'sha256:a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      ipAddress: '192.168.1.100',
      macAddress: '00:14:22:AB:CD:EF',
      description: 'Main production server for web application',
      operatingSystem: 'Ubuntu 22.04.3 LTS',
      architecture: 'x86_64',
      hostname: 'prod-server-01',
      domain: 'company.local',
      cpuInfo: 'Intel(R) Xeon(R) CPU E5-2686 v4 @ 2.30GHz (8 cores)',
      totalMemory: 32 * 1024 * 1024 * 1024, // 32GB
      activeLicensesCount: 3,
      totalActivations: 8,
      firstActivationDate: '2024-01-15T10:30:00Z',
      lastActivationDate: '2024-03-08T14:22:00Z',
      isOnline: true,
      lastSeenDate: '2024-03-10T16:45:00Z',
      connectionCount: 247,
      userAgent: 'LicenseClient/2.1.0 (Ubuntu 22.04; x86_64)',
      uptime: 2592000, // 30 days in seconds
      securityScore: 85,
      status: 'active',
      metadata: '{"location": "datacenter-1", "environment": "production", "team": "backend", "criticality": "high"}',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-03-10T16:45:00Z',
      registeredBy: 'admin@example.com'
    })

    // 模拟活跃许可证数据
    activeLicenses.value = [
      {
        licenseId: '1',
        licenseKey: 'ABC12-DEF34-GHI56-JKL78-MNO90',
        planName: 'Professional Plan',
        customerName: 'Acme Corp',
        activationDate: '2024-01-15T10:30:00Z',
        expiryDate: '2025-01-15T10:30:00Z'
      },
      {
        licenseId: '2',
        licenseKey: 'XYZ98-UVW76-RST54-PQR32-NML10',
        planName: 'Enterprise Plan',
        customerName: 'Tech Solutions',
        activationDate: '2024-02-01T09:15:00Z',
        expiryDate: '2024-12-31T23:59:59Z'
      },
      {
        licenseId: '3',
        licenseKey: 'QWE12-RTY34-UIO56-PAS78-DFG90',
        planName: 'Basic Plan',
        customerName: 'StartupCo',
        activationDate: '2024-03-08T14:22:00Z',
        expiryDate: '2024-09-08T14:22:00Z'
      }
    ]

    // 模拟活动记录
    recentActivities.value = [
      {
        id: '1',
        type: 'success',
        description: t('license.machines.licenseActivated'),
        timestamp: '2024-03-08T14:22:00Z'
      },
      {
        id: '2',
        type: 'info',
        description: t('license.machines.connectionEstablished'),
        timestamp: '2024-03-08T09:15:00Z'
      },
      {
        id: '3',
        type: 'warning',
        description: t('license.machines.suspiciousActivity'),
        timestamp: '2024-03-07T16:45:00Z'
      },
      {
        id: '4',
        type: 'info',
        description: t('license.machines.systemInfoUpdated'),
        timestamp: '2024-03-06T11:30:00Z'
      }
    ]
  } catch (error) {
    console.error('Load machine data failed:', error)
    ElMessage.error(t('license.machines.loadFailed'))
    router.push('/license/machines')
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

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  return `${days}d ${hours}h`
}

const formatMetadata = (metadata: string) => {
  try {
    return JSON.stringify(JSON.parse(metadata), null, 2)
  } catch {
    return metadata
  }
}

const isExpiringSoon = (expiryDate: string) => {
  const now = new Date()
  const expiry = new Date(expiryDate)
  const diff = expiry.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 3600 * 24))
  return days <= 30 && days > 0
}

const copyMachineId = async () => {
  try {
    await navigator.clipboard.writeText(machineData.machineId)
    ElMessage.success(t('license.machines.machineIdCopied'))
  } catch (error) {
    ElMessage.error(t('common.copyFailed'))
  }
}

const viewLicense = (licenseId: string) => {
  router.push(`/license/licenses/detail/${licenseId}`)
}

const handleAction = (command: string) => {
  switch (command) {
    case 'activate':
    case 'deactivate':
    case 'reset':
    case 'blacklist':
      // TODO: 实现相应的机器操作
      ElMessage.info(t('common.featureComingSoon'))
      break
  }
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadMachineData()
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

.machine-id {
  display: flex;
  align-items: center;
}

.machine-id code {
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

.license-key-cell {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  background-color: var(--el-bg-color-page);
  padding: 2px 4px;
  border-radius: 2px;
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
