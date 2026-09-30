import api from './api';

// Fetch paginated notifications for the authenticated user
export const getNotifications = async (page = 1, limit = 20) => {
  const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
  return response.data;
};

// Fetch total unread notification count
export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data;
};

// Mark a single notification as read
export const markNotificationRead = async (notificationId) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllNotificationsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data;
};
