# MyTask – Personal & Work Task Management System

## 1. Project Overview

**MyTask** is a personal and work task-management application designed to store, organize, track, and review daily work efficiently.

The application is inspired by productivity tools such as Jira, Trello, and similar task-management platforms, but it is designed to remain **simple, lightweight, personal, and focused on daily work management**.

The main purpose of MyTask is to:

* Create and manage daily tasks.
* Organize tasks using a Kanban workflow.
* Assign one or multiple tasks to a specific date.
* Set task priority.
* Track overdue tasks.
* Receive notifications and reminders.
* Maintain personal and work tasks separately.
* Maintain notes using folders and subfolders.
* Search tasks, notes, and other content globally.
* Review previous work by date.
* Recover deleted tasks and notes.
* Export personal data.
* Provide keyboard shortcuts for faster navigation.

---

# 2. Main Application Workflow

```text
Login
  ↓
Dashboard
  ↓
┌────────────────────────────────────────────┐
│ Sidebar                                    │
│                                            │
│ Overview                                   │
│ Kanban Board                               │
│ Calendar                                   │
│ My Work                                    │
│ Notes                                      │
│                                            │
│ Settings                                   │
│ Logout                                     │
└────────────────────────────────────────────┘
```

The **Task** is the central entity of the application.

```text
                         TASK
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       KANBAN           CALENDAR         MY WORK
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                       OVERVIEW
```

The same task data should be used across all task-related pages. Do not create separate task data for Kanban, Calendar, or My Work.

---

# 3. Technology Stack

## Frontend

```text
React
TypeScript
Vite
CSS / CSS Modules
React Router
```

## Backend

```text
TypeScript
Hono API
Cloudflare Workers
```

## Database

```text
Cloudflare D1
SQLite / SQL
Drizzle ORM
```

## Development / Deployment

```text
Wrangler
Git
GitHub
Cloudflare
```

## Recommended Architecture

```text
React + TypeScript
        │
        │ REST API
        ▼
     Hono API
        │
        ▼
Cloudflare Workers
        │
        ▼
   Drizzle ORM
        │
        ▼
 Cloudflare D1
```

---

# 4. Application Architecture

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

# 5. Recommended Project Structure

```text
MyTask/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── Login/
│   │   │   ├── Overview/
│   │   │   ├── Kanban/
│   │   │   ├── Calendar/
│   │   │   ├── MyWork/
│   │   │   ├── Notes/
│   │   │   └── Settings/
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── tasks/
│   │   │   ├── calendar/
│   │   │   ├── notes/
│   │   │   ├── notifications/
│   │   │   └── search/
│   │   │
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── routes/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── tasks.ts
│   │   │   ├── calendar.ts
│   │   │   ├── notes.ts
│   │   │   ├── folders.ts
│   │   │   ├── search.ts
│   │   │   ├── notifications.ts
│   │   │   └── settings.ts
│   │   │
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── db/
│   │   ├── validators/
│   │   └── index.ts
│   │
│   ├── migrations/
│   ├── wrangler.jsonc
│   └── package.json
│
├── docs/
│
├── README.md
└── package.json
```

---

# 6. Authentication / Login Page

The user enters:

```text
Username
Password
```

If authentication is successful:

```text
Login
  ↓
Validate credentials
  ↓
Create session
  ↓
Dashboard
```

If authentication fails:

```text
Invalid username or password
```

Passwords must never be stored as plain text. Store secure password hashes.

Protected pages must require authentication.

---

# 7. Dashboard Layout

The main dashboard should have:

```text
┌─────────────────────────────────────────────────────────┐
│ MYTASK                              Search   Profile    │
├────────────────┬────────────────────────────────────────┤
│                │                                        │
│ Overview       │                                        │
│ Kanban Board   │             PAGE CONTENT               │
│ Calendar       │                                        │
│ My Work        │                                        │
│ Notes          │                                        │
│                │                                        │
│                │                                        │
│ Settings       │                                        │
│ Logout         │                                        │
└────────────────┴────────────────────────────────────────┘
```

The sidebar should be fixed on desktop and responsive on mobile.

---

# 8. Overview Page

The Overview page should answer:

**"What is happening with my work today?"**

Display:

```text
Today's Date

Total Tasks
To Do
In Progress
In Review
Done
Overdue
```

Example:

```text
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ To Do       │ │ In Progress │ │ In Review   │
│     8       │ │      3      │ │      2      │
└─────────────┘ └─────────────┘ └─────────────┘

┌─────────────┐ ┌─────────────┐
│ Done        │ │ Overdue     │
│    12       │ │      2      │
└─────────────┘ └─────────────┘
```

Also display:

* Today's tasks
* High-priority tasks
* Overdue tasks
* Upcoming tasks
* Recent activity
* Recent notifications

---

# 9. Kanban Board

The Kanban Board is the primary task-management page.

Columns:

```text
TO DO
IN PROGRESS
IN REVIEW
DONE
```

Optional additional status:

```text
BLOCKED
```

Recommended initial implementation:

```text
To Do → In Progress → In Review → Done
```

Task cards should contain:

```text
Task Title
Project
Priority
Task Date
Due Date
Tags
Last Updated
```

Example:

```text
┌──────────────────────────────┐
│ Fix Login API                │
│                              │
│ Project: MyTask              │
│ Priority: High               │
│ Date: 22 Sep                 │
│ Due: 23 Sep                  │
│                              │
│ Updated 10 minutes ago       │
└──────────────────────────────┘
```

Tasks should support drag-and-drop between Kanban columns.

When a task moves:

```text
PATCH /api/tasks/:id/status
```

The backend should update the task and record the change in task history.

---

# 10. Calendar Page — Task Planning

The Calendar is not only for viewing tasks.

Its main purpose is:

> **Select a date and create one or many tasks for that corresponding date.**

Example:

```text
September 2026

Mon  Tue  Wed  Thu  Fri  Sat  Sun
     1    2    3    4    5    6
7    8    9   10   11   12   13
14  15   16   17   18   19   20
21 [22]  23   24   25   26   27
28  29   30
```

When the user selects:

```text
22 September
```

show:

```text
22 September 2026

+ Add Task
```

The user can create **one or multiple tasks** for the selected date.

Example:

```text
22 September

Task 1
Complete LMS Admin UI

Task 2
Fix Course API

Task 3
Test Quiz Module

Task 4
Update Documentation
```

Each task will contain:

```text
Title
Description
Priority
Project
Due Date
Tags
```

The selected calendar date becomes the task's `task_date`.

Example:

```text
task_date = 2026-09-22
```

Multiple tasks can therefore belong to the same date.

---

# 11. Calendar → Kanban Integration

When the user selects a date:

```text
Calendar
   ↓
22 September
   ↓
Fetch tasks where task_date = 2026-09-22
   ↓
Display that day's tasks
   ↓
Open Daily Kanban
```

Example:

```text
22 September

To Do          3
In Progress    2
In Review      1
Done           5
```

Button:

```text
[ Open Kanban Board ]
```

The Kanban Board should show only tasks associated with the selected date when opened from Calendar.

---

# 12. My Work Page

My Work is the historical work-tracking section.

Purpose:

> **Select a previous date and see exactly what work was done on that date.**

Example:

```text
MY WORK

September 2026

22 Sep
12 Tasks
8 Completed
Last Updated: 18:45

[View Daily Board]

21 Sep
9 Tasks
7 Completed
Last Updated: 18:20

[View Daily Board]
```

Selecting a date should open the corresponding daily Kanban board.

The system should preserve:

* Task status
* Priority
* Project
* Creation time
* Last updated time
* Completion time
* Task history

---

# 13. Priority System

Every task should support:

```text
LOW
MEDIUM
HIGH
```

Example:

```text
Task: Fix Authentication

Priority:
HIGH
```

Priority should be visible on:

* Kanban card
* Calendar
* My Work
* Overview
* Search results

Users should be able to filter by priority.

Example:

```text
Filter → High
```

---

# 14. Overdue Task System

A task becomes overdue when:

```text
Current Date > Due Date
AND
Task Status != DONE
```

Example:

```text
Task:
Fix Login API

Due:
20 September

Today:
22 September

Status:
In Progress
```

Display:

```text
⚠ Overdue
```

Overdue tasks should appear in:

* Overview
* Kanban
* Calendar
* My Work
* Global Search

Provide an:

```text
Overdue
```

filter.

When the task is completed, it should no longer appear as an active overdue task.

---

# 15. Notifications / Reminders

Create a notification system for important task events.

Notification types:

```text
Task Due Soon
Task Due Today
Task Overdue
Reminder
Task Completed
```

Example:

```text
🔔 Notifications

Fix Login API is due today.

Course Upload API is overdue.

Reminder:
Complete LMS testing at 4:00 PM.
```

Users should be able to configure reminders for tasks.

Example:

```text
Reminder:
22 September
4:00 PM
```

The notification system should be designed separately from the task system so that additional notification types can be added later.

---

# 16. Global Command / Search

Add a global search/command interface.

Keyboard shortcut:

```text
Ctrl + K
```

Opening it should display:

```text
┌─────────────────────────────────────────┐
│ Search MyTask...                        │
├─────────────────────────────────────────┤
│                                         │
│ Tasks                                   │
│ Notes                                   │
│ Projects                                │
│                                         │
│ Commands                                │
│                                         │
└─────────────────────────────────────────┘
```

Search should support:

```text
Tasks
Notes
Projects
Tags
```

Examples:

```text
login
```

Results:

```text
Tasks
  Fix Login API

Notes
  Authentication Notes

Projects
  MyTask
```

The command interface should also support actions:

```text
Create Task
Open Kanban
Open Calendar
Open My Work
Create Note
Open Settings
```

---

# 17. Keyboard Shortcuts

Provide keyboard shortcuts for frequently used actions.

```text
N        → New Task
C        → Calendar
K        → Kanban
M        → My Work
Shift+N  → New Note
Ctrl+K   → Global Search / Command
```

Additional shortcuts can be added later.

Keyboard shortcuts should be displayed in the command palette/help section.

---

# 18. Notes System

The Notes section should work like a lightweight file/folder system.

Basic structure:

```text
Folder
 └── Note
```

The system should support nested folders:

```text
Folder
 ├── Note
 ├── Note
 └── Subfolder
      ├── Note
      └── Note
```

Example:

```text
Work
 ├── Daily Tasks
 ├── Meeting Notes
 └── Projects
      ├── MyTask
      └── LMS
```

---

# 19. Notes Features

Each note should support:

* Search
* Pin
* Favorite
* Tags
* Markdown
* Auto-save
* Last edited timestamp
* Duplicate
* Export `.txt`
* Export `.md`
* Print

Example:

```text
┌──────────────────────────────────────────┐
│ Authentication Notes            ⭐ 📌   │
├──────────────────────────────────────────┤
│                                          │
│ JWT Authentication                       │
│                                          │
│ Login flow...                            │
│                                          │
├──────────────────────────────────────────┤
│ Last edited: 22 Sep 2026, 15:30         │
└──────────────────────────────────────────┘
```

Auto-save should prevent accidental loss of note content.

---

# 20. Personal + Work Separation

Because MyTask is intended for both personal and professional use, introduce a **Workspace** concept.

Example:

```text
Workspace

[ Work ▼ ]
```

Possible workspaces:

```text
WORK
PERSONAL
```

Structure:

```text
WORK
 ├── Projects
 ├── Tasks
 └── Notes

PERSONAL
 ├── Projects
 ├── Tasks
 └── Notes
```

Every task, project, folder, and note should belong to a workspace.

Example:

```text
workspace_id
```

This prevents personal and work information from becoming mixed.

The workspace selector should be available from the dashboard header.

---

# 21. Trash / Recovery System

Do not immediately permanently delete tasks or notes.

Use:

```text
Delete
   ↓
Trash
   ↓
30 Days
   ↓
Permanent Delete
```

Deleted records should contain:

```text
deleted_at
```

The Trash page should allow:

```text
Restore
Permanent Delete
```

Example:

```text
Trash

Fix Login API
Deleted: 2 days ago

[Restore] [Delete Permanently]
```

The 30-day automatic cleanup can permanently remove records after the retention period.

---

# 22. Data Export

Users should always be able to export their data.

Navigation:

```text
Settings
   ↓
Export Data
```

Options:

```text
Export Tasks → CSV
Export Notes → TXT
Export Notes → Markdown
Export Everything → JSON
```

For example:

```text
Tasks
 ↓
CSV

Notes
 ↓
TXT / Markdown

Complete MyTask data
 ↓
JSON
```

The export feature is important because MyTask is a personal productivity application and users should retain ownership of their data.

---

# 23. Project Management

Add Projects so tasks can be grouped.

Example:

```text
Projects

Jeevi LMS
MyTask
AgroRent
Personal
```

Each task can belong to a project.

Example:

```text
Task:
Implement Login API

Project:
MyTask

Workspace:
WORK
```

Projects should support:

* Project name
* Description
* Status
* Tasks
* Last updated
* Archive

---

# 24. Task History

Every important task change should be recorded.

Example:

```text
Task History

10:00 AM
Task created

11:30 AM
To Do → In Progress

03:00 PM
In Progress → In Review

05:30 PM
In Review → Done
```

Database:

```text
task_history
----------------
id
task_id
old_status
new_status
changed_at
```

This makes the My Work history accurate.

---

# 25. Recommended Database Structure

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

Recommended tables:

```text
users
sessions
workspaces
projects
tasks
task_history
folders
notes
notifications
reminders
```

---

# 26. Task Database

```text
tasks
--------------------------------
id
user_id
workspace_id
project_id
title
description
status
priority
task_date
due_date
completed_at
created_at
updated_at
deleted_at
```

Status:

```text
TODO
IN_PROGRESS
IN_REVIEW
DONE
```

Priority:

```text
LOW
MEDIUM
HIGH
```

---

# 27. Notes Database

```text
folders
--------------------------------
id
user_id
workspace_id
parent_folder_id
name
created_at
updated_at
```

The `parent_folder_id` allows nested folders.

```text
notes
--------------------------------
id
user_id
workspace_id
folder_id
title
content
is_pinned
is_favorite
created_at
updated_at
deleted_at
```

---

# 28. Notification Database

```text
notifications
--------------------------------
id
user_id
task_id
type
title
message
is_read
created_at
```

Reminders:

```text
reminders
--------------------------------
id
user_id
task_id
reminder_time
is_completed
created_at
```

---

# 29. API Structure

## Authentication

```text
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Tasks

```text
GET    /api/tasks
GET    /api/tasks/:id
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id

PATCH  /api/tasks/:id/status
PATCH  /api/tasks/:id/priority
PATCH  /api/tasks/:id/date
```

## Calendar

```text
GET /api/calendar?date=2026-09-22
GET /api/calendar?month=2026-09
```

## My Work

```text
GET /api/work/:date
```

## Projects

```text
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id
```

## Notes

```text
GET    /api/folders
POST   /api/folders
PUT    /api/folders/:id
DELETE /api/folders/:id

GET    /api/notes
GET    /api/notes/:id
POST   /api/notes
PUT    /api/notes/:id
DELETE /api/notes/:id
```

## Search

```text
GET /api/search?q=login
```

## Notifications

```text
GET   /api/notifications
PATCH /api/notifications/:id/read
```

---

# 30. Page-by-Page Application Flow

## Page 1 — Login

Purpose:

Authenticate the user.

Features:

```text
Username
Password
Login
Authentication validation
Session creation
```

---

## Page 2 — Overview

Purpose:

Provide a quick summary of current work.

Features:

```text
Today's tasks
Task statistics
High-priority tasks
Overdue tasks
Upcoming tasks
Notifications
Recent activity
```

---

## Page 3 — Kanban Board

Purpose:

Manage task progress.

Features:

```text
To Do
In Progress
In Review
Done

Create Task
Edit Task
Delete Task
Drag & Drop
Priority
Project
Tags
Task Date
Due Date
```

---

## Page 4 — Calendar

Purpose:

Plan tasks for specific dates.

Main workflow:

```text
Select Date
    ↓
Add One or Many Tasks
    ↓
Save Tasks
    ↓
Tasks assigned to selected date
```

Features:

```text
Monthly Calendar
Date Selection
Multiple Tasks Per Date
Task Creation
Priority
Due Date
Project
Open Daily Kanban
```

---

## Page 5 — My Work

Purpose:

Review historical daily work.

Features:

```text
Calendar / Date Selection
Daily Task Summary
Historical Kanban
Completed Tasks
Last Updated
Task History
```

---

## Page 6 — Notes

Purpose:

Store personal and work information.

Features:

```text
Folders
Subfolders
Notes
Search
Pin
Favorite
Tags
Markdown
Auto-save
Last Updated
Duplicate
TXT Export
Markdown Export
Print
Trash
```

---

## Page 7 — Projects

Purpose:

Separate tasks based on project.

Features:

```text
Create Project
Edit Project
Archive Project
Project Tasks
Project Statistics
Project Kanban
```

---

## Page 8 — Global Search / Command

Purpose:

Quickly find or execute anything.

```text
Ctrl + K
```

Search:

```text
Tasks
Notes
Projects
Tags
```

Commands:

```text
New Task
New Note
Open Kanban
Open Calendar
Open My Work
Open Settings
```

---

## Page 9 — Settings

Sections:

```text
Profile
Workspace
Notifications
Keyboard Shortcuts
Appearance
Data Export
Trash
Security
```

---

# 31. Recommended Dashboard Header

The header should contain:

```text
┌─────────────────────────────────────────────────────────┐
│ MYTASK   🔍 Search (Ctrl+K)       🔔   Workspace ▼ 👤  │
└─────────────────────────────────────────────────────────┘
```

This gives quick access to:

* Global Search
* Notifications
* Workspace
* Profile

---

# 32. Complete User Workflow

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

# 33. Development Phases

## Phase 1 — Project Foundation

```text
React
TypeScript
Vite
Hono
Cloudflare Workers
D1
Drizzle
Wrangler
```

## Phase 2 — Authentication

```text
Login
Session
Protected routes
Logout
```

## Phase 3 — Dashboard

```text
Sidebar
Header
Routing
Responsive layout
```

## Phase 4 — Task System

```text
Task CRUD
Status
Priority
Project
Task Date
Due Date
Drag & Drop
```

## Phase 5 — Calendar

```text
Calendar
Date selection
One/multiple task creation
Daily task retrieval
Calendar → Kanban
```

## Phase 6 — My Work

```text
Historical dates
Daily Kanban
Task history
Last updated
```

## Phase 7 — Notes

```text
Folders
Subfolders
Notes
Search
Pin
Favorite
Tags
Markdown
Auto-save
Export
```

## Phase 8 — Productivity Features

```text
Overdue tasks
Notifications
Reminders
Global Search
Command Palette
Keyboard shortcuts
```

## Phase 9 — Workspace

```text
Work
Personal
Workspace switching
Workspace-based tasks
Workspace-based notes
```

## Phase 10 — Data Safety

```text
Trash
Recovery
30-day deletion
CSV export
TXT export
Markdown export
JSON backup
```

## Phase 11 — Testing

Test:

```text
Authentication
Task CRUD
Kanban
Drag & Drop
Calendar
Multiple tasks per date
Overdue calculation
Notifications
Search
Notes
Nested folders
Trash
Restore
Export
Workspace switching
Responsive UI
```

## Phase 12 — Deployment

```text
GitHub
    ↓
Cloudflare
    ↓
React Frontend
    ↓
Cloudflare Worker
    ↓
D1 Database
```

---

# 34. Final MyTask Feature Set

```text
MYTASK
│
├── Authentication
│
├── Overview
│   ├── Today's Tasks
│   ├── Statistics
│   ├── Overdue Tasks
│   ├── High Priority
│   └── Notifications
│
├── Kanban
│   ├── To Do
│   ├── In Progress
│   ├── In Review
│   └── Done
│
├── Calendar
│   ├── Select Date
│   ├── Add One Task
│   ├── Add Multiple Tasks
│   └── Open Daily Kanban
│
├── My Work
│   ├── Historical Dates
│   ├── Daily Board
│   └── Task History
│
├── Projects
│   ├── Project Tasks
│   ├── Project Board
│   └── Project Archive
│
├── Notes
│   ├── Folders
│   ├── Subfolders
│   ├── Notes
│   ├── Search
│   ├── Pin
│   ├── Favorite
│   ├── Tags
│   ├── Markdown
│   ├── Auto-save
│   ├── TXT Export
│   ├── MD Export
│   └── Print
│
├── Global Search
│   └── Ctrl + K
│
├── Notifications
│   ├── Due Soon
│   ├── Due Today
│   ├── Overdue
│   └── Reminders
│
├── Workspace
│   ├── Work
│   └── Personal
│
├── Trash
│   ├── Restore
│   └── Permanent Delete
│
└── Settings
    ├── Profile
    ├── Notifications
    ├── Keyboard Shortcuts
    └── Data Export
```

---

# 35. Core Design Principle

The application should follow one central rule:

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

Do **not** duplicate task data for each page.

A task should exist once in the database, and every page should retrieve/filter the same task based on:

```text
workspace
project
date
status
priority
due date
```

This will keep MyTask scalable, maintainable, and easy to extend.

---

# 36. Final Development Goal

The final MyTask application should provide a simple workflow:

```text
PLAN
  ↓
Calendar
  ↓
Create one or multiple tasks
  ↓
EXECUTE
  ↓
Kanban
  ↓
Move tasks through statuses
  ↓
TRACK
  ↓
Notifications + Overdue + Priority
  ↓
REVIEW
  ↓
My Work + Task History
  ↓
DOCUMENT
  ↓
Notes
  ↓
PROTECT
  ↓
Trash + Recovery + Export
```

The application should remain **clean, fast, responsive, and easy to use**, rather than becoming unnecessarily complex like a full enterprise project-management platform.
