import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { projects } from '../db/schema';
import { eq, and } from 'drizzle-orm';

const projectRoutes = new Hono();

const genId = () => crypto.randomUUID();

// GET /projects
projectRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const workspaceId = c.req.query('workspace_id');

  const conditions: any[] = [];
  if (workspaceId) conditions.push(eq(projects.workspaceId, workspaceId));

  const result = conditions.length
    ? await db.select().from(projects).where(and(...conditions))
    : await db.select().from(projects);

  return c.json({ projects: result });
});

// POST /projects
projectRoutes.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const id = genId();

  await db.insert(projects).values({
    id,
    workspaceId: body.workspaceId,
    name: body.name,
    description: body.description || null,
    status: 'ACTIVE',
  });

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return c.json({ project }, 201);
});

// PUT /projects/:id
projectRoutes.put('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  await db.update(projects).set({
    name: body.name,
    description: body.description,
    status: body.status,
  }).where(eq(projects.id, id));

  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  return c.json({ project });
});

// DELETE /projects/:id
projectRoutes.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  await db.delete(projects).where(eq(projects.id, id));
  return c.json({ success: true });
});

export default projectRoutes;
