import { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';

function SettingsModal({ isOpen, onClose }) {
  const { settings, saving, updateSettingsSection } = useSettings();
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('notifications');

  if (!isOpen) return null;

  const notifications = settings?.notifications || { messages: true, mentions: true, sound: true };
  const appearance = settings?.appearance || { theme: 'light' };
  const privacy = settings?.privacy || { onlineStatus: true, lastSeen: true, readReceipts: true };
  const chat = settings?.chat || { enterToSend: true };

  const handleToggleNotification = (key) => {
    updateSettingsSection('notifications', {
      [key]: !notifications[key],
    });
  };

  const handleChangeTheme = (newTheme) => {
    updateSettingsSection('appearance', {
      theme: newTheme,
    });
  };

  const handleTogglePrivacy = (key) => {
    updateSettingsSection('privacy', {
      [key]: !privacy[key],
    });
  };

  const handleToggleChat = (key) => {
    updateSettingsSection('chat', {
      [key]: !chat[key],
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-content-card settings-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="settings-header-info">
            <div className="modal-title-row">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="settings-header-icon">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <h2 className="modal-title">Settings</h2>
            </div>
            <p className="modal-subtitle">Manage notifications, appearance, privacy, and chat preferences</p>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close Settings"
          >
            ✕
          </button>
        </div>

        {/* Settings Body Layout with Left Nav & Right Content */}
        <div className="settings-modal-body">
          {/* Left Navigation Subtabs */}
          <div className="settings-sidebar-nav">
            <button
              type="button"
              className={`settings-nav-item ${activeSubTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('notifications')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span>Notifications</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeSubTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('appearance')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              <span>Appearance</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeSubTab === 'privacy' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('privacy')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Privacy</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeSubTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('chat')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Chat</span>
            </button>

            <button
              type="button"
              className={`settings-nav-item ${activeSubTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('about')}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <span>About</span>
            </button>
          </div>

          {/* Right Section Content */}
          <div className="settings-tab-content">
            {/* 1. Notifications Section */}
            {activeSubTab === 'notifications' && (
              <div className="settings-section-pane">
                <h3 className="settings-section-title">Notification Preferences</h3>
                <p className="settings-section-desc">Choose how and when you want to receive alerts.</p>

                <div className="settings-toggle-list">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Message Notifications</span>
                      <span className="settings-toggle-caption">Receive notifications for new direct messages and channel activity</span>
                    </div>
                    <label className="switch-toggle" aria-label="Message Notifications">
                      <input
                        type="checkbox"
                        checked={notifications.messages !== false}
                        onChange={() => handleToggleNotification('messages')}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Mention Notifications</span>
                      <span className="settings-toggle-caption">Get notified when someone @mentions you or mentions @all in a channel</span>
                    </div>
                    <label className="switch-toggle" aria-label="Mention Notifications">
                      <input
                        type="checkbox"
                        checked={notifications.mentions !== false}
                        onChange={() => handleToggleNotification('mentions')}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Notification Sound</span>
                      <span className="settings-toggle-caption">Play a subtle audio chime when receiving incoming notifications</span>
                    </div>
                    <label className="switch-toggle" aria-label="Notification Sound">
                      <input
                        type="checkbox"
                        checked={notifications.sound !== false}
                        onChange={() => handleToggleNotification('sound')}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Appearance Section */}
            {activeSubTab === 'appearance' && (
              <div className="settings-section-pane">
                <h3 className="settings-section-title">Appearance & Theme</h3>
                <p className="settings-section-desc">Customize the look and color palette of your workspace.</p>

                <div className="theme-selection-grid">
                  <button
                    type="button"
                    className={`theme-card ${appearance.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleChangeTheme('light')}
                  >
                    <div className="theme-preview-box light-preview">
                      <div className="preview-sidebar" />
                      <div className="preview-content">
                        <div className="preview-bubble" />
                        <div className="preview-bubble right" />
                      </div>
                    </div>
                    <span className="theme-card-label">Light</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-card ${appearance.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleChangeTheme('dark')}
                  >
                    <div className="theme-preview-box dark-preview">
                      <div className="preview-sidebar" />
                      <div className="preview-content">
                        <div className="preview-bubble" />
                        <div className="preview-bubble right" />
                      </div>
                    </div>
                    <span className="theme-card-label">Dark</span>
                  </button>

                  <button
                    type="button"
                    className={`theme-card ${appearance.theme === 'system' ? 'active' : ''}`}
                    onClick={() => handleChangeTheme('system')}
                  >
                    <div className="theme-preview-box system-preview">
                      <div className="preview-half light" />
                      <div className="preview-half dark" />
                    </div>
                    <span className="theme-card-label">System</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Privacy Section */}
            {activeSubTab === 'privacy' && (
              <div className="settings-section-pane">
                <h3 className="settings-section-title">Privacy Controls</h3>
                <p className="settings-section-desc">Manage your visibility and presence to other teammates.</p>

                <div className="settings-toggle-list">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Online Status</span>
                      <span className="settings-toggle-caption">Allow teammates to see when you are actively online</span>
                    </div>
                    <label className="switch-toggle" aria-label="Online Status">
                      <input
                        type="checkbox"
                        checked={privacy.onlineStatus !== false}
                        onChange={() => handleTogglePrivacy('onlineStatus')}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Last Seen</span>
                      <span className="settings-toggle-caption">Show when you were recently active in the chat</span>
                    </div>
                    <label className="switch-toggle" aria-label="Last Seen">
                      <input
                        type="checkbox"
                        checked={privacy.lastSeen !== false}
                        onChange={() => handleTogglePrivacy('lastSeen')}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Read Receipts</span>
                      <span className="settings-toggle-caption">Send 'Seen' indicators when you read messages in direct conversations</span>
                    </div>
                    <label className="switch-toggle" aria-label="Read Receipts">
                      <input
                        type="checkbox"
                        checked={privacy.readReceipts !== false}
                        onChange={() => handleTogglePrivacy('readReceipts')}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Chat Section */}
            {activeSubTab === 'chat' && (
              <div className="settings-section-pane">
                <h3 className="settings-section-title">Chat & Messaging</h3>
                <p className="settings-section-desc">Customize keyboard shortcuts and messaging behavior.</p>

                <div className="settings-toggle-list">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <span className="settings-toggle-label">Enter to Send</span>
                      <span className="settings-toggle-caption">Press Enter to quickly send your message (Shift + Enter for new line)</span>
                    </div>
                    <label className="switch-toggle" aria-label="Enter to Send">
                      <input
                        type="checkbox"
                        checked={chat.enterToSend !== false}
                        onChange={() => handleToggleChat('enterToSend')}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 5. About Section */}
            {activeSubTab === 'about' && (
              <div className="settings-section-pane about-pane">
                <div className="about-brand-card">
                  <div className="about-brand-icon">
                    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <h3 className="about-app-name">V Chat</h3>
                  <span className="about-version-badge">v1.0.0 (Production Release)</span>
                  <p className="about-desc">
                    A modern, high-performance team messaging and collaboration platform designed for seamless workplace communication.
                  </p>
                </div>

                <div className="about-meta-grid">
                  <div className="about-meta-item">
                    <span className="about-meta-label">Workspace Account</span>
                    <span className="about-meta-value">{user?.email || 'Authenticated User'}</span>
                  </div>
                  <div className="about-meta-item">
                    <span className="about-meta-label">Environment</span>
                    <span className="about-meta-value">Production Ready</span>
                  </div>
                  <div className="about-meta-item">
                    <span className="about-meta-label">Realtime Engine</span>
                    <span className="about-meta-value">Socket.IO & MongoDB</span>
                  </div>
                  <div className="about-meta-item">
                    <span className="about-meta-label">Status</span>
                    <span className="about-meta-value status-active-text">● All Systems Operational</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer settings-modal-footer">
          {saving && <span className="saving-text">Saving...</span>}
          <button
            type="button"
            className="btn-primary-action btn-settings-done"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
