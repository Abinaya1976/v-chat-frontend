import api from './api';

/**
 * Fetch Reminders with status, search, and limit filters
 * @param {Object} params - { status: 'all'|'pending'|'completed', search, limit }
 */
export const getReminders = async (params = {}) => {
  const response = await api.get('/reminders', { params });
  return response.data;
};

/**
 * Fetch a single Reminder by ID
 * @param {string} reminderId
 */
export const getReminderById = async (reminderId) => {
  const response = await api.get(`/reminders/${reminderId}`);
  return response.data;
};

/**
 * Create a new Reminder
 * @param {Object} payload - { title, description, reminderTime, repeat, conversationId, channelId, sourceMessageId, todoId }
 */
export const createReminder = async (payload) => {
  const response = await api.post('/reminders', payload);
  return response.data;
};

/**
 * Update an existing Reminder
 * @param {string} reminderId
 * @param {Object} payload - { title, description, reminderTime, repeat }
 */
export const updateReminder = async (reminderId, payload) => {
  const response = await api.patch(`/reminders/${reminderId}`, payload);
  return response.data;
};

/**
 * Toggle Reminder complete status (pending <-> completed)
 * @param {string} reminderId
 */
export const toggleReminderComplete = async (reminderId) => {
  const response = await api.patch(`/reminders/${reminderId}/complete`);
  return response.data;
};

/**
 * Snooze a Reminder
 * @param {string} reminderId
 * @param {Object} payload - { minutes, customTime }
 */
export const snoozeReminder = async (reminderId, payload = { minutes: 15 }) => {
  const response = await api.patch(`/reminders/${reminderId}/snooze`, payload);
  return response.data;
};

/**
 * Delete a Reminder (Soft deletion)
 * @param {string} reminderId
 */
export const deleteReminder = async (reminderId) => {
  const response = await api.delete(`/reminders/${reminderId}`);
  return response.data;
};
