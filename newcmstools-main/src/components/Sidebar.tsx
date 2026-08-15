import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  Megaphone,
  Radio,
  Grid,
  Globe,
  BarChart3,
  Image as ImageIcon,
  Cloud,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export type NavSection =
  | 'dashboard'
  | 'advertisers'
  | 'campaigns'
  | 'ads'
  | 'ad_push'
  | 'placements'
  | 'simulator'
  | 'analytics'
  | 'media'
  | 'cloudflare'
  | 'settings';

interface SidebarProps {
  currentSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  activeAdsCount: number;
  isOpen?: boolean;
  onClose?: () => void;
  isSimpleMode?: boolean;
  onToggleSimpleMode?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  activeAdsCount,
  isOpen = false,
  onClose,
  isSimpleMode = true,
  onToggleSimpleMode,
}) => {
  // Simple Mode items: 4 essential tabs
  const simpleNavItems = [
    { id: 'dashboard' as NavSection, label: 'Quick Push & Live', icon: Radio, highlight: true },
    { id: 'ads' as NavSection, label: 'All Advertisements', icon: Megaphone, badge: activeAdsCount > 0 ? `${activeAdsCount} live` : undefined },
    { id: 'simulator' as NavSection, label: 'Website Code & JSON', icon: Globe, tag: 'Code' },
    { id: 'analytics' as NavSection, label: 'Analytics & CTR', icon: BarChart3 },
  ];

  // Full / Advanced Mode items
  const advancedNavItems = [
    { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ad_push' as NavSection, label: 'Ad Push Dispatch', icon: Radio, highlight: true },
    { id: 'ads' as NavSection, label: 'Advertisements', icon: Megaphone, badge: activeAdsCount > 0 ? `${activeAdsCount} live` : undefined },
    { id: 'campaigns' as NavSection, label: 'Campaigns', icon: Layers },
    { id: 'advertisers' as NavSection, label: 'Advertisers', icon: Users },
    { id: 'placements' as NavSection, label: 'Placements & Slots', icon: Grid },
    { id: 'simulator' as NavSection, label: 'Live Embed & JSON', icon: Globe, tag: 'Live' },
    { id: 'analytics' as NavSection, label: 'Analytics & CTR', icon: BarChart3 },
    { id: 'media' as NavSection, label: 'Media Library (R2)', icon: ImageIcon },
    { id: 'cloudflare' as NavSection, label: 'Cloudflare Deploy', icon: Cloud },
    { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
  ];

  const navItems = isSimpleMode ? simpleNavItems : advancedNavItems;

  const handleItemClick = (id: NavSection) => {
    onSelectSection(id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        id="admin-sidebar"
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white text-slate-700 flex flex-col flex-shrink-0 border-r border-slate-200 min-h-screen transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-slate-900 font-bold text-sm tracking-tight flex items-center gap-1.5">
                AdPush <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">D1/R2</span>
              </h1>
              <p className="text-xs text-slate-500">Cloudflare Pages CMS</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-700 rounded-lg"
            >
              ✕
            </button>
          )}
        </div>

        {/* Edge Server Status Indicator */}
        <div className="mx-3 my-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-700 font-medium">Edge API Active</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-mono font-medium">D1 SQLite</span>
        </div>

        {/* Simple vs Advanced Mode Switcher */}
        <div className="px-3 pt-2 pb-1">
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
            <button
              onClick={() => onToggleSimpleMode && onToggleSimpleMode()}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                isSimpleMode
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ⚡ Simple
            </button>
            <button
              onClick={() => onToggleSimpleMode && onToggleSimpleMode()}
              className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
                !isSimpleMode
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ⚙️ Full Tools
            </button>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{isSimpleMode ? 'Quick Menu' : 'All Management'}</span>
            {isSimpleMode && (
              <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.2 rounded">
                4 Simple Tabs
              </span>
            )}
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;

            return (
              <button
                key={item.id}
                id={`nav-btn-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200 shadow-2xs'
                    : item.highlight
                    ? 'text-blue-600 bg-blue-50/50 hover:bg-blue-50 hover:text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : item.highlight ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.tag && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.tag}
                    </span>
                  )}
                  {item.badge && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Cloudflare Pages info footer */}
        <div className="p-3 border-t border-slate-200 m-2 rounded-xl bg-slate-50 border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-600" /> Storage Engine
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">Cloudflare R2</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ads served globally via Cloudflare Edge with low-latency delivery.
          </p>
        </div>
      </aside>
    </>
  );
};

