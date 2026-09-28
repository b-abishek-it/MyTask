import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { tasks, taskHistory, projects } from '../db/schema';
import { eq, and, isNull, ne, lt, sql, desc } from 'drizzle-orm';

const taskRoutes = new Hono();

// Generate UUID
const genId = () => crypto.randomUUID();

// GET /tasks - List all tasks (filterable)
taskRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const workspaceId = c.req.query('workspace_id');
  const status = c.req.query('status');
  const priority = c.req.query('priority');
  const taskDate = c.req.query('task_date');
  const projectId = c.req.query('project_id');

  const conditions: any[] = [isNull(tasks.deletedAt)];

  if (workspaceId) conditions.push(eq(tasks.workspaceId, workspaceId));
  if (status) conditions.push(eq(tasks.status, status));
  if (priority) conditions.push(eq(tasks.priority, priority));
  if (taskDate) conditions.push(eq(tasks.taskDate, taskDate));
  if (projectId) conditions.push(eq(tasks.projectId, projectId));

  const result = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      workspaceId: tasks.workspaceId,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      taskDate: tasks.taskDate,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      deletedAt: tasks.deletedAt,
      projectName: projects.name,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));

  return c.json({ tasks: result });
});

// GET /tasks/:id - Get single task with history
taskRoutes.get('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');

  const [task] = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      workspaceId: tasks.workspaceId,
      projectId: tasks.projectId,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      taskDate: tasks.taskDate,
      dueDate: tasks.dueDate,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      projectName: projects.name,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.id, id));

  if (!task) return c.json({ success: false, message: 'Task not found' }, 404);

  const history = await db
    .select()
    .from(taskHistory)
    .where(eq(taskHistory.taskId, id))
    .orderBy(desc(taskHistory.changedAt));

  return c.json({ task, history });
});

// POST /tasks - Create task
taskRoutes.post('/', async (c) => {
  const db = drizzle(c.env.DB);
  const body = await c.req.json();
  const id = genId();
  const now = new Date();

  await db.insert(tasks).values({
    id,
    userId: body.userId || 'user-001',
    workspaceId: body.workspaceId,
    projectId: body.projectId || null,
    title: body.title,
    description: body.description || null,
    status: body.status || 'TODO',
    priority: body.priority || 'MEDIUM',
    taskDate: body.taskDate || null,
    dueDate: body.dueDate || null,
    createdAt: now,
    updatedAt: now,
  });

  // Record initial history
  await db.insert(taskHistory).values({
    id: genId(),
    taskId: id,
    oldStatus: '',
    newStatus: body.status || 'TODO',
    changedAt: now,
  });

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return c.json({ task }, 201);
});

// PUT /tasks/:id - Update task
taskRoutes.put('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date();

  await db.update(tasks).set({
    title: body.title,
    description: body.description,
    priority: body.priority,
    projectId: body.projectId,
    taskDate: body.taskDate,
    dueDate: body.dueDate,
    updatedAt: now,
  }).where(eq(tasks.id, id));

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return c.json({ task });
});

// DELETE /tasks/:id - Soft delete
taskRoutes.delete('/:id', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const now = new Date();

  await db.update(tasks).set({ deletedAt: now }).where(eq(tasks.id, id));
  return c.json({ success: true });
});

// PATCH /tasks/:id/status - Update status + record history
taskRoutes.patch('/:id/status', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();
  const now = new Date();

  // Get current status
  const [current] = await db.select({ status: tasks.status }).from(tasks).where(eq(tasks.id, id));
  if (!current) return c.json({ success: false, message: 'Task not found' }, 404);

  const oldStatus = current.status;
  const newStatus = body.status;

  await db.update(tasks).set({
    status: newStatus,
    updatedAt: now,
  }).where(eq(tasks.id, id));

  // Record history
  await db.insert(taskHistory).values({
    id: genId(),
    taskId: id,
    oldStatus,
    newStatus,
    changedAt: now,
  });

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return c.json({ task });
});

// PATCH /tasks/:id/priority - Update priority
taskRoutes.patch('/:id/priority', async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param('id');
  const body = await c.req.json();

  await db.update(tasks).set({
    priority: body.priority,
    updatedAt: new Date(),
  }).where(eq(tasks.id, id));

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
  return c.json({ task });
});

export default taskRoutes;
