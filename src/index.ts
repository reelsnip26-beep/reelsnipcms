import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS so your frontend can talk to the API
app.use('/api/*', cors());

// GET all ads
app.get('/api/ads', async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM ads ORDER BY priority DESC").all();
  return c.json(results);
});

// POST (Create) a new ad
app.post('/api/ads', async (c) => {
  const body = await c.req.json();
  const result = await c.env.DB.prepare(`
    INSERT INTO ads (title, campaign, type, mediaUrl, destinationUrl, cta, status, priority, startDate, endDate, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.title, body.campaign, body.type, body.mediaUrl, 
    body.destinationUrl, body.cta, body.status, body.priority, 
    body.startDate, body.endDate, body.description
  ).run();
  
  return c.json({ success: true, id: result.meta.last_row_id });
});

// DELETE an ad
app.delete('/api/ads/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM ads WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

export default app;
