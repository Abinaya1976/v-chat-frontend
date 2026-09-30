import Avatar from '../common/Avatar';
import { CloseIcon } from '../common/Icons';

function DeactivateConfirmModal({
  isOpen,
  user,
  nextStatus = 'inactive',
  loading = false,
  onClose,
  onConfirm,
}) {
  if (!isOpen || !user) return null;

  const isDeactivating = nextStatus === 'inactive';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container deactivate-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '480px',
          width: '92%',
          background: 'var(--bg-white, #ffffff)',
          borderRadius: '14px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid var(--border-color, #e2e8f0)',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isDeactivating ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                color: isDeactivating ? '#dc2626' : '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isDeactivating ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
            <div>
              <h3
                className="modal-title"
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  margin: 0,
                  color: 'var(--text-main, #1e293b)',
                }}
              >
                {isDeactivating ? 'Deactivate User Account' : 'Reactivate User Account'}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted, #64748b)' }}>
                {isDeactivating ? 'Pause member operations while preserving history' : 'Restore full operational access to workspace'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* User Card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '12px 16px',
              background: 'var(--bg-hover, #f8fafc)',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #e2e8f0)',
            }}
          >
            <Avatar user={user} size={42} showStatus={false} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: 'var(--text-main, #1e293b)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.name}
                </span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: user.role === 'admin' ? 'rgba(2, 132, 199, 0.12)' : 'rgba(100, 116, 139, 0.12)',
                    color: user.role === 'admin' ? '#0284c7' : '#64748b',
                    letterSpacing: '0.04em',
                  }}
                >
                  {user.role || 'member'}
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted, #64748b)',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {user.email}
              </span>
            </div>
          </div>

          {/* Explanation Banner */}
          {isDeactivating ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '14px 16px',
                background: 'rgba(254, 242, 242, 0.7)',
                borderRadius: '10px',
                border: '1px solid rgba(254, 202, 202, 0.8)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ color: '#dc2626', marginTop: '2px', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#991b1b', lineHeight: '1.45' }}>
                  <strong>Operational actions will be paused:</strong> This user will no longer be able to send messages, create or update to-dos, create channels, or perform modifications in this organization.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ color: '#059669', marginTop: '2px', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#065f46', lineHeight: '1.45' }}>
                  <strong>Existing data remains intact:</strong> All past messages, files, channel discussions, and historical activity will remain safely preserved and viewable in read-only mode.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ color: '#0284c7', marginTop: '2px', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#075985', lineHeight: '1.45' }}>
                  <strong>Reversible at any time:</strong> You can reactivate this account whenever needed to restore full operational access immediately.
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '14px 16px',
                background: 'rgba(236, 253, 245, 0.8)',
                borderRadius: '10px',
                border: '1px solid rgba(167, 243, 208, 0.9)',
              }}
            >
              <div style={{ color: '#059669', marginTop: '2px', flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div style={{ fontSize: '0.86rem', color: '#065f46', lineHeight: '1.5' }}>
                <strong>Restore Workspace Operations:</strong> Reactivating this user will immediately restore their full permissions to send messages, collaborate in channels, and manage to-dos in this organization.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="modal-footer"
          style={{
            padding: '14px 24px',
            background: 'var(--bg-hover, #f8fafc)',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--border-color, #cbd5e1)',
              background: '#ffffff',
              color: 'var(--text-main, #334155)',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            className={isDeactivating ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '8px 22px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              background: isDeactivating ? '#dc2626' : 'var(--primary-accent, #0284c7)',
              color: '#ffffff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: isDeactivating
                ? '0 1px 3px 0 rgba(220, 38, 38, 0.4)'
                : '0 1px 3px 0 rgba(2, 132, 199, 0.4)',
            }}
          >
            {loading ? (
              <>
                <svg className="spinner-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                </svg>
                Processing...
              </>
            ) : isDeactivating ? (
              'Deactivate User'
            ) : (
              'Reactivate User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeactivateConfirmModal;
