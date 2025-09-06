import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { errorHandler } from './errorHandler'
import { loadingManager, LoadingKeys } from './loadingManager'
import { ElMessage } from 'element-plus'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global

// Request interceptor
export const requestInterceptor = (config: AxiosRequestConfig): AxiosRequestConfig => {
  // Add loading state for API requests
  const loadingKey = getLoadingKey(config)
  if (loadingKey) {
    loadingManager.setLoading(loadingKey, true)
  }

  // Add timestamp to prevent caching for GET requests
  if (config.method === 'get') {
    config.params = {
      ...config.params,
      _t: Date.now()
    }
  }

  // Add request timeout
  if (!config.timeout) {
    config.timeout = 30000 // 30 seconds
  }

  return config
}

// Request error interceptor
export const requestErrorInterceptor = (error: AxiosError): Promise<AxiosError> => {
  console.error('[Request Error]', error)
  
  // Handle request configuration errors
  errorHandler.handleApiError(error, {
    showMessage: true,
    logError: true,
    fallbackMessage: t('common.error.requestFailed')
  })

  return Promise.reject(error)
}

// Response interceptor
export const responseInterceptor = (response: AxiosResponse): AxiosResponse => {
  // Clear loading state
  const loadingKey = getLoadingKey(response.config)
  if (loadingKey) {
    loadingManager.setLoading(loadingKey, false)
  }

  // Handle business logic errors in response
  if (response.data && typeof response.data === 'object') {
    const { code, message, success } = response.data

    // Check for business errors
    if (success === false || (code && code !== 200 && code !== '200')) {
      const error = new Error(message || t('common.error.business'))
      ;(error as any).code = code
      ;(error as any).response = response
      throw error
    }
  }

  return response
}

// Response error interceptor
export const responseErrorInterceptor = (error: AxiosError): Promise<AxiosError> => {
  // Clear loading state
  const loadingKey = getLoadingKey(error.config)
  if (loadingKey) {
    loadingManager.setLoading(loadingKey, false)
  }

  const { response, code, message } = error

  // Handle different types of errors
  if (!response) {
    // Network error
    if (code === 'NETWORK_ERROR' || message === 'Network Error') {
      errorHandler.handleNetworkError(error)
    } else if (code === 'TIMEOUT') {
      errorHandler.handleNetworkError(error)
    } else {
      errorHandler.handleApiError(error, {
        showMessage: true,
        fallbackMessage: t('common.error.network')
      })
    }
  } else {
    const { status, data } = response

    switch (status) {
      case 400:
        // Bad Request - Validation errors
        if (data?.errors && typeof data.errors === 'object') {
          errorHandler.handleValidationError(data.errors)
        } else {
          errorHandler.handleApiError(error, {
            fallbackMessage: t('common.error.badRequest')
          })
        }
        break

      case 401:
        // Unauthorized
        handleUnauthorized()
        break

      case 403:
        // Forbidden
        errorHandler.handlePermissionError()
        break

      case 404:
        // Not Found
        errorHandler.handleApiError(error, {
          fallbackMessage: t('common.error.notFound')
        })
        break

      case 409:
        // Conflict
        errorHandler.handleApiError(error, {
          fallbackMessage: t('common.error.conflict')
        })
        break

      case 413:
        // Payload Too Large
        errorHandler.handleUploadError(error)
        break

      case 415:
        // Unsupported Media Type
        errorHandler.handleUploadError(error)
        break

      case 422:
        // Unprocessable Entity - Business logic errors
        if (data?.code) {
          errorHandler.handleBusinessError(data.code, data.message)
        } else {
          errorHandler.handleApiError(error, {
            fallbackMessage: t('common.error.validation')
          })
        }
        break

      case 429:
        // Too Many Requests
        errorHandler.handleApiError(error, {
          fallbackMessage: t('common.error.tooManyRequests')
        })
        break

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        errorHandler.handleApiError(error, {
          showNotification: true,
          fallbackMessage: t('common.error.server')
        })
        break

      default:
        errorHandler.handleApiError(error)
    }
  }

  return Promise.reject(error)
}

// Helper function to get loading key from request config
function getLoadingKey(config?: AxiosRequestConfig): string | null {
  if (!config || !config.url) return null

  const { method = 'get', url } = config
  const lowerMethod = method.toLowerCase()

  // Map URLs to loading keys
  const urlMappings = [
    // License endpoints
    { pattern: /\/licenses$/, key: LoadingKeys.FETCH },
    { pattern: /\/licenses\/\d+$/, key: LoadingKeys.FETCH },
    { pattern: /\/licenses\/create$/, key: LoadingKeys.LICENSE_CREATE },
    { pattern: /\/licenses\/\d+\/revoke$/, key: LoadingKeys.LICENSE_REVOKE },
    { pattern: /\/licenses\/\d+\/activate$/, key: LoadingKeys.LICENSE_ACTIVATE },
    { pattern: /\/licenses\/\d+\/download$/, key: LoadingKeys.LICENSE_DOWNLOAD },
    
    // Product endpoints
    { pattern: /\/products$/, key: lowerMethod === 'post' ? LoadingKeys.PRODUCT_CREATE : LoadingKeys.FETCH },
    { pattern: /\/products\/\d+$/, key: lowerMethod === 'put' ? LoadingKeys.PRODUCT_UPDATE : LoadingKeys.FETCH },
    
    // Plan endpoints
    { pattern: /\/plans$/, key: lowerMethod === 'post' ? LoadingKeys.PLAN_CREATE : LoadingKeys.FETCH },
    { pattern: /\/plans\/\d+$/, key: lowerMethod === 'put' ? LoadingKeys.PLAN_UPDATE : LoadingKeys.FETCH },
    
    // Machine endpoints
    { pattern: /\/machines\/\d+\/unbind$/, key: LoadingKeys.MACHINE_UNBIND },
    { pattern: /\/machines\/batch-unbind$/, key: LoadingKeys.MACHINE_BATCH_UNBIND },
    
    // Batch operations
    { pattern: /\/batch\/delete$/, key: LoadingKeys.BATCH_DELETE },
    { pattern: /\/batch\/update$/, key: LoadingKeys.BATCH_UPDATE },
    { pattern: /\/batch\/export$/, key: LoadingKeys.BATCH_EXPORT },
    { pattern: /\/batch\/import$/, key: LoadingKeys.BATCH_IMPORT },
    
    // File operations
    { pattern: /\/upload$/, key: LoadingKeys.FILE_UPLOAD },
    { pattern: /\/download$/, key: LoadingKeys.FILE_DOWNLOAD },
    { pattern: /\/template$/, key: LoadingKeys.TEMPLATE_DOWNLOAD },
    
    // Dashboard
    { pattern: /\/dashboard\/stats$/, key: LoadingKeys.DASHBOARD_STATS },
    { pattern: /\/dashboard\/charts$/, key: LoadingKeys.DASHBOARD_CHARTS }
  ]

  // Find matching pattern
  for (const mapping of urlMappings) {
    if (mapping.pattern.test(url)) {
      return mapping.key
    }
  }

  // Default loading key based on method
  switch (lowerMethod) {
    case 'post':
      return LoadingKeys.CREATE
    case 'put':
    case 'patch':
      return LoadingKeys.UPDATE
    case 'delete':
      return LoadingKeys.DELETE
    default:
      return LoadingKeys.FETCH
  }
}

// Handle unauthorized access
function handleUnauthorized(): void {
  ElMessage.error(t('common.error.unauthorized'))
  
  // Clear user data and redirect to login
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('userInfo')
  
  // Redirect to login page
  const currentPath = window.location.pathname
  if (currentPath !== '/login') {
    window.location.href = '/login'
  }
}

// Retry mechanism for failed requests
export const retryRequest = async (
  requestFn: () => Promise<any>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<any> => {
  return errorHandler.withRetry(requestFn, maxRetries, delay)
}

// Batch request handler with error recovery
export const batchRequestHandler = async (
  requests: Array<() => Promise<any>>,
  options: {
    parallel?: boolean
    continueOnError?: boolean
    maxConcurrency?: number
  } = {}
): Promise<{ results: any[], errors: any[] }> => {
  const { parallel = true, continueOnError = true, maxConcurrency = 5 } = options
  const results: any[] = []
  const errors: any[] = []

  if (parallel) {
    // Parallel execution with concurrency limit
    const chunks = []
    for (let i = 0; i < requests.length; i += maxConcurrency) {
      chunks.push(requests.slice(i, i + maxConcurrency))
    }

    for (const chunk of chunks) {
      const promises = chunk.map(async (request, index) => {
        try {
          const result = await request()
          return { success: true, result, index }
        } catch (error) {
          return { success: false, error, index }
        }
      })

      const chunkResults = await Promise.all(promises)
      
      chunkResults.forEach(({ success, result, error, index }) => {
        if (success) {
          results.push(result)
        } else {
          errors.push(error)
          if (!continueOnError) {
            throw error
          }
        }
      })
    }
  } else {
    // Sequential execution
    for (const request of requests) {
      try {
        const result = await request()
        results.push(result)
      } catch (error) {
        errors.push(error)
        if (!continueOnError) {
          throw error
        }
      }
    }
  }

  return { results, errors }
}
