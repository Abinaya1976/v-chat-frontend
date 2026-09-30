import React from 'react';
import Avatar from '../common/Avatar';
import { PinIcon } from '../common/Icons';

// Format message timestamp in a friendly manner
const formatFriendlyTime = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` at ${timeStr}`;
};

// Format date when the message was pinned
const formatPinnedDate = (dateValue) => {
  if (!dateValue) return '';
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return 'today';
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

function PinnedMessagesPanel({
  isOpen,
  onClose,
  pinnedMessages = [],
  loading = false,
  onSelectMessage,
  onUnpin = null,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop pinned-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pinned-modal-title"
    >
      <div
        className="modal-content pinned-modal-dialog"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="pinned-modal-header">
          <div className="pinned-modal-header-left">
            <div className="pinned-modal-icon-badge">
              <PinIcon size={16} color="#2563eb" strokeWidth={2.4} />
            </div>
            <div className="pinned-modal-title-group">
              <div className="pinned-modal-title-row">
                <h3 id="pinned-modal-title" className="pinned-modal-title">
                  Pinned Messages
                </h3>
                {pinnedMessages.length > 0 && (
                  <span className="pinned-modal-count-pill" aria-label={`${pinnedMessages.length} pinned messages`}>
                    {pinnedMessages.length}
                  </span>
                )}
              </div>
              <p className="pinned-modal-subtitle">
                Pinned for quick reference in this conversation
              </p>
            </div>
          </div>
          <button
            type="button"
            className="pinned-modal-close-btn"
            onClick={onClose}
            aria-label="Close pinned messages modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body / Pinned List */}
        <div className="pinned-modal-body">
          {/* Loading State */}
          {loading && (
            <div className="pinned-skeleton-list">
              {[1, 2].map((i) => (
                <div key={i} className="pinned-skeleton-card">
                  <div className="pinned-skeleton-header">
                    <div className="skeleton-circle" />
                    <div className="skeleton-bar short" />
                  </div>
                  <div className="skeleton-bar medium" />
                  <div className="skeleton-bar long" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && pinnedMessages.length === 0 && (
            <div className="pinned-empty-state">
              <div className="pinned-empty-icon">
                <PinIcon size={24} color="#94a3b8" strokeWidth={2} />
              </div>
              <h4 className="pinned-empty-title">No pinned messages</h4>
              <p className="pinned-empty-desc">
                Pin important messages to keep them easily accessible for everyone in this chat.
              </p>
            </div>
          )}

          {/* Messages List */}
          {!loading && pinnedMessages.length > 0 && (
            <div className="pinned-cards-list">
              {pinnedMessages.map((pin) => {
                const message = pin.messageId || pin;
                const messageId = (message?._id || message?.id || pin._id)?.toString();
                const sender = message?.sender;
                const senderName = typeof sender === 'object' ? sender?.name || 'Teammate' : 'Teammate';
                const senderAvatar = typeof sender === 'object' ? sender?.avatar : null;
                const deleted = Boolean(!message || message.deleted);
                const pinnedByName = pin.pinnedBy?.name || 'Teammate';
                const messageTime = formatFriendlyTime(message?.createdAt);
                const pinnedDate = formatPinnedDate(pin.pinnedAt || pin.createdAt);
                const attachments = message?.attachments || [];
                const poll = message?.poll;

                return (
                  <div
                    key={pin._id || messageId}
                    className={`pinned-message-card ${deleted ? 'is-deleted' : ''}`}
                    onClick={() => {
                      if (!deleted && onSelectMessage && messageId) {
                        onSelectMessage(messageId);
                      }
                    }}
                    role="button"
                    tabIndex={deleted ? -1 : 0}
                    onKeyDown={(e) => {
                      if (!deleted && (e.key === 'Enter' || e.key === ' ') && onSelectMessage && messageId) {
                        e.preventDefault();
                        onSelectMessage(messageId);
                      }
                    }}
                  >
                    {/* Card Header: Sender Info & Actions */}
                    <div className="pinned-card-header">
                      <div className="pinned-card-sender-info">
                        <Avatar name={senderName} image={senderAvatar} size="small" />
                        <div className="pinned-card-sender-names">
                          <span className="pinned-card-sender-name">{senderName}</span>
                          {messageTime && (
                            <span className="pinned-card-message-time">{messageTime}</span>
                          )}
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="pinned-card-actions">
                        {!deleted && (
                          <button
                            type="button"
                            className="btn-pinned-action-jump"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectMessage && messageId) {
                                onSelectMessage(messageId);
                              }
                            }}
                            title="Jump to message in conversation"
                          >
                            <span>Jump</span>
                            <svg
                              viewBox="0 0 24 24"
                              width="12"
                              height="12"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="5" y1="12" x2="19" y2="12" />
                              <polyline points="12 5 19 12 12 19" />
                            </svg>
                          </button>
                        )}
                        {onUnpin && messageId && (
                          <button
                            type="button"
                            className="btn-pinned-action-unpin"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUnpin(messageId);
                            }}
                            title="Unpin message"
                            aria-label={`Unpin message from ${senderName}`}
                          >
                            <PinIcon size={12} strokeWidth={2.4} />
                            <span>Unpin</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body: Content */}
                    <div className="pinned-card-content">
                      {deleted ? (
                        <span className="pinned-card-deleted-text">This message was deleted.</span>
                      ) : (
                        <>
                          {message?.content && (
                            <p className="pinned-card-message-text">{message.content}</p>
                          )}

                          {/* Attachments Preview */}
                          {attachments.length > 0 && (
                            <div className="pinned-card-attachments">
                              {attachments.map((att, idx) => {
                                const isImg =
                                  att.fileType?.startsWith('image/') ||
                                  ['jpg', 'jpeg', 'png', 'webp', 'gif'].some((ext) =>
                                    att.fileName?.toLowerCase().endsWith(ext)
                                  );
                                return (
                                  <div
                                    key={att._id || idx}
                                    className="pinned-card-attachment-chip"
                                    title={att.fileName}
                                  >
                                    <span className="attachment-chip-icon">
                                      {isImg ? '🖼️' : '📎'}
                                    </span>
                                    <span className="attachment-chip-name">{att.fileName}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Poll Preview */}
                          {poll && (
                            <div className="pinned-card-poll-badge">
                              <span className="pinned-poll-icon">📊</span>
                              <span className="pinned-poll-question">
                                Poll: {poll.question}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Card Footer: Pin Attribution */}
                    <div className="pinned-card-footer">
                      <span className="pinned-card-meta">
                        <PinIcon size={11} color="#0284c7" strokeWidth={2.4} />
                        <span>
                          Pinned by <strong>{pinnedByName}</strong>
                          {pinnedDate ? ` · ${pinnedDate}` : ''}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pinned-modal-footer">
          <span className="pinned-modal-hint">
            Click any message to jump directly to it
          </span>
          <button
            type="button"
            className="btn-pinned-modal-close"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinnedMessagesPanel;
