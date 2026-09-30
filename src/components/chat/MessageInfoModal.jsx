import Avatar from '../common/Avatar';

const formatDetailedTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

function MessageInfoModal({ isOpen, onClose, message }) {
  if (!isOpen || !message) return null;

  const senderName =
    typeof message.sender === 'object' ? message.sender?.name || 'Teammate' : 'Teammate';
  const senderEmail =
    typeof message.sender === 'object' ? message.sender?.email || '' : '';
  const senderAvatar = typeof message.sender === 'object' ? message.sender?.avatar : '';

  const attachments = message.attachments || [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content message-info-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon-badge">ℹ️</span>
            <h3>Message Information</h3>
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

        <div className="msg-info-body">
          {/* Sender Details */}
          <div className="msg-info-section">
            <span className="msg-info-label">Sender</span>
            <div className="msg-info-sender-row">
              <Avatar name={senderName} image={senderAvatar} size="medium" />
              <div className="msg-info-sender-text">
                <span className="msg-info-sender-name">{senderName}</span>
                {senderEmail && <span className="msg-info-sender-email">{senderEmail}</span>}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="msg-info-grid">
            <div className="msg-info-card">
              <span className="msg-info-label">Sent At</span>
              <span className="msg-info-value">{formatDetailedTime(message.createdAt)}</span>
            </div>

            {message.edited && (
              <div className="msg-info-card">
                <span className="msg-info-label">Edited At</span>
                <span className="msg-info-value">{formatDetailedTime(message.editedAt || message.updatedAt)}</span>
              </div>
            )}

            <div className="msg-info-card">
              <span className="msg-info-label">Message Type</span>
              <span className="msg-info-value msg-type-badge">
                {(message.messageType || 'text').toUpperCase()}
              </span>
            </div>

            <div className="msg-info-card">
              <span className="msg-info-label">Status</span>
              <span className="msg-info-value">
                {message.isRead ? '✓✓ Read' : '✓ Delivered'}
              </span>
            </div>
          </div>

          {/* Forwarding Status */}
          {message.forwarded && (
            <div className="msg-info-section">
              <span className="msg-info-label">Forward Status</span>
              <p className="msg-info-hint">↪ This message was forwarded from another conversation or channel.</p>
            </div>
          )}

          {/* Attachments Details */}
          {attachments.length > 0 && (
            <div className="msg-info-section">
              <span className="msg-info-label">Attachments ({attachments.length})</span>
              <div className="msg-info-attachments-list">
                {attachments.map((att, idx) => (
                  <div key={idx} className="msg-info-attachment-row">
                    <span className="att-file-name">📎 {att.fileName}</span>
                    <span className="att-file-meta">
                      {formatFileSize(att.fileSize)} • {att.fileType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-actions-footer">
          <button
            type="button"
            className="btn-primary-action"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default MessageInfoModal;
