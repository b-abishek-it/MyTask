// ===== Task Types =====
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  userId: string;
  workspaceId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  taskDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
  // Joined fields
  projectName?: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  oldStatus: string;
  newStatus: string;
  changedAt: string;
}

// ===== Project Types =====
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
}

// ===== Workspace Types =====
export type WorkspaceName = 'WORK' | 'PERSONAL';

export interface Workspace {
  id: string;
  userId: string;
  name: WorkspaceName;
}

// ===== Folder Types =====
export interface Folder {
  id: string;
  userId: string;
  workspaceId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: string;
  updatedAt: string | null;
  children?: Folder[];
}

// ===== Note Types =====
export interface Note {
  id: string;
  userId: string;
  workspaceId: string;
  folderId: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string | null;
  deletedAt: string | null;
}

// ===== Notification Types =====
export type NotificationType = 'DUE_SOON' | 'DUE_TODAY' | 'OVERDUE' | 'REMINDER' | 'COMPLETED';

export interface Notification {
  id: string;
  userId: string;
  taskId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ===== API Response Types =====
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ===== Calendar Types =====
export interface CalendarDaySummary {
  date: string;
  total: number;
  done: number;
  todo: number;
  inProgress: number;
  inReview: number;
}

// ===== My Work Types =====
export interface DailyWorkSummary {
  date: string;
  totalTasks: number;
  completedTasks: number;
  lastUpdated: string | null;
}
