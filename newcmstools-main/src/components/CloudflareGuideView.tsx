import React, { useState } from 'react';
import {
  Cloud,
  Terminal,
  Database,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Layers,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  GitBranch
} from 'lucide-react';

export const CloudflareGuideView: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [configFormat, setConfigFormat] = useState<'json' | 'toml'>('json');

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const d1CreateCommand = `npx wrangler d1 create adpush-d1-db`;
  const r2CreateCommand = `npx wrangler r2 bucket create adpush-media-bucket`;
  const d1ApplyCommand = `npx wrangler d1 execute adpush-d1-db --file=./schema.sql --remote`;
  const pagesDeployCommand = `npx wrangler pages deploy dist --project-name=adpush-cms`;

  const wranglerJsonConfig = `{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "adpush-cloudflare-cms",
  "pages_build_output_dir": "dist",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "adpush-d1-db",
      "database_id": "YOUR_D1_DATABASE_ID_FROM_CLI"
    }
  ],
  "r2_buckets": [
    {
      "binding": "BUCKET",
      "bucket_name": "adpush-media-bucket"
    }
  ],
  "vars": {
    "ENVIRONMENT": "production",
    "ALLOW_ANONYMOUS_IMPRESSIONS": "true"
  }
}`;

  const wranglerTomlConfig = `# wrangler.toml
name = "adpush-cms"
compatibility_date = "2024-09-01"
pages_build_output_dir = "dist"

# Cloudflare D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "adpush-d1-db"
database_id = "YOUR_D1_DATABASE_ID_FROM_CLI"

# Cloudflare R2 Storage Bucket Binding
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "adpush-media-bucket"`;

  const websiteSnippet = `<!-- 1. Include this placement anywhere in your website HTML -->
<div id="header-ad"></div>

<!-- 2. Include the asynchronous high-speed ad loader before </body> -->
<script src="https://your-adpush-cms.pages.dev/ad-loader.js" async></script>`;

  const jsonSnippet = `// Fetch ad JSON from API and inject into website
fetch('https://your-adpush-cms.pages.dev/api/ads/active?placement=header-ad&page=' + encodeURIComponent(window.location.pathname))
  .then(res => res.json())
  .then(data => {
    if (data && data.ad) {
      document.getElementById('header-ad').innerHTML = 
        \`<a href="\${data.ad.destination_url}" target="_blank">
            <img src="\${data.ad.media_url}" alt="\${data.ad.name}" style="max-width:100%" />
         </a>\`;
    }
  });`;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Hero Guide Card */}
      <div className="bg-slate-900 rounded-xl p-5 text-white border border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold">Cloudflare Pages + D1 + R2 Production Setup</h2>
            <p className="text-xs text-slate-300">
              100% Serverless, Edge-Native, Zero-Cost Cloudflare Infrastructure
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          This system uses <strong>Cloudflare Pages Functions</strong> for backend API routing, <strong>Cloudflare D1 (SQLite)</strong> for edge persistence, and <strong>Cloudflare R2</strong> for image/video assets. No Node.js server, VPS, or external paid database needed!
        </p>
      </div>

      {/* 4 Step Deployment Pipeline */}
      <div className="space-y-4">
        {/* Step 1: Create D1 Database */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Create Cloudflare D1 Database & Execute Schema</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              SQLite Edge
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Run these commands in your project root using Wrangler CLI to provision your D1 database and create tables:
          </p>

          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 text-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Step 1.1: Provision database</span>
              <button
                onClick={() => copyCode(d1CreateCommand, 'd1-create')}
                className="hover:text-white flex items-center gap-1"
              >
                {copiedSection === 'd1-create' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="text-blue-400">{d1CreateCommand}</pre>

            <div className="flex justify-between items-center text-slate-400 text-[11px] pt-2">
              <span>Step 1.2: Execute schema.sql</span>
              <button
                onClick={() => copyCode(d1ApplyCommand, 'd1-apply')}
                className="hover:text-white flex items-center gap-1"
              >
                {copiedSection === 'd1-apply' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="text-emerald-400">{d1ApplyCommand}</pre>
          </div>
        </div>

        {/* Step 2: Create R2 Bucket */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                <span>Create Cloudflare R2 Media Storage Bucket</span>
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Zero Egress Fees
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Create an R2 bucket for direct image and video uploads:
          </p>

          <div className="bg-slate-900 rounded-lg p-3 border border-slate-800 text-slate-200 space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span>Wrangler R2 Create Command</span>
              <button
                onClick={() => copyCode(r2CreateCommand, 'r2-create')}
                className="hover:text-white flex items-center gap-1"
              >
                {copiedSection === 'r2-create' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <pre className="text-blue-400">{r2CreateCommand}</pre>
          </div>
        </div>

        {/* Step 3: Deployment Config (wrangler.json / wrangler.toml) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileCode className="w-4 h-4 text-blue-600" />
                <span>Configure Deployment Bindings (`wrangler.json` or `wrangler.toml`)</span>
              </h3>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  onClick={() => setConfigFormat('json')}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    configFormat === 'json' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  wrangler.json (JSON Code)
                </button>
                <button
                  onClick={() => setConfigFormat('toml')}
                  className={`px-2.5 py-1 rounded font-semibold transition-all ${
                    configFormat === 'toml' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  wrangler.toml
                </button>
              </div>

              <button
                onClick={() =>
                  copyCode(configFormat === 'json' ? wranglerJsonConfig : wranglerTomlConfig, 'wrangler-conf')
                }
                className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold px-2 py-1 bg-slate-50 border border-slate-200 rounded"
              >
                {copiedSection === 'wrangler-conf' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
          </div>

          <pre className="bg-slate-900 text-emerald-400 p-3.5 rounded-lg text-xs font-mono overflow-x-auto border border-slate-800 leading-relaxed">
            {configFormat === 'json' ? wranglerJsonConfig : wranglerTomlConfig}
          </pre>
        </div>

        {/* Step 4: Website Integration (HTML Tag & JSON Code) */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center">
                4
              </span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Embed & Run Ads on Your Website (HTML or JSON API)</span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* HTML Tag Loader */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Option A: HTML Container + Loader</span>
                <button
                  onClick={() => copyCode(websiteSnippet, 'embed-snippet')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                >
                  {copiedSection === 'embed-snippet' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-blue-300 p-3 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
                {websiteSnippet}
              </pre>
            </div>

            {/* Direct JSON Fetch Method */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Option B: JavaScript JSON API Fetch</span>
                <button
                  onClick={() => copyCode(jsonSnippet, 'json-snippet')}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                >
                  {copiedSection === 'json-snippet' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>
              <pre className="bg-slate-900 text-emerald-300 p-3 rounded-lg text-[11px] font-mono overflow-x-auto border border-slate-800">
                {jsonSnippet}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
