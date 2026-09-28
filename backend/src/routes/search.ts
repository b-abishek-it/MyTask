import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { tasks, notes, projects } from '../db/schema';
import { sql, isNull, or } from 'drizzle-orm';

const searchRoutes = new Hono();

// GET /search?q=query&workspace_id=X
searchRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const query = c.req.query('q');
  if (!query) return c.json({ tasks: [], notes: [], projects: [] });

  const likePattern = `%${query}%`;

  // Search tasks
  const taskResults = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      taskDate: tasks.taskDate,
    })
    .from(tasks)
    .where(
      sql`${tasks.deletedAt} IS NULL AND (${tasks.title} LIKE ${likePattern} OR ${tasks.description} LIKE ${likePattern})`
    )
    .limit(10);

  // Search notes
  const noteResults = await db
    .select({
      id: notes.id,
      title: notes.title,
      updatedAt: notes.updatedAt,
    })
    .from(notes)
    .where(
      sql`${notes.deletedAt} IS NULL AND (${notes.title} LIKE ${likePattern} OR ${notes.content} LIKE ${likePattern})`
    )
    .limit(10);

  // Search projects
  const projectResults = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
    })
    .from(projects)
    .where(sql`${projects.name} LIKE ${likePattern}`)
    .limit(10);

  return c.json({
    tasks: taskResults,
    notes: noteResults,
    projects: projectResults,
  });
});

export default searchRoutes;
