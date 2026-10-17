/**
 * We-RSS 微信内容聚合与托管模型类型定义
 */

export interface WechatCredential {
  id: number;
  name: string;
  status: 'active' | 'expired' | 'invalid' | 'disabled' | 'pending';
  token?: string;
  cookie?: string;
  expires_at?: string;
  last_login_at?: string;
  last_check_at?: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WechatFeed {
  id: number;
  source_id?: string;
  faker_id?: string;
  biz?: string;
  mp_name: string;
  mp_cover?: string;
  mp_intro?: string;
  status: 'active' | 'disabled';
  last_synced_at?: string;
  is_featured: boolean;
  is_subscribed?: boolean;
  article_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WechatArticle {
  id: number;
  feed: number;
  feed_name?: string;
  mp_name?: string;
  mp_cover?: string;
  article_type: 'news' | 'newspic';
  title: string;
  description?: string;
  content?: string;
  url: string;
  pic_url?: string;
  publish_time?: string;
  read_num?: number;
  like_num?: number;
  share_num?: number;
  collect_num?: number;
  comment_count?: number;
  is_favorite?: boolean;
  is_hidden?: boolean;
  created_at?: string;
}

export interface WechatSyncTask {
  id: number;
  task_type: string;
  status: 'pending' | 'running' | 'success' | 'partial_success' | 'timed_out' | 'failed';
  celery_task_id?: string;
  created_at: string;
  finished_at?: string;
  error_message?: string;
}

export interface WeRssQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  feed_id?: number;
  article_type?: string;
  favorite_only?: boolean | string;
  status?: string;
}
