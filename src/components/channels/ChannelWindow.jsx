import { useState, useEffect } from 'react';
import Avatar from '../common/Avatar';
import { LockIcon, ChannelIcon, PinIcon, AudioCallIcon, VideoCallIcon } from '../common/Icons';
import MessageList from '../chat/MessageList';
import MessageInput from '../chat/MessageInput';
import InChatSearch from '../chat/InChatSearch';
import ForwardModal from '../chat/ForwardModal';
import MessageInfoModal from '../chat/MessageInfoModal';
import PinnedMessagesPanel from '../chat/PinnedMessagesPanel';
import ConversationMenu from '../chat/ConversationMenu';
import EditChannelModal from './EditChannelModal';
import AddChannelMemberModal from './AddChannelMemberModal';
import ChannelMembersPopup from './ChannelMembersPopup';
import PollModal from '../chat/PollModal';

function ChannelWindow({
  channel,
  messages = [],
  currentUserId,
  onlineUserIds,
  conversations = [],
  channels = [],
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onDeleteMessageForMe,
  onForwardMessage,
  onJoinChannel,
  onLeaveChannel,
  onUpdateChannel = null,
  onAddMembers = null,
  availableUsers = [],
  userRole = 'user',
  onTyping,
  onStopTyping,
  typingUser = null,
  onBack,
  loading = false,
  isSending = false,
  highlightedMessageId = null,
  hasMore = false,
  loadingOlder = false,
  onLoadOlder = null,
  onCreateTodo = null,
  onReaction = null,
  savedMessageIds = new Set(),
  onSave = null,
  onUnsave = null,
  onPin = null,
  onUnpin = null,
  pinnedMessages = [],
  pinnedLoading = false,
  muted = false,
  onMarkRead = null,
  onMarkUnread = null,
  onToggleMute = null,
  isPlanDisabled = false,
  isExpired = false,
  isSuspended = false,
  onPollVoted = null,
  onPromoteAdmin = null,
}) {
  const [showMembers, setShowMembers] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localHighlightId, setLocalHighlightId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddMembersOpen, setIsAddMembersOpen] = useState(false);
  const [activePollModalMessage, setActivePollModalMessage] = useState(null);

  const channelId = (channel._id || channel.id)?.toString();

  // Reset states when switching channels
  useEffect(() => {
    setIsSearchOpen(false);
    setLocalHighlightId(null);
    setReplyingTo(null);
    setForwardingMessage(null);
    setInfoMessage(null);
    setActivePollModalMessage(null);
  }, [channelId]);

  // Sync active poll modal message with updated messages
  useEffect(() => {
    if (activePollModalMessage) {
      const current = messages.find(
        (m) =>
          (m._id || m.id)?.toString() ===
          (activePollModalMessage._id || activePollModalMessage.id)?.toString()
      );
      if (current && current.poll) {
        setActivePollModalMessage(current);
      }
    }
  }, [messages, activePollModalMessage]);

  // Check if the current authenticated user is a member of this channel
  const isMember = channel.members?.some(
    (m) => (m._id || m.id || m)?.toString() === currentUserId?.toString()
  );

  // Check if current user is a Channel Admin (in channel.admins array, or creator, or org admin)
  const isChannelAdmin = Boolean(
    channel.admins?.some(
      (adm) => (adm._id || adm.id || adm)?.toString() === currentUserId?.toString()
    ) ||
      (channel.createdBy?._id || channel.createdBy?.id || channel.createdBy)?.toString() ===
        currentUserId?.toString() ||
      ['admin', 'owner', 'super_admin'].includes(userRole)
  );

  // Check if user has permission to manage channel
  const canManage = Boolean(
    isChannelAdmin ||
    ['admin', 'owner', 'super_admin'].includes(userRole) ||
    (channel.createdBy && (channel.createdBy._id || channel.createdBy.id || channel.createdBy).toString() === currentUserId?.toString())
  );

  // Check if user can send messages (must be a member and, if admin-only channel, must be channel admin)
  const canSendMessages = isMember && (!channel.isAdminOnly || isChannelAdmin || canManage);

  const memberList = Array.isArray(channel.members) ? channel.members : [];

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      await onJoinChannel(channel._id || channel.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await onLeaveChannel(channel._id || channel.id);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelectMessageFromSearch = (messageId) => {
    setLocalHighlightId(messageId);
    setTimeout(() => {
      setLocalHighlightId(null);
    }, 4000);
  };

  const handleSendMessageWithReply = (content, files, replyToId) => {
    onSendMessage(content, files, replyToId);
    setReplyingTo(null);
  };

  const activeHighlightId = localHighlightId || highlightedMessageId;

  return (
    <div className="chat-window-container channel-window-container">
      {/* Channel Header */}
      <div className="chat-window-header channel-window-header">
        {isSearchOpen ? (
          <InChatSearch
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            channelId={channelId}
            contextTitle={channel.name}
            onSelectMessage={handleSelectMessageFromSearch}
          />
        ) : (
          <>
            <div className="chat-header-left">
              {onBack && (
                <button
                  type="button"
                  className="btn-back-mobile"
                  onClick={onBack}
                  aria-label="Back to channels"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="back-icon"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </button>
              )}

              <div className="channel-icon-hash-badge" title={channel.isPrivate ? 'Private Channel' : 'Public Channel'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {channel.isPrivate ? <LockIcon size={18} /> : <ChannelIcon size={18} />}
              </div>

              <div 
                className="chat-header-info" 
                onClick={() => setShowMembers((prev) => !prev)}
                style={{ cursor: 'pointer' }}
                title="View channel members"
              >
                <div className="channel-title-row">
                  <h3 className="chat-header-name">{channel.name}</h3>
                </div>
                <span className="chat-header-status">
                  {channel.description || `${channel.members?.length || 0} member${channel.members?.length === 1 ? '' : 's'}`}
                </span>
              </div>
            </div>

            <div className="chat-header-actions">
              {/* Start/Join LiveKit Group Call */}
              {isMember && (
                <>
                  <button
                    type="button"
                    className="btn-icon-action"
                    title={`Voice Call in #${channel.name}`}
                    aria-label="Voice Call"
                    onClick={() => {
                      const event = new CustomEvent('join-livekit-call', { 
                        detail: { roomId: channelId, channelId: channelId, isGroup: true, contextName: channel.name, isInitiating: true, audioOnly: true } 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <AudioCallIcon size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-action"
                    title={`Video Call in #${channel.name}`}
                    aria-label="Video Call"
                    onClick={() => {
                      const event = new CustomEvent('join-livekit-call', { 
                        detail: { roomId: channelId, channelId: channelId, isGroup: true, contextName: channel.name, isInitiating: true, audioOnly: false } 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <VideoCallIcon size={18} />
                  </button>
                </>
              )}
              {/* Add To-Do Shortcut */}
              {onCreateTodo && !isPlanDisabled && (
                <button
                  type="button"
                  className="btn-header-todo-action"
                  title={`Add a To-Do in ${channel.name}`}
                  aria-label={`Add a To-Do in ${channel.name}`}
                  onClick={() => onCreateTodo({ channel })}
                >
                  <span>☑️ + To-Do</span>
                </button>
              )}

              {/* Invite / Add Member Button (for Private Channels when authorized) */}
              {isMember && channel.isPrivate && canManage && (
                <button
                  type="button"
                  className="btn-header-invite-member"
                  title={`Invite teammates to #${channel.name}`}
                  aria-label={`Invite teammates to #${channel.name}`}
                  onClick={() => setIsAddMembersOpen(true)}
                >
                  <span>Add Member</span>
                </button>
              )}

              {/* Join / Leave Channel Button (Ordered before Three-dot menu) */}
              {isMember ? (
                <button
                  type="button"
                  className="btn-leave-channel"
                  onClick={handleLeave}
                  disabled={actionLoading}
                  title="Leave this channel"
                >
                  Leave
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-join-channel"
                  onClick={handleJoin}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Joining...' : 'Join Channel'}
                </button>
              )}

              {/* In-Channel Search & Actions Group (Search & Three-dot menu at far right) */}
              <div className="header-actions-group">
                {isMember && (
                  <button
                    type="button"
                    className="btn-icon-action"
                    title={`Search in ${channel.name}`}
                    aria-label={`Search in ${channel.name}`}
                    onClick={() => setIsSearchOpen(true)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </button>
                )}

                <div className="header-menu-container">
                  <button
                    type="button"
                    className="btn-icon-action"
                    title="Channel options"
                    aria-label="Channel options"
                    onClick={() => setShowConversationMenu((prev) => !prev)}
                  >
                    ⋮
                  </button>
                  <ConversationMenu
                    isOpen={showConversationMenu}
                    onClose={() => setShowConversationMenu(false)}
                    muted={muted}
                    onToggleMute={onToggleMute}
                    onOpenPinned={() => setShowPinned(true)}
                    onAddMembers={
                      isMember && channel.isPrivate && canManage
                        ? () => setIsAddMembersOpen(true)
                        : null
                    }
                    onEditChannel={
                      canManage
                        ? () => setIsEditModalOpen(true)
                        : null
                    }
                    label={channel.name}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Edit Channel Modal */}
      <EditChannelModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        channel={channel}
        onSave={async ({ name, description, isAdminOnly }) => {
          if (onUpdateChannel) {
            await onUpdateChannel(channelId, { name, description, isAdminOnly });
          }
        }}
      />

      <div className="channel-main-content-layout">
        <div className="channel-messages-wrapper">
          {/* Non-Member Preview Notice */}
          {!isMember ? (
            <div className="non-member-banner-stage">
              <div className="non-member-card">
                <h2>Welcome to {channel.name}</h2>
                <p>
                  {channel.description ||
                    'Join this channel to collaborate, read discussion history, and post messages.'}
                </p>
                <button
                  type="button"
                  className="btn-join-channel-large"
                  onClick={handleJoin}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Joining Channel...' : `Join ${channel.name}`}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Top Pinned Message Banner */}
              {pinnedMessages && pinnedMessages.length > 0 && (() => {
                const latestPin = pinnedMessages[0];
                const pinDoc = latestPin?.messageId || latestPin;
                const pinSender = pinDoc?.sender?.name || (pinDoc?.sender === currentUserId ? 'You' : 'Teammate');
                const pinSnippet = pinDoc?.deleted
                  ? 'This message was deleted'
                  : (pinDoc?.content || (pinDoc?.attachments?.length ? `📎 ${pinDoc.attachments[0].fileName}` : 'Pinned message'));
                const targetId = (pinDoc?._id || pinDoc?.id || latestPin?.messageId)?.toString();

                return (
                  <div
                    className="chat-pinned-message-top-bar"
                    onClick={() => targetId && handleSelectMessageFromSearch(targetId)}
                    role="button"
                    tabIndex={0}
                    title="Click to jump to pinned message"
                  >
                    <div className="pinned-bar-left">
                      <span className="pinned-bar-icon">
                        <PinIcon size={14} strokeWidth={2.2} />
                      </span>
                      <div className="pinned-bar-text-group">
                        <div className="pinned-bar-header-row">
                          <span className="pinned-bar-title">
                            Pinned Message{pinnedMessages.length > 1 ? ` (${pinnedMessages.length})` : ''}
                          </span>
                          <span className="pinned-bar-sender">· {pinSender}</span>
                        </div>
                        <p className="pinned-bar-snippet">{pinSnippet}</p>
                      </div>
                    </div>
                    <div className="pinned-bar-right-actions">
                      {pinnedMessages.length > 1 && (
                        <button
                          type="button"
                          className="btn-pinned-bar-all"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowPinned(true);
                          }}
                          title="View all pinned messages"
                        >
                          All ({pinnedMessages.length})
                        </button>
                      )}
                      {onUnpin && (
                        <button
                          type="button"
                          className="btn-pinned-bar-unpin"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (targetId) onUnpin(targetId);
                          }}
                          title="Unpin message"
                          aria-label="Unpin message"
                        >
                          <PinIcon size={13} strokeWidth={2.2} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Message Stream */}
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                loading={loading}
                highlightedMessageId={activeHighlightId}
                replyingToId={(replyingTo?._id || replyingTo?.id)?.toString() || null}
                hasMore={hasMore}
                loadingOlder={loadingOlder}
                onLoadOlder={onLoadOlder}
                onReply={channel.isArchived || !canSendMessages ? null : (msg) => setReplyingTo(msg)}
                onForward={(msg) => setForwardingMessage(msg)}
                onEdit={onEditMessage}
                onDelete={onDeleteMessage}
                onDeleteForMe={onDeleteMessageForMe}
                onCreateTodo={onCreateTodo ? (msg) => onCreateTodo({ channel, sourceMessage: msg }) : null}
                onShowInfo={(msg) => setInfoMessage(msg)}
                onSelectMessage={handleSelectMessageFromSearch}
                onReaction={onReaction}
                savedMessageIds={savedMessageIds}
                onSave={onSave}
                onUnsave={onUnsave}
                onPin={onPin}
                onUnpin={onUnpin}
                onOpenPollModal={(msg) => setActivePollModalMessage(msg)}
              />

              {/* Real-Time Channel Typing Indicator Bubble */}
              {typingUser && (
                <div className="typing-indicator-bar">
                  <div className="typing-bubble">
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-dot"></span>
                    <span className="typing-text">{typingUser}</span>
                  </div>
                </div>
              )}

              {/* Message Input Bar */}
              {channel.isArchived ? (
                <div className="channel-archived-banner">
                  <span className="archived-icon">📦</span>
                  <span>This channel is archived. New messages cannot be sent.</span>
                </div>
              ) : channel.isAdminOnly && !canSendMessages ? (
                <div className="admin-only-channel-banner">
                  <span>Only channel admins can send messages</span>
                </div>
              ) : isPlanDisabled ? (
                <div className="plan-disabled-input-bar">
                  <span className="plan-disabled-text">
                    {isExpired ? 'Your subscription plan has expired.' : 'Your subscription has been Ended'}
                  </span>
                </div>
              ) : (
                <MessageInput
                  onSendMessage={handleSendMessageWithReply}
                  onTyping={onTyping}
                  onStopTyping={onStopTyping}
                  placeholder={replyingTo ? `Reply in ${channel.name}...` : `Message ${channel.name}...`}
                  disabled={isSending}
                  replyingTo={replyingTo}
                  onCancelReply={() => setReplyingTo(null)}
                  members={channel?.members || []}
                  onCreatePoll={canSendMessages ? (pollData) => {
                    onSendMessage({
                      content: `📊 Poll: ${pollData.question}`,
                      poll: pollData,
                      messageType: 'poll',
                    });
                  } : null}
                />
              )}
            </>
          )}
        </div>

        {/* Poll Voting & Results Modal */}
        {activePollModalMessage && (
          <PollModal
            isOpen={Boolean(activePollModalMessage)}
            onClose={() => setActivePollModalMessage(null)}
            message={activePollModalMessage}
            currentUserId={currentUserId}
            onVoteSuccess={(updatedPoll, msgId) => {
              const targetId = msgId || activePollModalMessage._id || activePollModalMessage.id;
              setActivePollModalMessage((prev) => (prev ? { ...prev, poll: updatedPoll } : null));
              onPollVoted?.(targetId, updatedPoll);
            }}
          />
        )}

        {/* Redesigned Channel Members Popup (Flock UI) */}
        <ChannelMembersPopup
          isOpen={showMembers}
          channel={channel}
          members={memberList}
          currentUserId={currentUserId}
          onlineUserIds={onlineUserIds}
          isMember={isMember}
          canManage={canManage}
          onClose={() => setShowMembers(false)}
          onOpenAddMembers={() => setIsAddMembersOpen(true)}
          onPromoteAdmin={onPromoteAdmin}
        />
      </div>

      {/* Forward Modal */}
      {forwardingMessage && (
        <ForwardModal
          isOpen={Boolean(forwardingMessage)}
          onClose={() => setForwardingMessage(null)}
          message={forwardingMessage}
          conversations={conversations}
          channels={channels}
          currentUserId={currentUserId}
          onConfirmForward={onForwardMessage}
        />
      )}

      <PinnedMessagesPanel
        isOpen={showPinned}
        onClose={() => setShowPinned(false)}
        pinnedMessages={pinnedMessages}
        loading={pinnedLoading}
        onUnpin={onUnpin}
        onSelectMessage={(messageId) => {
          setShowPinned(false);
          handleSelectMessageFromSearch(messageId);
        }}
      />

      {/* Message Info Modal */}
      {infoMessage && (
        <MessageInfoModal
          isOpen={Boolean(infoMessage)}
          onClose={() => setInfoMessage(null)}
          message={infoMessage}
        />
      )}

      {/* Invite / Add Channel Member Modal */}
      <AddChannelMemberModal
        isOpen={isAddMembersOpen}
        onClose={() => setIsAddMembersOpen(false)}
        channel={channel}
        availableUsers={availableUsers}
        onAddMembers={onAddMembers}
        currentUserId={currentUserId}
        onlineUserIds={onlineUserIds}
      />
    </div>
  );
}

export default ChannelWindow;
