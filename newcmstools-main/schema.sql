-- ============================================================================
-- Cloudflare D1 SQLite Database Schema for AdPush Advertising CMS
-- Designed for high-read, low-latency ad delivery & scalable tracking
-- ============================================================================

-- 1. Advertisers Table
CREATE TABLE IF NOT EXISTS advertisers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    advertiser_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    start_at DATETIME,
    end_at DATETIME,
    budget REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active', -- 'draft', 'scheduled', 'active', 'paused', 'completed', 'expired'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (advertiser_id) REFERENCES advertisers(id) ON DELETE CASCADE
);

-- 3. Placements Table
CREATE TABLE IF NOT EXISTS placements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    placement_key TEXT UNIQUE NOT NULL, -- e.g. 'header-ad', 'sidebar-ad'
    description TEXT,
    recommended_width INTEGER DEFAULT 728,
    recommended_height INTEGER DEFAULT 90,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Ads Table
CREATE TABLE IF NOT EXISTS ads (
    id TEXT PRIMARY KEY,
    campaign_id TEXT,
    advertiser_id TEXT,
    name TEXT NOT NULL,
    ad_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'video', 'banner', 'native', 'popup', 'in_content'
    media_type TEXT NOT NULL DEFAULT 'image', -- 'image', 'video'
    media_url TEXT NOT NULL,
    media_r2_key TEXT,
    destination_url TEXT NOT NULL,
    placement_id TEXT NOT NULL, -- references placements(placement_key) or placements(id)
    headline TEXT,
    description TEXT,
    call_to_action TEXT DEFAULT 'Learn More',
    priority INTEGER NOT NULL DEFAULT 5, -- 1 (highest) to 10 (lowest)
    weight INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'inactive', 'scheduled', 'expired'
    start_at DATETIME,
    end_at DATETIME,
    timezone TEXT DEFAULT 'UTC',
    open_new_tab INTEGER NOT NULL DEFAULT 1, -- 1 = true, 0 = false
    video_muted INTEGER NOT NULL DEFAULT 1,
    video_controls INTEGER NOT NULL DEFAULT 0,
    video_loop INTEGER NOT NULL DEFAULT 1,
    video_autoplay INTEGER NOT NULL DEFAULT 1,
    target_pages TEXT, -- optional comma-separated or JSON page paths
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL,
    FOREIGN KEY (advertiser_id) REFERENCES advertisers(id) ON DELETE SET NULL
);

-- 5. Media Library Table (for Cloudflare R2 files and media assets)
CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'image/png', 'video/mp4', etc.
    file_size INTEGER NOT NULL,
    r2_key TEXT,
    url TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Impressions Tracking Table
CREATE TABLE IF NOT EXISTS impressions (
    id TEXT PRIMARY KEY,
    ad_id TEXT NOT NULL,
    campaign_id TEXT,
    placement_id TEXT NOT NULL,
    page_url TEXT,
    referrer TEXT,
    device_type TEXT, -- 'desktop', 'mobile', 'tablet'
    ip_hash TEXT, -- hashed / anonymized for privacy
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 7. Clicks Tracking Table
CREATE TABLE IF NOT EXISTS clicks (
    id TEXT PRIMARY KEY,
    ad_id TEXT NOT NULL,
    campaign_id TEXT,
    placement_id TEXT NOT NULL,
    page_url TEXT,
    referrer TEXT,
    device_type TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. CMS Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- High-Performance Indexes for Sub-Millisecond Ad Delivery & Analytics
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ads_delivery ON ads (placement_id, status, start_at, end_at, priority);
CREATE INDEX IF NOT EXISTS idx_ads_campaign ON ads (campaign_id);
CREATE INDEX IF NOT EXISTS idx_ads_advertiser ON ads (advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser ON campaigns (advertiser_id);
CREATE INDEX IF NOT EXISTS idx_impressions_ad_created ON impressions (ad_id, created_at);
CREATE INDEX IF NOT EXISTS idx_impressions_campaign_created ON impressions (campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_impressions_placement_created ON impressions (placement_id, created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_ad_created ON clicks (ad_id, created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_campaign_created ON clicks (campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_clicks_placement_created ON clicks (placement_id, created_at);

-- ============================================================================
-- Initial Default Placements
-- ============================================================================
INSERT OR IGNORE INTO placements (id, name, placement_key, description, recommended_width, recommended_height, status)
VALUES 
    ('plc_header', 'Header Leaderboard', 'header-ad', 'Prominent top-of-page ad banner across all website pages', 728, 90, 'active'),
    ('plc_top_banner', 'Top Sticky Banner', 'top-banner', 'Full-width top bar advertisement for announcements & promotions', 970, 90, 'active'),
    ('plc_sidebar', 'Sidebar Medium Rectangle', 'sidebar-ad', 'High-visibility sidebar banner for desktop and tablet layouts', 300, 250, 'active'),
    ('plc_in_content', 'In-Content Story Ad', 'article-ad', 'Embedded native/banner ad between article paragraphs', 600, 300, 'active'),
    ('plc_footer', 'Footer Banner', 'footer-ad', 'Bottom footer horizontal banner for exit engagement', 728, 90, 'active'),
    ('plc_video_preroll', 'Video Pre-Roll / In-Stream', 'video-ad', 'Video player pre-roll and mid-roll commercial units', 640, 360, 'active'),
    ('plc_popup', 'Modal Interstitial / Popup', 'popup-ad', 'High-converting interactive overlay modal ad unit', 500, 400, 'active');

-- ============================================================================
-- Initial Settings
-- ============================================================================
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('site_name', 'AdPush Cloudflare CMS'),
    ('api_base_url', ''),
    ('default_video_muted', 'true'),
    ('default_rotation', 'priority'), -- 'priority', 'random', 'equal'
    ('default_timezone', 'UTC'),
    ('max_image_mb', '10'),
    ('max_video_mb', '100'),
    ('r2_public_url', 'https://media.yourdomain.com'),
    ('retention_days', '90'),
    ('admin_email', 'admin@adpush.local');
