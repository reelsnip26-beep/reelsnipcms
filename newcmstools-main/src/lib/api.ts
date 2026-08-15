import { Advertiser, Campaign, Placement, Ad, MediaItem, AnalyticsData, CMSSettings } from '../types';

export const api = {
  // Advertisers
  async getAdvertisers(query = ''): Promise<Advertiser[]> {
    const res = await fetch(`/api/advertisers${query ? `?q=${encodeURIComponent(query)}` : ''}`);
    const data = await res.json();
    return data.advertisers || [];
  },

  async createAdvertiser(advertiser: Partial<Advertiser>): Promise<Advertiser> {
    const res = await fetch('/api/advertisers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advertiser)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create advertiser');
    return data.advertiser;
  },

  async updateAdvertiser(advertiser: Partial<Advertiser>): Promise<Advertiser> {
    const res = await fetch('/api/advertisers', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(advertiser)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update advertiser');
    return data.advertiser;
  },

  async deleteAdvertiser(id: string): Promise<void> {
    const res = await fetch(`/api/advertisers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete advertiser');
  },

  // Campaigns
  async getCampaigns(advertiserId = ''): Promise<Campaign[]> {
    const res = await fetch(`/api/campaigns${advertiserId ? `?advertiser_id=${encodeURIComponent(advertiserId)}` : ''}`);
    const data = await res.json();
    return data.campaigns || [];
  },

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const res = await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create campaign');
    return data.campaign;
  },

  async updateCampaign(campaign: Partial<Campaign>): Promise<Campaign> {
    const res = await fetch('/api/campaigns', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaign)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update campaign');
    return data.campaign;
  },

  async deleteCampaign(id: string): Promise<void> {
    const res = await fetch(`/api/campaigns?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete campaign');
  },

  // Placements
  async getPlacements(): Promise<Placement[]> {
    const res = await fetch('/api/placements');
    const data = await res.json();
    return data.placements || [];
  },

  async createPlacement(placement: Partial<Placement>): Promise<Placement> {
    const res = await fetch('/api/placements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placement)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create placement');
    return data.placement;
  },

  async updatePlacement(placement: Partial<Placement>): Promise<Placement> {
    const res = await fetch('/api/placements', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(placement)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update placement');
    return data.placement;
  },

  async deletePlacement(id: string): Promise<void> {
    const res = await fetch(`/api/placements?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete placement');
  },

  // Ads
  async getAds(filters?: { placement?: string; campaign_id?: string; advertiser_id?: string; status?: string; q?: string }): Promise<Ad[]> {
    const params = new URLSearchParams();
    if (filters?.placement) params.set('placement', filters.placement);
    if (filters?.campaign_id) params.set('campaign_id', filters.campaign_id);
    if (filters?.advertiser_id) params.set('advertiser_id', filters.advertiser_id);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.q) params.set('q', filters.q);

    const res = await fetch(`/api/ads?${params.toString()}`);
    const data = await res.json();
    return data.ads || [];
  },

  async createAd(ad: Partial<Ad>): Promise<Ad> {
    const res = await fetch('/api/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ad)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create advertisement');
    return data.ad;
  },

  async updateAd(ad: Partial<Ad>): Promise<Ad> {
    const res = await fetch('/api/ads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ad)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update advertisement');
    return data.ad;
  },

  async deleteAd(id: string): Promise<void> {
    const res = await fetch(`/api/ads?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete advertisement');
  },

  // Ad Push
  async pushAd(pushData: {
    ad_id: string;
    placement_id: string;
    priority?: number;
    start_at?: string;
    end_at?: string;
    target_pages?: string;
    status?: string;
  }): Promise<{ success: boolean; message: string; ad?: Ad }> {
    const res = await fetch('/api/ads/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pushData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to push advertisement');
    return data;
  },

  // Media
  async getMedia(): Promise<MediaItem[]> {
    const res = await fetch('/api/media');
    const data = await res.json();
    return data.media || [];
  },

  async uploadMediaFile(file: File): Promise<MediaItem> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/media', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'File upload failed');
    return data.media;
  },

  async addMediaUrl(url: string, fileName?: string, fileType?: string): Promise<MediaItem> {
    const res = await fetch('/api/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, file_name: fileName, file_type: fileType })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add media URL');
    return data.media;
  },

  async deleteMedia(id: string): Promise<void> {
    const res = await fetch(`/api/media?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete media');
  },

  // Analytics
  async getAnalytics(range = '7d'): Promise<AnalyticsData> {
    const res = await fetch(`/api/analytics?range=${encodeURIComponent(range)}`);
    const data = await res.json();
    return data;
  },

  // Settings
  async getSettings(): Promise<CMSSettings> {
    const res = await fetch('/api/settings');
    const data = await res.json();
    return data.settings || {};
  },

  async updateSettings(settings: Partial<CMSSettings>): Promise<void> {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
  }
};
