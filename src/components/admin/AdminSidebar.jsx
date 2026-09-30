import {
  OverviewIcon,
  UsersIcon,
  ChannelIcon,
  SettingsIcon,
  HistoryIcon,
  AdminIcon,
  ChatIcon,
} from '../common/Icons';

function AdminSidebar({ activeTab, onSelectTab, onBackToWorkspace, isMobileOpen = false, onCloseMobile = null }) {
  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      ),
    },
    {
      id: 'users',
      label: 'Members & Roles',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'channels',
      label: 'Channels',
      icon: <ChannelIcon size={18} />,
    },
    {
      id: 'settings',
      label: 'Company Settings',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
    },
    {
      id: 'audit-logs',
      label: 'Activity Log',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      ),
    },
  ];

  return (
    <aside className={`app-sidebar admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand admin-brand">
        <div className="brand-icon-wrapper admin-shield-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div className="brand-text" style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          <span className="brand-title" style={{ background: 'none', color: 'var(--text-main)', WebkitTextFillColor: 'var(--text-main)', fontSize: '1.2rem', letterSpacing: '-0.01em' }}>Admin Console</span>
          <span className="brand-subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}>Workspace Governance</span>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            className="btn-close-sidebar-mobile"
            onClick={onCloseMobile}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Admin Navigation Links */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Administration</div>

        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-tab-btn ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer: Return to Workspace Chat */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-action-btn btn-back-chat"
          onClick={onBackToWorkspace}
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <span className="nav-label">Back to V Chat</span>
        </button>
      </div>
    </aside>
  );
}

export default AdminSidebar;
