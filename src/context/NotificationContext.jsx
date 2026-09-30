import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user, token } = useAuth();
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 1. Fetch initial unread count and recent notifications
  const loadNotifications = useCallback(async () => {
    if (!token || !user) return;
    try {
      setLoading(true);
      const data = await getNotifications(1, 30);
      if (data.success) {
        setNotifications(data.notifications || []);
        if (typeof data.unreadCount === 'number') {
          setUnreadCount(Math.max(0, data.unreadCount));
        } else {
          const unread = (data.notifications || []).filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        }
      }
    } catch (err) {
      console.error('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const loadUnreadCount = useCallback(async () => {
    if (!token || !user) return;
    try {
      const data = await getUnreadCount();
      if (data.success && typeof data.unreadCount === 'number') {
        setUnreadCount(Math.max(0, data.unreadCount));
      }
    } catch (err) {
      console.error('Failed to load unread count:', err.message);
    }
  }, [token, user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 2. Real-Time Socket.IO Listeners for Notifications & Multi-tab Synchronization
  useEffect(() => {
    if (!socket) return;

    // A. Real-Time New Notification Received
    const handleNewNotification = ({ notification }) => {
      if (!notification) return;

      setNotifications((prev) => {
        // Prevent duplicate insertion by _id
        const isDuplicate = prev.some(
          (n) => (n._id || n.id)?.toString() === (notification._id || notification.id)?.toString()
        );
        if (isDuplicate) return prev;
        return [notification, ...prev];
      });
    };

    // B. Real-Time Single Notification Read (Multi-tab sync)
    const handleNotificationRead = ({ notificationId }) => {
      if (!notificationId) return;

      setNotifications((prev) => {
        let wasUnread = false;
        const next = prev.map((n) => {
          if ((n._id || n.id)?.toString() === notificationId.toString()) {
            if (!n.isRead) wasUnread = true;
            return { ...n, isRead: true };
          }
          return n;
        });
        if (wasUnread) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return next;
      });
    };

    // C. Real-Time Read All (Multi-tab sync)
    const handleNotificationsReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    };

    // D. Real-Time Direct Unread Count Update (Authoritative from DB)
    const handleUnreadCountUpdate = ({ unreadCount: directCount }) => {
      if (typeof directCount === 'number') {
        setUnreadCount(Math.max(0, directCount));
      }
    };

    // E. Synchronize on WebSocket reconnect
    const handleReconnect = () => {
      loadUnreadCount();
    };

    socket.on('notification:new', handleNewNotification);
    socket.on('notification:read', handleNotificationRead);
    socket.on('notifications:read_all', handleNotificationsReadAll);
    socket.on('notification:unread_count', handleUnreadCountUpdate);
    socket.on('connect', handleReconnect);

    return () => {
      socket.off('notification:new', handleNewNotification);
      socket.off('notification:read', handleNotificationRead);
      socket.off('notifications:read_all', handleNotificationsReadAll);
      socket.off('notification:unread_count', handleUnreadCountUpdate);
      socket.off('connect', handleReconnect);
    };
  }, [socket, loadUnreadCount]);

  // 3. Mark Single Notification as Read
  const markAsRead = async (notificationId) => {
    if (!notificationId) return;

    // Optimistic UI update
    setNotifications((prev) => {
      const target = prev.find((n) => (n._id || n.id)?.toString() === notificationId.toString());
      if (target && !target.isRead) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.map((n) =>
        (n._id || n.id)?.toString() === notificationId.toString()
          ? { ...n, isRead: true }
          : n
      );
    });

    try {
      await markNotificationRead(notificationId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err.message);
      loadUnreadCount();
    }
  };

  // 4. Mark All Notifications as Read
  const markAllAsRead = async () => {
    // Optimistic UI update
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err.message);
      loadUnreadCount();
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isDropdownOpen,
        setIsDropdownOpen,
        fetchNotifications: loadNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
