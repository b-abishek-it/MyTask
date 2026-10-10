import type { AppEnv } from '../index';
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { tasks, projects } from '../db/schema';
import { eq, and, isNull, sql, desc } from 'drizzle-orm';

const calendarRoutes = new Hono<AppEnv>();

// GET /calendar?month=2026-09 - Monthly summary
// GET /calendar?date=2026-09-22 - Tasks for a date
calendarRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const month = c.req.query('month');
  const date = c.req.query('date');
  const workspaceId = c.req.query('workspace_id');

  if (date) {
    // Return all tasks for a specific date
    const conditions: any[] = [
      eq(tasks.taskDate, date),
      isNull(tasks.deletedAt),
    ];
    if (workspaceId) conditions.push(eq(tasks.workspaceId, workspaceId));

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
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    return c.json({ tasks: result });
  }

  if (month) {
    // Return date-wise task counts for the month
    const likePattern = `${month}%`;
    const conditions: any[] = [
      sql`${tasks.taskDate} LIKE ${likePattern}`,
      isNull(tasks.deletedAt),
    ];
    if (workspaceId) conditions.push(eq(tasks.workspaceId, workspaceId));

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
        projectName: projects.name,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    return c.json({ tasks: result });
  }

  return c.json({ error: 'Provide month or date query parameter' }, 400);
});

export default calendarRoutes;
