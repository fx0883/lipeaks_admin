/**
 * License Management System 类型定义
 * 基于licenses_doc中的系统分析，定义所有相关的TypeScript类型
 */

// 软件产品相关类型
export interface SoftwareProduct {
  id: number;
  name: string;
  version: string;
  description: string;
  code: string;
  status: string;
  max_activations: number;
  offline_days: number;
  license_plans_count: number;
  total_licenses: number;
  created_at: string;
  updated_at: string;
}

export interface ProductListParams {
  search?: string;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface ProductCreateParams {
  name: string;
  code: string;
  version: string;
  description: string;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface ProductUpdateParams extends Partial<ProductCreateParams> {}

// 产品创建表单数据类型
export interface ProductCreateData {
  name: string;
  code: string;
  version: string;
  description: string;
  is_active: boolean;
  metadata: Record<string, any>;
}

// 许可证计划相关类型
export type PlanType = 'trial' | 'basic' | 'professional' | 'enterprise';
export type PlanStatus = 'active' | 'inactive' | 'deprecated';

export interface LicensePlan {
  id: number;
  product_id: number;
  name: string;
  plan_type: PlanType;
  description: string;
  max_activations: number;
  duration_days: number;
  features: string[];
  price: number;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product?: SoftwareProduct;
}

export interface PlanListParams {
  search?: string;
  product_id?: number;
  plan_type?: PlanType;
  is_active?: boolean;
  page?: number;
  page_size?: number;
}

export interface PlanCreateParams {
  product_id: number;
  name: string;
  plan_type: PlanType;
  description: string;
  max_activations: number;
  duration_days: number;
  features: string[];
  price: number;
  currency?: string;
  is_active?: boolean;
}

export interface PlanUpdateParams extends Partial<PlanCreateParams> {}

// 许可证相关类型
export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked';

export interface License {
  id: string;
  plan_id: number;
  customer_email: string;
  customer_name: string;
  license_key: string;
  activation_count: number;
  max_activations: number;
  status: LicenseStatus;
  issued_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  plan?: LicensePlan;
  activations?: LicenseActivation[];
}

export interface LicenseListParams {
  search?: string;
  plan_id?: number;
  customer_email?: string;
  status?: LicenseStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface LicenseCreateParams {
  plan_id: number;
  customer_email: string;
  customer_name: string;
  quantity?: number;
  expires_at?: string;
  notes?: string;
}

export interface LicenseUpdateParams {
  customer_email?: string;
  customer_name?: string;
  status?: LicenseStatus;
  expires_at?: string;
  notes?: string;
}

// 机器绑定相关类型
export type BindingStatus = 'active' | 'inactive' | 'suspended';

export interface MachineBinding {
  id: number;
  license_id: string;
  machine_fingerprint: string;
  machine_name: string;
  machine_info: {
    os: string;
    cpu: string;
    memory: string;
    disk: string;
    network: string;
  };
  status: BindingStatus;
  bound_at: string;
  last_heartbeat: string;
  created_at: string;
  updated_at: string;
  license?: License;
}

export interface MachineBindingListParams {
  search?: string;
  license_id?: string;
  status?: BindingStatus;
  page?: number;
  page_size?: number;
}

// 许可证激活相关类型
export type ActivationStatus = 'success' | 'failed' | 'pending';

export interface LicenseActivation {
  id: number;
  license_id: string;
  machine_binding_id: number;
  activation_token: string;
  status: ActivationStatus;
  ip_address: string;
  user_agent: string;
  activation_data: Record<string, any>;
  activated_at: string;
  expires_at: string;
  created_at: string;
  license?: License;
  machine_binding?: MachineBinding;
}

export interface ActivationListParams {
  search?: string;
  license_id?: string;
  status?: ActivationStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// 审计日志相关类型
export type AuditAction = 'create' | 'update' | 'delete' | 'activate' | 'deactivate' | 'bind' | 'unbind';
export type AuditLevel = 'info' | 'warning' | 'error' | 'critical';

export interface AuditLog {
  id: number;
  user_id: number;
  action: AuditAction;
  resource_type: string;
  resource_id: string;
  level: AuditLevel;
  message: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface AuditLogListParams {
  search?: string;
  user_id?: number;
  action?: AuditAction;
  resource_type?: string;
  level?: AuditLevel;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

// 统计数据相关类型
export interface LicenseStatistics {
  total_products: number;
  total_plans: number;
  total_licenses: number;
  active_licenses: number;
  expired_licenses: number;
  total_activations: number;
  active_machines: number;
  revenue: {
    total: number;
    monthly: number;
    currency: string;
  };
}

export interface ActivationTrend {
  date: string;
  activations: number;
  deactivations: number;
  net_change: number;
}

export interface RevenueReport {
  period: string;
  total_revenue: number;
  license_count: number;
  average_price: number;
  currency: string;
}

// 批量操作相关类型
export interface BatchOperationParams {
  ids: (string | number)[];
  action: string;
  data?: Record<string, any>;
}

export interface BatchOperationResult {
  success_count: number;
  failed_count: number;
  errors: Array<{
    id: string | number;
    error: string;
  }>;
}

// 导出相关类型
export interface ExportParams {
  format: 'csv' | 'excel' | 'json';
  filters?: Record<string, any>;
  fields?: string[];
}

export interface ExportResult {
  file_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
}
