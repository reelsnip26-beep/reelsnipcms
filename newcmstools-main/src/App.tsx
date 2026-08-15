import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavSection } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { AdPushView } from './components/AdPushView';
import { AdsView } from './components/AdsView';
import { AdvertisersView } from './components/AdvertisersView';
import { CampaignsView } from './components/CampaignsView';
import { PlacementsView } from './components/PlacementsView';
import { EmbedSimulatorView } from './components/EmbedSimulatorView';
import { AnalyticsView } from './components/AnalyticsView';
import { MediaLibraryView } from './components/MediaLibraryView';
import { CloudflareGuideView } from './components/CloudflareGuideView';
import { SettingsView } from './components/SettingsView';
import { CreateAdModal } from './components/CreateAdModal';
import {
  Ad,
  Advertiser,
  Campaign,
  Placement,
  MediaItem,
  AnalyticsSummary,
  ActivityLog,
  CMSSettings
} from './types';
import { api } from './lib/api';

export function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [isSimpleMode, setIsSimpleMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('adpush_simple_mode');
    return saved !== null ? saved === 'true' : true;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSimpleMode = () => {
    setIsSimpleMode((prev) => {
      const next = !prev;
      localStorage.setItem('adpush_simple_mode', String(next));
      return next;
    });
  };

  // Core Data
  const [ads, setAds] = useState<Ad[]>([]);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<CMSSettings>({});

  // Modals & Triggers
  const [isCreateAdModalOpen, setIsCreateAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [pushSelectedAdId, setPushSelectedAdId] = useState<string | undefined>(undefined);

  // Fetch all initial data
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [
        fetchedAds,
        fetchedAdvertisers,
        fetchedCampaigns,
        fetchedPlacements,
        fetchedMedia,
        fetchedAnalytics,
        fetchedSettings
      ] = await Promise.all([
        api.getAds(),
        api.getAdvertisers(),
        api.getCampaigns(),
        api.getPlacements(),
        api.getMedia(),
        api.getAnalytics('7d'),
        api.getSettings(),
      ]);

      setAds(fetchedAds);
      setAdvertisers(fetchedAdvertisers);
      setCampaigns(fetchedCampaigns);
      setPlacements(fetchedPlacements);
      setMedia(fetchedMedia);
      if (fetchedAnalytics?.summary) setSummary(fetchedAnalytics.summary);
      if (fetchedAnalytics?.recent_activity) setActivities(fetchedAnalytics.recent_activity);
      setSettings(fetchedSettings);
    } catch (err) {
      console.error('Failed to load CMS data', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Handlers
  const handleOpenCreateAd = () => {
    setEditingAd(null);
    setIsCreateAdModalOpen(true);
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setIsCreateAdModalOpen(true);
  };

  const handleOpenPushAd = () => {
    setPushSelectedAdId(undefined);
    setCurrentSection('ad_push');
  };

  const handleOpenPushForSpecificAd = (ad: Ad) => {
    setPushSelectedAdId(ad.id);
    setCurrentSection('ad_push');
  };

  const handleAdSaved = (savedAd: Ad) => {
    setAds((prev) => {
      const idx = prev.findIndex((a) => a.id === savedAd.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedAd;
        return next;
      }
      return [savedAd, ...prev];
    });
    loadAllData();
  };

  const handleAdDeleted = (deletedId: string) => {
    setAds((prev) => prev.filter((a) => a.id !== deletedId));
    loadAllData();
  };

  const handleAdUpdated = (updatedAd: Ad) => {
    setAds((prev) => prev.map((a) => (a.id === updatedAd.id ? updatedAd : a)));
  };

  const handleAdPushed = (pushedAd: Ad) => {
    setAds((prev) => prev.map((a) => (a.id === pushedAd.id ? pushedAd : a)));
    loadAllData();
  };

  const activeLiveAdsCount = ads.filter((a) => (a.effective_status || a.status) === 'active').length;

  return (
    <div className="min-h-screen bg-slate-100 flex text-slate-800 font-sans antialiased">
      {/* Left Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => {
          setCurrentSection(sec);
          setIsMobileSidebarOpen(false);
        }}
        activeAdsCount={activeLiveAdsCount}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        isSimpleMode={isSimpleMode}
        onToggleSimpleMode={toggleSimpleMode}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onOpenCreateAd={handleOpenCreateAd}
          onOpenPushAd={handleOpenPushAd}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          onOpenSimulator={() => setCurrentSection('simulator')}
          onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
          isSimpleMode={isSimpleMode}
          onToggleSimpleMode={toggleSimpleMode}
        />

        {/* View Container with scrolling */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentSection === 'dashboard' && (
              <DashboardView
                summary={summary}
                ads={ads}
                campaigns={campaigns}
                advertisers={advertisers}
                placements={placements}
                activities={activities}
                onOpenCreateAd={handleOpenCreateAd}
                onOpenPushAd={handleOpenPushAd}
                onOpenSimulator={() => setCurrentSection('simulator')}
                onViewAds={() => setCurrentSection('ads')}
                onViewAnalytics={() => setCurrentSection('analytics')}
                onAdCreated={handleAdSaved}
                onAdUpdated={handleAdUpdated}
              />
            )}

            {currentSection === 'ad_push' && (
              <AdPushView
                ads={ads}
                placements={placements}
                initialAdId={pushSelectedAdId}
                onAdPushed={handleAdPushed}
                onOpenSimulator={() => setCurrentSection('simulator')}
              />
            )}

            {currentSection === 'ads' && (
              <AdsView
                ads={ads}
                advertisers={advertisers}
                campaigns={campaigns}
                placements={placements}
                onOpenCreateAd={handleOpenCreateAd}
                onEditAd={handleEditAd}
                onOpenPushAdForSpecificAd={handleOpenPushForSpecificAd}
                onAdDeleted={handleAdDeleted}
                onAdUpdated={handleAdUpdated}
              />
            )}

            {currentSection === 'campaigns' && (
              <CampaignsView
                campaigns={campaigns}
                advertisers={advertisers}
                onCampaignSaved={() => loadAllData()}
                onCampaignDeleted={() => loadAllData()}
              />
            )}

            {currentSection === 'advertisers' && (
              <AdvertisersView
                advertisers={advertisers}
                onAdvertiserSaved={() => loadAllData()}
                onAdvertiserDeleted={() => loadAllData()}
                onFilterAdsByAdvertiser={(advId) => {
                  setCurrentSection('ads');
                }}
              />
            )}

            {currentSection === 'placements' && (
              <PlacementsView
                placements={placements}
                onPlacementSaved={() => loadAllData()}
                onPlacementDeleted={() => loadAllData()}
                onFilterAdsByPlacement={(plcKey) => {
                  setCurrentSection('ads');
                }}
              />
            )}

            {currentSection === 'simulator' && (
              <EmbedSimulatorView
                placements={placements}
                ads={ads}
                onAdPushed={handleAdPushed}
                onImpressionTracked={() => loadAllData()}
              />
            )}

            {currentSection === 'analytics' && (
              <AnalyticsView
                initialSummary={summary}
                onOpenPushAd={handleOpenPushAd}
              />
            )}

            {currentSection === 'media' && (
              <MediaLibraryView
                media={media}
                ads={ads}
                onMediaUploaded={() => loadAllData()}
                onMediaDeleted={() => loadAllData()}
              />
            )}

            {currentSection === 'cloudflare' && <CloudflareGuideView />}

            {currentSection === 'settings' && (
              <SettingsView
                initialSettings={settings}
                onSettingsSaved={(newSet) => setSettings(newSet)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Create / Edit Ad Modal */}
      <CreateAdModal
        isOpen={isCreateAdModalOpen}
        onClose={() => setIsCreateAdModalOpen(false)}
        onAdSaved={handleAdSaved}
        advertisers={advertisers}
        campaigns={campaigns}
        placements={placements}
        editingAd={editingAd}
      />
    </div>
  );
}

export default App;
