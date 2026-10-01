import { useState } from 'react';
import Avatar from '../common/Avatar';

function ForwardModal({
  isOpen,
  onClose,
  message,
  conversations = [],
  channels = [],
  currentUserId,
  onConfirmForward,
}) {
  const [selectedTarget, setSelectedTarget] = useState(null); // { type: 'conversation' | 'channel', id: string, name: string }
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !message) return null;

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const otherUser = conv.participants?.find(
      (p) => (p._id || p.id || p)?.toString() !== currentUserId?.toString()
    ) || conv.participants?.[0];
    const name = otherUser?.name || conv.name || 'Teammate';
    return name.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  // Filter joined channels
  const filteredChannels = channels.filter((ch) => {
    const isMember = ch.members?.some(
      (m) => (m._id || m.id || m)?.toString() === currentUserId?.toString()
    );
    if (!isMember) return false;
    
    if (ch.isAdminOnly) {
      const isCreator = (ch.createdBy?._id || ch.createdBy?.id || ch.createdBy)?.toString() === currentUserId?.toString();
      const isAdmin = ch.admins?.some((a) => (a._id || a.id || a)?.toString() === currentUserId?.toString());
      if (!isCreator && !isAdmin) return false;
    }
    
    return ch.name?.toLowerCase().includes(searchQuery.toLowerCase().trim());
  });

  const handleForward = async () => {
    if (!selectedTarget || loading) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirmForward(message._id || message.id, {
        targetType: selectedTarget.type,
        targetId: selectedTarget.id,
      });
      onClose();
    } catch (err) {
      console.error('Failed to forward message:', err.message);
      setError(err.response?.data?.message || 'Failed to forward message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const messageSnippet =
    message.content ||
    (message.attachments?.length > 0 ? `📎 ${message.attachments[0].fileName}` : 'Message');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content forward-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon-badge">↪</span>
            <h3>Forward Message</h3>
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

        <div className="forward-preview-box">
          <span className="forward-preview-label">Forwarding snippet:</span>
          <p className="forward-preview-text">&quot;{messageSnippet}&quot;</p>
        </div>

        {error && <div className="modal-error-banner">⚠️ {error}</div>}

        <div className="forward-search-box">
          <span className="forward-search-icon">🔍</span>
          <input
            type="text"
            className="forward-search-input"
            placeholder="Search people or channels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-forward-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="forward-destination-list">
          {/* Direct Chats */}
          <div className="forward-section-title">Direct Messages</div>
          {filteredConversations.length === 0 ? (
            <div className="forward-empty-hint">No direct conversations match</div>
          ) : (
            filteredConversations.map((conv) => {
              const convId = (conv._id || conv.id)?.toString();
              const otherUser = conv.participants?.find(
                (p) => (p._id || p.id || p)?.toString() !== currentUserId?.toString()
              ) || conv.participants?.[0];
              const name = otherUser?.name || conv.name || 'Teammate';
              const avatar = otherUser?.avatar;
              const isSelected = selectedTarget?.type === 'conversation' && selectedTarget?.id === convId;

              return (
                <div
                  key={convId}
                  role="button"
                  tabIndex={0}
                  className={`forward-dest-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget({ type: 'conversation', id: convId, name })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedTarget({ type: 'conversation', id: convId, name });
                    }
                  }}
                >
                  <Avatar name={name} image={avatar} size="small" />
                  <span className="dest-item-name">{name}</span>
                  <div className={`dest-radio-indicator ${isSelected ? 'active' : ''}`} />
                </div>
              );
            })
          )}

          {/* Group Channels */}
          <div className="forward-section-title" style={{ marginTop: '12px' }}>
            Your Channels
          </div>
          {filteredChannels.length === 0 ? (
            <div className="forward-empty-hint">No joined channels match</div>
          ) : (
            filteredChannels.map((ch) => {
              const chId = (ch._id || ch.id)?.toString();
              const isSelected = selectedTarget?.type === 'channel' && selectedTarget?.id === chId;

              return (
                <div
                  key={chId}
                  role="button"
                  tabIndex={0}
                  className={`forward-dest-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTarget({ type: 'channel', id: chId, name: ch.name })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedTarget({ type: 'channel', id: chId, name: ch.name });
                    }
                  }}
                >
                  <div className="dest-channel-hash">
                    {ch.isPrivate ? (
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
                    ) : (
                      '👥'
                    )}
                  </div>
                  <span className="dest-item-name">{ch.name}</span>
                  <div className={`dest-radio-indicator ${isSelected ? 'active' : ''}`} />
                </div>
              );
            })
          )}
        </div>

        <div className="modal-actions-footer">
          <button
            type="button"
            className="btn-cancel-action"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary-action btn-forward-submit"
            onClick={handleForward}
            disabled={!selectedTarget || loading}
          >
            {loading ? 'Forwarding...' : selectedTarget ? `Forward to ${selectedTarget.name}` : 'Select destination'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForwardModal;
