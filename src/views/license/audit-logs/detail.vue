<template>
  <div class="main-container">
    <el-card v-loading="loading" :header="false" shadow="never">
      <template #header>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item :to="{ path: '/license/dashboard' }">
            {{ $t('license.dashboard') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item :to="{ path: '/license/audit-logs' }">
            {{ $t('license.auditLogs.title') }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>{{ $t('license.auditLogs.detail') }}</el-breadcrumb-item>
        </el-breadcrumb>
      </template>

      <div class="detail-container">
        <div class="detail-header">
          <div class="title-section">
            <h2>{{ $t('license.auditLogs.logDetail') }}</h2>
            <el-tag :type="getEventType(auditData.eventType)">
              {{ $t(`license.auditLogs.${auditData.eventType}`) }}
            </el-tag>
            <el-tag :type="getSeverityType(auditData.severity)">
              {{ $t(`license.auditLogs.${auditData.severity}`) }}
            </el-tag>
          </div>
          <div class="action-section">
            <el-button type="primary" @click="exportLog">
              {{ $t('license.auditLogs.export') }}
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
                <span>{{ $t('license.auditLogs.basicInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.auditLogs.logId')" :span="2">
                  <code>{{ auditData.logId }}</code>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.timestamp')">
                  {{ formatDate(auditData.timestamp) }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.eventType')">
                  <el-tag :type="getEventType(auditData.eventType)">
                    {{ $t(`license.auditLogs.${auditData.eventType}`) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.severity')">
                  <el-tag :type="getSeverityType(auditData.severity)">
                    {{ $t(`license.auditLogs.${auditData.severity}`) }}
                  </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.source')">
                  {{ auditData.source }}
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.auditLogs.eventDetails') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('license.auditLogs.message')">
                  <div class="event-message">{{ auditData.message }}</div>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.description')">
                  <div class="event-description">{{ auditData.description }}</div>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.auditLogs.contextInfo') }}</span>
              </template>
              
              <el-descriptions :column="2" border>
                <el-descriptions-item :label="$t('license.auditLogs.userId')">
                  {{ auditData.userId || '-' }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.userName')">
                  {{ auditData.userName || '-' }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.licenseKey')">
                  <code v-if="auditData.licenseKey">{{ auditData.licenseKey }}</code>
                  <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.machineId')">
                  <code v-if="auditData.machineId">{{ auditData.machineId }}</code>
                  <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.ipAddress')">
                  {{ auditData.ipAddress }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.userAgent')">
                  <div class="user-agent">{{ auditData.userAgent || '-' }}</div>
                </el-descriptions-item>
              </el-descriptions>
            </el-card>

            <el-card v-if="auditData.additionalData" class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.auditLogs.additionalData') }}</span>
              </template>
              
              <div class="additional-data">
                <pre>{{ formatAdditionalData(auditData.additionalData) }}</pre>
              </div>
            </el-card>

            <el-card v-if="auditData.stackTrace" class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.auditLogs.stackTrace') }}</span>
              </template>
              
              <div class="stack-trace">
                <pre>{{ auditData.stackTrace }}</pre>
              </div>
            </el-card>
          </el-col>

          <el-col :span="8">
            <el-card class="info-card" shadow="never">
              <template #header>
                <span>{{ $t('license.auditLogs.eventSummary') }}</span>
              </template>
              
              <div class="summary-content">
                <div class="summary-item">
                  <div class="summary-label">{{ $t('license.auditLogs.eventType') }}</div>
                  <div class="summary-value">
                    <el-tag :type="getEventType(auditData.eventType)">
                      {{ $t(`license.auditLogs.${auditData.eventType}`) }}
                    </el-tag>
                  </div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">{{ $t('license.auditLogs.severity') }}</div>
                  <div class="summary-value">
                    <el-tag :type="getSeverityType(auditData.severity)">
                      {{ $t(`license.auditLogs.${auditData.severity}`) }}
                    </el-tag>
                  </div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">{{ $t('license.auditLogs.timestamp') }}</div>
                  <div class="summary-value">{{ formatDate(auditData.timestamp) }}</div>
                </div>
                <div class="summary-item">
                  <div class="summary-label">{{ $t('license.auditLogs.source') }}</div>
                  <div class="summary-value">{{ auditData.source }}</div>
                </div>
              </div>
            </el-card>

            <el-card v-if="relatedLogs.length > 0" class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.auditLogs.relatedLogs') }}</span>
              </template>
              
              <div class="related-logs">
                <div 
                  v-for="log in relatedLogs" 
                  :key="log.logId" 
                  class="related-log-item"
                  @click="viewRelatedLog(log.logId)"
                >
                  <div class="log-time">{{ formatTime(log.timestamp) }}</div>
                  <div class="log-event">
                    <el-tag size="small" :type="getEventType(log.eventType)">
                      {{ $t(`license.auditLogs.${log.eventType}`) }}
                    </el-tag>
                  </div>
                  <div class="log-message">{{ log.message }}</div>
                </div>
              </div>
            </el-card>

            <el-card class="detail-card" shadow="never">
              <template #header>
                <span>{{ $t('license.auditLogs.metadata') }}</span>
              </template>
              
              <el-descriptions :column="1" border>
                <el-descriptions-item :label="$t('license.auditLogs.correlationId')">
                  {{ auditData.correlationId || '-' }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.sessionId')">
                  {{ auditData.sessionId || '-' }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.requestId')">
                  {{ auditData.requestId || '-' }}
                </el-descriptions-item>
                <el-descriptions-item :label="$t('license.auditLogs.processingTime')">
                  {{ auditData.processingTime ? `${auditData.processingTime}ms` : '-' }}
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

interface AuditData {
  logId: string
  timestamp: string
  eventType: string
  severity: string
  source: string
  message: string
  description: string
  userId: string
  userName: string
  licenseKey: string
  machineId: string
  ipAddress: string
  userAgent: string
  additionalData: string
  stackTrace: string
  correlationId: string
  sessionId: string
  requestId: string
  processingTime: number
}

interface RelatedLog {
  logId: string
  timestamp: string
  eventType: string
  message: string
}

const auditData = reactive<AuditData>({
  logId: '',
  timestamp: '',
  eventType: '',
  severity: '',
  source: '',
  message: '',
  description: '',
  userId: '',
  userName: '',
  licenseKey: '',
  machineId: '',
  ipAddress: '',
  userAgent: '',
  additionalData: '',
  stackTrace: '',
  correlationId: '',
  sessionId: '',
  requestId: '',
  processingTime: 0
})

const relatedLogs = ref<RelatedLog[]>([])

const getEventType = (eventType: string) => {
  switch (eventType) {
    case 'license_activated': return 'success'
    case 'license_deactivated': return 'warning'
    case 'license_expired': return 'danger'
    case 'authentication_failed': return 'danger'
    case 'suspicious_activity': return 'danger'
    case 'system_error': return 'danger'
    default: return 'info'
  }
}

const getSeverityType = (severity: string) => {
  switch (severity) {
    case 'critical': return 'danger'
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return 'info'
    default: return 'info'
  }
}

const loadAuditData = async () => {
  const logId = route.params.id
  if (!logId) {
    ElMessage.error(t('license.auditLogs.invalidId'))
    router.push('/license/audit-logs')
    return
  }

  loading.value = true
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 500))
    
    Object.assign(auditData, {
      logId: logId,
      timestamp: '2024-03-10T16:45:32.123Z',
      eventType: 'license_activated',
      severity: 'medium',
      source: 'License Service',
      message: 'License successfully activated for machine MACH-7F8E9D-A1B2C3-456789',
      description: 'A new license activation was processed successfully. The license key ABC12-DEF34-GHI56-JKL78-MNO90 has been activated on machine MACH-7F8E9D-A1B2C3-456789 for customer Acme Corporation.',
      userId: 'user_12345',
      userName: 'john.doe@acme.com',
      licenseKey: 'ABC12-DEF34-GHI56-JKL78-MNO90',
      machineId: 'MACH-7F8E9D-A1B2C3-456789',
      ipAddress: '192.168.1.100',
      userAgent: 'LicenseClient/2.1.0 (Ubuntu 22.04; x86_64)',
      additionalData: '{"plan_id": "2", "activation_method": "online", "client_version": "2.1.0", "os_info": "Ubuntu 22.04.3 LTS", "hardware_fingerprint": "sha256:a1b2c3d4e5f6"}',
      stackTrace: '',
      correlationId: 'corr-789abc-def123',
      sessionId: 'sess-456def-789ghi',
      requestId: 'req-123abc-456def',
      processingTime: 247
    })

    // 模拟相关日志
    relatedLogs.value = [
      {
        logId: 'log-001',
        timestamp: '2024-03-10T16:44:15.456Z',
        eventType: 'license_validation',
        message: 'License validation initiated'
      },
      {
        logId: 'log-002',
        timestamp: '2024-03-10T16:44:58.789Z',
        eventType: 'machine_verification',
        message: 'Machine fingerprint verified'
      },
      {
        logId: 'log-003',
        timestamp: '2024-03-10T16:46:12.345Z',
        eventType: 'activation_confirmed',
        message: 'Activation confirmation sent to client'
      }
    ]
  } catch (error) {
    console.error('Load audit data failed:', error)
    ElMessage.error(t('license.auditLogs.loadFailed'))
    router.push('/license/audit-logs')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

const formatTime = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleTimeString()
}

const formatAdditionalData = (data: string) => {
  try {
    return JSON.stringify(JSON.parse(data), null, 2)
  } catch {
    return data
  }
}

const exportLog = () => {
  // TODO: 实现日志导出功能
  ElMessage.info(t('common.featureComingSoon'))
}

const viewRelatedLog = (logId: string) => {
  router.push(`/license/audit-logs/detail/${logId}`)
}

const handleBack = () => {
  router.back()
}

onMounted(() => {
  loadAuditData()
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

.info-card :deep(.el-card__header) {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-weight: 600;
}

.event-message {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.event-description {
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

.user-agent {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}

.additional-data,
.stack-trace {
  background-color: var(--el-bg-color-page);
  padding: 15px;
  border-radius: 4px;
  border: 1px solid var(--el-border-color-lighter);
}

.additional-data pre,
.stack-trace pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.summary-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.summary-value {
  font-size: 14px;
  color: var(--el-text-color-primary);
}

.related-logs {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.related-log-item {
  padding: 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.related-log-item:hover {
  background-color: var(--el-bg-color-page);
  border-color: var(--el-color-primary);
}

.log-time {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-bottom: 4px;
}

.log-event {
  margin-bottom: 4px;
}

.log-message {
  font-size: 12px;
  color: var(--el-text-color-regular);
  line-height: 1.4;
}

:deep(.el-descriptions__body) {
  background-color: var(--el-bg-color);
}

:deep(.el-descriptions-item__label) {
  font-weight: 500;
  background-color: var(--el-bg-color-page);
}
</style>
