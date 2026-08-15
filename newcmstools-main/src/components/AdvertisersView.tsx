import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Globe,
  Building,
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  ExternalLink,
  Layers,
  Megaphone
} from 'lucide-react';
import { Advertiser } from '../types';
import { api } from '../lib/api';
import { ConfirmModal } from './ConfirmModal';

interface AdvertisersViewProps {
  advertisers: Advertiser[];
  onAdvertiserSaved: (advertiser: Advertiser) => void;
  onAdvertiserDeleted: (id: string) => void;
  onFilterAdsByAdvertiser?: (advertiserId: string) => void;
}

export const AdvertisersView: React.FC<AdvertisersViewProps> = ({
  advertisers,
  onAdvertiserSaved,
  onAdvertiserDeleted,
  onFilterAdsByAdvertiser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdv, setEditingAdv] = useState<Advertiser | null>(null);
  const [deletingAdv, setDeletingAdv] = useState<Advertiser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    setEditingAdv(null);
    setName('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setWebsite('https://');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (adv: Advertiser) => {
    setEditingAdv(adv);
    setName(adv.name);
    setCompanyName(adv.company_name || '');
    setEmail(adv.email || '');
    setPhone(adv.phone || '');
    setWebsite(adv.website || 'https://');
    setNotes(adv.notes || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Advertiser> = {
        name,
        company_name: companyName,
        email,
        phone,
        website: website === 'https://' ? '' : website,
        notes,
        status: 'active'
      };

      let saved: Advertiser;
      if (editingAdv) {
        payload.id = editingAdv.id;
        saved = await api.updateAdvertiser(payload);
      } else {
        saved = await api.createAdvertiser(payload);
      }

      onAdvertiserSaved(saved);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save advertiser', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingAdv) return;
    setIsDeleting(true);
    try {
      await api.deleteAdvertiser(deletingAdv.id);
      onAdvertiserDeleted(deletingAdv.id);
      setDeletingAdv(null);
    } catch (err) {
      console.error('Failed to delete advertiser', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = advertisers.filter(
    (a) =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Search & Actions */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search advertisers by name, company, email..."
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
          <span>Add Advertiser</span>
        </button>
      </div>

      {/* Grid of Advertiser Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No advertisers found</p>
            <button onClick={openCreateModal} className="text-xs text-blue-600 font-bold hover:underline mt-1">
              + Register First Advertiser
            </button>
          </div>
        ) : (
          filtered.map((adv) => (
            <div
              key={adv.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 font-bold flex items-center justify-center text-xs border border-blue-100">
                      {adv.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{adv.name}</h4>
                      {adv.company_name && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{adv.company_name}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {adv.email && (
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <a href={`mailto:${adv.email}`} className="text-slate-700 hover:text-blue-600 truncate">
                        {adv.email}
                      </a>
                    </p>
                  )}
                  {adv.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{adv.phone}</span>
                    </p>
                  )}
                  {adv.website && (
                    <p className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400" />
                      <a
                        href={adv.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {adv.website}
                      </a>
                    </p>
                  )}
                  {adv.notes && (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded-lg mt-2">{adv.notes}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {adv.campaigns_count || 0} campaigns
                  </span>
                  <button
                    onClick={() => onFilterAdsByAdvertiser && onFilterAdsByAdvertiser(adv.id)}
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                    title="View this advertiser's ads"
                  >
                    {adv.ads_count || 0} ads →
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => openEditModal(adv)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingAdv(adv)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAdv}
        title="Delete Advertiser"
        message={`Are you sure you want to delete advertiser "${deletingAdv?.name}"? Associated advertisements will be unlinked.`}
        confirmLabel="Delete Advertiser"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingAdv(null)}
      />

      {/* Create / Edit Advertiser Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingAdv ? 'Edit Advertiser' : 'Register New Advertiser'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Advertiser / Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp or CloudBoost AI"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme Technologies Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="ads@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 019-2834"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://acme.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Billing terms, contact person, specific contract notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                  {isSubmitting ? 'Saving...' : editingAdv ? 'Update Advertiser' : 'Create Advertiser'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
