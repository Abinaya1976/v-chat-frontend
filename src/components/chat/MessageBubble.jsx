import { useState, useRef, useEffect } from 'react';
import Avatar from '../common/Avatar';
import ReactionBar from './ReactionBar';
import EmojiPicker from './EmojiPicker';
import PollCard from './PollCard';
import { TodoIcon, BookmarkIcon, PinIcon, AudioCallIcon, VideoCallIcon, BellIcon, CalendarIcon } from '../common/Icons';

// Format message timestamp
const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format file size
const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// Format call duration into MM:SS format
const formatCallDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Format call status label
const getCallStatusText = (callData, isOwn) => {
  const status = callData?.status || 'ended';
  const durationStr = formatCallDuration(callData?.duration);

  if (status === 'started') {
    return 'Started a group call';
  }
  if (status === 'ended') {
    const dir = isOwn ? 'Outgoing' : 'Incoming';
    return durationStr ? `${dir} · ${durationStr}` : dir;
  }
  if (status === 'missed') {
    return isOwn ? 'Cancelled' : 'Missed';
  }
  if (status === 'declined') {
    return 'Declined';
  }
  if (status === 'cancelled') {
    return isOwn ? 'Cancelled' : 'Missed';
  }
  return 'Ended';
};

// Render inline formatting (bold, italic, underline) within formatted text blocks
const renderFormattedInline = (content, keyPrefix = 'sub') => {
  if (typeof content !== 'string') return content;
  const subRegex = /(\*\*[^*]+?\*\*|<(?:strong|b)>[\s\S]*?<\/(?:strong|b)>|<u>[\s\S]*?<\/u>|__[^_]+__|(?<!\*)\*[^*]+?\*(?!\*)|<(?:em|i)>[\s\S]*?<\/(?:em|i)>)/gi;
  const subParts = content.split(subRegex);
  if (subParts.length === 1) return content;
  return subParts.map((subPart, j) => {
    if (!subPart) return null;
    if (
      (subPart.startsWith('**') && subPart.endsWith('**') && subPart.length >= 4) ||
      (subPart.startsWith('<b>') && subPart.endsWith('</b>') && subPart.length >= 7) ||
      (subPart.startsWith('<strong>') && subPart.endsWith('</strong>') && subPart.length >= 17)
    ) {
      const inner = subPart.startsWith('**')
        ? subPart.slice(2, -2)
        : subPart.startsWith('<b>')
        ? subPart.slice(3, -4)
        : subPart.slice(8, -9);
      return (
        <strong key={`${keyPrefix}-b-${j}`}>
          {renderFormattedInline(inner, `${keyPrefix}-b-${j}`)}
        </strong>
      );
    }
    if (subPart.startsWith('<u>') && subPart.endsWith('</u>') && subPart.length >= 7) {
      return (
        <u key={`${keyPrefix}-u-${j}`}>
          {renderFormattedInline(subPart.slice(3, -4), `${keyPrefix}-u-${j}`)}
        </u>
      );
    }
    if (subPart.startsWith('__') && subPart.endsWith('__') && subPart.length >= 4) {
      return (
        <u key={`${keyPrefix}-u-${j}`}>
          {renderFormattedInline(subPart.slice(2, -2), `${keyPrefix}-u-${j}`)}
        </u>
      );
    }
    if (
      (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length >= 2) ||
      (subPart.startsWith('<i>') && subPart.endsWith('</i>') && subPart.length >= 7) ||
      (subPart.startsWith('<em>') && subPart.endsWith('</em>') && subPart.length >= 9)
    ) {
      const inner = subPart.startsWith('*')
        ? subPart.slice(1, -1)
        : subPart.startsWith('<i>')
        ? subPart.slice(3, -4)
        : subPart.slice(4, -5);
      return <em key={`${keyPrefix}-em-${j}`}>{renderFormattedInline(inner, `${keyPrefix}-em-${j}`)}</em>;
    }
    return subPart;
  });
};

// Render message text with text formatting (bold, italic, underline) and @all / @mention badges
const renderMessageContent = (text) => {
  if (!text) return null;
  // Match @all, @mentions, bold-italic (***...***), bold (**...** or <b>...</b> or <strong>...</strong>), underline (<u>...</u> or __...__), italic (*...* or <i>...</i> or <em>...</em>)
  const tokenRegex = /(@all\b|@[a-zA-Z0-9_.-]+|\*\*\*[^*]+?\*\*\*|\*\*[^*]+?\*\*|<(?:strong|b)>[\s\S]*?<\/(?:strong|b)>|<u>[\s\S]*?<\/u>|__[^_]+__|(?<!\*)\*[^*]+?\*(?!\*)|<(?:em|i)>[\s\S]*?<\/(?:em|i)>)/gi;
  const parts = text.split(tokenRegex);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.toLowerCase() === '@all') {
      return (
        <span key={i} className="mention-tag mention-all-tag" title="Mentioned all members">
          @all
        </span>
      );
    }
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span key={i} className="mention-tag" title={`Mentioned ${part}`}>
          {part}
        </span>
      );
    }
    if (part.startsWith('***') && part.endsWith('***') && part.length >= 6) {
      const inner = part.slice(3, -3);
      return (
        <strong key={i}>
          <em>{renderFormattedInline(inner, `bi-${i}`)}</em>
        </strong>
      );
    }
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('<b>') && part.endsWith('</b>') && part.length >= 7) ||
      (part.startsWith('<strong>') && part.endsWith('</strong>') && part.length >= 17)
    ) {
      const inner = part.startsWith('**')
        ? part.slice(2, -2)
        : part.startsWith('<b>')
        ? part.slice(3, -4)
        : part.slice(8, -9);
      return <strong key={i}>{renderFormattedInline(inner, `b-${i}`)}</strong>;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
      const inner = part.slice(3, -4);
      return <u key={i}>{renderFormattedInline(inner, `u-${i}`)}</u>;
    }
    if (part.startsWith('__') && part.endsWith('__') && part.length >= 4) {
      const inner = part.slice(2, -2);
      return <u key={i}>{renderFormattedInline(inner, `u-${i}`)}</u>;
    }
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('<i>') && part.endsWith('</i>') && part.length >= 7) ||
      (part.startsWith('<em>') && part.endsWith('</em>') && part.length >= 9)
    ) {
      const inner = part.startsWith('*')
        ? part.slice(1, -1)
        : part.startsWith('<i>')
        ? part.slice(3, -4)
        : part.slice(4, -5);
      return <em key={i}>{renderFormattedInline(inner, `i-${i}`)}</em>;
    }
    
    // Replace bot emojis with SVGs
    if (typeof part === 'string') {
      if (part.includes('🔔')) {
        const partsWithIcon = part.split('🔔');
        return (
          <span key={i}>
            {partsWithIcon.map((p, idx) => (
              <span key={idx}>
                {p}
                {idx < partsWithIcon.length - 1 && (
                  <BellIcon size={16} color="#f59e0b" style={{ marginRight: '4px', verticalAlign: 'text-bottom', display: 'inline-block' }} />
                )}
              </span>
            ))}
          </span>
        );
      }
      if (part.includes('📅')) {
        const partsWithIcon = part.split('📅');
        return (
          <span key={i}>
            {partsWithIcon.map((p, idx) => (
              <span key={idx}>
                {p}
                {idx < partsWithIcon.length - 1 && (
                  <CalendarIcon size={16} color="#10b981" style={{ marginRight: '4px', verticalAlign: 'text-bottom', display: 'inline-block' }} />
                )}
              </span>
            ))}
          </span>
        );
      }
    }
    
    return part;
  });
};

function MessageBubble({
  message,
  currentUserId,
  isHighlighted = false,
  isReplyTarget = false,
  onReply = null,
  onForward = null,
  onEdit = null,
  onDelete = null,
  onDeleteForMe = null,
  onCreateTodo = null,
  onShowInfo = null,
  onSelectMessage = null,
  onReaction = null,
  isSaved = false,
  isPinned = false,
  onSave = null,
  onUnsave = null,
  onPin = null,
  onUnpin = null,
  onMarkLinkCopied = null,
  onOpenPollModal = null,
  isConsecutive = false,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const editTextareaRef = useRef(null);
  const reactionBtnRef = useRef(null);

  const senderId = (
    message.sender?._id ||
    message.sender?.id ||
    (typeof message.sender === 'string' ? message.sender : null)
  )?.toString();

  const myId = currentUserId?.toString();
  const isOwn = Boolean(senderId && myId && senderId === myId) || Boolean(message.own);

  let senderName = 'Teammate';
  let senderAvatar = '';
  let content = message.content || message.text || '';
  let time = formatMessageTime(message.createdAt || message.time);
  const attachments = message.attachments || [];
  const messageId = (message._id || message.id)?.toString();
  const isDeleted = Boolean(message.deleted);
  const isEdited = Boolean(message.edited);
  const isForwarded = Boolean(message.forwarded);
  const replyTo = message.replyTo;

  if (message.sender && typeof message.sender === 'object') {
    senderName = message.sender.name || 'Teammate';
    senderAvatar = message.sender.avatar || '';
  } else if (message.senderName) {
    senderName = message.senderName;
  } else {
    senderName = isOwn ? 'You' : 'Teammate';
  }

  // Auto-focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setEditContent(message.content || '');
      setEditError(null);
      setTimeout(() => {
        if (editTextareaRef.current) {
          editTextareaRef.current.focus();
          editTextareaRef.current.select();
        }
      }, 50);
    }
  }, [isEditing, message.content]);

  const getFileUrl = (url, download = false, filename = '') => {
    if (!url) return '';
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      finalUrl = `${backendUrl.replace(/\/$/, '')}${url}`;
    }
    const token = sessionStorage.getItem('chatapp_token');
    
    // Construct query parameters
    const urlObj = new URL(finalUrl, window.location.origin);
    if (token && finalUrl.includes('/uploads/') && !urlObj.searchParams.has('token')) {
      urlObj.searchParams.append('token', token);
    }
    if (download) {
      urlObj.searchParams.append('download', '1');
      if (filename) {
        urlObj.searchParams.append('filename', filename);
      }
    }
    return urlObj.toString();
  };

  const handleCopy = async () => {
    if (!content || isDeleted) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleCopyLink = async () => {
    const contextId = (message.conversationId?._id || message.conversationId || message.channelId?._id || message.channelId)?.toString();
    if (!messageId || !contextId) return;
    const prefix = message.channelId ? 'channel' : 'chat';
    const link = `${window.location.origin}/${prefix}/${contextId}/message/${messageId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
      onMarkLinkCopied?.();
    } catch (error) {
      console.error('Failed to copy message link:', error);
    }
  };

  const handleSaveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError('Message content cannot be empty');
      return;
    }
    if (trimmed === message.content?.trim()) {
      setIsEditing(false);
      return;
    }
    setEditLoading(true);
    setEditError(null);
    try {
      if (onEdit) {
        await onEdit(messageId, trimmed);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit message:', err);
      setEditError(err.response?.data?.message || 'Failed to save edit');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const handleConfirmDeleteForEveryone = async () => {
    setDeleteLoading(true);
    try {
      if (onDelete) {
        await onDelete(messageId);
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleConfirmDeleteForMe = async () => {
    setDeleteLoading(true);
    try {
      if (onDeleteForMe) {
        await onDeleteForMe(messageId);
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Failed to delete message for me:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const canDeleteForEveryone = isOwn && Boolean(onDelete);

  // Scroll to / highlight the original message that was replied to
  const handleReplyQuoteClick = () => {
    const replyId = (replyTo?._id || replyTo?.id)?.toString();
    if (replyId && typeof onSelectMessage === 'function') {
      onSelectMessage(replyId);
    }
  };

  return (
    <div
      id={messageId ? `msg-${messageId}` : undefined}
      className={`message-bubble-wrapper ${isOwn ? 'own-wrapper' : 'other-wrapper'} ${
        isHighlighted ? 'highlighted-message-wrapper' : ''
      } ${isDeleted ? 'deleted-message-wrapper' : ''} ${isConsecutive ? 'consecutive-message' : ''} ${
        isReplyTarget ? 'reply-target-wrapper' : ''
      }`}
    >
      {!isOwn && (
        <div className={`message-avatar-container ${isConsecutive ? 'avatar-hidden' : ''}`}>
          {!isConsecutive && <Avatar name={senderName} image={senderAvatar} size="small" />}
        </div>
      )}

      <div
        className={`message-bubble ${isOwn ? 'message-own' : 'message-other'} ${
          isHighlighted ? 'message-highlight-pulse' : ''
        } ${isDeleted ? 'message-deleted-bubble' : ''} ${
          isReplyTarget ? 'message-reply-target' : ''
        } ${isEditing ? 'message-editing' : ''}`}
      >
        {/* Modern WhatsApp-Style Floating Message Action Bar */}
        {!isEditing && !isDeleted && (
          <div className="message-actions-bar whatsapp-actions-bar">
            {copiedToast && <span className="action-toast">Copied!</span>}

            {/* Quick Emoji Reactions: 👍 ❤️ 😂 + */}
            {onReaction && (
              <div className="wa-quick-reactions">
                {['👍', '❤️', '😂'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="btn-wa-reaction"
                    title={`React with ${emoji}`}
                    onClick={() => onReaction(messageId, emoji)}
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn-wa-reaction btn-wa-plus-reaction"
                  title="More reactions"
                  ref={reactionBtnRef}
                  onClick={() => setShowReactionPicker((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            )}

            <div className="wa-actions-divider" />

            {/* Core Action Icons */}
            {onReply && (
              <button
                type="button"
                className="btn-msg-action"
                title="Reply"
                aria-label="Reply"
                onClick={() => onReply(message)}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 14 4 9 9 4" />
                  <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
                </svg>
              </button>
            )}

            {onForward && (
              <button
                type="button"
                className="btn-msg-action"
                title="Forward"
                aria-label="Forward"
                onClick={() => onForward(message)}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 14 20 9 15 4" />
                  <path d="M4 20v-7a4 4 0 0 1 4-4h12" />
                </svg>
              </button>
            )}

            {content && (
              <button
                type="button"
                className="btn-msg-action"
                title="Copy text"
                aria-label="Copy text"
                onClick={handleCopy}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            )}

            {(onPin || onUnpin) && (
              <button
                type="button"
                className={`btn-msg-action ${isPinned ? 'message-action-active' : ''}`}
                title={isPinned ? 'Unpin message' : 'Pin message'}
                aria-label={isPinned ? 'Unpin message' : 'Pin message'}
                onClick={() => (isPinned ? onUnpin(messageId) : onPin(messageId))}
              >
                <PinIcon size={15} strokeWidth={2.2} />
              </button>
            )}

            {(onSave || onUnsave) && (
              <button
                type="button"
                className={`btn-msg-action ${isSaved ? 'message-action-active' : ''}`}
                title={isSaved ? 'Remove from saved' : 'Save message'}
                aria-label={isSaved ? 'Remove from saved' : 'Save message'}
                onClick={() => (isSaved ? onUnsave(messageId) : onSave(messageId))}
              >
                <BookmarkIcon size={15} strokeWidth={2.2} />
              </button>
            )}

            {isOwn && message.messageType === 'text' && onEdit && (
              <button
                type="button"
                className="btn-msg-action"
                title="Edit message"
                aria-label="Edit message"
                onClick={() => setIsEditing(true)}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}

            {onCreateTodo && (
              <button
                type="button"
                className="btn-msg-action"
                title="Create To-Do"
                aria-label="Create To-Do"
                onClick={() => onCreateTodo(message)}
              >
                <TodoIcon size={15} strokeWidth={2.2} />
              </button>
            )}

            <button
              type="button"
              className="btn-msg-action"
              title="Copy message link"
              aria-label="Copy message link"
              onClick={handleCopyLink}
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>

            {(onDelete || onDeleteForMe) && (
              <button
                type="button"
                className="btn-msg-action btn-msg-action-delete"
                title="Delete message"
                aria-label="Delete message"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div 
            className="delete-confirm-popover"
            style={{
              [isOwn ? 'right' : 'left']: 0,
              [isOwn ? 'left' : 'right']: 'auto',
              zIndex: 9999
            }}
          >
            <p className="delete-confirm-title">Delete Message Options</p>
            <div className="delete-confirm-actions" style={{ flexDirection: 'column', gap: '6px' }}>
              {onDeleteForMe && (
                <button
                  type="button"
                  className="btn-delete-for-me"
                  onClick={handleConfirmDeleteForMe}
                  disabled={deleteLoading}
                >
                  Delete for me
                </button>
              )}
              {canDeleteForEveryone && (
                <button
                  type="button"
                  className="btn-delete-confirm"
                  onClick={handleConfirmDeleteForEveryone}
                  disabled={deleteLoading}
                >
                  Delete for everyone
                </button>
              )}
              <button
                type="button"
                className="btn-delete-cancel"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Forwarded Header Indicator */}
        {isForwarded && (
          <div className="message-forwarded-tag">
            <span>↪ Forwarded</span>
          </div>
        )}

        {/* Reply Quote Block */}
        {replyTo && (
          <div
            role="button"
            tabIndex={0}
            className="message-reply-quote-block"
            onClick={handleReplyQuoteClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleReplyQuoteClick();
              }
            }}
            title="Click to jump to original message"
          >
            <div className="reply-quote-line" />
            <div className="reply-quote-body">
              <span className="reply-quote-author">
                {replyTo.sender?.name || (replyTo.sender === myId ? 'You' : 'Teammate')}
              </span>
              <span className="reply-quote-text">
                {replyTo.deleted
                  ? '🚫 This message was deleted'
                  : replyTo.content || (replyTo.attachments?.length > 0 ? `📎 ${replyTo.attachments[0].fileName}` : 'Attachment')}
              </span>
            </div>
          </div>
        )}

        {!isOwn && !isDeleted && !isConsecutive && (
          <span className="message-sender-name">{senderName}</span>
        )}

        {/* Soft-Deleted Message View */}
        {isDeleted ? (
          <div className="message-deleted-text">
            <span className="deleted-icon">🚫</span>
            <em>This message was deleted</em>
          </div>
        ) : isEditing ? (
          /* Inline Message Editor */
          <div className="message-inline-editor">
            {editError && <div className="edit-error-hint">⚠️ {editError}</div>}
            <textarea
              ref={editTextareaRef}
              className="inline-edit-textarea"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              rows={1}
              disabled={editLoading}
            />
            <div className="inline-edit-buttons">
              <span className="edit-key-hint">Enter to save • Esc to cancel</span>
              <div className="edit-btn-group">
                <button
                  type="button"
                  className="btn-edit-cancel"
                  onClick={handleCancelEdit}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-edit-save"
                  onClick={handleSaveEdit}
                  disabled={editLoading || !editContent.trim()}
                >
                  {editLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div className="message-attachments-container">
                {attachments.map((att, idx) => {
                  const rawExt = (att.fileName?.split('.').pop() || '').toLowerCase();
                  const isImage = att.fileType?.startsWith('image/');
                  const isVideo =
                    att.fileType?.startsWith('video/') ||
                    ['mp4', 'webm', 'mov'].includes(rawExt);
                  const fileUrl = getFileUrl(att.fileUrl);
                  const extBadge = rawExt.toUpperCase() || 'FILE';

                  // Case A: Image Attachment
                  if (isImage) {
                    const downloadUrl = getFileUrl(att.fileUrl, true, att.fileName);
                    return (
                      <div key={`${att.fileUrl}-${idx}`} className="message-image-wrapper">
                        <a
                          href={fileUrl}
                          className="image-attachment-link"
                          target="_self"
                        >
                          <img
                            src={fileUrl}
                            alt={att.fileName}
                            className="message-image-attachment"
                            loading="lazy"
                          />
                        </a>
                        <a
                          href={downloadUrl}
                          download={att.fileName}
                          className="image-download-btn"
                          title={`Download ${att.fileName}`}
                          aria-label={`Download ${att.fileName}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            width="16"
                            height="16"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </a>
                      </div>
                    );
                  }

                  // Case B: Video Attachment (Level 11 Native HTML5 Player)
                  if (isVideo) {
                    const downloadUrl = getFileUrl(att.fileUrl, true, att.fileName);
                    return (
                      <div key={`${att.fileUrl}-${idx}`} className="message-video-wrapper">
                        <video
                          controls
                          preload="metadata"
                          className="message-video-player"
                        >
                          <source src={fileUrl} type={att.fileType || 'video/mp4'} />
                          Your browser does not support playing this video format.
                        </video>
                        <div className="message-video-footer">
                          <div className="video-meta-info">
                            <span className="video-file-name" title={att.fileName}>
                              🎥 {att.fileName}
                            </span>
                            <span className="video-file-size">
                              {formatFileSize(att.fileSize)}
                            </span>
                          </div>
                          <a
                            href={downloadUrl}
                            download={att.fileName}
                            className="btn-video-download"
                            title={`Download ${att.fileName}`}
                            aria-label={`Download ${att.fileName}`}
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    );
                  }

                  // Case C: General Document / PDF
                  const downloadUrl = getFileUrl(att.fileUrl, true, att.fileName);
                  const isPdf = rawExt === 'pdf' || att.fileType === 'application/pdf';
                  
                  return (
                    <div key={`${att.fileUrl}-${idx}`} className="message-file-card">
                      <a href={fileUrl} target="_self" className="file-card-preview-link" style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0 }}>
                        <div className="file-card-icon-badge">{extBadge}</div>
                        <div className="file-card-details" style={{ overflow: 'hidden' }}>
                          <span className="file-card-name" title={att.fileName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                            {att.fileName}
                          </span>
                          <span className="file-card-size">
                            {formatFileSize(att.fileSize)}
                          </span>
                        </div>
                      </a>
                      <a
                        href={downloadUrl}
                        download={att.fileName}
                        className="btn-file-download"
                        title={`Download ${att.fileName}`}
                        aria-label={`Download ${att.fileName}`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Poll Card */}
            {message.poll && (
              <PollCard
                poll={message.poll}
                currentUserId={currentUserId}
                onOpenModal={() => onOpenPollModal?.(message)}
              />
            )}

            {/* Call History Message Card */}
            {message.messageType === 'call' && (
              <div className="message-call-card">
                <div className={`call-card-icon-badge ${['missed', 'declined', 'cancelled'].includes(message.call?.status) ? 'call-missed' : message.call?.status === 'started' ? 'call-started' : ''}`}>
                  {message.call?.callType === 'video' ? (
                    <VideoCallIcon size={18} />
                  ) : (
                    <AudioCallIcon size={18} />
                  )}
                </div>
                <div className="call-card-details">
                  <span className="call-card-title">
                    {message.call?.callType === 'video' ? 'Video Call' : 'Audio Call'}
                  </span>
                  <span className={`call-card-subtitle ${['missed', 'declined', 'cancelled'].includes(message.call?.status) ? 'subtitle-missed' : ''}`}>
                    {getCallStatusText(message.call, isOwn)}
                  </span>
                </div>
              </div>
            )}

            {/* Text Content */}
            {!message.poll && message.messageType !== 'call' && content && (
              <div className="message-text">{renderMessageContent(content)}</div>
            )}
          </>
        )}

        {/* Level 15: Reaction Bar — shown for non-deleted messages */}
        {!isDeleted && onReaction && (
          <ReactionBar
            reactions={message.reactions || []}
            currentUserId={currentUserId}
            onReaction={(emoji) => onReaction(messageId, emoji)}
          />
        )}



        {/* Emoji Picker (opened from action bar) */}
        {showReactionPicker && !isDeleted && onReaction && (
          <EmojiPicker
            onSelectEmoji={(emoji) => {
              onReaction(messageId, emoji);
              setShowReactionPicker(false);
            }}
            onClose={() => setShowReactionPicker(false)}
            triggerRef={reactionBtnRef}
          />
        )}

        <div className="message-meta-footer">
          {!isDeleted && isPinned && (
            <span className="msg-state-pin-badge" title="Pinned message">
              <PinIcon size={12} strokeWidth={2.2} />
            </span>
          )}
          {isEdited && !isDeleted && <span className="message-edited-badge">(edited)</span>}
          {isOwn && !isDeleted && (
            <span
              className={`message-read-status ${message.isRead ? 'status-seen' : 'status-sent'}`}
              aria-label={message.isRead ? 'Seen' : 'Sent'}
            >
              {message.isRead ? 'Seen' : 'Sent'}
            </span>
          )}
          {isSaved && !isDeleted && (
            <span className="message-saved-icon" title="Saved">
              <BookmarkIcon size={11} strokeWidth={2.2} />
            </span>
          )}
          <span className="message-time">{time}</span>
        </div>
      </div>
    </div>
  );
}

export default MessageBubble;
