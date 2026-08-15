// Cloudflare Pages Function: /api/settings
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const result = await db.prepare('SELECT key, value FROM settings').all();
  const settingsMap = {};
  (result.results || []).forEach(row => {
    settingsMap[row.key] = row.value;
  });

  return new Response(JSON.stringify({ success: true, settings: settingsMap }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const body = await request.json();
  const entries = Object.entries(body);

  for (const [key, value] of entries) {
    await db.prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).bind(key, String(value)).run();
  }

  return new Response(JSON.stringify({ success: true, message: 'Settings saved successfully' }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
