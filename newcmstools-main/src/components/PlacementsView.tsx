import React, { useState } from 'react';
import {
  Grid,
  Plus,
  Copy,
  Check,
  Code2,
  ExternalLink,
  Layers,
  Edit2,
  Trash2,
  X,
  Sparkles,
  Megaphone
} from 'lucide-react';
import { Placement } from '../types';
import { api } from '../lib/api';
import { ConfirmModal } from './ConfirmModal';

interface PlacementsViewProps {
  placements: Placement[];
  onPlacementSaved: (placement: Placement) => void;
  onPlacementDeleted: (id: string) => void;
  onFilterAdsByPlacement?: (placementKey: string) => void;
}

export const PlacementsView: React.FC<PlacementsViewProps> = ({
  placements,
  onPlacementSaved,
  onPlacementDeleted,
  onFilterAdsByPlacement,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlc, setEditingPlc] = useState<Placement | null>(null);
  const [deletingPlc, setDeletingPlc] = useState<Placement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [placementKey, setPlacementKey] = useState('');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState('728');
  const [height, setHeight] = useState('90');
  const [rotationMode, setRotationMode] = useState<'priority' | 'random' | 'equal_weight'>('priority');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copySnippet = (key: string) => {
    const snippet = `<div id="${key}"></div>\n<script src="/ad-loader.js" async></script>`;
    navigator.clipboard.writeText(snippet);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const openCreateModal = () => {
    setEditingPlc(null);
    setName('');
    setPlacementKey('');
    setDescription('');
    setWidth('728');
    setHeight('90');
    setRotationMode('priority');
    setIsModalOpen(true);
  };

  const openEditModal = (plc: Placement) => {
    setEditingPlc(plc);
    setName(plc.name);
    setPlacementKey(plc.placement_key);
    setDescription(plc.description || '');
    setWidth(plc.recommended_width ? String(plc.recommended_width) : '728');
    setHeight(plc.recommended_height ? String(plc.recommended_height) : '90');
    setRotationMode(plc.rotation_mode as any || 'priority');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !placementKey.trim()) return;

    setIsSubmitting(true);
    try {
      const payload: Partial<Placement> = {
        name,
        placement_key: placementKey.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
        description,
        recommended_width: Number(width) || undefined,
        recommended_height: Number(height) || undefined,
        rotation_mode: rotationMode,
        status: 'active'
      };

      let saved: Placement;
      if (editingPlc) {
        payload.id = editingPlc.id;
        saved = await api.updatePlacement(payload);
      } else {
        saved = await api.createPlacement(payload);
      }

      onPlacementSaved(saved);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save placement', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingPlc) return;
    setIsDeleting(true);
    try {
      await api.deletePlacement(deletingPlc.id);
      onPlacementDeleted(deletingPlc.id);
      setDeletingPlc(null);
    } catch (err) {
      console.error('Failed to delete placement', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Grid className="w-4 h-4 text-blue-600" />
            <span>Website Ad Placements & Embed Slots</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Embed once into your web pages. Push and rotate ads dynamically from this CMS.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Placement</span>
        </button>
      </div>

      {/* Grid of Placement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {placements.map((plc) => (
          <div
            key={plc.id}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{plc.name}</h4>
                  <p className="text-xs font-mono text-blue-600 font-semibold mt-0.5">
                    #{plc.placement_key}
                  </p>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {plc.recommended_width} × {plc.recommended_height}
                </span>
              </div>

              {plc.description && (
                <p className="text-xs text-slate-500 mt-2">{plc.description}</p>
              )}

              <div className="mt-3.5 p-3 bg-slate-900 rounded-lg border border-slate-800 text-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
                  <span>HTML Embed Snippet</span>
                  <span className="text-[10px] text-emerald-400 font-mono">ad-loader.js</span>
                </div>
                <pre className="text-[10px] font-mono text-emerald-300 overflow-x-auto bg-slate-950 p-2 rounded">
                  {`<div id="${plc.placement_key}"></div>`}
                </pre>
                <button
                  onClick={() => copySnippet(plc.placement_key)}
                  className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedKey === plc.placement_key ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied Snippet!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Embed Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => onFilterAdsByPlacement && onFilterAdsByPlacement(plc.placement_key)}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                title="View ads in this slot"
              >
                Rotation: <strong className="text-slate-700 capitalize">{plc.rotation_mode}</strong> →
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => openEditModal(plc)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingPlc(plc)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingPlc}
        title="Delete Placement Slot"
        message={`Are you sure you want to delete placement slot "${deletingPlc?.name}" (${deletingPlc?.placement_key})? Any website containers targeting this ID will receive no ads.`}
        confirmLabel="Delete Placement"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingPlc(null)}
      />

      {/* Create / Edit Placement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPlc ? 'Edit Placement Slot' : 'Create New Placement Slot'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placement Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Header Leaderboard"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingPlc) {
                      setPlacementKey(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  HTML Container ID Key <span className="text-slate-400 font-normal">(Used in &lt;div id="..."&gt;)</span> *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. header-ad or sidebar-sponsor"
                  value={placementKey}
                  onChange={(e) => setPlacementKey(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recommended Width (px)</label>
                  <input
                    type="number"
                    placeholder="728"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Recommended Height (px)</label>
                  <input
                    type="number"
                    placeholder="90"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Multi-Ad Rotation Strategy</label>
                <select
                  value={rotationMode}
                  onChange={(e) => setRotationMode(e.target.value as any)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="priority">Priority-First (Highest priority ad served first)</option>
                  <option value="random">Random Distribution (Uniform random among active ads)</option>
                  <option value="equal_weight">Weighted Rotation (Based on ad weight property)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description / Location Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Above the fold on all article pages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  {isSubmitting ? 'Saving...' : editingPlc ? 'Update Placement' : 'Create Placement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
