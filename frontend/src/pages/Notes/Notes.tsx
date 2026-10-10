import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '../../features/workspace/WorkspaceContext';
import { foldersApi, notesApi } from '../../services/api';
import { Folder, Note } from '../../types';
import { Folder as FolderIcon, ChevronRight, ChevronDown, Plus, FileText, Trash2, ArrowLeft, Edit2, Download } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { RichTextEditor } from '../../components/RichTextEditor/RichTextEditor';
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

  // Modal State
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'CREATE_FOLDER' | 'CREATE_NOTE' | 'DELETE_FOLDER' | 'DELETE_NOTE' | 'RENAME_FOLDER' | 'RENAME_NOTE' | null;
    title: string;
    targetId: string | null;
    inputValue: string;
  }>({ isOpen: false, type: null, title: '', targetId: null, inputValue: '' });

  // View State
  const [viewMode, setViewMode] = useState<'preview' | 'edit'>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const closeModal = () => setModalState({ isOpen: false, type: null, title: '', targetId: null, inputValue: '' });

  const fetchData = useCallback(async () => {
    if (!activeWorkspace) return;
    try {
      const [foldersData, notesData] = await Promise.all([
        foldersApi.list({ workspace_id: activeWorkspace.id }),
        notesApi.list({ 
          workspace_id: activeWorkspace.id,
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
          setNotes(prev => prev.map(n => n.id === res.note.id ? res.note : n));
          setSelectedNote(res.note);
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

  const openCreateFolderModal = (parentId: string | null) => {
    setModalState({ isOpen: true, type: 'CREATE_FOLDER', title: 'Create Folder', targetId: parentId, inputValue: '' });
  };

  const openCreateNoteModal = () => {
    setModalState({ isOpen: true, type: 'CREATE_NOTE', title: 'Create New Note', targetId: null, inputValue: '' });
  };

  const openDeleteNoteModal = (id: string) => {
    setModalState({ isOpen: true, type: 'DELETE_NOTE', title: 'Delete Note', targetId: id, inputValue: '' });
  };

  const openDeleteFolderModal = (id: string) => {
    setModalState({ isOpen: true, type: 'DELETE_FOLDER', title: 'Delete Folder', targetId: id, inputValue: '' });
  };

  const openRenameFolderModal = (folder: Folder, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({ isOpen: true, type: 'RENAME_FOLDER', title: 'Rename Folder', targetId: folder.id, inputValue: folder.name });
  };

  const openRenameNoteModal = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setModalState({ isOpen: true, type: 'RENAME_NOTE', title: 'Rename Note', targetId: note.id, inputValue: note.title });
  };

  const exportToPdf = () => {
    const element = document.getElementById('preview-content-for-export');
    if (!element || !selectedNote) return;
    const opt: any = {
      margin:       10,
      filename:     `${selectedNote.title || 'Untitled Note'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleModalSubmit = async () => {
    if (!activeWorkspace || !modalState.type) return;

    try {
      if (modalState.type === 'CREATE_FOLDER') {
        if (!modalState.inputValue) return;
        await foldersApi.create({
          workspaceId: activeWorkspace.id,
          parentFolderId: modalState.targetId,
          name: modalState.inputValue
        });
        if (modalState.targetId) {
          const newExpanded = new Set(expandedFolders);
          newExpanded.add(modalState.targetId);
          setExpandedFolders(newExpanded);
        }
      } else if (modalState.type === 'CREATE_NOTE') {
        if (!modalState.inputValue) return;
        const res = await notesApi.create({
          workspaceId: activeWorkspace.id,
          folderId: selectedFolder,
          title: modalState.inputValue,
          content: ''
        });
        selectNote(res.note);
      } else if (modalState.type === 'DELETE_NOTE') {
        if (!modalState.targetId) return;
        await notesApi.delete(modalState.targetId);
        if (selectedNote?.id === modalState.targetId) setSelectedNote(null);
      } else if (modalState.type === 'DELETE_FOLDER') {
        if (!modalState.targetId) return;
        await foldersApi.delete(modalState.targetId);
        if (selectedFolder === modalState.targetId) setSelectedFolder(null);
      } else if (modalState.type === 'RENAME_FOLDER') {
        if (!modalState.targetId || !modalState.inputValue) return;
        await foldersApi.update(modalState.targetId, { name: modalState.inputValue });
      } else if (modalState.type === 'RENAME_NOTE') {
        if (!modalState.targetId || !modalState.inputValue) return;
        const res = await notesApi.update(modalState.targetId, { title: modalState.inputValue });
        setNotes(prev => prev.map(n => n.id === res.note.id ? res.note : n));
        if (selectedNote?.id === res.note.id) {
          setSelectedNote(res.note);
          setEditTitle(res.note.title);
        }
      }
      fetchData();
      closeModal();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  const selectNote = async (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    
    // Fetch full note content since the list API doesn't return it
    try {
      const res = await notesApi.get(note.id);
      setEditContent(res.note.content || '');
      setSelectedNote(res.note); // Update local selected note with full details
    } catch (err) {
      console.error('Failed to fetch note content', err);
      setEditContent(note.content || '');
    }

    setViewMode('preview');
    setIsFullScreen(true);
  };

  // Delete handles now route through openDeleteNoteModal instead of handleDeleteNote

  const renderNotes = (folderId: string | null, depth = 0) => {
    const folderNotes = notes.filter(n => n.folderId === folderId);
    return folderNotes.map(note => (
      <div 
        key={note.id} 
        className={`${styles.noteRow} ${selectedNote?.id === note.id ? styles.noteRowSelected : ''}`}
        style={{ paddingLeft: `${depth * 16 + 12 + 14}px` }}
        onClick={() => selectNote(note)}
      >
        <div className={styles.noteLeft}>
          <FileText size={14} className={styles.noteIcon} />
          <span className={styles.noteTitle}>{note.title || 'Untitled'}</span>
        </div>
        <div className={styles.folderActions}>
          <button onClick={(e) => openRenameNoteModal(note, e)} className={styles.iconBtn} title="Rename Note">
            <Edit2 size={12} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); openDeleteNoteModal(note.id); }} className={styles.iconBtn} title="Delete Note">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    ));
  };

  const renderFolderTree = (foldersToRender: Folder[], depth = 0) => {
    return foldersToRender.map(folder => (
      <div key={folder.id} className={styles.folderNode}>
        <div 
          className={`${styles.folderRow} ${selectedFolder === folder.id ? styles.folderRowSelected : ''}`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={(e) => {
            setSelectedFolder(folder.id);
            toggleFolder(folder.id, e);
          }}
        >
          <div className={styles.folderLeft}>
            <button className={styles.expandBtn} onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id, e); }}>
              {expandedFolders.has(folder.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} /> }
            </button>
            <FolderIcon size={16} className={styles.folderIcon} />
            <span className={styles.folderName}>{folder.name}</span>
          </div>
          <div className={styles.folderActions}>
            <button 
              className={styles.addFolderBtn} 
              onClick={(e) => openRenameFolderModal(folder, e)}
              title="Rename folder"
            >
              <Edit2 size={12} />
            </button>
            <button 
              className={styles.addFolderBtn} 
              onClick={(e) => { e.stopPropagation(); openCreateFolderModal(folder.id); }}
              title="Add subfolder"
            >
              <Plus size={12} />
            </button>
            <button 
              className={styles.addFolderBtn} 
              onClick={(e) => { e.stopPropagation(); setSelectedFolder(folder.id); openCreateNoteModal(); }}
              title="Add note"
            >
              <FileText size={12} />
            </button>
            <button 
              className={styles.deleteFolderBtn} 
              onClick={(e) => { e.stopPropagation(); openDeleteFolderModal(folder.id); }}
              title="Delete folder"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
        {expandedFolders.has(folder.id) && (
          <div className={styles.folderChildren}>
            {folder.children && folder.children.length > 0 && renderFolderTree(folder.children, depth + 1)}
            {renderNotes(folder.id, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className={styles.container}>
      {/* Sidebar - Folders & Notes */}
      {!isFullScreen && (
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <h3>Workspace</h3>
            <div className={styles.headerActions}>
              <button onClick={() => { setSelectedFolder(null); openCreateFolderModal(null); }} className={styles.addBtn} title="New Folder">
                <FolderIcon size={14} />
              </button>
              <button onClick={() => { setSelectedFolder(null); openCreateNoteModal(); }} className={styles.addBtn} title="New Note">
                <FileText size={14} />
              </button>
            </div>
          </div>
          <div className={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Search notes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.folderTree}>
            {renderFolderTree(folders)}
            {renderNotes(null, 0)}
            
            {notes.length === 0 && folders.length === 0 && (
              <div className={styles.emptyList}>No notes or folders found.</div>
            )}
          </div>
        </div>
      )}

      {/* Right - Editor */}
      <div className={styles.editorArea}>
        {selectedNote ? (
          <>
            <div className={styles.editorHeader}>
              <div className={styles.headerLeft}>
                {isFullScreen && (
                  <button 
                    onClick={() => { setIsFullScreen(false); setViewMode('preview'); }} 
                    className={styles.backBtn}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                {viewMode === 'edit' ? (
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={styles.titleInput}
                    placeholder="Note title"
                  />
                ) : (
                  <h2 className={styles.previewTitle}>{editTitle || 'Untitled Note'}</h2>
                )}
              </div>
              <div className={styles.editorActions}>
                {isSaving && <span className={styles.savingIndicator}>Saving...</span>}
                {viewMode === 'preview' ? (
                  <>
                    <button onClick={exportToPdf} className={styles.secondaryBtn} title="Export to PDF">
                      <Download size={14} style={{ marginRight: '4px' }} /> Export
                    </button>
                    <button onClick={() => setViewMode('edit')} className={styles.primaryBtn}>Edit</button>
                  </>
                ) : (
                  <button onClick={() => setViewMode('preview')} className={styles.primaryBtn}>Done</button>
                )}
                <button onClick={() => openDeleteNoteModal(selectedNote.id)} className={styles.deleteBtn}>Delete</button>
              </div>
            </div>
            <div className={styles.editorBody}>
              {viewMode === 'edit' ? (
                <RichTextEditor 
                  key={selectedNote.id}
                  content={editContent}
                  onChange={(html) => setEditContent(html)}
                  noteId={selectedNote.id}
                />
              ) : (
                <div id="preview-content-for-export" className={styles.previewContent} dangerouslySetInnerHTML={{ __html: editContent }} />
              )}
            </div>
          </>
        ) : (
          <div className={styles.emptyEditor}>
            <FileText size={48} className={styles.emptyEditorIcon} />
            <p>Select a note or create a new one to start writing.</p>
          </div>
        )}
      </div>
      {/* Modal Layer */}
      {modalState.isOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{modalState.title}</h3>
            
            {(modalState.type === 'CREATE_FOLDER' || modalState.type === 'CREATE_NOTE' || modalState.type === 'RENAME_FOLDER' || modalState.type === 'RENAME_NOTE') ? (
              <div className={styles.modalBody}>
                <input 
                  type="text"
                  autoFocus
                  placeholder={modalState.type.includes('FOLDER') ? 'Folder Name' : 'Note Title'}
                  value={modalState.inputValue}
                  onChange={(e) => setModalState({ ...modalState, inputValue: e.target.value })}
                  className={styles.modalInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleModalSubmit();
                    if (e.key === 'Escape') closeModal();
                  }}
                />
              </div>
            ) : (
              <div className={styles.modalBody}>
                <p>Are you sure you want to delete this {modalState.type === 'DELETE_FOLDER' ? 'folder' : 'note'}?</p>
                <p className={styles.modalWarning}>This action cannot be undone.</p>
              </div>
            )}

            <div className={styles.modalFooter}>
              <button className={styles.modalCancelBtn} onClick={closeModal}>Cancel</button>
              <button 
                className={modalState.type?.startsWith('DELETE') ? styles.modalDangerBtn : styles.modalPrimaryBtn}
                onClick={handleModalSubmit}
                disabled={!modalState.type?.startsWith('DELETE') && !modalState.inputValue.trim()}
              >
                {modalState.type?.startsWith('DELETE') ? 'Delete' : modalState.type?.startsWith('RENAME') ? 'Rename' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
