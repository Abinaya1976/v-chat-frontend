import { useState, useEffect, useCallback } from 'react';
import Avatar from '../common/Avatar';
import { UsersIcon, CloseIcon, SearchIcon } from '../common/Icons';
import {
  getAdminChannelMembers,
  addAdminChannelMember,
  removeAdminChannelMember,
  getAdminUsers,
} from '../../services/adminService';

function ChannelMembersModal({ isOpen, channel, onClose, onMembersUpdated }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Add Member search states
  const [searchUserQuery, setSearchUserQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!channel?._id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminChannelMembers(channel._id);
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error('Failed to load channel members:', err.message);
      setError('Unable to fetch channel members');
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => {
    if (isOpen && channel) {
      loadMembers();
      setSearchUserQuery('');
      setSearchedUsers([]);
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, channel, loadMembers]);

  // Search non-member users to add
  useEffect(() => {
    if (!searchUserQuery.trim() || searchUserQuery.trim().length < 2) {
      setSearchedUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingUsers(true);
      try {
        const data = await getAdminUsers({ search: searchUserQuery.trim(), limit: 10 });
        if (data.success) {
          const currentMemberIds = new Set(members.map((m) => m._id));
          const nonMembers = (data.users || []).filter((u) => !currentMemberIds.has(u._id));
          setSearchedUsers(nonMembers);
        }
      } catch (err) {
        console.error('Search user error:', err.message);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchUserQuery, members]);

  const handleAddMember = async (userId) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await addAdminChannelMember(channel._id, userId);
      if (res.success) {
        setSuccess('Member added to channel');
        setSearchUserQuery('');
        setSearchedUsers([]);
        await loadMembers();
        onMembersUpdated?.();
      }
    } catch (err) {
      console.error('Add member error:', err.message);
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleRemoveMember = async (userId) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await removeAdminChannelMember(channel._id, userId);
      if (res.success) {
        setSuccess('Member removed from channel');
        await loadMembers();
        onMembersUpdated?.();
      }
    } catch (err) {
      console.error('Remove member error:', err.message);
      setError(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setActionLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  if (!isOpen || !channel) return null;

  return (
    <div className="modal-backdrop role-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="channel-members-modal-title">
      <div className="modal-container role-modal-dialog" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="role-modal-header">
          <div className="role-modal-header-left">
            <div className="role-modal-icon-badge">
              <UsersIcon size={18} color="var(--primary-accent, #0284c7)" strokeWidth={2.4} />
            </div>
            <div className="role-modal-title-group">
              <h3 id="channel-members-modal-title" className="role-modal-title">
                Members of {channel.name}
              </h3>
              <p className="role-modal-subtitle">
                Manage members and access for this channel
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="role-modal-body">
          {error && <div className="role-modal-alert"><span>⚠️ {error}</span></div>}
          {success && <div className="role-modal-alert alert-success" style={{ backgroundColor: 'rgba(22,163,74,0.1)', color: '#16a34a', borderBottomColor: 'rgba(22,163,74,0.2)' }}><span>{success}</span></div>}

          {/* Add Member Search Section */}
          <div className="add-member-section" style={{ marginBottom: '24px' }}>
            <label className="role-section-label" style={{ display: 'block', marginBottom: '8px' }}>ADD USER TO CHANNEL</label>
            <div className="search-bar-wrapper">
              <span className="search-icon"><SearchIcon size={16} /></span>
              <input
                type="text"
                className="search-input"
                placeholder="Search team users to add..."
                value={searchUserQuery}
                onChange={(e) => setSearchUserQuery(e.target.value)}
              />
            </div>

            {isSearchingUsers && (
              <div className="member-search-loading" style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span className="admin-spinner" style={{ width: 14, height: 14, marginRight: '6px' }} /> Searching directory...
              </div>
            )}

            {searchedUsers.length > 0 && (
              <div className="search-user-results-dropdown" style={{ marginTop: '12px', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
                {searchedUsers.map((u) => (
                  <div key={u._id} className="search-user-result-row" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg)' }}>
                    <Avatar name={u.name} image={u.avatar} size="small" />
                    <div className="search-user-meta" style={{ flex: 1, marginLeft: '12px', display: 'flex', flexDirection: 'column' }}>
                      <span className="search-user-name" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</span>
                      <span className="search-user-email" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
                      onClick={() => handleAddMember(u._id)}
                      disabled={actionLoading}
                    >
                      + Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Members List */}
          <div className="current-members-section">
            <label className="role-section-label" style={{ display: 'block', marginBottom: '12px' }}>
              CHANNEL MEMBERS ({members.length})
            </label>

            {loading ? (
              <div className="members-loading-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <span className="admin-spinner" style={{ width: 16, height: 16, marginBottom: '8px' }} /> <br /> Loading channel members...
              </div>
            ) : members.length === 0 ? (
              <div className="empty-members-state" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--subpanel-bg)', borderRadius: '12px', fontSize: '0.9rem' }}>
                No members in this channel.
              </div>
            ) : (
              <div className="members-list-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                {members.map((member) => (
                  <div key={member._id} className="channel-member-card" style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px' }}>
                    <Avatar name={member.name} image={member.avatar} size="small" />
                    <div className="member-card-info" style={{ flex: 1, marginLeft: '12px', display: 'flex', flexDirection: 'column' }}>
                      <span className="member-name" style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>{member.name}</span>
                      <span className="member-email" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</span>
                    </div>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '6px' }}
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={actionLoading}
                      title="Remove member from channel"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="role-modal-footer">
          <button type="button" className="btn-secondary role-btn-cancel" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChannelMembersModal;
