import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { tasks, notes } from '../db/schema';
import { eq, isNotNull } from 'drizzle-orm';

const trashRoutes = new Hono();

// GET /trash/tasks
trashRoutes.get('/tasks', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(tasks).where(isNotNull(tasks.deletedAt));
  return c.json({ tasks: result });
});

// GET /trash/notes
trashRoutes.get('/notes', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(notes).where(isNotNull(notes.deletedAt));
  return c.json({ notes: result });
});

// PATCH /trash/tasks/:id/restore
trashRoutes.patch('/tasks/:id/restore', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  await db.update(tasks).set({ deletedAt: null }).where(eq(tasks.id, id));
  return c.json({ success: true });
});

// PATCH /trash/notes/:id/restore
trashRoutes.patch('/notes/:id/restore', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  await db.update(notes).set({ deletedAt: null }).where(eq(notes.id, id));
  return c.json({ success: true });
});

// DELETE /trash/tasks/:id (Permanent)
trashRoutes.delete('/tasks/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  await db.delete(tasks).where(eq(tasks.id, id));
  return c.json({ success: true });
});

// DELETE /trash/notes/:id (Permanent)
trashRoutes.delete('/notes/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  await db.delete(notes).where(eq(notes.id, id));
  return c.json({ success: true });
});

export default trashRoutes;
