import { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Bold,
  Italic,
  List,
  Code,
  Heading,
  Eye,
  Edit3,
  Send,
  X,
  Sparkles,
} from 'lucide-react';
import Button from '../ui/Button';
import MarkdownViewer from './MarkdownViewer';
import { noteAPI } from '../../services/api';
import { formatTime } from '../../utils/formatters';

/**
 * NoteEditor component — distraction-free markdown note composer with video timestamp synchronization.
 */
export default function NoteEditor({
  videoId,
  courseId,
  currentVideoTime = 0,
  onNoteSaved,
  editingNote = null,
  onCancelEdit,
}) {
  const [content, setContent] = useState('');
  const [timestamp, setTimestamp] = useState(0);
  const [mode, setMode] = useState('write'); // 'write' | 'preview'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const textareaRef = useRef(null);

  // Sync state when entering or exiting edit mode
  useEffect(() => {
    if (editingNote) {
      setContent(editingNote.content || '');
      setTimestamp(editingNote.timestamp || 0);
      setMode('write');
      setError(null);
    } else {
      setContent('');
      setTimestamp(Math.floor(currentVideoTime || 0));
      setError(null);
    }
  }, [editingNote, videoId]);

  // Update timestamp to current video time if creating a new note and user hasn't edited text yet
  const handleCaptureCurrentTime = () => {
    const sec = Math.floor(currentVideoTime || 0);
    setTimestamp(sec);
  };

  // Helper to insert markdown syntax at cursor position
  const insertFormatting = (prefix, suffix = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);
    const replacement = selected
      ? `${prefix}${selected}${suffix}`
      : `${prefix}${placeholder}${suffix}`;

    const newContent =
      content.slice(0, start) + replacement + content.slice(end);

    setContent(newContent);

    // Reposition cursor
    setTimeout(() => {
      textarea.focus();
      const cursorOffset = selected
        ? start + replacement.length
        : start + prefix.length;
      textarea.setSelectionRange(cursorOffset, cursorOffset + (selected ? 0 : placeholder.length));
    }, 10);
  };

  const handleInsertTimestampTag = () => {
    const timeStr = `[${formatTime(currentVideoTime)}]`;
    insertFormatting(`${timeStr} `);
  };

  // Submit note (create or update)
  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!content.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);

      if (editingNote) {
        const res = await noteAPI.update(editingNote._id, {
          content: content.trim(),
          timestamp,
        });
        onNoteSaved?.(res.data.data.note, 'update');
      } else {
        const res = await noteAPI.create({
          videoId,
          courseId,
          content: content.trim(),
          timestamp,
        });
        onNoteSaved?.(res.data.data.note, 'create');
        setContent('');
        setTimestamp(Math.floor(currentVideoTime || 0));
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to save note. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Ctrl+Enter / Cmd+Enter shortcut to save
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="rounded-xl border border-border-default bg-bg-secondary/60 backdrop-blur-md p-4 transition-all shadow-lg">
      {/* Top Header & Timestamp Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-default mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-accent-primary" />
            {editingNote ? 'Editing Note' : 'Quick Study Note'}
          </span>

          {/* Timestamp chip */}
          <button
            type="button"
            onClick={handleCaptureCurrentTime}
            title="Click to sync note with current video playback timestamp"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-accent-primary/10 text-accent-primary hover:bg-accent-primary/20 border border-accent-primary/30 transition-all"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timestamp)}</span>
            <span className="text-[10px] text-accent-secondary opacity-80">(Sync)</span>
          </button>
        </div>

        {/* Write / Preview Tab Switcher */}
        <div className="flex items-center gap-1 bg-bg-tertiary/70 rounded-lg p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              mode === 'write'
                ? 'bg-bg-secondary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              mode === 'preview'
                ? 'bg-bg-secondary text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Formatting Toolbar (Visible in Write Mode) */}
      {mode === 'write' && (
        <div className="flex items-center gap-1 mb-2 pb-2 border-b border-border-default/50 overflow-x-auto">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors text-xs"
            title="Bold (**text**)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors text-xs"
            title="Italic (*text*)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('### ', '', 'Heading')}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors text-xs"
            title="Heading (### Heading)"
          >
            <Heading className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('- ', '', 'list item')}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors text-xs"
            title="Bullet list (- item)"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('`', '`', 'code')}
            className="p-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors text-xs"
            title="Inline code (`code`)"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```\n', '\n```', 'code block')}
            className="px-2 py-1 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors text-[11px] font-mono"
            title="Code block (```)"
          >
            {'{}'}
          </button>
          <button
            type="button"
            onClick={handleInsertTimestampTag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-accent-primary transition-colors text-xs font-mono"
            title="Insert current video timestamp tag into text"
          >
            <Clock className="w-3 h-3" />
            +Time
          </button>
        </div>
      )}

      {/* Editor Body */}
      {mode === 'write' ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your notes, key takeaways, formulas, or code snippets... (Markdown supported)"
            maxLength={5000}
            className="w-full bg-bg-primary/50 text-text-primary text-sm rounded-lg p-3 border border-border-default focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary transition-all resize-y placeholder:text-text-tertiary"
          />
        </div>
      ) : (
        <div className="min-h-[85px] max-h-60 overflow-y-auto p-3 rounded-lg bg-bg-primary/40 border border-border-default/50">
          {content.trim() ? (
            <MarkdownViewer content={content} />
          ) : (
            <p className="text-xs text-text-tertiary italic">Nothing to preview yet. Switch back to Write mode.</p>
          )}
        </div>
      )}

      {/* Error alert */}
      {error && (
        <p className="text-xs text-accent-danger mt-2">{error}</p>
      )}

      {/* Editor Footer Actions */}
      <div className="flex items-center justify-between mt-3 pt-2">
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          <span>{content.length} / 5,000</span>
          <span className="hidden sm:inline opacity-70">Ctrl+Enter to save</span>
        </div>

        <div className="flex items-center gap-2">
          {editingNote && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={X}
              onClick={onCancelEdit}
            >
              Cancel
            </Button>
          )}
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={Send}
            loading={loading}
            disabled={!content.trim() || loading}
            onClick={handleSubmit}
          >
            {editingNote ? 'Update Note' : 'Save Note'}
          </Button>
        </div>
      </div>
    </div>
  );
}
