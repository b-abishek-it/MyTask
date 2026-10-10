import { Context, Next } from 'hono';
import type { AppEnv } from '../index';
import { verify } from 'hono/jwt';
import { getCookie } from 'hono/cookie';

const JWT_SECRET = 'super-secret-hardcoded-key-for-dev';

export const authMiddleware = async (c: Context<AppEnv>, next: Next) => {
  const token = getCookie(c, 'auth_token');
  if (!token) {
    return c.json({ success: false, message: 'Unauthorized' }, 401);
  }
  try {
    const payload = await verify(token, c.env?.JWT_SECRET || JWT_SECRET, 'HS256');
    c.set('user', payload);
    await next();
  } catch (e) {
    return c.json({ success: false, message: 'Invalid or expired token' }, 401);
  }
};
