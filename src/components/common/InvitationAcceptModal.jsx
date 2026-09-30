import React, { useState } from 'react';
import { CompanyIcon, CheckIcon, CloseIcon } from '../common/Icons';
import { acceptInvitation, declineInvitation } from '../../services/invitationService';

/**
 * InvitationAcceptModal
 * Clean modal shown when user receives or clicks an invitation to join an organization.
 */
function InvitationAcceptModal({
  isOpen,
  invitation,
  onClose,
  onAccepted,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !invitation) return null;

  const companyName = invitation.organization?.name || 'Workspace';
  const inviterName = invitation.invitedBy?.name || 'An administrator';

  const handleAccept = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await acceptInvitation(invitation._id);
      if (res.success) {
        if (onAccepted) {
          onAccepted(res.organization || invitation.organization);
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept invitation');
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setError(null);
    try {
      await declineInvitation(invitation._id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to decline invitation');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container invitation-modal"
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
              background: 'rgba(2, 132, 199, 0.1)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-accent)',
              marginBottom: '16px',
            }}
          >
            <CompanyIcon size={28} strokeWidth={2} />
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
            You're Invited!
          </h3>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--text-muted)',
              lineHeight: 1.55,
              margin: '0 0 16px 0',
              maxWidth: '340px',
            }}
          >
            <strong>{inviterName}</strong> has invited you to join the <strong>{companyName}</strong> workspace.
          </p>

          {error && (
            <div
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                fontSize: '0.82rem',
                marginBottom: '16px',
              }}
            >
              {error}
            </div>
          )}

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
              onClick={handleDecline}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            >
              Decline
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={handleAccept}
              disabled={loading}
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
              {loading ? 'Joining...' : 'Accept Invitation →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InvitationAcceptModal;
