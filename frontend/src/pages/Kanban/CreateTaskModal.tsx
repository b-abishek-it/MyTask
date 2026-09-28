import React, { useState } from 'react';
import { tasksApi, projectsApi } from '../../services/api';
import { Project } from '../../types';
import { X, Search, Plus, ChevronDown } from 'lucide-react';
import styles from './Kanban.module.css';

interface CreateTaskModalProps {
  projects: Project[];
  workspaceId: string;
  onClose: () => void;
  onCreated: () => void;
  defaultDate?: string;
}

export const CreateTaskModal = ({ projects, workspaceId, onClose, onCreated, defaultDate }: CreateTaskModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const formatLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [projectId, setProjectId] = useState('');
  const [taskDate, setTaskDate] = useState(defaultDate || formatLocalDate(new Date()));
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localProjects, setLocalProjects] = useState<Project[]>(projects);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  const filteredProjects = localProjects.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));

  const handleCreateProject = async () => {
    if (!projectSearch.trim()) return;
    try {
      const res = await projectsApi.create({ name: projectSearch.trim(), workspaceId });
      if (res.project) {
        setLocalProjects([...localProjects, res.project]);
        setProjectId(res.project.id);
      }
      setIsProjectDropdownOpen(false);
      setProjectSearch('');
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);

    try {
      await tasksApi.create({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        projectId: projectId || null,
        taskDate: taskDate || null,
        dueDate: dueDate || null,
        workspaceId,
        status: 'TODO',
      });
      onCreated();
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Create Task</h2>
          <button onClick={onClose} className={styles.modalCloseBtn}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalField}>
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              autoFocus
              required
            />
          </div>
          <div className={styles.modalField}>
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
            />
          </div>
          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className={styles.modalField}>
              <label>Project</label>
              <div className={styles.customSelect}>
                <div 
                  className={styles.customSelectValue} 
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                >
                  {localProjects.find(p => p.id === projectId)?.name || 'No Project'}
                  <ChevronDown size={14} />
                </div>
                {isProjectDropdownOpen && (
                  <div className={styles.customSelectMenu}>
                    <div className={styles.customSelectSearch}>
                      <Search size={14} />
                      <input 
                        autoFocus
                        value={projectSearch} 
                        onChange={(e) => setProjectSearch(e.target.value)} 
                        placeholder="Search projects..." 
                      />
                    </div>
                    <div className={styles.customSelectList}>
                      <div className={styles.customSelectOption} onClick={() => { setProjectId(''); setIsProjectDropdownOpen(false); }}>
                        No Project
                      </div>
                      {filteredProjects.map(p => (
                        <div key={p.id} className={styles.customSelectOption} onClick={() => { setProjectId(p.id); setIsProjectDropdownOpen(false); }}>
                          {p.name}
                        </div>
                      ))}
                      {projectSearch && !filteredProjects.find(p => p.name.toLowerCase() === projectSearch.toLowerCase()) && (
                        <div className={styles.customSelectCreateOption} onClick={handleCreateProject}>
                          <Plus size={14} /> Create "{projectSearch}"
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label>Task Date</label>
              <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
            </div>
            <div className={styles.modalField}>
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>Cancel</button>
            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
