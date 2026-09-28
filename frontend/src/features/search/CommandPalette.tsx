import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FolderOpen, CheckSquare, Calendar, X } from 'lucide-react';
import { searchApi } from '../../services/api';
import { useWorkspace } from '../workspace/WorkspaceContext';
import styles from './CommandPalette.module.css';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ tasks: any[]; notes: any[]; projects: any[] }>({
    tasks: [],
    notes: [],
    projects: []
  });
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setResults({ tasks: [], notes: [], projects: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // The layout handles opening it, this handles closing it if open
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim() || !activeWorkspace) {
      setResults({ tasks: [], notes: [], projects: [] });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const data = await searchApi.search(query, activeWorkspace.id);
        setResults({
          tasks: data.tasks || [],
          notes: data.notes || [],
          projects: data.projects || []
        });
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, activeWorkspace]);

  if (!isOpen) return null;

  const navigateTo = (path: string) => {
    navigate(path);
    onClose();
  };

  const hasResults = results.tasks.length > 0 || results.notes.length > 0 || results.projects.length > 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.palette} onClick={e => e.stopPropagation()}>
        <div className={styles.searchHeader}>
          <Search size={20} className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search tasks, notes, or projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.resultsArea}>
          {!query.trim() ? (
            <div className={styles.emptyState}>
              <p>Type to start searching...</p>
              <div className={styles.quickLinks}>
                <button onClick={() => navigateTo('/kanban')}><CheckSquare size={16} /> Go to Tasks</button>
                <button onClick={() => navigateTo('/notes')}><FolderOpen size={16} /> Go to Notes</button>
                <button onClick={() => navigateTo('/calendar')}><Calendar size={16} /> Go to Calendar</button>
              </div>
            </div>
          ) : isSearching ? (
            <div className={styles.loadingState}>Searching...</div>
          ) : !hasResults ? (
            <div className={styles.emptyState}>No results found for "{query}"</div>
          ) : (
            <div className={styles.resultsList}>
              {results.tasks.length > 0 && (
                <div className={styles.resultSection}>
                  <h3>Tasks</h3>
                  {results.tasks.map(task => (
                    <div key={task.id} className={styles.resultItem} onClick={() => navigateTo('/kanban')}>
                      <CheckSquare size={16} className={styles.resultIcon} />
                      <div className={styles.resultContent}>
                        <span className={styles.resultTitle}>{task.title}</span>
                        <span className={styles.resultMeta}>{task.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.notes.length > 0 && (
                <div className={styles.resultSection}>
                  <h3>Notes</h3>
                  {results.notes.map(note => (
                    <div key={note.id} className={styles.resultItem} onClick={() => navigateTo('/notes')}>
                      <FolderOpen size={16} className={styles.resultIcon} />
                      <div className={styles.resultContent}>
                        <span className={styles.resultTitle}>{note.title}</span>
                        <span className={styles.resultMeta}>Last updated {new Date(note.updatedAt || new Date()).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.projects.length > 0 && (
                <div className={styles.resultSection}>
                  <h3>Projects</h3>
                  {results.projects.map(project => (
                    <div key={project.id} className={styles.resultItem} onClick={() => navigateTo('/kanban')}>
                      <FolderOpen size={16} className={styles.resultIcon} />
                      <div className={styles.resultContent}>
                        <span className={styles.resultTitle}>{project.name}</span>
                        <span className={styles.resultMeta}>{project.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
