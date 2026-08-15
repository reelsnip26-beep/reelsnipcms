import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';

const app = express();
const PORT = 3000;

// Global CORS & Request Handling
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure data and uploads directories exist
const dataDir = path.join(process.cwd(), 'data');
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Serve ad-loader.js correctly as a standalone JS file with proper content type and CORS
app.get('/ad-loader.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const filePath = path.join(process.cwd(), 'public', 'ad-loader.js');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('// ad-loader.js not found');
  }
});

// Serve a standalone test page for direct testing
app.get('/embed-test.html', (_req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AdPush Live Embed Test Page</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 24px; }
    .container { max-width: 900px; margin: 0 auto; background: #ffffff; padding: 28px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    h1 { margin-top: 0; font-size: 24px; color: #0f172a; }
    .slot-box { margin: 20px 0; padding: 14px; background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 8px; text-align: center; }
    .slot-label { font-size: 11px; font-weight: bold; color: #64748b; margin-bottom: 8px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 AdPush Real-Time Advertising Embed Test</h1>
    <p>This standalone page uses <code>&lt;script src="/ad-loader.js" async&gt;&lt;/script&gt;</code> to fetch and display ads from your CMS in real time.</p>
    
    <div class="slot-box">
      <div class="slot-label">Placement Slot: #header-ad (728x90)</div>
      <div id="header-ad"></div>
    </div>

    <div style="display: flex; gap: 20px; margin: 20px 0;">
      <div style="flex: 2;">
        <h2>Publishing Article Title</h2>
        <p>Live text content on a client website. The in-article ad slot is injected directly below.</p>
        <div class="slot-box">
          <div class="slot-label">Placement Slot: #article-ad</div>
          <div id="article-ad"></div>
        </div>
        <p>Below the ad, article reading continues uninterrupted.</p>
        
        <div class="slot-box">
          <div class="slot-label">Placement Slot: #video-ad</div>
          <div id="video-ad"></div>
        </div>
      </div>
      <div style="flex: 1;">
        <div class="slot-box">
          <div class="slot-label">Placement Slot: #sidebar-ad (300x250)</div>
          <div id="sidebar-ad"></div>
        </div>
      </div>
    </div>

    <div class="slot-box">
      <div class="slot-label">Placement Slot: #footer-ad</div>
      <div id="footer-ad"></div>
    </div>
  </div>

  <script src="/ad-loader.js" async></script>
</body>
</html>`);
});

// Setup Multer for PC Image and Video uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'adpush-' + uniqueSuffix + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB max
});

// Database file persistence
const dbFilePath = path.join(dataDir, 'database.json');

interface DatabaseSchema {
  advertisers: any[];
  campaigns: any[];
  placements: any[];
  ads: any[];
  media: any[];
  impressions: any[];
  clicks: any[];
  settings: Record<string, string>;
  activities: any[];
}

function getInitialDatabase(): DatabaseSchema {
  return {
    advertisers: [
      {
        id: 'adv_nike',
        name: 'Apex Athletics',
        company: 'Apex Global Sports Inc.',
        email: 'partnerships@apexsports.io',
        phone: '+1 (555) 234-5678',
        website: 'https://apexsports.io',
        notes: 'Premium athletic gear sponsor for sports and lifestyle sections.',
        status: 'active',
        created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'adv_saas',
        name: 'CloudScale AI',
        company: 'CloudScale Technologies Ltd.',
        email: 'ads@cloudscale.tech',
        phone: '+1 (555) 890-1234',
        website: 'https://cloudscale.tech',
        notes: 'Developer infrastructure & AI API platform.',
        status: 'active',
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'adv_pulse',
        name: 'Pulse Zero Energy',
        company: 'Pulse Beverages LLC',
        email: 'marketing@pulseenergy.com',
        phone: '+1 (555) 345-9876',
        website: 'https://pulseenergy.com',
        notes: 'High-energy brand targeting youth & tech audience.',
        status: 'active',
        created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    campaigns: [
      {
        id: 'cmp_summer_surge',
        advertiser_id: 'adv_nike',
        name: 'Summer HyperSpeed Launch 2026',
        description: 'Global promotional campaign for the next-gen athletic footwear series.',
        start_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        end_at: new Date(Date.now() + 27 * 86400000).toISOString(),
        budget: 15000,
        status: 'active',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cmp_dev_tier',
        advertiser_id: 'adv_saas',
        name: 'CloudScale Developer Q3 Push',
        description: 'Targeted in-content and header banner push for developer tools.',
        start_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        end_at: new Date(Date.now() + 20 * 86400000).toISOString(),
        budget: 8500,
        status: 'active',
        created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'cmp_pulse_launch',
        advertiser_id: 'adv_pulse',
        name: 'Pulse Zero Formula 1 Collab',
        description: 'High impact video pre-roll and popup ad campaign.',
        start_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        end_at: new Date(Date.now() + 14 * 86400000).toISOString(),
        budget: 22000,
        status: 'active',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    placements: [
      {
        id: 'plc_header',
        name: 'Header Leaderboard',
        placement_key: 'header-ad',
        description: 'Prime top-of-page banner (728x90 / responsive) across site pages.',
        recommended_width: 728,
        recommended_height: 90,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'plc_top_banner',
        name: 'Top Announcement Bar',
        placement_key: 'top-banner',
        description: 'Full width hero announcement placement for high CTR.',
        recommended_width: 970,
        recommended_height: 90,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'plc_sidebar',
        name: 'Sidebar Medium Rectangle',
        placement_key: 'sidebar-ad',
        description: 'Sticky 300x250 sidebar placement with high viewability.',
        recommended_width: 300,
        recommended_height: 250,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'plc_article',
        name: 'In-Content Story Banner',
        placement_key: 'article-ad',
        description: 'Dynamic responsive native/story banner between article paragraphs.',
        recommended_width: 600,
        recommended_height: 300,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'plc_footer',
        name: 'Footer Exit Banner',
        placement_key: 'footer-ad',
        description: '728x90 bottom footer banner for exit-intent engagement.',
        recommended_width: 728,
        recommended_height: 90,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'plc_video',
        name: 'Video In-Stream / Pre-Roll',
        placement_key: 'video-ad',
        description: '16:9 commercial video unit with autoplay and muted audio.',
        recommended_width: 640,
        recommended_height: 360,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: 'plc_popup',
        name: 'Popup / Interstitial Modal',
        placement_key: 'popup-ad',
        description: 'High converting overlay interstitial modal for promotions.',
        recommended_width: 500,
        recommended_height: 400,
        status: 'active',
        created_at: new Date(Date.now() - 30 * 86400000).toISOString()
      }
    ],
    ads: [
      {
        id: 'ad_apex_leaderboard',
        campaign_id: 'cmp_summer_surge',
        advertiser_id: 'adv_nike',
        name: 'Apex HyperSpeed Pro - Top Banner',
        ad_type: 'banner',
        media_type: 'image',
        media_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
        media_r2_key: null,
        destination_url: 'https://apexsports.io/hyperspeed-pro',
        placement_id: 'header-ad',
        headline: 'Break Every Record With HyperSpeed Pro',
        description: 'Engineered with carbon-weave foam for 40% more energy return.',
        call_to_action: 'Shop Now',
        priority: 1,
        weight: 1,
        status: 'active',
        start_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        end_at: new Date(Date.now() + 25 * 86400000).toISOString(),
        timezone: 'UTC',
        open_new_tab: 1,
        video_muted: 1,
        video_controls: 0,
        video_loop: 1,
        video_autoplay: 1,
        target_pages: '*',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ad_cloudscale_sidebar',
        campaign_id: 'cmp_dev_tier',
        advertiser_id: 'adv_saas',
        name: 'CloudScale AI Instant Deployment',
        ad_type: 'native',
        media_type: 'image',
        media_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        media_r2_key: null,
        destination_url: 'https://cloudscale.tech/free-tier',
        placement_id: 'sidebar-ad',
        headline: 'Serverless Edge AI at 10ms Latency',
        description: 'Deploy global models across 300+ edge data centers in 1 click.',
        call_to_action: 'Start Free Trial',
        priority: 1,
        weight: 1,
        status: 'active',
        start_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        end_at: new Date(Date.now() + 15 * 86400000).toISOString(),
        timezone: 'UTC',
        open_new_tab: 1,
        video_muted: 1,
        video_controls: 0,
        video_loop: 1,
        video_autoplay: 1,
        target_pages: '*',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ad_pulse_video',
        campaign_id: 'cmp_pulse_launch',
        advertiser_id: 'adv_pulse',
        name: 'Pulse Formula 1 Extreme Video Ad',
        ad_type: 'video',
        media_type: 'video',
        media_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        media_r2_key: null,
        destination_url: 'https://pulseenergy.com/f1-formula',
        placement_id: 'video-ad',
        headline: 'Unleash Zero Sugar Intensity',
        description: 'Natural caffeine and nootropics for laser-sharp focus.',
        call_to_action: 'Claim Sample',
        priority: 2,
        weight: 1,
        status: 'active',
        start_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        end_at: new Date(Date.now() + 10 * 86400000).toISOString(),
        timezone: 'UTC',
        open_new_tab: 1,
        video_muted: 1,
        video_controls: 1,
        video_loop: 1,
        video_autoplay: 1,
        target_pages: '*',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'ad_cloudscale_incontent',
        campaign_id: 'cmp_dev_tier',
        advertiser_id: 'adv_saas',
        name: 'CloudScale In-Article Story Ad',
        ad_type: 'in_content',
        media_type: 'image',
        media_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        media_r2_key: null,
        destination_url: 'https://cloudscale.tech/benchmarks',
        placement_id: 'article-ad',
        headline: 'Why Top Engineering Teams Migrate to Edge',
        description: 'See the independent 2026 performance benchmark comparison.',
        call_to_action: 'Read Report',
        priority: 3,
        weight: 1,
        status: 'active',
        start_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        end_at: new Date(Date.now() + 20 * 86400000).toISOString(),
        timezone: 'UTC',
        open_new_tab: 1,
        video_muted: 1,
        video_controls: 0,
        video_loop: 1,
        video_autoplay: 1,
        target_pages: '*',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    media: [
      {
        id: 'med_apex_shoes',
        file_name: 'hyperspeed-pro-hero.jpg',
        file_type: 'image/jpeg',
        file_size: 420000,
        r2_key: 'ads/images/hyperspeed-pro-hero.jpg',
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80',
        created_at: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: 'med_cloudscale_dash',
        file_name: 'cloudscale-dashboard.jpg',
        file_type: 'image/jpeg',
        file_size: 380000,
        r2_key: 'ads/images/cloudscale-dashboard.jpg',
        url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
        created_at: new Date(Date.now() - 7 * 86400000).toISOString()
      },
      {
        id: 'med_pulse_video',
        file_name: 'pulse-f1-commercial.mp4',
        file_type: 'video/mp4',
        file_size: 14500000,
        r2_key: 'ads/videos/pulse-f1-commercial.mp4',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: 'med_tech_chip',
        file_name: 'edge-silicon-chip.jpg',
        file_type: 'image/jpeg',
        file_size: 512000,
        r2_key: 'ads/images/edge-silicon-chip.jpg',
        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        created_at: new Date(Date.now() - 4 * 86400000).toISOString()
      }
    ],
    impressions: [
      { id: 'imp_1', ad_id: 'ad_apex_leaderboard', campaign_id: 'cmp_summer_surge', placement_id: 'header-ad', page_url: 'https://mywebsite.com/', referrer: 'https://google.com', device_type: 'desktop', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: 'imp_2', ad_id: 'ad_apex_leaderboard', campaign_id: 'cmp_summer_surge', placement_id: 'header-ad', page_url: 'https://mywebsite.com/news', referrer: 'https://twitter.com', device_type: 'mobile', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      { id: 'imp_3', ad_id: 'ad_cloudscale_sidebar', campaign_id: 'cmp_dev_tier', placement_id: 'sidebar-ad', page_url: 'https://mywebsite.com/blog', referrer: 'https://google.com', device_type: 'desktop', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      { id: 'imp_4', ad_id: 'ad_pulse_video', campaign_id: 'cmp_pulse_launch', placement_id: 'video-ad', page_url: 'https://mywebsite.com/watch', referrer: 'direct', device_type: 'desktop', created_at: new Date(Date.now() - 5 * 3600000).toISOString() },
      { id: 'imp_5', ad_id: 'ad_cloudscale_incontent', campaign_id: 'cmp_dev_tier', placement_id: 'article-ad', page_url: 'https://mywebsite.com/article/1', referrer: 'https://linkedin.com', device_type: 'mobile', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'imp_6', ad_id: 'ad_apex_leaderboard', campaign_id: 'cmp_summer_surge', placement_id: 'header-ad', page_url: 'https://mywebsite.com/', referrer: 'https://google.com', device_type: 'desktop', created_at: new Date(Date.now() - 1 * 3600000).toISOString() }
    ],
    clicks: [
      { id: 'clk_1', ad_id: 'ad_apex_leaderboard', campaign_id: 'cmp_summer_surge', placement_id: 'header-ad', page_url: 'https://mywebsite.com/', referrer: 'https://google.com', device_type: 'desktop', created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: 'clk_2', ad_id: 'ad_cloudscale_sidebar', campaign_id: 'cmp_dev_tier', placement_id: 'sidebar-ad', page_url: 'https://mywebsite.com/blog', referrer: 'https://google.com', device_type: 'desktop', created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
      { id: 'clk_3', ad_id: 'ad_pulse_video', campaign_id: 'cmp_pulse_launch', placement_id: 'video-ad', page_url: 'https://mywebsite.com/watch', referrer: 'direct', device_type: 'desktop', created_at: new Date(Date.now() - 4 * 3600000).toISOString() }
    ],
    settings: {
      site_name: 'AdPush Cloudflare CMS',
      api_base_url: '',
      default_video_muted: 'true',
      default_rotation: 'priority',
      default_timezone: 'UTC',
      max_image_mb: '10',
      max_video_mb: '100',
      r2_public_url: 'https://media.yourdomain.com',
      retention_days: '90',
      admin_email: 'admin@adpush.local'
    },
    activities: [
      { id: 'act_1', action: 'Ad Pushed', details: 'Pushed Apex HyperSpeed Pro to Header Leaderboard (Priority: 1)', created_at: new Date(Date.now() - 2 * 3600000).toISOString() },
      { id: 'act_2', action: 'Campaign Started', details: 'Started campaign: Summer HyperSpeed Launch 2026', created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      { id: 'act_3', action: 'Advertiser Added', details: 'Added new advertiser: Apex Athletics', created_at: new Date(Date.now() - 7 * 86400000).toISOString() }
    ]
  };
}

function loadDB(): DatabaseSchema {
  try {
    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading db file, reinitializing default:', err);
  }
  const initial = getInitialDatabase();
  saveDB(initial);
  return initial;
}

function saveDB(data: DatabaseSchema) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db file:', err);
  }
}

let db = loadDB();

function logActivity(action: string, details: string) {
  const activity = {
    id: 'act_' + Math.random().toString(36).substring(2, 9),
    action,
    details,
    created_at: new Date().toISOString()
  };
  db.activities.unshift(activity);
  if (db.activities.length > 50) db.activities.pop();
  saveDB(db);
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', engine: 'Cloudflare D1 & R2 Ready', timestamp: new Date().toISOString() });
});

// 2. Auth
app.post('/api/auth', (req, res) => {
  const { email, password } = req.body;
  if (email && password) {
    const token = 'adpush_sess_' + Buffer.from(`${email}:${Date.now()}`).toString('base64');
    return res.json({
      success: true,
      user: { email, role: 'admin', name: 'Master Administrator' },
      token
    });
  }
  res.status(401).json({ success: false, error: 'Email and password required' });
});

// 3. Advertisers
app.get('/api/advertisers', (req, res) => {
  const q = String(req.query.q || '').toLowerCase();
  let list = db.advertisers;
  if (q) {
    list = list.filter(a =>
      a.name.toLowerCase().includes(q) ||
      (a.company && a.company.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q))
    );
  }
  res.json({ success: true, advertisers: list });
});

app.post('/api/advertisers', (req, res) => {
  const { name, company, email, phone, website, notes, status } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'Advertiser name is required' });

  const newAdv = {
    id: req.body.id || 'adv_' + Math.random().toString(36).substring(2, 9),
    name,
    company: company || '',
    email: email || '',
    phone: phone || '',
    website: website || '',
    notes: notes || '',
    status: status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.advertisers.unshift(newAdv);
  logActivity('Advertiser Added', `Created advertiser "${name}" (${company || 'Direct'})`);
  saveDB(db);
  res.json({ success: true, advertiser: newAdv });
});

app.put('/api/advertisers', (req, res) => {
  const { id, name, company, email, phone, website, notes, status } = req.body;
  const idx = db.advertisers.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Advertiser not found' });

  db.advertisers[idx] = {
    ...db.advertisers[idx],
    name: name || db.advertisers[idx].name,
    company: company !== undefined ? company : db.advertisers[idx].company,
    email: email !== undefined ? email : db.advertisers[idx].email,
    phone: phone !== undefined ? phone : db.advertisers[idx].phone,
    website: website !== undefined ? website : db.advertisers[idx].website,
    notes: notes !== undefined ? notes : db.advertisers[idx].notes,
    status: status || db.advertisers[idx].status,
    updated_at: new Date().toISOString()
  };

  logActivity('Advertiser Updated', `Updated profile for "${db.advertisers[idx].name}"`);
  saveDB(db);
  res.json({ success: true, advertiser: db.advertisers[idx] });
});

app.delete('/api/advertisers', (req, res) => {
  const id = String(req.query.id || req.body.id);
  const target = db.advertisers.find(a => a.id === id);
  if (!target) return res.status(404).json({ success: false, error: 'Advertiser not found' });

  db.advertisers = db.advertisers.filter(a => a.id !== id);
  logActivity('Advertiser Deleted', `Removed advertiser "${target.name}"`);
  saveDB(db);
  res.json({ success: true });
});

// 4. Campaigns
app.get('/api/campaigns', (req, res) => {
  const advId = req.query.advertiser_id;
  let list = db.campaigns.map(c => {
    const adv = db.advertisers.find(a => a.id === c.advertiser_id);
    const campaignAds = db.ads.filter(a => a.campaign_id === c.id);
    const totalImpressions = db.impressions.filter(i => i.campaign_id === c.id).length;
    const totalClicks = db.clicks.filter(cl => cl.campaign_id === c.id).length;
    return {
      ...c,
      advertiser_name: adv ? adv.name : 'Unknown Advertiser',
      total_ads: campaignAds.length,
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      ctr: totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00'
    };
  });

  if (advId) {
    list = list.filter(c => c.advertiser_id === advId);
  }
  res.json({ success: true, campaigns: list });
});

app.post('/api/campaigns', (req, res) => {
  const { advertiser_id, name, description, start_at, end_at, budget, status } = req.body;
  if (!name || !advertiser_id) {
    return res.status(400).json({ success: false, error: 'Campaign name and advertiser are required' });
  }

  const newCmp = {
    id: req.body.id || 'cmp_' + Math.random().toString(36).substring(2, 9),
    advertiser_id,
    name,
    description: description || '',
    start_at: start_at || null,
    end_at: end_at || null,
    budget: Number(budget) || 0,
    status: status || 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.campaigns.unshift(newCmp);
  logActivity('Campaign Created', `Created campaign "${name}" with budget $${newCmp.budget}`);
  saveDB(db);
  res.json({ success: true, campaign: newCmp });
});

app.put('/api/campaigns', (req, res) => {
  const { id, advertiser_id, name, description, start_at, end_at, budget, status } = req.body;
  const idx = db.campaigns.findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Campaign not found' });

  db.campaigns[idx] = {
    ...db.campaigns[idx],
    advertiser_id: advertiser_id || db.campaigns[idx].advertiser_id,
    name: name || db.campaigns[idx].name,
    description: description !== undefined ? description : db.campaigns[idx].description,
    start_at: start_at !== undefined ? start_at : db.campaigns[idx].start_at,
    end_at: end_at !== undefined ? end_at : db.campaigns[idx].end_at,
    budget: budget !== undefined ? Number(budget) : db.campaigns[idx].budget,
    status: status || db.campaigns[idx].status,
    updated_at: new Date().toISOString()
  };

  logActivity('Campaign Updated', `Updated campaign "${db.campaigns[idx].name}" (Status: ${db.campaigns[idx].status})`);
  saveDB(db);
  res.json({ success: true, campaign: db.campaigns[idx] });
});

app.delete('/api/campaigns', (req, res) => {
  const id = String(req.query.id || req.body.id);
  const target = db.campaigns.find(c => c.id === id);
  if (!target) return res.status(404).json({ success: false, error: 'Campaign not found' });

  db.campaigns = db.campaigns.filter(c => c.id !== id);
  logActivity('Campaign Deleted', `Deleted campaign "${target.name}"`);
  saveDB(db);
  res.json({ success: true });
});

// 5. Placements
app.get('/api/placements', (_req, res) => {
  const list = db.placements.map(p => {
    const matchedAds = db.ads.filter(a => a.placement_id === p.placement_key || a.placement_id === p.id);
    const activeAds = matchedAds.filter(a => a.status === 'active');
    return {
      ...p,
      total_ads: matchedAds.length,
      active_ads: activeAds.length
    };
  });
  res.json({ success: true, placements: list });
});

app.post('/api/placements', (req, res) => {
  const { name, placement_key, description, recommended_width, recommended_height, status } = req.body;
  if (!name || !placement_key) return res.status(400).json({ success: false, error: 'Name and placement_key required' });

  const cleanKey = placement_key.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
  const existing = db.placements.find(p => p.placement_key === cleanKey);
  if (existing) return res.status(400).json({ success: false, error: `Placement key "${cleanKey}" already exists` });

  const newPlacement = {
    id: req.body.id || 'plc_' + Math.random().toString(36).substring(2, 9),
    name,
    placement_key: cleanKey,
    description: description || '',
    recommended_width: Number(recommended_width) || 728,
    recommended_height: Number(recommended_height) || 90,
    status: status || 'active',
    created_at: new Date().toISOString()
  };

  db.placements.push(newPlacement);
  logActivity('Placement Created', `Added placement slot "${name}" (${cleanKey})`);
  saveDB(db);
  res.json({ success: true, placement: newPlacement });
});

app.put('/api/placements', (req, res) => {
  const { id, name, description, recommended_width, recommended_height, status } = req.body;
  const idx = db.placements.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Placement not found' });

  db.placements[idx] = {
    ...db.placements[idx],
    name: name || db.placements[idx].name,
    description: description !== undefined ? description : db.placements[idx].description,
    recommended_width: recommended_width ? Number(recommended_width) : db.placements[idx].recommended_width,
    recommended_height: recommended_height ? Number(recommended_height) : db.placements[idx].recommended_height,
    status: status || db.placements[idx].status
  };

  logActivity('Placement Updated', `Updated placement slot "${db.placements[idx].name}"`);
  saveDB(db);
  res.json({ success: true, placement: db.placements[idx] });
});

app.delete('/api/placements', (req, res) => {
  const id = String(req.query.id || req.body.id);
  db.placements = db.placements.filter(p => p.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// 6. Ads Management (CRUD + Resolution)
app.get('/api/ads', (req, res) => {
  const { placement, campaign_id, advertiser_id, status, q } = req.query;
  const now = new Date().toISOString();

  let list = db.ads.map(ad => {
    const adv = db.advertisers.find(a => a.id === ad.advertiser_id);
    const cmp = db.campaigns.find(c => c.id === ad.campaign_id);
    const plc = db.placements.find(p => p.placement_key === ad.placement_id || p.id === ad.placement_id);
    const impressions = db.impressions.filter(i => i.ad_id === ad.id).length;
    const clicks = db.clicks.filter(cl => cl.ad_id === ad.id).length;

    let effectiveStatus = ad.status;
    if (ad.status === 'active' || ad.status === 'scheduled') {
      if (ad.start_at && ad.start_at > now) {
        effectiveStatus = 'scheduled';
      } else if (ad.end_at && ad.end_at < now) {
        effectiveStatus = 'expired';
      } else {
        effectiveStatus = 'active';
      }
    }

    return {
      ...ad,
      advertiser_name: adv ? adv.name : 'Unknown Advertiser',
      campaign_name: cmp ? cmp.name : 'Direct Ad',
      placement_name: plc ? plc.name : ad.placement_id,
      impressions_count: impressions,
      clicks_count: clicks,
      ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
      effective_status: effectiveStatus
    };
  });

  if (placement) {
    list = list.filter(a => a.placement_id === placement || a.placement_name === placement);
  }
  if (campaign_id) {
    list = list.filter(a => a.campaign_id === campaign_id);
  }
  if (advertiser_id) {
    list = list.filter(a => a.advertiser_id === advertiser_id);
  }
  if (status) {
    list = list.filter(a => a.effective_status === status || a.status === status);
  }
  if (q) {
    const search = String(q).toLowerCase();
    list = list.filter(a =>
      a.name.toLowerCase().includes(search) ||
      (a.headline && a.headline.toLowerCase().includes(search)) ||
      (a.description && a.description.toLowerCase().includes(search))
    );
  }

  res.json({ success: true, ads: list });
});

app.post('/api/ads', (req, res) => {
  const {
    name, campaign_id, advertiser_id, ad_type, media_type, media_url, media_r2_key,
    destination_url, placement_id, headline, description, call_to_action,
    priority, weight, status, start_at, end_at, timezone, open_new_tab,
    video_muted, video_controls, video_loop, video_autoplay, target_pages
  } = req.body;

  if (!name || !media_url || !destination_url || !placement_id) {
    return res.status(400).json({
      success: false,
      error: 'Ad Name, Media URL, Destination URL, and Placement are required'
    });
  }

  const newAd = {
    id: req.body.id || 'ad_' + Math.random().toString(36).substring(2, 9),
    campaign_id: campaign_id || null,
    advertiser_id: advertiser_id || null,
    name,
    ad_type: ad_type || 'banner',
    media_type: media_type || (media_url.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? 'video' : 'image'),
    media_url,
    media_r2_key: media_r2_key || null,
    destination_url,
    placement_id,
    headline: headline || '',
    description: description || '',
    call_to_action: call_to_action || 'Learn More',
    priority: Number(priority) || 5,
    weight: Number(weight) || 1,
    status: status || 'active',
    start_at: start_at || null,
    end_at: end_at || null,
    timezone: timezone || 'UTC',
    open_new_tab: open_new_tab !== false && open_new_tab !== 0 ? 1 : 0,
    video_muted: video_muted !== false && video_muted !== 0 ? 1 : 0,
    video_controls: video_controls ? 1 : 0,
    video_loop: video_loop !== false && video_loop !== 0 ? 1 : 0,
    video_autoplay: video_autoplay !== false && video_autoplay !== 0 ? 1 : 0,
    target_pages: target_pages || '*',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  db.ads.unshift(newAd);
  logActivity('Ad Created', `Created ${newAd.ad_type} advertisement "${name}" for slot [${placement_id}]`);
  saveDB(db);
  res.json({ success: true, ad: newAd });
});

app.put('/api/ads', (req, res) => {
  const { id } = req.body;
  const idx = db.ads.findIndex(a => a.id === id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Ad not found' });

  db.ads[idx] = {
    ...db.ads[idx],
    ...req.body,
    priority: req.body.priority !== undefined ? Number(req.body.priority) : db.ads[idx].priority,
    updated_at: new Date().toISOString()
  };

  logActivity('Ad Updated', `Updated advertisement "${db.ads[idx].name}"`);
  saveDB(db);
  res.json({ success: true, ad: db.ads[idx] });
});

app.delete('/api/ads', (req, res) => {
  const id = String(req.query.id || req.body.id);
  const target = db.ads.find(a => a.id === id);
  if (!target) return res.status(404).json({ success: false, error: 'Ad not found' });

  db.ads = db.ads.filter(a => a.id !== id);
  logActivity('Ad Deleted', `Deleted advertisement "${target.name}"`);
  saveDB(db);
  res.json({ success: true });
});

// 7. Ad Push System (Push an ad live to a placement immediately)
app.post('/api/ads/push', (req, res) => {
  const { ad_id, placement_id, priority, start_at, end_at, target_pages, status } = req.body;
  if (!ad_id || !placement_id) {
    return res.status(400).json({ success: false, error: 'ad_id and placement_id are required' });
  }

  const idx = db.ads.findIndex(a => a.id === ad_id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Ad not found' });

  db.ads[idx] = {
    ...db.ads[idx],
    placement_id,
    priority: priority !== undefined ? Number(priority) : db.ads[idx].priority,
    start_at: start_at !== undefined ? start_at : db.ads[idx].start_at,
    end_at: end_at !== undefined ? end_at : db.ads[idx].end_at,
    target_pages: target_pages !== undefined ? target_pages : db.ads[idx].target_pages,
    status: status || 'active',
    updated_at: new Date().toISOString()
  };

  logActivity('Ad Pushed', `PUSHED ad "${db.ads[idx].name}" -> [${placement_id}] (Priority: ${db.ads[idx].priority})`);
  saveDB(db);

  res.json({
    success: true,
    message: `Ad successfully pushed to placement ${placement_id}`,
    ad: db.ads[idx],
    pushed_at: new Date().toISOString()
  });
});

// 8. Public Ad Delivery Endpoint (for ad-loader.js)
app.get('/api/ads/active', (req, res) => {
  const placement = String(req.query.placement || '');
  const pagePath = String(req.query.page || '');
  const rotationMode = String(req.query.rotation || db.settings.default_rotation || 'priority');
  const now = new Date().toISOString();

  // Filter ads by placement, active status, and schedule
  const eligibleAds = db.ads.filter(ad => {
    const matchesPlacement = ad.placement_id === placement ||
      (placement === 'header-ad' && ad.placement_id === 'plc_header') ||
      (placement === 'sidebar-ad' && ad.placement_id === 'plc_sidebar') ||
      (placement === 'article-ad' && ad.placement_id === 'plc_article') ||
      (placement === 'video-ad' && ad.placement_id === 'plc_video') ||
      (placement === 'footer-ad' && ad.placement_id === 'plc_footer') ||
      (placement === 'popup-ad' && ad.placement_id === 'plc_popup') ||
      (placement === 'top-banner' && ad.placement_id === 'plc_top_banner');

    if (!matchesPlacement) return false;
    if (ad.status !== 'active') return false;

    // Check Campaign status if linked
    if (ad.campaign_id) {
      const cmp = db.campaigns.find(c => c.id === ad.campaign_id);
      if (cmp && cmp.status !== 'active') return false;
    }

    // Check start and end dates
    if (ad.start_at && ad.start_at > now) return false;
    if (ad.end_at && ad.end_at < now) return false;

    // Check page target
    if (ad.target_pages && ad.target_pages.trim() !== '' && ad.target_pages !== '*') {
      const patterns = ad.target_pages.split(',').map((p: string) => p.trim());
      const match = patterns.some((p: string) => p === '*' || pagePath.includes(p));
      if (!match) return false;
    }

    return true;
  });

  if (eligibleAds.length === 0) {
    return res.json({ ad: null, total_eligible: 0 });
  }

  // Sort by priority (1 is highest)
  eligibleAds.sort((a, b) => a.priority - b.priority);

  let chosenAd = eligibleAds[0];

  if (rotationMode === 'random' || rotationMode === 'equal') {
    const randomIndex = Math.floor(Math.random() * eligibleAds.length);
    chosenAd = eligibleAds[randomIndex];
  } else {
    // Priority mode: pick from the highest tier
    const topPriority = eligibleAds[0].priority;
    const topTier = eligibleAds.filter(a => a.priority === topPriority);
    if (topTier.length > 1) {
      const randomIndex = Math.floor(Math.random() * topTier.length);
      chosenAd = topTier[randomIndex];
    } else {
      chosenAd = topTier[0];
    }
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ad: chosenAd,
    total_eligible: eligibleAds.length
  });
});

// 9. Impression Tracking Beacon
app.post('/api/ads/impression', (req, res) => {
  const { ad_id, campaign_id, placement_id, page_url, referrer, device_type } = req.body;
  if (!ad_id) return res.status(400).json({ error: 'ad_id required' });

  const imp = {
    id: 'imp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    ad_id,
    campaign_id: campaign_id || null,
    placement_id: placement_id || 'unknown',
    page_url: page_url || '',
    referrer: referrer || '',
    device_type: device_type || 'desktop',
    ip_hash: Buffer.from(req.ip || '127.0.0.1').toString('base64').substring(0, 12),
    user_agent: req.headers['user-agent'] || '',
    created_at: new Date().toISOString()
  };

  db.impressions.push(imp);
  saveDB(db);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ success: true, id: imp.id });
});

// 10. Click Tracking & Destination Redirect
app.get('/api/ads/click', (req, res) => {
  const adId = String(req.query.ad_id || '');
  const placementId = String(req.query.placement || 'unknown');
  const customDest = req.query.dest ? String(req.query.dest) : '';

  let destinationUrl = customDest;
  const ad = db.ads.find(a => a.id === adId);

  if (ad) {
    if (!destinationUrl) destinationUrl = ad.destination_url;
    const clickItem = {
      id: 'clk_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      ad_id: adId,
      campaign_id: ad.campaign_id || null,
      placement_id: placementId,
      page_url: req.headers.referer || '',
      referrer: req.headers.referer || '',
      device_type: /Mobile|Android|iP(hone|od)/i.test(req.headers['user-agent'] || '') ? 'mobile' : 'desktop',
      ip_hash: Buffer.from(req.ip || '127.0.0.1').toString('base64').substring(0, 12),
      user_agent: req.headers['user-agent'] || '',
      created_at: new Date().toISOString()
    };
    db.clicks.push(clickItem);
    logActivity('Ad Clicked', `Visitor clicked on "${ad.name}" from placement [${placementId}]`);
    saveDB(db);
  }

  if (!destinationUrl) destinationUrl = 'https://google.com';
  if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
    destinationUrl = 'https://' + destinationUrl;
  }

  res.redirect(302, destinationUrl);
});

// 11. Media Upload (PC Upload via Multer + URL Register)
app.post('/api/media', upload.single('file'), (req, res) => {
  if (req.file) {
    // Uploaded from PC
    const isVideo = req.file.mimetype.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(path.extname(req.file.originalname).replace('.', '').toLowerCase());
    const publicUrl = `/uploads/${req.file.filename}`;
    const mediaId = 'med_' + Math.random().toString(36).substring(2, 9);

    const newMedia = {
      id: mediaId,
      file_name: req.file.originalname,
      file_type: req.file.mimetype || (isVideo ? 'video/mp4' : 'image/jpeg'),
      file_size: req.file.size,
      r2_key: `ads/${isVideo ? 'videos' : 'images'}/${req.file.filename}`,
      url: publicUrl,
      created_at: new Date().toISOString()
    };

    db.media.unshift(newMedia);
    logActivity('Media Uploaded', `Uploaded PC file "${req.file.originalname}" (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);
    saveDB(db);
    return res.json({ success: true, media: newMedia });
  }

  // URL-based addition
  const { url, file_name, file_type, file_size } = req.body;
  if (!url) return res.status(400).json({ success: false, error: 'File or URL required' });

  const detectedType = file_type || (url.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? 'video/mp4' : 'image/jpeg');
  const mediaId = 'med_' + Math.random().toString(36).substring(2, 9);
  const newMedia = {
    id: mediaId,
    file_name: file_name || 'External Media ' + mediaId,
    file_type: detectedType,
    file_size: Number(file_size) || 0,
    r2_key: null,
    url,
    created_at: new Date().toISOString()
  };

  db.media.unshift(newMedia);
  logActivity('Media Registered', `Added URL asset "${newMedia.file_name}"`);
  saveDB(db);
  res.json({ success: true, media: newMedia });
});

app.get('/api/media', (_req, res) => {
  const mediaList = db.media.map(m => {
    const usedBy = db.ads.filter(a => a.media_url === m.url || (m.r2_key && a.media_r2_key === m.r2_key));
    return {
      ...m,
      usage_count: usedBy.length,
      used_by_ads: usedBy.map(a => ({ id: a.id, name: a.name, status: a.status }))
    };
  });
  res.json({ success: true, media: mediaList });
});

app.delete('/api/media', (req, res) => {
  const id = String(req.query.id || req.body.id);
  const target = db.media.find(m => m.id === id);
  if (!target) return res.status(404).json({ success: false, error: 'Media not found' });

  // Check active ad usage
  const activeAdsUsing = db.ads.filter(a => (a.media_url === target.url || (target.r2_key && a.media_r2_key === target.r2_key)) && a.status === 'active');
  if (activeAdsUsing.length > 0) {
    return res.status(409).json({
      success: false,
      error: `Cannot delete: Media is actively used by ${activeAdsUsing.length} active advertisement(s) (${activeAdsUsing[0].name}).`
    });
  }

  // Remove local uploaded file if exists
  if (target.url.startsWith('/uploads/')) {
    const localFile = path.join(process.cwd(), target.url);
    if (fs.existsSync(localFile)) {
      try { fs.unlinkSync(localFile); } catch (e) {}
    }
  }

  db.media = db.media.filter(m => m.id !== id);
  logActivity('Media Deleted', `Deleted asset "${target.file_name}"`);
  saveDB(db);
  res.json({ success: true });
});

// 12. Analytics
app.get('/api/analytics', (req, res) => {
  const range = String(req.query.range || '7d');
  const now = Date.now();
  let startTime = 0;

  if (range === 'today') {
    startTime = new Date().setHours(0, 0, 0, 0);
  } else if (range === 'yesterday') {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    startTime = yesterday.getTime();
  } else if (range === '7d') {
    startTime = now - 7 * 86400000;
  } else if (range === '30d') {
    startTime = now - 30 * 86400000;
  }

  const filteredImpressions = db.impressions.filter(i => new Date(i.created_at).getTime() >= startTime);
  const filteredClicks = db.clicks.filter(cl => new Date(cl.created_at).getTime() >= startTime);

  const totalImpressions = filteredImpressions.length;
  const totalClicks = filteredClicks.length;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Daily metrics grouping (last 7 days)
  const dailyMap: Record<string, { date: string; impressions: number; clicks: number }> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().split('T')[0];
    dailyMap[d] = { date: d, impressions: 0, clicks: 0 };
  }

  filteredImpressions.forEach(i => {
    const d = i.created_at.split('T')[0];
    if (dailyMap[d]) dailyMap[d].impressions++;
  });

  filteredClicks.forEach(cl => {
    const d = cl.created_at.split('T')[0];
    if (dailyMap[d]) dailyMap[d].clicks++;
  });

  const daily_metrics = Object.values(dailyMap);

  // Breakdown by Ad
  const ads_breakdown = db.ads.map(ad => {
    const imp = filteredImpressions.filter(i => i.ad_id === ad.id).length;
    const clk = filteredClicks.filter(c => c.ad_id === ad.id).length;
    return {
      id: ad.id,
      name: ad.name,
      ad_type: ad.ad_type,
      placement_id: ad.placement_id,
      impressions: imp,
      clicks: clk,
      ctr: imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00'
    };
  }).sort((a, b) => b.impressions - a.impressions);

  // Breakdown by Placement
  const placement_breakdown = db.placements.map(plc => {
    const imp = filteredImpressions.filter(i => i.placement_id === plc.placement_key || i.placement_id === plc.id).length;
    const clk = filteredClicks.filter(c => c.placement_id === plc.placement_key || c.placement_id === plc.id).length;
    return {
      placement_id: plc.placement_key,
      name: plc.name,
      impressions: imp,
      clicks: clk,
      ctr: imp > 0 ? ((clk / imp) * 100).toFixed(2) : '0.00'
    };
  });

  // Device Breakdown
  const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
  filteredImpressions.forEach(i => {
    const dev = i.device_type || 'desktop';
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
  });

  res.json({
    success: true,
    summary: {
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      ctr: Number(ctr),
      total_ads: db.ads.length,
      active_ads: db.ads.filter(a => a.status === 'active').length,
      scheduled_ads: db.ads.filter(a => a.status === 'scheduled').length,
      expired_ads: db.ads.filter(a => a.status === 'expired').length,
      active_campaigns: db.campaigns.filter(c => c.status === 'active').length
    },
    daily_metrics,
    ads_breakdown,
    placement_breakdown,
    device_breakdown: Object.entries(deviceCounts).map(([device_type, count]) => ({ device_type, count })),
    activities: db.activities || []
  });
});

// 13. Settings
app.get('/api/settings', (_req, res) => {
  res.json({ success: true, settings: db.settings });
});

app.post('/api/settings', (req, res) => {
  db.settings = { ...db.settings, ...req.body };
  logActivity('Settings Updated', 'Administrator modified system settings');
  saveDB(db);
  res.json({ success: true, message: 'Settings saved successfully', settings: db.settings });
});

// -------------------------------------------------------------
// VITE INTEGRATION & SERVER STARTUP
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AdPush Cloudflare CMS running on http://localhost:${PORT}`);
  });
}

startServer();
