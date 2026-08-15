import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  MousePointerClick,
  Eye,
  Calendar,
  Smartphone,
  Monitor,
  Tablet,
  Download,
  Filter,
  Layers,
  ArrowUpRight,
  Radio
} from 'lucide-react';
import { AnalyticsData, AnalyticsSummary } from '../types';
import { api } from '../lib/api';

interface AnalyticsViewProps {
  initialSummary?: AnalyticsSummary | null;
  onOpenPushAd?: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  initialSummary,
  onOpenPushAd,
}) => {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAnalytics = async (selectedRange: string) => {
    setIsLoading(true);
    try {
      const res = await api.getAnalytics(selectedRange);
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(range);
  }, [range]);

  const summary = data?.summary || initialSummary;
  const daily = data?.daily || [];
  const topAds = data?.top_ads || [];
  const placements = data?.placements || [];
  const devices = data?.devices || [];

  const maxDailyImpr = Math.max(...daily.map((d) => d.impressions), 10);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>Advertising Performance & Tracking Analytics</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Cloudflare D1 edge analytics recording verified impressions, clicks, and conversion rates
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Date range picker */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            {['24h', '7d', '30d', '90d'].map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold uppercase transition-all ${
                  range === r ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Period Impressions</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.total_impressions?.toLocaleString() || 0}</p>
          <p className="text-[11px] text-slate-400">Total ad renders served</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Period Clicks</span>
            <MousePointerClick className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.total_clicks?.toLocaleString() || 0}</p>
          <p className="text-[11px] text-slate-400">Outbound sponsor visits</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Click-Through Rate (CTR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-600">{summary?.ctr || '0.00'}%</p>
          <p className="text-[11px] text-emerald-600 font-medium">Overall campaign conversion</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Advertisements</span>
            <Radio className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{summary?.total_ads || 0}</p>
          <p className="text-[11px] text-slate-400">In database registry</p>
        </div>
      </div>

      {/* Daily Performance Trend Chart */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Daily Impressions & Delivery Timeline</h4>
            <p className="text-xs text-slate-500">Impression volume distributed over selected timeframe</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-blue-600"></span>
              <span className="text-slate-600 font-medium">Impressions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-400"></span>
              <span className="text-slate-600 font-medium">Clicks</span>
            </div>
          </div>
        </div>

        <div className="pt-4 pb-2">
          {daily.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-xs bg-slate-50 rounded-lg">
              No historical impressions recorded yet in this time window
            </div>
          ) : (
            <div className="h-48 flex items-end justify-between gap-2 pt-4 px-2">
              {daily.map((d, i) => {
                const heightPercent = Math.max(8, (d.impressions / maxDailyImpr) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                    {/* Bar container */}
                    <div className="w-full max-w-[36px] bg-slate-100 rounded-t-md relative flex items-end overflow-hidden h-36">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full bg-blue-600 rounded-t-md group-hover:bg-blue-700 transition-all relative"
                      >
                        {d.clicks > 0 && (
                          <div
                            style={{ height: `${Math.min(100, (d.clicks / d.impressions) * 100 * 5)}%` }}
                            className="w-full bg-slate-900"
                          ></div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
                      {d.date.substring(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two Column Breakdown: Top Ads Ranking & Placements Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Ads Ranking (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-900">Top Performing Advertisements</h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">By CTR</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Ad Name</th>
                  <th className="px-3 py-2.5">Slot</th>
                  <th className="px-3 py-2.5 text-right">Impr</th>
                  <th className="px-3 py-2.5 text-right">Clicks</th>
                  <th className="px-4 py-2.5 text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {topAds.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      No ad impressions recorded yet
                    </td>
                  </tr>
                ) : (
                  topAds.map((ad, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-semibold text-slate-900 truncate max-w-[180px]">{ad.name}</td>
                      <td className="px-3 py-3 font-mono text-[11px] text-slate-500">{ad.placement_id}</td>
                      <td className="px-3 py-3 text-right font-medium">{ad.impressions}</td>
                      <td className="px-3 py-3 text-right font-medium text-blue-600">{ad.clicks}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-emerald-600">{ad.ctr}%</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Placement Efficiency & Device Split (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Placement Efficiency */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Placement Slot Share</h4>
            <div className="space-y-3 pt-1">
              {placements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No placement data</p>
              ) : (
                placements.map((plc, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="font-mono text-slate-800">{plc.placement_id}</span>
                      <span className="text-slate-500">{plc.impressions} impr ({plc.ctr}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(
                            100,
                            (plc.impressions / (summary?.total_impressions || 1)) * 100
                          )}%`,
                        }}
                        className="bg-blue-600 h-full rounded-full"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Device Split */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-4 space-y-3">
            <h4 className="text-sm font-bold text-slate-900">Audience Device Breakdown</h4>
            <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <Monitor className="w-4 h-4 mx-auto text-blue-600 mb-1" />
                <p className="text-[11px] font-bold text-slate-800">Desktop</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {devices.find((d) => d.device_type === 'desktop')?.count || 0}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <Smartphone className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
                <p className="text-[11px] font-bold text-slate-800">Mobile</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {devices.find((d) => d.device_type === 'mobile')?.count || 0}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <Tablet className="w-4 h-4 mx-auto text-purple-600 mb-1" />
                <p className="text-[11px] font-bold text-slate-800">Tablet</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">
                  {devices.find((d) => d.device_type === 'tablet')?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
