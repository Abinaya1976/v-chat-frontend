import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { CallProvider } from './context/CallContext';
import { LiveKitProvider } from './context/LiveKitContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';
import AppLayout from './components/layout/AppLayout';
import LiveKitCallOverlay from './components/calling/LiveKitCallOverlay';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateCompanyPage from './pages/CreateCompanyPage';
import AcceptInvitationPage from './pages/AcceptInvitationPage';
import { getMyInvitations, acceptInvitation, declineInvitation } from './services/invitationService';
import { CompanyIcon, MailIcon, CheckIcon, CloseIcon, RefreshIcon } from './components/common/Icons';
import './App.css';

/**
 * NoOrgHub
 * Rendered when an authenticated user does not belong to any organization yet.
 * Displays pending invitations (if any) with one-click Accept/Decline, plus Create Company.
 */
function NoOrgHub({ user, view, setView }) {
  const [invitations, setInvitations] = useState([]);
  const [loadingInvs, setLoadingInvs] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { socket } = useSocket() || {};

  const loadInvs = useCallback(async () => {
    setLoadingInvs(true);
    try {
      const res = await getMyInvitations();
      if (res.success) {
        setInvitations(res.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load user invitations:', err.message);
    } finally {
      setLoadingInvs(false);
    }
  }, []);

  useEffect(() => {
    loadInvs();
  }, [loadInvs]);

  useEffect(() => {
    if (!socket) return;
    const handleInvChange = () => loadInvs();
    socket.on('invitation:received', handleInvChange);
    socket.on('invitation:revoked', handleInvChange);
    return () => {
      socket.off('invitation:received', handleInvChange);
      socket.off('invitation:revoked', handleInvChange);
    };
  }, [socket, loadInvs]);

  const handleAccept = async (invId) => {
    setActionLoading(invId);
    setError(null);
    try {
      const res = await acceptInvitation(invId);
      if (res.success) {
        setSuccess('Invitation accepted! Loading your workspace...');
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
      setActionLoading(null);
    }
  };

  const handleDecline = async (invId) => {
    setActionLoading(invId);
    setError(null);
    try {
      await declineInvitation(invId);
      setInvitations((prev) => prev.filter((i) => i._id !== invId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline invitation');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="main-card main-card-landing">
        <div className="landing-hub">
          <div className="landing-brand">
            <h1 className="landing-title">Workplace Communication</h1>
            <p className="landing-subtitle">
              Welcome, {user.name}! You are not a member of any company yet.
            </p>
          </div>

          {error && (
            <div className="company-alert alert-error mb-3" style={{ width: '100%' }}>
              <span>⚠️ {error}</span>
            </div>
          )}
          {success && (
            <div className="company-alert alert-success mb-3" style={{ width: '100%' }}>
              <CheckIcon size={16} color="#059669" />
              <span>{success}</span>
            </div>
          )}

          {view === 'create-company' ? (
            <CreateCompanyPage onBack={() => setView('landing')} onSuccess={() => window.location.reload()} />
          ) : (
            <div className="landing-actions" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {/* Pending Invitations Section */}
              {invitations.length > 0 && (
                <div
                  className="pending-invitations-box"
                  style={{
                    width: '100%',
                    background: 'var(--card-bg, #ffffff)',
                    border: '1.5px solid var(--primary-accent, #0ea5e9)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <MailIcon size={18} color="var(--primary-accent)" />
                    <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                      Pending Invitations ({invitations.length})
                    </strong>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {invitations.map((inv) => (
                      <div
                        key={inv._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          background: 'rgba(2, 132, 199, 0.05)',
                          borderRadius: '8px',
                          border: '1px solid rgba(2, 132, 199, 0.15)',
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-main)' }}>
                            {inv.organization?.name || 'Workspace'}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            Invited by {inv.invitedBy?.name || 'Admin'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-action-small btn-secondary"
                            onClick={() => handleDecline(inv._id)}
                            disabled={actionLoading === inv._id}
                          >
                            Decline
                          </button>
                          <button
                            type="button"
                            className="btn-action-small btn-primary"
                            onClick={() => handleAccept(inv._id)}
                            disabled={actionLoading === inv._id}
                          >
                            {actionLoading === inv._id ? 'Joining...' : 'Accept & Join →'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Company Option */}
              <button
                className="landing-btn landing-btn-primary"
                onClick={() => setView('create-company')}
                style={{ width: '100%' }}
              >
                <span className="landing-btn-icon">🏢</span>
                <span className="landing-btn-text">
                  <strong>Create a Company</strong>
                  <small>Start a new workspace as Admin</small>
                </span>
              </button>

              {invitations.length === 0 && !loadingInvs && (
                <div className="landing-info-note">
                  <span>To join an existing company, ask your admin to send you an invitation.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * PendingApprovalScreen
 * Rendered when an authenticated user's organization is in PENDING status awaiting Super Admin approval.
 * Strictly blocks access to workspace chat, channels, and company admin features until activated.
 */
function PendingApprovalScreen({ user, organization }) {
  const { logout, verifyProtectedMe, updateUser } = useAuth();
  const { socket } = useSocket() || {};
  const [checking, setChecking] = useState(false);
  const [approvedNotice, setApprovedNotice] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const orgName = organization?.name || 'Your Company';
  const planName = (organization?.subscription?.plan || 'free').toUpperCase();
  const requestDate = organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : 'Recent';

  // Listen for live activation event from Super Admin
  useEffect(() => {
    if (!socket) return;
    const handleStatusChanged = (payload) => {
      if (payload?.status === 'active') {
        setApprovedNotice(true);
        setStatusFeedback({
          type: 'success',
          message: 'Your organization has been approved! Redirecting to workspace...',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else if (payload?.status === 'rejected') {
        window.location.reload();
      }
    };
    socket.on('org:statusChanged', handleStatusChanged);
    return () => {
      socket.off('org:statusChanged', handleStatusChanged);
    };
  }, [socket]);

  const handleCheckStatus = async () => {
    if (checking) return;
    setChecking(true);
    setStatusFeedback(null);

    try {
      const res = await verifyProtectedMe();
      if (res.success && res.data?.user) {
        const updatedUser = res.data.user;
        updateUser(updatedUser);
        const updatedOrg = updatedUser.currentOrganization;
        const currentStatus = (
          updatedOrg?.status ||
          updatedOrg?.subscription?.status ||
          updatedUser.organizationStatus ||
          'pending'
        ).toLowerCase();

        if (currentStatus === 'active') {
          setApprovedNotice(true);
          setStatusFeedback({
            type: 'success',
            message: 'Your organization has been approved! Loading workspace...',
          });
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else if (currentStatus === 'rejected') {
          window.location.reload();
        } else {
          // Organization remains pending
          setStatusFeedback({
            type: 'info',
            message: 'Your approval request is currently under verification. Please wait for the Super Admin to review it.',
          });
        }
      } else {
        setStatusFeedback({
          type: 'error',
          message: res.error || 'Unable to check status. Please try again.',
        });
      }
    } catch (err) {
      console.error('Status check error:', err);
      setStatusFeedback({
        type: 'error',
        message: 'Unable to check status. Please try again later.',
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="main-card pending-approval-card">
        {/* Status Header */}
        <div className="pending-status-icon-wrap">
          <div className={`pending-status-icon-box ${approvedNotice ? 'approved' : 'pending'}`}>
            {approvedNotice ? (
              <CheckIcon size={30} color="#16a34a" />
            ) : (
              <span className="pending-icon-emoji">⏳</span>
            )}
          </div>
          <span className="pending-status-tag">
            {approvedNotice ? 'APPROVED' : 'UNDER VERIFICATION'}
          </span>
        </div>

        <h1 className="pending-title">
          {approvedNotice ? 'Organization Approved!' : 'Awaiting Super Admin Approval'}
        </h1>
        <p className="pending-subtitle">
          {approvedNotice
            ? 'Your workspace has been activated. Redirecting...'
            : `Your request for "${orgName}" is currently pending review by the platform administrator.`}
        </p>

        {/* 3-Step Visual Progress Stepper */}
        <div className="pending-stepper">
          <div className="pending-step step-done">
            <div className="step-dot">✓</div>
            <span className="step-label">Submitted</span>
          </div>
          <div className={`step-line ${approvedNotice ? 'step-line-active' : 'step-line-active'}`}></div>
          <div className={`pending-step ${approvedNotice ? 'step-done' : 'step-active'}`}>
            <div className="step-dot">{approvedNotice ? '✓' : '2'}</div>
            <span className="step-label">{approvedNotice ? 'Approved' : 'In Review'}</span>
          </div>
          <div className={`step-line ${approvedNotice ? 'step-line-active' : ''}`}></div>
          <div className={`pending-step ${approvedNotice ? 'step-active' : 'step-upcoming'}`}>
            <div className="step-dot">3</div>
            <span className="step-label">Workspace</span>
          </div>
        </div>

        {/* Status Feedback Notification Box */}
        {statusFeedback && (
          <div className={`pending-feedback-box feedback-${statusFeedback.type}`}>
            <span className="pending-feedback-icon">
              {statusFeedback.type === 'success' ? '✅' : statusFeedback.type === 'error' ? '⚠️' : 'ℹ️'}
            </span>
            <span>{statusFeedback.message}</span>
          </div>
        )}

        {/* Symmetrical Details Card */}
        <div className="pending-details-card" style={{ width: '100%' }}>
          <div className="pending-detail-row">
            <span className="pending-detail-label">Company Name</span>
            <span className="pending-detail-value font-semibold">{orgName}</span>
          </div>

          <div className="pending-detail-row">
            <span className="pending-detail-label">Requested Plan</span>
            <span className="pending-detail-value">
              <span className="pending-plan-badge">{planName}</span>
            </span>
          </div>

          <div className="pending-detail-row">
            <span className="pending-detail-label">Current Status</span>
            <span className="pending-detail-value">
              <span className="pending-status-pill">PENDING APPROVAL</span>
            </span>
          </div>

          <div className="pending-detail-row">
            <span className="pending-detail-label">Submitted By</span>
            <span className="pending-detail-value" title={`${user?.name} (${user?.email})`}>
              {user?.name} <span className="pending-user-email">({user?.email})</span>
            </span>
          </div>

          <div className="pending-detail-row">
            <span className="pending-detail-label">Submission Date</span>
            <span className="pending-detail-value">{requestDate}</span>
          </div>
        </div>

        <p className="pending-info-text" style={{ marginBottom: '24px' }}>
          Once the Super Admin approves your company with an assigned subscription and valid start/end dates,
          you will automatically become the Company Admin and gain full access to your workspace.
        </p>

        <div className="pending-actions-row">
          <button
            type="button"
            className="btn-check-status"
            onClick={handleCheckStatus}
            disabled={checking}
          >
            <RefreshIcon size={16} className={checking ? 'spin-animation' : ''} />
            <span>{checking ? 'Checking status…' : 'Check Status'}</span>
          </button>
          <button
            type="button"
            className="btn-signout"
            onClick={logout}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * RejectedScreen
 * Rendered when an organization registration was rejected by the Super Admin.
 */
function RejectedScreen({ user, organization, onSwitchView }) {
  const { logout } = useAuth();
  const orgName = organization?.name || 'Your Company';
  const reason = organization?.rejectionReason || 'The platform administrator declined this registration request.';

  return (
    <div className="auth-wrapper">
      <div className="main-card main-card-landing" style={{ maxWidth: '500px', padding: '32px 28px' }}>
        <div className="landing-hub" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid #ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <CloseIcon size={28} color="#ef4444" />
          </div>

          <h1 className="landing-title" style={{ fontSize: '20px', color: '#ef4444', marginBottom: '6px' }}>
            Registration Request Declined
          </h1>
          <p className="landing-subtitle" style={{ fontSize: '14px', marginBottom: '20px' }}>
            Your registration request for "{orgName}" was not approved by the Super Admin.
          </p>

          <div
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '10px',
              padding: '14px',
              textAlign: 'left',
              marginBottom: '24px',
            }}
          >
            <strong style={{ fontSize: '13px', color: '#b91c1c', display: 'block', marginBottom: '4px' }}>
              Reason for rejection:
            </strong>
            <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0 }}>{reason}</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSwitchView}
            >
              Create New Company
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={logout}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * MainApp
 * Root view controller handling unauthenticated hub, super admin redirect,
 * no-org employee onboarding, pending approval state, and full AppLayout.
 */
function MainApp() {
  const { user, loading } = useAuth();
  const [inviteToken, setInviteToken] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('token') || params.get('inviteToken') || null;
    } catch {
      return null;
    }
  });
  const [inviteEmail, setInviteEmail] = useState('');
  const [view, setView] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('token') || params.get('inviteToken')) {
        return 'accept-invitation';
      }
    } catch {}
    return 'landing';
  });

  const clearInviteToken = () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('inviteToken');
      window.history.replaceState({}, document.title, url.pathname + url.search);
    } catch {}
    setInviteToken(null);
  };

  // Loading spinner
  if (loading) {
    return (
      <div className="auth-wrapper">
        <div className="main-card">
          <h2 className="auth-title">Connecting to V-Chat...</h2>
          <p className="auth-subtitle">Restoring your workspace session</p>
        </div>
      </div>
    );
  }

  // ── Invitation Acceptance flow if token is in URL ─────────────────────────
  if (inviteToken && view === 'accept-invitation') {
    return (
      <AcceptInvitationPage
        token={inviteToken}
        onNavigateRegister={({ email, token }) => {
          setInviteEmail(email);
          if (token) setInviteToken(token);
          setView('register');
        }}
        onNavigateLogin={({ email, token }) => {
          setInviteEmail(email);
          if (token) setInviteToken(token);
          setView('login');
        }}
        onSuccess={() => {
          clearInviteToken();
          window.location.href = '/';
        }}
      />
    );
  }

  // ── Super Admin: bypass entire workspace, go straight to Super Admin Dashboard ──
  if (user && user.role === 'super_admin') {
    return <SuperAdminDashboard />;
  }

  // ── Authenticated regular user ──────────────────────────────────────────────
  if (user) {
    const hasOrg = Boolean(user.currentOrganization || user.currentOrganizationId);

    if (!hasOrg && user.organizationCount === 0) {
      return (
        <SocketProvider>
          <NoOrgHub user={user} view={view} setView={setView} />
        </SocketProvider>
      );
    }

    const org = user.currentOrganization;
    const orgStatus = org?.status || org?.subscription?.status || user.organizationStatus;

    // Organization Pending Super Admin Approval
    if (orgStatus === 'pending') {
      return (
        <SocketProvider>
          <PendingApprovalScreen user={user} organization={org} />
        </SocketProvider>
      );
    }

    // Organization Rejected by Super Admin
    if (orgStatus === 'rejected') {
      if (view === 'create-company') {
        return (
          <div className="auth-wrapper">
            <div className="main-card main-card-landing">
              <CreateCompanyPage onBack={() => setView('landing')} onSuccess={() => window.location.reload()} />
            </div>
          </div>
        );
      }
      return (
        <SocketProvider>
          <RejectedScreen user={user} organization={org} onSwitchView={() => setView('create-company')} />
        </SocketProvider>
      );
    }

    // Active Organization — Render Full Workspace
    return (
      <SocketProvider>
        <CallProvider>
          <LiveKitProvider>
            <NotificationProvider>
              <SettingsProvider>
                <AppLayout />
                <LiveKitCallOverlay />
              </SettingsProvider>
            </NotificationProvider>
          </LiveKitProvider>
        </CallProvider>
      </SocketProvider>
    );
  }

  // ── Unauthenticated views ──────────────────────────────────────────────────
  const renderContent = () => {
    switch (view) {
      case 'accept-invitation':
        return (
          <AcceptInvitationPage
            token={inviteToken}
            onNavigateRegister={({ email, token }) => {
              setInviteEmail(email);
              if (token) setInviteToken(token);
              setView('register');
            }}
            onNavigateLogin={({ email, token }) => {
              setInviteEmail(email);
              if (token) setInviteToken(token);
              setView('login');
            }}
            onSuccess={() => {
              clearInviteToken();
              window.location.href = '/';
            }}
          />
        );

      case 'login':
        return (
          <Login
            initialEmail={inviteEmail}
            invitationToken={inviteToken}
            onSwitchToRegister={() => setView('register')}
            onBack={() => {
              if (inviteToken) {
                setView('accept-invitation');
              } else {
                setView('landing');
              }
            }}
          />
        );

      case 'register':
        return (
          <Register
            initialEmail={inviteEmail}
            invitationToken={inviteToken}
            onSwitchToLogin={() => setView('login')}
            onBack={() => {
              if (inviteToken) {
                setView('accept-invitation');
              } else {
                setView('landing');
              }
            }}
          />
        );

      case 'create-company':
        return (
          <CreateCompanyPage
            onBack={() => setView('landing')}
            onSuccess={() => setView('landing')}
          />
        );

      default:
        return (
          <div className="landing-hub">
            <div className="landing-brand">
              <h1 className="landing-title">Workplace Communication</h1>
              <p className="landing-subtitle">Work communication for teams</p>
            </div>

            <div className="landing-actions">
              <button
                id="landing-create-company"
                className="landing-btn landing-btn-primary"
                onClick={() => setView('create-company')}
              >
                <span className="landing-btn-icon">🏢</span>
                <span className="landing-btn-text">
                  <strong>Create a Company</strong>
                  <small>Start a new workspace for your team</small>
                </span>
              </button>
            </div>

            <div className="landing-divider">
              <span>Already have an account?</span>
            </div>

            <button
              id="landing-sign-in"
              className="landing-signin-btn"
              onClick={() => setView('login')}
            >
              Sign In
            </button>
          </div>
        );
    }
  };

  return (
    <div className="auth-wrapper">
      <div className={`main-card ${view === 'landing' ? 'main-card-landing' : ''}`}>
        {renderContent()}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
