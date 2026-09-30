import { useState, useEffect } from 'react';
import {
  CalendarIcon,
  ClockIcon,
  RefreshIcon,
  CloseIcon,
  ReminderIcon,
} from '../common/Icons';

function ReminderModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  contextData = null,
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [repeat, setRepeat] = useState('never');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (initialData) {
        setTitle(initialData.title || '');
        setDescription(initialData.description || '');
        setRepeat(initialData.repeat || 'never');
        if (initialData.reminderTime) {
          const d = new Date(initialData.reminderTime);
          setReminderDate(d.toISOString().split('T')[0]);
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          setReminderTime(`${hours}:${minutes}`);
        }
      } else {
        // Default new reminder time: 1 hour from now
        const defaultDate = new Date(Date.now() + 60 * 60 * 1000);
        setTitle(contextData?.title || '');
        setDescription(contextData?.description || '');
        setRepeat('never');
        setReminderDate(defaultDate.toISOString().split('T')[0]);
        const hours = String(defaultDate.getHours()).padStart(2, '0');
        const minutes = String(defaultDate.getMinutes()).padStart(2, '0');
        setReminderTime(`${hours}:${minutes}`);
      }
    }
  }, [isOpen, initialData, contextData]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title for the reminder');
      return;
    }

    if (!reminderDate || !reminderTime) {
      setError('Please select both date and time for the reminder');
      return;
    }

    const scheduledDateTime = new Date(`${reminderDate}T${reminderTime}`);
    if (isNaN(scheduledDateTime.getTime())) {
      setError('Invalid date or time selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        reminderTime: scheduledDateTime.toISOString(),
        repeat,
        conversationId: contextData?.conversationId || null,
        channelId: contextData?.channelId || null,
        sourceMessageId: contextData?.sourceMessageId || null,
        todoId: contextData?.todoId || null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save reminder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reminder-modal-overlay" onClick={onClose} aria-modal="true" role="dialog">
      <div className="reminder-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="reminder-modal-header">
          <div className="reminder-modal-title-group">
            <ReminderIcon size={20} className="modal-title-icon" />
            <h2>{initialData ? 'Edit Reminder' : 'Set a Reminder'}</h2>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {error && <div className="reminder-error-banner">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="reminder-modal-body">
            <div className="reminder-form-group">
              <label htmlFor="reminder-title-input">
                Reminder Title <span className="label-required">*</span>
              </label>
              <input
                id="reminder-title-input"
                type="text"
                className="reminder-form-input"
                placeholder="e.g. Follow up on project status, Call client"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                maxLength={200}
                autoFocus
                required
              />
            </div>

            <div className="reminder-form-group">
              <label htmlFor="reminder-desc-input">
                Description <span className="label-optional">(optional)</span>
              </label>
              <textarea
                id="reminder-desc-input"
                className="reminder-form-textarea"
                placeholder="Add additional details or context for this reminder..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                maxLength={2000}
              />
            </div>

            <div className="reminder-form-row">
              <div className="reminder-form-group">
                <label htmlFor="reminder-date-input">
                  <CalendarIcon size={14} style={{ marginRight: 4 }} /> Date <span className="label-required">*</span>
                </label>
                <input
                  id="reminder-date-input"
                  type="date"
                  className="reminder-form-input"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="reminder-form-group">
                <label htmlFor="reminder-time-input">
                  <ClockIcon size={14} style={{ marginRight: 4 }} /> Time <span className="label-required">*</span>
                </label>
                <input
                  id="reminder-time-input"
                  type="time"
                  className="reminder-form-input"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="reminder-form-group">
              <label htmlFor="reminder-repeat-select">
                <RefreshIcon size={14} style={{ marginRight: 4 }} /> Repeat Frequency
              </label>
              <select
                id="reminder-repeat-select"
                className="reminder-form-select"
                value={repeat}
                onChange={(e) => setRepeat(e.target.value)}
                disabled={loading}
              >
                <option value="never">Never (One-time)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>

          <div className="reminder-modal-footer">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-modal-submit"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReminderModal;
