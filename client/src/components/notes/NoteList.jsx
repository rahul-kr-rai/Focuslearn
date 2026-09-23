import { useState, useMemo } from 'react';
import {
  Clock,
  Play,
  Pencil,
  Trash2,
  Search,
  Download,
  Copy,
  Check,
  FileText,
  AlertCircle,
} from 'lucide-react';
import Button from '../ui/Button';
import MarkdownViewer from './MarkdownViewer';
import { formatTime, formatRelativeTime } from '../../utils/formatters';

/**
 * NoteList component — renders chronological timestamped notes with search, seek-to-time, and export.
 */
export default function NoteList({
  notes = [],
  loading = false,
  onSeekTo,
  onEdit,
  onDelete,
  videoTitle = 'Lesson',
  courseTitle = 'Course',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Filter notes based on search query
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.filter(
      (note) =>
        note.content.toLowerCase().includes(query) ||
        formatTime(note.timestamp).includes(query)
    );
  }, [notes, searchQuery]);

  // Export notes as a Markdown string
  const generateMarkdownExport = () => {
    let md = `# Notes: ${videoTitle}\n`;
    md += `*Course: ${courseTitle}*\n`;
    md += `*Exported on ${new Date().toLocaleDateString()}*\n\n---\n\n`;

    notes.forEach((note, i) => {
      const time = formatTime(note.timestamp);
      md += `### [${time}] Note ${i + 1}\n\n`;
      md += `${note.content}\n\n`;
    });

    return md;
  };

  // Copy all notes to clipboard
  const handleCopyAll = async () => {
    try {
      const text = generateMarkdownExport();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  // Download notes as .md file
  const handleDownload = () => {
    const text = generateMarkdownExport();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (videoTitle || 'notes')
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    link.href = url;
    link.download = `${safeTitle}_notes.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteClick = async (noteId) => {
    if (deletingId === noteId) {
      // Confirmed delete
      await onDelete?.(noteId);
      setDeletingId(null);
    } else {
      // First click: prompt confirm
      setDeletingId(noteId);
      setTimeout(() => {
        setDeletingId((curr) => (curr === noteId ? null : curr));
      }, 4000);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header with Search and Export Buttons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border-default/60">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            Saved Notes
          </span>
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-bg-tertiary text-accent-secondary">
            {notes.length}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search input */}
          {notes.length > 2 && (
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 text-xs rounded-lg bg-bg-secondary/70 border border-border-default focus:border-accent-primary focus:outline-none text-text-primary placeholder:text-text-tertiary"
              />
            </div>
          )}

          {/* Export / Copy buttons */}
          {notes.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={handleCopyAll}
                title="Copy all notes to clipboard as Markdown"
                className={copied ? '!text-accent-success' : ''}
              >
                <span className="hidden md:inline">
                  {copied ? 'Copied' : 'Copy'}
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                onClick={handleDownload}
                title="Download notes as .md file"
              >
                <span className="hidden md:inline">Export .md</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-8 text-center text-xs text-text-secondary animate-pulse">
          Loading lesson notes...
        </div>
      )}

      {/* Empty State */}
      {!loading && notes.length === 0 && (
        <div className="py-12 px-4 text-center rounded-xl border border-dashed border-border-default bg-bg-secondary/20">
          <FileText className="w-10 h-10 text-text-tertiary mx-auto mb-3 opacity-60" />
          <h4 className="text-sm font-semibold text-text-primary mb-1">
            No notes for this lesson yet
          </h4>
          <p className="text-xs text-text-secondary max-w-sm mx-auto">
            Take notes while watching! Click the timestamp button to bookmark
            exact video moments you want to revisit later.
          </p>
        </div>
      )}

      {/* Filtered Empty State */}
      {!loading && notes.length > 0 && filteredNotes.length === 0 && (
        <div className="py-8 text-center text-xs text-text-secondary">
          No notes match "{searchQuery}".
        </div>
      )}

      {/* Note Cards List */}
      {!loading && filteredNotes.length > 0 && (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const isPendingDelete = deletingId === note._id;

            return (
              <div
                key={note._id}
                className="group relative rounded-xl border border-border-default/80 bg-bg-secondary/40 hover:bg-bg-secondary/70 p-4 transition-all duration-200 shadow-sm hover:border-accent-primary/40"
              >
                {/* Card Top Row: Timestamp Chip & Controls */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Timestamp Button to Seek Video */}
                    <button
                      type="button"
                      onClick={() => onSeekTo?.(note.timestamp)}
                      title={`Jump video to ${formatTime(note.timestamp)}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-accent-primary/15 text-accent-primary group-hover:bg-accent-primary group-hover:text-white transition-all shadow-sm"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{formatTime(note.timestamp)}</span>
                    </button>

                    <span className="text-[11px] text-text-tertiary">
                      {formatRelativeTime(note.createdAt)}
                    </span>
                  </div>

                  {/* Actions (Edit / Delete) */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onEdit?.(note)}
                      title="Edit note"
                      className="p-1.5 rounded-md hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(note._id)}
                      title={
                        isPendingDelete ? 'Click again to confirm delete' : 'Delete note'
                      }
                      className={`p-1.5 rounded-md transition-colors ${
                        isPendingDelete
                          ? 'bg-accent-danger text-white font-medium text-xs px-2'
                          : 'hover:bg-bg-tertiary text-text-secondary hover:text-accent-danger'
                      }`}
                    >
                      {isPendingDelete ? (
                        'Confirm?'
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Note Content */}
                <div className="text-text-primary text-sm pl-1 border-l-2 border-accent-primary/20 group-hover:border-accent-primary/50 transition-colors">
                  <MarkdownViewer content={note.content} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
