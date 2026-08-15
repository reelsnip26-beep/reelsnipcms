import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Database,
  Globe,
  Sliders,
  Shield,
  Clock,
  HardDrive
} from 'lucide-react';
import { CMSSettings } from '../types';
import { api } from '../lib/api';

interface SettingsViewProps {
  initialSettings?: CMSSettings;
  onSettingsSaved?: (settings: CMSSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  initialSettings,
  onSettingsSaved,
}) => {
  const [siteName, setSiteName] = useState(initialSettings?.site_name || 'AdPush CMS');
  const [defaultRotation, setDefaultRotation] = useState(initialSettings?.default_rotation_mode || 'priority');
  const [maxUploadSize, setMaxUploadSize] = useState(initialSettings?.max_upload_size_mb || 50);
  const [defaultTimezone, setDefaultTimezone] = useState(initialSettings?.default_timezone || 'UTC');
  const [r2PublicDomain, setR2PublicDomain] = useState(initialSettings?.r2_public_domain || '');
  const [cacheDuration, setCacheDuration] = useState(initialSettings?.cache_duration_seconds || 30);
  const [corsOrigins, setCorsOrigins] = useState(initialSettings?.cors_allowed_origins || '*');

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialSettings) {
      setSiteName(initialSettings.site_name || 'AdPush CMS');
      setDefaultRotation(initialSettings.default_rotation_mode || 'priority');
      setMaxUploadSize(initialSettings.max_upload_size_mb || 50);
      setDefaultTimezone(initialSettings.default_timezone || 'UTC');
      setR2PublicDomain(initialSettings.r2_public_domain || '');
      setCacheDuration(initialSettings.cache_duration_seconds || 30);
      setCorsOrigins(initialSettings.cors_allowed_origins || '*');
    }
  }, [initialSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated: CMSSettings = {
        site_name: siteName,
        default_rotation_mode: defaultRotation,
        max_upload_size_mb: Number(maxUploadSize),
        default_timezone: defaultTimezone,
        r2_public_domain: r2PublicDomain,
        cache_duration_seconds: Number(cacheDuration),
        cors_allowed_origins: corsOrigins,
      };

      await api.updateSettings(updated);
      setSuccessMsg('Settings saved successfully to Cloudflare D1!');
      if (onSettingsSaved) onSettingsSaved(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
          <Settings className="w-4 h-4 text-blue-600" />
          <span>System Settings & Edge Delivery Policy</span>
        </h3>
        <p className="text-xs text-slate-500">
          Global ad delivery rules, edge caching durations, and Cloudflare storage bindings
        </p>

        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="mt-5 space-y-4 text-xs">
          {/* General */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">General</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">CMS Dashboard Brand Name</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default System Timezone</label>
                <select
                  value={defaultTimezone}
                  onChange={(e) => setDefaultTimezone(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ad Delivery & Rotation */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Ad Rotation & Cache</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Default Rotation Strategy</label>
                <select
                  value={defaultRotation}
                  onChange={(e) => setDefaultRotation(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="priority">Priority-First (Highest numerical rank)</option>
                  <option value="random">Randomized Distribution</option>
                  <option value="equal_weight">Weighted Equal Rotation</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Edge Cache TTL (Seconds)</label>
                <input
                  type="number"
                  value={cacheDuration}
                  onChange={(e) => setCacheDuration(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">0 = instantaneous / no edge cache</span>
              </div>
            </div>
          </div>

          {/* Media & Storage */}
          <div className="space-y-3 pb-4 border-b border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Cloudflare R2 Storage</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Max PC Upload File Size (MB)</label>
                <input
                  type="number"
                  value={maxUploadSize}
                  onChange={(e) => setMaxUploadSize(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Custom R2 Public Domain (Optional)</label>
                <input
                  type="text"
                  placeholder="https://media.mywebsite.com"
                  value={r2PublicDomain}
                  onChange={(e) => setR2PublicDomain(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* CORS */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Cross-Origin (CORS)</h4>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Allowed Origins for Embed Script</label>
              <input
                type="text"
                placeholder="* or https://mywebsite.com, https://partner.com"
                value={corsOrigins}
                onChange={(e) => setCorsOrigins(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Use * to permit any website to load your ads</span>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving to D1...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
