/**
 * API响应类型定义
 */

// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean;      // 请求是否成功
  code: number;          // 状态码
  message: string;       // 消息
  data: T;               // 响应数据
}

// 分页数据接口（双向兼容前端统一结构与 DRF 原生分页契约）
export interface PaginationData<T = any> {
  total?: number;         // 总条数
  page?: number;          // 当前页码
  limit?: number;         // 每页条数
  total_pages?: number;  // 总页数
  data?: T[];             // 数据列表
  count?: number;         // DRF 总条数
  next?: string | null;   // DRF 下一页
  previous?: string | null;// DRF 上一页
  results?: T[];          // DRF 数据列表
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
    total_pages?: number;
    count?: number;
    current_page?: number;
    page_size?: number;
    next?: string | null;
    previous?: string | null;
    [key: string]: any;
  };
  [key: string]: any;
}

// Django REST Framework 分页响应数据接口
export interface DRFPaginationData<T = any> {
  count: number;          // 总条数
  next?: string | null;   // 下一页URL
  previous?: string | null;// 上一页URL
  results: T[];           // 数据列表
}

// 分页响应接口
export interface PaginationResponse<T = any> extends ApiResponse<PaginationData<T>> {}

// Django REST Framework 分页响应接口
export interface DRFPaginationResponse<T = any> extends ApiResponse<DRFPaginationData<T>> {}

// 用户信息接口
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  nick_name: string;
  nickname?: string;
  is_admin: boolean;
  is_super_admin: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  is_member?: boolean;
  avatar?: string;
  phone?: string;
  status?: string;
  last_login_ip?: string;
  tenant?: any;
  parent?: any;
}

// 登录响应数据接口
export interface LoginResponseData {
  token: string;
  refresh_token: string;
  user: UserInfo;
}

// 刷新令牌响应数据接口
export interface RefreshTokenResponseData {
  token: string;
  refresh_token: string;
} 