import { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { useAuth } from '../../features/auth/AuthContext';
import { tasksApi } from '../../services/api';
import { Task } from '../../types';
import { LayoutDashboard, CheckCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ClockWidget } from './ClockWidget';
import styles from './Overview.module.css';

export const Overview = () => {
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const tasksData = await tasksApi.list({ workspace_id: activeWorkspace.id });
      setTasks(tasksData.tasks || []);
    } catch (err) {
      console.error('Failed to fetch overview data', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <div className={styles.loading}>Loading Overview...</div>;
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const stats = {
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    inReview: tasks.filter(t => t.status === 'IN_REVIEW').length,
    done: tasks.filter(t => t.status === 'DONE').length,
    highPriority: tasks.filter(t => t.priority === 'HIGH' && t.status !== 'DONE').length,
  };

  const todaysTasks = tasks.filter(t => t.taskDate === todayStr && t.status !== 'DONE');
  const overdueTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'DONE') return false;
    return new Date(t.dueDate) < new Date(new Date().toDateString());
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.greeting}>{greeting}, {user?.username.split('@')[0]}</h1>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}><LayoutDashboard size={20} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>To Do</span>
            <span className={styles.statValue}>{stats.todo}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#3b82f6', backgroundColor: '#eff6ff' }}><Clock size={20} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>In Progress</span>
            <span className={styles.statValue}>{stats.inProgress}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#22c55e', backgroundColor: '#f0fdf4' }}><CheckCircle size={20} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Completed</span>
            <span className={styles.statValue}>{stats.done}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}><AlertTriangle size={20} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>High Priority</span>
            <span className={styles.statValue}>{stats.highPriority}</span>
          </div>
        </div>
      </section>

      <div className={styles.mainGrid}>
        <div className={styles.columnMain}>
          <section className={styles.listSection}>
            <div className={styles.sectionHeader}>
              <h2>Today's Tasks</h2>
              <Link to="/kanban" className={styles.viewAll}>View Board <ArrowRight size={14} /></Link>
            </div>
            {todaysTasks.length === 0 ? (
              <div className={styles.emptyState}>No tasks scheduled for today. Take a break!</div>
            ) : (
              <ul className={styles.taskList}>
                {todaysTasks.map(task => (
                  <li key={task.id} className={styles.taskItem}>
                    <div className={styles.taskPriorityBar} style={{ backgroundColor: task.priority === 'HIGH' ? '#ef4444' : task.priority === 'MEDIUM' ? '#f59e0b' : '#22c55e' }} />
                    <div className={styles.taskContent}>
                      <h4>{task.title}</h4>
                      {task.projectName && <span className={styles.projectTag}>{task.projectName}</span>}
                    </div>
                    <span className={styles.taskStatus}>{task.status.replace('_', ' ')}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={styles.listSection}>
            <div className={styles.sectionHeader}>
              <h2>Overdue <span className={styles.badgeCount}>{overdueTasks.length}</span></h2>
            </div>
            {overdueTasks.length === 0 ? (
              <div className={styles.emptyState}>You're all caught up!</div>
            ) : (
              <ul className={styles.taskList}>
                {overdueTasks.map(task => (
                  <li key={task.id} className={`${styles.taskItem} ${styles.taskItemOverdue}`}>
                    <div className={styles.taskContent}>
                      <h4>{task.title}</h4>
                      <span className={styles.dueText}>Was due {new Date(task.dueDate!).toLocaleDateString()}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className={styles.columnSide}>
          <ClockWidget />
        </div>
      </div>
    </div>
  );
};
