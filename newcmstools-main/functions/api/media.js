// Cloudflare Pages Function: /api/media
// Supports Cloudflare R2 Uploads & Media Metadata Persistence
export async function onRequestGet(context) {
  const { env } = context;
  const db = env.DB;
  if (!db) return new Response(JSON.stringify({ error: 'D1 binding missing' }), { status: 500 });

  // Get media list and inspect which ads are currently using each media URL
  const query = `
    SELECT m.*,
      (SELECT COUNT(*) FROM ads WHERE media_url = m.url OR media_r2_key = m.r2_key) as usage_count
    FROM media m
    ORDER BY m.created_at DESC
  `;

  const result = await db.prepare(query).all();
  return new Response(JSON.stringify({ success: true, media: result.results || [] }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = env.DB;
  const bucket = env.MEDIA_BUCKET; // Cloudflare R2 Binding
  const r2PublicDomain = env.R2_PUBLIC_DOMAIN || '';

  const contentType = request.headers.get('content-type') || '';

  // Case 1: Multipart / PC File Upload to Cloudflare R2
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: 'No file uploaded', success: false }), { status: 400 });
      }

      const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase();
      const fileType = file.type || (fileExt === 'mp4' ? 'video/mp4' : 'image/jpeg');
      const isVideo = fileType.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(fileExt);

      const uniqueKey = `ads/${isVideo ? 'videos' : 'images'}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const mediaId = 'med_' + Math.random().toString(36).substring(2, 9);

      let publicUrl = '';

      if (bucket) {
        // Upload directly to Cloudflare R2
        await bucket.put(uniqueKey, file.stream(), {
          httpMetadata: { contentType: fileType },
          customMetadata: { originalName: file.name }
        });
        publicUrl = r2PublicDomain ? `${r2PublicDomain.replace(/\/$/, '')}/${uniqueKey}` : `/media/${uniqueKey}`;
      } else {
        // Fallback if R2 is not configured
        publicUrl = `https://picsum.photos/800/400?random=${Date.now()}`;
      }

      if (db) {
        await db.prepare(`
          INSERT INTO media (id, file_name, file_type, file_size, r2_key, url, created_at)
          VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).bind(mediaId, file.name, fileType, file.size, uniqueKey, publicUrl).run();
      }

      return new Response(JSON.stringify({
        success: true,
        media: {
          id: mediaId,
          file_name: file.name,
          file_type: fileType,
          file_size: file.size,
          r2_key: uniqueKey,
          url: publicUrl
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'R2 Upload error: ' + err.message, success: false }), { status: 500 });
    }
  }

  // Case 2: JSON Payload for URL-based media registration
  const body = await request.json();
  const { url, file_name, file_type, file_size } = body;

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL is required', success: false }), { status: 400 });
  }

  const mediaId = 'med_' + Math.random().toString(36).substring(2, 9);
  const detectedType = file_type || (url.match(/\.(mp4|webm|mov)(\?.*)?$/i) ? 'video/mp4' : 'image/jpeg');

  if (db) {
    await db.prepare(`
      INSERT INTO media (id, file_name, file_type, file_size, r2_key, url, created_at)
      VALUES (?, ?, ?, ?, NULL, ?, CURRENT_TIMESTAMP)
    `).bind(mediaId, file_name || 'External Media', detectedType, Number(file_size) || 0, url).run();
  }

  return new Response(JSON.stringify({
    success: true,
    media: {
      id: mediaId,
      file_name: file_name || 'External Media',
      file_type: detectedType,
      file_size: file_size || 0,
      url: url
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const db = env.DB;
  const bucket = env.MEDIA_BUCKET;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });

  if (db) {
    // Check if in use by active ads
    const mediaItem = await db.prepare('SELECT * FROM media WHERE id = ?').bind(id).first();
    if (!mediaItem) return new Response(JSON.stringify({ error: 'Media not found' }), { status: 404 });

    const activeAdsUsing = await db.prepare('SELECT id, name FROM ads WHERE (media_url = ? OR media_r2_key = ?) AND status = "active"').bind(mediaItem.url, mediaItem.r2_key).all();
    if (activeAdsUsing.results && activeAdsUsing.results.length > 0) {
      return new Response(JSON.stringify({
        error: `Cannot delete: Media is actively used by ${activeAdsUsing.results.length} active ad(s) (${activeAdsUsing.results[0].name})`,
        success: false
      }), { status: 409 });
    }

    // Delete from R2 bucket if key exists
    if (bucket && mediaItem.r2_key) {
      try {
        await bucket.delete(mediaItem.r2_key);
      } catch (e) {
        console.warn('Failed to delete object from R2:', e);
      }
    }

    await db.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
