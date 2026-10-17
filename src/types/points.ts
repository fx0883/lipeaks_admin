/**
 * 积分体系与会员成长模型类型定义
 */

export interface UserLevel {
  id: number;
  level_name: string;
  level_code: string;
  level_order: number;
  min_points: number;
  max_points?: number | null;
  permissions?: Record<string, any>;
  quota_config?: Record<string, any>;
  level_color: string;
  level_icon?: string;
  is_default: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserTypeTag {
  id: number;
  tag_name: string;
  tag_code: string;
  tag_type: 'vip' | 'enterprise' | 'education' | 'developer' | 'partner' | 'trial' | 'custom';
  tag_color: string;
  tag_icon?: string;
  tag_description?: string;
  default_duration_days?: number;
  max_duration_days?: number;
  requires_payment?: boolean;
}

export interface TenantUserProfile {
  id: number;
  member: number;
  member_name?: string;
  member_email?: string;
  tenant: number;
  total_points: number;
  available_points: number;
  current_level?: number | null;
  current_level_name?: string;
  level_updated_at?: string;
  points_earned_total: number;
  points_spent_total: number;
  points_expired_total: number;
  points_multiplier: string | number;
  is_points_enabled: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TenantUserPoints {
  id: number;
  tenant_user_profile: number;
  member?: number;
  member_name?: string;
  point_type: 'earn' | 'spend' | 'expire' | 'adjust';
  category: string;
  subcategory?: string;
  points: number;
  balance_before: number;
  balance_after: number;
  earned_at?: string;
  expires_at?: string;
  operation_reason?: string;
  status: 'active' | 'expired' | 'cancelled' | 'adjusted';
}

export interface TenantUserTypeTag {
  id: number;
  member: number;
  member_name?: string;
  tag: number;
  tag_name?: string;
  tag_code?: string;
  tag_color?: string;
  granted_at: string;
  expires_at: string;
  status: 'active' | 'expired' | 'suspended' | 'cancelled' | 'grace_period';
}

export interface PointsStatistics {
  total_points_issued?: number;
  total_points_available?: number;
  total_profiles?: number;
  active_members_count?: number;
  level_distribution?: Array<{
    level_name: string;
    level_code: string;
    count: number;
    color?: string;
  }>;
}

export interface PointsQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  member?: number;
  point_type?: string;
  category?: string;
  status?: string;
}
