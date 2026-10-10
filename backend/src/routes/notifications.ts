import type { AppEnv } from '../index';
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { notifications } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const notificationRoutes = new Hono<AppEnv>();

// GET /notifications
notificationRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const limit = parseInt(c.req.query('limit') || '20');

  const result = await db
    .select()
    .from(notifications)
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  return c.json({ notifications: result });
});

// PATCH /notifications/:id/read
notificationRoutes.patch('/:id/read', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
  return c.json({ success: true });
});

export default notificationRoutes;
