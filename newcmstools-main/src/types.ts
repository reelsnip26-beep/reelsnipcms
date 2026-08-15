export type AdType = 'image' | 'video' | 'banner' | 'native' | 'popup' | 'in_content';
export type MediaType = 'image' | 'video';
export type AdStatus = 'active' | 'inactive' | 'scheduled' | 'expired';
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'expired';
export type RotationMode = 'priority' | 'random' | 'equal';

export interface Advertiser {
  id: string;
  name: string;
  company?: string;
  company_name?: string;
  email: string;
  phone: string;
  website: string;
  notes: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  advertiser_id: string;
  advertiser_name?: string;
  name: string;
  description: string;
  start_at: string | null;
  end_at: string | null;
  budget: number;
  status: CampaignStatus;
  total_ads?: number;
  total_impressions?: number;
  total_clicks?: number;
  ctr?: string;
  created_at: string;
  updated_at: string;
}

export interface Placement {
  id: string;
  name: string;
  placement_key: string;
  description: string;
  recommended_width: number;
  recommended_height: number;
  rotation_mode?: string;
  status: 'active' | 'inactive';
  total_ads?: number;
  active_ads?: number;
  created_at: string;
}

export interface Ad {
  id: string;
  campaign_id: string | null;
  campaign_name?: string;
  advertiser_id: string | null;
  advertiser_name?: string;
  name: string;
  ad_type: AdType;
  media_type: MediaType;
  media_url: string;
  media_r2_key: string | null;
  destination_url: string;
  placement_id: string;
  placement_name?: string;
  headline?: string;
  description?: string;
  call_to_action?: string;
  priority: number; // 1 to 10
  weight: number;
  status: AdStatus;
  effective_status?: 'active' | 'inactive' | 'scheduled' | 'expired';
  start_at: string | null;
  end_at: string | null;
  timezone: string;
  open_new_tab: number | boolean;
  video_muted: number | boolean;
  video_controls: number | boolean;
  video_loop: number | boolean;
  video_autoplay: number | boolean;
  target_pages?: string;
  impressions_count?: number;
  clicks_count?: number;
  ctr?: string;
  created_at: string;
  updated_at: string;
}

export interface MediaItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  r2_key: string | null;
  url: string;
  usage_count?: number;
  used_by_ads?: { id: string; name: string; status: string }[];
  created_at: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  created_at: string;
}

export interface AnalyticsSummary {
  total_impressions: number;
  total_clicks: number;
  ctr: number;
  total_ads: number;
  active_ads: number;
  scheduled_ads: number;
  expired_ads: number;
  active_campaigns: number;
}

export interface DailyMetric {
  date: string;
  impressions: number;
  clicks: number;
}

export interface AdBreakdown {
  id: string;
  name: string;
  ad_type: string;
  placement_id: string;
  impressions: number;
  clicks: number;
  ctr: string;
}

export interface PlacementBreakdown {
  placement_id: string;
  name: string;
  impressions: number;
  clicks: number;
  ctr: string;
}

export interface DeviceBreakdown {
  device_type: string;
  count: number;
}

export interface AnalyticsData {
  summary: AnalyticsSummary;
  daily_metrics: DailyMetric[];
  ads_breakdown: AdBreakdown[];
  placement_breakdown: PlacementBreakdown[];
  device_breakdown: DeviceBreakdown[];
  activities?: ActivityLog[];
  recent_activity?: ActivityLog[];
}

export interface CMSSettings {
  site_name?: string;
  api_base_url?: string;
  default_video_muted?: string;
  default_rotation?: RotationMode;
  default_rotation_mode?: string;
  default_timezone?: string;
  max_image_mb?: string;
  max_video_mb?: string;
  max_upload_size_mb?: number;
  r2_public_url?: string;
  r2_public_domain?: string;
  cache_duration_seconds?: number;
  cors_allowed_origins?: string;
  retention_days?: string;
  admin_email?: string;
}
