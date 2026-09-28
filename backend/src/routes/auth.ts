import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { verify } from 'hono/jwt';

const JWT_SECRET = 'super-secret-hardcoded-key-for-dev';

const auth = new Hono();

auth.post('/login', async (c) => {
  const body = await c.req.json();
  if (body.username === 'itabishek7@gmail.com' && body.password === 'welc0me@55') {
    const payload = {
      username: body.username,
      userId: 'user-001',
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    };
    const token = await sign(payload, c.env?.JWT_SECRET || JWT_SECRET);
    setCookie(c, 'auth_token', token, { httpOnly: true, sameSite: 'Strict' });
    return c.json({ success: true, message: 'Logged in successfully' });
  }
  return c.json({ success: false, message: 'Invalid username or password' }, 401);
});

auth.post('/logout', (c) => {
  deleteCookie(c, 'auth_token');
  return c.json({ success: true, message: 'Logged out successfully' });
});

auth.get('/me', async (c) => {
  const token = getCookie(c, 'auth_token');
  if (!token) return c.json({ authenticated: false }, 401);
  try {
    const decodedPayload = await verify(token, c.env?.JWT_SECRET || JWT_SECRET);
    return c.json({ authenticated: true, user: decodedPayload });
  } catch (e) {
    return c.json({ authenticated: false }, 401);
  }
});

export default auth;
