import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { workApi, tasksApi } from '../../services/api';
import { Task, TaskHistory, DailyWorkSummary } from '../../types';
import { ChevronLeft, ChevronRight, CheckCircle2, Circle, Clock, CheckCircle, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { TaskDetailPanel } from '../Kanban/TaskDetailPanel';
import styles from './MyWork.module.css';

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

export const MyWork = () => {
  const { activeWorkspace } = useWorkspace();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workDays, setWorkDays] = useState<DailyWorkSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const fetchWorkDays = useCallback(async () => {
    if (!activeWorkspace) return;
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    try {
      const data = await workApi.getSummary(monthStr, activeWorkspace.id);
      setWorkDays(data.days || []);
      setSelectedDate((prevSelectedDate) => {
        if (data.days?.length > 0) {
          if (!prevSelectedDate || !data.days.find((d: any) => d.date === prevSelectedDate)) {
            return data.days[0].date;
          }
          return prevSelectedDate;
        }
        return null;
      });
    } catch (err) {
      console.error('Failed to fetch work summary', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, currentMonth]);

  useEffect(() => {
    fetchWorkDays();
  }, [fetchWorkDays]);

  const fetchDailyDetails = useCallback(async () => {
    if (!selectedDate || !activeWorkspace) {
      setTasks([]);
      setHistory([]);
      return;
    }
    setIsDetailLoading(true);
    try {
      const data = await workApi.getDate(selectedDate, activeWorkspace.id);
      setTasks(data.tasks || []);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch daily details', err);
    } finally {
      setIsDetailLoading(false);
    }
  }, [selectedDate, activeWorkspace]);

  useEffect(() => {
    fetchDailyDetails();
  }, [fetchDailyDetails]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  const toggleTaskStatus = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await tasksApi.updateStatus(task.id, newStatus);
      fetchDailyDetails(); // refresh details and history
      fetchWorkDays(); // refresh progress bar on left
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const renderTaskRow = (task: Task) => (
    <div key={task.id} className={styles.taskRow} onClick={() => setActiveTask(task)}>
      <div className={`${styles.checkbox} ${task.status === 'DONE' ? styles.checkboxDone : ''}`} onClick={(e) => toggleTaskStatus(e, task)}>
        {task.status === 'DONE' ? <CheckCircle2 size={20} /> : <Circle size={20} />}
      </div>
      <div className={styles.taskTitle}>{task.title}</div>
      
      {task.projectName && (
        <div className={styles.taskProject}>
          <Tag size={12} /> {task.projectName}
        </div>
      )}
      
      <div className={styles.taskMeta}>
        <div className={styles.taskDate}>
          <CalendarIcon size={14} /> 
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}
        </div>
        <div className={styles.taskPriority} style={{ color: PRIORITY_COLORS[task.priority] }}>
          {task.priority}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.historySidebar}>
        <div className={styles.monthSelector}>
          <button onClick={prevMonth} className={styles.navBtn}><ChevronLeft size={16} /></button>
          <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={nextMonth} className={styles.navBtn}><ChevronRight size={16} /></button>
        </div>
        
        {isLoading ? (
          <div className={styles.emptySidebar}>Loading history...</div>
        ) : workDays.length === 0 ? (
          <div className={styles.emptySidebar}>
            <Clock size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
            No work recorded this month.
          </div>
        ) : (
          <div className={styles.dayList}>
            {workDays.map((day) => (
              <button
                key={day.date}
                className={`${styles.dayBtn} ${selectedDate === day.date ? styles.dayBtnActive : ''}`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className={styles.dayInfo}>
                  <span className={styles.dayDate}>
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  <span className={styles.dayStats}>
                    {day.completedTasks}/{day.totalTasks} Done
                  </span>
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill} 
                    style={{ width: `${day.totalTasks > 0 ? (day.completedTasks / day.totalTasks) * 100 : 0}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.workDetail}>
        {!selectedDate ? (
          <div className={styles.emptyDetail}>
            <CheckCircle size={48} className={styles.emptyStateIcon} />
            <p>Select a date to view your work history.</p>
          </div>
        ) : isDetailLoading ? (
          <div className={styles.loadingDetail}>Loading details...</div>
        ) : (
          <>
            <div className={styles.detailHeader}>
              <h2 className={styles.detailTitle}>
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <div className={styles.headerStats}>
                <div className={styles.headerStat}>
                  <CheckCircle size={16} color="#22c55e" />
                  <span>{tasks.filter(t => t.status === 'DONE').length} Completed</span>
                </div>
                <div className={styles.headerStat}>
                  <Clock size={16} color="#3b82f6" />
                  <span>{tasks.filter(t => t.status !== 'DONE').length} Pending</span>
                </div>
              </div>
            </div>

            <div className={styles.detailContent}>
              <div className={styles.tasksSection}>
                <h3 className={styles.sectionTitle}>Tasks for this day</h3>
                {tasks.length === 0 ? (
                  <p className={styles.emptyText}>No tasks assigned to this date.</p>
                ) : (
                  <div className={styles.tasksList}>
                    {tasks.map(renderTaskRow)}
                  </div>
                )}
              </div>

              <div className={styles.timelineSection}>
                <h3 className={styles.sectionTitle}>Activity Timeline</h3>
                {history.length === 0 ? (
                  <p className={styles.emptyText}>No status changes recorded on this day.</p>
                ) : (
                  <div className={styles.timeline}>
                    {history.map(h => {
                      const task = tasks.find(t => t.id === h.taskId);
                      return (
                        <div key={h.id} className={styles.timelineItem}>
                          <div className={styles.timelineDot} />
                          <div className={styles.timelineInfo}>
                            <span className={styles.timelineTime}>
                              {new Date(h.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className={styles.timelineText}>
                              <strong>{task?.title || 'Unknown Task'}</strong> moved from{' '}
                              <em>{h.oldStatus ? formatStatus(h.oldStatus) : 'creation'}</em> to{' '}
                              <em>{formatStatus(h.newStatus)}</em>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {activeTask && (
        <TaskDetailPanel
          task={activeTask}
          projects={[]}
          onClose={() => setActiveTask(null)}
          onUpdated={() => {
            setActiveTask(null);
            fetchDailyDetails();
            fetchWorkDays();
          }}
          onDeleted={() => {
            setActiveTask(null);
            fetchDailyDetails();
            fetchWorkDays();
          }}
        />
      )}
    </div>
  );
};
