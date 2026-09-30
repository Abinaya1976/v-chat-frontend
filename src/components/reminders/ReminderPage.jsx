import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import {
  getReminders,
  createReminder,
  updateReminder,
  toggleReminderComplete,
  snoozeReminder,
  deleteReminder,
} from '../../services/reminderService';
import ReminderFilters from './ReminderFilters';
import ReminderItem from './ReminderItem';
import ReminderModal from './ReminderModal';
import { ReminderIcon, PlusIcon } from '../common/Icons';

function ReminderPage({
  isPlanDisabled = false,
  isExpired = false,
  isSuspended = false,
}) {
  const { socket } = useSocket();

  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  const fetchReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReminders({ status: 'all' });
      if (data.success) {
        setReminders(data.reminders || []);
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
      setError(err.response?.data?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  // Real-Time Socket.IO Synchronization
  useEffect(() => {
    if (!socket) return;

    const handleReminderCreated = ({ reminder }) => {
      if (!reminder) return;
      setReminders((prev) => {
        if (prev.some((r) => (r._id || r.id)?.toString() === (reminder._id || reminder.id)?.toString())) {
          return prev.map((r) => ((r._id || r.id)?.toString() === (reminder._id || reminder.id)?.toString() ? reminder : r));
        }
        return [reminder, ...prev];
      });
    };

    const handleReminderUpdated = ({ reminder }) => {
      if (!reminder) return;
      setReminders((prev) =>
        prev.map((r) => ((r._id || r.id)?.toString() === (reminder._id || reminder.id)?.toString() ? reminder : r))
      );
    };

    const handleReminderDeleted = ({ reminderId }) => {
      if (!reminderId) return;
      setReminders((prev) => prev.filter((r) => (r._id || r.id)?.toString() !== reminderId.toString()));
    };

    const handleReminderDue = ({ reminder }) => {
      if (!reminder) return;
      handleReminderUpdated({ reminder });
    };

    socket.on('reminder:created', handleReminderCreated);
    socket.on('reminder:updated', handleReminderUpdated);
    socket.on('reminder:deleted', handleReminderDeleted);
    socket.on('reminder:due', handleReminderDue);

    return () => {
      socket.off('reminder:created', handleReminderCreated);
      socket.off('reminder:updated', handleReminderUpdated);
      socket.off('reminder:deleted', handleReminderDeleted);
      socket.off('reminder:due', handleReminderDue);
    };
  }, [socket]);

  // Count Statistics
  const counts = reminders.reduce(
    (acc, rem) => {
      acc.all += 1;
      if (rem.status === 'completed') {
        acc.completed += 1;
      } else {
        acc.pending += 1;
      }
      return acc;
    },
    { all: 0, pending: 0, completed: 0 }
  );

  // Filter & Search Logic
  const filteredReminders = reminders.filter((rem) => {
    const isCompleted = rem.status === 'completed';

    if (activeFilter === 'pending' && isCompleted) return false;
    if (activeFilter === 'completed' && !isCompleted) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = rem.title?.toLowerCase().includes(q);
      const matchDesc = rem.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    return true;
  });

  // Modal Handlers
  const handleOpenCreateModal = () => {
    setEditingReminder(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (reminder) => {
    setEditingReminder(reminder);
    setIsModalOpen(true);
  };

  const handleSubmitModal = async (payload) => {
    if (editingReminder) {
      const data = await updateReminder(editingReminder._id || editingReminder.id, payload);
      if (data.success && data.reminder) {
        const updatedId = (data.reminder._id || data.reminder.id)?.toString();
        setReminders((prev) =>
          prev.map((r) => ((r._id || r.id)?.toString() === updatedId ? data.reminder : r))
        );
      }
    } else {
      const data = await createReminder(payload);
      if (data.success && data.reminder) {
        const newId = (data.reminder._id || data.reminder.id)?.toString();
        setReminders((prev) => {
          if (prev.some((r) => (r._id || r.id)?.toString() === newId)) {
            return prev.map((r) => ((r._id || r.id)?.toString() === newId ? data.reminder : r));
          }
          return [data.reminder, ...prev];
        });
      }
    }
  };

  const handleSnooze = async (reminderId, payload) => {
    const data = await snoozeReminder(reminderId, payload);
    if (data.success && data.reminder) {
      setReminders((prev) =>
        prev.map((r) => ((r._id || r.id)?.toString() === (data.reminder._id || data.reminder.id)?.toString() ? data.reminder : r))
      );
    }
  };

  const handleDelete = async (reminderId) => {
    const data = await deleteReminder(reminderId);
    if (data.success) {
      setReminders((prev) => prev.filter((r) => (r._id || r.id)?.toString() !== reminderId.toString()));
    }
  };

  return (
    <div className="reminders-page-container">
      {/* Header Section */}
      <div className="reminders-page-header">
        <div className="reminders-header-left">
          <div className="reminders-header-icon-badge">
            <ReminderIcon size={22} color="#0284c7" />
          </div>
          <div className="reminders-header-text">
            <h2 className="reminders-page-title">Reminders</h2>
            <p className="reminders-page-subtitle">
              Schedule, track, snooze, and receive real-time notifications for important tasks.
            </p>
          </div>
        </div>
      </div>

      {isPlanDisabled && (
        <div className="plan-disabled-banner">
          ⚠️ {isExpired ? 'Subscription plan expired. Read-only mode.' : 'Subscription suspended. Read-only mode.'}
        </div>
      )}

      {error && <div className="reminder-error-banner">⚠️ {error}</div>}

      {/* Filter & Action Toolbar */}
      <ReminderFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenCreateModal={handleOpenCreateModal}
        isPlanDisabled={isPlanDisabled}
        counts={counts}
      />

      {/* Main Reminders Content */}
      <div className="reminders-content-stage">
        {loading ? (
          <div className="reminders-loading-state">
            <div className="spinner" />
            <p>Loading reminders...</p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="reminders-empty-state">
            <div className="empty-state-icon-circle">
              <ReminderIcon size={32} color="#0284c7" />
            </div>
            <h3>
              {searchQuery
                ? 'No matching reminders found'
                : activeFilter === 'completed'
                ? 'No completed reminders yet'
                : activeFilter === 'pending'
                ? 'No upcoming reminders scheduled'
                : 'No reminders set yet'}
            </h3>
            <p>
              {searchQuery
                ? 'Try adjusting your search query or filter options.'
                : 'Set reminders for your important meetings, follow-ups, and deadlines.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                className="btn-primary-create-reminder"
                onClick={handleOpenCreateModal}
                disabled={isPlanDisabled}
                style={{ marginTop: 8 }}
              >
                <PlusIcon size={16} style={{ marginRight: 6 }} />
                Set First Reminder
              </button>
            )}
          </div>
        ) : (
          <div className="reminders-list-grid">
            {filteredReminders.map((reminder) => (
              <ReminderItem
                key={reminder._id || reminder.id}
                reminder={reminder}
                onSnooze={handleSnooze}
                onEdit={handleOpenEditModal}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Reminder Modal */}
      <ReminderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitModal}
        initialData={editingReminder}
      />
    </div>
  );
}

export default ReminderPage;
