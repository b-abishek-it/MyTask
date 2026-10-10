import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Youtube } from '@tiptap/extension-youtube';
import { TextAlign } from '@tiptap/extension-text-align';
import { Link } from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { Underline } from '@tiptap/extension-underline';
import { Highlight } from '@tiptap/extension-highlight';

import {
  Undo, Redo, Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3, Type, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Link as LinkIcon, Table as TableIcon,
  Image as ImageIcon, Youtube as YoutubeIcon, Minus, Quote, Eraser,
  Palette, Highlighter
} from 'lucide-react';
import { useState } from 'react';
import styles from './RichTextEditor.module.css';
import { API_BASE } from '../../services/api';

import { Node, mergeAttributes } from '@tiptap/core';

export const VideoExtension = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      style: {
        default: 'max-width: 100%; border-radius: 8px; resize: both; overflow: hidden; display: block;',
        parseHTML: element => element.getAttribute('style') || 'max-width: 100%; border-radius: 8px; resize: both; overflow: hidden; display: block;',
        renderHTML: attributes => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        }
      }
    }
  },
  parseHTML() {
    return [{ tag: 'video' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', style: 'max-width: 100%; border-radius: 8px; resize: both; overflow: hidden; display: block;' })]
  },
  // @ts-ignore
  addCommands() {
    return {
      setVideo: (options: { src: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        })
      },
    }
  }
});

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: 'max-width: 100%; height: auto; border-radius: 8px; resize: both; overflow: hidden; display: block;',
        parseHTML: element => element.getAttribute('style') || 'max-width: 100%; height: auto; border-radius: 8px; resize: both; overflow: hidden; display: block;',
        renderHTML: attributes => {
          if (!attributes.style) return {};
          return { style: attributes.style };
        },
      },
    }
  },
});

const COLORS = ['#000000', '#64748b', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

const MenuBar = ({ editor }: { editor: any }) => {
  const [activePopup, setActivePopup] = useState<'link' | 'image' | 'video' | 'color' | 'highlight' | 'table' | null>(null);
  
  // Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Media State
  const [mediaTab, setMediaTab] = useState<'upload' | 'url'>('upload');
  const [mediaUrl, setMediaUrl] = useState('');

  if (!editor) return null;

  const handleLinkSubmit = () => {
    if (linkUrl) {
      if (linkText && editor.state.selection.empty) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    } else {
      editor.chain().focus().unsetLink().run();
    }
    setActivePopup(null);
  };

  const handleMediaUpload = async (e: any, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch(`${API_BASE}/api/notes/${editor.options.editorProps.attributes?.['data-note-id'] || 'temp'}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        const fullUrl = `${API_BASE}${data.url}`;
        if (type === 'image') editor.chain().focus().setImage({ src: fullUrl }).run();
        else editor.chain().focus().setVideo({ src: fullUrl }).run();
      }
    } catch (err) {
      console.error('Failed to upload', err);
    }
    setActivePopup(null);
  };

  const handleMediaUrlSubmit = (type: 'image' | 'video') => {
    if (mediaUrl) {
      if (type === 'image') editor.chain().focus().setImage({ src: mediaUrl }).run();
      // If it's a youtube link
      else if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
        editor.commands.setYoutubeVideo({ src: mediaUrl, width: 640, height: 480 });
      } else {
        editor.chain().focus().setVideo({ src: mediaUrl }).run();
      }
    }
    setActivePopup(null);
    setMediaUrl('');
  };

  return (
    <div className={styles.toolbar}>
      {/* History */}
      <div className={styles.toolGroup}>
        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={styles.toolBtn} title="Undo">
          <Undo size={16} />
        </button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={styles.toolBtn} title="Redo">
          <Redo size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Typography */}
      <div className={styles.toolGroup}>
        <button onClick={() => editor.chain().focus().setParagraph().run()} className={`${styles.toolBtn} ${editor.isActive('paragraph') ? styles.active : ''}`} title="Paragraph">
          <Type size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`${styles.toolBtn} ${editor.isActive('heading', { level: 1 }) ? styles.active : ''}`} title="Heading 1">
          <Heading1 size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`${styles.toolBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`} title="Heading 2">
          <Heading2 size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`${styles.toolBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`} title="Heading 3">
          <Heading3 size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Formatting */}
      <div className={styles.toolGroup}>
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`${styles.toolBtn} ${editor.isActive('bold') ? styles.active : ''}`} title="Bold">
          <Bold size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`${styles.toolBtn} ${editor.isActive('italic') ? styles.active : ''}`} title="Italic">
          <Italic size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`${styles.toolBtn} ${editor.isActive('underline') ? styles.active : ''}`} title="Underline">
          <UnderlineIcon size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`${styles.toolBtn} ${editor.isActive('strike') ? styles.active : ''}`} title="Strikethrough">
          <Strikethrough size={16} />
        </button>
        <button onClick={() => editor.chain().focus().unsetAllMarks().run()} className={styles.toolBtn} title="Clear Formatting">
          <Eraser size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Colors */}
      <div className={styles.toolGroup}>
        <div className={styles.dropdownContainer}>
          <button className={styles.toolBtn} title="Text Color" onClick={() => setActivePopup(activePopup === 'color' ? null : 'color')}>
            <Palette size={16} style={{ color: editor.getAttributes('textStyle').color || 'inherit' }} />
          </button>
          {activePopup === 'color' && (
            <div className={styles.colorPopup}>
              {COLORS.map(c => (
                <div key={c} className={styles.colorSwatch} style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().setColor(c).run(); setActivePopup(null); }} />
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.dropdownContainer}>
          <button className={styles.toolBtn} title="Highlight Color" onClick={() => setActivePopup(activePopup === 'highlight' ? null : 'highlight')}>
            <Highlighter size={16} style={{ color: editor.getAttributes('highlight').color || 'inherit' }} />
          </button>
          {activePopup === 'highlight' && (
            <div className={styles.colorPopup}>
              {COLORS.map(c => (
                <div key={c} className={styles.colorSwatch} style={{ backgroundColor: c }} onClick={() => { editor.chain().focus().toggleHighlight({ color: c }).run(); setActivePopup(null); }} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.divider} />

      {/* Lists & Alignment */}
      <div className={styles.toolGroup}>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`${styles.toolBtn} ${editor.isActive('bulletList') ? styles.active : ''}`} title="Bullet List">
          <List size={16} />
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`${styles.toolBtn} ${editor.isActive('orderedList') ? styles.active : ''}`} title="Numbered List">
          <ListOrdered size={16} />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`${styles.toolBtn} ${editor.isActive({ textAlign: 'left' }) ? styles.active : ''}`} title="Align Left">
          <AlignLeft size={16} />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`${styles.toolBtn} ${editor.isActive({ textAlign: 'center' }) ? styles.active : ''}`} title="Align Center">
          <AlignCenter size={16} />
        </button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`${styles.toolBtn} ${editor.isActive({ textAlign: 'right' }) ? styles.active : ''}`} title="Align Right">
          <AlignRight size={16} />
        </button>
      </div>

      <div className={styles.divider} />

      {/* Advanced & Embeds */}
      <div className={styles.toolGroup}>
        <div className={styles.dropdownContainer}>
          <button onClick={() => { 
            setActivePopup(activePopup === 'link' ? null : 'link'); 
            setLinkUrl(editor.getAttributes('link').href || '');
            setLinkText('');
          }} className={`${styles.toolBtn} ${editor.isActive('link') ? styles.active : ''}`} title="Link">
            <LinkIcon size={16} />
          </button>
          {activePopup === 'link' && (
            <div className={styles.actionPopup}>
              <input type="text" placeholder="URL" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} className={styles.popupInput} />
              {editor.state.selection.empty && <input type="text" placeholder="Display Text" value={linkText} onChange={e => setLinkText(e.target.value)} className={styles.popupInput} />}
              <button onClick={handleLinkSubmit} className={styles.popupSubmit}>Apply</button>
            </div>
          )}
        </div>

        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`${styles.toolBtn} ${editor.isActive('blockquote') ? styles.active : ''}`} title="Blockquote">
          <Quote size={16} />
        </button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={styles.toolBtn} title="Divider">
          <Minus size={16} />
        </button>
        <div className={styles.dropdownContainer}>
          <button onClick={() => setActivePopup(activePopup === 'table' ? null : 'table')} className={`${styles.toolBtn} ${editor.isActive('table') ? styles.active : ''}`} title="Table">
            <TableIcon size={16} />
          </button>
          {activePopup === 'table' && (
            <div className={styles.dropdownMenu}>
              <button onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setActivePopup(null); }}>Insert Table</button>
              <button onClick={() => { editor.chain().focus().deleteTable().run(); setActivePopup(null); }}>Delete Table</button>
              <button onClick={() => { editor.chain().focus().addColumnAfter().run(); setActivePopup(null); }}>Add Column</button>
              <button onClick={() => { editor.chain().focus().deleteColumn().run(); setActivePopup(null); }}>Delete Column</button>
              <button onClick={() => { editor.chain().focus().addRowAfter().run(); setActivePopup(null); }}>Add Row</button>
              <button onClick={() => { editor.chain().focus().deleteRow().run(); setActivePopup(null); }}>Delete Row</button>
            </div>
          )}
        </div>
        
        {/* Image Popup */}
        <div className={styles.dropdownContainer}>
          <button onClick={() => { setActivePopup(activePopup === 'image' ? null : 'image'); setMediaTab('upload'); setMediaUrl(''); }} className={styles.toolBtn} title="Image">
            <ImageIcon size={16} />
          </button>
          {activePopup === 'image' && (
            <div className={`${styles.actionPopup} ${styles.alignRight}`}>
              <div className={styles.popupTabs}>
                <button className={mediaTab === 'upload' ? styles.popupTabActive : styles.popupTab} onClick={() => setMediaTab('upload')}>Upload</button>
                <button className={mediaTab === 'url' ? styles.popupTabActive : styles.popupTab} onClick={() => setMediaTab('url')}>URL</button>
              </div>
              {mediaTab === 'upload' ? (
                <input type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} className={styles.popupFileInput} />
              ) : (
                <div className={styles.popupRow}>
                  <input type="text" placeholder="Image URL" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} className={styles.popupInput} />
                  <button onClick={() => handleMediaUrlSubmit('image')} className={styles.popupSubmit}>Add</button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Video Popup */}
        <div className={styles.dropdownContainer}>
          <button onClick={() => { setActivePopup(activePopup === 'video' ? null : 'video'); setMediaTab('upload'); setMediaUrl(''); }} className={styles.toolBtn} title="Video (Upload or YouTube)">
            <YoutubeIcon size={16} />
          </button>
          {activePopup === 'video' && (
            <div className={`${styles.actionPopup} ${styles.alignRight}`}>
              <div className={styles.popupTabs}>
                <button className={mediaTab === 'upload' ? styles.popupTabActive : styles.popupTab} onClick={() => setMediaTab('upload')}>Upload</button>
                <button className={mediaTab === 'url' ? styles.popupTabActive : styles.popupTab} onClick={() => setMediaTab('url')}>URL</button>
              </div>
              {mediaTab === 'upload' ? (
                <input type="file" accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} className={styles.popupFileInput} />
              ) : (
                <div className={styles.popupRow}>
                  <input type="text" placeholder="Video / YouTube URL" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} className={styles.popupInput} />
                  <button onClick={() => handleMediaUrlSubmit('video')} className={styles.popupSubmit}>Add</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const RichTextEditor = ({ content, onChange, noteId }: { content: string, onChange: (html: string) => void, noteId?: string }) => {
  const editor = useEditor({
    editorProps: {
      attributes: {
        'data-note-id': noteId || '',
      }
    },
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      ResizableImage.configure({ inline: true }),
      Youtube.configure({ inline: false }),
      VideoExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      Color,
      TextStyle,
      Underline,
      Highlight.configure({ multicolor: true })
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className={styles.editorContainer}>
      <MenuBar editor={editor} />
      <div className={styles.editorContentArea}>
        <EditorContent editor={editor} className={styles.tiptapEditor} />
      </div>
    </div>
  );
};
