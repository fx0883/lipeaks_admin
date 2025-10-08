/**
 * 错误处理 Composition API
 * 为Vue组件提供便捷的错误处理功能
 */

import { ref, reactive, readonly } from 'vue';
import { errorService } from '@/utils/errorService';
import type { StandardErrorResponse } from '@/utils/http/errorHandlers';
import type { FormErrorOptions } from '@/utils/errorService';

// 表单错误状态
export interface FormErrorState {
  fieldErrors: Record<string, string[]>;
  hasError: boolean;
  errorCount: number;
  isSubmitting: boolean;
}

/**
 * 错误处理 Hook
 */
export function useErrorHandling() {
  /**
   * 处理API错误
   */
  const handleError = async (error: any, showDetails = false) => {
    await errorService.handleApiError(error, { showDetails });
  };

  /**
   * 显示成功提示
   */
  const showSuccess = (message: string) => {
    errorService.showSuccess(message);
  };

  /**
   * 显示警告提示
   */
  const showWarning = (message: string) => {
    errorService.showWarning(message);
  };

  /**
   * 显示错误提示
   */
  const showError = (message: string) => {
    errorService.showError(message);
  };

  /**
   * 确认对话框
   */
  const confirm = async (message: string, title = '确认', type: 'error' | 'warning' | 'info' = 'warning') => {
    return await errorService.confirm({ message, title, type });
  };

  return {
    handleError,
    showSuccess,
    showWarning,
    showError,
    confirm
  };
}

/**
 * 表单错误处理 Hook
 */
export function useFormErrorHandling(formRef?: any) {
  // 错误状态
  const errorState = reactive<FormErrorState>({
    fieldErrors: {},
    hasError: false,
    errorCount: 0,
    isSubmitting: false
  });

  /**
   * 处理表单提交错误
   */
  const handleSubmitError = async (error: any, options: FormErrorOptions = {}) => {
    const fieldErrors = await errorService.handleFormError(error, {
      ...options,
      formRef
    });

    updateErrorState(fieldErrors);
    return fieldErrors;
  };

  /**
   * 更新错误状态
   */
  const updateErrorState = (fieldErrors: Record<string, string[]>) => {
    errorState.fieldErrors = fieldErrors;
    errorState.hasError = Object.keys(fieldErrors).length > 0;
    errorState.errorCount = Object.keys(fieldErrors).length;
  };

  /**
   * 清除字段错误
   */
  const clearFieldError = (fieldName: string) => {
    if (errorState.fieldErrors[fieldName]) {
      delete errorState.fieldErrors[fieldName];
      updateErrorState(errorState.fieldErrors);
    }
  };

  /**
   * 清除所有错误
   */
  const clearAllErrors = () => {
    updateErrorState({});
  };

  /**
   * 获取字段错误
   */
  const getFieldError = (fieldName: string): string => {
    const errors = errorState.fieldErrors[fieldName];
    return errors && errors.length > 0 ? errors[0] : '';
  };

  /**
   * 检查字段是否有错误
   */
  const hasFieldError = (fieldName: string): boolean => {
    const errors = errorState.fieldErrors[fieldName];
    return errors && errors.length > 0;
  };

  /**
   * 设置提交状态
   */
  const setSubmitting = (submitting: boolean) => {
    errorState.isSubmitting = submitting;
  };

  /**
   * 安全的表单提交包装器
   */
  const safeSubmit = async <T>(
    submitFn: () => Promise<T>,
    options: FormErrorOptions = {}
  ): Promise<T | null> => {
    if (errorState.isSubmitting) {
      showWarning('请勿重复提交');
      return null;
    }

    setSubmitting(true);
    clearAllErrors();

    try {
      const result = await submitFn();
      showSuccess('操作成功');
      return result;
    } catch (error) {
      await handleSubmitError(error, options);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    errorState: readonly(errorState),
    handleSubmitError,
    clearFieldError,
    clearAllErrors,
    getFieldError,
    hasFieldError,
    setSubmitting,
    safeSubmit
  };
}

/**
 * 列表加载错误处理 Hook
 */
export function useListErrorHandling() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  /**
   * 安全的列表加载
   */
  const safeLoad = async <T>(
    loadFn: () => Promise<T>,
    showErrorToast = false
  ): Promise<T | null> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await loadFn();
      return result;
    } catch (err) {
      error.value = '加载失败';

      if (showErrorToast) {
        await errorService.handleApiError(err);
      } else {
        // 只记录错误，不显示提示（适合列表静默加载）
        logger.error('列表加载失败:', err);
      }

      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 重试加载
   */
  const retry = async <T>(loadFn: () => Promise<T>): Promise<T | null> => {
    return await safeLoad(loadFn, true);
  };

  /**
   * 清除错误状态
   */
  const clearError = () => {
    error.value = null;
  };

  return {
    loading: readonly(loading),
    error: readonly(error),
    safeLoad,
    retry,
    clearError
  };
}

/**
 * 批量操作错误处理 Hook
 */
export function useBatchErrorHandling() {
  const processing = ref(false);
  const progress = ref(0);

  /**
   * 执行批量操作
   */
  const executeBatch = async <T>(
    items: any[],
    operation: (item: any) => Promise<T>,
    options: {
      onProgress?: (current: number, total: number) => void;
      onSuccess?: (results: T[]) => void;
      onPartialSuccess?: (results: T[], errors: any[]) => void;
      onFailure?: (errors: any[]) => void;
    } = {}
  ): Promise<void> => {
    if (processing.value) {
      showWarning('批量操作进行中，请勿重复操作');
      return;
    }

    processing.value = true;
    progress.value = 0;

    const results: T[] = [];
    const errors: any[] = [];

    try {
      for (let i = 0; i < items.length; i++) {
        try {
          const result = await operation(items[i]);
          results.push(result);
        } catch (error) {
          errors.push({ item: items[i], error });
        }

        // 更新进度
        progress.value = ((i + 1) / items.length) * 100;
        options.onProgress?.(i + 1, items.length);
      }

      // 根据结果显示不同的提示
      if (errors.length === 0) {
        // 全部成功
        showSuccess(`批量操作完成，成功处理${results.length}个项目`);
        options.onSuccess?.(results);
      } else if (results.length === 0) {
        // 全部失败
        showError(`批量操作失败，${errors.length}个项目处理失败`);
        options.onFailure?.(errors);
      } else {
        // 部分成功
        showWarning(`批量操作完成，成功${results.length}个，失败${errors.length}个`);
        options.onPartialSuccess?.(results, errors);
      }
    } finally {
      processing.value = false;
      progress.value = 0;
    }
  };

  return {
    processing: readonly(processing),
    progress: readonly(progress),
    executeBatch
  };
}

// 全局错误处理函数（用于在组件外使用）
export const globalErrorHandler = {
  handleError: errorService.handleApiError.bind(errorService),
  handleFormError: errorService.handleFormError.bind(errorService),
  handleNetworkError: errorService.handleNetworkError.bind(errorService),
  showSuccess: errorService.showSuccess.bind(errorService),
  showWarning: errorService.showWarning.bind(errorService),
  showError: errorService.showError.bind(errorService)
};
