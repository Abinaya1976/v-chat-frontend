import { useState, useEffect } from 'react';
import { createNote, updateNote } from '../../services/noteService';

function NoteModal({ isOpen, note, onClose, onSaveSuccess }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title || '');
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('');
    }
    setErrorMessage('');
  }, [note, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const payload = {
        title: title.trim() || 'Untitled Note',
        content: content.trim(),
      };

      if (note?._id) {
        await updateNote(note._id, payload);
      } else {
        await createNote(payload);
      }

      onSaveSuccess?.();
      onClose();
    } catch (err) {
      console.error('Error saving note:', err);
      setErrorMessage(
        err.response?.data?.message || 'Failed to save note. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="note-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="note-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="note-modal-header">
          <h2>{note?._id ? 'Edit Private Note' : 'Create Private Note'}</h2>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="note-modal-body">
            {errorMessage && (
              <div className="note-error-banner" role="alert">
                {errorMessage}
              </div>
            )}

            {/* Note Title */}
            <div className="note-form-group">
              <label htmlFor="note-title-input">Title</label>
              <input
                id="note-title-input"
                type="text"
                className="note-form-input"
                placeholder="Enter note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={250}
                autoFocus
              />
            </div>

            {/* Note Content */}
            <div className="note-form-group">
              <label htmlFor="note-content-input">Content</label>
              <textarea
                id="note-content-input"
                className="note-form-textarea"
                placeholder="Write your note content here..."
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={50000}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="note-modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : note?._id ? 'Save Changes' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoteModal;
