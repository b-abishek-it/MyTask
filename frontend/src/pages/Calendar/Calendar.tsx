import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { calendarApi, projectsApi, tasksApi } from '../../services/api';
import { Task, Project } from '../../types';
import { ChevronLeft, ChevronRight, Plus, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { CreateTaskModal } from '../Kanban/CreateTaskModal';
import { TaskDetailPanel } from '../Kanban/TaskDetailPanel';
import { DndContext, useDroppable, DragEndEvent } from '@dnd-kit/core';
import styles from './Calendar.module.css';

const CalendarCell = ({ 
  day, year, month, isSelected, isToday, tasks, onSelect, onAdd 
}: any) => {
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });

  const doneCount = tasks?.filter((t: Task) => t.status === 'DONE').length || 0;
  const inProgressCount = tasks?.filter((t: Task) => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length || 0;
  const todoCount = tasks?.filter((t: Task) => t.status === 'TODO').length || 0;
  const total = tasks?.length || 0;

  return (
    <div
      ref={setNodeRef}
      className={`${styles.day} ${isSelected ? styles.daySelected : ''} ${isToday ? styles.dayToday : ''} ${isOver ? styles.dayOver : ''}`}
      onClick={() => onSelect(day)}
    >
      <div className={styles.dayHeader}>
        <span className={styles.dayNumber}>{day}</span>
        <button className={styles.quickAddBtn} onClick={(e) => { e.stopPropagation(); onAdd(dateStr); }}>
          <Plus size={14} />
        </button>
      </div>
      
      {total > 0 && (
        <div className={styles.dayIndicators}>
          {doneCount > 0 && <span className={styles.indicatorDone} title={`${doneCount} Done`} />}
          {inProgressCount > 0 && <span className={styles.indicatorInProgress} title={`${inProgressCount} In Progress`} />}
          {todoCount > 0 && <span className={styles.indicatorTodo} title={`${todoCount} To Do`} />}
        </div>
      )}
    </div>
  );
};

export const CalendarPage = () => {
  const { activeWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  
  const initialDate = dateParam ? new Date(dateParam + 'T12:00:00') : new Date();
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  
  const [monthTasks, setMonthTasks] = useState<Record<string, Task[]>>({});
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalDate, setCreateModalDate] = useState<string>('');
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  const [viewType, setViewType] = useState<'month'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchMonthData = useCallback(async () => {
    if (!activeWorkspace) return;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    try {
      const data = await calendarApi.getMonth(monthStr, activeWorkspace.id);
      const tasksByDate: Record<string, Task[]> = {};
      
      data.tasks?.forEach((task: Task) => {
        const date = task.taskDate;
        if (!date) return;
        if (!tasksByDate[date]) tasksByDate[date] = [];
        tasksByDate[date].push(task);
      });
      
      setMonthTasks(tasksByDate);
    } catch (err) {
      console.error('Failed to fetch month data', err);
    }
  }, [activeWorkspace, year, month]);

  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fetchSelectedDateTasks = useCallback(async () => {
    const dateStr = formatLocalDate(selectedDate);
    if (monthTasks[dateStr]) {
      setSelectedTasks(monthTasks[dateStr]);
    } else {
      setSelectedTasks([]);
    }
  }, [selectedDate, monthTasks]);

  useEffect(() => {
    fetchMonthData();
  }, [fetchMonthData]);

  useEffect(() => {
    fetchSelectedDateTasks();
  }, [fetchSelectedDateTasks]);

  useEffect(() => {
    if (activeWorkspace) {
      projectsApi.list({ workspace_id: activeWorkspace.id })
        .then(data => setProjects(data.projects || []))
        .catch(console.error);
    }
  }, [activeWorkspace]);

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateClick = (day: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newDate = over.id as string;
    const task = active.data.current?.task as Task;

    if (!task || task.taskDate === newDate) return;

    // Optimistic update
    setMonthTasks(prev => {
      const next = { ...prev };
      if (task.taskDate && next[task.taskDate]) {
        next[task.taskDate] = next[task.taskDate].filter(t => t.id !== taskId);
      }
      if (!next[newDate]) next[newDate] = [];
      next[newDate] = [...next[newDate], { ...task, taskDate: newDate }];
      return next;
    });

    try {
      await tasksApi.update(taskId, { ...task, taskDate: newDate });
    } catch (err) {
      console.error('Failed to update task date', err);
      fetchMonthData();
    }
  };

  const openQuickCreate = (dateStr: string) => {
    setCreateModalDate(dateStr);
    setShowCreateModal(true);
  };

  const selectedDateStr = formatLocalDate(selectedDate);

  return (
    <div className={styles.container}>
      <div className={styles.calendarSection}>
        <div className={styles.header}>
          <div className={styles.monthSelector}>
            <button onClick={prevMonth} className={styles.navBtn}><ChevronLeft size={20} /></button>
            <h2 className={styles.monthTitle}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={nextMonth} className={styles.navBtn}><ChevronRight size={20} /></button>
          </div>
          
          <div className={styles.viewToggles}>
            <button className={`${styles.viewToggle} ${viewType === 'month' ? styles.activeView : ''}`} onClick={() => setViewType('month')}>
              <CalendarIcon size={16} /> Month
            </button>
          </div>
        </div>

        <DndContext onDragEnd={handleDragEnd}>
          <div className={styles.gridContainer}>
            <div className={styles.weekdays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className={styles.weekday}>{d}</div>
              ))}
            </div>

            <div className={styles.daysGrid}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className={styles.emptyDay} />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const tasks = monthTasks[dateStr] || [];
                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                return (
                  <CalendarCell
                    key={day}
                    day={day}
                    year={year}
                    month={month}
                    isSelected={isSelected}
                    isToday={isToday}
                    tasks={tasks}
                    onSelect={handleDateClick}
                    onAdd={openQuickCreate}
                  />
                );
              })}
            </div>
          </div>
        </DndContext>
      </div>

      <div className={styles.sidePanel}>
        <div className={styles.sideHeader}>
          <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
          <button className={styles.addBtn} onClick={() => openQuickCreate(selectedDateStr)}>
            <Plus size={16} /> Add Task
          </button>
        </div>

        <div className={styles.sideContent}>
          {selectedTasks.length === 0 ? (
            <div className={styles.emptyTasks}>No tasks for this date.</div>
          ) : (
            <ul className={styles.taskList}>
              {selectedTasks.map(task => (
                <li key={task.id} className={styles.taskItem} onClick={() => setActiveTask(task)}>
                  <div className={styles.taskHeader}>
                    <span className={styles.taskTitle}>{task.title}</span>
                    <span className={styles.taskStatus}>{task.status.replace('_', ' ')}</span>
                  </div>
                  {task.projectName && <span className={styles.taskProject}>{task.projectName}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.sideFooter}>
          <Link to={`/kanban?date=${selectedDateStr}`} className={styles.openKanbanBtn}>
            Open in Kanban <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {showCreateModal && (
        <CreateTaskModal
          projects={projects}
          workspaceId={activeWorkspace?.id || ''}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchMonthData();
          }}
          defaultDate={createModalDate}
        />
      )}

      {activeTask && (
        <TaskDetailPanel
          task={activeTask}
          projects={projects}
          onClose={() => setActiveTask(null)}
          onUpdated={() => {
            setActiveTask(null);
            fetchMonthData();
          }}
          onDeleted={() => {
            setActiveTask(null);
            fetchMonthData();
          }}
        />
      )}
    </div>
  );
}
