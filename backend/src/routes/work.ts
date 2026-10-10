import type { AppEnv } from '../index';
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { tasks, taskHistory, projects } from '../db/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';

const workRoutes = new Hono<AppEnv>();

// GET /work/summary?month=2026-09 - Summary of work days
workRoutes.get('/summary', async (c) => {
  const db = drizzle(c.env.DB);
  const month = c.req.query('month');
  const workspaceId = c.req.query('workspace_id');

  if (!month) return c.json({ error: 'month is required' }, 400);

  const likePattern = `${month}%`;
  const conditions: any[] = [
    sql`${tasks.taskDate} LIKE ${likePattern}`,
    isNull(tasks.deletedAt),
  ];
  if (workspaceId) conditions.push(eq(tasks.workspaceId, workspaceId));

  const result = await db
    .select({
      date: tasks.taskDate,
      totalTasks: sql<number>`COUNT(*)`,
      completedTasks: sql<number>`SUM(CASE WHEN ${tasks.status} = 'DONE' THEN 1 ELSE 0 END)`,
      lastUpdated: sql<string>`MAX(${tasks.updatedAt})`,
    })
    .from(tasks)
    .where(and(...conditions))
    .groupBy(tasks.taskDate)
    .orderBy(desc(tasks.taskDate));

  return c.json({ days: result });
});

// GET /work/:date - Full daily work with history
workRoutes.get('/:date', async (c) => {
  const db = drizzle(c.env.DB);
  const date = c.req.param('date');
  const workspaceId = c.req.query('workspace_id');

  const conditions: any[] = [
    eq(tasks.taskDate, date),
    isNull(tasks.deletedAt),
  ];
  if (workspaceId) conditions.push(eq(tasks.workspaceId, workspaceId));

  const taskList = await db
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
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));

  // Get history for all tasks on this date
  const taskIds = taskList.map((t) => t.id);
  let history: any[] = [];
  if (taskIds.length > 0) {
    history = await db
      .select()
      .from(taskHistory)
      .where(sql`${taskHistory.taskId} IN (${sql.join(taskIds.map(id => sql`${id}`), sql`, `)})`)
      .orderBy(desc(taskHistory.changedAt));
  }

  return c.json({ tasks: taskList, history });
});

// GET /work/dashboard - All tasks and recent global history
workRoutes.get('/dashboard', async (c) => {
  const db = drizzle(c.env.DB);
  const workspaceId = c.req.query('workspace_id');

  const conditions: any[] = [isNull(tasks.deletedAt)];
  if (workspaceId) conditions.push(eq(tasks.workspaceId, workspaceId));

  const allTasks = await db
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
    .where(and(...conditions))
    .orderBy(desc(tasks.updatedAt));

  const recentHistory = await db
    .select()
    .from(taskHistory)
    .orderBy(desc(taskHistory.changedAt))
    .limit(50);

  return c.json({ tasks: allTasks, history: recentHistory });
});

export default workRoutes;
