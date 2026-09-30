import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getNotes, deleteNote } from '../../services/noteService';
import NoteModal from './NoteModal';
import { NoteIcon, EditIcon, TrashIcon } from '../common/Icons';
import EmptyState from '../common/EmptyState';
import ConfirmModal from '../admin/AdminConfirmModal';

function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNote, setActiveNote] = useState(null);

  // Load notes from backend
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await getNotes(params);
      if (data.success) {
        setNotes(data.notes || []);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load private notes. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotes();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchNotes]);

  // Open modal to create new note
  const handleOpenCreateModal = () => {
    setActiveNote(null);
    setIsModalOpen(true);
  };

  const [noteToDelete, setNoteToDelete] = useState(null);

  // Open modal to edit existing note
  const handleOpenEditModal = (note, e) => {
    if (e) e.stopPropagation();
    setActiveNote(note);
    setIsModalOpen(true);
  };

  // Delete note with confirmation
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;

    try {
      await deleteNote(noteToDelete);
      setNotes((prev) => prev.filter((n) => (n._id || n.id) !== noteToDelete));
      setNoteToDelete(null);
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Failed to delete note. Please try again.');
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffHours < 1) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    if (diffHours < 24 && date.getDate() === now.getDate()) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="notes-page-container">
      {/* Top Header */}
      <div className="notes-page-header">
        <div className="notes-header-left">
          <div className="notes-header-icon">
            <NoteIcon size={22} />
          </div>
          <div className="notes-title-group">
            <h1>
              Private Notes
            </h1>
            <p className="notes-subtitle">
              Your confidential notes — 100% private to your account.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-create-note"
          onClick={handleOpenCreateModal}
        >
          <span>+</span>
          <span>New Note</span>
        </button>
      </div>

      {/* Toolbar: Search input */}
      <div className="notes-toolbar">
        <div className="notes-search-box">
          <svg
            className="notes-search-icon"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="notes-search-input"
            placeholder="Search notes by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="notes-loading-state">
          <div className="spinner"></div>
          <p>Loading your private notes...</p>
        </div>
      ) : error ? (
        <div className="notes-error-state">
          <p>{error}</p>
          <button type="button" className="btn-retry" onClick={fetchNotes}>
            Retry
          </button>
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          title={searchQuery ? 'No matching notes found' : 'No Private Notes Yet'}
          description={
            searchQuery
              ? 'Try adjusting your search terms.'
              : 'Create your first private note to store personal thoughts, ideas, or references.'
          }
          actionLabel={searchQuery ? 'Clear Search' : 'Create Note'}
          onAction={searchQuery ? () => setSearchQuery('') : handleOpenCreateModal}
        />
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <div
              key={note._id || note.id}
              className="note-card"
              onClick={() => handleOpenEditModal(note)}
            >
              <div className="note-card-header">
                <h3 className="note-card-title">{note.title || ''}</h3>
                <div className="note-card-actions">
                  <button
                    type="button"
                    className="btn-note-action"
                    onClick={(e) => handleOpenEditModal(note, e)}
                    title="Edit Note"
                    aria-label="Edit Note"
                  >
                    <EditIcon size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-note-action danger"
                    onClick={(e) => {
                      if (e) e.stopPropagation();
                      setNoteToDelete(note._id || note.id);
                    }}
                    title="Delete Note"
                    aria-label="Delete Note"
                  >
                    <TrashIcon size={16} />
                  </button>
                </div>
              </div>

              <p className="note-card-preview">
                {note.content
                  ? note.content.length > 140
                    ? `${note.content.substring(0, 140)}...`
                    : note.content
                  : '(No additional text content)'}
              </p>

              <div className="note-card-footer">
                <span className="note-updated-time">
                  {formatDate(note.updatedAt || note.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note Modal */}
      <NoteModal
        isOpen={isModalOpen}
        note={activeNote}
        onClose={() => setIsModalOpen(false)}
        onSaveSuccess={fetchNotes}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!noteToDelete}
        title="Delete Private Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete Note"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={handleDeleteNote}
        onCancel={() => setNoteToDelete(null)}
      />
    </div>
  );
}

export default NotesPage;
