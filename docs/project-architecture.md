# MyTask – Project Architecture

## 1. Technology Stack

| Layer                  | Technology                          |
|------------------------|-------------------------------------|
| **Frontend**           | React, TypeScript, Vite, CSS Modules, React Router |
| **Backend**            | Hono API, TypeScript, Cloudflare Workers |
| **Database**           | Cloudflare D1, SQLite, Drizzle ORM  |
| **Dev / Deployment**   | Wrangler, Git, GitHub, Cloudflare   |

---

## 2. System Architecture

```text
                         USER
                           │
                           ▼
                 ┌─────────────────┐
                 │ React Frontend  │
                 │ TypeScript      │
                 └────────┬────────┘
                          │
                       REST API
                          │
                          ▼
                 ┌─────────────────┐
                 │ Hono API        │
                 │ Cloudflare      │
                 │ Workers         │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Drizzle ORM     │
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │ Cloudflare D1   │
                 │ SQLite          │
                 └─────────────────┘
```

---

## 3. Core Design Principle — One Source of Truth

The **Task** is the central entity of the application. A task exists **once** in the database, and every page retrieves/filters the same data.

```text
                    ONE SOURCE OF TRUTH
                           │
                           ▼
                         TASK
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
    KANBAN              CALENDAR            MY WORK
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
                       OVERVIEW
```

Tasks are filtered by: `workspace`, `project`, `date`, `status`, `priority`, `due_date`.

---

## 4. Project Structure

```text
MyTask/
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Shared UI components
│   │   ├── layouts/            # DashboardLayout, etc.
│   │   ├── pages/              # Route-level page components
│   │   │   ├── Login/
│   │   │   ├── Overview/
│   │   │   ├── Kanban/
│   │   │   ├── Calendar/
│   │   │   ├── MyWork/
│   │   │   ├── Notes/
│   │   │   └── Settings/
│   │   ├── features/           # Feature-specific logic
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── calendar/
│   │   │   ├── notes/
│   │   │   ├── notifications/
│   │   │   └── search/
│   │   ├── services/           # API client helpers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── types/              # Shared TypeScript types
│   │   ├── utils/              # Utility functions
│   │   ├── routes/             # Route definitions
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/             # Hono route handlers
│   │   │   ├── auth.ts
│   │   │   ├── tasks.ts
│   │   │   ├── calendar.ts
│   │   │   ├── notes.ts
│   │   │   ├── folders.ts
│   │   │   ├── search.ts
│   │   │   ├── notifications.ts
│   │   │   └── settings.ts
│   │   ├── middleware/         # Auth middleware, CORS, etc.
│   │   ├── services/          # Business logic
│   │   ├── db/                # Drizzle schema & helpers
│   │   ├── validators/        # Request validation
│   │   └── index.ts           # Hono app entry point
│   ├── drizzle/               # Generated SQL migrations
│   ├── wrangler.jsonc
│   └── package.json
│
├── docs/                      # Project documentation
├── README.md
└── package.json               # Root monorepo scripts
```

---

## 5. Database Schema

```text
users
│
├── workspaces
│      │
│      ├── projects
│      │      │
│      │      └── tasks
│      │             │
│      │             └── task_history
│      │
│      ├── folders
│      │      │
│      │      └── notes
│      │
│      └── notifications
│
└── sessions
```

### Tables

| Table            | Key Columns                                                                 |
|------------------|-----------------------------------------------------------------------------|
| `users`          | `id`, `username`, `password_hash`, `created_at`                            |
| `sessions`       | `id`, `user_id`, `token`, `expires_at`                                     |
| `workspaces`     | `id`, `user_id`, `name` (WORK / PERSONAL)                                 |
| `projects`       | `id`, `workspace_id`, `name`, `description`, `status`                     |
| `tasks`          | `id`, `user_id`, `workspace_id`, `project_id`, `title`, `description`, `status`, `priority`, `task_date`, `due_date`, `created_at`, `updated_at`, `deleted_at` |
| `task_history`   | `id`, `task_id`, `old_status`, `new_status`, `changed_at`                 |
| `folders`        | `id`, `user_id`, `workspace_id`, `parent_folder_id`, `name`              |
| `notes`          | `id`, `user_id`, `workspace_id`, `folder_id`, `title`, `content`, `is_pinned`, `is_favorite`, `created_at`, `updated_at`, `deleted_at` |
| `notifications`  | `id`, `user_id`, `task_id`, `type`, `title`, `message`, `is_read`        |
| `reminders`      | `id`, `user_id`, `task_id`, `reminder_time`, `is_completed`              |

### Enums

| Field      | Values                                    |
|------------|-------------------------------------------|
| `status`   | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE` |
| `priority` | `LOW`, `MEDIUM`, `HIGH`                   |

---

## 6. API Structure

### Authentication

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| POST   | `/api/auth/login`     | Login with credentials   |
| POST   | `/api/auth/logout`    | End session              |
| GET    | `/api/auth/me`        | Get current user         |

### Tasks

| Method | Endpoint                    | Description              |
|--------|-----------------------------|--------------------------|
| GET    | `/api/tasks`                | List tasks (filterable)  |
| GET    | `/api/tasks/:id`            | Get single task          |
| POST   | `/api/tasks`                | Create task              |
| PUT    | `/api/tasks/:id`            | Update task              |
| DELETE | `/api/tasks/:id`            | Soft-delete task         |
| PATCH  | `/api/tasks/:id/status`     | Update status only       |
| PATCH  | `/api/tasks/:id/priority`   | Update priority only     |
| PATCH  | `/api/tasks/:id/date`       | Update date only         |

### Calendar & My Work

| Method | Endpoint                         | Description                        |
|--------|----------------------------------|------------------------------------|
| GET    | `/api/calendar?date=YYYY-MM-DD`  | Tasks for a specific date          |
| GET    | `/api/calendar?month=YYYY-MM`    | Tasks for a month                  |
| GET    | `/api/work/:date`                | Historical daily work summary      |

### Projects

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/projects`       | List projects            |
| POST   | `/api/projects`       | Create project           |
| PUT    | `/api/projects/:id`   | Update project           |
| DELETE | `/api/projects/:id`   | Delete project           |

### Notes & Folders

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/folders`        | List folders             |
| POST   | `/api/folders`        | Create folder            |
| PUT    | `/api/folders/:id`    | Update folder            |
| DELETE | `/api/folders/:id`    | Delete folder            |
| GET    | `/api/notes`          | List notes               |
| GET    | `/api/notes/:id`      | Get single note          |
| POST   | `/api/notes`          | Create note              |
| PUT    | `/api/notes/:id`      | Update note              |
| DELETE | `/api/notes/:id`      | Soft-delete note         |

### Search & Notifications

| Method | Endpoint                          | Description              |
|--------|-----------------------------------|--------------------------|
| GET    | `/api/search?q=query`             | Global search            |
| GET    | `/api/notifications`              | List notifications       |
| PATCH  | `/api/notifications/:id/read`     | Mark as read             |

---

## 7. Application Flow

```text
                         LOGIN
                           │
                           ▼
                       DASHBOARD
                           │
        ┌──────────────────┼───────────────────┐
        │                  │                   │
        ▼                  ▼                   ▼
     OVERVIEW           CALENDAR            KANBAN
        │                  │                   │
        │                  ▼                   │
        │             SELECT DATE              │
        │                  │                   │
        │                  ▼                   │
        │            CREATE TASKS              │
        │                  │                   │
        │                  └──────────┐        │
        │                             ▼        │
        │                         TASK DATA ◄──┘
        │                             │
        │              ┌──────────────┼──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
     NOTICES        MY WORK        SEARCH        HISTORY
                       │
                       ▼
                 HISTORICAL BOARD


                    NOTES
                      │
                      ▼
                  FOLDERS
                      │
                      ▼
                    NOTES
                      │
              ┌───────┼────────┐
              ▼       ▼        ▼
             TXT      MD      PRINT
```

---

## 8. Dashboard Layout

```text
┌─────────────────────────────────────────────────────────┐
│ MYTASK   🔍 Search (Ctrl+K)       🔔   Workspace ▼ 👤  │
├────────────────┬────────────────────────────────────────┤
│                │                                        │
│ Overview       │                                        │
│ Kanban Board   │             PAGE CONTENT               │
│ Calendar       │                                        │
│ My Work        │                                        │
│ Notes          │                                        │
│                │                                        │
│ Settings       │                                        │
│ Logout         │                                        │
└────────────────┴────────────────────────────────────────┘
```

---

## 9. Deployment Architecture

```text
GitHub
    ↓
Cloudflare
    ↓
React Frontend (Static Assets)
    ↓
Cloudflare Worker (Hono API)
    ↓
D1 Database (SQLite)
```

---

## 10. Theme & Design

| Token               | Value       |
|----------------------|-------------|
| Background           | `#FFFFFF`   |
| Secondary / Primary  | `#005b96`   |
| Font Family          | Poppins     |
