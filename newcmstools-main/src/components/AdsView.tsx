import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Radio,
  Play,
  Image as ImageIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  Eye,
  ArrowUpDown,
  SlidersHorizontal,
  Calendar
} from 'lucide-react';
import { Ad, Advertiser, Campaign, Placement } from '../types';
import { api } from '../lib/api';
import { ConfirmModal } from './ConfirmModal';

interface AdsViewProps {
  ads: Ad[];
  advertisers: Advertiser[];
  campaigns: Campaign[];
  placements: Placement[];
  onOpenCreateAd: () => void;
  onEditAd: (ad: Ad) => void;
  onOpenPushAdForSpecificAd: (ad: Ad) => void;
  onAdDeleted: (id: string) => void;
  onAdUpdated: (ad: Ad) => void;
}

export const AdsView: React.FC<AdsViewProps> = ({
  ads,
  advertisers,
  campaigns,
  placements,
  onOpenCreateAd,
  onEditAd,
  onOpenPushAdForSpecificAd,
  onAdDeleted,
  onAdUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlacement, setFilterPlacement] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('table');
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const [deletingAd, setDeletingAd] = useState<Ad | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toggle active/inactive
  const handleToggleStatus = async (ad: Ad) => {
    const currentEffective = ad.effective_status || ad.status;
    const newStatus = currentEffective === 'active' ? 'inactive' : 'active';
    try {
      const updated = await api.updateAd({ id: ad.id, status: newStatus });
      onAdUpdated({ ...ad, status: newStatus, effective_status: newStatus });
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAd) return;
    setIsDeleting(true);
    try {
      await api.deleteAd(deletingAd.id);
      onAdDeleted(deletingAd.id);
      setDeletingAd(null);
    } catch (err) {
      console.error('Failed to delete ad', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAds = ads.filter((ad) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = ad.name.toLowerCase().includes(q);
      const matchAdv = ad.advertiser_name?.toLowerCase().includes(q);
      const matchHeadline = ad.headline?.toLowerCase().includes(q);
      if (!matchName && !matchAdv && !matchHeadline) return false;
    }
    if (filterPlacement && ad.placement_id !== filterPlacement) return false;
    if (filterStatus && (ad.effective_status || ad.status) !== filterStatus) return false;
    if (filterCampaign && ad.campaign_id !== filterCampaign) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter and Action Bar */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ad name, advertiser..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50 focus:bg-white"
            />
          </div>

          {/* Placement Filter */}
          <select
            value={filterPlacement}
            onChange={(e) => setFilterPlacement(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 outline-hidden font-medium"
          >
            <option value="">All Placements</option>
            {placements.map((plc) => (
              <option key={plc.id} value={plc.placement_key}>
                {plc.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 outline-hidden font-medium"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="inactive">Inactive / Paused</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          {/* Layout view toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewLayout('table')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                viewLayout === 'table' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewLayout('grid')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                viewLayout === 'grid' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Grid
            </button>
          </div>

          <button
            id="btn-ads-view-new"
            onClick={onOpenCreateAd}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Ad</span>
          </button>
        </div>
      </div>

      {/* Ads List Table View */}
      {viewLayout === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5">Ad & Creative</th>
                  <th className="px-4 py-3.5">Type & Slot</th>
                  <th className="px-4 py-3.5">Flight Schedule</th>
                  <th className="px-3 py-3.5 text-center">Priority</th>
                  <th className="px-4 py-3.5 text-right">Impr / Clicks</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAds.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Megaphone className="w-8 h-8 text-slate-300" />
                        <p className="font-semibold text-slate-700">No advertisements match your criteria</p>
                        <button
                          onClick={onOpenCreateAd}
                          className="text-xs text-blue-600 font-bold hover:underline"
                        >
                          + Create New Advertisement
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAds.map((ad) => {
                    const effectiveStatus = ad.effective_status || ad.status;
                    return (
                      <tr key={ad.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Media + Title */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3">
                            <div
                              onClick={() => setPreviewAd(ad)}
                              className="w-14 h-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 cursor-pointer relative group flex items-center justify-center"
                            >
                              {ad.media_type === 'video' ? (
                                <Play className="w-4 h-4 text-blue-600" />
                              ) : (
                                <img src={ad.media_url} alt="" className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-3.5 h-3.5 text-white" />
                              </div>
                            </div>

                            <div className="min-w-0 max-w-[220px]">
                              <h4 className="font-bold text-slate-900 truncate">{ad.name}</h4>
                              <p className="text-[11px] text-slate-500 truncate">{ad.advertiser_name || 'Direct Advertiser'}</p>
                              <a
                                href={ad.destination_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-600 hover:underline truncate block"
                              >
                                {ad.destination_url}
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Type & Slot */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="inline-block uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {ad.ad_type}
                            </span>
                            <p className="font-mono text-[11px] text-slate-600">{ad.placement_id}</p>
                          </div>
                        </td>

                        {/* Schedule */}
                        <td className="px-4 py-3.5">
                          {ad.start_at || ad.end_at ? (
                            <div className="text-[11px] space-y-0.5">
                              {ad.start_at && (
                                <div className="text-slate-600">From: {new Date(ad.start_at).toLocaleDateString()}</div>
                              )}
                              {ad.end_at && (
                                <div className="text-slate-500">To: {new Date(ad.end_at).toLocaleDateString()}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Always Running</span>
                          )}
                        </td>

                        {/* Priority */}
                        <td className="px-3 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              ad.priority === 1
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            #{ad.priority}
                          </span>
                        </td>

                        {/* Impressions / Clicks */}
                        <td className="px-4 py-3.5 text-right">
                          <p className="font-bold text-slate-900">{ad.impressions_count || 0}</p>
                          <p className="text-[10px] text-slate-400">
                            {ad.clicks_count || 0} clicks ({ad.ctr || '0.00'}%)
                          </p>
                        </td>

                        {/* Status Toggle */}
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => handleToggleStatus(ad)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                              effectiveStatus === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : effectiveStatus === 'scheduled'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                : effectiveStatus === 'expired'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                effectiveStatus === 'active'
                                  ? 'bg-emerald-500'
                                  : effectiveStatus === 'scheduled'
                                  ? 'bg-amber-500'
                                  : effectiveStatus === 'expired'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`}
                            ></span>
                            <span className="capitalize">{effectiveStatus}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {/* Push Ad Action Button */}
                            <button
                              onClick={() => onOpenPushAdForSpecificAd(ad)}
                              title="Push to placement immediately"
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-semibold border border-blue-200 transition-colors flex items-center gap-1"
                            >
                              <Radio className="w-3 h-3 text-blue-600" />
                              <span>Push</span>
                            </button>

                            <button
                              onClick={() => onEditAd(ad)}
                              title="Edit Ad"
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingAd(ad)}
                              title="Delete Ad"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Layout View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAds.map((ad) => (
            <div
              key={ad.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-xs transition-shadow flex flex-col"
            >
              <div className="aspect-video bg-slate-100 relative group overflow-hidden flex items-center justify-center">
                {ad.media_type === 'video' ? (
                  <video src={ad.media_url} muted autoPlay loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <img src={ad.media_url} alt="" className="w-full h-full object-cover" />
                )}
                <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  {ad.ad_type}
                </span>
                <span className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Priority #{ad.priority}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{ad.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Slot: {ad.placement_id}</p>
                  {ad.headline && <p className="text-xs text-slate-700 mt-2 font-medium">{ad.headline}</p>}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleStatus(ad)}
                    className="text-xs font-semibold capitalize text-slate-600 hover:text-slate-900"
                  >
                    Status: <strong className="text-blue-600">{ad.effective_status || ad.status}</strong>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onOpenPushAdForSpecificAd(ad)}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-2xs hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                      <Radio className="w-3 h-3" /> Push
                    </button>
                    <button
                      onClick={() => onEditAd(ad)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingAd(ad)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Live Preview Modal */}
      {previewAd && (
        <div
          onClick={() => setPreviewAd(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">{previewAd.name}</h3>
              <button onClick={() => setPreviewAd(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center">
              {previewAd.media_type === 'video' ? (
                <video src={previewAd.media_url} controls autoPlay muted className="w-full max-h-[360px]" />
              ) : (
                <img src={previewAd.media_url} alt="" className="w-full max-h-[360px] object-contain" />
              )}
            </div>
            <div className="text-xs text-slate-600 space-y-1">
              <p><strong>Destination:</strong> <a href={previewAd.destination_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{previewAd.destination_url}</a></p>
              <p><strong>Placement Slot:</strong> {previewAd.placement_id}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAd}
        title="Delete Advertisement"
        message={`Are you sure you want to permanently delete advertisement "${deletingAd?.name}"? This creative will stop delivering across all placements.`}
        confirmLabel="Delete Advertisement"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingAd(null)}
      />
    </div>
  );
};
