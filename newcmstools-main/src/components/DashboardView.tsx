import React, { useState } from 'react';
import {
  Megaphone,
  Radio,
  MousePointerClick,
  Eye,
  TrendingUp,
  Sparkles,
  Play,
  ExternalLink,
  ChevronRight,
  Copy,
  Check,
  Plus,
  Send,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { Ad, Campaign, Advertiser, Placement, AnalyticsSummary, ActivityLog } from '../types';
import { api } from '../lib/api';

interface DashboardViewProps {
  summary: AnalyticsSummary | null;
  ads: Ad[];
  campaigns: Campaign[];
  advertisers: Advertiser[];
  placements?: Placement[];
  activities: ActivityLog[];
  onOpenCreateAd: () => void;
  onOpenPushAd: () => void;
  onOpenSimulator: () => void;
  onViewAds: () => void;
  onViewAnalytics: () => void;
  onAdCreated?: (ad: Ad) => void;
  onAdUpdated?: (ad: Ad) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  ads,
  campaigns,
  advertisers,
  placements = [],
  activities,
  onOpenCreateAd,
  onOpenPushAd,
  onOpenSimulator,
  onViewAds,
  onViewAnalytics,
  onAdCreated,
  onAdUpdated,
}) => {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickMediaUrl, setQuickMediaUrl] = useState('https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80');
  const [quickDestUrl, setQuickDestUrl] = useState('https://example.com/special-deal');
  const [quickPlacement, setQuickPlacement] = useState(placements[0]?.placement_key || 'header-ad');
  const [isQuickPublishing, setIsQuickPublishing] = useState(false);
  const [quickSuccessMsg, setQuickSuccessMsg] = useState('');
  const [togglingAdId, setTogglingAdId] = useState<string | null>(null);

  const activeAds = ads.filter(a => a.status === 'active' || a.effective_status === 'active');
  const topAds = [...ads].sort((a, b) => (b.impressions_count || 0) - (a.impressions_count || 0)).slice(0, 6);

  const websiteSnippet = `<!-- Place where you want the ad to appear -->\n<div id="header-ad"></div>\n\n<!-- Add this script tag once before </body> -->\n<script src="${window.location.origin}/ad-loader.js" async></script>`;

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(websiteSnippet);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleQuickPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      alert('Please enter an Ad Name');
      return;
    }
    setIsQuickPublishing(true);
    setQuickSuccessMsg('');
    try {
      const newAd = await api.createAd({
        name: quickName.trim(),
        media_url: quickMediaUrl.trim(),
        destination_url: quickDestUrl.trim(),
        placement_id: quickPlacement,
        ad_type: 'banner',
        media_type: 'image',
        priority: 1,
        status: 'active',
        open_new_tab: 1,
        target_pages: '*'
      });

      // Also trigger instant push
      await api.pushAd({
        ad_id: newAd.id,
        placement_id: quickPlacement,
        priority: 1
      });
      
      if (onAdCreated) onAdCreated(newAd);
      setQuickSuccessMsg(`"${quickName}" is now LIVE on [${quickPlacement}]!`);
      setQuickName('');
      setTimeout(() => setQuickSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Failed to publish ad: ' + err.message);
    } finally {
      setIsQuickPublishing(false);
    }
  };

  const handleToggleStatus = async (ad: Ad) => {
    setTogglingAdId(ad.id);
    try {
      const nextStatus = ad.status === 'active' ? 'inactive' : 'active';
      const updated = await api.updateAd({
        id: ad.id,
        status: nextStatus
      });
      if (onAdUpdated) onAdUpdated(updated);
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setTogglingAdId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. SIMPLE 30-SECOND QUICK AD LAUNCHER */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-white/15">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>Simple 30-Second Ad Launcher</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">Create & Run an Ad in 1 Click</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Fill in the 3 simple fields below and click Publish. Your ad will immediately go live on your website!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateAd}
              className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-semibold transition-all border border-white/20"
            >
              + Advanced Modal
            </button>
            <button
              onClick={onOpenSimulator}
              className="px-3.5 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Test on Website</span>
            </button>
          </div>
        </div>

        {quickSuccessMsg && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
            <span>{quickSuccessMsg}</span>
          </div>
        )}

        {/* Quick Form */}
        <form onSubmit={handleQuickPublish} className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-slate-900">
          <div className="sm:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-white uppercase tracking-wider">1. Ad Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Summer Sale 20% Off"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border-0 shadow-inner focus:ring-2 focus:ring-amber-400 outline-hidden font-medium"
            />
          </div>

          <div className="sm:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-white uppercase tracking-wider">2. Image URL</label>
            <input
              type="url"
              required
              placeholder="https://.../banner.jpg"
              value={quickMediaUrl}
              onChange={(e) => setQuickMediaUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border-0 shadow-inner focus:ring-2 focus:ring-amber-400 outline-hidden font-medium"
            />
          </div>

          <div className="sm:col-span-3 space-y-1">
            <label className="text-[11px] font-bold text-white uppercase tracking-wider">3. Target Website Link</label>
            <input
              type="url"
              required
              placeholder="https://myshop.com"
              value={quickDestUrl}
              onChange={(e) => setQuickDestUrl(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white rounded-lg border-0 shadow-inner focus:ring-2 focus:ring-amber-400 outline-hidden font-medium"
            />
          </div>

          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isQuickPublishing}
              className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 rounded-lg text-xs font-black shadow-md transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider active:scale-98"
            >
              <Send className={`w-3.5 h-3.5 ${isQuickPublishing ? 'animate-spin' : ''}`} />
              <span>{isQuickPublishing ? 'Publishing...' : '🚀 Push Live'}</span>
            </button>
          </div>
        </form>

        {/* Preset Sample Buttons for instant 1-click testing */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px] text-blue-100">
          <span className="font-semibold text-white">Quick Presets:</span>
          <button
            type="button"
            onClick={() => {
              setQuickName('Flash Sale 50% Off');
              setQuickMediaUrl('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80');
              setQuickDestUrl('https://example.com/flash-sale');
            }}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[11px] text-white transition-colors border border-white/20"
          >
            🛍️ Flash Sale Banner
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickName('AI Pro SaaS Subscription');
              setQuickMediaUrl('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80');
              setQuickDestUrl('https://example.com/ai-app');
            }}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[11px] text-white transition-colors border border-white/20"
          >
            ⚡ Tech & AI App
          </button>
          <button
            type="button"
            onClick={() => {
              setQuickName('Mobile App Download');
              setQuickMediaUrl('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80');
              setQuickDestUrl('https://example.com/get-app');
            }}
            className="px-2 py-0.5 bg-white/10 hover:bg-white/20 rounded text-[11px] text-white transition-colors border border-white/20"
          >
            📱 Mobile App Promo
          </button>
        </div>
      </div>

      {/* 2. SIMPLE 1-LINE WEBSITE EMBED CODE CARD */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">How to Display Ads on Any Website</h3>
              <p className="text-xs text-slate-500">Copy this code and paste it into your website HTML to run ads automatically.</p>
            </div>
          </div>

          <button
            onClick={copyEmbedCode}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
          >
            {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedEmbed ? 'Copied to Clipboard!' : 'Copy Website Code'}</span>
          </button>
        </div>

        <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
          {websiteSnippet}
        </pre>
      </div>

      {/* 3. CORE 4 METRIC KPI SUMMARY CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Impressions */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Views</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Eye className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary?.total_impressions?.toLocaleString() || '0'}</p>
          <div className="text-[11px] text-emerald-600 font-semibold pt-0.5">
            Verified Ad Impressions
          </div>
        </div>

        {/* Total Clicks */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Clicks</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <MousePointerClick className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary?.total_clicks?.toLocaleString() || '0'}</p>
          <div className="text-[11px] text-purple-600 font-semibold pt-0.5">
            Website Traffic Redirects
          </div>
        </div>

        {/* CTR */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Click Rate (CTR)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{summary?.ctr || '0.00'}%</p>
          <div className="text-[11px] text-slate-500 pt-0.5">
            Conversion Efficiency
          </div>
        </div>

        {/* Active Ads */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Live Active Ads</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Megaphone className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{activeAds.length}</p>
          <div className="text-[11px] text-slate-500 pt-0.5">
            Out of {ads.length} total ads
          </div>
        </div>
      </div>

      {/* 4. ACTIVE ADS LIST WITH 1-CLICK INSTANT ON/OFF TOGGLES */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Your Advertisements & Live Status</h3>
            <p className="text-xs text-slate-500">Turn ads ON or OFF with 1 click, or view real-time impression counts.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCreateAd}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Create Ad</span>
            </button>
            <button
              onClick={onViewAds}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200"
            >
              <span>View All ({ads.length})</span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {topAds.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <p className="text-xs text-slate-400 font-medium">No advertisements created yet.</p>
              <button
                onClick={onOpenCreateAd}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Ad</span>
              </button>
            </div>
          ) : (
            topAds.map((ad) => {
              const isActive = ad.status === 'active';
              const isToggling = togglingAdId === ad.id;

              return (
                <div key={ad.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-14 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                      {ad.media_type === 'video' ? (
                        <Play className="w-4 h-4 text-blue-600" />
                      ) : (
                        <img src={ad.media_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{ad.name}</h4>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-700 font-semibold">{ad.placement_id}</span>
                        <span>•</span>
                        <a
                          href={ad.destination_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate max-w-[180px] inline-flex items-center gap-1"
                        >
                          <span>{ad.destination_url}</span>
                          <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-right flex-shrink-0">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{ad.impressions_count || 0}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Views</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-purple-700">{ad.clicks_count || 0}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Clicks</p>
                    </div>

                    {/* 1-Click Instant Status Switch */}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleToggleStatus(ad)}
                        disabled={isToggling}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        <span>{isToggling ? 'Updating...' : isActive ? 'Live Active' : 'Paused'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
