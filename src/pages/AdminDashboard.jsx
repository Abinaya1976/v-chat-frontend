import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';
import AdminStats from '../components/admin/AdminStats';
import UserManagement from '../components/admin/UserManagement';
import ChannelManagement from '../components/admin/ChannelManagement';
import OrganizationSettings from '../components/admin/OrganizationSettings';
import AuditLogViewer from '../components/admin/AuditLogViewer';
import { getWorkspaceStats } from '../services/adminService';
import { ChannelIcon } from '../components/common/Icons';

function AdminDashboard({ onBackToWorkspace }) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'channels' | 'settings' | 'audit-logs'
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isAdmin = ['owner', 'admin', 'super_admin'].includes(user?.role);

  const loadStats = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingStats(true);
    setStatsError(null);
    try {
      const data = await getWorkspaceStats();
      if (data.success) {
        setStats(data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load stats:', err.message);
      setStatsError(err.response?.data?.message || 'Failed to fetch workspace statistics');
    } finally {
      setLoadingStats(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Security UX check: If non-admin attempts to view dashboard
  if (!isAdmin) {
    return (
      <div className="admin-forbidden-stage">
        <div className="admin-forbidden-card">
          <span className="forbidden-icon">🚫</span>
          <h2>Access Denied</h2>
          <p>
            You do not have administrator permissions to access the V Chat Management Console.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={onBackToWorkspace}
          >
            ← Return to Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-workspace-layout admin-workspace-layout">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}


      {/* Admin Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        onBackToWorkspace={onBackToWorkspace}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Admin Content Wrapper */}
      <div className="workspace-main-wrapper admin-main-wrapper">
        <AdminHeader
          activeTab={activeTab}
          user={user}
          onLogout={logout}
          onBackToWorkspace={onBackToWorkspace}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        <main className="admin-dashboard-body">
          {/* Section 1: Overview & Stats */}
          {activeTab === 'overview' && (
            <div className="admin-overview-container">
              {statsError && (
                <div className="admin-alert-box alert-error">
                  <span>⚠️ {statsError}</span>
                  <button type="button" className="btn-dismiss" onClick={loadStats}>Retry</button>
                </div>
              )}

              <AdminStats stats={stats} loading={loadingStats} />

              <div className="admin-quick-actions-card">
                <h3>Workspace Governance Shortcuts</h3>
                <div className="quick-actions-grid">
                  <button
                    type="button"
                    className="btn-quick-nav"
                    onClick={() => setActiveTab('users')}
                  >
                    <span className="quick-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </span>
                    <div className="quick-text">
                      <strong>Manage Members & Roles</strong>
                      <span>Review team members, assign roles, configure permissions</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="btn-quick-nav"
                    onClick={() => setActiveTab('channels')}
                  >
                    <span className="quick-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ChannelIcon size={20} />
                    </span>
                    <div className="quick-text">
                      <strong>Manage Channels</strong>
                      <span>Create, edit, archive, and manage workspace channels</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="btn-quick-nav"
                    onClick={() => setActiveTab('settings')}
                  >
                    <span className="quick-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </span>
                    <div className="quick-text">
                      <strong>Company Settings</strong>
                      <span>Configure public, private, and member channel policies</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="btn-quick-nav"
                    onClick={() => setActiveTab('audit-logs')}
                  >
                    <span className="quick-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M12 7v5l4 2" />
                      </svg>
                    </span>
                    <div className="quick-text">
                      <strong>Activity Log</strong>
                      <span>Audit administrative actions, setting changes, and user updates</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Users Management */}
          {activeTab === 'users' && <UserManagement currentAdminId={user?.id || user?._id} />}

          {/* Section 3: Channels Management */}
          {activeTab === 'channels' && <ChannelManagement />}

          {/* Section 4: Organization Settings */}
          {activeTab === 'settings' && <OrganizationSettings />}

          {/* Section 5: Activity Log */}
          {activeTab === 'audit-logs' && <AuditLogViewer />}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
