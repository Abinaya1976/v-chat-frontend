import { useState, useEffect, useRef } from 'react';
import Avatar from '../common/Avatar';
import { ReminderIcon } from '../common/Icons';

function NotificationDropdown({
  notifications = [],
  unreadCount = 0,
  loading = false,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onSelectNotification,
}) {
  const latestNotif = notifications.length > 0 ? notifications[0] : null;
  const latestRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Auto-mark visible notifications as read when dropdown opens or expands
  useEffect(() => {
    if (notifications.length === 0) return;
    const visibleNotifs = isExpanded ? notifications : [notifications[0]];
    
    visibleNotifs.forEach(notif => {
      if (!notif) return;
      const notifId = (notif._id || notif.id)?.toString();
      const isUnread = !notif.isRead;
      if (notifId && isUnread && typeof onMarkAsRead === 'function') {
        setTimeout(() => onMarkAsRead(notifId), 300);
      }
    });
  }, [notifications, isExpanded, onMarkAsRead]);

  const handleItemClick = (notification) => {
    const notifId = notification._id || notification.id;
    if (!notification.isRead && typeof onMarkAsRead === 'function') {
      onMarkAsRead(notifId);
    }
    if (typeof onSelectNotification === 'function') {
      onSelectNotification(notification);
    }
    onClose();
  };

  const senderName = latestNotif
    ? latestNotif.sender?.name || (latestNotif.type === 'reminder_due' ? 'Reminder' : 'Teammate')
    : null;
  const isUnread = latestNotif ? !latestNotif.isRead : false;
  const notifId = latestNotif ? (latestNotif._id || latestNotif.id)?.toString() : null;

  return (
    <div className="notification-dropdown-panel" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="notif-dropdown-header">
        <div className="notif-header-title-group">
          <span className="notif-title">Notifications</span>
          {unreadCount > 0 && (
            <span className="notif-count-badge">{unreadCount} new</span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="btn-mark-all-read"
            onClick={onMarkAllAsRead}
            title="Mark all notifications as read"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div 
        className={isExpanded ? "notif-expanded-body" : "notif-single-body"} 
        style={isExpanded ? { maxHeight: '350px', overflowY: 'auto' } : {}}
      >
        {loading && notifications.length === 0 ? (
          <div className="notif-empty-state">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty-state">
            <span className="notif-empty-icon"><ReminderIcon size={32} color="var(--text-muted)" /></span>
            <p>No new notifications</p>
          </div>
        ) : (
          (isExpanded ? notifications : [notifications[0]]).map((notif, index) => {
            const senderName = notif.sender?.name || (notif.type === 'reminder_due' ? 'Reminder' : 'Teammate');
            const isUnread = !notif.isRead;
            const notifId = (notif._id || notif.id)?.toString();

            return (
              <div
                key={notifId || index}
                ref={index === 0 ? latestRef : null}
                data-notif-id={notifId}
                data-unread={isUnread}
                className={`notif-item ${isUnread ? 'unread' : 'read'}`}
                onClick={() => handleItemClick(notif)}
                role="button"
                tabIndex={0}
              >
                <div className="notif-avatar-wrapper">
                  <Avatar
                    name={senderName}
                    image={notif.sender?.avatar}
                    size="small"
                  />
                  {notif.type === 'reminder_due' && (
                    <span className="notif-badge-mention" style={{ background: 'rgba(2, 132, 199, 0.9)' }}>⏰</span>
                  )}
                  {notif.type === 'mention' && (
                    <span className="notif-badge-mention">@</span>
                  )}
                  {notif.type === 'channel_activity' && (
                    <span className="notif-badge-channel">#</span>
                  )}
                  {notif.type === 'invitation_received' && (
                    <span className="notif-badge-mention" style={{ background: 'rgba(2, 132, 199, 0.9)' }}>✉️</span>
                  )}
                  {notif.type === 'invitation_accepted' && (
                    <span className="notif-badge-mention" style={{ background: 'rgba(5, 150, 105, 0.9)' }}>✓</span>
                  )}
                  {notif.type === 'join_request' && (
                    <span className="notif-badge-mention" style={{ background: 'rgba(2, 132, 199, 0.9)' }}>🏢</span>
                  )}
                  {notif.type === 'join_request_approved' && (
                    <span className="notif-badge-mention" style={{ background: 'rgba(5, 150, 105, 0.9)' }}>✓</span>
                  )}
                </div>

                <div className="notif-content-wrapper">
                  <div className="notif-top-row">
                    <span className="notif-sender">{senderName}</span>
                    <span className="notif-time">{formatTime(notif.createdAt)}</span>
                  </div>
                  <p className="notif-text">{notif.content}</p>
                </div>

                {isUnread && <span className="notif-unread-dot" />}
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint if there are more notifications */}
      {notifications.length > 1 && (
        <div 
          className="notif-footer-hint" 
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ cursor: 'pointer' }}
          role="button"
          tabIndex={0}
        >
          {isExpanded ? (
            'Show less'
          ) : (
            `+${notifications.length - 1} more notification${notifications.length - 1 > 1 ? 's' : ''}`
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
