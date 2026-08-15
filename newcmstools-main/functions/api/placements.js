// Cloudflare Pages Function: /api/placements
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const query = `
    SELECT p.*,
      (SELECT COUNT(*) FROM ads WHERE placement_id = p.placement_key OR placement_id = p.id) as total_ads,
      (SELECT COUNT(*) FROM ads WHERE (placement_id = p.placement_key OR placement_id = p.id) AND status = 'active') as active_ads
    FROM placements p
    ORDER BY p.created_at ASC
  `;

  const result = await db.prepare(query).all();
  return new Response(JSON.stringify({ success: true, placements: result.results || [] }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;
  const body = await request.json();
  const id = body.id || 'plc_' + Math.random().toString(36).substring(2, 9);
  const { name, placement_key, description, recommended_width, recommended_height, status } = body;

  if (!name || !placement_key) {
    return new Response(JSON.stringify({ error: 'Name and placement_key are required', success: false }), { status: 400 });
  }

  // Normalize placement key
  const cleanKey = placement_key.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  await db.prepare(`
    INSERT INTO placements (id, name, placement_key, description, recommended_width, recommended_height, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(
    id, name, cleanKey, description || '',
    Number(recommended_width) || 728, Number(recommended_height) || 90,
    status || 'active'
  ).run();

  return new Response(JSON.stringify({ success: true, id, placement_key: cleanKey }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const db = env.DB;
  const body = await request.json();
  const { id, name, description, recommended_width, recommended_height, status } = body;

  if (!id || !name) {
    return new Response(JSON.stringify({ error: 'id and name required' }), { status: 400 });
  }

  await db.prepare(`
    UPDATE placements SET
      name = ?, description = ?, recommended_width = ?, recommended_height = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(name, description || '', Number(recommended_width) || 728, Number(recommended_height) || 90, status || 'active', id).run();

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

  await db.prepare('DELETE FROM placements WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
