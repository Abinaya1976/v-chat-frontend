import Avatar from '../common/Avatar';
import { AdminIcon, ChatIcon } from '../common/Icons';

function AdminHeader({ activeTab, user, onLogout, onBackToWorkspace, onToggleMobileSidebar }) {
  const getSectionTitle = () => {
    switch (activeTab) {
      case 'overview':
        return 'Overview';
      case 'users':
        return 'Members & Roles';
      case 'channels':
        return 'Channels';
      case 'settings':
        return 'Settings';
      case 'audit-logs':
        return 'Activity Log';
      default:
        return 'Admin Dashboard';
    }
  };

  return (
    <header className="app-header admin-header">
      <div className="header-left">
        <button
          type="button"
          className="btn-hamburger"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h2 className="header-section-title">{getSectionTitle()}</h2>
        <span className="admin-status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <AdminIcon size={14} color="var(--primary-accent)" /> Admin
        </span>
      </div>

      <div className="header-right">
        <button
          type="button"
          className="btn-action-small btn-secondary btn-switch-workspace"
          onClick={onBackToWorkspace}
          title="Return to V Chat workspace"
        >
          <ChatIcon size={14} style={{ marginRight: 6 }} /> Switch to Chat
        </button>

        <div className="header-user-pill" title="Profile" aria-label="Profile">
          <Avatar name={user?.name || 'Admin'} size="small" />
        </div>

        <button
          type="button"
          className="btn-action-small btn-danger btn-admin-logout"
          onClick={onLogout}
          title="Logout of V Chat"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
