import { useState, useEffect } from 'react';
import Avatar from '../common/Avatar';
import { ChannelIcon, ChatIcon } from '../common/Icons';

function TodoModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  contextData = null, // { conversation, channel, sourceMessage }
  availableUsers = [],
  currentUserId,
}) {
  const isEditing = Boolean(initialData?._id || initialData?.id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute selectable assignees based on context
  let selectableUsers = availableUsers;
  if (contextData?.conversation?.participants) {
    selectableUsers = contextData.conversation.participants;
  } else if (contextData?.channel?.members) {
    // If channel members are IDs or populated objects
    selectableUsers = availableUsers.filter((u) => {
      const uId = (u._id || u.id)?.toString();
      return contextData.channel.members.some((m) => (m._id || m.id || m)?.toString() === uId);
    });
    if (selectableUsers.length === 0) selectableUsers = availableUsers;
  }

  // Populate form on open / change
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        const currentAssigneeId = (initialData.assignedTo?._id || initialData.assignedTo)?.toString();
        setAssignedTo(currentAssigneeId || currentUserId || '');
        setPriority(initialData.priority || 'normal');
        if (initialData.dueDate) {
          const d = new Date(initialData.dueDate);
          setDueDate(d.toISOString().split('T')[0]);
        } else {
          setDueDate('');
        }
      } else {
        // New Todo
        if (contextData?.sourceMessage?.content) {
          // Pre-populate snippet as title or description
          const msgSnippet = contextData.sourceMessage.content.slice(0, 100).trim();
          setTitle(msgSnippet || '');
        } else {
          setTitle('');
        }
        setDescription('');
        // Default assignee: empty string represents myself (no other member required)
        setAssignedTo('');
        setPriority('normal');
        setDueDate('');
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, initialData, contextData, currentUserId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title for the To-Do');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo || currentUserId,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      };

      if (!isEditing && contextData) {
        if (contextData.conversation?._id || contextData.conversation?.id) {
          payload.conversationId = contextData.conversation._id || contextData.conversation.id;
        }
        if (contextData.channel?._id || contextData.channel?.id) {
          payload.channelId = contextData.channel._id || contextData.channel.id;
        }
        if (contextData.sourceMessage?._id || contextData.sourceMessage?.id) {
          payload.sourceMessageId = contextData.sourceMessage._id || contextData.sourceMessage.id;
        }
      }

      await onSubmit(payload, initialData?._id || initialData?.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save To-Do');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="todo-modal-card"
        onClick={(e) => e.stopPropagation()}
        tabIndex="-1"
      >
        {/* Fixed Header */}
        <div className="todo-modal-header">
          <div className="todo-modal-title-wrap">
            <span className="todo-modal-icon">☑️</span>
            <h3>{isEditing ? 'Edit To-Do' : 'Add a To-Do'}</h3>
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

        {/* Form enclosing Scrollable Body and Fixed Footer */}
        <form onSubmit={handleSubmit} className="todo-modal-form">
          {/* Scrollable Body */}
          <div className="todo-modal-body">
            {/* Context Banner if created from conversation / channel / message */}
            {!isEditing && contextData && (
              <div className="todo-context-banner">
                {contextData.channel && (
                  <span className="context-pill channel-pill">
                    <ChannelIcon size={12} style={{ marginRight: 4 }} /> {contextData.channel.name || 'channel'}
                  </span>
                )}
                {contextData.conversation && (
                  <span className="context-pill conversation-pill">
                    <ChatIcon size={12} style={{ marginRight: 4 }} /> Direct Conversation
                  </span>
                )}
                {contextData.sourceMessage && (
                  <div className="context-message-preview">
                    <span className="context-label">From Message:</span>
                    <span className="context-snippet">
                      "{contextData.sourceMessage.content?.slice(0, 80)}
                      {contextData.sourceMessage.content?.length > 80 ? '...' : ''}"
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Error Notification */}
            {error && <div className="todo-modal-error">⚠️ {error}</div>}

            <div className="form-group">
              <label htmlFor="todo-title-input" className="form-label">
                Title <span className="required-star">*</span>
              </label>
              <input
                id="todo-title-input"
                type="text"
                className="form-input"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
                maxLength={200}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="todo-desc-input" className="form-label">
                Description <span className="optional-tag">(Optional)</span>
              </label>
              <textarea
                id="todo-desc-input"
                className="form-textarea"
                placeholder="Add additional details, links, or instructions..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="form-row-grid">
              <div className="form-group">
                <label htmlFor="todo-assign-select" className="form-label">
                  Assign to <span className="optional-tag">(Optional)</span>
                </label>
                <select
                  id="todo-assign-select"
                  className="form-select"
                  value={assignedTo === currentUserId ? '' : assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">Myself (Me)</option>
                  {selectableUsers.map((u) => {
                    const uId = (u._id || u.id)?.toString();
                    if (!uId || uId === currentUserId) return null;
                    return (
                      <option key={uId} value={uId}>
                        {u.name || u.email}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="todo-due-input" className="form-label">
                  Due date <span className="optional-tag">(Optional)</span>
                </label>
                <input
                  id="todo-due-input"
                  type="date"
                  className="form-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <div className="priority-radio-group">
                {[
                  { id: 'low', label: 'Low' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'high', label: 'High' },
                ].map((p) => (
                  <label
                    key={p.id}
                    className={`priority-pill-label ${priority === p.id ? 'active ' + p.id : ''}`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p.id}
                      checked={priority === p.id}
                      onChange={() => setPriority(p.id)}
                      className="sr-only"
                    />
                    <span>{p.icon} {p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Fixed Modal Footer */}
          <div className="todo-modal-footer">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-todo"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update To-Do' : 'Create To-Do'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TodoModal;
