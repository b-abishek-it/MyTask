import { useState, useEffect } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { User, Settings as SettingsIcon, Database, Trash2, Download, AlertCircle } from 'lucide-react';
import styles from './Settings.module.css';
import { trashApi } from '../../services/api';

export const Settings = () => {
  const { user } = useAuth();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Trash State
  const [deletedTasks, setDeletedTasks] = useState<any[]>([]);
  const [deletedNotes, setDeletedNotes] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'trash') {
      fetchTrash();
    }
  }, [activeTab]);

  const fetchTrash = async () => {
    try {
      const [tasksRes, notesRes] = await Promise.all([
        trashApi.listTasks(),
        trashApi.listNotes()
      ]);
      setDeletedTasks(tasksRes.tasks || []);
      setDeletedNotes(notesRes.notes || []);
    } catch (err) {
      console.error('Failed to fetch trash', err);
    }
  };

  const handleRestoreTask = async (id: string) => {
    await trashApi.restoreTask(id);
    fetchTrash();
  };

  const handleRestoreNote = async (id: string) => {
    await trashApi.restoreNote(id);
    fetchTrash();
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h2 className={styles.sidebarTitle}>Settings</h2>
        <nav className={styles.nav}>
          <button 
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} /> Profile & Account
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'workspace' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <SettingsIcon size={18} /> Workspaces
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'export' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('export')}
          >
            <Database size={18} /> Data Export
          </button>
          <button 
            className={`${styles.navItem} ${activeTab === 'trash' ? styles.navItemActive : ''}`}
            onClick={() => setActiveTab('trash')}
          >
            <Trash2 size={18} /> Trash & Recovery
          </button>
        </nav>
      </div>

      <div className={styles.content}>
        {activeTab === 'profile' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Profile Information</h3>
              <p>Manage your account settings</p>
            </div>
            <div className={styles.formGroup}>
              <label>Email Address</label>
              <input type="email" value={user?.username || ''} disabled className={styles.input} />
              <span className={styles.helpText}>Email cannot be changed in the current version.</span>
            </div>
            <div className={styles.formGroup}>
              <label>Password</label>
              <button className={styles.btnSecondary}>Change Password</button>
            </div>
          </div>
        )}

        {activeTab === 'workspace' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Workspaces</h3>
              <p>Switch between Personal and Work spaces</p>
            </div>
            <div className={styles.workspaceList}>
              {workspaces.map(ws => (
                <div key={ws.id} className={`${styles.workspaceCard} ${ws.id === activeWorkspace?.id ? styles.workspaceCardActive : ''}`}>
                  <div className={styles.workspaceInfo}>
                    <h4>{ws.name}</h4>
                    <p>{ws.id === activeWorkspace?.id ? 'Currently active' : 'Click to switch'}</p>
                  </div>
                  {ws.id !== activeWorkspace?.id && (
                    <button 
                      className={styles.btnPrimary}
                      onClick={() => setActiveWorkspace(ws)}
                    >
                      Switch to {ws.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Export Data</h3>
              <p>Download your tasks and notes for backup</p>
            </div>
            <div className={styles.exportGrid}>
              <div className={styles.exportCard}>
                <div className={styles.exportIcon}><Database size={24} /></div>
                <h4>Tasks Export</h4>
                <p>Download all tasks as CSV or JSON</p>
                <div className={styles.exportActions}>
                  <button className={styles.btnSecondary}><Download size={14} /> CSV</button>
                  <button className={styles.btnSecondary}><Download size={14} /> JSON</button>
                </div>
              </div>
              <div className={styles.exportCard}>
                <div className={styles.exportIcon}><Database size={24} /></div>
                <h4>Notes Export</h4>
                <p>Download all notes as Markdown or JSON</p>
                <div className={styles.exportActions}>
                  <button className={styles.btnSecondary}><Download size={14} /> MD</button>
                  <button className={styles.btnSecondary}><Download size={14} /> JSON</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trash' && (
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Trash & Recovery</h3>
              <p>Items remain in trash for 30 days before permanent deletion</p>
            </div>
            
            <div className={styles.trashWarning}>
              <AlertCircle size={16} />
              <span>Items older than 30 days are automatically deleted permanently.</span>
            </div>

            <div className={styles.trashCategory}>
              <h4>Deleted Tasks ({deletedTasks.length})</h4>
              {deletedTasks.length === 0 ? (
                <p className={styles.emptyText}>No tasks in trash</p>
              ) : (
                <ul className={styles.trashList}>
                  {deletedTasks.map(task => (
                    <li key={task.id} className={styles.trashItem}>
                      <div className={styles.trashInfo}>
                        <strong>{task.title}</strong>
                        <span>Deleted on {new Date(task.deletedAt).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => handleRestoreTask(task.id)} className={styles.btnSecondary}>Restore</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={styles.trashCategory}>
              <h4>Deleted Notes ({deletedNotes.length})</h4>
              {deletedNotes.length === 0 ? (
                <p className={styles.emptyText}>No notes in trash</p>
              ) : (
                <ul className={styles.trashList}>
                  {deletedNotes.map(note => (
                    <li key={note.id} className={styles.trashItem}>
                      <div className={styles.trashInfo}>
                        <strong>{note.title}</strong>
                        <span>Deleted on {new Date(note.deletedAt).toLocaleDateString()}</span>
                      </div>
                      <button onClick={() => handleRestoreNote(note.id)} className={styles.btnSecondary}>Restore</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
