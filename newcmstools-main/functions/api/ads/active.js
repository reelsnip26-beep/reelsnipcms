// Cloudflare Pages Function: /api/ads/active
// High-Speed Edge Delivery with Rotation, Priority & Schedule Resolution

export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ error: 'Database binding missing', ad: null }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  const url = new URL(request.url);
  const placement = url.searchParams.get('placement') || '';
  const pagePath = url.searchParams.get('page') || '';
  const rotationMode = url.searchParams.get('rotation') || 'priority'; // 'priority', 'random', 'equal'

  const now = new Date().toISOString();

  // Query ads that match placement, active status, within schedule, and where campaign (if any) is also active
  const query = `
    SELECT a.* 
    FROM ads a
    LEFT JOIN campaigns c ON a.campaign_id = c.id
    WHERE (a.placement_id = ? OR a.placement_id IN (SELECT id FROM placements WHERE placement_key = ?))
      AND a.status = 'active'
      AND (a.start_at IS NULL OR a.start_at <= ?)
      AND (a.end_at IS NULL OR a.end_at >= ?)
      AND (c.status IS NULL OR c.status = 'active')
    ORDER BY a.priority ASC, a.created_at DESC
  `;

  try {
    const result = await db.prepare(query).bind(placement, placement, now, now).all();
    const candidateAds = result.results || [];

    if (candidateAds.length === 0) {
      return new Response(JSON.stringify({ ad: null, count: 0 }), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=10, s-maxage=30', // Edge caching with fast invalidation
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Filter by target pages if specified
    const matchedAds = candidateAds.filter(ad => {
      if (!ad.target_pages || ad.target_pages.trim() === '' || ad.target_pages === '*') return true;
      const patterns = ad.target_pages.split(',').map(p => p.trim());
      return patterns.some(pattern => {
        if (pattern === '*' || pagePath.includes(pattern)) return true;
        return false;
      });
    });

    const adsToPickFrom = matchedAds.length > 0 ? matchedAds : candidateAds;

    // Ad Selection Algorithm
    let chosenAd = adsToPickFrom[0];

    if (rotationMode === 'random' || rotationMode === 'equal') {
      const randomIndex = Math.floor(Math.random() * adsToPickFrom.length);
      chosenAd = adsToPickFrom[randomIndex];
    } else {
      // Priority-based (group by top priority, then pick weighted or random amongst top priority)
      const topPriority = adsToPickFrom[0].priority;
      const topTierAds = adsToPickFrom.filter(a => a.priority === topPriority);
      if (topTierAds.length > 1) {
        const randomIndex = Math.floor(Math.random() * topTierAds.length);
        chosenAd = topTierAds[randomIndex];
      } else {
        chosenAd = topTierAds[0];
      }
    }

    return new Response(JSON.stringify({
      ad: chosenAd,
      total_eligible: adsToPickFrom.length
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, ad: null }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
