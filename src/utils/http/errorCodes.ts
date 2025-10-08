/**
 * 错误码映射和常量定义
 * 基于 Lipeaks Backend 统一异常处理系统
 */

// 错误码到标识符的映射
export const ERROR_CODE_MAP: Record<number, string> = {
  // 认证授权错误 (4001-4099)
  4001: 'AUTH_NOT_AUTHENTICATED',
  4002: 'AUTH_TOKEN_INVALID',
  4003: 'AUTH_PERMISSION_DENIED',
  4004: 'AUTH_TOKEN_EXPIRED',

  // 租户管理错误 (4100-4199)
  4101: 'TENANT_NOT_FOUND',
  4102: 'TENANT_INACTIVE',
  4103: 'TENANT_QUOTA_EXCEEDED',
  4104: 'TENANT_ACCESS_DENIED',

  // 许可证管理错误 (4200-4299)
  4201: 'LICENSE_EXPIRED',
  4202: 'LICENSE_NOT_FOUND',
  4203: 'LICENSE_QUOTA_EXCEEDED',
  4204: 'LICENSE_INVALID',
  4205: 'LICENSE_REVOKED',
  4206: 'LICENSE_ALREADY_ASSIGNED',
  4207: 'LICENSE_MACHINE_LIMIT_EXCEEDED',

  // 用户管理错误 (4300-4399)
  4301: 'USER_NOT_FOUND',
  4302: 'USER_INACTIVE',
  4303: 'USER_PERMISSION_DENIED',
  4304: 'USER_ALREADY_EXISTS',
  4305: 'USER_INVALID_CREDENTIALS',

  // 积分系统错误 (4400-4499)
  4401: 'POINTS_INSUFFICIENT',
  4402: 'POINTS_EXPIRED',
  4403: 'POINTS_INVALID_OPERATION',
  4404: 'POINTS_DAILY_LIMIT_EXCEEDED',

  // CMS系统错误 (4500-4599)
  4501: 'CONTENT_NOT_FOUND',
  4502: 'CONTENT_ACCESS_DENIED',
  4503: 'CONTENT_PUBLISH_FAILED',

  // 验证错误
  4000: 'VALIDATION_ERROR',

  // 服务器错误 (5000-5099)
  5000: 'INTERNAL_SERVER_ERROR',
  5001: 'REQUEST_TIMEOUT',
  5002: 'NETWORK_ERROR',
  5003: 'DATABASE_ERROR',
  5004: 'EXTERNAL_SERVICE_ERROR',
};

// 用户友好的错误消息映射
export const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  // 认证相关
  'AUTH_NOT_AUTHENTICATED': '登录已过期，请重新登录',
  'AUTH_TOKEN_INVALID': 'Token无效，请重新登录',
  'AUTH_PERMISSION_DENIED': '您没有权限执行此操作',
  'AUTH_TOKEN_EXPIRED': '登录已过期，请重新登录',

  // 租户相关
  'TENANT_NOT_FOUND': '该租户不存在，请返回列表重新选择',
  'TENANT_INACTIVE': '租户账户已被禁用，请联系管理员',
  'TENANT_QUOTA_EXCEEDED': '配额已满，请升级套餐或联系管理员',
  'TENANT_ACCESS_DENIED': '无权访问该租户资源',

  // 许可证相关
  'LICENSE_EXPIRED': '许可证已过期，续费后可继续使用',
  'LICENSE_NOT_FOUND': '许可证不存在',
  'LICENSE_QUOTA_EXCEEDED': '许可证配额已满，请升级套餐',
  'LICENSE_INVALID': '许可证无效',
  'LICENSE_REVOKED': '许可证已被撤销',
  'LICENSE_ALREADY_ASSIGNED': '您已经拥有该产品的许可证',
  'LICENSE_MACHINE_LIMIT_EXCEEDED': '机器绑定数量已达上限',

  // 用户相关
  'USER_NOT_FOUND': '用户不存在',
  'USER_INACTIVE': '用户账户已被禁用，请联系管理员',
  'USER_PERMISSION_DENIED': '您没有权限执行此操作，如有需要请联系管理员',
  'USER_ALREADY_EXISTS': '用户已存在',
  'USER_INVALID_CREDENTIALS': '用户名或密码错误',

  // 积分相关
  'POINTS_INSUFFICIENT': '积分余额不足，完成任务可获取积分',
  'POINTS_EXPIRED': '积分已过期',
  'POINTS_INVALID_OPERATION': '积分操作无效',
  'POINTS_DAILY_LIMIT_EXCEEDED': '今日积分获取已达上限，明天再来',

  // CMS相关
  'CONTENT_NOT_FOUND': '内容不存在',
  'CONTENT_ACCESS_DENIED': '无权访问此内容',
  'CONTENT_PUBLISH_FAILED': '内容发布失败',

  // 验证错误
  'VALIDATION_ERROR': '请检查输入信息',

  // 服务器错误
  'INTERNAL_SERVER_ERROR': '服务器暂时不可用，请稍后重试',
  'REQUEST_TIMEOUT': '请求超时，请稍后重试',
  'NETWORK_ERROR': '网络连接失败，请检查您的网络设置',
  'DATABASE_ERROR': '数据库连接异常，请稍后重试',
  'EXTERNAL_SERVICE_ERROR': '外部服务暂时不可用，请稍后重试'
};

// 操作指引配置
export const ACTION_GUIDANCE: Record<string, {
  message: string;
  action?: string;
  route?: string;
  type?: 'redirect' | 'modal' | 'toast';
}> = {
  // 认证错误 - 跳转登录
  'AUTH_NOT_AUTHENTICATED': {
    message: '登录已过期',
    action: '重新登录',
    route: '/login',
    type: 'redirect'
  },
  'AUTH_TOKEN_EXPIRED': {
    message: '登录已过期',
    action: '重新登录',
    route: '/login',
    type: 'redirect'
  },

  // 权限错误 - 提示联系管理员
  'AUTH_PERMISSION_DENIED': {
    message: '您没有权限执行此操作',
    action: '联系管理员',
    type: 'modal'
  },
  'USER_PERMISSION_DENIED': {
    message: '您没有权限执行此操作',
    action: '联系管理员',
    type: 'modal'
  },

  // 许可证相关 - 跳转相关页面
  'LICENSE_EXPIRED': {
    message: '许可证已过期',
    action: '立即续费',
    route: '/licenses/renew',
    type: 'modal'
  },
  'LICENSE_QUOTA_EXCEEDED': {
    message: '配额已满',
    action: '升级套餐',
    route: '/upgrade',
    type: 'modal'
  },
  'LICENSE_ALREADY_ASSIGNED': {
    message: '您已经拥有该产品的许可证',
    action: '查看我的许可证',
    route: '/licenses/my',
    type: 'modal'
  },

  // 积分相关
  'POINTS_INSUFFICIENT': {
    message: '积分不足',
    action: '获取积分',
    route: '/points/earn',
    type: 'modal'
  },

  // 租户相关
  'TENANT_NOT_FOUND': {
    message: '租户不存在',
    action: '返回列表',
    route: '/tenants',
    type: 'modal'
  },

  // 服务器错误 - 提供重试
  'INTERNAL_SERVER_ERROR': {
    message: '服务器暂时不可用',
    action: '重试',
    type: 'modal'
  },
  'NETWORK_ERROR': {
    message: '网络连接失败',
    action: '重试',
    type: 'modal'
  }
};

// 错误严重程度分级
export const ERROR_SEVERITY: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
  // 验证错误 - 低
  'VALIDATION_ERROR': 'low',

  // 认证错误 - 高 (需要跳转)
  'AUTH_NOT_AUTHENTICATED': 'high',
  'AUTH_TOKEN_INVALID': 'high',
  'AUTH_TOKEN_EXPIRED': 'high',

  // 权限错误 - 中 (需要用户注意)
  'AUTH_PERMISSION_DENIED': 'medium',
  'USER_PERMISSION_DENIED': 'medium',

  // 业务错误 - 中
  'TENANT_NOT_FOUND': 'medium',
  'LICENSE_EXPIRED': 'medium',
  'LICENSE_QUOTA_EXCEEDED': 'medium',
  'POINTS_INSUFFICIENT': 'medium',

  // 服务器错误 - 严重 (可能影响使用)
  'INTERNAL_SERVER_ERROR': 'critical',
  'NETWORK_ERROR': 'critical',
  'REQUEST_TIMEOUT': 'critical'
};

// 是否应该重试的错误类型
export const RETRYABLE_ERRORS = new Set([
  'NETWORK_ERROR',
  'REQUEST_TIMEOUT',
  'INTERNAL_SERVER_ERROR',
  'DATABASE_ERROR',
  'EXTERNAL_SERVICE_ERROR'
]);

// 需要清除Token的错误类型
export const AUTH_CLEAR_ERRORS = new Set([
  'AUTH_NOT_AUTHENTICATED',
  'AUTH_TOKEN_INVALID',
  'AUTH_TOKEN_EXPIRED'
]);

/**
 * 获取错误标识符
 */
export function getErrorCode(code: number): string {
  return ERROR_CODE_MAP[code] || 'UNKNOWN_ERROR';
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(errorCode: string, originalMessage?: string): string {
  return USER_FRIENDLY_MESSAGES[errorCode] || originalMessage || '操作失败';
}

/**
 * 获取错误严重程度
 */
export function getErrorSeverity(errorCode: string): 'low' | 'medium' | 'high' | 'critical' {
  return ERROR_SEVERITY[errorCode] || 'medium';
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(errorCode: string): boolean {
  return RETRYABLE_ERRORS.has(errorCode);
}

/**
 * 判断是否需要清除认证信息
 */
export function shouldClearAuth(errorCode: string): boolean {
  return AUTH_CLEAR_ERRORS.has(errorCode);
}

/**
 * 获取操作指引
 */
export function getActionGuidance(errorCode: string) {
  return ACTION_GUIDANCE[errorCode];
}
