/**
 * 表单验证工具函数
 */

// 验证错误接口
export interface ValidationError {
  field: string;
  message: string;
}

// 验证结果接口
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 解析后端验证错误响应
 */
export function parseValidationErrors(errorData: any): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  if (!errorData || typeof errorData !== 'object') {
    return fieldErrors;
  }

  // 处理DRF风格的错误响应
  Object.entries(errorData).forEach(([field, errors]) => {
    if (Array.isArray(errors)) {
      // 处理ErrorDetail对象数组
      const messages = errors.map(error => {
        if (typeof error === 'string') {
          return error;
        } else if (error && typeof error === 'object') {
          // 处理ErrorDetail对象
          if ('string' in error) {
            return error.string;
          }
          if ('message' in error) {
            return error.message;
          }
          return String(error);
        }
        return String(error);
      }).filter(Boolean);

      if (messages.length > 0) {
        fieldErrors[field] = messages;
      }
    } else if (errors) {
      fieldErrors[field] = [String(errors)];
    }
  });

  return fieldErrors;
}

/**
 * 获取字段的第一个错误消息
 */
export function getFieldError(fieldErrors: Record<string, string[]>, fieldName: string): string {
  const errors = fieldErrors[fieldName];
  return errors && errors.length > 0 ? errors[0] : '';
}

/**
 * 检查是否有字段错误
 */
export function hasFieldError(fieldErrors: Record<string, string[]>, fieldName: string): boolean {
  const errors = fieldErrors[fieldName];
  return errors && errors.length > 0;
}

/**
 * 获取所有错误的字段名
 */
export function getErrorFields(fieldErrors: Record<string, string[]>): string[] {
  return Object.keys(fieldErrors).filter(field => hasFieldError(fieldErrors, field));
}

/**
 * 清除指定字段的错误
 */
export function clearFieldError(fieldErrors: Record<string, string[]>, fieldName: string): Record<string, string[]> {
  const newErrors = { ...fieldErrors };
  delete newErrors[fieldName];
  return newErrors;
}

/**
 * 清除所有字段错误
 */
export function clearAllErrors(): Record<string, string[]> {
  return {};
}

/**
 * 合并字段错误
 */
export function mergeFieldErrors(
  existing: Record<string, string[]>,
  newErrors: Record<string, string[]>
): Record<string, string[]> {
  return { ...existing, ...newErrors };
}

/**
 * 前端表单验证规则
 */
export const validationRules = {
  /**
   * 必填验证
   */
  required: (value: any, message = '该字段为必填项'): ValidationError | null => {
    if (value === null || value === undefined || value === '' ||
      (Array.isArray(value) && value.length === 0)) {
      return { field: '', message };
    }
    return null;
  },

  /**
   * 邮箱验证
   */
  email: (value: string, message = '请输入有效的邮箱地址'): ValidationError | null => {
    if (!value) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { field: '', message };
    }
    return null;
  },

  /**
   * 手机号验证
   */
  phone: (value: string, message = '请输入有效的手机号码'): ValidationError | null => {
    if (!value) return null;

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(value)) {
      return { field: '', message };
    }
    return null;
  },

  /**
   * 最小长度验证
   */
  minLength: (minLen: number, message?: string) =>
    (value: string): ValidationError | null => {
      if (!value) return null;

      if (value.length < minLen) {
        return {
          field: '',
          message: message || `最少需要${minLen}个字符`
        };
      }
      return null;
    },

  /**
   * 最大长度验证
   */
  maxLength: (maxLen: number, message?: string) =>
    (value: string): ValidationError | null => {
      if (!value) return null;

      if (value.length > maxLen) {
        return {
          field: '',
          message: message || `最多允许${maxLen}个字符`
        };
      }
      return null;
    },

  /**
   * 数字范围验证
   */
  range: (min: number, max: number, message?: string) =>
    (value: number): ValidationError | null => {
      if (value === null || value === undefined) return null;

      if (value < min || value > max) {
        return {
          field: '',
          message: message || `请输入${min}到${max}之间的数值`
        };
      }
      return null;
    },

  /**
   * 密码强度验证
   */
  password: (value: string, message = '密码至少8位，包含字母和数字'): ValidationError | null => {
    if (!value) return null;

    if (value.length < 8) {
      return { field: '', message: '密码长度至少8位' };
    }

    const hasLetter = /[a-zA-Z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (!hasLetter || !hasNumber) {
      return { field: '', message };
    }

    return null;
  },

  /**
   * URL验证
   */
  url: (value: string, message = '请输入有效的URL'): ValidationError | null => {
    if (!value) return null;

    try {
      new URL(value);
      return null;
    } catch {
      return { field: '', message };
    }
  }
};

/**
 * 表单验证器类
 */
export class FormValidator {
  private rules: Record<string, Array<(value: any) => ValidationError | null>> = {};

  /**
   * 添加字段验证规则
   */
  addRule(field: string, rule: (value: any) => ValidationError | null): this {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
    return this;
  }

  /**
   * 验证单个字段
   */
  validateField(field: string, value: any): ValidationError | null {
    const fieldRules = this.rules[field];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        return { field, message: error.message };
      }
    }

    return null;
  }

  /**
   * 验证整个表单
   */
  validate(formData: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    Object.keys(this.rules).forEach(field => {
      const value = formData[field];
      const error = this.validateField(field, value);
      if (error) {
        errors.push(error);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 转换为字段错误格式
   */
  toFieldErrors(errors: ValidationError[]): Record<string, string[]> {
    const fieldErrors: Record<string, string[]> = {};

    errors.forEach(error => {
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = [];
      }
      fieldErrors[error.field].push(error.message);
    });

    return fieldErrors;
  }

  /**
   * 清除所有规则
   */
  clear(): void {
    this.rules = {};
  }
}

/**
 * 创建表单验证器的便捷函数
 */
export function createValidator(): FormValidator {
  return new FormValidator();
}
