// Cloudflare Pages Function: /api/campaigns
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const url = new URL(request.url);
  const advertiserId = url.searchParams.get('advertiser_id');

  let query = `
    SELECT c.*, a.name as advertiser_name,
    (SELECT COUNT(*) FROM ads WHERE campaign_id = c.id) as total_ads,
    (SELECT COUNT(*) FROM impressions WHERE campaign_id = c.id) as total_impressions,
    (SELECT COUNT(*) FROM clicks WHERE campaign_id = c.id) as total_clicks
    FROM campaigns c
    LEFT JOIN advertisers a ON c.advertiser_id = a.id
  `;
  let params = [];

  if (advertiserId) {
    query += ' WHERE c.advertiser_id = ?';
    params.push(advertiserId);
  }

  query += ' ORDER BY c.created_at DESC';

  const stmt = db.prepare(query);
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  return new Response(JSON.stringify({ success: true, campaigns: result.results || [] }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;
  const body = await request.json();
  const id = body.id || 'cmp_' + Math.random().toString(36).substring(2, 9);
  const { advertiser_id, name, description, start_at, end_at, budget, status } = body;

  if (!name || !advertiser_id) {
    return new Response(JSON.stringify({ error: 'Campaign name and advertiser are required', success: false }), { status: 400 });
  }

  await db.prepare(`
    INSERT INTO campaigns (id, advertiser_id, name, description, start_at, end_at, budget, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(id, advertiser_id, name, description || '', start_at || null, end_at || null, Number(budget) || 0, status || 'active').run();

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const db = env.DB;
  const body = await request.json();
  const { id, advertiser_id, name, description, start_at, end_at, budget, status } = body;

  if (!id || !name) {
    return new Response(JSON.stringify({ error: 'ID and Name are required', success: false }), { status: 400 });
  }

  await db.prepare(`
    UPDATE campaigns
    SET advertiser_id = ?, name = ?, description = ?, start_at = ?, end_at = ?, budget = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(advertiser_id, name, description || '', start_at || null, end_at || null, Number(budget) || 0, status || 'active', id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ error: 'Missing id', success: false }), { status: 400 });

  await db.prepare('DELETE FROM campaigns WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
