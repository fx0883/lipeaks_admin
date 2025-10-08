/**
 * 错误处理UI组件工厂
 * 提供便捷的错误提示方法
 */

import { createApp, h, App } from 'vue';
import ElementPlus from 'element-plus';
import ErrorToast from './ErrorToast.vue';
import ErrorModal from './ErrorModal.vue';
import type { ErrorToastProps } from './ErrorToast.vue';
import type { ErrorModalProps } from './ErrorModal.vue';

// Toast实例管理
const toastInstances: App[] = [];

/**
 * 显示Toast提示
 */
export function showErrorToast(options: Omit<ErrorToastProps, 'onClose'>) {
  // 创建容器
  const container = document.createElement('div');

  // 创建Vue应用实例
  const app = createApp({
    render: () => h(ErrorToast, {
      ...options,
      onClose: () => {
        // 清理
        app.unmount();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }

        // 从实例列表中移除
        const index = toastInstances.indexOf(app);
        if (index > -1) {
          toastInstances.splice(index, 1);
        }
      }
    })
  });

  // 使用Element Plus
  app.use(ElementPlus);

  // 挂载到DOM
  document.body.appendChild(container);
  app.mount(container);

  // 保存实例引用
  toastInstances.push(app);

  return {
    close: () => {
      app.unmount();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
}

/**
 * 显示成功Toast
 */
export function showSuccessToast(message: string, duration = 3000) {
  return showErrorToast({
    message,
    type: 'success',
    duration
  });
}

/**
 * 显示警告Toast
 */
export function showWarningToast(message: string, duration = 4000) {
  return showErrorToast({
    message,
    type: 'warning',
    duration
  });
}

/**
 * 显示错误Toast
 */
export function showErrorToastMessage(message: string, duration = 5000) {
  return showErrorToast({
    message,
    type: 'error',
    duration
  });
}

/**
 * 显示信息Toast
 */
export function showInfoToast(message: string, duration = 3000) {
  return showErrorToast({
    message,
    type: 'info',
    duration
  });
}

/**
 * 带操作的Toast
 */
export function showActionToast(options: {
  message: string;
  action: string;
  type?: 'success' | 'warning' | 'error' | 'info';
  duration?: number;
  onAction: () => void;
}) {
  return showErrorToast({
    message: options.message,
    type: options.type || 'info',
    duration: options.duration || 0, // 带操作的不自动关闭
    showClose: true,
    action: options.action,
    onAction: options.onAction
  });
}

// Modal实例管理
const modalInstances: App[] = [];

/**
 * 显示错误Modal
 */
export function showErrorModal(options: Omit<ErrorModalProps, 'onClose'>) {
  // 创建容器
  const container = document.createElement('div');

  // 创建Vue应用实例
  const app = createApp({
    render: () => h(ErrorModal, {
      ...options,
      onClose: () => {
        // 清理
        app.unmount();
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }

        // 从实例列表中移除
        const index = modalInstances.indexOf(app);
        if (index > -1) {
          modalInstances.splice(index, 1);
        }
      }
    })
  });

  // 使用Element Plus
  app.use(ElementPlus);

  // 挂载到DOM
  document.body.appendChild(container);
  app.mount(container);

  // 保存实例引用
  modalInstances.push(app);

  return {
    close: () => {
      app.unmount();
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  };
}

/**
 * 显示确认对话框
 */
export function showConfirmModal(options: {
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'error' | 'warning' | 'info';
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}) {
  return showErrorModal({
    message: options.message,
    title: options.title,
    type: options.type || 'confirm',
    primaryAction: options.confirmText || '确认',
    secondaryAction: options.cancelText || '取消',
    onPrimary: options.onConfirm,
    onSecondary: options.onCancel
  });
}

/**
 * 显示警告Modal
 */
export function showWarningModal(options: {
  message: string;
  title?: string;
  actionText?: string;
  guidance?: string | string[];
  onAction?: () => void | Promise<void>;
}) {
  return showErrorModal({
    message: options.message,
    title: options.title || '警告',
    type: 'warning',
    primaryAction: options.actionText || '我知道了',
    guidance: options.guidance,
    onPrimary: options.onAction
  });
}

/**
 * 显示错误详情Modal
 */
export function showErrorDetailModal(options: {
  message: string;
  details?: string;
  guidance?: string | string[];
  actionText?: string;
  onAction?: () => void | Promise<void>;
}) {
  return showErrorModal({
    message: options.message,
    type: 'error',
    details: options.details,
    guidance: options.guidance,
    primaryAction: options.actionText || '确定',
    onPrimary: options.onAction
  });
}

/**
 * 清除所有Toast
 */
export function clearAllToasts() {
  toastInstances.forEach(app => {
    try {
      app.unmount();
    } catch (error) {
      console.warn('Failed to unmount toast instance:', error);
    }
  });
  toastInstances.length = 0;
}

/**
 * 清除所有Modal
 */
export function clearAllModals() {
  modalInstances.forEach(app => {
    try {
      app.unmount();
    } catch (error) {
      console.warn('Failed to unmount modal instance:', error);
    }
  });
  modalInstances.length = 0;
}

/**
 * 清除所有错误提示
 */
export function clearAllErrorUI() {
  clearAllToasts();
  clearAllModals();
}

// 导出组件
export { default as ErrorToast } from './ErrorToast.vue';
export { default as ErrorModal } from './ErrorModal.vue';
export { default as FieldError } from './FieldError.vue';
export { default as FormFieldWrapper } from './FormFieldWrapper.vue';
export { default as ErrorPage } from './ErrorPage.vue';
export { default as ErrorBoundary } from './ErrorBoundary.vue';
