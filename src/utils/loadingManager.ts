import { ref, computed } from 'vue'
import { ElLoading } from 'element-plus'

export interface LoadingConfig {
  text?: string
  spinner?: string
  background?: string
  customClass?: string
}

class LoadingManager {
  private static instance: LoadingManager
  private loadingStates = ref<Record<string, boolean>>({})
  private loadingInstances = new Map<string, any>()

  public static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager()
    }
    return LoadingManager.instance
  }

  /**
   * Set loading state for a specific key
   */
  public setLoading(key: string, loading: boolean): void {
    this.loadingStates.value[key] = loading
  }

  /**
   * Get loading state for a specific key
   */
  public isLoading(key: string): boolean {
    return this.loadingStates.value[key] || false
  }

  /**
   * Get reactive loading state
   */
  public getLoadingState(key: string) {
    return computed(() => this.loadingStates.value[key] || false)
  }

  /**
   * Check if any loading is active
   */
  public isAnyLoading(): boolean {
    return Object.values(this.loadingStates.value).some(loading => loading)
  }

  /**
   * Clear all loading states
   */
  public clearAll(): void {
    this.loadingStates.value = {}
    this.loadingInstances.forEach(instance => instance.close())
    this.loadingInstances.clear()
  }

  /**
   * Show full screen loading
   */
  public showFullScreen(config: LoadingConfig = {}): void {
    const loading = ElLoading.service({
      lock: true,
      text: config.text || 'Loading...',
      background: config.background || 'rgba(0, 0, 0, 0.7)',
      customClass: config.customClass
    })
    
    this.loadingInstances.set('fullscreen', loading)
  }

  /**
   * Hide full screen loading
   */
  public hideFullScreen(): void {
    const loading = this.loadingInstances.get('fullscreen')
    if (loading) {
      loading.close()
      this.loadingInstances.delete('fullscreen')
    }
  }

  /**
   * Show element loading
   */
  public showElementLoading(target: string | HTMLElement, config: LoadingConfig = {}): void {
    const loading = ElLoading.service({
      target,
      text: config.text,
      spinner: config.spinner,
      background: config.background,
      customClass: config.customClass
    })
    
    const key = typeof target === 'string' ? target : 'element'
    this.loadingInstances.set(key, loading)
  }

  /**
   * Hide element loading
   */
  public hideElementLoading(target: string): void {
    const loading = this.loadingInstances.get(target)
    if (loading) {
      loading.close()
      this.loadingInstances.delete(target)
    }
  }

  /**
   * Async operation wrapper with loading state
   */
  public async withLoading<T>(
    key: string,
    operation: () => Promise<T>,
    config: LoadingConfig = {}
  ): Promise<T> {
    this.setLoading(key, true)
    
    if (config.text) {
      this.showFullScreen(config)
    }
    
    try {
      const result = await operation()
      return result
    } finally {
      this.setLoading(key, false)
      
      if (config.text) {
        this.hideFullScreen()
      }
    }
  }

  /**
   * Batch loading operations
   */
  public async withBatchLoading<T>(
    operations: Array<{
      key: string
      operation: () => Promise<T>
      config?: LoadingConfig
    }>
  ): Promise<T[]> {
    const promises = operations.map(({ key, operation, config }) =>
      this.withLoading(key, operation, config)
    )
    
    return Promise.all(promises)
  }

  /**
   * Sequential loading operations
   */
  public async withSequentialLoading<T>(
    operations: Array<{
      key: string
      operation: () => Promise<T>
      config?: LoadingConfig
    }>
  ): Promise<T[]> {
    const results: T[] = []
    
    for (const { key, operation, config } of operations) {
      const result = await this.withLoading(key, operation, config)
      results.push(result)
    }
    
    return results
  }

  /**
   * Loading state hook for composition API
   */
  public useLoading(initialKeys: string[] = []) {
    const localLoadingStates = ref<Record<string, boolean>>({})
    
    // Initialize local states
    initialKeys.forEach(key => {
      localLoadingStates.value[key] = false
    })

    const setLoading = (key: string, loading: boolean) => {
      localLoadingStates.value[key] = loading
      this.setLoading(key, loading)
    }

    const isLoading = (key: string) => {
      return computed(() => localLoadingStates.value[key] || false)
    }

    const isAnyLoading = computed(() => {
      return Object.values(localLoadingStates.value).some(loading => loading)
    })

    const withLoading = async <T>(
      key: string,
      operation: () => Promise<T>
    ): Promise<T> => {
      setLoading(key, true)
      try {
        return await operation()
      } finally {
        setLoading(key, false)
      }
    }

    return {
      setLoading,
      isLoading,
      isAnyLoading,
      withLoading
    }
  }
}

export const loadingManager = LoadingManager.getInstance()

// Predefined loading keys for common operations
export const LoadingKeys = {
  // Page loading
  PAGE_LOAD: 'page_load',
  
  // CRUD operations
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  FETCH: 'fetch',
  
  // Batch operations
  BATCH_DELETE: 'batch_delete',
  BATCH_UPDATE: 'batch_update',
  BATCH_EXPORT: 'batch_export',
  BATCH_IMPORT: 'batch_import',
  
  // License specific
  LICENSE_CREATE: 'license_create',
  LICENSE_REVOKE: 'license_revoke',
  LICENSE_ACTIVATE: 'license_activate',
  LICENSE_DOWNLOAD: 'license_download',
  
  // Product specific
  PRODUCT_CREATE: 'product_create',
  PRODUCT_UPDATE: 'product_update',
  PRODUCT_DELETE: 'product_delete',
  
  // Plan specific
  PLAN_CREATE: 'plan_create',
  PLAN_UPDATE: 'plan_update',
  PLAN_DELETE: 'plan_delete',
  
  // Machine specific
  MACHINE_UNBIND: 'machine_unbind',
  MACHINE_BATCH_UNBIND: 'machine_batch_unbind',
  
  // File operations
  FILE_UPLOAD: 'file_upload',
  FILE_DOWNLOAD: 'file_download',
  TEMPLATE_DOWNLOAD: 'template_download',
  
  // Dashboard
  DASHBOARD_STATS: 'dashboard_stats',
  DASHBOARD_CHARTS: 'dashboard_charts'
} as const

export type LoadingKey = typeof LoadingKeys[keyof typeof LoadingKeys]

export default loadingManager
