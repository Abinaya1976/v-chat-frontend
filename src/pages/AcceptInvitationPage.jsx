import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { validateInvitationToken, acceptInvitationByToken } from '../services/invitationService';
import { CompanyIcon, CheckIcon, CloseIcon, MailIcon, RefreshIcon } from '../components/common/Icons';

function AcceptInvitationPage({
  token,
  onNavigateLogin,
  onNavigateRegister,
  onSuccess,
}) {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptSuccess, setAcceptSuccess] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadInvitation() {
      if (!token) {
        setError('No invitation token provided in the link.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await validateInvitationToken(token);
        if (isMounted) {
          if (res.success && res.invitation) {
            setInvitation(res.invitation);
          } else {
            setError(res.message || 'Invalid or expired invitation link.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to validate invitation token:', err);
          setError(
            err.response?.data?.message ||
              'This invitation link is invalid, expired, or has already been accepted.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadInvitation();
    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleAcceptLoggedIn = async () => {
    if (!token || accepting) return;
    setAccepting(true);
    setError(null);
    try {
      const res = await acceptInvitationByToken(token);
      if (res.success) {
        setAcceptSuccess(
          res.message || `You've joined ${invitation?.organization?.name || 'the workspace'} successfully!`
        );
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(res.organization);
          } else {
            window.location.href = '/';
          }
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to accept invitation:', err);
      setError(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
      setAccepting(false);
    }
  };

  const companyName = invitation?.organization?.name || 'Workspace';
  const inviterName = invitation?.invitedBy?.name || 'Administrator';
  const invitedEmail = invitation?.email || '';
  const loggedInEmail = user?.email?.toLowerCase().trim();
  const isEmailMatching = Boolean(
    loggedInEmail && invitedEmail && loggedInEmail === invitedEmail.toLowerCase().trim()
  );

  return (
    <div className="auth-wrapper">
      <div className="main-card" style={{ maxWidth: '520px', padding: '36px 32px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <RefreshIcon size={32} className="spin-animation" color="#0284c7" />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: 'var(--text-main)' }}>
              Validating Invitation Link
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Connecting to V Chat to verify your invitation details...
            </p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CloseIcon size={30} color="#ef4444" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#b91c1c', margin: '0 0 10px 0' }}>
              Unable to Join Workspace
            </h2>
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '14px',
                fontSize: '13px',
                color: '#991b1b',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                Go to Home
              </button>
              {user ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    window.location.href = '/';
                  }}
                >
                  Back to Workspace
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => onNavigateLogin && onNavigateLogin()}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        ) : acceptSuccess ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckIcon size={32} color="#10b981" />
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#047857', margin: '0 0 8px 0' }}>
              Welcome to {companyName}!
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
              {acceptSuccess} Redirecting to your workspace...
            </p>
          </div>
        ) : (
          <div>
            {/* Header Badge & Title */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284c7',
                  border: '1px solid rgba(2, 132, 199, 0.2)',
                  borderRadius: '9999px',
                  padding: '5px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  marginBottom: '14px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <CompanyIcon size={14} color="#0284c7" />
                <span>Workspace Invitation</span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 6px 0' }}>
                Join {companyName}
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>
                <strong>{inviterName}</strong> has invited you to join their team on V Chat.
              </p>
            </div>

            {/* Invitation Details Summary Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '18px 20px',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Organization:</span>
                <strong style={{ color: '#0f172a' }}>{companyName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Invited By:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{inviterName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Invited Email:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{invitedEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '13px' }}>
                <span style={{ color: '#64748b', fontWeight: 500 }}>Assigned Role:</span>
                <span style={{ color: '#0284c7', fontWeight: 600 }}>Team Member</span>
              </div>
            </div>

            {/* Logged in vs Not Logged In flows */}
            {user ? (
              <div>
                {isEmailMatching ? (
                  <div>
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '13px',
                        color: '#065f46',
                        marginBottom: '20px',
                        textAlign: 'center',
                      }}
                    >
                      Signed in as <strong>{user.email}</strong>. Click below to accept and join.
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleAcceptLoggedIn}
                      disabled={accepting}
                      style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                    >
                      {accepting ? 'Joining workspace...' : `Accept & Join ${companyName} →`}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '8px',
                        padding: '14px',
                        fontSize: '13px',
                        color: '#92400e',
                        marginBottom: '20px',
                        lineHeight: 1.5,
                      }}
                    >
                      ⚠️ You are currently signed in as <strong>{user.email}</strong>, but this invitation was sent to{' '}
                      <strong>{invitedEmail}</strong>. Please switch accounts to accept this invitation.
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={logout}
                        style={{ flex: 1 }}
                      >
                        Sign Out & Switch
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '13px', color: '#475569', textAlign: 'center', marginBottom: '18px' }}>
                  To accept this invitation, sign in or register an account using <strong>{invitedEmail}</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => onNavigateRegister && onNavigateRegister({ email: invitedEmail, token })}
                    style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                  >
                    Create Account & Join →
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onNavigateLogin && onNavigateLogin({ email: invitedEmail, token })}
                    style={{ width: '100%', padding: '12px', fontSize: '14px' }}
                  >
                    Sign In with Existing Account
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AcceptInvitationPage;
