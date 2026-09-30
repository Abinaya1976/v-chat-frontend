import React from 'react';
import {
  ChatIcon, ChannelIcon, TodoIcon, ContactsIcon,
  ReminderIcon, NoteIcon, CalendarIcon, BookmarkIcon, AdminIcon
} from '../common/Icons';

/**
 * MobileBottomNav
 * Fixed bottom navigation bar visible ONLY on mobile screens (<= 768px).
 * Provides 1-tap horizontal scrolling access to all application features.
 */
function MobileBottomNav({ activeTab, onSelectTab, isAdmin }) {
  const navItems = [
    { id: 'chats', label: 'Chats', icon: ChatIcon, ariaLabel: 'Chats navigation tab' },
    { id: 'channels', label: 'Channels', icon: ChannelIcon, ariaLabel: 'Channels navigation tab' },
    { id: 'todos', label: 'To-Dos', icon: TodoIcon, ariaLabel: 'To-Dos navigation tab' },
    { id: 'reminders', label: 'Reminders', icon: ReminderIcon, ariaLabel: 'Reminders navigation tab' },
    { id: 'notes', label: 'Notes', icon: NoteIcon, ariaLabel: 'Notes navigation tab' },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon, ariaLabel: 'Calendar navigation tab' },
    { id: 'saved', label: 'Saved', icon: BookmarkIcon, ariaLabel: 'Saved Messages navigation tab' },
    { id: 'contacts', label: 'People', icon: ContactsIcon, ariaLabel: 'Team Members navigation tab' },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin', icon: AdminIcon, ariaLabel: 'Admin navigation tab' });
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab(item.id)}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="mobile-nav-icon-wrap">
              <IconComponent size={20} />
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
