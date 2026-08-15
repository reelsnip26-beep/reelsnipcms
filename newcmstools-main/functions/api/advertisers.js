// Cloudflare Pages Function: /api/advertisers
export async function onRequestGet(context) {
  const { env, request } = context;
  const db = env.DB;
  if (!db) {
    return new Response(JSON.stringify({ error: 'D1 database binding missing', success: false }), { status: 500 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get('q') || '';

  let query = 'SELECT * FROM advertisers';
  let params = [];

  if (search) {
    query += ' WHERE name LIKE ? OR company LIKE ? OR email LIKE ?';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY created_at DESC';

  const stmt = db.prepare(query);
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();

  return new Response(JSON.stringify({ success: true, advertisers: result.results || [] }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const body = await request.json();
  const id = body.id || 'adv_' + Math.random().toString(36).substring(2, 9);
  const { name, company, email, phone, website, notes, status } = body;

  if (!name) {
    return new Response(JSON.stringify({ error: 'Advertiser name is required', success: false }), { status: 400 });
  }

  await db.prepare(`
    INSERT INTO advertisers (id, name, company, email, phone, website, notes, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).bind(id, name, company || '', email || '', phone || '', website || '', notes || '', status || 'active').run();

  return new Response(JSON.stringify({ success: true, id }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const db = env.DB;
  const body = await request.json();
  const { id, name, company, email, phone, website, notes, status } = body;

  if (!id || !name) {
    return new Response(JSON.stringify({ error: 'ID and Name are required', success: false }), { status: 400 });
  }

  await db.prepare(`
    UPDATE advertisers 
    SET name = ?, company = ?, email = ?, phone = ?, website = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(name, company || '', email || '', phone || '', website || '', notes || '', status || 'active', id).run();

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const db = env.DB;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id', success: false }), { status: 400 });
  }

  await db.prepare('DELETE FROM advertisers WHERE id = ?').bind(id).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
