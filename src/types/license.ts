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
  is_active: boolean;
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
}

export interface ProductUpdateParams extends Partial<ProductCreateParams> {}

// 产品编辑表单数据类型
export interface ProductEditFormData {
  name: string;
  code: string;
  version: string;
  description: string;
  is_active: boolean;
}

// 产品创建表单数据类型
export interface ProductCreateData {
  name: string;
  code: string;
  version: string;
  description: string;
  is_active: boolean;
}

// 许可证计划相关类型
export type PlanType =
  | "trial"
  | "basic"
  | "professional"
  | "enterprise"
  | "custom";
export type PlanStatus = "active" | "inactive" | "deprecated";

export interface LicensePlan {
  id: number;
  product: number;
  product_name?: string; // 只读字段
  name: string;
  code: string;
  plan_type: PlanType;
  max_machines: number;
  validity_days: number;
  features?: Record<string, any>; // JSON对象
  price: string; // API返回字符串格式
  currency: string;
  status: "active" | "inactive";
  licenses_count?: number; // 只读字段
  created_at: string;
  updated_at: string;
}

export interface PlanListParams {
  search?: string;
  product?: number; // API中的字段名是product，不是product_id
  plan_type?: PlanType;
  status?: "active" | "inactive"; // API中用status，不是is_active
  page?: number;
  page_size?: number;
  ordering?: string; // 支持排序
}

export interface PlanCreateParams {
  product: number;
  name: string;
  code: string;
  plan_type: PlanType;
  max_machines: number;
  validity_days: number;
  features?: Record<string, any>;
  price: string; // decimal作为字符串传输
  currency?: string;
  status?: "active" | "inactive";
}

export interface PlanUpdateParams extends Partial<PlanCreateParams> {}

// 客户信息接口
export interface CustomerInfo {
  name: string;
  email: string;
  company?: string;
  phone?: string;
}

// 许可证相关类型
export type LicenseStatus =
  | "generated"
  | "activated"
  | "suspended"
  | "revoked"
  | "expired";

export interface License {
  id: number;
  product: number;
  product_name?: string;
  plan: number;
  plan_name?: string;
  license_key: string;
  customer_name: string;
  customer_email: string;
  max_activations: number;
  current_activations: number;
  issued_at: string;
  expires_at: string;
  last_verified_at: string | null;
  status: LicenseStatus;
  machine_bindings_count: number;
  days_until_expiry: number;
  notes?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  machine_bindings?: MachineBinding[];
  recent_activations?: LicenseActivation[];
  usage_stats?: {
    total_usage_logs: number;
    recent_usage_logs: number;
  };
}

export interface LicenseListParams {
  search?: string;
  product?: number;
  plan?: number;
  status?: LicenseStatus;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface LicenseCreateParams {
  product?: number;
  plan: number;
  customer_info: CustomerInfo;
  max_activations?: number;
  validity_days?: number;
  notes?: string;
}

export interface LicenseUpdateParams {
  product?: number;
  plan?: number;
  customer_name?: string;
  customer_email?: string;
  max_activations?: number;
  status?: LicenseStatus;
  notes?: string;
}

// 机器绑定相关类型
export type MachineBindingStatus = "active" | "inactive" | "blocked";

export interface MachineBinding {
  id: number;
  license: number; // 关联的许可证ID
  license_key_preview: string; // 许可证密钥预览
  machine_id: string; // 机器唯一标识符
  hardware_summary: {
    cpu?: string;
    memory?: string;
    disk?: string;
    motherboard?: string;
    graphics?: string;
    bios?: string;
    network_adapters?: string[];
  };
  os_info: {
    name?: string;
    version?: string;
    build?: string; // Windows构建号
    kernel?: string; // Linux内核版本
    architecture?: string;
    install_date?: string;
    last_boot_time?: string;
    timezone?: string;
    language?: string;
    domain?: string;
  };
  last_ip_address: string; // 最后访问的IP地址
  status: MachineBindingStatus; // 绑定状态
  first_seen_at: string; // 首次绑定时间
  last_seen_at: string; // 最后活跃时间
  days_since_last_seen: number; // 距离最后活跃的天数
}

export interface MachineBindingListParams {
  search?: string; // 按机器ID搜索
  license?: number; // 按许可证ID过滤
  status?: MachineBindingStatus; // 按状态过滤
  ordering?: string; // 排序字段
  page?: number;
  page_size?: number;
}

export interface MachineBindingBlockParams {
  reason?: string; // 阻止原因
}

// 许可证激活相关类型
export type ActivationStatus = "success" | "failed" | "pending";

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
export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "activate"
  | "deactivate"
  | "bind"
  | "unbind";
export type AuditLevel = "info" | "warning" | "error" | "critical";

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

// 许可证延期参数
export interface LicenseExtendParams {
  days: number;
}

// 许可证撤销参数
export interface LicenseRevokeParams {
  reason?: string;
}

// 批量操作相关类型
export interface BatchOperationParams {
  license_ids: number[];
  operation: "revoke" | "suspend" | "activate" | "extend";
  parameters?: Record<string, any>;
  reason?: string;
}

export interface BatchOperationResult {
  success: boolean;
  message: string;
  results: Array<{
    license_id: number;
    success: boolean;
    message?: string;
    error?: string;
  }>;
}

// 导出相关类型
export interface ExportParams {
  format: "csv" | "excel" | "json";
  filters?: Record<string, any>;
  fields?: string[];
}

export interface ExportResult {
  file_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
}
