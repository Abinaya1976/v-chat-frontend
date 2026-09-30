import { useState } from 'react';
import { ReminderIcon, CheckIcon, ClockIcon, CloseIcon } from '../common/Icons';

function DueReminderModal({
  isOpen,
  reminder,
  onClose,
  onComplete,
  onSnooze,
}) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !reminder) return null;

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(reminder._id || reminder.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleSnooze = async (minutes) => {
    setLoading(true);
    try {
      await onSnooze(reminder._id || reminder.id, { minutes });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="due-reminder-overlay" aria-modal="true" role="dialog">
      <div className="due-reminder-card">
        <div className="due-reminder-banner">
          <div className="due-reminder-icon-circle">
            <ReminderIcon size={28} color="#ffffff" />
          </div>
          <h3>Reminder Due</h3>
          <button
            type="button"
            className="btn-due-close"
            onClick={onClose}
            aria-label="Dismiss reminder"
          >
            <CloseIcon size={16} color="#ffffff" />
          </button>
        </div>

        <div className="due-reminder-body">
          <h4 className="due-reminder-title">{reminder.title}</h4>
          {reminder.description && (
            <p className="due-reminder-desc">{reminder.description}</p>
          )}

          <div className="due-reminder-time-tag">
            <ClockIcon size={14} style={{ marginRight: 4 }} />
            Scheduled for {new Date(reminder.reminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="due-reminder-footer">
          <div className="snooze-quick-chips">
            <span className="snooze-chip-label">Snooze:</span>
            <button
              type="button"
              className="btn-snooze-pill"
              onClick={() => handleSnooze(5)}
              disabled={loading}
            >
              +5m
            </button>
            <button
              type="button"
              className="btn-snooze-pill"
              onClick={() => handleSnooze(15)}
              disabled={loading}
            >
              +15m
            </button>
            <button
              type="button"
              className="btn-snooze-pill"
              onClick={() => handleSnooze(60)}
              disabled={loading}
            >
              +1h
            </button>
          </div>

          <div className="due-reminder-actions-row">
            <button
              type="button"
              className="btn-due-complete"
              onClick={handleComplete}
              disabled={loading}
            >
              <CheckIcon size={16} style={{ marginRight: 6 }} />
              Mark Complete
            </button>
            <button
              type="button"
              className="btn-due-snooze"
              onClick={() => handleSnooze(15)}
              disabled={loading}
            >
              Snooze 15m
            </button>
          </div>

          <button
            type="button"
            className="btn-due-dismiss"
            onClick={onClose}
            disabled={loading}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

export default DueReminderModal;
