import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../common/Avatar';
import ProfileModal from '../common/ProfileModal';
import SettingsModal from '../common/SettingsModal';
import CompanyModal from '../organization/CompanyModal';
import {
  ChatIcon,
  ChannelIcon,
  TodoIcon,
  ReminderIcon,
  NoteIcon,
  BookmarkIcon,
  ContactsIcon,
  CompanyIcon,
  UserEditIcon,
  LogoutIcon,
  MoreVerticalIcon,
} from '../common/Icons';

// Google Calendar inline SVG icon
const CalendarIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

function Sidebar({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onOpenProfileModal,
  onOpenCompanyModal,
  onOpenSettingsModal,
  calendarConnected,
}) {
  const { user, logout } = useAuth();
  const userName = user?.name || 'Teammate';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  return (
    <aside className={`app-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon-wrapper">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="brand-logo-svg"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div className="brand-text">
          <span className="brand-title">V Chat</span>
          <span className="brand-subtitle">{user?.currentOrganization?.name || 'Team Workspace'}</span>
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

      {/* Authenticated User Profile Area with Three-Dot Menu */}
      <div className="sidebar-user-card" ref={profileMenuRef}>
        <Avatar name={userName} image={user?.avatar} size="medium" />
        <div className="user-card-info">
          <span className="user-card-name">{userName}</span>
          <span className="user-card-status">{user?.title || user?.currentOrganization?.name || 'Workspace Member'}</span>
        </div>
        <button
          type="button"
          className="btn-profile-menu-trigger"
          onClick={() => setIsProfileMenuOpen((prev) => !prev)}
          aria-label="Profile options"
          title="Profile & account options"
        >
          <MoreVerticalIcon size={18} />
        </button>

        {isProfileMenuOpen && (
          <div className="profile-dropdown-menu" role="menu">
            <button
              type="button"
              className="profile-menu-item"
              onClick={() => {
                setIsProfileMenuOpen(false);
                onOpenProfileModal?.();
              }}
            >
              <span className="profile-item-icon">
                <UserEditIcon size={16} />
              </span>
              <span>Edit Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs - Primary Workspace items (Chats, Channels, To-Dos, Contacts) on Desktop; on Mobile, primary items are also in bottom nav and secondary tools appear here */}
      <nav className="sidebar-nav">
        {/* Desktop Primary Nav (Chats, Channels, To-Dos, Saved, Contacts) */}
        <div className="sidebar-nav-desktop-only">
          <div className="nav-section-label">Workspace</div>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'chats' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('chats');
              onCloseMobile?.();
            }}
            aria-label="Chats section"
          >
            <span className="nav-icon">
              <ChatIcon size={18} />
            </span>
            <span className="nav-label">Chats</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('channels');
              onCloseMobile?.();
            }}
            aria-label="Channels section"
          >
            <span className="nav-icon">
              <ChannelIcon size={18} />
            </span>
            <span className="nav-label">Channels</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'todos' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('todos');
              onCloseMobile?.();
            }}
            aria-label="To-Dos section"
          >
            <span className="nav-icon">
              <TodoIcon size={18} />
            </span>
            <span className="nav-label">To-Dos</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'reminders' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('reminders');
              onCloseMobile?.();
            }}
            aria-label="Reminders section"
          >
            <span className="nav-icon">
              <ReminderIcon size={18} />
            </span>
            <span className="nav-label">Reminders</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('notes');
              onCloseMobile?.();
            }}
            aria-label="Private Notes section"
          >
            <span className="nav-icon">
              <NoteIcon size={18} />
            </span>
            <span className="nav-label">Private Notes</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn nav-gcal-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('calendar');
              onCloseMobile?.();
            }}
            aria-label="Google Calendar"
            title="Google Calendar"
          >
            <span className="nav-icon">
              <CalendarIcon size={18} />
            </span>
            <span className="nav-label">Google Calendar</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('saved');
              onCloseMobile?.();
            }}
            aria-label="Saved Messages"
          >
            <span className="nav-icon">
              <BookmarkIcon size={18} />
            </span>
            <span className="nav-label">Saved Messages</span>
          </button>

          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'contacts' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('contacts');
              onCloseMobile?.();
            }}
            aria-label="Team Members section"
          >
            <span className="nav-icon">
              <ContactsIcon size={18} />
            </span>
            <span className="nav-label">Team Members</span>
          </button>

          {['admin', 'owner'].includes(user?.role) && (
            <button
              type="button"
              className={`nav-tab-btn nav-admin-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('admin');
                onCloseMobile?.();
              }}
              aria-label="Admin Dashboard"
            >
              <span className="nav-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="nav-label">Admin Panel</span>
            </button>
          )}
        </div>

        {/* Mobile-Only Drawer Secondary Menu Options */}
        <div className="sidebar-nav-mobile-only">
          <div className="nav-section-label">Account & Workspace</div>

          <button
            type="button"
            className="nav-tab-btn"
            onClick={() => {
              onCloseMobile?.();
              onOpenProfileModal?.();
            }}
          >
            <span className="nav-icon">
              <UserEditIcon size={18} />
            </span>
            <span className="nav-label">Profile Details</span>
          </button>


          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => {
              onSelectTab('saved');
              onCloseMobile?.();
            }}
          >
            <span className="nav-icon">
              <BookmarkIcon size={18} />
            </span>
            <span className="nav-label">Saved Messages</span>
          </button>

          {['admin', 'owner'].includes(user?.role) && (
            <button
              type="button"
              className={`nav-tab-btn nav-admin-btn ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => {
                onSelectTab('admin');
                onCloseMobile?.();
              }}
            >
              <span className="nav-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <span className="nav-label">Admin Console</span>
            </button>
          )}

          <button
            type="button"
            className="nav-tab-btn"
            onClick={() => {
              onCloseMobile?.();
              onOpenSettingsModal?.();
            }}
          >
            <span className="nav-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="nav-label">Settings</span>
          </button>

          <button
            type="button"
            className="nav-tab-btn logout-action"
            onClick={() => {
              onCloseMobile?.();
              logout();
            }}
          >
            <span className="nav-icon">
              <LogoutIcon size={18} />
            </span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </nav>

      {/* Sidebar Footer / Settings & Logout */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="nav-action-btn"
          onClick={() => onOpenSettingsModal?.()}
          aria-label="Open Settings"
        >
          <span className="nav-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </span>
          <span className="nav-label">Settings</span>
        </button>

        <button
          type="button"
          className="nav-action-btn logout-action"
          onClick={logout}
          aria-label="Logout"
        >
          <span className="nav-icon">
            <LogoutIcon size={18} />
          </span>
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
