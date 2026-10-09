import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(), // 'WORK' or 'PERSONAL'
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('ACTIVE'), // ACTIVE, ARCHIVED
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
  projectId: text('project_id').references(() => projects.id),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('TODO'), // TODO, IN_PROGRESS, IN_REVIEW, DONE
  priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH
  taskDate: text('task_date'), // YYYY-MM-DD
  dueDate: text('due_date'), // YYYY-MM-DD
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
}, (t) => ({
  dateIdx: index('idx_tasks_workspace_date').on(t.workspaceId, t.taskDate, t.deletedAt),
}));

export const taskHistory = sqliteTable('task_history', {
  id: text('id').primaryKey(),
  taskId: text('task_id').notNull().references(() => tasks.id),
  oldStatus: text('old_status').notNull(),
  newStatus: text('new_status').notNull(),
  changedAt: integer('changed_at', { mode: 'timestamp' }).notNull(),
});

export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
  parentFolderId: text('parent_folder_id'), // Self reference possible
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id),
  folderId: text('folder_id').references(() => folders.id),
  title: text('title').notNull(),
  content: text('content').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp' }),
});

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  taskId: text('task_id').references(() => tasks.id),
  type: text('type').notNull(), // DUE_SOON, OVERDUE, REMINDER, COMPLETED
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const reminders = sqliteTable('reminders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  taskId: text('task_id').notNull().references(() => tasks.id),
  reminderTime: integer('reminder_time', { mode: 'timestamp' }).notNull(),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
