// Cloudflare Pages Function: /api/ads
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const url = new URL(request.url);
  const placement = url.searchParams.get('placement');
  const campaignId = url.searchParams.get('campaign_id');
  const advertiserId = url.searchParams.get('advertiser_id');
  const status = url.searchParams.get('status');
  const search = url.searchParams.get('q');

  let query = `
    SELECT a.*, 
      c.name as campaign_name,
      adv.name as advertiser_name,
      p.name as placement_name,
      (SELECT COUNT(*) FROM impressions WHERE ad_id = a.id) as impressions_count,
      (SELECT COUNT(*) FROM clicks WHERE ad_id = a.id) as clicks_count
    FROM ads a
    LEFT JOIN campaigns c ON a.campaign_id = c.id
    LEFT JOIN advertisers adv ON a.advertiser_id = adv.id
    LEFT JOIN placements p ON a.placement_id = p.placement_key OR a.placement_id = p.id
    WHERE 1=1
  `;
  let params = [];

  if (placement) {
    query += ' AND (a.placement_id = ? OR p.placement_key = ?)';
    params.push(placement, placement);
  }
  if (campaignId) {
    query += ' AND a.campaign_id = ?';
    params.push(campaignId);
  }
  if (advertiserId) {
    query += ' AND a.advertiser_id = ?';
    params.push(advertiserId);
  }
  if (status) {
    query += ' AND a.status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (a.name LIKE ? OR a.headline LIKE ? OR a.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY a.created_at DESC';

  const stmt = db.prepare(query);
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  // Compute calculated status based on current time
  const now = new Date().toISOString();
  const ads = (result.results || []).map(ad => {
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
    return { ...ad, effective_status: effectiveStatus };
  });

  return new Response(JSON.stringify({ success: true, ads }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;
  const body = await request.json();
  const id = body.id || 'ad_' + Math.random().toString(36).substring(2, 9);

  const {
    name, campaign_id, advertiser_id, ad_type, media_type, media_url, media_r2_key,
    destination_url, placement_id, headline, description, call_to_action,
    priority, weight, status, start_at, end_at, timezone, open_new_tab,
    video_muted, video_controls, video_loop, video_autoplay, target_pages
  } = body;

  if (!name || !media_url || !destination_url || !placement_id) {
    return new Response(JSON.stringify({
      error: 'Ad Name, Media URL, Destination URL, and Placement are required',
      success: false
    }), { status: 400 });
  }

  await db.prepare(`
    INSERT INTO ads (
      id, campaign_id, advertiser_id, name, ad_type, media_type, media_url, media_r2_key,
      destination_url, placement_id, headline, description, call_to_action,
      priority, weight, status, start_at, end_at, timezone, open_new_tab,
      video_muted, video_controls, video_loop, video_autoplay, target_pages,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
  `).bind(
    id, campaign_id || null, advertiser_id || null, name, ad_type || 'image', media_type || 'image',
    media_url, media_r2_key || null, destination_url, placement_id, headline || '', description || '',
    call_to_action || 'Learn More', Number(priority) || 5, Number(weight) || 1, status || 'active',
    start_at || null, end_at || null, timezone || 'UTC', open_new_tab !== false && open_new_tab !== 0 ? 1 : 0,
    video_muted !== false && video_muted !== 0 ? 1 : 0, video_controls ? 1 : 0,
    video_loop !== false && video_loop !== 0 ? 1 : 0, video_autoplay !== false && video_autoplay !== 0 ? 1 : 0,
    target_pages || '',
  ).run();

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const db = env.DB;
  const body = await request.json();

  const {
    id, name, campaign_id, advertiser_id, ad_type, media_type, media_url, media_r2_key,
    destination_url, placement_id, headline, description, call_to_action,
    priority, weight, status, start_at, end_at, timezone, open_new_tab,
    video_muted, video_controls, video_loop, video_autoplay, target_pages
  } = body;

  if (!id) {
    return new Response(JSON.stringify({ error: 'Ad ID required', success: false }), { status: 400 });
  }

  await db.prepare(`
    UPDATE ads SET
      name = ?, campaign_id = ?, advertiser_id = ?, ad_type = ?, media_type = ?, media_url = ?, media_r2_key = ?,
      destination_url = ?, placement_id = ?, headline = ?, description = ?, call_to_action = ?,
      priority = ?, weight = ?, status = ?, start_at = ?, end_at = ?, timezone = ?, open_new_tab = ?,
      video_muted = ?, video_controls = ?, video_loop = ?, video_autoplay = ?, target_pages = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    name, campaign_id || null, advertiser_id || null, ad_type || 'image', media_type || 'image',
    media_url, media_r2_key || null, destination_url, placement_id, headline || '', description || '',
    call_to_action || 'Learn More', Number(priority) || 5, Number(weight) || 1, status || 'active',
    start_at || null, end_at || null, timezone || 'UTC', open_new_tab !== false && open_new_tab !== 0 ? 1 : 0,
    video_muted !== false && video_muted !== 0 ? 1 : 0, video_controls ? 1 : 0,
    video_loop !== false && video_loop !== 0 ? 1 : 0, video_autoplay !== false && video_autoplay !== 0 ? 1 : 0,
    target_pages || '', id
  ).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  await db.prepare('DELETE FROM ads WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
