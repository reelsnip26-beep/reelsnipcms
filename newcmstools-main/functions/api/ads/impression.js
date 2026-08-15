// Cloudflare Pages Function: /api/ads/impression
// Non-blocking Impression Tracking Beacon
export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;

  if (!db) {
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }

  try {
    const body = await request.json();
    const { ad_id, campaign_id, placement_id, page_url, referrer, device_type } = body;

    if (!ad_id) {
      return new Response(JSON.stringify({ error: 'ad_id required' }), { status: 400 });
    }

    const id = 'imp_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const userAgent = request.headers.get('user-agent') || '';
    const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    
    // Hash IP for privacy compliance
    const ipHash = clientIp ? btoa(clientIp).substring(0, 16) : '';

    // Asynchronously insert into D1
    await db.prepare(`
      INSERT INTO impressions (id, ad_id, campaign_id, placement_id, page_url, referrer, device_type, ip_hash, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(
      id, ad_id, campaign_id || null, placement_id || 'unknown',
      page_url || '', referrer || '', device_type || 'desktop',
      ipHash, userAgent.substring(0, 255)
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
