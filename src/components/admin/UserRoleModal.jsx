import { useState, useEffect } from 'react';
import Avatar from '../common/Avatar';
import { AdminIcon, UsersIcon, CloseIcon, CheckIcon } from '../common/Icons';

function UserRoleModal({
  isOpen,
  user,
  currentAdminId,
  loading = false,
  initialRole = null,
  onClose,
  onConfirmRole,
}) {
  const [selectedRole, setSelectedRole] = useState('member');
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      setSelectedRole(initialRole || user.role || 'member');
      setValidationError(null);
    }
  }, [isOpen, user, initialRole]);

  if (!isOpen || !user) return null;

  const isSelf = user._id === currentAdminId;
  const isTargetOwner = user.role === 'owner';

  const roleOptions = [
    {
      id: 'admin',
      name: 'Administrator',
      badge: 'ADMIN',
      badgeClass: 'role-badge-admin',
      icon: <AdminIcon size={18} color="#0284c7" />,
      description: 'Full administrative access. Can manage channels, team members, roles, permissions, and organization settings.',
      disabled: false,
    },
    {
      id: 'member',
      name: 'Member',
      badge: 'MEMBER',
      badgeClass: 'role-badge-member',
      icon: <UsersIcon size={18} color="#64748b" />,
      description: 'Standard workspace access. Can participate in channels, send direct messages, share files, and create to-dos.',
      disabled: isSelf, // Cannot self-demote
    },
    {
      id: 'owner',
      name: 'Workspace Owner',
      badge: 'OWNER',
      badgeClass: 'role-badge-owner',
      icon: (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
          <path d="M5 20h14" />
        </svg>
      ),
      description: 'Primary workspace owner. Has highest authority over workspace billing, ownership, and organization settings.',
      disabled: !isTargetOwner, // Owner cannot be granted directly from this dialog
      tooltip: !isTargetOwner ? 'Primary organization ownership cannot be assigned from this menu' : 'Primary organization owner',
    },
  ];

  const handleSelectRole = (roleId) => {
    setValidationError(null);
    if (roleId === 'member' && isSelf) {
      setValidationError('You cannot demote your own administrator account.');
      return;
    }
    if (roleId === 'owner' && !isTargetOwner) {
      setValidationError('Workspace ownership transfer must be performed by the current owner.');
      return;
    }
    setSelectedRole(roleId);
  };

  const handleSave = () => {
    if (selectedRole === 'member' && isSelf) {
      setValidationError('You cannot demote your own administrator account.');
      return;
    }
    if (selectedRole === user.role) {
      onClose();
      return;
    }
    onConfirmRole(selectedRole);
  };

  return (
    <div className="modal-backdrop role-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="role-modal-title">
      <div className="modal-container role-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="role-modal-header">
          <div className="role-modal-header-left">
            <div className="role-modal-icon-badge">
              <AdminIcon size={18} color="var(--primary-accent, #0284c7)" strokeWidth={2.4} />
            </div>
            <div className="role-modal-title-group">
              <h3 id="role-modal-title" className="role-modal-title">
                Manage Member Role
              </h3>
              <p className="role-modal-subtitle">
                Configure role permissions and access level in this workspace
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="role-modal-body">
          {/* User Preview Card */}
          <div className="role-user-preview-card">
            <Avatar name={user.name} image={user.avatar} size="medium" />
            <div className="role-user-preview-info">
              <div className="role-user-name-row">
                <span className="role-user-preview-name">{user.name}</span>
                {isSelf && <span className="badge-you">(You)</span>}
              </div>
              <span className="role-user-preview-email">{user.email}</span>
            </div>
            <div className="role-user-current-badge">
              <span className="role-current-label">Current:</span>
              <span className={`role-pill role-pill-${user.role || 'member'}`}>
                {(user.role || 'member').toUpperCase()}
              </span>
            </div>
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="role-modal-alert">
              <span>⚠️ {validationError}</span>
            </div>
          )}

          {/* Role Selection Options */}
          <div className="role-options-list">
            <label className="role-section-label">SELECT WORKSPACE ROLE</label>

            {roleOptions.map((option) => {
              const isSelected = selectedRole === option.id;
              const isDisabled = option.disabled;

              return (
                <div
                  key={option.id}
                  className={`role-option-card ${isSelected ? 'role-option-selected' : ''} ${isDisabled ? 'role-option-disabled' : ''}`}
                  onClick={() => !isDisabled && handleSelectRole(option.id)}
                  title={option.tooltip || option.name}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isDisabled ? -1 : 0}
                  onKeyDown={(e) => {
                    if ((e.key === ' ' || e.key === 'Enter') && !isDisabled) {
                      e.preventDefault();
                      handleSelectRole(option.id);
                    }
                  }}
                >
                  <div className="role-option-radio-col">
                    <div className={`role-radio-circle ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <div className="role-radio-dot" />}
                    </div>
                  </div>

                  <div className="role-option-content">
                    <div className="role-option-header-row">
                      <div className="role-option-title-group">
                        <span className="role-option-icon">{option.icon}</span>
                        <span className="role-option-name">{option.name}</span>
                      </div>
                      <span className={`role-badge-tag ${option.badgeClass}`}>
                        {option.badge}
                      </span>
                    </div>
                    <p className="role-option-description">{option.description}</p>
                    {isDisabled && option.tooltip && (
                      <span className="role-option-hint">{option.tooltip}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="role-modal-footer">
          <button
            type="button"
            className="btn-secondary role-btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary role-btn-confirm"
            onClick={handleSave}
            disabled={loading || (selectedRole === user.role && !validationError)}
          >
            {loading ? (
              <>
                <span className="admin-spinner" style={{ width: 14, height: 14, marginRight: 6 }} />
                Updating Role...
              </>
            ) : (
              'Save Role'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserRoleModal;
