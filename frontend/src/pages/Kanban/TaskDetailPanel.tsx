import { useState, useEffect } from 'react';
import { tasksApi } from '../../services/api';
import { Task, Project, TaskHistory } from '../../types';
import { X, Trash2, Clock, ArrowRight, Edit2 } from 'lucide-react';
import styles from './Kanban.module.css';

interface TaskDetailPanelProps {
  task: Task;
  projects: Project[];
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export const TaskDetailPanel = ({ task, projects, onClose, onUpdated, onDeleted }: TaskDetailPanelProps) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority);
  const [projectId, setProjectId] = useState(task.projectId || '');
  const [taskDate, setTaskDate] = useState(task.taskDate || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [history, setHistory] = useState<TaskHistory[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    tasksApi.get(task.id).then((data: any) => {
      if (data.history) setHistory(data.history);
    }).catch(console.error);
  }, [task.id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await tasksApi.update(task.id, {
        title,
        description: description || null,
        priority,
        projectId: projectId || null,
        taskDate: taskDate || null,
        dueDate: dueDate || null,
      });
      setIsEditing(false);
      onUpdated();
    } catch (err) {
      console.error('Failed to update task:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await tasksApi.delete(task.id);
      onDeleted();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Task Details</h2>
          <div className={styles.panelHeaderActions}>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className={styles.editBtn} title="Edit Task" style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', padding: '4px' }}>
                <Edit2 size={16} />
              </button>
            )}
            <button onClick={() => setShowConfirmDelete(true)} className={styles.deleteBtn} title="Move to Trash">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className={styles.modalCloseBtn}><X size={18} /></button>
          </div>
        </div>

        <div className={styles.modalForm}>
          <div className={styles.modalField}>
            <label>Title</label>
            {isEditing ? (
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
            ) : (
              <div style={{ fontSize: '16px', fontWeight: 500, padding: '8px 0' }}>{title}</div>
            )}
          </div>

          <div className={styles.modalField}>
            <label>Description</label>
            {isEditing ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Add a description..."
              />
            ) : (
              <div style={{ padding: '8px 0', color: description ? 'var(--color-text)' : 'var(--color-text-light)' }}>
                {description || 'No description provided.'}
              </div>
            )}
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Status</label>
              <span className={styles.statusBadge}>{formatStatus(task.status)}</span>
            </div>
            <div className={styles.modalField}>
              <label>Priority</label>
              {isEditing ? (
                <select value={priority} onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH")}>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              ) : (
                <div style={{ padding: '8px 0' }}>{priority.charAt(0) + priority.slice(1).toLowerCase()}</div>
              )}
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Project</label>
              {isEditing ? (
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                  <option value="">No Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                <div style={{ padding: '8px 0' }}>{projects.find(p => p.id === projectId)?.name || 'No Project'}</div>
              )}
            </div>
          </div>

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Task Date</label>
              {isEditing ? (
                <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
              ) : (
                <div style={{ padding: '8px 0' }}>{taskDate ? new Date(taskDate).toLocaleDateString() : 'Not set'}</div>
              )}
            </div>
            <div className={styles.modalField}>
              <label>Due Date</label>
              {isEditing ? (
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              ) : (
                <div style={{ padding: '8px 0' }}>{dueDate ? new Date(dueDate).toLocaleDateString() : 'Not set'}</div>
              )}
            </div>
          </div>

          {/* Task History Timeline */}
          {history.length > 0 && (
            <div className={styles.historySection}>
              <h3 className={styles.historyTitle}><Clock size={14} /> Task History</h3>
              <div className={styles.timeline}>
                {history.map((h) => (
                  <div key={h.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineStatus}>
                        {h.oldStatus ? (
                          <>{formatStatus(h.oldStatus)} <ArrowRight size={12} /> {formatStatus(h.newStatus)}</>
                        ) : (
                          <>Task created as {formatStatus(h.newStatus)}</>
                        )}
                      </span>
                      <span className={styles.timelineDate}>
                        {new Date(h.changedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setIsEditing(false)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleSave} className={styles.submitBtn} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>

      {showConfirmDelete && (
        <div className={styles.modalOverlay} onClick={() => setShowConfirmDelete(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className={styles.modalHeader}>
              <h2>Delete Task</h2>
              <button onClick={() => setShowConfirmDelete(false)} className={styles.modalCloseBtn}><X size={18} /></button>
            </div>
            <div className={styles.modalForm} style={{ padding: '20px' }}>
              <p style={{ margin: 0, fontSize: '15px', color: 'var(--color-text)' }}>
                Are you sure you want to delete this task? This action cannot be undone.
              </p>
              <div className={styles.modalActions} style={{ marginTop: '24px' }}>
                <button type="button" onClick={() => setShowConfirmDelete(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="button" onClick={handleDelete} className={styles.submitBtn} style={{ background: 'var(--color-error)' }}>
                  Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
