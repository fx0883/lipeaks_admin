<template>
  <el-card 
    class="statistics-card" 
    :shadow="shadow"
    :body-style="{ padding: '20px' }"
  >
    <div class="stat-content">
      <div class="stat-icon" :class="`stat-icon-${type}`">
        <el-icon :size="iconSize">
          <component :is="iconComponent" />
        </el-icon>
      </div>
      
      <div class="stat-info">
        <div class="stat-value" :class="`stat-value-${type}`">
          {{ formatValue(value) }}
        </div>
        <div class="stat-label">{{ title }}</div>
        
        <div class="stat-trend" v-if="showTrend && trend !== undefined">
          <el-icon 
            :class="trendIconClass" 
            :size="14"
          >
            <component :is="trendIcon" />
          </el-icon>
          <span :class="trendTextClass">
            {{ Math.abs(trend).toFixed(1) }}%
          </span>
          <span class="trend-period" v-if="trendPeriod">
            {{ trendPeriod }}
          </span>
        </div>
      </div>
    </div>
    
    <div class="stat-footer" v-if="showFooter">
      <slot name="footer">
        <el-button 
          type="text" 
          size="small" 
          @click="$emit('action')"
          v-if="actionText"
        >
          {{ actionText }}
        </el-button>
      </slot>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  TrendChartUp, 
  TrendChartDown, 
  Document, 
  Grid, 
  Key, 
  Monitor, 
  Connection,
  Warning,
  SuccessFilled 
} from '@element-plus/icons-vue'

export interface StatisticsCardProps {
  title: string
  value: number | string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  icon?: string
  iconSize?: number
  shadow?: 'always' | 'hover' | 'never'
  showTrend?: boolean
  trend?: number
  trendPeriod?: string
  showFooter?: boolean
  actionText?: string
  suffix?: string
}

const props = withDefaults(defineProps<StatisticsCardProps>(), {
  type: 'primary',
  icon: 'document',
  iconSize: 24,
  shadow: 'hover',
  showTrend: false,
  showFooter: false,
  suffix: ''
})

const emit = defineEmits<{
  action: []
}>()

// Icon mapping
const iconMap = {
  document: Document,
  grid: Grid,
  key: Key,
  monitor: Monitor,
  connection: Connection,
  warning: Warning,
  success: SuccessFilled
}

// Get icon component
const iconComponent = computed(() => {
  return iconMap[props.icon as keyof typeof iconMap] || Document
})

// Trend icon
const trendIcon = computed(() => {
  if (props.trend === undefined) return TrendChartUp
  return props.trend >= 0 ? TrendChartUp : TrendChartDown
})

// Trend icon class
const trendIconClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'trend-up' : 'trend-down'
})

// Trend text class
const trendTextClass = computed(() => {
  if (props.trend === undefined) return ''
  return props.trend >= 0 ? 'trend-up' : 'trend-down'
})

// Format value
const formatValue = (value: number | string): string => {
  if (typeof value === 'string') return value
  
  // Format large numbers
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M'
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K'
  }
  
  return value.toString() + (props.suffix || '')
}
</script>

<style scoped>
.statistics-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.statistics-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.stat-icon-primary {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.stat-icon-success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.stat-icon-warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.stat-icon-danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.stat-icon-info {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

.stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.stat-value-primary {
  color: var(--el-color-primary);
}

.stat-value-success {
  color: var(--el-color-success);
}

.stat-value-warning {
  color: var(--el-color-warning);
}

.stat-value-danger {
  color: var(--el-color-danger);
}

.stat-value-info {
  color: var(--el-color-info);
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-regular);
  font-weight: 500;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.trend-up {
  color: var(--el-color-success);
}

.trend-down {
  color: var(--el-color-danger);
}

.trend-period {
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.stat-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: center;
}
</style>
