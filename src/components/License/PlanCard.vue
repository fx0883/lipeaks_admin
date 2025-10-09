<template>
  <el-card 
    class="plan-card" 
    :shadow="shadow"
    :body-style="{ padding: '20px' }"
  >
    <template #header>
      <div class="card-header">
        <div class="plan-info">
          <h4 class="plan-title">{{ plan.name }}</h4>
          <StatusTag :status="plan.status" status-type="plan" />
        </div>
        <div class="plan-type">
          <el-tag :type="getTypeTagType(plan.type)" size="small">
            {{ getPlanTypeText(plan.type) }}
          </el-tag>
        </div>
      </div>
    </template>

    <div class="plan-content">
      <!-- Price Info -->
      <div class="price-section">
        <div class="price">
          <span class="currency">{{ plan.currency || 'USD' }}</span>
          <span class="amount">${{ formatPrice(plan.price) }}</span>
          <span class="duration">/ {{ plan.duration }}{{ t('license.plans.duration') }}</span>
        </div>
        <div class="product-name">{{ plan.productName }}</div>
      </div>

      <!-- Limits -->
      <div class="limits-section">
        <div class="limit-item">
          <el-icon><Monitor /></el-icon>
          <span class="limit-label">{{ t('license.plans.maxMachines') }}</span>
          <span class="limit-value">{{ plan.maxMachines || '∞' }}</span>
        </div>
        <div class="limit-item">
          <el-icon><Connection /></el-icon>
          <span class="limit-label">{{ t('license.plans.maxActivations') }}</span>
          <span class="limit-value">{{ plan.maxActivations || '∞' }}</span>
        </div>
      </div>

      <!-- Features -->
      <div class="features-section" v-if="plan.features && plan.features.length > 0">
        <h5 class="section-title">{{ t('license.plans.features') }}</h5>
        <ul class="features-list">
          <li v-for="feature in parsedFeatures" :key="feature" class="feature-item">
            <el-icon class="feature-icon"><Check /></el-icon>
            <span>{{ feature }}</span>
          </li>
        </ul>
      </div>

      <!-- Description -->
      <div class="description-section" v-if="plan.description">
        <p class="description">{{ plan.description }}</p>
      </div>

      <!-- Actions -->
      <div class="actions-section" v-if="showActions">
        <el-button 
          type="primary" 
          size="small" 
          @click="$emit('select', plan)"
          :disabled="plan.status !== 'active'"
        >
          {{ selectButtonText }}
        </el-button>
        <el-button 
          type="text" 
          size="small" 
          @click="$emit('view', plan)"
        >
          {{ t('license.plans.viewBtn') }}
        </el-button>
        <el-button 
          type="text" 
          size="small" 
          @click="$emit('edit', plan)"
          v-if="hasPerms('license:edit')"
        >
          {{ t('license.plans.editBtn') }}
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Monitor, Connection, Check } from '@element-plus/icons-vue'
import { hasPerms } from '@/utils/auth'
import StatusTag from './StatusTag.vue'

export interface Plan {
  id: string
  name: string
  description?: string
  productName: string
  type: 'basic' | 'pro' | 'enterprise' | 'custom'
  price: number
  currency: string
  duration: number
  maxActivations: number
  maxMachines: number
  features?: string | string[]
  status: 'active' | 'inactive' | 'archived'
  createdAt: string
}

export interface PlanCardProps {
  plan: Plan
  shadow?: 'always' | 'hover' | 'never'
  showActions?: boolean
  selectButtonText?: string
}

const props = withDefaults(defineProps<PlanCardProps>(), {
  shadow: 'hover',
  showActions: true,
  selectButtonText: ''
})

const emit = defineEmits<{
  select: [plan: Plan]
  view: [plan: Plan]
  edit: [plan: Plan]
}>()

const { t } = useI18n()

// 解析特性列表
const parsedFeatures = computed(() => {
  if (!props.plan.features) return []
  if (Array.isArray(props.plan.features)) {
    return props.plan.features
  }
  return props.plan.features.split('\n').filter(f => f.trim())
})

// 获取计划类型标签类型
const getTypeTagType = (type: string): string => {
  const typeMap: Record<string, string> = {
    basic: '',
    pro: 'success',
    enterprise: 'warning',
    custom: 'info'
  }
  return typeMap[type] || ''
}

// 获取计划类型文本
const getPlanTypeText = (type: string): string => {
  const typeKey = `license.plans.type${type.charAt(0).toUpperCase() + type.slice(1)}`
  return t(typeKey, type)
}

// 格式化价格
const formatPrice = (price: number): string => {
  if (price === 0) return '0'
  return price.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })
}

// 选择按钮文本
const selectButtonText = computed(() => {
  return props.selectButtonText || t('common.button.select', 'Select')
})
</script>

<style scoped>
.plan-card {
  height: 100%;
  transition: transform 0.2s ease-in-out;
}

.plan-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: -8px;
}

.plan-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.plan-type {
  flex-shrink: 0;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.price-section {
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}

.currency {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.amount {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-color-primary);
}

.duration {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.product-name {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.limits-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.limit-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--el-bg-color-page);
  border-radius: 6px;
}

.limit-label {
  flex: 1;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.limit-value {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.features-section {
  flex: 1;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.features-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.feature-icon {
  color: var(--el-color-success);
  font-size: 16px;
  flex-shrink: 0;
}

.description-section {
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
}

.description {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.actions-section {
  display: flex;
  gap: 8px;
  justify-content: center;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
  margin-top: auto;
}
</style>
