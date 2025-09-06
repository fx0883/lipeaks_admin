<template>
  <div class="loading-spinner" :class="spinnerClass">
    <div class="spinner-container">
      <div class="spinner" :class="sizeClass">
        <div class="spinner-inner">
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
          <div class="spinner-circle"></div>
        </div>
      </div>
      <div class="loading-text" v-if="text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
  overlay?: boolean
  fullscreen?: boolean
  color?: string
}

const props = withDefaults(defineProps<LoadingSpinnerProps>(), {
  size: 'medium',
  overlay: false,
  fullscreen: false,
  color: '#409eff'
})

const spinnerClass = computed(() => ({
  'loading-overlay': props.overlay,
  'loading-fullscreen': props.fullscreen
}))

const sizeClass = computed(() => `spinner-${props.size}`)
</script>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
}

.loading-fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.spinner {
  position: relative;
  display: inline-block;
  animation: rotate 1s linear infinite;
}

.spinner-small {
  width: 24px;
  height: 24px;
}

.spinner-medium {
  width: 32px;
  height: 32px;
}

.spinner-large {
  width: 48px;
  height: 48px;
}

.spinner-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.spinner-circle {
  position: absolute;
  width: 100%;
  height: 100%;
  border: 2px solid transparent;
  border-top: 2px solid v-bind(color);
  border-radius: 50%;
  animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
}

.spinner-circle:nth-child(1) {
  animation-delay: -0.45s;
}

.spinner-circle:nth-child(2) {
  animation-delay: -0.3s;
}

.spinner-circle:nth-child(3) {
  animation-delay: -0.15s;
}

.loading-text {
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.loading-fullscreen .loading-text {
  color: #ffffff;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* Fade in animation */
.loading-spinner {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
