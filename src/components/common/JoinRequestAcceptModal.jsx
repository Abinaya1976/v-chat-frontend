import React from 'react';
import { CheckIcon, AdminIcon } from '../common/Icons';

/**
 * JoinRequestAcceptModal
 * Polished, enterprise-grade modal shown when user clicks an approval notification
 * or when an admin accepts their join request.
 */
function JoinRequestAcceptModal({
  isOpen,
  companyName = 'Workspace',
  onClose,
  onEnterWorkspace,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container join-accept-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '90%',
          animation: 'modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'var(--card-bg)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.18)',
          border: '1px solid var(--card-border)',
        }}
      >
        <div
          style={{
            padding: '28px 24px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(5, 150, 105, 0.1)',
              border: '1px solid rgba(5, 150, 105, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              marginBottom: '16px',
            }}
          >
            <CheckIcon size={28} strokeWidth={2.5} />
          </div>

          <h3
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              margin: '0 0 8px 0',
              letterSpacing: '-0.2px',
            }}
          >
            Welcome to {companyName}!
          </h3>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: '0 0 24px 0',
              maxWidth: '340px',
            }}
          >
            Your request to join <strong>{companyName}</strong> has been approved by the workspace administrator.
          </p>

          <div
            style={{
              display: 'flex',
              gap: '12px',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              Dismiss
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={onEnterWorkspace}
              style={{
                flex: 1.4,
                padding: '10px 18px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Enter Workspace →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinRequestAcceptModal;
