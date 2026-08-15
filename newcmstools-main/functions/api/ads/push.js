// Cloudflare Pages Function: /api/ads/push
// Instant Ad Push Orchestration
export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  const body = await request.json();
  const { ad_id, placement_id, priority, start_at, end_at, target_pages, status } = body;

  if (!ad_id || !placement_id) {
    return new Response(JSON.stringify({
      error: 'ad_id and placement_id are required for Ad Push',
      success: false
    }), { status: 400 });
  }

  // Update ad placement, schedule, priority, and make status 'active'
  await db.prepare(`
    UPDATE ads SET
      placement_id = ?,
      priority = COALESCE(?, priority),
      start_at = ?,
      end_at = ?,
      target_pages = COALESCE(?, target_pages),
      status = COALESCE(?, 'active'),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    placement_id,
    priority !== undefined ? Number(priority) : null,
    start_at || null,
    end_at || null,
    target_pages !== undefined ? target_pages : null,
    status || 'active',
    ad_id
  ).run();

  return new Response(JSON.stringify({
    success: true,
    message: `Ad ${ad_id} successfully pushed to placement ${placement_id}`,
    pushed_at: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
