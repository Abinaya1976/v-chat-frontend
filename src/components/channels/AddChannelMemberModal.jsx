import { useState, useMemo, useEffect } from 'react';
import Avatar from '../common/Avatar';
import {
  LockIcon,
  SearchIcon,
  UsersIcon,
  CloseIcon,
  CheckIcon,
  AlertTriangleIcon,
} from '../common/Icons';

function AddChannelMemberModal({
  isOpen,
  onClose,
  channel,
  availableUsers = [],
  onAddMembers,
  currentUserId,
  onlineUserIds = new Set(),
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Reset state on open or channel change
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedUserIds([]);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, channel?._id]);

  // Extract existing member IDs for this channel
  const existingMemberIds = useMemo(() => {
    if (!channel || !Array.isArray(channel.members)) return new Set();
    return new Set(
      channel.members.map((m) => (m._id || m.id || m)?.toString())
    );
  }, [channel?.members]);

  // Filter and sort available workspace users
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(availableUsers)) return [];

    const query = searchQuery.trim().toLowerCase();

    return availableUsers
      .filter((u) => {
        const uid = (u._id || u.id)?.toString();
        // Do not display current logged in user as someone to add
        if (uid === currentUserId?.toString()) return false;

        if (!query) return true;
        const nameMatch = (u.name || '').toLowerCase().includes(query);
        const emailMatch = (u.email || '').toLowerCase().includes(query);
        return nameMatch || emailMatch;
      })
      .sort((a, b) => {
        // Show non-members first, then already members
        const aIsMember = existingMemberIds.has((a._id || a.id)?.toString());
        const bIsMember = existingMemberIds.has((b._id || b.id)?.toString());
        if (aIsMember !== bIsMember) return aIsMember ? 1 : -1;
        return (a.name || '').localeCompare(b.name || '');
      });
  }, [availableUsers, searchQuery, currentUserId, existingMemberIds]);

  // Count non-members in the filtered list
  const nonMemberFilteredCount = useMemo(() => {
    return filteredUsers.filter(
      (u) => !existingMemberIds.has((u._id || u.id)?.toString())
    ).length;
  }, [filteredUsers, existingMemberIds]);

  // Find user objects for selected user IDs
  const selectedUsers = useMemo(() => {
    const map = new Map();
    availableUsers.forEach((u) => {
      const uid = (u._id || u.id)?.toString();
      if (uid) map.set(uid, u);
    });
    return selectedUserIds
      .map((id) => map.get(id))
      .filter(Boolean);
  }, [selectedUserIds, availableUsers]);

  if (!isOpen || !channel) return null;

  const toggleUserSelection = (userId) => {
    if (existingMemberIds.has(userId)) return; // Prevent selecting already added members
    setError(null);
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleRemoveSelected = (userId, e) => {
    e.stopPropagation();
    setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
  };

  const handleSelectAllFiltered = () => {
    const nonMemberFilteredIds = filteredUsers
      .filter((u) => !existingMemberIds.has((u._id || u.id)?.toString()))
      .map((u) => (u._id || u.id)?.toString());

    // If all currently selected, deselect all; otherwise select all
    const allSelected = nonMemberFilteredIds.every((id) => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !nonMemberFilteredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...nonMemberFilteredIds])));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) {
      setError('Please select at least one teammate to invite.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const channelId = (channel._id || channel.id)?.toString();
      await onAddMembers(channelId, selectedUserIds);
      setSuccessMsg(`Successfully added ${selectedUserIds.length} teammate${selectedUserIds.length > 1 ? 's' : ''}!`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to add members to channel');
      setLoading(false);
    }
  };

  const isAllNonMembersSelected =
    nonMemberFilteredCount > 0 &&
    filteredUsers
      .filter((u) => !existingMemberIds.has((u._id || u.id)?.toString()))
      .every((u) => selectedUserIds.includes((u._id || u.id)?.toString()));

  return (
    <div
      className="modal-backdrop add-member-modal-backdrop"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="add-members-modal-title"
    >
      <div
        className="add-channel-member-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="add-member-header">
          <div className="add-member-header-left">
            <div className="add-member-icon-badge">
              {channel.isPrivate ? (
                <LockIcon size={18} strokeWidth={2.2} color="var(--primary-accent, #0284c7)" />
              ) : (
                <UsersIcon size={18} strokeWidth={2.2} color="var(--primary-accent, #0284c7)" />
              )}
            </div>
            <div className="add-member-header-text">
              <div className="add-member-title-row">
                <h3 id="add-members-modal-title" className="add-member-title">
                  Add Members
                </h3>
                <span className="add-member-channel-tag">
                  {channel.name}
                </span>
              </div>
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
        <div className="add-member-body">
          {/* Notifications */}
          {error && (
            <div className="add-member-alert alert-error">
              <AlertTriangleIcon size={15} color="#dc2626" />
              <span>{error}</span>
            </div>
          )}
          {successMsg && (
            <div className="add-member-alert alert-success">
              <CheckIcon size={15} color="#059669" strokeWidth={2.5} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Search Input Bar */}
          <div className="add-member-search-box">
            <SearchIcon size={15} color="#94a3b8" className="add-member-search-icon" />
            <input
              type="text"
              className="add-member-search-input"
              placeholder="Search teammates by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <CloseIcon size={12} />
              </button>
            )}
          </div>

          {/* Selected Users Chips Tray */}
          {selectedUsers.length > 0 && (
            <div className="add-member-selected-tray">
              <div className="selected-tray-header">
                <span className="selected-tray-label">
                  Selected ({selectedUsers.length})
                </span>
                <button
                  type="button"
                  className="btn-clear-all-selected"
                  onClick={() => setSelectedUserIds([])}
                >
                  Clear all
                </button>
              </div>
              <div className="selected-chips-list">
                {selectedUsers.map((u) => {
                  const uid = (u._id || u.id)?.toString();
                  return (
                    <div key={uid} className="selected-user-chip">
                      <Avatar name={u.name} image={u.avatar} user={u} size="xsmall" />
                      <span className="chip-name">{u.name}</span>
                      <button
                        type="button"
                        className="btn-chip-remove"
                        onClick={(e) => handleRemoveSelected(uid, e)}
                        aria-label={`Remove ${u.name}`}
                      >
                        <CloseIcon size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Members List Section */}
          <div className="add-member-list-section">
            <div className="add-member-list-header">
              <div className="list-heading-group">
                <span className="list-heading">Workspace Teammates</span>
              </div>
              {nonMemberFilteredCount > 0 && (
                <button
                  type="button"
                  className="btn-text-action"
                  onClick={handleSelectAllFiltered}
                >
                  {isAllNonMembersSelected ? 'Deselect all' : 'Select all'}
                </button>
              )}
            </div>

            <div className="add-member-scroll-list">
              {filteredUsers.length === 0 ? (
                <div className="add-member-empty-state">
                  <div className="empty-state-icon-circle">
                    <SearchIcon size={20} color="#94a3b8" />
                  </div>
                  <p className="empty-state-title">No teammates found</p>
                  <span className="empty-state-hint">
                    {searchQuery ? `No matches for "${searchQuery}"` : 'No other teammates available to add'}
                  </span>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const uid = (u._id || u.id)?.toString();
                  const isAlready = existingMemberIds.has(uid);
                  const isSelected = selectedUserIds.includes(uid);
                  const isOnline = onlineUserIds.has(uid);

                  return (
                    <div
                      key={uid}
                      className={`add-member-user-row ${isAlready ? 'already-member' : ''} ${
                        isSelected ? 'selected' : ''
                      }`}
                      onClick={() => !isAlready && toggleUserSelection(uid)}
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-disabled={isAlready}
                    >
                      {/* Checkbox */}
                      <div
                        className={`custom-member-checkbox ${isSelected ? 'checked' : ''} ${
                          isAlready ? 'locked' : ''
                        }`}
                      >
                        {isSelected ? (
                          <CheckIcon size={12} color="#ffffff" strokeWidth={3} />
                        ) : isAlready ? (
                          <CheckIcon size={11} color="#64748b" strokeWidth={2.5} />
                        ) : null}
                      </div>

                      {/* Avatar */}
                      <div className="user-row-avatar">
                        <Avatar
                          name={u.name}
                          image={u.avatar}
                          user={u}
                          size="medium"
                          status={isOnline ? 'online' : 'offline'}
                        />
                      </div>

                      {/* User Info */}
                      <div className="user-row-info">
                        <span className="user-row-name">{u.name}</span>
                      </div>

                      {/* Status Tag */}
                      <div className="user-row-status-tag">
                        {isAlready ? (
                          <span className="badge-already-in-channel">Member</span>
                        ) : isSelected ? (
                          <span className="badge-member-selected">Selected</span>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="add-member-footer">
          <div className="footer-selection-summary">
            {selectedUserIds.length > 0 ? (
              <span className="selection-count-text">
                <strong>{selectedUserIds.length}</strong> teammate{selectedUserIds.length > 1 ? 's' : ''} selected
              </span>
            ) : (
              <span className="selection-hint-text">Choose teammates to invite</span>
            )}
          </div>
          <div className="footer-button-group">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-modal-primary"
              onClick={handleSubmit}
              disabled={loading || selectedUserIds.length === 0}
            >
              {loading ? (
                <span className="spinner-wrap">
                  <svg className="btn-spinner-icon" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
                  </svg>
                  Adding...
                </span>
              ) : (
                `Add${selectedUserIds.length > 0 ? ` (${selectedUserIds.length})` : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddChannelMemberModal;
