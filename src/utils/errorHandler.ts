import { ElMessage, ElNotification } from 'element-plus'
import { i18n } from '@/plugins/i18n'

const { t } = i18n.global

export interface ErrorResponse {
  code?: string
  message: string
  details?: any
  status?: number
}

export interface ErrorConfig {
  showMessage?: boolean
  showNotification?: boolean
  logError?: boolean
  fallbackMessage?: string
}

class ErrorHandler {
  private static instance: ErrorHandler
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * Handle API errors with consistent messaging
   */
  public handleApiError(error: any, config: ErrorConfig = {}): void {
    const {
      showMessage = true,
      showNotification = false,
      logError = true,
      fallbackMessage = t('common.form.error')
    } = config

    let errorMessage = fallbackMessage
    let errorCode = 'UNKNOWN_ERROR'

    // Extract error information
    if (error?.response?.data) {
      const { data } = error.response
      errorMessage = data.message || data.error || fallbackMessage
      errorCode = data.code || `HTTP_${error.response.status}`
    } else if (error?.message) {
      errorMessage = error.message
    }

    // Log error for debugging
    if (logError) {
      console.error('[ErrorHandler]', {
        code: errorCode,
        message: errorMessage,
        originalError: error,
        timestamp: new Date().toISOString()
      })
    }

    // Show user feedback
    if (showMessage) {
      ElMessage.error(errorMessage)
    }

    if (showNotification) {
      ElNotification.error({
        title: t('common.error.title'),
        message: errorMessage,
        duration: 5000
      })
    }
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(errors: Record<string, string[]>): void {
    const firstField = Object.keys(errors)[0]
    const firstError = errors[firstField]?.[0]
    
    if (firstError) {
      ElMessage.error(firstError)
    }
  }

  /**
   * Handle network errors
   */
  public handleNetworkError(error: any): void {
    let message = t('common.error.network')
    
    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      message = t('common.error.offline')
    } else if (error.code === 'TIMEOUT') {
      message = t('common.error.timeout')
    }

    ElNotification.error({
      title: t('common.error.networkTitle'),
      message,
      duration: 0 // Don't auto close
    })
  }

  /**
   * Handle permission errors
   */
  public handlePermissionError(): void {
    ElMessage.error(t('common.error.permission'))
  }

  /**
   * Handle business logic errors
   */
  public handleBusinessError(code: string, message?: string): void {
    const errorMessages: Record<string, string> = {
      'LICENSE_EXPIRED': t('license.error.licenseExpired'),
      'LICENSE_REVOKED': t('license.error.licenseRevoked'),
      'MAX_ACTIVATIONS_REACHED': t('license.error.maxActivationsReached'),
      'INVALID_LICENSE_KEY': t('license.error.invalidLicenseKey'),
      'PRODUCT_NOT_FOUND': t('license.error.productNotFound'),
      'PLAN_NOT_FOUND': t('license.error.planNotFound'),
      'MACHINE_ALREADY_BOUND': t('license.error.machineAlreadyBound'),
      'ACTIVATION_FAILED': t('license.error.activationFailed')
    }

    const errorMessage = message || errorMessages[code] || t('common.error.business')
    ElMessage.error(errorMessage)
  }

  /**
   * Handle file upload errors
   */
  public handleUploadError(error: any): void {
    let message = t('common.error.uploadFailed')
    
    if (error?.response?.status === 413) {
      message = t('common.error.fileTooLarge')
    } else if (error?.response?.status === 415) {
      message = t('common.error.unsupportedFileType')
    }

    ElMessage.error(message)
  }

  /**
   * Create error boundary for async operations
   */
  public async withErrorBoundary<T>(
    operation: () => Promise<T>,
    config: ErrorConfig = {}
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      this.handleApiError(error, config)
      return null
    }
  }

  /**
   * Retry mechanism for failed operations
   */
  public async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: any
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === maxRetries) {
          throw error
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
    
    throw lastError
  }
}

export const errorHandler = ErrorHandler.getInstance()

// Vue 3 error handler plugin
export const errorHandlerPlugin = {
  install(app: any) {
    app.config.errorHandler = (error: any, instance: any, info: string) => {
      console.error('[Vue Error]', error, info)
      errorHandler.handleApiError(error, {
        showMessage: true,
        logError: true,
        fallbackMessage: t('common.error.vue')
      })
    }
  }
}

export default errorHandler
