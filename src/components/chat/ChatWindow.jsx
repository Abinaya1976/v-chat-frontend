import { useState, useEffect } from 'react';
import Avatar from '../common/Avatar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import InChatSearch from './InChatSearch';
import ForwardModal from './ForwardModal';
import MessageInfoModal from './MessageInfoModal';
import PinnedMessagesPanel from './PinnedMessagesPanel';
import ConversationMenu from './ConversationMenu';
import PollModal from './PollModal';
import { PinIcon, AudioCallIcon, VideoCallIcon, SearchIcon, MoreVerticalIcon } from '../common/Icons';
import { useCall } from '../../context/CallContext';

function ChatWindow({
  chat,
  messages = [],
  currentUserId,
  conversations = [],
  channels = [],
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onDeleteMessageForMe,
  onForwardMessage,
  onTyping,
  onStopTyping,
  typingUser = null,
  isOtherUserOnline = false,
  otherUserLastSeen = null,
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
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localHighlightId, setLocalHighlightId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [showPinned, setShowPinned] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const [activePollModalMessage, setActivePollModalMessage] = useState(null);

  const { initiateCall } = useCall();
  
  const convId = (chat._id || chat.id)?.toString();

  // Reset states when switching conversations
  useEffect(() => {
    setIsSearchOpen(false);
    setLocalHighlightId(null);
    setReplyingTo(null);
    setForwardingMessage(null);
    setInfoMessage(null);
    setActivePollModalMessage(null);
  }, [convId]);

  // Sync active poll modal message with updated messages (e.g. on new votes)
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

  let displayName = chat.name;
  let displayAvatar = chat.avatar;
  let statusText = 'Direct Message';
  let isOnline = isOtherUserOnline;
  let otherUserForCall = null;

  if (chat.participants && Array.isArray(chat.participants)) {
    const otherUser = chat.participants.find(
      (p) => (p._id || p.id || p)?.toString() !== currentUserId?.toString()
    ) || chat.participants[0];
    otherUserForCall = otherUser;

    displayName = otherUser?.name || 'Teammate';
    displayAvatar = otherUser?.avatar;

    const allowsOnline = otherUser?.settings?.privacy?.onlineStatus !== false;
    const allowsLastSeen = otherUser?.settings?.privacy?.lastSeen !== false;

    if (isOnline && allowsOnline) {
      statusText = 'Online';
    } else if (otherUserLastSeen && allowsLastSeen) {
      const date = new Date(otherUserLastSeen);
      const formattedDate = date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      statusText = `Last seen at ${formattedDate}`;
    } else {
      statusText = 'Offline';
    }
  } else {
    statusText = isOnline ? 'Online' : 'Offline';
  }

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
    <div className="chat-window-container">
      {/* Chat Window Header */}
      <div className="chat-window-header">
        {isSearchOpen ? (
          <InChatSearch
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            conversationId={convId}
            contextTitle={displayName || 'this conversation'}
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
                  aria-label="Back to conversations"
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

              <Avatar
                name={displayName}
                image={displayAvatar}
                size="medium"
                status={isOnline ? 'online' : 'offline'}
              />

              <div className="chat-header-info">
                <h3 className="chat-header-name">{displayName}</h3>
                <span className="chat-header-status">{statusText}</span>
              </div>
            </div>

            <div className="chat-header-actions">
              {otherUserForCall && !chat.isMe && (
                <>
                  <button
                    type="button"
                    className="btn-icon-action"
                    title="Audio Call"
                    aria-label="Audio Call"
                    onClick={() => initiateCall(otherUserForCall, 'audio', chat._id || chat.id)}
                  >
                    <AudioCallIcon size={18} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon-action"
                    title="Video Call"
                    aria-label="Video Call"
                    onClick={() => initiateCall(otherUserForCall, 'video', chat._id || chat.id)}
                  >
                    <VideoCallIcon size={18} />
                  </button>
                </>
              )}
              {onCreateTodo && !isPlanDisabled && (
                <button
                  type="button"
                  className="btn-header-todo-action"
                  title="Add a To-Do in this conversation"
                  aria-label="Add a To-Do in this conversation"
                  onClick={() => onCreateTodo({ conversation: chat })}
                >
                  <span>☑️ + To-Do</span>
                </button>
              )}

              <button
                type="button"
                className="btn-icon-action"
                title="Search in conversation"
                aria-label="Search in conversation"
                onClick={() => setIsSearchOpen(true)}
              >
                <SearchIcon size={18} strokeWidth={2} />
              </button>

              <div className="header-menu-container">
                <button
                  type="button"
                  className="btn-icon-action"
                  title="More options"
                  aria-label="More options"
                  onClick={() => setShowConversationMenu((prev) => !prev)}
                >
                  <MoreVerticalIcon size={18} strokeWidth={2} />
                </button>
                <ConversationMenu
                  isOpen={showConversationMenu}
                  onClose={() => setShowConversationMenu(false)}
                  muted={muted}
                  onToggleMute={onToggleMute}
                  onOpenPinned={() => setShowPinned(true)}
                  label={displayName}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Top Pinned Message Banner */}
      {pinnedMessages && pinnedMessages.length > 0 && (() => {
        const latestPin = pinnedMessages[0];
        const pinDoc = latestPin?.messageId || latestPin;
        const pinSender = pinDoc?.sender?.name || (pinDoc?.sender === currentUserId ? 'You' : 'Teammate');
        const pinSnippet = pinDoc?.deleted
          ? 'This message was deleted'
          : (pinDoc?.content || (pinDoc?.attachments?.length ? `📎 ${pinDoc.attachments[0].fileName}` : 'Pinned message'));

        return (
          <div
            className="chat-pinned-message-top-bar"
            onClick={() => setShowPinned(true)}
            role="button"
            tabIndex={0}
            title="View pinned messages"
          >
            <div className="pinned-bar-left">
              <span className="pinned-bar-icon">
                <PinIcon size={14} strokeWidth={2.2} />
              </span>
              <div className="pinned-bar-text-group">
                <div className="pinned-bar-header-row">
                  <span className="pinned-bar-title">Pinned Message</span>
                  <span className="pinned-bar-sender">· {pinSender}</span>
                </div>
                <p className="pinned-bar-snippet">{pinSnippet}</p>
              </div>
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
        onReply={(msg) => setReplyingTo(msg)}
        onForward={(msg) => setForwardingMessage(msg)}
        onEdit={onEditMessage}
        onDelete={onDeleteMessage}
        onDeleteForMe={onDeleteMessageForMe}
        onCreateTodo={onCreateTodo ? (msg) => onCreateTodo({ conversation: chat, sourceMessage: msg }) : null}
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

      {/* Real-Time Typing Indicator Bubble */}
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
      {isPlanDisabled ? (
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
          placeholder={`Message ${displayName}...`}
          disabled={isSending}
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          members={chat?.participants || []}
          onCreatePoll={(pollData) => {
            onSendMessage({
              content: `📊 Poll: ${pollData.question}`,
              poll: pollData,
              messageType: 'poll',
            });
          }}
        />
      )}

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

      {/* Message Info Modal */}
      {infoMessage && (
        <MessageInfoModal
          isOpen={Boolean(infoMessage)}
          onClose={() => setInfoMessage(null)}
          message={infoMessage}
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
          onSelectMessageFromSearch(messageId);
        }}
      />
    </div>
  );
}

export default ChatWindow;
