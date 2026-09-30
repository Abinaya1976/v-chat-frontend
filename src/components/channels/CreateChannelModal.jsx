import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrganizationSettings } from '../../services/channelService';

function CreateChannelModal({ isOpen, onClose, onCreateChannel }) {
  const { user } = useAuth();
  const isAdmin = ['admin', 'owner'].includes(user?.role);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAdminOnly, setIsAdminOnly] = useState(false);
  const [orgSettings, setOrgSettings] = useState({
    allowPublicChannels: true,
    allowPrivateChannels: true,
    allowUserChannelCreation: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingSettings(true);
      getOrganizationSettings()
        .then((data) => {
          if (data.success && data.settings) {
            setOrgSettings(data.settings);
            // If public channels are disabled and private enabled, default to private
            if (!isAdmin) {
              if (!data.settings.allowPublicChannels && data.settings.allowPrivateChannels) {
                setIsPrivate(true);
              } else if (data.settings.allowPublicChannels && !data.settings.allowPrivateChannels) {
                setIsPrivate(false);
              }
            }
          }
        })
        .catch((err) => console.warn('Could not load org settings:', err.message))
        .finally(() => setLoadingSettings(false));
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const creationDisabled = !isAdmin && !orgSettings.allowUserChannelCreation;
  const publicDisabled = !isAdmin && !orgSettings.allowPublicChannels;
  const privateDisabled = !isAdmin && !orgSettings.allowPrivateChannels;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (creationDisabled) {
      setError('Channel creation is restricted by organization administrator.');
      return;
    }
    if (!isPrivate && publicDisabled) {
      setError('Public channel creation is disabled by organization policy.');
      return;
    }
    if (isPrivate && privateDisabled) {
      setError('Private channel creation is disabled by organization policy.');
      return;
    }
    if (!name.trim()) {
      setError('Please enter a channel name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onCreateChannel({
        name: name.trim(),
        description: description.trim(),
        isPrivate,
        isAdminOnly,
      });
      setName('');
      setDescription('');
      setIsPrivate(false);
      setIsAdminOnly(false);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create channel');
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
            <h3 className="modal-title">Create a Channel</h3>
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

        {creationDisabled && (
          <div className="modal-error-box">
            🚫 Channel creation by organization members is currently disabled by administrator policy.
          </div>
        )}

        {error && <div className="modal-error-box">⚠️ {error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label" htmlFor="channel-name-input">
              Channel Name
            </label>
            <input
              id="channel-name-input"
              type="text"
              className="modal-input"
              placeholder="e.g. mobile-dev, announcements"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={creationDisabled || loadingSettings}
              autoFocus
              required
            />
            <span className="form-hint">
              Names must be lowercase, alphanumeric, and may include dashes.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="channel-desc-input">
              Description <span className="label-optional">(optional)</span>
            </label>
            <textarea
              id="channel-desc-input"
              className="modal-textarea"
              placeholder="What is this channel about?"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={creationDisabled || loadingSettings}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Channel Visibility</label>
            <div className="visibility-options-grid">
              <label className={`visibility-option-card ${!isPrivate ? 'selected' : ''} ${publicDisabled ? 'disabled-option' : ''}`}>
                <div className="visibility-option-header">
                  <input
                    type="radio"
                    name="channel-visibility"
                    checked={!isPrivate}
                    onChange={() => !publicDisabled && setIsPrivate(false)}
                    disabled={creationDisabled || publicDisabled || loadingSettings}
                  />
                  <span className="visibility-option-icon">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </span>
                  <span className="visibility-option-title">
                    Public Channel {publicDisabled && <span className="policy-note">(Policy Disabled)</span>}
                  </span>
                </div>
              </label>

              <label className={`visibility-option-card ${isPrivate ? 'selected' : ''} ${privateDisabled ? 'disabled-option' : ''}`}>
                <div className="visibility-option-header">
                  <input
                    type="radio"
                    name="channel-visibility"
                    checked={isPrivate}
                    onChange={() => !privateDisabled && setIsPrivate(true)}
                    disabled={creationDisabled || privateDisabled || loadingSettings}
                  />
                  <span className="visibility-option-icon">
                    <svg
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <span className="visibility-option-title">
                    Private Channel {privateDisabled && <span className="policy-note">(Policy Disabled)</span>}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="checkbox-option-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
              <input
                type="checkbox"
                checked={isAdminOnly}
                onChange={(e) => setIsAdminOnly(e.target.checked)}
                disabled={creationDisabled || loadingSettings}
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
              disabled={!name.trim() || loading || creationDisabled || loadingSettings}
            >
              {loading ? 'Creating...' : 'Create Channel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateChannelModal;
