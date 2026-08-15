// Cloudflare Pages Function: /api/auth
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const { email, password } = body;

    const adminEmail = env.ADMIN_EMAIL || 'admin@adpush.local';
    const adminPass = env.ADMIN_PASSWORD || 'admin123';

    if (email === adminEmail && password === adminPass) {
      // In production, sign a JWT or generate an authorized session token
      const token = 'adpush_token_' + btoa(`${email}:${Date.now()}`);
      return new Response(JSON.stringify({
        success: true,
        user: { email: adminEmail, role: 'admin' },
        token: token
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Invalid email or password'
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
