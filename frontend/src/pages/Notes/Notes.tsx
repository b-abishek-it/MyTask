import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { foldersApi, notesApi } from '../../services/api';
import { Folder, Note } from '../../types';
import { Folder as FolderIcon, ChevronRight, ChevronDown, Plus, FileText, Pin, Star } from 'lucide-react';
import styles from './Notes.module.css';

export const Notes = () => {
  const { activeWorkspace } = useWorkspace();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  // Editor state
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const [foldersData, notesData] = await Promise.all([
        foldersApi.list({ workspace_id: activeWorkspace.id }),
        notesApi.list({ 
          workspace_id: activeWorkspace.id,
          folder_id: selectedFolder || undefined,
          search: searchQuery || undefined
        })
      ]);
      
      // Build folder tree
      const folderMap = new Map();
      foldersData.folders?.forEach((f: Folder) => folderMap.set(f.id, { ...f, children: [] }));
      const rootFolders: Folder[] = [];
      
      folderMap.forEach(f => {
        if (f.parentFolderId && folderMap.has(f.parentFolderId)) {
          folderMap.get(f.parentFolderId).children.push(f);
        } else {
          rootFolders.push(f);
        }
      });
      
      setFolders(rootFolders);
      setNotes(notesData.notes || []);
    } catch (err) {
      console.error('Failed to fetch notes data', err);
    }
  }, [activeWorkspace, selectedFolder, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-save effect
  useEffect(() => {
    if (!selectedNote) return;
    
    const timeoutId = setTimeout(async () => {
      if (editTitle !== selectedNote.title || editContent !== selectedNote.content) {
        setIsSaving(true);
        try {
          const res = await notesApi.update(selectedNote.id, {
            title: editTitle,
            content: editContent
          });
          setSelectedNote(res.note);
          fetchData(); // Refresh list to show updated title
        } catch (err) {
          console.error('Failed to save note', err);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1000); // Save 1s after last typing

    return () => clearTimeout(timeoutId);
  }, [editTitle, editContent, selectedNote, fetchData]);

  const toggleFolder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreateFolder = async (parentId: string | null) => {
    if (!activeWorkspace) return;
    const name = prompt('Folder name:');
    if (!name) return;
    try {
      await foldersApi.create({
        workspaceId: activeWorkspace.id,
        parentFolderId: parentId,
        name
      });
      fetchData();
      if (parentId) {
        const newExpanded = new Set(expandedFolders);
        newExpanded.add(parentId);
        setExpandedFolders(newExpanded);
      }
    } catch (err) {
      console.error('Failed to create folder', err);
    }
  };

  const handleCreateNote = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await notesApi.create({
        workspaceId: activeWorkspace.id,
        folderId: selectedFolder,
        title: 'Untitled Note',
        content: ''
      });
      fetchData();
      selectNote(res.note);
    } catch (err) {
      console.error('Failed to create note', err);
    }
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content || '');
  };

  const togglePin = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notesApi.togglePin(note.id);
      fetchData();
      if (selectedNote?.id === note.id) {
        setSelectedNote({ ...note, isPinned: !note.isPinned });
      }
    } catch (err) {
      console.error('Failed to pin note', err);
    }
  };

  const toggleFavorite = async (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notesApi.toggleFavorite(note.id);
      fetchData();
      if (selectedNote?.id === note.id) {
        setSelectedNote({ ...note, isFavorite: !note.isFavorite });
      }
    } catch (err) {
      console.error('Failed to favorite note', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Move note to trash?')) return;
    try {
      await notesApi.delete(id);
      if (selectedNote?.id === id) setSelectedNote(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete note', err);
    }
  };

  const renderFolderTree = (foldersToRender: Folder[], depth = 0) => {
    return foldersToRender.map(folder => (
      <div key={folder.id} className={styles.folderNode}>
        <div 
          className={`${styles.folderRow} ${selectedFolder === folder.id ? styles.folderRowSelected : ''}`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => setSelectedFolder(folder.id)}
        >
          <div className={styles.folderLeft}>
            <button className={styles.expandBtn} onClick={(e) => toggleFolder(folder.id, e)}>
              {folder.children && folder.children.length > 0 ? (
                expandedFolders.has(folder.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />
              ) : <span style={{ width: 14 }} />}
            </button>
            <FolderIcon size={16} className={styles.folderIcon} />
            <span className={styles.folderName}>{folder.name}</span>
          </div>
          <button 
            className={styles.addFolderBtn} 
            onClick={(e) => { e.stopPropagation(); handleCreateFolder(folder.id); }}
            title="Add subfolder"
          >
            <Plus size={14} />
          </button>
        </div>
        {expandedFolders.has(folder.id) && folder.children && folder.children.length > 0 && (
          <div className={styles.folderChildren}>
            {renderFolderTree(folder.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      {/* Sidebar - Folders */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Folders</h3>
          <button onClick={() => handleCreateFolder(null)} className={styles.addBtn}><Plus size={16} /></button>
        </div>
        <div className={styles.folderTree}>
          <div 
            className={`${styles.folderRow} ${selectedFolder === null ? styles.folderRowSelected : ''}`}
            onClick={() => setSelectedFolder(null)}
          >
            <div className={styles.folderLeft}>
              <FolderIcon size={16} className={styles.folderIcon} />
              <span className={styles.folderName}>All Notes</span>
            </div>
          </div>
          {renderFolderTree(folders)}
        </div>
      </div>

      {/* Middle - Note List */}
      <div className={styles.listArea}>
        <div className={styles.listHeader}>
          <input 
            type="text" 
            placeholder="Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button onClick={handleCreateNote} className={styles.addBtn}><Plus size={16} /></button>
        </div>
        <div className={styles.noteList}>
          {notes.map(note => (
            <div 
              key={note.id} 
              className={`${styles.noteCard} ${selectedNote?.id === note.id ? styles.noteCardSelected : ''}`}
              onClick={() => selectNote(note)}
            >
              <div className={styles.noteCardHeader}>
                <h4 className={styles.noteCardTitle}>{note.title}</h4>
                <div className={styles.noteCardActions}>
                  <button onClick={(e) => togglePin(note, e)} className={`${styles.actionBtn} ${note.isPinned ? styles.pinned : ''}`}>
                    <Pin size={14} />
                  </button>
                  <button onClick={(e) => toggleFavorite(note, e)} className={`${styles.actionBtn} ${note.isFavorite ? styles.favorited : ''}`}>
                    <Star size={14} />
                  </button>
                </div>
              </div>
              <p className={styles.noteCardPreview}>
                {note.content?.substring(0, 60) || 'No content...'}
              </p>
              <span className={styles.noteCardDate}>
                {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
          {notes.length === 0 && <div className={styles.emptyList}>No notes found.</div>}
        </div>
      </div>

      {/* Right - Editor */}
      <div className={styles.editorArea}>
        {selectedNote ? (
          <>
            <div className={styles.editorHeader}>
              <input 
                type="text" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className={styles.titleInput}
                placeholder="Note title"
              />
              <div className={styles.editorActions}>
                {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
                <button onClick={() => handleDeleteNote(selectedNote.id)} className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
            <textarea 
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={styles.contentEditor}
              placeholder="Start writing using markdown..."
            />
          </>
        ) : (
          <div className={styles.emptyEditor}>
            <FileText size={48} className={styles.emptyEditorIcon} />
            <p>Select a note or create a new one to start writing.</p>
          </div>
        )}
      </div>
    </div>
  );
};
