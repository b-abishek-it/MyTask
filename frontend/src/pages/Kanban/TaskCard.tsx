import { useState, useEffect, useRef, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, TaskStatus } from '../../types';
import { Clock, AlertTriangle, MoreVertical, ArrowRight, Check } from 'lucide-react';
import styles from './Kanban.module.css';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
  onStatusChange?: (taskId: string, newStatus: TaskStatus) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#22c55e',
};

const STATUS_OPTIONS: { id: TaskStatus; label: string }[] = [
  { id: 'TODO', label: 'To Do' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'IN_REVIEW', label: 'In Review' },
  { id: 'DONE', label: 'Done' },
];

const formatDaysAgo = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays} days ago`;
};

const isOverdue = (task: Task) => {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
};

const isDueSoon = (task: Task) => {
  if (!task.dueDate || task.status === 'DONE') return false;
  const due = new Date(task.dueDate);
  const now = new Date(new Date().toDateString());
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= 2;
};

export const TaskCard = memo(({ task, isDragging, onClick, onStatusChange }: TaskCardProps) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  // Click-away and Escape key listener
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  };

  const overdue = isOverdue(task);
  const dueSoon = isDueSoon(task);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleStatusSelect = (e: React.MouseEvent, status: TaskStatus) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    if (onStatusChange) {
      onStatusChange(task.id, status);
    }
  };

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
        <div className={styles.cardHeader}>
          <h4 className={styles.taskCardTitle}>{task.title}</h4>
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              className={styles.iconButton}
              onClick={toggleDropdown}
              aria-label="Task actions"
            >
              <MoreVertical size={16} />
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.dropdownItem} ${opt.id === task.status ? styles.dropdownItemActive : ''}`}
                    onClick={(e) => handleStatusSelect(e, opt.id)}
                    disabled={opt.id === task.status}
                  >
                    {opt.id === task.status ? <Check size={14} /> : <ArrowRight size={14} />}
                    {opt.id === task.status ? opt.label : `Move to ${opt.label}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

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

          <span className={styles.taskCardDate}>
            Created: {new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
          </span>

          {task.dueDate && (
            <span className={`${styles.taskCardDue} ${overdue ? styles.overdue : dueSoon ? styles.dueSoon : ''}`}>
              Due: {new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
            </span>
          )}
        </div>

        {overdue && (
          <div className={styles.overdueTag}>
            <AlertTriangle size={12} /> Overdue
          </div>
        )}
        {dueSoon && !overdue && (
          <div className={styles.dueSoonTag}>
            <AlertTriangle size={12} /> Due Soon
          </div>
        )}

        <div className={styles.taskCardFooter}>
          <span className={styles.taskCardUpdated}>
            <Clock size={12} /> Created {formatDaysAgo(task.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
});

