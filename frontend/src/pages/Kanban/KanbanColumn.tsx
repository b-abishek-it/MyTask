import { ReactNode, useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { MoreHorizontal, Plus } from 'lucide-react';
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDropdownOpen(!isDropdownOpen);
  };

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

          <div className={styles.dropdownContainer} ref={dropdownRef} style={{ marginLeft: 'auto' }}>
            <button
              className={styles.iconButton}
              onClick={toggleDropdown}
              aria-label={`${title} column actions`}
            >
              <MoreHorizontal size={16} />
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {onCreateTask && (
                  <button
                    className={styles.dropdownItem}
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDropdownOpen(false);
                      onCreateTask();
                    }}
                  >
                    <Plus size={14} /> Add Task
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.columnContent}>
        {children}
        {onCreateTask && (
          <button className={styles.inlineCreateBtn} onClick={onCreateTask} aria-label="Create task">
            + Create task
          </button>
        )}
      </div>
    </div>
  );
};

