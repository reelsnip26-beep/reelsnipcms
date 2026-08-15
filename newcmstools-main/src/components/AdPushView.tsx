import React, { useState } from 'react';
import {
  Radio,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Globe,
  Clock,
  Layers,
  Megaphone,
  Eye,
  Sliders
} from 'lucide-react';
import { Ad, Placement } from '../types';
import { api } from '../lib/api';

interface AdPushViewProps {
  ads: Ad[];
  placements: Placement[];
  onAdPushed: (ad: Ad) => void;
  onOpenSimulator: () => void;
  initialAdId?: string;
  initialPlacementId?: string;
}

export const AdPushView: React.FC<AdPushViewProps> = ({
  ads,
  placements,
  onAdPushed,
  onOpenSimulator,
  initialAdId,
  initialPlacementId,
}) => {
  const [selectedAdId, setSelectedAdId] = useState(
    initialAdId || ads[0]?.id || ''
  );
  const [selectedPlacementId, setSelectedPlacementId] = useState(
    initialPlacementId || (initialAdId ? ads.find(a => a.id === initialAdId)?.placement_id : '') || placements[0]?.placement_key || 'header-ad'
  );
  const [priority, setPriority] = useState(1);
  const [targetPages, setTargetPages] = useState('*');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [pushSuccessMsg, setPushSuccessMsg] = useState('');
  const [pushErrorMsg, setPushErrorMsg] = useState('');

  // Sync if initialAdId changes
  React.useEffect(() => {
    if (initialAdId) {
      setSelectedAdId(initialAdId);
      const found = ads.find((a) => a.id === initialAdId);
      if (found) {
        if (found.placement_id) setSelectedPlacementId(found.placement_id);
        if (found.priority) setPriority(found.priority);
      }
    }
  }, [initialAdId, ads]);

  React.useEffect(() => {
    if (initialPlacementId) {
      setSelectedPlacementId(initialPlacementId);
    }
  }, [initialPlacementId]);

  const currentSelectedAd = ads.find((a) => a.id === selectedAdId);
  const currentPlacement = placements.find((p) => p.placement_key === selectedPlacementId);

  const handlePush = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdId) {
      setPushErrorMsg('Please select an advertisement to push');
      return;
    }
    if (!selectedPlacementId) {
      setPushErrorMsg('Please select a target placement slot');
      return;
    }

    setIsPushing(true);
    setPushSuccessMsg('');
    setPushErrorMsg('');

    try {
      const res = await api.pushAd({
        ad_id: selectedAdId,
        placement_id: selectedPlacementId,
        priority: Number(priority),
        target_pages: targetPages || '*',
        start_at: startAt ? new Date(startAt).toISOString() : undefined,
        end_at: endAt ? new Date(endAt).toISOString() : undefined,
        status: 'active',
      });

      if (res.ad) {
        onAdPushed(res.ad);
      }
      setPushSuccessMsg(`Ad "${currentSelectedAd?.name || selectedAdId}" successfully pushed to [${selectedPlacementId}] at Priority #${priority}!`);
    } catch (err: any) {
      setPushErrorMsg(err.message || 'Failed to push advertisement');
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Ad Push Dispatch Station</h2>
              <p className="text-xs text-slate-500">
                Push any approved advertisement to your website placements in real-time without editing website code.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenSimulator}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span>Open Embed Sandbox</span>
          </button>
        </div>
      </div>

      {/* Main Push Form and Real-time Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Push Form */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Configure Push Parameters</span>
          </h3>

          {pushSuccessMsg && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 font-medium">{pushSuccessMsg}</div>
            </div>
          )}

          {pushErrorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <div className="flex-1 font-medium">{pushErrorMsg}</div>
            </div>
          )}

          <form onSubmit={handlePush} className="space-y-4">
            {/* Step 1: Select Advertisement */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Step 1: Choose Advertisement to Push *
              </label>
              <select
                id="select-push-ad"
                value={selectedAdId}
                onChange={(e) => setSelectedAdId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-medium"
              >
                {ads.map((ad) => (
                  <option key={ad.id} value={ad.id}>
                    {ad.name} ({ad.ad_type.toUpperCase()}) — [{ad.placement_id}]
                  </option>
                ))}
              </select>
            </div>

            {/* Step 2: Target Placement */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Step 2: Target Placement Slot *
              </label>
              <select
                id="select-push-placement"
                value={selectedPlacementId}
                onChange={(e) => setSelectedPlacementId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white font-mono"
              >
                {placements.map((plc) => (
                  <option key={plc.id} value={plc.placement_key}>
                    {plc.name} (ID: {plc.placement_key}) — {plc.recommended_width}×{plc.recommended_height}
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Priority & Target Pages */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Priority (1 = Highest)
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                    <option key={p} value={p}>
                      Priority #{p} {p === 1 ? '(Immediate Top Tier)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Website Pages
                </label>
                <input
                  type="text"
                  placeholder="* for all pages or /news, /sports"
                  value={targetPages}
                  onChange={(e) => setTargetPages(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-white"
                />
              </div>
            </div>

            {/* Step 4: Optional Flight Schedule Override */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Flight Timing (Optional)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Start Flight</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">End Flight</label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Big Action Button */}
            <button
              id="btn-execute-push-ad"
              type="submit"
              disabled={isPushing}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isPushing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Pushing to Cloudflare Edge D1...</span>
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  <span>Push Ad to Website Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 5 Cols: Selected Ad Spec & Placement Guide */}
        <div className="lg:col-span-5 space-y-6">
          {/* Ad Card Snapshot */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Selected Advertisement Spec
            </h3>

            {currentSelectedAd ? (
              <div className="space-y-3">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative">
                  {currentSelectedAd.media_type === 'video' ? (
                    <video
                      src={currentSelectedAd.media_url}
                      muted
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={currentSelectedAd.media_url}
                      alt={currentSelectedAd.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {currentSelectedAd.ad_type}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{currentSelectedAd.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{currentSelectedAd.destination_url}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Destination:</span>
                    <a
                      href={currentSelectedAd.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium truncate max-w-[180px]"
                    >
                      <span>{currentSelectedAd.destination_url}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ad Type:</span>
                    <span className="font-semibold text-slate-800 uppercase">{currentSelectedAd.ad_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current Slot:</span>
                    <span className="font-mono text-slate-800">{currentSelectedAd.placement_id}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-8">Select an advertisement above to inspect spec</p>
            )}
          </div>

          {/* Website Embed Tag Snippet for target slot */}
          <div className="bg-slate-900 text-slate-200 rounded-xl p-5 border border-slate-800 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Target HTML Embed Tag
              </span>
              <span className="text-[10px] text-slate-400">Zero Maintenance</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Place this snippet once on your website. Any pushed ad will automatically render inside it:
            </p>
            <pre className="bg-slate-950 p-3 rounded-lg text-[11px] font-mono text-emerald-400 overflow-x-auto border border-slate-800">
              {`<div id="${selectedPlacementId}"></div>\n<script src="/ad-loader.js" async></script>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
