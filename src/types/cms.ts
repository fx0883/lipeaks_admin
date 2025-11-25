// CMS类型定义文件
// 所有与CMS模块相关的TypeScript类型定义

// 多语言相关类型
// --------------------------------------------

// 支持的语言类型
export type SupportedLanguage = 'zh-hans' | 'en' | 'zh-hant' | 'ja' | 'ko' | 'fr';

// 语言信息接口
export interface LanguageInfo {
  code: SupportedLanguage;
  label: string;
  shortLabel: string;
}

// 分类翻译内容接口
export interface CategoryTranslation {
  name: string;
  description?: string;
  seo_title?: string;
  seo_description?: string;
}

// 分类多语言翻译对象
export interface CategoryTranslations {
  'zh-hans'?: CategoryTranslation;
  'en'?: CategoryTranslation;
  'zh-hant'?: CategoryTranslation;
  'ja'?: CategoryTranslation;
  'ko'?: CategoryTranslation;
  'fr'?: CategoryTranslation;
}

// 文章相关类型
// --------------------------------------------

// 文章状态枚举
export type ArticleStatus = 'draft' | 'pending' | 'published' | 'archived';

// 文章可见性枚举
export type ArticleVisibility = 'public' | 'private' | 'password';

// 内容类型枚举
export type ContentType =
  | 'markdown'
  | 'html'
  | 'image'
  | 'image_upload'
  | 'video'
  | 'audio'
  | 'file'
  | 'link'
  | 'quote'
  | 'code'
  | 'table'
  | 'list';

// 简化的分类信息
export interface CategorySimple {
  id: number;
  name: string;
  slug: string;
}

// 简化的标签信息
export interface TagSimple {
  id: number;
  name: string;
  slug: string;
  color?: string;
}

// 文章模型
export interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  content_type: ContentType;
  excerpt: string;
  author: number;
  author_info?: {
    id: number;
    username: string;
    avatar: string;
  };
  author_type?: 'admin' | 'member';
  status: ArticleStatus;
  is_featured: boolean;
  is_pinned: boolean;
  allow_comment: boolean;
  visibility: ArticleVisibility;
  password?: string;
  parent?: number | null;
  parent_info?: {
    id: number;
    title: string;
    slug: string;
  } | null;
  children_count?: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  cover_image?: string;
  template?: string;
  sort_order?: number;
  tenant: number;
  categories?: number[] | CategorySimple[];
  tags?: number[] | TagSimple[];
  view_count?: number;
  comment_count?: number;
  like_count?: number;
}

// 文章列表参数
export interface ArticleListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: ArticleStatus;
  content_type?: ContentType;
  visibility?: ArticleVisibility;
  category_id?: number;
  tag_id?: number;
  author_id?: number;
  user_id?: number;
  member_id?: number;
  author_type?: 'admin' | 'member';
  parent_id?: number;
  has_parent?: boolean | string;
  is_featured?: boolean;
  is_pinned?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// 文章创建参数
export interface ArticleCreateParams {
  title: string;
  slug?: string;
  content: string;
  content_type: ContentType;
  excerpt?: string;
  status: ArticleStatus;
  is_featured?: boolean;
  is_pinned?: boolean;
  allow_comment?: boolean;
  visibility: ArticleVisibility;
  password?: string;
  parent?: number | null;
  cover_image?: string;
  template?: string;
  sort_order?: number;
  categories?: number[];
  tags?: number[];
}

// 文章更新参数
export interface ArticleUpdateParams extends Partial<ArticleCreateParams> {
  create_new_version?: boolean;
  change_description?: string;
  publish_now?: boolean;
  scheduled_publish_time?: string;
}

// 评论相关类型
// --------------------------------------------

// 评论状态枚举
export type CommentStatus = 'pending' | 'approved' | 'spam' | 'trash' | 'rejected';

// 评论作者类型
export type CommentAuthorType = 'admin' | 'member' | 'guest';

// 评论模型
export interface Comment {
  id: number;
  article: number;
  parent?: number | null;
  user?: number | null;
  member?: number | null;
  // 兼容旧字段user_info，新字段author_info
  user_info?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar: string;
  };
  author_info?: {
    id?: number;
    username?: string;
    nick_name?: string;
    avatar?: string;
    name?: string;
    email?: string;
    type?: string;
  };
  author_type?: CommentAuthorType;
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
  content: string;
  status: CommentStatus;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  likes_count: number;
  tenant: number;
  replies_count: number;
}

// 评论列表参数
export interface CommentListParams {
  page?: number;
  page_size?: number;
  status?: CommentStatus;
  article?: number;
  user?: number;
  member?: number;
  search?: string;
  date_from?: string;
  date_to?: string;
  parent?: number | string;
  has_parent?: boolean | string;
}

// 评论创建参数
export interface CommentCreateParams {
  article: number;
  parent?: number;
  content: string;
  guest_name?: string;
  guest_email?: string;
  guest_website?: string;
}

// 评论更新参数
export interface CommentUpdateParams {
  content?: string;
  status?: CommentStatus;
  is_pinned?: boolean;
}

// 分类相关类型
// --------------------------------------------

// 分类状态枚举
export type CategoryStatus = 'active' | 'inactive';

// 分类对象接口
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent?: number | null;
  level: number;
  path: string;
  sort_order: number;
  icon?: string;
  cover_image?: string;
  is_active: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  article_count?: number;
  children?: Category[];

  // 应用关联
  application?: number | null;
  application_name?: string;

  // 多语言翻译对象
  translations?: CategoryTranslations;
  // SEO字段
  seo_title?: string;
  seo_description?: string;
}

// 分类列表查询参数
export interface CategoryListParams {
  search?: string;
  parent?: number | null;
  is_active?: boolean | string;
  is_pinned?: boolean | string;
  application?: number;
  ordering?: string;
  page?: number;
  page_size?: number;
}

// 分类创建参数
export interface CategoryCreateParams {
  name?: string;  // 改为可选，因为可能通过translations提供
  slug?: string;
  description?: string;
  parent?: number | null;
  icon?: string;
  cover_image?: string;
  is_active?: boolean;
  is_pinned?: boolean;
  sort_order?: number;
  application?: number | null;

  // 多语言翻译对象
  translations?: CategoryTranslations;
  // SEO字段
  seo_title?: string;
  seo_description?: string;
}

// 分类更新参数
export interface CategoryUpdateParams {
  name?: string;
  slug?: string;
  description?: string;
  parent?: number | null;
  icon?: string;
  cover_image?: string;
  is_active?: boolean;
  is_pinned?: boolean;
  sort_order?: number;
  application?: number | null;

  // 多语言翻译对象
  translations?: CategoryTranslations;
  // SEO字段
  seo_title?: string;
  seo_description?: string;
}

// 分类排序更新参数
export interface CategoryOrderParams {
  id: number;
  sort_order: number;
  parent?: number | null;
}

// 标签相关类型
// --------------------------------------------

// 标签状态枚举
export type TagStatus = 'active' | 'inactive';

// 标签对象接口
export interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  group?: number | null;  // 所属标签组ID
  group_name?: string;    // 标签组名称
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  article_count?: number;
  tenant?: number;
}

// 标签列表查询参数
export interface TagListParams {
  search?: string;
  is_active?: boolean | string;
  page?: number;
  page_size?: number;
}

// 标签创建参数
export interface TagCreateParams {
  name: string;
  slug?: string;
  description?: string;
  group?: number | null;  // 所属标签组ID
  color?: string;
  is_active?: boolean;
}

// 标签更新参数
export interface TagUpdateParams {
  name?: string;
  slug?: string;
  description?: string;
  group?: number | null;  // 所属标签组ID
  color?: string;
  is_active?: boolean;
}

// 标签组模型
export interface TagGroup {
  id: number;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  tag_count: number;
  tenant: number;
}

// 简化的标签组信息
export interface TagGroupSimple {
  id: number;
  name: string;
  slug: string;
}

// 标签组列表参数
export interface TagGroupListParams {
  page?: number;
  page_size?: number;
  search?: string;
  is_active?: boolean;
}

// 标签组创建参数
export interface TagGroupCreateParams {
  name: string;
  slug?: string;
  description?: string;
  is_active?: boolean;
}

// 标签组更新参数
export interface TagGroupUpdateParams extends Partial<TagGroupCreateParams> { }

// 文章统计数据
export interface ArticleStatistics {
  view_count: number;
  unique_view_count: number;
  comment_count: number;
  like_count: number;
  bookmark_count: number;
  average_reading_time: number;
  bounce_rate: number;
}

// 文章版本信息
export interface ArticleVersion {
  version_number: number;
  created_at: string;
  user: {
    id: number;
    username: string;
  };
} 