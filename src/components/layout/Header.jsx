import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../notifications/NotificationBell';

function Header({
  activeTab,
  selectedTitle,
  onSelectNotification,
  onOpenProfileModal,
  onOpenSidebar,
}) {
  const { user } = useAuth();
  const userName = user?.name || 'Teammate';

  // Section title mapping
  const getSectionTitle = () => {
    if (selectedTitle) return selectedTitle;
    switch (activeTab) {
      case 'chats':
        return null;
      case 'channels':
        return 'Channels';
      case 'todos':
        return 'To-Dos';
      case 'saved':
        return 'Saved Messages';
      case 'reminders':
        return 'Reminders';
      case 'notes':
        return 'Private Notes';
      case 'contacts':
        return 'Team Members';
      default:
        return 'Workspace';
    }
  };

  const title = getSectionTitle();

  return (
    <header className="app-header">
      <div className="header-left">
        {onOpenSidebar && (
          <button type="button" className="btn-hamburger" onClick={onOpenSidebar} aria-label="Open Sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        )}
        {title && <h2 className="header-section-title">{title}</h2>}
      </div>

      <div className="header-right">
        {/* Real-Time Notification Bell & Dropdown (rendered in global header on all pages except 'chats') */}
        {activeTab !== 'chats' && (
          <NotificationBell onSelectNotification={onSelectNotification} />
        )}
      </div>
    </header>
  );
}

export default Header;
