import { useState, useMemo } from 'react';
import Avatar from '../common/Avatar';
import { UsersIcon, CloseIcon, SearchIcon, PlusIcon, LockIcon } from '../common/Icons';

function ChannelMembersPopup({
  isOpen,
  channel,
  members = [],
  currentUserId,
  onlineUserIds,
  isMember = false,
  canManage = false,
  onClose,
  onOpenAddMembers,
  onPromoteAdmin,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [promotingId, setPromotingId] = useState(null);

  const currentUserIsAdmin = canManage || (channel.admins || []).some(
    (a) => (a._id || a.id || a)?.toString() === currentUserId?.toString()
  ) || (channel.createdBy?._id || channel.createdBy)?.toString() === currentUserId?.toString();

  const handlePromote = async (memberId) => {
    if (!onPromoteAdmin || promotingId) return;
    setPromotingId(memberId);
    try {
      await onPromoteAdmin(channel._id || channel.id, memberId);
    } catch (err) {
      console.error('Failed to promote member to admin:', err);
    } finally {
      setPromotingId(null);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!Array.isArray(members)) return [];
    const query = searchQuery.trim().toLowerCase();
    if (!query) return members;

    return members.filter((member) => {
      const name = (member.name || '').toLowerCase();
      const email = (member.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [members, searchQuery]);

  const onlineCount = useMemo(() => {
    if (!onlineUserIds || !Array.isArray(members)) return 0;
    return members.filter((m) => {
      const id = (m._id || m.id || m)?.toString();
      return id && onlineUserIds.has(id);
    }).length;
  }, [members, onlineUserIds]);

  if (!isOpen || !channel) return null;

  return (
    <div
      className="modal-backdrop channel-members-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="channel-members-title"
    >
      <div
        className="modal-container channel-members-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="channel-members-header">
          <div className="channel-members-header-left">
            <div className="channel-members-icon-badge">
              {channel.isPrivate ? (
                <LockIcon size={18} color="var(--primary-accent, #0284c7)" strokeWidth={2.2} />
              ) : (
                <UsersIcon size={18} color="var(--primary-accent, #0284c7)" strokeWidth={2.2} />
              )}
            </div>
            <div className="channel-members-title-group">
              <div className="channel-members-title-row">
                <h3 id="channel-members-title" className="channel-members-title">
                  {channel.name} Members
                </h3>
              </div>
            </div>
          </div>

          <div className="channel-members-header-actions">
            {isMember && channel.isPrivate && canManage && (
              <button
                type="button"
                className="btn-channel-add-member"
                onClick={() => {
                  onClose();
                  onOpenAddMembers?.();
                }}
                title="Invite teammates to channel"
              >
                <PlusIcon size={14} />
                <span>Add</span>
              </button>
            )}
            <button
              type="button"
              className="btn-modal-close"
              onClick={onClose}
              aria-label="Close channel members popup"
            >
              <CloseIcon size={16} />
            </button>
          </div>
        </div>

        {/* Search / Filter Bar */}
        <div className="channel-members-search-wrapper">
          <div className="channel-members-search-bar">
            <SearchIcon size={15} className="channel-members-search-icon" />
            <input
              type="text"
              className="channel-members-search-input"
              placeholder="Search members by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="channel-members-clear-search"
                onClick={() => setSearchQuery('')}
                aria-label="Clear member search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Member List */}
        <div className="channel-members-body">
          {filteredMembers.length === 0 ? (
            <div className="channel-members-empty">
              <span className="channel-members-empty-icon">
                <SearchIcon size={40} color="var(--border-strong, #cbd5e1)" />
              </span>
              <p className="channel-members-empty-text">
                No members found matching &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          ) : (
            <div className="channel-members-scroll-list">
              {filteredMembers.map((member) => {
                const memberId = (member._id || member.id || member)?.toString();
                const isOnline = memberId && onlineUserIds ? onlineUserIds.has(memberId) : false;
                const memberName = member.name || 'Teammate';
                const isSelf = memberId === currentUserId?.toString();
                const isChannelCreator = channel.createdBy && (
                  (channel.createdBy._id || channel.createdBy)?.toString() === memberId
                );
                const isChannelAdmin = (channel.admins || []).some(
                  (a) => (a._id || a.id || a)?.toString() === memberId
                ) || member.role === 'admin' || isChannelCreator;

                return (
                  <div key={memberId} className="channel-member-row">
                    <div className="channel-member-avatar-col">
                      <Avatar
                        name={memberName}
                        image={member.avatar}
                        size="small"
                      />
                    </div>

                    <div className="channel-member-details">
                      <div className="channel-member-name-row">
                        <span className="channel-member-name">{memberName}</span>
                        {isSelf && <span className="badge-you">(You)</span>}

                        {member.role === 'owner' && (
                          <span className="channel-role-tag owner">Owner</span>
                        )}
                      </div>
                    </div>

                    <div className="channel-member-presence">
                      {currentUserIsAdmin && !isSelf && !isChannelCreator && !isChannelAdmin && onPromoteAdmin && (
                        <button
                          type="button"
                          className="btn-promote-admin"
                          onClick={() => handlePromote(memberId)}
                          disabled={promotingId === memberId}
                          title={`Promote ${memberName} to Channel Admin`}
                        >
                          {promotingId === memberId ? 'Promoting...' : 'Make Admin'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="channel-members-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn-secondary channel-members-btn-done"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChannelMembersPopup;
