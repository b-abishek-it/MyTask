
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { Clock, AlertTriangle } from 'lucide-react';
import styles from './Kanban.module.css';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

const formatRelativeTime = (dateStr: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const isOverdue = (task: Task) => {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
};

export const TaskCard = ({ task, isDragging, onClick }: TaskCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  const overdue = isOverdue(task);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${styles.taskCard} ${isDragging ? styles.taskCardDragging : ''}`}
      onClick={onClick}
    >
      <div
        className={styles.taskCardPriorityBar}
        style={{ backgroundColor: PRIORITY_COLORS[task.priority] || '#6b7280' }}
      />
      <div className={styles.taskCardContent}>
        <h4 className={styles.taskCardTitle}>{task.title}</h4>

        {task.projectName && (
          <span className={styles.taskCardProject}>{task.projectName}</span>
        )}

        <div className={styles.taskCardMeta}>
          <span
            className={styles.taskCardPriority}
            style={{ color: PRIORITY_COLORS[task.priority] }}
          >
            {task.priority}
          </span>

          {task.taskDate && (
            <span className={styles.taskCardDate}>
              {new Date(task.taskDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          )}

          {task.dueDate && (
            <span className={`${styles.taskCardDue} ${overdue ? styles.overdue : ''}`}>
              Due: {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

        {overdue && (
          <div className={styles.overdueTag}>
            <AlertTriangle size={12} /> Overdue
          </div>
        )}

        <div className={styles.taskCardFooter}>
          <span className={styles.taskCardUpdated}>
            <Clock size={12} /> {formatRelativeTime(task.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
};
