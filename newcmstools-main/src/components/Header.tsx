import React from 'react';
import {
  Radio,
  Plus,
  RefreshCw,
  Eye,
  Menu,
  Sparkles
} from 'lucide-react';
import { NavSection } from './Sidebar';

interface HeaderProps {
  currentSection: NavSection;
  onOpenCreateAd: () => void;
  onOpenPushAd: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenSimulator: () => void;
  onToggleMobileMenu?: () => void;
  isSimpleMode?: boolean;
  onToggleSimpleMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  onOpenCreateAd,
  onOpenPushAd,
  onRefresh,
  isRefreshing = false,
  onOpenSimulator,
  onToggleMobileMenu,
  isSimpleMode = true,
  onToggleSimpleMode,
}) => {
  const titles: Record<NavSection, { title: string; subtitle: string }> = {
    dashboard: { 
      title: isSimpleMode ? 'Quick Push & Live Ads' : 'Executive Overview', 
      subtitle: isSimpleMode ? 'Push ads directly to your website placements in 1 click' : 'Real-time performance, active ads and campaign delivery' 
    },
    ad_push: { title: 'Ad Push Dispatcher', subtitle: 'Push advertisements to website placements instantaneously' },
    ads: { title: 'All Advertisements', subtitle: 'Create ads, toggle status ON/OFF, and track impressions' },
    campaigns: { title: 'Campaign Portfolio', subtitle: 'Organize budgets, flight dates, and advertiser groupings' },
    advertisers: { title: 'Advertiser Directory', subtitle: 'Manage corporate partners, billing contacts, and accounts' },
    placements: { title: 'Ad Placements & Slots', subtitle: 'Configure embed keys, dimensions, and layout positions' },
    simulator: { title: 'Website Code & JSON API', subtitle: 'Copy ready-to-use HTML tags, JavaScript, and JSON endpoints to run ads' },
    analytics: { title: 'Analytics & Tracking', subtitle: 'Detailed impressions, clicks, CTR, and audience metrics' },
    media: { title: 'Cloudflare R2 Media Library', subtitle: 'PC uploaded assets and external media URLs with usage inspector' },
    cloudflare: { title: 'Cloudflare Architecture & Deployment', subtitle: 'D1 database schema, R2 storage bucket, and GitHub Pages setup' },
    settings: { title: 'System Configuration', subtitle: 'Ad rotation rules, default policies, and edge API endpoints' },
  };

  const currentInfo = titles[currentSection] || { title: 'AdPush CMS', subtitle: 'Cloudflare D1 & R2 Advertising Platform' };

  return (
    <header id="admin-top-header" className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-0 z-20 shadow-2xs">
      <div className="flex items-center space-x-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {currentInfo.title}
            {isSimpleMode && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Simple Mode
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">{currentInfo.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center space-x-2 flex-wrap">
        {/* Simple Mode Switch */}
        {onToggleSimpleMode && (
          <button
            onClick={onToggleSimpleMode}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
            title="Toggle between Simple Mode (4 tabs) and Full Tools"
          >
            <span>{isSimpleMode ? '⚡ Simple' : '⚙️ Full Tools'}</span>
          </button>
        )}

        {/* Refresh button */}
        <button
          id="btn-global-refresh"
          onClick={onRefresh}
          title="Refresh real-time data from Cloudflare D1"
          className="px-2.5 sm:px-3 py-1.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 text-xs flex items-center gap-1.5 font-medium shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
          <span className="hidden md:inline">Sync</span>
        </button>

        {/* Website Code quick access */}
        {currentSection !== 'simulator' && (
          <button
            id="btn-quick-simulator"
            onClick={onOpenSimulator}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 flex items-center gap-1.5 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Website Code</span>
          </button>
        )}

        {/* Quick Push Ad button */}
        <button
          id="btn-quick-push-ad"
          onClick={onOpenPushAd}
          className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all flex items-center gap-1.5"
        >
          <Radio className="w-3.5 h-3.5 text-blue-600" />
          <span>Push Live</span>
        </button>

        {/* Create Ad primary button */}
        <button
          id="btn-quick-create-ad"
          onClick={onOpenCreateAd}
          className="px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Create Ad</span>
        </button>
      </div>
    </header>
  );
};

