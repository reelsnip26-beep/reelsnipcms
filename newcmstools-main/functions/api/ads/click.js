// Cloudflare Pages Function: /api/ads/click
// Tracks Ad Click and Safely Redirects to Destination URL
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);

  const adId = url.searchParams.get('ad_id');
  const placementId = url.searchParams.get('placement') || 'unknown';
  const customDest = url.searchParams.get('dest');

  if (!adId) {
    return new Response('Missing ad_id parameter', { status: 400 });
  }

  let destinationUrl = customDest;
  let campaignId = null;

  // Retrieve ad destination from D1 if not provided in URL
  if (db) {
    try {
      const ad = await db.prepare('SELECT campaign_id, destination_url FROM ads WHERE id = ?').bind(adId).first();
      if (ad) {
        campaignId = ad.campaign_id;
        if (!destinationUrl) {
          destinationUrl = ad.destination_url;
        }
      }

      // Record Click event in D1
      const clickId = 'clk_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const userAgent = request.headers.get('user-agent') || '';
      const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
      const ipHash = clientIp ? btoa(clientIp).substring(0, 16) : '';
      const referrer = request.headers.get('referer') || '';

      // Determine device type
      let deviceType = 'desktop';
      if (/Mobile|Android|iP(hone|od)/i.test(userAgent)) deviceType = 'mobile';
      else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'tablet';

      await db.prepare(`
        INSERT INTO clicks (id, ad_id, campaign_id, placement_id, page_url, referrer, device_type, ip_hash, user_agent, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        clickId, adId, campaignId, placementId,
        referrer, referrer, deviceType, ipHash, userAgent.substring(0, 255)
      ).run();
    } catch (err) {
      console.error('Error recording click in D1:', err);
    }
  }

  // Safe redirect validation (prevent open redirect vulnerabilities)
  if (!destinationUrl) {
    destinationUrl = 'https://google.com';
  }

  // Ensure protocol
  if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
    destinationUrl = 'https://' + destinationUrl;
  }

  return Response.redirect(destinationUrl, 302);
}
