import { useState, useEffect } from 'react';

function EditChannelModal({ isOpen, onClose, channel, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setDescription(channel.description || '');
      setIsAdminOnly(Boolean(channel.isAdminOnly));
      setError(null);
    }
  }, [channel, isOpen]);

  if (!isOpen || !channel) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a channel name');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const cleanName = name.trim().replace(/^#+/, '');
      await onSave({
        name: cleanName,
        description: description.trim(),
        isAdminOnly,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update channel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} aria-modal="true" role="dialog">
      <div
        className="modal-content-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <h3 className="modal-title">Edit Channel</h3>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error && <div className="modal-error-box">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="edit-channel-name-input">
              Channel Name
            </label>
            <input
              id="edit-channel-name-input"
              type="text"
              className="modal-input"
              placeholder="e.g. mobile-dev, announcements"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoFocus
              required
            />
            <span className="form-hint">
              Names must be alphanumeric and may include dashes.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-channel-desc-input">
              Description <span className="label-optional">(optional)</span>
            </label>
            <textarea
              id="edit-channel-desc-input"
              className="modal-textarea"
              placeholder="What is this channel about?"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={250}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-option-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={isAdminOnly}
                onChange={(e) => setIsAdminOnly(e.target.checked)}
              />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Admin Only Channel (Only channel admins can send messages)
              </span>
            </label>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-modal-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditChannelModal;
