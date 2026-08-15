// Cloudflare Pages Function: /api/analytics
// Aggregated Analytics, CTR calculation, Timeline metrics & Breakdown
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const url = new URL(request.url);
  const range = url.searchParams.get('range') || '7d'; // 'today', 'yesterday', '7d', '30d', 'all'
  const adId = url.searchParams.get('ad_id');
  const campaignId = url.searchParams.get('campaign_id');
  const placementId = url.searchParams.get('placement_id');

  // Compute date filter
  let dateCondition = '1=1';
  if (range === 'today') {
    dateCondition = "DATE(created_at) = DATE('now')";
  } else if (range === 'yesterday') {
    dateCondition = "DATE(created_at) = DATE('now', '-1 day')";
  } else if (range === '7d') {
    dateCondition = "created_at >= DATETIME('now', '-7 days')";
  } else if (range === '30d') {
    dateCondition = "created_at >= DATETIME('now', '-30 days')";
  }

  try {
    // 1. Total Impressions
    const impQuery = `SELECT COUNT(*) as count FROM impressions WHERE ${dateCondition}`;
    const impRes = await db.prepare(impQuery).first();
    const totalImpressions = impRes ? Number(impRes.count) : 0;

    // 2. Total Clicks
    const clkQuery = `SELECT COUNT(*) as count FROM clicks WHERE ${dateCondition}`;
    const clkRes = await db.prepare(clkQuery).first();
    const totalClicks = clkRes ? Number(clkRes.count) : 0;

    // 3. CTR
    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

    // 4. Active entities count
    const activeAdsRes = await db.prepare('SELECT COUNT(*) as count FROM ads WHERE status = "active"').first();
    const totalAdsRes = await db.prepare('SELECT COUNT(*) as count FROM ads').first();
    const activeCampaignsRes = await db.prepare('SELECT COUNT(*) as count FROM campaigns WHERE status = "active"').first();

    // 5. Daily Performance Breakdown (last 7 or 30 days)
    const dailyBreakdown = await db.prepare(`
      SELECT 
        DATE(i.created_at) as date,
        COUNT(DISTINCT i.id) as impressions,
        (SELECT COUNT(*) FROM clicks c WHERE DATE(c.created_at) = DATE(i.created_at)) as clicks
      FROM impressions i
      WHERE ${dateCondition}
      GROUP BY DATE(i.created_at)
      ORDER BY date ASC
    `).all();

    // 6. Top Performing Ads Breakdown
    const adsPerformance = await db.prepare(`
      SELECT 
        a.id, a.name, a.ad_type, a.placement_id,
        COUNT(DISTINCT i.id) as impressions,
        (SELECT COUNT(*) FROM clicks c WHERE c.ad_id = a.id) as clicks
      FROM ads a
      LEFT JOIN impressions i ON a.id = i.ad_id
      GROUP BY a.id
      ORDER BY impressions DESC
      LIMIT 10
    `).all();

    // 7. Performance by Placement
    const placementPerformance = await db.prepare(`
      SELECT 
        placement_id,
        COUNT(DISTINCT id) as impressions,
        (SELECT COUNT(*) FROM clicks c WHERE c.placement_id = i.placement_id) as clicks
      FROM impressions i
      GROUP BY placement_id
      ORDER BY impressions DESC
    `).all();

    // 8. Device Breakdown
    const devicePerformance = await db.prepare(`
      SELECT device_type, COUNT(*) as count
      FROM impressions
      WHERE ${dateCondition}
      GROUP BY device_type
    `).all();

    return new Response(JSON.stringify({
      success: true,
      summary: {
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        ctr: Number(ctr),
        total_ads: totalAdsRes ? totalAdsRes.count : 0,
        active_ads: activeAdsRes ? activeAdsRes.count : 0,
        active_campaigns: activeCampaignsRes ? activeCampaignsRes.count : 0,
      },
      daily_metrics: dailyBreakdown.results || [],
      ads_breakdown: (adsPerformance.results || []).map(row => ({
        ...row,
        ctr: row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : '0.00'
      })),
      placement_breakdown: (placementPerformance.results || []).map(row => ({
        ...row,
        ctr: row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : '0.00'
      })),
      device_breakdown: devicePerformance.results || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, success: false }), { status: 500 });
  }
}
