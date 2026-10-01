import { useState, useEffect, useCallback } from 'react';
import Avatar from '../common/Avatar';
import AdminConfirmModal from './AdminConfirmModal';
import DeactivateConfirmModal from './DeactivateConfirmModal';
import UserRoleModal from './UserRoleModal';
import { UsersIcon, MailIcon, CheckIcon, CloseIcon } from '../common/Icons';
import { useSocket } from '../../context/SocketContext';
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
  updateAdminUserPermissions,
  getAdminInvitations,
  createAdminInvitation,
  revokeAdminInvitation,
} from '../../services/adminService';

function UserManagement({ currentAdminId }) {
  // Sub-tab: 'members' | 'invitations'
  const [subTab, setSubTab] = useState('members');

  // Members State
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Invitations State
  const [invitations, setInvitations] = useState([]);
  const [invitationStatusFilter, setInvitationStatusFilter] = useState('');
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // Alerts
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal State for Role, Status, or Revoke changes
  const [permModalUser, setPermModalUser] = useState(null);
  const [savingPerms, setSavingPerms] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: null, // 'role' | 'status' | 'revoke-invitation'
    user: null,
    invitation: null,
    nextValue: null,
    loading: false,
  });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers({
        page,
        limit: 15,
        search,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      if (data.success) {
        setUsers(data.users || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load users:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter]);

  const loadInvitations = useCallback(async () => {
    setLoadingInvitations(true);
    setError(null);
    try {
      const data = await getAdminInvitations({ status: invitationStatusFilter || undefined });
      if (data.success) {
        setInvitations(data.invitations || []);
      }
    } catch (err) {
      console.error('Failed to load invitations:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch invitations');
    } finally {
      setLoadingInvitations(false);
    }
  }, [invitationStatusFilter]);

  const { socket } = useSocket() || {};

  useEffect(() => {
    if (subTab === 'members') {
      loadUsers();
    } else if (subTab === 'invitations') {
      loadInvitations();
    }
  }, [subTab, loadUsers, loadInvitations]);

  // Real-time invitation & membership socket listener in Admin Console
  useEffect(() => {
    if (!socket) return;

    const handleInvitationChange = () => {
      loadInvitations();
      loadUsers();
    };

    socket.on('invitation:created', handleInvitationChange);
    socket.on('invitation:accepted', handleInvitationChange);
    socket.on('invitation:revoked', handleInvitationChange);

    return () => {
      socket.off('invitation:created', handleInvitationChange);
      socket.off('invitation:accepted', handleInvitationChange);
      socket.off('invitation:revoked', handleInvitationChange);
    };
  }, [socket, loadInvitations, loadUsers]);

  const handleSendInvite = async (e) => {
    if (e) e.preventDefault();
    if (!inviteEmail || !inviteEmail.trim()) {
      setError('Please enter a valid employee email address');
      return;
    }

    setSendingInvite(true);
    setError(null);
    try {
      const res = await createAdminInvitation(inviteEmail.trim());
      if (res.success) {
        setSuccessMessage(res.message || 'Invitation created successfully!');
        setInviteEmail('');
        loadInvitations();
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (err) {
      console.error('Invite failed:', err.message);
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRoleChangePrompt = (targetUser, newRole) => {
    if (targetUser.role === 'owner') return;
    if (targetUser._id === currentAdminId && newRole !== 'admin') {
      setError('You cannot demote your own administrator account.');
      return;
    }

    setModalState({
      isOpen: true,
      type: 'role',
      user: targetUser,
      nextValue: newRole || targetUser.role || 'member',
      loading: false,
    });
  };

  const handleRoleConfirm = async (selectedRole) => {
    const targetUser = modalState.user;
    if (!targetUser) return;
    setModalState((prev) => ({ ...prev, loading: true }));
    setError(null);

    try {
      const res = await updateAdminUserRole(targetUser._id, selectedRole);
      if (res.success) {
        setSuccessMessage(`Role for ${targetUser.name} updated to ${selectedRole}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, role: selectedRole } : u))
        );
        setTimeout(() => setSuccessMessage(null), 3500);
        setModalState({ isOpen: false, type: null, user: null, invitation: null, nextValue: null, loading: false });
      }
    } catch (err) {
      console.error('Role update failed:', err.message);
      setError(err.response?.data?.message || 'Failed to update member role');
      setModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleStatusChangePrompt = (targetUser) => {
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    if (targetUser._id === currentAdminId && nextStatus === 'inactive') {
      setError('You cannot deactivate your own administrator account.');
      return;
    }

    setModalState({
      isOpen: true,
      type: 'status',
      user: targetUser,
      nextValue: nextStatus,
      loading: false,
    });
  };

  const handleRevokePrompt = (inv) => {
    setModalState({
      isOpen: true,
      type: 'revoke-invitation',
      invitation: inv,
      loading: false,
    });
  };

  const handleConfirmAction = async () => {
    const { type, user: targetUser, invitation: targetInv, nextValue } = modalState;
    setModalState((prev) => ({ ...prev, loading: true }));
    setError(null);

    try {
      if (type === 'role') {
        const res = await updateAdminUserRole(targetUser._id, nextValue);
        if (res.success) {
          setSuccessMessage(`Role for ${targetUser.name} updated to ${nextValue}`);
          setUsers((prev) =>
            prev.map((u) => (u._id === targetUser._id ? { ...u, role: nextValue } : u))
          );
        }
      } else if (type === 'status') {
        const res = await updateAdminUserStatus(targetUser._id, nextValue);
        if (res.success) {
          setSuccessMessage(`Status for ${targetUser.name} changed to ${nextValue}`);
          setUsers((prev) =>
            prev.map((u) => (u._id === targetUser._id ? { ...u, status: nextValue } : u))
          );
        }
      } else if (type === 'revoke-invitation') {
        const res = await revokeAdminInvitation(targetInv._id);
        if (res.success) {
          setSuccessMessage(`Invitation for ${targetInv.email} has been revoked`);
          setInvitations((prev) =>
            prev.map((inv) => (inv._id === targetInv._id ? { ...inv, status: 'revoked' } : inv))
          );
        }
      }
      setTimeout(() => setSuccessMessage(null), 3500);
      setModalState({ isOpen: false, type: null, user: null, invitation: null, nextValue: null, loading: false });
    } catch (err) {
      console.error('Action failed:', err.message);
      setError(err.response?.data?.message || 'Administrative action failed');
      setModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const pendingInvitationsCount = invitations.filter((i) => i.status === 'pending').length;

  return (
    <div className="admin-section-container">
      {/* Sub Navigation Bar: [ Members ] [ Invitations ] */}
      <div className="admin-subnav-bar">
        <button
          type="button"
          className={`btn-subnav-pill ${subTab === 'members' ? 'active' : ''}`}
          onClick={() => setSubTab('members')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <UsersIcon size={15} /> Members
          </span>
        </button>
        <button
          type="button"
          className={`btn-subnav-pill ${subTab === 'invitations' ? 'active' : ''}`}
          onClick={() => setSubTab('invitations')}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <MailIcon size={15} /> Invitations
          </span>
          {pendingInvitationsCount > 0 && (
            <span className="subnav-badge badge-pending-count">{pendingInvitationsCount}</span>
          )}
        </button>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="admin-alert-box alert-error">
          <span>⚠️ {error}</span>
          <button type="button" className="btn-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="admin-alert-box alert-success">
          <span>{successMessage}</span>
          <button type="button" className="btn-dismiss" onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {/* TAB 1: MEMBERS */}
      {subTab === 'members' && (
        <>
          {/* Control Bar: Search, Filters & Invite Employee */}
          <div className="admin-control-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
            <div className="admin-search-input-wrapper" style={{ flex: 1 }}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search organization members..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSubTab('invitations');
              }}
              style={{ display: 'flex', alignItems: 'center', padding: '8px 20px', whiteSpace: 'nowrap' }}
            >
              + Invite Employee
            </button>

            <div className="admin-filter-group" style={{ display: 'flex', gap: '12px' }}>
              <select
                className="admin-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="user">Member / User</option>
                <option value="admin">Administrator</option>
              </select>

              <select
                className="admin-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6">
                      <span className="admin-spinner" /> Loading members...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-muted">
                      No members found matching current filters.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u._id === currentAdminId;
                    return (
                      <tr key={u._id} className={u.status === 'inactive' ? 'row-inactive' : ''}>
                        <td>
                          <div className="user-cell">
                            <Avatar name={u.name} image={u.avatar} size="small" />
                            <span className="font-semibold">{u.name} {isSelf && <span className="badge-you">(You)</span>}</span>
                          </div>
                        </td>
                        <td className="text-muted">{u.email}</td>
                        <td>
                          <button
                            type="button"
                            className={`role-badge-select ${u.role === 'owner' ? 'role-owner' : u.role === 'admin' ? 'role-admin' : 'role-user'}`}
                            onClick={() => handleRoleChangePrompt(u, u.role || 'member')}
                            disabled={isSelf || u.role === 'owner'}
                            title={u.role === 'owner' ? 'Owner role cannot be modified' : isSelf ? 'Cannot modify your own role' : 'Manage member role'}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: (isSelf || u.role === 'owner') ? 'default' : 'pointer',
                              border: 'none',
                              fontFamily: 'inherit',
                            }}
                          >
                            <span>{(u.role || 'member').toUpperCase()}</span>
                            {!isSelf && u.role !== 'owner' && (
                              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>▾</span>
                            )}
                          </button>
                        </td>
                        <td>
                          <span className={`status-pill status-${u.status || 'active'}`}>
                            <span className="dot" /> {u.status || 'active'}
                          </span>
                        </td>
                        <td className="text-muted">{formatDate(u.createdAt)}</td>
                        <td className="text-right">
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {u.role === 'admin' && (
                              <button
                                type="button"
                                onClick={() => setPermModalUser(u)}
                                style={{ background: 'rgba(14, 165, 233, 0.1)', border: '1px solid rgba(14, 165, 233, 0.2)', color: '#0ea5e9', cursor: 'pointer', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', fontWeight: '600' }}
                              >
                                Permissions
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStatusChangePrompt(u)}
                              disabled={isSelf || u.role === 'owner'}
                              style={{ background: u.status === 'active' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: u.status === 'active' ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)', color: u.status === 'active' ? '#ef4444' : '#10b981', cursor: (isSelf || u.role === 'owner') ? 'not-allowed' : 'pointer', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', fontWeight: '600', opacity: (isSelf || u.role === 'owner') ? 0.5 : 1 }}
                            >
                              {u.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="admin-pagination-footer">
            <span className="pagination-count">
              Showing <strong>{users.length}</strong> of <strong>{totalCount}</strong> members
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-page"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
              >
                ← Previous
              </button>
              <span className="page-indicator">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-page"
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      {/* TAB 2: INVITATIONS */}
      {subTab === 'invitations' && (
        <div className="admin-invitations-container">
          {/* Invite Employee Form */}
          <div
            className="admin-invite-box"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
            }}
          >
            <h4 style={{ margin: '0 0 8px 0', fontSize: '15px', color: 'var(--text-main)' }}>
              Invite an Employee to Your Workspace
            </h4>
            <p className="text-muted" style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
              Enter an employee's email address. They will receive an in-app invitation to accept and join your organization.
            </p>
            <form onSubmit={handleSendInvite} style={{ display: 'flex', gap: '10px', maxWidth: '520px' }}>
              <input
                type="email"
                className="admin-search-input"
                placeholder="employee@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                style={{ flex: 1 }}
                required
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={sendingInvite}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
              >
                <MailIcon size={15} />
                {sendingInvite ? 'Sending...' : 'Send Invitation'}
              </button>
            </form>
          </div>

          {/* Filter Bar */}
          <div className="admin-control-bar" style={{ marginBottom: '16px' }}>
            <div className="admin-filter-group">
              <select
                className="admin-select"
                value={invitationStatusFilter}
                onChange={(e) => setInvitationStatusFilter(e.target.value)}
              >
                <option value="">All Invitation Statuses</option>
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="expired">Expired</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>
          </div>

          {/* Invitations Table */}
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Invited Email</th>
                  <th>Invited By</th>
                  <th>Status</th>
                  <th>Sent Date</th>
                  <th>Expires</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingInvitations ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6">
                      <span className="admin-spinner" /> Loading invitations...
                    </td>
                  </tr>
                ) : invitations.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-muted">
                      ✨ No invitations found. Use the form above to invite team members.
                    </td>
                  </tr>
                ) : (
                  invitations.map((inv) => (
                    <tr key={inv._id}>
                      <td className="font-semibold">{inv.email}</td>
                      <td className="text-muted">{inv.invitedBy?.name || inv.invitedBy?.email || 'Admin'}</td>
                      <td>
                        <span className={`status-pill status-${inv.status || 'pending'}`}>
                          <span className="dot" />
                          {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                        </span>
                      </td>
                      <td className="text-muted">{formatDate(inv.createdAt)}</td>
                      <td className="text-muted">{formatDate(inv.expiresAt)}</td>
                      <td className="text-right">
                        {inv.status === 'pending' ? (
                          <div className="table-actions-group">
                            <button
                              type="button"
                              className="btn-action-small btn-danger"
                              onClick={() => handleRevokePrompt(inv)}
                              title="Revoke invitation"
                            >
                              Revoke
                            </button>
                          </div>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.85rem', paddingRight: '12px' }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Granular Permissions Modal for Admin Users */}
      {permModalUser && (
        <div className="admin-modal-overlay">
          <div className="admin-modal-card" style={{ maxWidth: '500px', width: '90%' }}>
            <div className="admin-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Manage Permissions — {permModalUser.name}</h3>
              <button
                type="button"
                className="btn-dismiss"
                onClick={() => setPermModalUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '16px' }}>
              Configure exact administrative capabilities for <strong>{permModalUser.name}</strong> (ADMIN role).
            </p>

            <div className="permissions-checklist" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {[
                { key: 'MANAGE_MEMBERS', label: 'Manage Members (Invite, Activate, Deactivate)' },
                { key: 'MANAGE_CHANNELS', label: 'Manage Channels (Create, Edit, Archive, Delete)' },
                { key: 'MANAGE_TODOS', label: 'Manage Todos & Task Governance' },
                { key: 'MANAGE_MESSAGES', label: 'Manage Messages & Content Moderation' },
                { key: 'VIEW_ANALYTICS', label: 'View Organization Analytics & Activity Metrics' },
                { key: 'MANAGE_SETTINGS', label: 'Manage Company Settings & Policies' },
                { key: 'MANAGE_ROLES', label: 'Manage Member Roles & Admin Permissions' },
              ].map(({ key, label }) => {
                const isChecked = Array.isArray(permModalUser.permissions) && permModalUser.permissions.includes(key);
                return (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        const nextPerms = e.target.checked
                          ? [...(permModalUser.permissions || []), key]
                          : (permModalUser.permissions || []).filter((p) => p !== key);
                        setPermModalUser({ ...permModalUser, permissions: nextPerms });
                      }}
                    />
                    <span>{label}</span>
                  </label>
                );
              })}
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setPermModalUser(null)}
                disabled={savingPerms}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={savingPerms}
                onClick={async () => {
                  setSavingPerms(true);
                  try {
                    const res = await updateAdminUserPermissions(permModalUser._id, permModalUser.permissions || []);
                    if (res.success) {
                      setSuccessMessage(`Permissions updated for ${permModalUser.name}`);
                      setUsers((prev) =>
                        prev.map((u) => (u._id === permModalUser._id ? { ...u, permissions: permModalUser.permissions } : u))
                      );
                      setPermModalUser(null);
                    }
                  } catch (err) {
                    setError(err.response?.data?.message || 'Failed to update permissions');
                  } finally {
                    setSavingPerms(false);
                  }
                }}
              >
                {savingPerms ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Members & Roles Modal (Flock UI) */}
      <UserRoleModal
        isOpen={modalState.isOpen && modalState.type === 'role'}
        user={modalState.user}
        currentAdminId={currentAdminId}
        loading={modalState.loading}
        initialRole={modalState.nextValue}
        onClose={() =>
          setModalState({ isOpen: false, type: null, user: null, invitation: null, nextValue: null, loading: false })
        }
        onConfirmRole={handleRoleConfirm}
      />

      {/* Professional Flock Confirmation Modal for Deactivate / Reactivate */}
      {modalState.isOpen && modalState.type === 'status' && (
        <DeactivateConfirmModal
          isOpen={modalState.isOpen}
          user={modalState.user}
          nextStatus={modalState.nextValue}
          loading={modalState.loading}
          onClose={() =>
            setModalState({ isOpen: false, type: null, user: null, invitation: null, nextValue: null, loading: false })
          }
          onConfirm={handleConfirmAction}
        />
      )}

      {/* Confirmation Modal for Revoking Invitations */}
      {modalState.isOpen && modalState.type === 'revoke-invitation' && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setModalState({ isOpen: false, type: null, user: null, invitation: null, nextValue: null, loading: false })
          }
        >
          <div className="modal-container admin-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Revoke Invitation
              </h3>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() =>
                  setModalState({ isOpen: false, type: null, user: null, invitation: null, nextValue: null, loading: false })
                }
                disabled={modalState.loading}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Are you sure you want to revoke the invitation sent to &quot;{modalState.invitation?.email}&quot;? They will no longer be able to join using this invitation.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setModalState({ isOpen: false, type: null, user: null, invitation: null, nextValue: null, loading: false })
                }
                disabled={modalState.loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmAction}
                disabled={modalState.loading}
              >
                {modalState.loading ? 'Revoking...' : 'Revoke Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
