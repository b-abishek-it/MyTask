import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { folders } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const folderRoutes = new Hono();

const genId = () => crypto.randomUUID();

// GET /folders
folderRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const workspaceId = c.req.query('workspace_id');

  const conditions: any[] = [];
  if (workspaceId) conditions.push(eq(folders.workspaceId, workspaceId));

  const result = conditions.length
    ? await db.select().from(folders).where(and(...conditions))
    : await db.select().from(folders);

  return c.json({ folders: result });
});

// POST /folders
folderRoutes.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const id = genId();
  const now = new Date();

  await db.insert(folders).values({
    id,
    userId: body.userId || 'user-001',
    workspaceId: body.workspaceId,
    parentFolderId: body.parentFolderId || null,
    name: body.name,
    createdAt: now,
    updatedAt: now,
  });

  const [folder] = await db.select().from(folders).where(eq(folders.id, id));
  return c.json({ folder }, 201);
});

// PUT /folders/:id
folderRoutes.put('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  await db.update(folders).set({
    name: body.name,
    updatedAt: new Date(),
  }).where(eq(folders.id, id));

  const [folder] = await db.select().from(folders).where(eq(folders.id, id));
  return c.json({ folder });
});

// DELETE /folders/:id
folderRoutes.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  await db.delete(folders).where(eq(folders.id, id));
  return c.json({ success: true });
});

export default folderRoutes;
