import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { calendarApi, projectsApi } from '../../services/api';
import { Task, Project, CalendarDaySummary } from '../../types';
import { ChevronLeft, ChevronRight, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CreateTaskModal } from '../Kanban/CreateTaskModal';
import styles from './Calendar.module.css';

export const CalendarPage = () => {
  const { activeWorkspace } = useWorkspace();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [monthData, setMonthData] = useState<Record<string, CalendarDaySummary>>({});
  const [selectedTasks, setSelectedTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [, setIsLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchMonthData = useCallback(async () => {
    if (!activeWorkspace) return;
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    try {
      const data = await calendarApi.getMonth(monthStr, activeWorkspace.id);
      const dataMap = data.dates?.reduce((acc: any, curr: any) => {
        acc[curr.date] = curr;
        return acc;
      }, {});
      setMonthData(dataMap || {});
    } catch (err) {
      console.error('Failed to fetch month data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, year, month]);

  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fetchSelectedDateTasks = useCallback(async () => {
    if (!activeWorkspace) return;
    const dateStr = formatLocalDate(selectedDate);
    try {
      const data = await calendarApi.getDate(dateStr, activeWorkspace.id);
      setSelectedTasks(data.tasks || []);
    } catch (err) {
      console.error('Failed to fetch daily tasks', err);
    }
  }, [activeWorkspace, selectedDate]);

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
        </div>

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
              const dayData = monthData[dateStr];
              const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

              return (
                <div
                  key={day}
                  className={`${styles.day} ${isSelected ? styles.daySelected : ''} ${isToday ? styles.dayToday : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  <span className={styles.dayNumber}>{day}</span>
                  {dayData && dayData.total > 0 && (
                    <div className={styles.dayIndicators}>
                      {dayData.done > 0 && <span className={styles.indicatorDone} title={`${dayData.done} Done`} />}
                      {dayData.inProgress > 0 && <span className={styles.indicatorInProgress} title={`${dayData.inProgress} In Progress`} />}
                      {dayData.todo > 0 && <span className={styles.indicatorTodo} title={`${dayData.todo} To Do`} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.sidePanel}>
        <div className={styles.sideHeader}>
          <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
          <button className={styles.addBtn} onClick={() => setShowCreateModal(true)}>
            <Plus size={16} /> Add Task
          </button>
        </div>

        <div className={styles.sideContent}>
          {selectedTasks.length === 0 ? (
            <div className={styles.emptyTasks}>No tasks for this date.</div>
          ) : (
            <ul className={styles.taskList}>
              {selectedTasks.map(task => (
                <li key={task.id} className={styles.taskItem}>
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
            fetchSelectedDateTasks();
            fetchMonthData();
          }}
          defaultDate={selectedDateStr}
        />
      )}
    </div>
  );
};
