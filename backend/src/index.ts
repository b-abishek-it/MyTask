import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRoutes from './routes/auth'
import taskRoutes from './routes/tasks'
import projectRoutes from './routes/projects'
import calendarRoutes from './routes/calendar'
import workRoutes from './routes/work'
import folderRoutes from './routes/folders'
import noteRoutes from './routes/notes'
import searchRoutes from './routes/search'
import notificationRoutes from './routes/notifications'
import workspaceRoutes from './routes/workspaces'
import trashRoutes from './routes/trash'

export type Bindings = {
  DB: D1Database
  BUCKET: R2Bucket
  JWT_SECRET: string
}

export type Variables = {
  user: any;
}

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
}

const app = new Hono<AppEnv>()

app.use('*', cors({
  origin: ['http://localhost:5173'],
  credentials: true
}))

app.get('/', (c) => {
  return c.text('MyTask API running!')
})

// Mount routes
app.route('/api/auth', authRoutes)
app.route('/api/tasks', taskRoutes)
app.route('/api/projects', projectRoutes)
app.route('/api/calendar', calendarRoutes)
app.route('/api/work', workRoutes)
app.route('/api/folders', folderRoutes)
app.route('/api/notes', noteRoutes)
app.route('/api/search', searchRoutes)
app.route('/api/notifications', notificationRoutes)
app.route('/api/workspaces', workspaceRoutes)
app.route('/api/trash', trashRoutes)

export default app
