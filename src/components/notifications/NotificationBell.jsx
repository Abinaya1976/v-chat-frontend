import { useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

function NotificationBell({ onSelectNotification }) {
  const {
    notifications,
    unreadCount,
    loading,
    isDropdownOpen,
    setIsDropdownOpen,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const bellContainerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        bellContainerRef.current &&
        !bellContainerRef.current.contains(e.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('click', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [isDropdownOpen, setIsDropdownOpen]);

  return (
    <div className="notification-bell-container" ref={bellContainerRef}>
      <button
        type="button"
        className={`btn-icon-header ${isDropdownOpen ? 'active' : ''}`}
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        title="Notifications"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="notif-badge-pill">{unreadCount}</span>
        )}
      </button>

      {isDropdownOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          loading={loading}
          onClose={() => setIsDropdownOpen(false)}
          onMarkAsRead={markAsRead}
          onMarkAllAsRead={markAllAsRead}
          onSelectNotification={onSelectNotification}
        />
      )}
    </div>
  );
}

export default NotificationBell;
