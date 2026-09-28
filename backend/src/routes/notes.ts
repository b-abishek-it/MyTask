import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { notes } from '../db/schema';
import { eq, and, isNull, sql, desc, or } from 'drizzle-orm';

const noteRoutes = new Hono();

const genId = () => crypto.randomUUID();

// GET /notes
noteRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const workspaceId = c.req.query('workspace_id');
  const folderId = c.req.query('folder_id');
  const search = c.req.query('search');

  const conditions: any[] = [isNull(notes.deletedAt)];
  if (workspaceId) conditions.push(eq(notes.workspaceId, workspaceId));
  if (folderId) conditions.push(eq(notes.folderId, folderId));
  if (search) {
    conditions.push(
      or(
        sql`${notes.title} LIKE ${'%' + search + '%'}`,
        sql`${notes.content} LIKE ${'%' + search + '%'}`
      )!
    );
  }

  const result = await db
    .select({
      id: notes.id,
      userId: notes.userId,
      workspaceId: notes.workspaceId,
      folderId: notes.folderId,
      title: notes.title,
      isPinned: notes.isPinned,
      isFavorite: notes.isFavorite,
      createdAt: notes.createdAt,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(and(...conditions))
    .orderBy(desc(notes.isPinned), desc(notes.updatedAt));

  return c.json({ notes: result });
});

// GET /notes/:id
noteRoutes.get('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  if (!note) return c.json({ success: false, message: 'Note not found' }, 404);
  return c.json({ note });
});

// POST /notes
noteRoutes.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const id = genId();
  const now = new Date();

  await db.insert(notes).values({
    id,
    userId: body.userId || 'user-001',
    workspaceId: body.workspaceId,
    folderId: body.folderId || null,
    title: body.title,
    content: body.content || '',
    isPinned: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  });

  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  return c.json({ note }, 201);
});

// PUT /notes/:id
noteRoutes.put('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  const updateData: any = { updatedAt: new Date() };
  if (body.title !== undefined) updateData.title = body.title;
  if (body.content !== undefined) updateData.content = body.content;

  await db.update(notes).set(updateData).where(eq(notes.id, id));
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  return c.json({ note });
});

// DELETE /notes/:id - Soft delete
noteRoutes.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  await db.update(notes).set({ deletedAt: new Date() }).where(eq(notes.id, id));
  return c.json({ success: true });
});

// PATCH /notes/:id/pin
noteRoutes.patch('/:id/pin', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const [current] = await db.select({ isPinned: notes.isPinned }).from(notes).where(eq(notes.id, id));
  if (!current) return c.json({ success: false, message: 'Note not found' }, 404);

  await db.update(notes).set({ isPinned: !current.isPinned, updatedAt: new Date() }).where(eq(notes.id, id));
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  return c.json({ note });
});

// PATCH /notes/:id/favorite
noteRoutes.patch('/:id/favorite', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const [current] = await db.select({ isFavorite: notes.isFavorite }).from(notes).where(eq(notes.id, id));
  if (!current) return c.json({ success: false, message: 'Note not found' }, 404);

  await db.update(notes).set({ isFavorite: !current.isFavorite, updatedAt: new Date() }).where(eq(notes.id, id));
  const [note] = await db.select().from(notes).where(eq(notes.id, id));
  return c.json({ note });
});

// POST /notes/:id/duplicate
noteRoutes.post('/:id/duplicate', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const [original] = await db.select().from(notes).where(eq(notes.id, id));
  if (!original) return c.json({ success: false, message: 'Note not found' }, 404);

  const newId = genId();
  const now = new Date();

  await db.insert(notes).values({
    id: newId,
    userId: original.userId,
    workspaceId: original.workspaceId,
    folderId: original.folderId,
    title: `${original.title} (Copy)`,
    content: original.content,
    isPinned: false,
    isFavorite: false,
    createdAt: now,
    updatedAt: now,
  });

  const [note] = await db.select().from(notes).where(eq(notes.id, newId));
  return c.json({ note }, 201);
});

export default noteRoutes;
