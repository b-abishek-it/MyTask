import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { workApi } from '../../services/api';
import { Task, TaskHistory, DailyWorkSummary } from '../../types';
import { ChevronLeft, ChevronRight, CheckCircle, Clock } from 'lucide-react';
import styles from './MyWork.module.css';

export const MyWork = () => {
  const { activeWorkspace } = useWorkspace();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workDays, setWorkDays] = useState<DailyWorkSummary[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchWorkDays = useCallback(async () => {
    if (!activeWorkspace) return;
    const monthStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    try {
      const data = await workApi.getSummary(monthStr, activeWorkspace.id);
      setWorkDays(data.days || []);
      if (data.days?.length > 0 && !selectedDate) {
        setSelectedDate(data.days[0].date);
      }
    } catch (err) {
      console.error('Failed to fetch work summary', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, currentMonth, selectedDate]);

  useEffect(() => {
    fetchWorkDays();
  }, [fetchWorkDays]);

  useEffect(() => {
    if (!selectedDate || !activeWorkspace) return;
    const fetchDailyDetails = async () => {
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
    };
    fetchDailyDetails();
  }, [selectedDate, activeWorkspace]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const formatStatus = (status: string) => status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className={styles.container}>
      <div className={styles.historySidebar}>
        <div className={styles.monthSelector}>
          <button onClick={prevMonth} className={styles.navBtn}><ChevronLeft size={16} /></button>
          <h3>{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={nextMonth} className={styles.navBtn}><ChevronRight size={16} /></button>
        </div>
        
        {isLoading ? (
          <div className={styles.loadingSidebar}>Loading history...</div>
        ) : workDays.length === 0 ? (
          <div className={styles.emptySidebar}>No work recorded this month.</div>
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
          <div className={styles.emptyDetail}>Select a date to view work history.</div>
        ) : isDetailLoading ? (
          <div className={styles.loadingDetail}>Loading details...</div>
        ) : (
          <>
            <div className={styles.detailHeader}>
              <h2>Daily Summary: {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h2>
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
                <h3>Tasks for this day</h3>
                <div className={styles.tasksGrid}>
                  {tasks.map(task => (
                    <div key={task.id} className={styles.taskCard}>
                      <h4>{task.title}</h4>
                      <span className={styles.taskStatus}>{formatStatus(task.status)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.timelineSection}>
                <h3>Activity Timeline</h3>
                {history.length === 0 ? (
                  <p className={styles.emptyTimeline}>No status changes recorded on this day.</p>
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
    </div>
  );
};
