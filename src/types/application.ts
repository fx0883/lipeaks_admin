/**
 * 应用管理相关类型定义
 */

// 应用状态
export type ApplicationStatus =
  | "development"  // 开发中
  | "testing"      // 测试中
  | "active"       // 已发布
  | "inactive"     // 已下线
  | "deprecated";  // 已废弃

// 应用基本信息接口
export interface Application {
  id: number; // 应用ID
  name: string; // 应用名称，最大100字符
  code: string; // 应用代码，最大50字符，租户内唯一
  description?: string; // 应用描述
  logo?: string; // Logo URL地址
  website?: string; // 官方网站URL
  contact_email?: string; // 联系邮箱
  current_version: string; // 当前版本，默认"1.0.0"
  owner?: string; // 负责人姓名，最大100字符
  team?: string; // 开发团队名称，最大200字符
  status: ApplicationStatus; // 状态
  is_active: boolean; // 是否启用
  tags?: string[]; // 标签列表
  metadata?: Record<string, any>; // 元数据，JSON对象
  tenant_id?: number; // 所属租户ID（后端自动设置）
  license_count?: number; // 许可证总数（仅在详情接口返回）
  feedback_count?: number; // 反馈总数（仅在详情接口返回）
  article_count?: number; // 关联文章总数（仅在详情接口返回）
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
}

// 应用列表请求参数接口
export interface ApplicationListParams {
  search?: string; // 搜索关键词（name、code、description）
  status?: ApplicationStatus; // 状态过滤
  is_active?: boolean; // 是否启用过滤
  page?: number; // 页码，默认1
  page_size?: number; // 每页数量，默认10
  ordering?: string; // 排序字段，如 "-created_at"
}

// 创建/更新应用请求参数接口
export interface ApplicationCreateUpdateParams {
  name: string; // 应用名称（必填）
  code: string; // 应用代码（必填）
  description?: string; // 应用描述
  logo?: string; // Logo URL地址
  website?: string; // 官方网站URL
  contact_email?: string; // 联系邮箱
  current_version?: string; // 当前版本，默认"1.0.0"
  owner?: string; // 负责人姓名
  team?: string; // 开发团队名称
  status?: ApplicationStatus; // 状态，默认"active"
  is_active?: boolean; // 是否启用，默认true
  tags?: string[]; // 标签列表
  metadata?: Record<string, any>; // 元数据
  logoFile?: File; // Logo文件（仅在前端使用）
}

// 应用统计信息接口
export interface ApplicationStatistics {
  licenses: {
    total: number; // 许可证总数
    active: number; // 已激活的许可证数
  };
  feedbacks: {
    total: number; // 反馈总数
    open: number; // 未关闭的反馈数
  };
  articles: {
    total: number; // 关联文章总数
  };
}

// 应用关联文章接口（简化版，详细字段参考CMS Article类型）
export interface ApplicationArticle {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  status: string;
  author_type: string;
  is_featured: boolean;
  is_pinned: boolean;
  cover_image?: string;
  cover_image_small?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  comments_count: number;
  likes_count: number;
  views_count: number;
}

// Logo上传响应接口
export interface ApplicationLogoUploadResponse {
  logo_url?: string; // Logo URL
  logo?: string; // Logo URL（备用字段）
}
