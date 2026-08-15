import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Eye,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
  Monitor
} from 'lucide-react';
import { Ad, Advertiser, Campaign, Placement, AdType, MediaType } from '../types';
import { api } from '../lib/api';

interface CreateAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdSaved: (ad: Ad) => void;
  advertisers: Advertiser[];
  campaigns: Campaign[];
  placements: Placement[];
  editingAd?: Ad | null;
}

export const CreateAdModal: React.FC<CreateAdModalProps> = ({
  isOpen,
  onClose,
  onAdSaved,
  advertisers,
  campaigns,
  placements,
  editingAd
}) => {
  const [name, setName] = useState('');
  const [advertiserId, setAdvertiserId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [adType, setAdType] = useState<AdType>('banner');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [mediaInputMethod, setMediaInputMethod] = useState<'upload' | 'url'>('upload');
  const [mediaUrl, setMediaUrl] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState<number | null>(null);
  const [r2Key, setR2Key] = useState<string | null>(null);
  const [destinationUrl, setDestinationUrl] = useState('');
  const [placementId, setPlacementId] = useState('');
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [openNewTab, setOpenNewTab] = useState(true);

  // Scheduling
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [timezone, setTimezone] = useState('UTC');

  // Video settings
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoControls, setVideoControls] = useState(false);
  const [videoLoop, setVideoLoop] = useState(true);
  const [videoAutoplay, setVideoAutoplay] = useState(true);

  // Native / Story contents
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [callToAction, setCallToAction] = useState('Learn More');
  const [targetPages, setTargetPages] = useState('*');

  // UI state
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate form on edit
  useEffect(() => {
    if (editingAd) {
      setName(editingAd.name);
      setAdvertiserId(editingAd.advertiser_id || '');
      setCampaignId(editingAd.campaign_id || '');
      setAdType(editingAd.ad_type || 'banner');
      setMediaType(editingAd.media_type || 'image');
      setMediaUrl(editingAd.media_url);
      setR2Key(editingAd.media_r2_key);
      setDestinationUrl(editingAd.destination_url);
      setPlacementId(editingAd.placement_id);
      setPriority(editingAd.priority || 5);
      setStatus(editingAd.status === 'inactive' ? 'inactive' : 'active');
      setOpenNewTab(editingAd.open_new_tab === 1 || editingAd.open_new_tab === true);
      setStartAt(editingAd.start_at ? editingAd.start_at.substring(0, 16) : '');
      setEndAt(editingAd.end_at ? editingAd.end_at.substring(0, 16) : '');
      setTimezone(editingAd.timezone || 'UTC');
      setVideoMuted(editingAd.video_muted !== 0 && editingAd.video_muted !== false);
      setVideoControls(editingAd.video_controls === 1 || editingAd.video_controls === true);
      setVideoLoop(editingAd.video_loop !== 0 && editingAd.video_loop !== false);
      setVideoAutoplay(editingAd.video_autoplay !== 0 && editingAd.video_autoplay !== false);
      setHeadline(editingAd.headline || '');
      setDescription(editingAd.description || '');
      setCallToAction(editingAd.call_to_action || 'Learn More');
      setTargetPages(editingAd.target_pages || '*');
      setMediaInputMethod('url');
    } else {
      resetForm();
    }
  }, [editingAd, isOpen, advertisers, placements]);

  const resetForm = () => {
    setName('');
    setAdvertiserId(advertisers[0]?.id || '');
    setCampaignId('');
    setAdType('banner');
    setMediaType('image');
    setMediaInputMethod('upload');
    setMediaUrl('');
    setUploadedFileName('');
    setUploadedFileSize(null);
    setR2Key(null);
    setDestinationUrl('https://');
    setPlacementId(placements[0]?.placement_key || 'header-ad');
    setPriority(1);
    setStatus('active');
    setOpenNewTab(true);
    setStartAt('');
    setEndAt('');
    setTimezone('UTC');
    setVideoMuted(true);
    setVideoControls(false);
    setVideoLoop(true);
    setVideoAutoplay(true);
    setHeadline('');
    setDescription('');
    setCallToAction('Learn More');
    setTargetPages('*');
    setErrorMessage('');
  };

  // Handle PC File Selection & Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    const isVid = file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(file.name.split('.').pop()?.toLowerCase() || '');
    setMediaType(isVid ? 'video' : 'image');
    if (isVid && adType === 'banner') setAdType('video');

    setIsUploading(true);
    setErrorMessage('');

    try {
      const mediaItem = await api.uploadMediaFile(file);
      setMediaUrl(mediaItem.url);
      setUploadedFileName(mediaItem.file_name);
      setUploadedFileSize(mediaItem.file_size);
      setR2Key(mediaItem.r2_key);
    } catch (err: any) {
      setErrorMessage(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Ad Name is required');
      return;
    }
    if (!mediaUrl.trim()) {
      setErrorMessage('Please upload or provide an image/video URL');
      return;
    }
    if (!destinationUrl.trim() || destinationUrl === 'https://') {
      setErrorMessage('Please enter a valid destination URL');
      return;
    }
    if (!placementId) {
      setErrorMessage('Please select a placement slot');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Partial<Ad> = {
        name,
        advertiser_id: advertiserId || null,
        campaign_id: campaignId || null,
        ad_type: adType,
        media_type: mediaType,
        media_url: mediaUrl,
        media_r2_key: r2Key,
        destination_url: destinationUrl,
        placement_id: placementId,
        headline,
        description,
        call_to_action: callToAction,
        priority: Number(priority),
        status,
        open_new_tab: openNewTab ? 1 : 0,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        timezone,
        video_muted: videoMuted ? 1 : 0,
        video_controls: videoControls ? 1 : 0,
        video_loop: videoLoop ? 1 : 0,
        video_autoplay: videoAutoplay ? 1 : 0,
        target_pages: targetPages || '*'
      };

      let savedAd: Ad;
      if (editingAd) {
        payload.id = editingAd.id;
        savedAd = await api.updateAd(payload);
      } else {
        savedAd = await api.createAd(payload);
      }

      onAdSaved(savedAd);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save advertisement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="modal-create-ad-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div id="modal-create-ad-content" className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
              </h3>
              <p className="text-xs text-slate-500">Configure Cloudflare D1 delivery rules, media assets, and scheduling</p>
            </div>
          </div>
          <button
            id="btn-close-modal-create-ad"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Core Fields */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Basic Information</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Summer HyperSpeed Promo Banner"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Advertiser</label>
                  <select
                    value={advertiserId}
                    onChange={(e) => setAdvertiserId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
                  >
                    <option value="">-- None / Direct --</option>
                    {advertisers.map((adv) => (
                      <option key={adv.id} value={adv.id}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign</label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
                  >
                    <option value="">-- Direct Ad (No Campaign) --</option>
                    {campaigns
                      .filter((c) => !advertiserId || c.advertiser_id === advertiserId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ad Type</label>
                  <select
                    value={adType}
                    onChange={(e) => setAdType(e.target.value as AdType)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
                  >
                    <option value="banner">Banner Ad (Leaderboard/Standard)</option>
                    <option value="image">Image Ad (Responsive)</option>
                    <option value="video">Video Ad (Autoplay/Muted)</option>
                    <option value="native">Native Promoted Ad</option>
                    <option value="popup">Popup / Interstitial Modal</option>
                    <option value="in_content">In-Content Story Ad</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Placement Slot *</label>
                  <select
                    value={placementId}
                    onChange={(e) => setPlacementId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white font-mono"
                  >
                    {placements.map((plc) => (
                      <option key={plc.id} value={plc.placement_key}>
                        {plc.name} [{plc.placement_key}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination URL *</label>
                <div className="flex rounded-lg shadow-2xs">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-xs">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="url"
                    required
                    placeholder="https://advertiser.com/landing-page"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={openNewTab}
                    onChange={(e) => setOpenNewTab(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Open in new tab (<code className="text-slate-500">_blank</code>)</span>
                </label>

                <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={status === 'active'}
                    onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                    className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                  />
                  <span>Active immediately</span>
                </label>
              </div>

              {/* Priority & Targeting */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority <span className="font-normal text-slate-500">(1=Highest, 10=Lowest)</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => (
                      <option key={p} value={p}>
                        {p} {p === 1 ? '(Top Priority)' : p === 10 ? '(Lowest Priority)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Pages</label>
                  <input
                    type="text"
                    placeholder="* or /news, /sports"
                    value={targetPages}
                    onChange={(e) => setTargetPages(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Media Selection & Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Media & Asset (R2)</h4>
                <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('upload')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      mediaInputMethod === 'upload' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Upload from PC
                  </button>
                  <button
                    type="button"
                    onClick={() => setMediaInputMethod('url')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      mediaInputMethod === 'url' ? 'bg-white shadow-2xs text-blue-600' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Direct URL
                  </button>
                </div>
              </div>

              {/* Upload from PC Box */}
              {mediaInputMethod === 'upload' ? (
                <div className="space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                      isUploading
                        ? 'border-blue-400 bg-blue-50/50'
                        : mediaUrl
                        ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                        : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
                    }`}
                  >
                    {isUploading ? (
                      <div className="py-3 flex flex-col items-center justify-center space-y-2">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-semibold text-blue-700">Uploading to Cloudflare R2...</p>
                      </div>
                    ) : mediaUrl ? (
                      <div className="flex flex-col items-center space-y-1.5">
                        <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                        <p className="text-xs font-bold text-slate-800">{uploadedFileName || 'Media Uploaded'}</p>
                        {uploadedFileSize && (
                          <p className="text-[11px] text-slate-500">{(uploadedFileSize / 1024 / 1024).toFixed(2)} MB</p>
                        )}
                        <p className="text-[10px] text-emerald-600 font-medium pt-1">Click to replace file</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1.5">
                        <Upload className="w-7 h-7 text-slate-400" />
                        <p className="text-xs font-bold text-slate-800">Click to upload from PC</p>
                        <p className="text-[11px] text-slate-500">JPG, PNG, WEBP, GIF, MP4, WEBM</p>
                        <span className="text-[10px] text-slate-400">Stores into Cloudflare R2 bucket</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Direct URL Input */
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Media URL (Image or MP4 Video)</label>
                  <div className="flex rounded-lg shadow-2xs">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 text-slate-500 text-xs">
                      <LinkIcon className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg or video.mp4"
                      value={mediaUrl}
                      onChange={(e) => {
                        setMediaUrl(e.target.value);
                        if (e.target.value.match(/\.(mp4|webm|mov)(\?.*)?$/i)) {
                          setMediaType('video');
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                    />
                  </div>

                  {/* Sample Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                    <span className="font-semibold text-slate-500">Quick Samples:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaUrl('https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&q=80');
                        setMediaType('image');
                        if (!name) setName('Flash Sale 50% Off');
                        if (destinationUrl === 'https://') setDestinationUrl('https://example.com/deals');
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
                    >
                      🛍️ Sale Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaUrl('https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80');
                        setMediaType('image');
                        if (!name) setName('Cloud SaaS Platform');
                        if (destinationUrl === 'https://') setDestinationUrl('https://example.com/saas');
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
                    >
                      💻 Tech Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMediaUrl('https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80');
                        setMediaType('image');
                        if (!name) setName('Mobile App Download');
                        if (destinationUrl === 'https://') setDestinationUrl('https://example.com/app');
                      }}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-medium"
                    >
                      📱 App Promo
                    </button>
                  </div>
                </div>
              )}

              {/* Native / Popup Additional Copy */}
              {(adType === 'native' || adType === 'popup' || adType === 'in_content') && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <h5 className="text-[11px] font-bold text-slate-700 uppercase">Native / Interstitial Copy</h5>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Headline</label>
                    <input
                      type="text"
                      placeholder="e.g. Next-Generation Cloud AI"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Description</label>
                    <textarea
                      rows={2}
                      placeholder="Short engaging copy for native ad unit..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Call to Action</label>
                    <input
                      type="text"
                      placeholder="Learn More, Shop Now, Sign Up"
                      value={callToAction}
                      onChange={(e) => setCallToAction(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Video settings if video */}
              {mediaType === 'video' && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <h5 className="text-[11px] font-bold text-slate-700 uppercase">Video Playback Configuration</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoMuted}
                        onChange={(e) => setVideoMuted(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Muted by default</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoAutoplay}
                        onChange={(e) => setVideoAutoplay(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Autoplay inline</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoLoop}
                        onChange={(e) => setVideoLoop(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Loop playback</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={videoControls}
                        onChange={(e) => setVideoControls(e.target.checked)}
                        className="rounded text-blue-600"
                      />
                      <span>Show video controls</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Scheduling */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              3. Ad Flight Scheduling (Auto Active / Expired)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-hidden bg-white"
                >
                  <option value="UTC">UTC (Universal Time)</option>
                  <option value="America/New_York">America/New_York (EST/EDT)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                  <option value="Europe/London">Europe/London (GMT/BST)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Live Advertisement Preview Box */}
          {mediaUrl && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  Live Dimension Preview
                </h4>
                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs ${
                      previewDevice === 'desktop' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Monitor className="w-3 h-3" /> Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs ${
                      previewDevice === 'mobile' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    <Smartphone className="w-3 h-3" /> Mobile
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-center items-center overflow-x-auto">
                <div
                  className={`bg-white rounded-lg shadow-2xs border border-slate-200 overflow-hidden relative transition-all duration-200 ${
                    previewDevice === 'mobile' ? 'max-w-[320px] w-full' : 'max-w-[728px] w-full'
                  }`}
                >
                  {mediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      autoPlay={videoAutoplay}
                      muted={videoMuted}
                      loop={videoLoop}
                      controls={videoControls}
                      className="w-full h-auto block"
                    />
                  ) : (
                    <img src={mediaUrl} alt="Ad Preview" className="w-full h-auto block object-cover max-h-[300px]" />
                  )}

                  {headline && (
                    <div className="p-3 bg-white">
                      <h5 className="font-bold text-sm text-slate-900">{headline}</h5>
                      {description && <p className="text-xs text-slate-600 mt-1">{description}</p>}
                      <div className="mt-2 text-xs font-semibold text-blue-600">{callToAction} →</div>
                    </div>
                  )}

                  <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1 rounded pointer-events-none">
                    AD
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              id="btn-cancel-ad-modal"
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="btn-submit-save-ad"
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-all shadow-xs flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving to D1...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{editingAd ? 'Update Advertisement' : 'Save Advertisement'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
