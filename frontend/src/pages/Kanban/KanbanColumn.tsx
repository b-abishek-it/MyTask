import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import styles from './Kanban.module.css';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  children: ReactNode;
  onCreateTask?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  TODO: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  IN_REVIEW: '#f59e0b',
  DONE: '#22c55e',
};

export const KanbanColumn = ({ id, title, count, children, onCreateTask }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${styles.column} ${isOver ? styles.columnOver : ''}`}
    >
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleRow}>
          <span
            className={styles.columnDot}
            style={{ backgroundColor: STATUS_COLORS[id] || '#6b7280' }}
          />
          <h3 className={styles.columnTitle}>{title}</h3>
          <span className={styles.columnCount}>{count}</span>
        </div>
      </div>
      <div className={styles.columnContent}>
        {children}
        {onCreateTask && (
          <button className={styles.inlineCreateBtn} onClick={onCreateTask}>
            + Create task
          </button>
        )}
      </div>
    </div>
  );
};
