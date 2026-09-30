import { useState, useRef, useEffect } from 'react';
import {
  ReminderIcon,
  CheckIcon,
  ClockIcon,
  RefreshIcon,
  EditIcon,
  TrashIcon,
} from '../common/Icons';
import ConfirmModal from '../admin/AdminConfirmModal';

function ReminderItem({
  reminder,
  onSnooze,
  onEdit,
  onDelete,
}) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const snoozeRef = useRef(null);

  const isCompleted = reminder.status === 'completed';
  const isSnoozed = reminder.status === 'snoozed';

  const reminderDateObj = new Date(reminder.reminderTime);
  const formattedDateTime = reminderDateObj.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Close snooze dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (snoozeRef.current && !snoozeRef.current.contains(e.target)) {
        setShowSnoozeMenu(false);
      }
    };
    if (showSnoozeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSnoozeMenu]);

  const handleSnoozeOption = async (minutes) => {
    setShowSnoozeMenu(false);
    setActionLoading(true);
    try {
      await onSnooze(reminder._id || reminder.id, { minutes });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setIsConfirmDeleteOpen(false);
    setActionLoading(true);
    try {
      await onDelete(reminder._id || reminder.id);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={`reminder-item-card ${isCompleted ? 'completed' : ''} ${isSnoozed ? 'snoozed' : ''}`}>
      <div className="reminder-item-left">
        <div className={`reminder-event-icon-badge ${isCompleted ? 'completed' : ''}`}>
          <ReminderIcon size={20} color={isCompleted ? '#94a3b8' : '#0284c7'} />
        </div>
      </div>

      <div className="reminder-item-body">
        <div className="reminder-item-header">
          <h4 className="reminder-item-title">{reminder.title}</h4>

          <div className="reminder-badges">
            {isCompleted && (
              <span className="reminder-badge badge-completed">
                Completed
              </span>
            )}
            {isSnoozed && !isCompleted && (
              <span className="reminder-badge badge-snoozed">
                <ClockIcon size={12} style={{ marginRight: 3 }} /> Snoozed ({new Date(reminder.snoozedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
              </span>
            )}
            {reminder.repeat && reminder.repeat !== 'never' && (
              <span className="reminder-badge badge-repeat">
                <RefreshIcon size={12} style={{ marginRight: 3 }} /> {reminder.repeat.charAt(0).toUpperCase() + reminder.repeat.slice(1)}
              </span>
            )}
          </div>
        </div>

        {reminder.description && (
          <p className="reminder-item-desc">{reminder.description}</p>
        )}

        <div className="reminder-item-meta">
          <span className="reminder-meta-time">
            <ClockIcon size={14} className="meta-time-icon" />
            {formattedDateTime}
          </span>
          {reminder.snoozeCount > 0 && (
            <span className="reminder-snooze-count">
              Snoozed {reminder.snoozeCount} time{reminder.snoozeCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="reminder-item-actions">
        {/* Snooze Dropdown */}
        {!isCompleted && (
          <div className="snooze-dropdown-wrapper" ref={snoozeRef}>
            <button
              type="button"
              className="btn-reminder-action btn-snooze"
              onClick={() => setShowSnoozeMenu((prev) => !prev)}
              disabled={actionLoading}
              title="Snooze reminder"
            >
              <ClockIcon size={14} style={{ marginRight: 4 }} /> Snooze
            </button>
            {showSnoozeMenu && (
              <div className="snooze-menu-dropdown">
                <button type="button" onClick={() => handleSnoozeOption(5)}>+5 Minutes</button>
                <button type="button" onClick={() => handleSnoozeOption(15)}>+15 Minutes</button>
                <button type="button" onClick={() => handleSnoozeOption(60)}>+1 Hour</button>
                <button type="button" onClick={() => handleSnoozeOption(1440)}>+1 Day</button>
              </div>
            )}
          </div>
        )}

        {!isCompleted && (
          <button
            type="button"
            className="btn-reminder-action btn-edit"
            onClick={() => onEdit(reminder)}
            disabled={actionLoading}
            title="Edit reminder"
          >
            <EditIcon size={14} style={{ marginRight: 4 }} /> Edit
          </button>
        )}

        <button
          type="button"
          className="btn-reminder-action btn-delete"
          onClick={handleDeleteClick}
          disabled={actionLoading}
          title="Delete reminder"
        >
          <TrashIcon size={14} style={{ marginRight: 4 }} /> Delete
        </button>
      </div>

      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        title="Delete Reminder"
        message={`Are you sure you want to delete the reminder "${reminder.title}"?`}
        confirmText="Delete Reminder"
        cancelText="Cancel"
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setIsConfirmDeleteOpen(false)}
      />
    </div>
  );
}

export default ReminderItem;
