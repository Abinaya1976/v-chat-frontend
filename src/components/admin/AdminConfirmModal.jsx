import { createPortal } from 'react-dom';

function AdminConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onCancel} role="dialog" aria-modal="true">
      <div
        className="modal-container admin-confirm-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '440px', width: '90%', height: 'auto', minHeight: 'fit-content', borderRadius: '12px', overflow: 'hidden', animation: 'modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)', background: 'var(--card-bg, #ffffff)', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid var(--card-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isDanger ? 'rgba(220, 38, 38, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                color: isDanger ? '#dc2626' : 'var(--primary-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {isDanger ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              )}
            </div>
            <h3 className="modal-title" style={{ fontSize: '1.08rem', fontWeight: 700, margin: 0 }}>
              {title}
            </h3>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onCancel}
            disabled={loading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px' }}>
          <p className="confirm-modal-message" style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {message}
          </p>
        </div>

        <div className="modal-footer" style={{ padding: '14px 24px', background: 'var(--bg-color)', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={isDanger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={loading}
            style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.88rem', fontWeight: 600 }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default AdminConfirmModal;
