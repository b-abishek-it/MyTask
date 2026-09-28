import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { tasksApi, projectsApi } from '../../services/api';
import { Task, Project, TaskStatus } from '../../types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskDetailPanel } from './TaskDetailPanel';
import { Plus, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import styles from './Kanban.module.css';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'TODO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'IN_REVIEW', title: 'In Review' },
  { id: 'DONE', title: 'Done' },
];

const formatLocalDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const Kanban = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date') || formatLocalDate(new Date());

  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterProject, setFilterProject] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchTasks = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const params: any = { workspace_id: activeWorkspace.id };
      if (filterPriority) params.priority = filterPriority;
      if (filterProject) params.project_id = filterProject;
      const data = await tasksApi.list(params);
      setTasks((data.tasks || []).filter((t: Task) => t.taskDate === dateParam));
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, filterPriority, filterProject, dateParam]);

  const fetchProjects = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const data = await projectsApi.list({ workspace_id: activeWorkspace.id });
      setProjects(data.projects || []);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, [fetchTasks, fetchProjects]);

  const getColumnTasks = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find((t) => t.id === taskId);

    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await tasksApi.updateStatus(taskId, newStatus);
    } catch (err) {
      // Revert on error
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: task.status } : t))
      );
      console.error('Failed to update status:', err);
    }
  };

  const handleTaskCreated = () => {
    setShowCreateModal(false);
    fetchTasks();
  };

  const handleTaskUpdated = () => {
    setSelectedTask(null);
    fetchTasks();
  };

  const handleTaskDeleted = () => {
    setSelectedTask(null);
    fetchTasks();
  };

  const handlePrevDay = () => {
    const d = new Date(dateParam + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSearchParams({ date: formatLocalDate(d) });
  };

  const handleNextDay = () => {
    const d = new Date(dateParam + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSearchParams({ date: formatLocalDate(d) });
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading tasks...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <h1 className={styles.pageTitle}>Daily Board</h1>
          <div className={styles.dateNavigator} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px', marginRight: '16px' }}>
            <button onClick={handlePrevDay} className={styles.navBtn} style={{ cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}><ChevronLeft size={18} /></button>
            <h2 className={styles.dateLabel} style={{ fontSize: '16px', margin: 0, fontWeight: 600 }}>{new Date(dateParam).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
            <button onClick={handleNextDay} className={styles.navBtn} style={{ cursor: 'pointer', background: 'none', border: 'none', display: 'flex', alignItems: 'center' }}><ChevronRight size={18} /></button>
          </div>
          <span className={styles.taskCount}>{tasks.length} tasks</span>
        </div>
        <div className={styles.topBarRight}>
          <button
            className={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} /> Filters
          </button>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} /> Create Task
          </button>
        </div>
      </div>

      {showFilters && (
        <div className={styles.filterBar}>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            className={styles.clearFilters}
            onClick={() => { setFilterPriority(''); setFilterProject(''); }}
          >
            Clear
          </button>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className={styles.board}>
          {COLUMNS.map((col) => {
            const columnTasks = getColumnTasks(col.id);
            return (
              <KanbanColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                count={columnTasks.length}
                onCreateTask={col.id === 'TODO' ? () => setShowCreateModal(true) : undefined}
              >
                <SortableContext items={columnTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
                  ))}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          workspaceId={activeWorkspace?.id || ''}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTaskCreated}
          defaultDate={dateParam}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          projects={projects}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
};
