import { useState, useRef, useEffect } from 'react';
import Avatar from '../common/Avatar';
import { ChannelIcon, ChatIcon } from '../common/Icons';

function TodoItem({
  todo,
  currentUserId,
  userRole,
  onToggleStatus,
  onEdit,
  onDelete,
  onNavigateToConversation,
  onNavigateToChannel,
  onNavigateToMessage,
  onAddToCalendar,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const menuRef = useRef(null);

  const isCompleted = todo.status === 'completed';
  const isCreator = (todo.createdBy?._id || todo.createdBy)?.toString() === currentUserId;
  const isAssignee = (todo.assignedTo?._id || todo.assignedTo)?.toString() === currentUserId;
  const isAdmin = userRole === 'admin';

  const canEdit = isCreator || isAssignee || isAdmin;
  const canDelete = isCreator || isAdmin;

  // Close action menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Check if due date is overdue
  const isOverdue =
    !isCompleted &&
    todo.dueDate &&
    new Date(todo.dueDate).setHours(23, 59, 59, 999) < new Date().getTime();

  // Format Due Date
  const formatDueDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Context details
  const conversation = todo.conversationId;
  const channel = todo.channelId;
  const sourceMsg = todo.sourceMessageId;

  const otherParticipant = conversation?.participants?.find(
    (p) => (p._id || p.id)?.toString() !== currentUserId
  );
  const convName = otherParticipant?.name || 'Direct Chat';

  return (
    <div
      className={`todo-card ${isCompleted ? 'completed' : ''} priority-${todo.priority || 'normal'} ${
        isOverdue ? 'overdue' : ''
      }`}
    >
      {/* 1. Checkbox toggle */}
      <button
        type="button"
        className={`todo-checkbox-btn ${isCompleted ? 'checked' : ''}`}
        onClick={() => onToggleStatus(todo._id || todo.id)}
        aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
        title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
      >
        {isCompleted ? '☑' : '☐'}
      </button>

      {/* 2. Content Area */}
      <div className="todo-content-body">
        <div className="todo-title-row">
          <span className={`todo-item-title ${isCompleted ? 'strikethrough' : ''}`}>
            {todo.title}
          </span>

          {/* Priority Pill */}
          {todo.priority && todo.priority !== 'normal' && (
            <span className={`todo-priority-badge ${todo.priority}`}>
              {todo.priority === 'high' ? 'High' : 'Low'}
            </span>
          )}
        </div>

        {/* Optional Description */}
        {todo.description && (
          <p className="todo-item-description">{todo.description}</p>
        )}

        {/* Context Attachment (Conversation / Channel / Message) */}
        {(conversation || channel || sourceMsg) && (
          <div className="todo-context-links-row">
            {channel && (
              <button
                type="button"
                className="todo-context-chip channel-chip"
                onClick={() => onNavigateToChannel?.(channel._id || channel.id || channel)}
                title="Open channel"
              >
                <ChannelIcon size={13} style={{ marginRight: 4 }} /> {channel.name || 'channel'}
              </button>
            )}

            {conversation && !channel && (
              <button
                type="button"
                className="todo-context-chip conv-chip"
                onClick={() => onNavigateToConversation?.(conversation._id || conversation.id || conversation)}
                title="Open conversation"
              >
                <ChatIcon size={13} style={{ marginRight: 4 }} /> {convName}
              </button>
            )}

            {sourceMsg && (
              <button
                type="button"
                className="todo-context-chip message-chip"
                onClick={() =>
                  onNavigateToMessage?.({
                    conversationId: conversation?._id || conversation,
                    channelId: channel?._id || channel,
                    messageId: sourceMsg._id || sourceMsg,
                  })
                }
                title="Jump to source message"
              >
                {sourceMsg.deleted ? (
                  <span>🚫 Original message was deleted</span>
                ) : (
                  <span>
                    ✉️ From: "
                    {sourceMsg.content?.slice(0, 35)}
                    {sourceMsg.content?.length > 35 ? '...' : ''}"
                  </span>
                )}
              </button>
            )}
          </div>
        )}

        {/* Metadata Badges */}
        <div className="todo-meta-row">
          <div className="todo-assignee-badge">
            <span className="meta-label">Assigned to:</span>
            <Avatar name={todo.assignedTo?.name || 'Teammate'} size="small" />
            <span className="meta-name">
              {todo.assignedTo?.name || 'Unassigned'}
              {isAssignee ? ' (You)' : ''}
            </span>
          </div>

          {todo.createdBy && !isCreator && (
            <div className="todo-creator-badge">
              <span className="meta-label">By:</span>
              <span className="meta-name">{todo.createdBy.name || 'Teammate'}</span>
            </div>
          )}

          {todo.dueDate && (
            <div className={`todo-due-badge ${isOverdue ? 'overdue-text' : ''}`}>
              <span className="meta-icon">{isOverdue ? '⚠️' : '📅'}</span>
              <span>{isOverdue ? 'Overdue: ' : 'Due: '}</span>
              <span className="meta-date">{formatDueDate(todo.dueDate)}</span>
            </div>
          )}

          {isCompleted && todo.completedAt && (
            <div className="todo-completed-badge">
              <span>✓ Completed {formatDueDate(todo.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Action Menu Trigger */}
      <div className="todo-actions-wrapper" ref={menuRef}>
        <button
          type="button"
          className="btn-todo-menu-trigger"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="To-Do options"
        >
          ⋮
        </button>

        {isMenuOpen && (
          <div className="todo-dropdown-menu" role="menu">
            <button
              type="button"
              className="todo-menu-item"
              onClick={() => {
                setIsMenuOpen(false);
                onToggleStatus(todo._id || todo.id);
              }}
            >
              <span className="menu-icon">{isCompleted ? '↩' : '✓'}</span>
              <span>{isCompleted ? 'Mark as pending' : 'Mark as completed'}</span>
            </button>

            {canEdit && (
              <button
                type="button"
                className="todo-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  onEdit(todo);
                }}
              >
                <span className="menu-icon">✏️</span>
                <span>Edit To-Do</span>
              </button>
            )}

            {canDelete && (
              <button
                type="button"
                className="todo-menu-item danger"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsDeleteConfirmOpen(true);
                }}
              >
                <span className="menu-icon">🗑️</span>
                <span>Delete To-Do</span>
              </button>
            )}

            <button
              type="button"
              className="todo-menu-item"
              onClick={() => {
                setIsMenuOpen(false);
                onAddToCalendar?.(todo);
              }}
            >
              <span className="menu-icon">📅</span>
              <span>Add to Calendar</span>
            </button>
          </div>
        )}

        {/* Delete Confirmation Popover */}
        {isDeleteConfirmOpen && (
          <div className="todo-delete-popover">
            <p className="confirm-text">Delete this To-Do?</p>
            <div className="confirm-actions">
              <button
                type="button"
                className="btn-cancel-sm"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-delete-confirm-sm"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  onDelete(todo._id || todo.id);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TodoItem;
