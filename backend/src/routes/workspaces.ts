import type { AppEnv } from '../index';
import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { workspaces, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const workspaceRoutes = new Hono<AppEnv>();

// GET /workspaces
workspaceRoutes.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const result = await db.select().from(workspaces);

  // If no workspaces exist, seed default ones
  if (result.length === 0) {
    const userId = 'user-001';
    
    // Seed default user if not exists
    const [existingUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!existingUser) {
      await db.insert(users).values({
        id: userId,
        username: 'itabishek7@gmail.com',
        passwordHash: 'seeded',
        createdAt: new Date(),
      });
    }

    await db.insert(workspaces).values([
      { id: 'ws-work', userId, name: 'WORK' },
      { id: 'ws-personal', userId, name: 'PERSONAL' },
    ]);
    const seeded = await db.select().from(workspaces);
    return c.json({ workspaces: seeded });
  }

  return c.json({ workspaces: result });
});

export default workspaceRoutes;
