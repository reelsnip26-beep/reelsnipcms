import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  Copy,
  Check,
  Trash2,
  Play,
  Eye,
  ExternalLink,
  Plus,
  Sparkles,
  AlertCircle,
  FileCheck,
  Film
} from 'lucide-react';
import { MediaItem, Ad } from '../types';
import { api } from '../lib/api';
import { ConfirmModal } from './ConfirmModal';

interface MediaLibraryViewProps {
  media: MediaItem[];
  ads: Ad[];
  onMediaUploaded: (item: MediaItem) => void;
  onMediaDeleted: (id: string) => void;
}

export const MediaLibraryView: React.FC<MediaLibraryViewProps> = ({
  media,
  ads,
  onMediaUploaded,
  onMediaDeleted,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [urlModalOpen, setUrlModalOpen] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    setIsUploading(true);
    setErrorMessage('');
    try {
      const item = await api.uploadMediaFile(file);
      onMediaUploaded(item);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to upload asset');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    try {
      const isVideo = customUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i);
      const item = await api.addMediaUrl(
        customUrl,
        customName || customUrl.split('/').pop() || 'Remote Asset',
        isVideo ? 'video/mp4' : 'image/jpeg'
      );
      onMediaUploaded(item);
      setUrlModalOpen(false);
      setCustomUrl('');
      setCustomName('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add URL asset');
    }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(item.url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const confirmDelete = async () => {
    if (!deletingMedia) return;
    setIsDeleting(true);
    try {
      await api.deleteMedia(deletingMedia.id);
      onMediaDeleted(deletingMedia.id);
      setDeletingMedia(null);
    } catch (err) {
      console.error('Failed to delete media', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone & Header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>Cloudflare R2 Media Asset Library</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-performance object storage for image and video creatives delivered globally via Cloudflare CDN
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUrlModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Add Direct URL</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading to R2...' : 'Upload from PC'}</span>
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <ImageIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No media assets in library</p>
            <p className="text-xs text-slate-400 mt-1">Upload images or MP4 videos to deploy them across your ads</p>
          </div>
        ) : (
          media.map((item) => {
            const isVideo = item.file_type.startsWith('video') || item.url.match(/\.(mp4|webm|mov)(\?.*)?$/i);
            const activeAdsUsing = ads.filter(
              (a) => a.media_url === item.url || (item.r2_key && a.media_r2_key === item.r2_key)
            );

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between group"
              >
                {/* Media Thumbnail Box */}
                <div
                  onClick={() => setPreviewItem(item)}
                  className="aspect-video bg-slate-100 relative cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {isVideo ? (
                    <div className="flex flex-col items-center justify-center text-slate-600 space-y-1">
                      <Film className="w-6 h-6 text-blue-600" />
                      <span className="text-[10px] font-bold text-slate-500">Video Asset</span>
                    </div>
                  ) : (
                    <img src={item.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  )}

                  <span className="absolute top-2 left-2 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                    {isVideo ? 'MP4' : item.file_type.split('/')[1] || 'IMG'}
                  </span>

                  {activeAdsUsing.length > 0 && (
                    <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-2xs">
                      {activeAdsUsing.length} Active {activeAdsUsing.length === 1 ? 'Ad' : 'Ads'}
                    </span>
                  )}

                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-3 space-y-2">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 truncate" title={item.file_name}>
                      {item.file_name}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {item.file_size ? `${(item.file_size / 1024 / 1024).toFixed(2)} MB` : 'Direct URL'} •{' '}
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => copyUrl(item)}
                      className="px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setDeletingMedia(item)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingMedia}
        title="Delete Media Asset"
        message={
          (() => {
            if (!deletingMedia) return '';
            const usedBy = ads.filter((a) => a.media_url === deletingMedia.url || (deletingMedia.r2_key && a.media_r2_key === deletingMedia.r2_key));
            if (usedBy.length > 0) {
              const names = usedBy.map((a) => `"${a.name}"`).join(', ');
              return `Warning: This asset is currently attached to ${usedBy.length} advertisement(s): ${names}. Deleting it will remove the visual media.`;
            }
            return `Are you sure you want to permanently delete asset "${deletingMedia.file_name}" from Cloudflare R2 storage?`;
          })()
        }
        confirmLabel="Delete Media Asset"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingMedia(null)}
      />

      {/* Direct URL Modal */}
      {urlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-xl space-y-4 border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Register External Media URL</h3>
            <form onSubmit={handleAddUrl} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Media URL (Image or Video) *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Label / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Hero Tech Banner"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setUrlModalOpen(false)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs"
                >
                  Add Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Video Preview Modal */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl max-w-2xl w-full p-5 shadow-2xl space-y-4 border border-slate-200"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm truncate">{previewItem.file_name}</h3>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-slate-700 font-bold">
                ✕
              </button>
            </div>
            <div className="rounded-lg overflow-hidden bg-black flex items-center justify-center max-h-[440px]">
              {previewItem.file_type.startsWith('video') || previewItem.url.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? (
                <video src={previewItem.url} controls autoPlay className="w-full max-h-[440px]" />
              ) : (
                <img src={previewItem.url} alt="" className="w-full max-h-[440px] object-contain" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>R2 Key: {previewItem.r2_key || 'Remote URL'}</span>
              <a
                href={previewItem.url}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Open in browser</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
