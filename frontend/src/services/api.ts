export const API_BASE = import.meta.env.PROD 
  ? 'https://mytask-backend.babishek-tech.workers.dev' 
  : 'http://localhost:8787';

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, params } = options;

  let url = `${API_BASE}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      }
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error((errorData as any).message || `API error: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ===== Auth =====
export const authApi = {
  login: (username: string, password: string) =>
    request<{ success: boolean; message: string }>('/api/auth/login', {
      method: 'POST',
      body: { username, password },
    }),
  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),
  me: () =>
    request<{ authenticated: boolean; user?: any }>('/api/auth/me'),
};

// ===== Tasks =====
export const tasksApi = {
  list: (params?: { workspace_id?: string; status?: string; priority?: string; task_date?: string; project_id?: string }) =>
    request<{ tasks: any[] }>('/api/tasks', { params }),
  get: (id: string) =>
    request<{ task: any }>(`/api/tasks/${id}`),
  create: (data: any) =>
    request<{ task: any }>('/api/tasks', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    request<{ task: any }>(`/api/tasks/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/tasks/${id}`, { method: 'DELETE' }),
  updateStatus: (id: string, status: string) =>
    request<{ task: any }>(`/api/tasks/${id}/status`, { method: 'PATCH', body: { status } }),
  updatePriority: (id: string, priority: string) =>
    request<{ task: any }>(`/api/tasks/${id}/priority`, { method: 'PATCH', body: { priority } }),
};

// ===== Projects =====
export const projectsApi = {
  list: (params?: { workspace_id?: string }) =>
    request<{ projects: any[] }>('/api/projects', { params }),
  create: (data: any) =>
    request<{ project: any }>('/api/projects', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    request<{ project: any }>(`/api/projects/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/projects/${id}`, { method: 'DELETE' }),
};

// ===== Calendar =====
export const calendarApi = {
  getMonth: (month: string, workspaceId?: string) =>
    request<{ tasks: any[] }>('/api/calendar', { params: { month, workspace_id: workspaceId } }),
  getDate: (date: string, workspaceId?: string) =>
    request<{ tasks: any[] }>('/api/calendar', { params: { date, workspace_id: workspaceId } }),
};

// ===== My Work =====
export const workApi = {
  getSummary: (month: string, workspaceId?: string) =>
    request<{ days: any[] }>('/api/work/summary', { params: { month, workspace_id: workspaceId } }),
  getDate: (date: string, workspaceId?: string) =>
    request<{ tasks: any[]; history: any[] }>(`/api/work/${date}`, { params: { workspace_id: workspaceId } }),
  getDashboard: (workspaceId?: string) =>
    request<{ tasks: any[]; history: any[] }>('/api/work/dashboard', { params: { workspace_id: workspaceId } }),
};

// ===== Folders =====
export const foldersApi = {
  list: (params?: { workspace_id?: string }) =>
    request<{ folders: any[] }>('/api/folders', { params }),
  create: (data: any) =>
    request<{ folder: any }>('/api/folders', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    request<{ folder: any }>(`/api/folders/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/folders/${id}`, { method: 'DELETE' }),
};

// ===== Notes =====
export const notesApi = {
  list: (params?: { folder_id?: string; workspace_id?: string; search?: string }) =>
    request<{ notes: any[] }>('/api/notes', { params }),
  get: (id: string) =>
    request<{ note: any }>(`/api/notes/${id}`),
  create: (data: any) =>
    request<{ note: any }>('/api/notes', { method: 'POST', body: data }),
  update: (id: string, data: any) =>
    request<{ note: any }>(`/api/notes/${id}`, { method: 'PUT', body: data }),
  delete: (id: string) =>
    request<{ success: boolean }>(`/api/notes/${id}`, { method: 'DELETE' }),
  togglePin: (id: string) =>
    request<{ note: any }>(`/api/notes/${id}/pin`, { method: 'PATCH' }),
  toggleFavorite: (id: string) =>
    request<{ note: any }>(`/api/notes/${id}/favorite`, { method: 'PATCH' }),
  duplicate: (id: string) =>
    request<{ note: any }>(`/api/notes/${id}/duplicate`, { method: 'POST' }),
};

// ===== Search =====
export const searchApi = {
  search: (query: string, workspaceId?: string) =>
    request<{ tasks: any[]; notes: any[]; projects: any[] }>('/api/search', {
      params: { q: query, workspace_id: workspaceId },
    }),
};

// ===== Notifications =====
export const notificationsApi = {
  list: (params?: { limit?: number }) =>
    request<{ notifications: any[] }>('/api/notifications', { params }),
  markRead: (id: string) =>
    request<{ success: boolean }>(`/api/notifications/${id}/read`, { method: 'PATCH' }),
};

// ===== Workspaces =====
export const workspacesApi = {
  list: () =>
    request<{ workspaces: any[] }>('/api/workspaces'),
};

// ===== Trash =====
export const trashApi = {
  listTasks: () =>
    request<{ tasks: any[] }>('/api/trash/tasks'),
  listNotes: () =>
    request<{ notes: any[] }>('/api/trash/notes'),
  restoreTask: (id: string) =>
    request<{ success: boolean }>(`/api/trash/tasks/${id}/restore`, { method: 'PATCH' }),
  restoreNote: (id: string) =>
    request<{ success: boolean }>(`/api/trash/notes/${id}/restore`, { method: 'PATCH' }),
  deleteTaskPermanently: (id: string) =>
    request<{ success: boolean }>(`/api/trash/tasks/${id}`, { method: 'DELETE' }),
  deleteNotePermanently: (id: string) =>
    request<{ success: boolean }>(`/api/trash/notes/${id}`, { method: 'DELETE' }),
};
