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

export interface ApplicationUserLevel {
  id: number;
  tenant?: number;
  application: number;
  application_name?: string;
  application_code?: string;
  level_name: string;
  level_code: string;
  level_order: number;
  min_points: number;
  max_points?: number | null;
  icon?: string;
  icon_url?: string;
  level_color: string;
  level_description?: string;
  permissions?: Record<string, any>;
  quota_config?: Record<string, any>;
  is_active: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AppUserPointsAccount {
  id: number;
  tenant_user_profile?: number;
  tenant?: number;
  application: number;
  application_name?: string;
  application_code?: string;
  member: number;
  member_username?: string;
  member_email?: string;
  total_points: number;
  available_points: number;
  points_earned_total: number;
  points_spent_total: number;
  current_level?: number | null;
  current_level_info?: {
    id: number;
    level_name: string;
    level_code: string;
    level_order: number;
    level_color: string;
    icon?: string;
  } | null;
  level_updated_at?: string;
  is_enabled: boolean;
  last_points_update?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CheckinLadderItem {
  day: number;
  points: number;
  label?: string;
}

export interface CheckinConfig {
  id?: number;
  tenant?: number;
  application: number | null;
  application_name?: string;
  application_code?: string;
  name: string;
  cycle_days: number;
  cycle_mode: 'repeat' | 'cap';
  reward_ladder: CheckinLadderItem[];
  allow_recheckin: boolean;
  recheckin_cost: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCheckinStreak {
  id: number;
  tenant?: number;
  application?: number | null;
  application_name?: string;
  member: number;
  member_username?: string;
  member_email?: string;
  current_streak: number;
  max_streak: number;
  total_days: number;
  last_checkin_date?: string | null;
  has_checked_in_today?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserCheckinRecord {
  id: number;
  tenant?: number;
  application?: number | null;
  application_name?: string;
  member: number;
  member_username?: string;
  member_email?: string;
  checkin_date: string;
  streak_day: number;
  reward_points: number;
  is_recheckin: boolean;
  extra_data?: Record<string, any>;
  created_at?: string;
}


