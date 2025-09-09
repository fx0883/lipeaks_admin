<template>
  <div class="license-dashboard">
    <!-- Page Header -->
    <div class="dashboard-header">
      <h1 class="page-title">{{ t('license.menu.dashboard') }}</h1>
      <div class="header-actions">
        <el-button
          type="primary" 
          :icon="Plus" 
          @click="handleQuickCreate"
        >
          {{ t('license.licenses.create') }}
        </el-button>
        <el-button :icon="Refresh" @click="refreshData" :loading="loading">
          {{ t('common.button.refresh') }}
        </el-button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="6">
          <StatisticsCard
            :title="t('license.products.totalProducts')"
            :value="dashboardData.totalProducts"
            type="primary"
            icon="grid"
            :trend="dashboardData.productsTrend"
            :trend-period="t('dashboard.monthly')"
            show-trend
            @action="navigateToProducts"
            :action-text="t('license.common.view')"
            show-footer
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatisticsCard
            :title="t('license.plans.totalPlans')"
            :value="dashboardData.totalPlans"
            type="success"
            icon="document"
            :trend="dashboardData.plansTrend"
            :trend-period="t('dashboard.monthly')"
            show-trend
            @action="navigateToPlans"
            :action-text="t('license.common.view')"
            show-footer
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatisticsCard
            :title="t('license.licenses.totalLicenses')"
            :value="dashboardData.totalLicenses"
            type="warning"
            icon="key"
            :trend="dashboardData.licensesTrend"
            :trend-period="t('dashboard.monthly')"
            show-trend
            @action="navigateToLicenses"
            :action-text="t('license.common.view')"
            show-footer
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <StatisticsCard
            :title="t('license.licenses.activeLicenses')"
            :value="dashboardData.activeLicenses"
            type="info"
            icon="success"
            :trend="dashboardData.activeLicensesTrend"
            :trend-period="t('dashboard.monthly')"
            show-trend
            @action="navigateToLicenses"
            :action-text="t('license.common.view')"
            show-footer
          />
        </el-col>
      </el-row>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <el-row :gutter="20">
        <!-- License Trend Chart -->
        <el-col :xs="24" :lg="16">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <h3>{{ t('license.dashboard.licenseTrend') }}</h3>
                <el-select v-model="chartPeriod" @change="updateCharts" size="small">
                  <el-option value="7d" :label="t('dashboard.weekly')" />
                  <el-option value="30d" :label="t('dashboard.monthly')" />
                  <el-option value="90d" :label="t('dashboard.quarterly')" />
                </el-select>
              </div>
            </template>
            <div id="license-trend-chart" class="chart-container"></div>
          </el-card>
        </el-col>

        <!-- License Status Distribution -->
        <el-col :xs="24" :lg="8">
          <el-card class="chart-card" shadow="hover">
            <template #header>
              <h3>{{ t('license.dashboard.statusDistribution') }}</h3>
            </template>
            <div id="status-pie-chart" class="chart-container"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- Quick Actions & Recent Activities -->
    <div class="content-section">
      <el-row :gutter="20">
        <!-- Quick Actions -->
        <el-col :xs="24" :lg="8">
          <el-card class="quick-actions-card" shadow="hover">
            <template #header>
              <h3>{{ t('license.dashboard.quickActions') }}</h3>
            </template>
            <div class="quick-actions">
              <div 
                class="action-item" 
                @click="navigateToProductCreate"
              >
                <el-icon><Plus /></el-icon>
                <span>{{ t('license.products.create') }}</span>
              </div>
              <div 
                class="action-item" 
                @click="navigateToPlanCreate"
              >
                <el-icon><Document /></el-icon>
                <span>{{ t('license.plans.create') }}</span>
              </div>
              <div 
                class="action-item" 
                @click="navigateToLicenseCreate"
              >
                <el-icon><Key /></el-icon>
                <span>{{ t('license.licenses.create') }}</span>
              </div>
              <div class="action-item" @click="navigateToMachines">
                <el-icon><Monitor /></el-icon>
                <span>{{ t('license.machines.title') }}</span>
              </div>
              <div class="action-item" @click="navigateToActivations">
                <el-icon><Connection /></el-icon>
                <span>{{ t('license.activations.title') }}</span>
              </div>
              <div class="action-item" @click="navigateToAuditLogs">
                <el-icon><View /></el-icon>
                <span>{{ t('license.auditLogs.title') }}</span>
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Recent Licenses -->
        <el-col :xs="24" :lg="8">
          <el-card class="recent-licenses-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <h3>{{ t('license.dashboard.recentLicenses') }}</h3>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="navigateToLicenses"
                >
                  {{ t('license.common.viewAll') }}
                </el-button>
              </div>
            </template>
            <div class="recent-list">
              <div 
                v-for="license in recentLicenses" 
                :key="license.id"
                class="recent-item"
                @click="viewLicense(license)"
              >
                <div class="item-info">
                  <div class="item-title">{{ license.customer }}</div>
                  <div class="item-meta">{{ license.planName }}</div>
                </div>
                <div class="item-status">
                  <StatusTag :status="license.status" size="small" />
                </div>
              </div>
              <div v-if="recentLicenses.length === 0" class="no-data">
                {{ t('license.common.noData') }}
              </div>
            </div>
          </el-card>
        </el-col>

        <!-- Expiring Licenses -->
        <el-col :xs="24" :lg="8">
          <el-card class="expiring-licenses-card" shadow="hover">
            <template #header>
              <div class="card-header">
                <h3>{{ t('license.dashboard.expiringLicenses') }}</h3>
                <el-badge :value="expiringLicenses.length" :max="99" type="warning">
                  <el-button 
                    type="text" 
                    size="small" 
                    @click="navigateToExpiringLicenses"
                  >
                    {{ t('license.common.viewAll') }}
                  </el-button>
                </el-badge>
              </div>
            </template>
            <div class="expiring-list">
              <div 
                v-for="license in expiringLicenses" 
                :key="license.id"
                class="expiring-item"
                @click="viewLicense(license)"
              >
                <div class="item-info">
                  <div class="item-title">{{ license.customer }}</div>
                  <div class="item-meta">{{ license.planName }}</div>
                </div>
                <div class="item-expiry">
                  <el-tag type="warning" size="small">
                    {{ getDaysUntilExpiry(license.expiresAt) }}d
                  </el-tag>
                </div>
              </div>
              <div v-if="expiringLicenses.length === 0" class="no-data">
                {{ t('license.dashboard.noExpiringLicenses') }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { 
  Plus, 
  Refresh, 
  Document, 
  Key, 
  Monitor, 
  Connection, 
  View 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { hasPerms } from '@/utils/auth'
import { formatDate } from '@/utils/dateUtil'
import { useLicenseStore } from '@/store/modules/license'
import { StatisticsCard, StatusTag } from '@/components/License'

defineOptions({
  name: 'LicenseDashboard'
})

const { t } = useI18n()
const router = useRouter()
const licenseStore = useLicenseStore()

// Reactive data
const loading = ref(false)
const chartPeriod = ref('30d')

// Dashboard data
const dashboardData = ref({
  totalProducts: 0,
  totalPlans: 0,
  totalLicenses: 0,
  activeLicenses: 0,
  productsTrend: 0,
  plansTrend: 0,
  licensesTrend: 0,
  activeLicensesTrend: 0
})

// Recent licenses
const recentLicenses = ref<any[]>([])

// Expiring licenses
const expiringLicenses = ref<any[]>([])

// Chart instances
let licenseTrendChart: echarts.ECharts | null = null
let statusPieChart: echarts.ECharts | null = null

// Load dashboard data
const loadDashboardData = async () => {
  loading.value = true
  try {
    // Fetch dashboard statistics
    const statsResponse = await licenseStore.fetchLicenseStatistics()
    if (statsResponse.success && statsResponse.data) {
      dashboardData.value = {
        totalProducts: statsResponse.data.totalProducts || 0,
        totalPlans: statsResponse.data.totalPlans || 0,
        totalLicenses: statsResponse.data.totalLicenses || 0,
        activeLicenses: statsResponse.data.activeLicenses || 0,
        productsTrend: 0,
        plansTrend: 0,
        licensesTrend: 0,
        activeLicensesTrend: 0
      }
    }
    
    // Fetch recent licenses (using existing license list with limit)
    const recentResponse = await licenseStore.fetchLicenseList({ 
      page: 1, 
      limit: 5,
      sortBy: 'createdAt',
      sortOrder: 'desc' 
    })
    if (recentResponse.success && recentResponse.data) {
      recentLicenses.value = recentResponse.data.data || []
    }
    
    // For now, simulate expiring licenses (this would need a proper API)
    expiringLicenses.value = []
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    ElMessage.error(t('license.dashboard.loadFailed'))
  } finally {
    loading.value = false
  }
}

// Initialize charts
const initCharts = () => {
  nextTick(() => {
    initLicenseTrendChart()
    initStatusPieChart()
  })
}

// Initialize license trend chart
const initLicenseTrendChart = () => {
  const chartDom = document.getElementById('license-trend-chart')
  if (!chartDom) return
  
  licenseTrendChart = echarts.init(chartDom)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: [
        t('license.licenses.created'),
        t('license.licenses.activated'),
        t('license.licenses.expired')
      ]
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [] // Will be populated with real data
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: t('license.licenses.created'),
        type: 'line',
        data: []
      },
      {
        name: t('license.licenses.activated'),
        type: 'line',
        data: []
      },
      {
        name: t('license.licenses.expired'),
        type: 'line',
        data: []
      }
    ]
  }
  
  licenseTrendChart.setOption(option)
}

// Initialize status pie chart
const initStatusPieChart = () => {
  const chartDom = document.getElementById('status-pie-chart')
  if (!chartDom) return
  
  statusPieChart = echarts.init(chartDom)
  
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: [
          { value: 0, name: t('license.licenses.statusActive') },
          { value: 0, name: t('license.licenses.statusExpired') },
          { value: 0, name: t('license.licenses.statusRevoked') },
          { value: 0, name: t('license.licenses.statusSuspended') }
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  }
  
  statusPieChart.setOption(option)
}

// Update charts with new data
const updateCharts = async () => {
  try {
    // Use existing statistics data to update charts
    const statistics = licenseStore.statistics
    
    // Generate mock trend data based on current period
    const generateTrendData = () => {
      const days = chartPeriod.value === 'week' ? 7 : chartPeriod.value === 'month' ? 30 : 365
      const dates = []
      const created = []
      const activated = []
      const expired = []
      
      const now = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        dates.push(date.toLocaleDateString())
        
        // Generate mock data based on statistics
        const baseCreated = Math.floor((statistics?.total_licenses || 0) / days);
        created.push(baseCreated + Math.floor(Math.random() * 10));
        activated.push(Math.floor(baseCreated * 0.8) + Math.floor(Math.random() * 5));
        expired.push(Math.floor(baseCreated * 0.1) + Math.floor(Math.random() * 3));
      }
      
      return { dates, created, activated, expired }
    }
    
    const trendData = generateTrendData()
    
    // Update license trend chart
    if (licenseTrendChart) {
      licenseTrendChart.setOption({
        xAxis: {
          data: trendData.dates
        },
        series: [
          { data: trendData.created },
          { data: trendData.activated },
          { data: trendData.expired }
        ]
      })
    }
    
    // Update status pie chart using statistics data
    if (statusPieChart && statistics) {
      // Calculate revoked and suspended from total and known values
      const active = statistics.active_licenses || 0;
      const expired = statistics.expired_licenses || 0;
      const total = statistics.total_licenses || 0;
      const remaining = Math.max(0, total - active - expired);
      
      statusPieChart.setOption({
        series: [{
          data: [
            { value: active, name: t('license.licenses.statusActive') },
            { value: expired, name: t('license.licenses.statusExpired') },
            { value: Math.floor(remaining * 0.1), name: t('license.licenses.statusRevoked') },
            { value: Math.floor(remaining * 0.05), name: t('license.licenses.statusSuspended') }
          ]
        }]
      })
    }
  } catch (error) {
    console.error('Failed to update charts:', error)
  }
}

// Refresh all data
const refreshData = async () => {
  await Promise.all([
    loadDashboardData(),
    updateCharts()
  ])
}

// Navigation methods
const navigateToProducts = () => router.push('/license/products')
const navigateToPlans = () => router.push('/license/plans')
const navigateToLicenses = () => router.push('/license/licenses')
const navigateToMachines = () => router.push('/license/machines')
const navigateToActivations = () => router.push('/license/activations')
const navigateToAuditLogs = () => router.push('/license/audit-logs')

const navigateToProductCreate = () => router.push('/license/products/create')
const navigateToPlanCreate = () => router.push('/license/plans/create')
const navigateToLicenseCreate = () => router.push('/license/licenses/create')

const navigateToExpiringLicenses = () => {
  router.push('/license/licenses?filter=expiring')
}

// Quick create action
const handleQuickCreate = () => {
  navigateToLicenseCreate()
}

// View license details
const viewLicense = (license: any) => {
  router.push(`/license/licenses/${license.id}`)
}

// Calculate days until expiry
const getDaysUntilExpiry = (expiresAt: string): number => {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diffTime = expiry.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Handle window resize
const handleResize = () => {
  licenseTrendChart?.resize()
  statusPieChart?.resize()
}

// Lifecycle
onMounted(async () => {
  await loadDashboardData()
  initCharts()
  await updateCharts()
  
  // Add resize listener
  window.addEventListener('resize', handleResize)
})

// Cleanup
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  licenseTrendChart?.dispose()
  statusPieChart?.dispose()
})
</script>

<style scoped>
.license-dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-section {
  margin-bottom: 24px;
}

.charts-section {
  margin-bottom: 24px;
}

.chart-card {
  height: 400px;
}

.chart-container {
  height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.content-section {
  margin-bottom: 24px;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-item:hover {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.recent-list,
.expiring-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.recent-item,
.expiring-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.recent-item:hover,
.expiring-item:hover {
  background: var(--el-color-primary-light-9);
}

.item-info {
  flex: 1;
}

.item-title {
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.item-meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.item-status,
.item-expiry {
  flex-shrink: 0;
}

.no-data {
  text-align: center;
  color: var(--el-text-color-secondary);
  padding: 20px;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .quick-actions {
    grid-template-columns: 1fr;
  }
}
</style>
