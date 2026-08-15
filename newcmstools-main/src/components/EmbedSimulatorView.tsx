import React, { useState, useEffect, useRef } from 'react';
import {
  Globe,
  RefreshCw,
  Sparkles,
  MousePointerClick,
  Eye,
  CheckCircle2,
  ExternalLink,
  Smartphone,
  Tablet,
  Monitor,
  Play,
  RotateCcw,
  Code2,
  Copy,
  Radio,
  Sliders,
  Check,
  Zap,
  Maximize2,
  Terminal,
  FileJson,
  Send,
  Layers
} from 'lucide-react';
import { Ad, Placement } from '../types';
import { api } from '../lib/api';

interface EmbedSimulatorViewProps {
  placements: Placement[];
  onImpressionTracked?: () => void;
  ads?: Ad[];
  onAdPushed?: (ad: Ad) => void;
}

export const EmbedSimulatorView: React.FC<EmbedSimulatorViewProps> = ({
  placements,
  onImpressionTracked,
  ads = [],
  onAdPushed,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [simulatedPage, setSimulatedPage] = useState('/news');
  const [liveAds, setLiveAds] = useState<Record<string, any>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [stats, setStats] = useState({ impressionsTriggered: 0, clicksTriggered: 0, lastAction: 'Ready' });
  const [mode, setMode] = useState<'interactive' | 'live_iframe' | 'embed_code' | 'json_api'>('interactive');
  const [iframeKey, setIframeKey] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [quickPushSlot, setQuickPushSlot] = useState<string | null>(null);
  const [quickPushing, setQuickPushing] = useState(false);

  // JSON API Sandbox State
  const [jsonPlacement, setJsonPlacement] = useState(placements[0]?.placement_key || 'header-ad');
  const [jsonPageUrl, setJsonPageUrl] = useState('/news');
  const [jsonResponseText, setJsonResponseText] = useState<string>('');
  const [isQueryingJson, setIsQueryingJson] = useState(false);
  const [jsonCodeTab, setJsonCodeTab] = useState<'js_fetch' | 'react' | 'wrangler_json' | 'api_schema'>('js_fetch');

  const handleExecuteJsonQuery = async (placementKey = jsonPlacement, page = jsonPageUrl) => {
    setIsQueryingJson(true);
    try {
      const targetUrl = `/api/ads/active?placement=${encodeURIComponent(placementKey)}&page=${encodeURIComponent(page)}`;
      const res = await fetch(targetUrl);
      const data = await res.json();
      setJsonResponseText(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setJsonResponseText(JSON.stringify({ error: 'Failed to fetch ad JSON', details: err.message }, null, 2));
    } finally {
      setIsQueryingJson(false);
    }
  };

  const fetchAdForPlacement = async (placementKey: string) => {
    setLoadingMap((prev) => ({ ...prev, [placementKey]: true }));
    try {
      const res = await fetch(`/api/ads/active?placement=${encodeURIComponent(placementKey)}&page=${encodeURIComponent(simulatedPage)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.ad) {
          setLiveAds((prev) => ({ ...prev, [placementKey]: data.ad }));
          recordSimulatorImpression(data.ad, placementKey);
        } else {
          setLiveAds((prev) => ({ ...prev, [placementKey]: null }));
        }
      }
    } catch (e) {
      console.warn('Failed to load ad for placement', placementKey, e);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [placementKey]: false }));
    }
  };

  const recordSimulatorImpression = async (ad: any, placementKey: string) => {
    try {
      await fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: ad.id,
          campaign_id: ad.campaign_id,
          placement_id: placementKey,
          page_url: `https://mywebsite.com${simulatedPage}`,
          referrer: 'https://google.com',
          device_type: deviceMode
        })
      });
      setStats((prev) => ({
        ...prev,
        impressionsTriggered: prev.impressionsTriggered + 1,
        lastAction: `Impression recorded for [${placementKey}]`
      }));
      if (onImpressionTracked) onImpressionTracked();
    } catch (e) {}
  };

  const handleSimulatedClick = async (ad: any, placementKey: string, e?: React.MouseEvent) => {
    if (!ad) return;
    setStats((prev) => ({
      ...prev,
      clicksTriggered: prev.clicksTriggered + 1,
      lastAction: `Click recorded on "${ad.name}"`
    }));

    // Trigger backend click beacon
    const clickBeaconUrl = `/api/ads/click?ad_id=${encodeURIComponent(ad.id)}&placement=${encodeURIComponent(placementKey)}&dest=${encodeURIComponent(ad.destination_url)}`;
    
    // Open in new tab
    if (ad.destination_url) {
      window.open(clickBeaconUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const reloadAllPlacements = () => {
    placements.forEach((plc) => fetchAdForPlacement(plc.placement_key));
    setIframeKey((k) => k + 1);
    setStats((prev) => ({ ...prev, lastAction: 'Reloaded all slots via API' }));
  };

  const handleQuickPush = async (adId: string, placementKey: string) => {
    setQuickPushing(true);
    try {
      const res = await api.pushAd({
        ad_id: adId,
        placement_id: placementKey,
        priority: 1,
        status: 'active',
        target_pages: '*'
      });
      if (res.ad) {
        if (onAdPushed) onAdPushed(res.ad);
        setLiveAds((prev) => ({ ...prev, [placementKey]: res.ad }));
        setStats((prev) => ({
          ...prev,
          lastAction: `Pushed "${res.ad.name}" -> [${placementKey}]`
        }));
      }
      setQuickPushSlot(null);
      setIframeKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to push ad');
    } finally {
      setQuickPushing(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    reloadAllPlacements();
  }, [simulatedPage, deviceMode]);

  return (
    <div className="space-y-6">
      {/* Control Station Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-600" />
              Live Ad Delivery Sandbox & Interactive Tester
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Delivery Engine Active
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Real-time test environment executing <code className="font-mono text-blue-600 font-semibold">/ad-loader.js</code> and Edge D1 routing.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('interactive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'interactive' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Interactive Bench</span>
            </button>
            <button
              onClick={() => setMode('live_iframe')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'live_iframe' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Real Script Iframe</span>
            </button>
            <button
              onClick={() => setMode('embed_code')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'embed_code' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Embed Code</span>
            </button>
            <button
              onClick={() => {
                setMode('json_api');
                if (!jsonResponseText) {
                  handleExecuteJsonQuery();
                }
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'json_api' ? 'bg-white shadow-2xs text-blue-600 ring-1 ring-blue-500/20' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileJson className="w-3.5 h-3.5 text-amber-500" />
              <span>JSON API Code</span>
            </button>
          </div>

          {/* Standalone Window Test */}
          <a
            href="/embed-test.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Open Standalone Tab</span>
          </a>

          <button
            onClick={reloadAllPlacements}
            className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Ads</span>
          </button>
        </div>
      </div>

      {/* Telemetry Status Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center space-x-2">
          <Eye className="w-4 h-4 text-blue-400" />
          <span>Active Impressions: <strong className="text-white font-mono">{stats.impressionsTriggered}</strong></span>
        </div>
        <div className="flex items-center space-x-2">
          <MousePointerClick className="w-4 h-4 text-emerald-400" />
          <span>Tracked Clicks: <strong className="text-white font-mono">{stats.clicksTriggered}</strong></span>
        </div>
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Priority Algorithm: <strong className="text-white">Active</strong></span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
          <span className="truncate">Status: <strong className="text-white font-mono">{stats.lastAction}</strong></span>
        </div>
      </div>

      {/* MODE 1: INTERACTIVE PUBLISHING BENCH */}
      {mode === 'interactive' && (
        <div className="space-y-4">
          {/* Controls toolbar */}
          <div className="flex items-center justify-between flex-wrap gap-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Simulate Path:</span>
              <select
                value={simulatedPage}
                onChange={(e) => setSimulatedPage(e.target.value)}
                className="text-xs font-medium px-2.5 py-1 border border-slate-200 rounded-lg bg-white text-slate-700 outline-hidden"
              >
                <option value="/">Home Page (/)</option>
                <option value="/news">Tech News (/news)</option>
                <option value="/sports">Sports Section (/sports)</option>
                <option value="/blog/ai-future">Article: AI Future (/blog/ai-future)</option>
              </select>
            </div>

            {/* Viewport size switcher */}
            <div className="flex bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  deviceMode === 'desktop' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                onClick={() => setDeviceMode('tablet')}
                className={`p-1.5 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  deviceMode === 'tablet' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tablet</span>
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 px-2.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                  deviceMode === 'mobile' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile (360px)</span>
              </button>
            </div>
          </div>

          {/* Browser frame */}
          <div className="bg-slate-200 p-3 sm:p-6 rounded-2xl border border-slate-300 flex justify-center overflow-x-auto transition-all">
            <div
              className={`bg-white rounded-xl shadow-xl border border-slate-300 overflow-hidden transition-all duration-300 ${
                deviceMode === 'mobile'
                  ? 'w-[360px] max-w-full'
                  : deviceMode === 'tablet'
                  ? 'w-[768px] max-w-full'
                  : 'w-full max-w-[1040px]'
              }`}
            >
              {/* Address bar */}
              <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                    https://mywebsite.com{simulatedPage}
                  </span>
                </div>
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <span>Interactive Ad Sandbox</span>
                </span>
              </div>

              {/* Top Sticky Announcement Banner */}
              {liveAds['top-banner'] && (
                <div
                  onClick={() => handleSimulatedClick(liveAds['top-banner'], 'top-banner')}
                  className="bg-blue-900 text-white p-2 text-center text-xs border-b border-blue-950 cursor-pointer hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">FEATURED</span>
                  <span>{liveAds['top-banner'].headline || liveAds['top-banner'].name}</span>
                  <span className="text-blue-300">Click to Test →</span>
                </div>
              )}

              {/* Publisher header */}
              <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                    TC
                  </div>
                  <span className="font-bold text-slate-900 text-sm">TechChronicle Daily</span>
                </div>
                <div className="flex space-x-3 text-xs text-slate-500 font-medium">
                  <span className="text-blue-600 font-bold">News</span>
                  <span>Technology</span>
                  <span>Cloud Edge</span>
                </div>
              </div>

              {/* Page body */}
              <div className="p-5 space-y-6">
                {/* 1. Header Placement */}
                <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300 relative group">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
                    <span className="font-bold text-slate-700">#header-ad (728×90 Leaderboard)</span>
                    <button
                      onClick={() => setQuickPushSlot('header-ad')}
                      className="px-2 py-0.5 rounded bg-white text-blue-600 border border-slate-200 text-[10px] font-bold hover:bg-blue-50 flex items-center gap-1 shadow-2xs"
                    >
                      <Radio className="w-3 h-3" />
                      <span>Quick Push Ad</span>
                    </button>
                  </div>

                  {liveAds['header-ad'] ? (
                    <div
                      onClick={() => handleSimulatedClick(liveAds['header-ad'], 'header-ad')}
                      className="cursor-pointer rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition-all relative"
                    >
                      <img
                        src={liveAds['header-ad'].media_url}
                        alt=""
                        className="w-full max-h-[110px] object-cover block"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                        <span>Click to Test Destination</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-slate-400">
                      No active ad scheduled for <code>#header-ad</code>. Click "Quick Push Ad" above to dispatch.
                    </div>
                  )}
                </div>

                {/* Article & Sidebar Columns */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Article content */}
                  <div className="md:col-span-8 space-y-4">
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      Decentralized Edge Advertising Architectures: The 2026 Shift
                    </h1>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Publishers and media brands are deploying zero-latency edge delivery networks that render personalized creatives within 15 milliseconds without database bottlenecks.
                    </p>

                    {/* 2. In-Article Ad Slot */}
                    <div className="my-4 bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
                        <span className="font-bold text-slate-700">#article-ad (In-Content Story Ad)</span>
                        <button
                          onClick={() => setQuickPushSlot('article-ad')}
                          className="px-2 py-0.5 rounded bg-white text-blue-600 border border-slate-200 text-[10px] font-bold hover:bg-blue-50 flex items-center gap-1 shadow-2xs"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Quick Push Ad</span>
                        </button>
                      </div>

                      {liveAds['article-ad'] ? (
                        <div
                          onClick={() => handleSimulatedClick(liveAds['article-ad'], 'article-ad')}
                          className="cursor-pointer p-3.5 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-blue-400 hover:ring-2 hover:ring-blue-500/20 transition-all flex flex-col sm:flex-row gap-3 items-center"
                        >
                          <img
                            src={liveAds['article-ad'].media_url}
                            alt=""
                            className="w-full sm:w-28 h-20 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 space-y-1">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Sponsored</span>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {liveAds['article-ad'].headline || liveAds['article-ad'].name}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {liveAds['article-ad'].description || 'Learn how to optimize performance with verified solutions.'}
                            </p>
                            <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                              <span>{liveAds['article-ad'].call_to_action || 'Learn More'}</span>
                              <span>→</span>
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-4 text-center text-xs text-slate-400">
                          No active ad scheduled for <code>#article-ad</code>.
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      By leveraging Cloudflare D1 with edge caching and asynchronous impression beacons, ad delivery executes seamlessly without slowing down core web vitals.
                    </p>

                    {/* 3. In-Stream Video Ad Slot */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
                        <span className="font-bold text-slate-700">#video-ad (Pre-Roll / In-Stream Unit)</span>
                        <button
                          onClick={() => setQuickPushSlot('video-ad')}
                          className="px-2 py-0.5 rounded bg-white text-blue-600 border border-slate-200 text-[10px] font-bold hover:bg-blue-50 flex items-center gap-1 shadow-2xs"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Quick Push Ad</span>
                        </button>
                      </div>

                      {liveAds['video-ad'] ? (
                        <div className="rounded-lg overflow-hidden bg-black relative shadow-xs">
                          <video
                            src={liveAds['video-ad'].media_url}
                            autoPlay={liveAds['video-ad'].video_autoplay !== 0}
                            muted={liveAds['video-ad'].video_muted !== 0}
                            loop={liveAds['video-ad'].video_loop !== 0}
                            controls={liveAds['video-ad'].video_controls === 1}
                            playsInline
                            className="w-full aspect-video object-cover block"
                          />
                          <button
                            onClick={() => handleSimulatedClick(liveAds['video-ad'], 'video-ad')}
                            className="absolute bottom-3 right-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1"
                          >
                            <span>{liveAds['video-ad'].call_to_action || 'Visit Sponsor'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-6 text-center text-xs text-slate-400">
                          No active ad scheduled for <code>#video-ad</code>.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sidebar 300x250 */}
                  <div className="md:col-span-4 space-y-4">
                    <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
                        <span className="font-bold text-slate-700">#sidebar-ad (300×250)</span>
                        <button
                          onClick={() => setQuickPushSlot('sidebar-ad')}
                          className="px-2 py-0.5 rounded bg-white text-blue-600 border border-slate-200 text-[10px] font-bold hover:bg-blue-50 flex items-center gap-1 shadow-2xs"
                        >
                          <Radio className="w-3 h-3" />
                          <span>Push</span>
                        </button>
                      </div>

                      {liveAds['sidebar-ad'] ? (
                        <div
                          onClick={() => handleSimulatedClick(liveAds['sidebar-ad'], 'sidebar-ad')}
                          className="cursor-pointer bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                          <img
                            src={liveAds['sidebar-ad'].media_url}
                            alt=""
                            className="w-full h-[175px] object-cover"
                          />
                          <div className="p-3">
                            <span className="text-[10px] font-bold text-blue-600 uppercase">Promoted</span>
                            <h4 className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                              {liveAds['sidebar-ad'].headline || liveAds['sidebar-ad'].name}
                            </h4>
                            <span className="text-xs font-semibold text-blue-600 mt-1 inline-block">
                              {liveAds['sidebar-ad'].call_to_action || 'Explore Now'} →
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No ad on <code>#sidebar-ad</code>.
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-xs">
                      <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Related Articles</h4>
                      <p className="text-slate-600 font-medium">1. Real-time Ad Exchange Latency Analysis</p>
                      <p className="text-slate-600 font-medium">2. R2 Object Storage for Global Video Ads</p>
                    </div>
                  </div>
                </div>

                {/* 4. Footer Placement */}
                <div className="bg-slate-50 rounded-xl p-3 border border-dashed border-slate-300">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 font-mono">
                    <span className="font-bold text-slate-700">#footer-ad (Footer Exit Unit)</span>
                    <button
                      onClick={() => setQuickPushSlot('footer-ad')}
                      className="px-2 py-0.5 rounded bg-white text-blue-600 border border-slate-200 text-[10px] font-bold hover:bg-blue-50 flex items-center gap-1 shadow-2xs"
                    >
                      <Radio className="w-3 h-3" />
                      <span>Quick Push Ad</span>
                    </button>
                  </div>

                  {liveAds['footer-ad'] ? (
                    <div
                      onClick={() => handleSimulatedClick(liveAds['footer-ad'], 'footer-ad')}
                      className="cursor-pointer rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:ring-2 hover:ring-blue-500 transition-all"
                    >
                      <img
                        src={liveAds['footer-ad'].media_url}
                        alt=""
                        className="w-full max-h-[80px] object-cover"
                      />
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No active ad pushed to <code>#footer-ad</code>.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: REAL JAVASCRIPT IFRAME RUNNER */}
      {mode === 'live_iframe' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex items-center justify-between text-xs">
            <div className="space-y-0.5">
              <h3 className="font-bold text-slate-900">Live Client Iframe Environment</h3>
              <p className="text-slate-500">
                This iframe loads a pure HTML document with <code>&lt;script src="/ad-loader.js" async&gt;&lt;/script&gt;</code> to prove full browser runtime functionality.
              </p>
            </div>
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reload Iframe</span>
            </button>
          </div>

          <div className="bg-slate-200 p-4 rounded-2xl border border-slate-300">
            <iframe
              key={iframeKey}
              src="/embed-test.html"
              title="AdPush Live Runtime Sandbox"
              className="w-full h-[650px] bg-white rounded-xl border border-slate-300 shadow-inner"
            />
          </div>
        </div>
      )}

      {/* MODE 3: READY-TO-PASTE EMBED CODE */}
      {mode === 'embed_code' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              Website Integration Snippets
            </h3>
            <p className="text-xs text-slate-500">
              Copy and paste these snippets directly into your website's HTML. The <code className="text-blue-600 font-bold">ad-loader.js</code> script dynamically injects the appropriate ad according to priority, schedule, and page targeting.
            </p>

            <div className="space-y-4 pt-2">
              {/* Universal Script Tag */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">1. Universal Ad Loader Script (Place before &lt;/body&gt;)</span>
                  <button
                    onClick={() => copyToClipboard('<script src="https://YOUR-DOMAIN.com/ad-loader.js" async></script>', 'script-tag')}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-200 flex items-center gap-1"
                  >
                    {copiedKey === 'script-tag' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'script-tag' ? 'Copied' : 'Copy Script Tag'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto">
                  {`<script src="https://YOUR-DOMAIN.com/ad-loader.js" async></script>`}
                </pre>
              </div>

              {/* Placement Slots List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {placements.map((plc) => (
                  <div key={plc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{plc.name}</h4>
                        <p className="text-[10px] font-mono text-slate-500">#{plc.placement_key} ({plc.recommended_width}×{plc.recommended_height})</p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(`<div id="${plc.placement_key}"></div>`, plc.id)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-200 flex items-center gap-1"
                      >
                        {copiedKey === plc.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === plc.id ? 'Copied' : 'Copy Slot'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 bg-slate-900 text-blue-300 rounded-lg text-xs font-mono overflow-x-auto">
                      {`<div id="${plc.placement_key}"></div>`}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE 4: JSON REST API & WEBSITE INTEGRATION CODE */}
      {mode === 'json_api' && (
        <div className="space-y-6">
          {/* Live Interactive JSON Query Terminal */}
          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-white shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <FileJson className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Live Ad JSON API Tester & Endpoint Inspector</h3>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                    REST JSON
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Query the edge ad delivery engine directly via JSON. Any external website or app can fetch this JSON to run and render ads.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExecuteJsonQuery(jsonPlacement, jsonPageUrl)}
                  disabled={isQueryingJson}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className={`w-3.5 h-3.5 ${isQueryingJson ? 'animate-spin' : ''}`} />
                  <span>{isQueryingJson ? 'Querying API...' : 'Run JSON Query'}</span>
                </button>
              </div>
            </div>

            {/* Query Parameters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div className="sm:col-span-2 flex items-center">
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded font-bold text-xs">
                  GET
                </span>
              </div>
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-sans font-semibold">Placement Slot</label>
                <select
                  value={jsonPlacement}
                  onChange={(e) => {
                    setJsonPlacement(e.target.value);
                    handleExecuteJsonQuery(e.target.value, jsonPageUrl);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                >
                  {placements.map((plc) => (
                    <option key={plc.id} value={plc.placement_key}>
                      {plc.placement_key} ({plc.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-5 space-y-1">
                <label className="text-[10px] uppercase text-slate-400 font-sans font-semibold">Target Page URL</label>
                <input
                  type="text"
                  value={jsonPageUrl}
                  onChange={(e) => setJsonPageUrl(e.target.value)}
                  placeholder="/news"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Live Returned JSON Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span>
                    Endpoint:{' '}
                    <strong className="text-slate-200">
                      /api/ads/active?placement={jsonPlacement}&page={encodeURIComponent(jsonPageUrl)}
                    </strong>
                  </span>
                </span>
                <button
                  onClick={() => copyToClipboard(jsonResponseText, 'json-response')}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded flex items-center gap-1 border border-slate-700 transition-colors"
                >
                  {copiedKey === 'json-response' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'json-response' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <pre className="p-3.5 bg-slate-950 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto max-h-72 border border-slate-800/80 leading-relaxed">
                {jsonResponseText || '// Click "Run JSON Query" to inspect the live response...'}
              </pre>
            </div>
          </div>

          {/* Website Deployment JSON Code Snippets */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-blue-600" />
                  JSON Code To Deploy & Run Ads on Your Website
                </h3>
                <p className="text-xs text-slate-500">
                  Select your platform or framework below to copy the ready-to-run JSON integration code.
                </p>
              </div>

              {/* Sub tabs */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setJsonCodeTab('js_fetch')}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    jsonCodeTab === 'js_fetch' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  JavaScript / HTML
                </button>
                <button
                  onClick={() => setJsonCodeTab('react')}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    jsonCodeTab === 'react' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  React / Next.js
                </button>
                <button
                  onClick={() => setJsonCodeTab('wrangler_json')}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    jsonCodeTab === 'wrangler_json' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  wrangler.json (Deploy)
                </button>
                <button
                  onClick={() => setJsonCodeTab('api_schema')}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    jsonCodeTab === 'api_schema' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  REST API Endpoints
                </button>
              </div>
            </div>

            {/* TAB 1: Vanilla JS / HTML JSON Fetch */}
            {jsonCodeTab === 'js_fetch' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold">
                    Universal Client-Side JavaScript (Fetch JSON & Inject Ad)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `<!-- 1. Ad Container on your website -->\n<div id="header-ad"></div>\n\n<!-- 2. JSON Fetch and Render Script -->\n<script>\nasync function runAd(placementId) {\n  try {\n    const res = await fetch(\`https://YOUR_DOMAIN/api/ads/active?placement=\${placementId}&page=\${encodeURIComponent(window.location.pathname)}\`);\n    const data = await res.json();\n    if (data && data.ad) {\n      const ad = data.ad;\n      const container = document.getElementById(placementId);\n      if (!container) return;\n      \n      const link = document.createElement('a');\n      link.href = ad.destination_url || '#';\n      link.target = '_blank';\n      link.rel = 'noopener noreferrer';\n      \n      if (ad.ad_type === 'video' || ad.media_url.endsWith('.mp4')) {\n        link.innerHTML = \`<video src="\${ad.media_url}" autoplay muted loop playsinline style="max-width:100%; border-radius:8px; display:block;"></video>\`;\n      } else {\n        link.innerHTML = \`<img src="\${ad.media_url}" alt="\${ad.name}" style="max-width:100%; height:auto; border-radius:8px; display:block;" />\`;\n      }\n      \n      container.innerHTML = '';\n      container.appendChild(link);\n      \n      // Log Impression JSON beacon\n      fetch('https://YOUR_DOMAIN/api/ads/impression', {\n        method: 'POST',\n        headers: { 'Content-Type': 'application/json' },\n        body: JSON.stringify({\n          ad_id: ad.id,\n          placement_id: placementId,\n          page_url: window.location.href,\n          device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'\n        })\n      }).catch(() => {});\n    }\n  } catch (err) {\n    console.error('Failed to run ad from JSON API', err);\n  }\n}\n\ndocument.addEventListener('DOMContentLoaded', () => {\n  runAd('header-ad');\n});\n</script>`,
                        'vanilla-js-json'
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === 'vanilla-js-json' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'vanilla-js-json' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{`<!-- 1. Ad Container on your website -->
<div id="header-ad"></div>

<!-- 2. JSON Fetch and Render Script -->
<script>
async function runAd(placementId) {
  try {
    const res = await fetch(\`https://YOUR_DOMAIN/api/ads/active?placement=\${placementId}&page=\${encodeURIComponent(window.location.pathname)}\`);
    const data = await res.json();
    if (data && data.ad) {
      const ad = data.ad;
      const container = document.getElementById(placementId);
      if (!container) return;
      
      const link = document.createElement('a');
      link.href = ad.destination_url || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      if (ad.ad_type === 'video' || ad.media_url.endsWith('.mp4')) {
        link.innerHTML = \`<video src="\${ad.media_url}" autoplay muted loop playsinline style="max-width:100%; border-radius:8px; display:block;"></video>\`;
      } else {
        link.innerHTML = \`<img src="\${ad.media_url}" alt="\${ad.name}" style="max-width:100%; height:auto; border-radius:8px; display:block;" />\`;
      }
      
      container.innerHTML = '';
      container.appendChild(link);
      
      // Log Impression JSON beacon
      fetch('https://YOUR_DOMAIN/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: ad.id,
          placement_id: placementId,
          page_url: window.location.href,
          device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'
        })
      }).catch(() => {});
    }
  } catch (err) {
    console.error('Failed to run ad from JSON API', err);\n  }
}

document.addEventListener('DOMContentLoaded', () => {
  runAd('header-ad');
});
</script>`}
                </pre>
              </div>
            )}

            {/* TAB 2: React / Next.js Component */}
            {jsonCodeTab === 'react' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold">
                    React / Next.js Ad Banner Component (TypeScript JSX)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `import React, { useEffect, useState } from 'react';\n\ninterface AdBannerProps {\n  placementId: string;\n  apiHost?: string;\n}\n\nexport const AdBanner: React.FC<AdBannerProps> = ({ placementId, apiHost = 'https://YOUR_DOMAIN' }) => {\n  const [ad, setAd] = useState<any>(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    const fetchAd = async () => {\n      try {\n        const path = typeof window !== 'undefined' ? window.location.pathname : '/';\n        const res = await fetch(\`\${apiHost}/api/ads/active?placement=\${placementId}&page=\${encodeURIComponent(path)}\`);\n        const data = await res.json();\n        if (data && data.ad) {\n          setAd(data.ad);\n          // Track impression\n          fetch(\`\${apiHost}/api/ads/impression\`, {\n            method: 'POST',\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({\n              ad_id: data.ad.id,\n              placement_id: placementId,\n              page_url: window.location.href,\n              device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'\n            })\n          }).catch(() => {});\n        }\n      } catch (e) {\n        console.error('Ad load error', e);\n      } finally {\n        setLoading(false);\n      }\n    };\n\n    fetchAd();\n  }, [placementId, apiHost]);\n\n  if (loading || !ad) return null;\n\n  return (\n    <div className="ad-container my-4 rounded-lg overflow-hidden border border-slate-200">\n      <a href={ad.destination_url} target="_blank" rel="noopener noreferrer" className="block group">\n        {ad.ad_type === 'video' ? (\n          <video src={ad.media_url} autoPlay muted loop playsInline className="w-full h-auto" />\n        ) : (\n          <img src={ad.media_url} alt={ad.name} className="w-full h-auto object-cover" />\n        )}\n      </a>\n    </div>\n  );\n};`,
                        'react-json-code'
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === 'react-json-code' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'react-json-code' ? 'Copied' : 'Copy React Component'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-900 text-blue-300 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{`import React, { useEffect, useState } from 'react';

interface AdBannerProps {
  placementId: string;
  apiHost?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placementId, apiHost = 'https://YOUR_DOMAIN' }) => {
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const path = typeof window !== 'undefined' ? window.location.pathname : '/';
        const res = await fetch(\`\${apiHost}/api/ads/active?placement=\${placementId}&page=\${encodeURIComponent(path)}\`);
        const data = await res.json();
        if (data && data.ad) {
          setAd(data.ad);
          // Track impression
          fetch(\`\${apiHost}/api/ads/impression\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ad_id: data.ad.id,
              placement_id: placementId,
              page_url: window.location.href,
              device_type: window.innerWidth < 768 ? 'mobile' : 'desktop'
            })
          }).catch(() => {});
        }
      } catch (e) {
        console.error('Ad load error', e);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [placementId, apiHost]);

  if (loading || !ad) return null;

  return (
    <div className="ad-container my-4 rounded-lg overflow-hidden border border-slate-200">
      <a href={ad.destination_url} target="_blank" rel="noopener noreferrer" className="block group">
        {ad.ad_type === 'video' ? (
          <video src={ad.media_url} autoPlay muted loop playsInline className="w-full h-auto" />
        ) : (
          <img src={ad.media_url} alt={ad.name} className="w-full h-auto object-cover" />
        )}
      </a>
    </div>
  );
};`}
                </pre>
              </div>
            )}

            {/* TAB 3: Cloudflare Deploy wrangler.json */}
            {jsonCodeTab === 'wrangler_json' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-semibold">
                    Cloudflare Deployment JSON Configuration (<code className="text-blue-600 font-mono font-bold">wrangler.json</code>)
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `{\n  "$schema": "node_modules/wrangler/config-schema.json",\n  "name": "adpush-cloudflare-cms",\n  "pages_build_output_dir": "dist",\n  "compatibility_date": "2024-09-23",\n  "compatibility_flags": [\n    "nodejs_compat"\n  ],\n  "d1_databases": [\n    {\n      "binding": "DB",\n      "database_name": "advertising-db",\n      "database_id": "YOUR_D1_DATABASE_ID"\n    }\n  ],\n  "r2_buckets": [\n    {\n      "binding": "MEDIA_BUCKET",\n      "bucket_name": "adpush-media-bucket"\n    }\n  ],\n  "vars": {\n    "ENVIRONMENT": "production",\n    "DEFAULT_TIMEZONE": "UTC",\n    "ALLOW_ANONYMOUS_IMPRESSIONS": "true",\n    "ADMIN_SESSION_SECRET": "super-secure-random-key-change-me",\n    "ADMIN_PASSWORD_HASH": "CHANGE_IN_CLOUDFLARE_PAGES_VARIABLES",\n    "R2_PUBLIC_DOMAIN": "https://media.yourdomain.com"\n  }\n}`,
                        'wrangler-json-code'
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    {copiedKey === 'wrangler-json-code' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'wrangler-json-code' ? 'Copied' : 'Copy wrangler.json'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  This file is located at <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">/wrangler.json</code> in your project root for deploying to Cloudflare Pages & D1:
                </p>

                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
{`{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "adpush-cloudflare-cms",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "advertising-db",
      "database_id": "YOUR_D1_DATABASE_ID"
    }
  ],
  "r2_buckets": [
    {
      "binding": "MEDIA_BUCKET",
      "bucket_name": "adpush-media-bucket"
    }
  ],
  "vars": {
    "ENVIRONMENT": "production",
    "DEFAULT_TIMEZONE": "UTC",
    "ALLOW_ANONYMOUS_IMPRESSIONS": "true",
    "ADMIN_SESSION_SECRET": "super-secure-random-key-change-me",
    "ADMIN_PASSWORD_HASH": "CHANGE_IN_CLOUDFLARE_PAGES_VARIABLES",
    "R2_PUBLIC_DOMAIN": "https://media.yourdomain.com"
  }
}`}
                </pre>
              </div>
            )}

            {/* TAB 4: REST API Endpoints */}
            {jsonCodeTab === 'api_schema' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        GET
                      </span>
                      <strong className="text-slate-800 font-mono">/api/ads/active</strong>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Returns top priority active ad for a slot: <br />
                      <code>?placement=header-ad&page=/news</code>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        POST
                      </span>
                      <strong className="text-slate-800 font-mono">/api/ads/impression</strong>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Records view impression. Payload: <br />
                      <code>{`{ ad_id, placement_id, page_url, device_type }`}</code>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        GET
                      </span>
                      <strong className="text-slate-800 font-mono">/api/ads/click</strong>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Records click beacon and performs 302 redirect: <br />
                      <code>?ad_id=...&placement=...&dest=...</code>
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        POST
                      </span>
                      <strong className="text-slate-800 font-mono">/api/ads/push</strong>
                    </div>
                    <p className="text-slate-500 text-[11px]">
                      Immediately dispatches ad to live slot with priority.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-lg text-xs font-mono text-slate-300 space-y-1 border border-slate-800">
                  <span className="text-slate-500 text-[11px]">cURL Example:</span>
                  <pre className="text-emerald-400 overflow-x-auto">
                    curl -s "https://YOUR_DOMAIN/api/ads/active?placement=header-ad&page=/news"
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUICK PUSH MODAL OVERLAY */}
      {quickPushSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Radio className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Quick Push to [#{quickPushSlot}]
                </h3>
              </div>
              <button
                onClick={() => setQuickPushSlot(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select an approved advertisement to immediately dispatch to placement <code className="font-mono text-blue-600 font-bold">#{quickPushSlot}</code> with top priority #1:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {ads.map((ad) => (
                <div
                  key={ad.id}
                  onClick={() => handleQuickPush(ad.id, quickPushSlot)}
                  className="p-3 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 cursor-pointer flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <img src={ad.media_url} alt="" className="w-10 h-8 rounded object-cover flex-shrink-0 bg-slate-100" />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">{ad.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase">{ad.ad_type} • Current: {ad.placement_id}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    Push →
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setQuickPushSlot(null)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
