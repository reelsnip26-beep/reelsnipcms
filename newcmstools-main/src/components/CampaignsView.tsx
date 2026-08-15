import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  MousePointerClick,
  Eye,
  Edit2,
  Trash2,
  X,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Campaign, Advertiser } from '../types';
import { api } from '../lib/api';
import { ConfirmModal } from './ConfirmModal';

interface CampaignsViewProps {
  campaigns: Campaign[];
  advertisers: Advertiser[];
  onCampaignSaved: (campaign: Campaign) => void;
  onCampaignDeleted: (id: string) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  advertisers,
  onCampaignSaved,
  onCampaignDeleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Campaign | null>(null);
  const [deletingCamp, setDeletingCamp] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [advertiserId, setAdvertiserId] = useState('');
  const [budget, setBudget] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [status, setStatus] = useState<'active' | 'paused' | 'completed'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingCamp(null);
    setName('');
    setAdvertiserId(advertisers[0]?.id || '');
    setBudget('1000');
    setStartAt('');
    setEndAt('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (camp: Campaign) => {
    setEditingCamp(camp);
    setName(camp.name);
    setAdvertiserId(camp.advertiser_id);
    setBudget(camp.budget ? String(camp.budget) : '');
    setStartAt(camp.start_at ? camp.start_at.substring(0, 16) : '');
    setEndAt(camp.end_at ? camp.end_at.substring(0, 16) : '');
    setStatus(camp.status as any || 'active');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !advertiserId) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Campaign> = {
        name,
        advertiser_id: advertiserId,
        budget: budget ? Number(budget) : undefined,
        start_at: startAt ? new Date(startAt).toISOString() : undefined,
        end_at: endAt ? new Date(endAt).toISOString() : undefined,
        status
      };

      let saved: Campaign;
      if (editingCamp) {
        payload.id = editingCamp.id;
        saved = await api.updateCampaign(payload);
      } else {
        saved = await api.createCampaign(payload);
      }

      onCampaignSaved(saved);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save campaign', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCamp) return;
    setIsDeleting(true);
    try {
      await api.deleteCampaign(deletingCamp.id);
      onCampaignDeleted(deletingCamp.id);
      setDeletingCamp(null);
    } catch (err) {
      console.error('Failed to delete campaign', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = campaigns.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.advertiser_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Search & Actions */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search campaigns by name, advertiser..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-hidden bg-slate-50 focus:bg-white"
          />
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Campaign Name</th>
                <th className="px-4 py-3.5">Advertiser</th>
                <th className="px-4 py-3.5">Budget</th>
                <th className="px-4 py-3.5">Flight Schedule</th>
                <th className="px-4 py-3.5 text-right">Impressions / Clicks</th>
                <th className="px-3 py-3.5 text-center">CTR</th>
                <th className="px-3 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Layers className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-slate-700">No campaigns found</p>
                      <button onClick={openCreateModal} className="text-xs text-blue-600 font-bold hover:underline">
                        + Create First Campaign
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{camp.name}</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {camp.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800">{camp.advertiser_name || 'Direct'}</span>
                    </td>

                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {camp.budget ? `$${camp.budget.toLocaleString()}` : '—'}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-slate-600">
                      {camp.start_at || camp.end_at ? (
                        <div>
                          {camp.start_at && <div>{new Date(camp.start_at).toLocaleDateString()}</div>}
                          {camp.end_at && <div className="text-slate-400">to {new Date(camp.end_at).toLocaleDateString()}</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400">Continuous Flight</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <p className="font-bold text-slate-900">{camp.impressions_count || 0}</p>
                      <p className="text-[10px] text-slate-400">{camp.clicks_count || 0} clicks</p>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {camp.ctr || '0.00'}%
                      </span>
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          camp.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : camp.status === 'paused'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditModal(camp)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingCamp(camp)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingCamp}
        title="Delete Campaign"
        message={`Are you sure you want to delete campaign "${deletingCamp?.name}"? Advertisements inside will remain saved but unassigned.`}
        confirmLabel="Delete Campaign"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingCamp(null)}
      />

      {/* Create / Edit Campaign Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCamp ? 'Edit Campaign' : 'Create New Campaign'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Summer Velocity Launch"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advertiser *</label>
                <select
                  required
                  value={advertiserId}
                  onChange={(e) => setAdvertiserId(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Select Advertiser --</option>
                  {advertisers.map((adv) => (
                    <option key={adv.id} value={adv.id}>
                      {adv.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Budget ($ USD)</label>
                <input
                  type="number"
                  placeholder="5000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    value={endAt}
                    onChange={(e) => setEndAt(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  {isSubmitting ? 'Saving...' : editingCamp ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
