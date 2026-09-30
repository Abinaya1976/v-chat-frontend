import Avatar from '../common/Avatar';
import { LockIcon, ChannelIcon, PinIcon, BellOffIcon, AudioCallIcon, VideoCallIcon, BellIcon, CalendarIcon } from '../common/Icons';

const formatChatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  
  const dateMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowMidnight.getTime() - dateMidnight.getTime();
  const diffDays = Math.round(diffTime / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
};

function ChatListItem({
  chat,
  currentUserId,
  onlineUserIds,
  isSelected,
  onSelect,
  isPinned = false,
  onTogglePin = null,
}) {
  const isChannel = Boolean(
    chat.isChannel ||
    chat.itemType === 'channel' ||
    (chat.isPrivate !== undefined && !chat.participants) ||
    (chat.members && !chat.participants)
  );

  let displayName = chat.name || 'Conversation';
  let displayAvatar = chat.avatar;
  let status = 'offline';
  let snippet = 'No messages yet';
  let time = '';
  let isMuted = Boolean(chat.muted);

  const isSelfConv =
    chat.isMe ||
    (chat.participants &&
      Array.isArray(chat.participants) &&
      chat.participants.length > 0 &&
      chat.participants.every(
        (p) => (p._id || p.id || p)?.toString() === currentUserId?.toString()
      ));

  if (isChannel) {
    // Channel Item
    displayName = chat.name;
    time = formatChatTime(chat.lastMessageAt || chat.updatedAt || chat.createdAt);

    if (chat.lastMessage) {
      if (typeof chat.lastMessage === 'object') {
        const senderName =
          chat.lastMessage.sender?.name ||
          (chat.lastMessage.sender === currentUserId ? 'You' : '');
        let content = chat.lastMessage.content || '';
        const strippedContent = content.replace(/<[^>]+>/g, '').trim();
        
        if (!strippedContent && chat.lastMessage.attachments && chat.lastMessage.attachments.length > 0) {
          const attachments = chat.lastMessage.attachments;
          if (attachments.length > 1) {
            content = `📎 ${attachments.length} attachments`;
          } else {
            const type = attachments[0].fileType || '';
            if (type.startsWith('image/')) content = 'Photo';
            else if (type.startsWith('video/')) content = 'Video';
            else if (type === 'application/pdf') content = 'PDF';
            else content = '📎 File';
          }
        } else {
          content = strippedContent || content;
        }
        
        snippet = senderName ? `${senderName}: ${content}` : content;
      } else {
        snippet = chat.lastMessage;
      }
    }

    // Check user-specific mute setting in channel memberSettings
    if (chat.memberSettings && Array.isArray(chat.memberSettings) && currentUserId) {
      const mySetting = chat.memberSettings.find(
        (s) => (s.userId?._id || s.userId || s.id)?.toString() === currentUserId.toString()
      );
      if (mySetting && mySetting.muted !== undefined) {
        isMuted = Boolean(mySetting.muted);
      }
    }
  } else if (chat.participants && Array.isArray(chat.participants)) {
    if (isSelfConv) {
      displayName = 'Me';
      displayAvatar = (chat.participants && chat.participants[0]?.avatar) || chat.avatar;
      if (chat.lastMessage) {
        if (typeof chat.lastMessage === 'object') {
          let content = chat.lastMessage.content || '';
          const strippedContent = content.replace(/<[^>]+>/g, '').trim();

          if (!strippedContent && chat.lastMessage.attachments && chat.lastMessage.attachments.length > 0) {
            const attachments = chat.lastMessage.attachments;
            if (attachments.length > 1) {
              content = `📎 ${attachments.length} attachments`;
            } else {
              const type = attachments[0].fileType || '';
              if (type.startsWith('image/')) content = 'Photo';
              else if (type.startsWith('video/')) content = 'Video';
              else if (type === 'application/pdf') content = 'PDF';
              else content = '📎 File';
            }
          } else {
            content = strippedContent || content;
          }
          
          const senderName = chat.lastMessage.sender?.name || (chat.lastMessage.sender === currentUserId ? 'You' : '');
          snippet = senderName ? `${senderName}: ${content}` : (content || 'Notes to self');
        } else {
          snippet = chat.lastMessage;
        }
      } else {
        snippet = 'Notes to self';
      }
      time = formatChatTime(chat.lastMessageAt || chat.updatedAt || chat.createdAt);
      status = 'online';
    } else {
      // 1-on-1 Direct Conversation Item
      const otherUser = chat.participants.find(
        (p) => (p._id || p.id || p)?.toString() !== currentUserId?.toString()
      ) || chat.participants[0];

      const otherUserId = (otherUser?._id || otherUser?.id || otherUser)?.toString();
      if (otherUserId && onlineUserIds) {
        status = onlineUserIds.has(otherUserId) ? 'online' : 'offline';
      }

      displayName = otherUser?.name || chat.name || 'Teammate';
      displayAvatar = otherUser?.avatar;
      time = formatChatTime(chat.lastMessageAt || chat.updatedAt || chat.createdAt);

      if (chat.lastMessage) {
        if (typeof chat.lastMessage === 'object') {
          let content = chat.lastMessage.content || '';
          const strippedContent = content.replace(/<[^>]+>/g, '').trim();

          if (!strippedContent && chat.lastMessage.attachments && chat.lastMessage.attachments.length > 0) {
            const attachments = chat.lastMessage.attachments;
            if (attachments.length > 1) {
              content = `📎 ${attachments.length} attachments`;
            } else {
              const type = attachments[0].fileType || '';
              if (type.startsWith('image/')) content = 'Photo';
              else if (type.startsWith('video/')) content = 'Video';
              else if (type === 'application/pdf') content = 'PDF';
              else content = '📎 File';
            }
          } else {
            content = strippedContent || content;
          }
          
          const senderName = chat.lastMessage.sender?.name || (chat.lastMessage.sender === currentUserId ? 'You' : '');
          snippet = senderName ? `${senderName}: ${content}` : content;
        } else {
          snippet = chat.lastMessage;
        }
      }
    }

    // Check user-specific mute setting in direct conversation memberSettings
    if (chat.memberSettings && Array.isArray(chat.memberSettings) && currentUserId) {
      const mySetting = chat.memberSettings.find(
        (s) => (s.userId?._id || s.userId || s.id)?.toString() === currentUserId.toString()
      );
      if (mySetting && mySetting.muted !== undefined) {
        isMuted = Boolean(mySetting.muted);
      }
    }
  } else {
    // Fallback for static items
    snippet = chat.lastMessage || 'No messages yet';
    time = chat.time || '';
    status = chat.status || 'offline';
  }

  const unreadCount = isSelfConv ? 0 : Number(chat.unread || 0);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`chat-list-item ${isSelected ? 'selected' : ''} ${isChannel ? 'channel-chat-item' : ''}`}
      onClick={() => onSelect(chat)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(chat);
        }
      }}
      aria-label={`Open ${displayName}`}
    >
      <div className="chat-item-avatar">
        {isChannel ? (
          <div className="channel-icon-hash-badge" title={chat.isPrivate ? 'Private Channel' : 'Public Channel'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {chat.isPrivate ? <LockIcon size={16} /> : <ChannelIcon size={16} />}
          </div>
        ) : (
          <Avatar
            name={displayName}
            image={displayAvatar}
            size="medium"
          />
        )}
      </div>

      <div className="chat-item-content">
        <div className="chat-item-header">
          <span className="chat-item-name" title={displayName}>
            {displayName}
            {isMuted && <span className="mute-icon-indicator" title="Muted"><BellOffIcon size={14} color="var(--text-muted)" style={{ marginTop: '2px' }} /></span>}
          </span>
        </div>

        <div className="chat-item-footer">
          <p className="chat-item-snippet">
            {typeof snippet === 'string' && snippet.includes('📞') ? (
              <span style={{ display: 'flex', alignItems: 'center' }}><AudioCallIcon size={14} style={{ marginRight: '4px' }} />{snippet.replace('📞 ', '')}</span>
            ) : typeof snippet === 'string' && snippet.includes('📹') ? (
              <span style={{ display: 'flex', alignItems: 'center' }}><VideoCallIcon size={14} style={{ marginRight: '4px' }} />{snippet.replace('📹 ', '')}</span>
            ) : typeof snippet === 'string' && snippet.includes('🔔') ? (
              <span style={{ display: 'flex', alignItems: 'center' }}><BellIcon size={14} color="#f59e0b" style={{ marginRight: '4px' }} />{snippet.replace('🔔 ', '')}</span>
            ) : typeof snippet === 'string' && snippet.includes('📅') ? (
              <span style={{ display: 'flex', alignItems: 'center' }}><CalendarIcon size={14} color="#10b981" style={{ marginRight: '4px' }} />{snippet.replace('📅 ', '')}</span>
            ) : snippet}
          </p>
        </div>
      </div>

      <div className="chat-item-meta-right">
        <span className="chat-item-time">{time}</span>
        <div className="chat-item-badges">
          {onTogglePin && (
            <button
              type="button"
              className={`btn-pin-toggle ${isPinned ? 'is-pinned' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onTogglePin();
              }}
              title={isPinned ? 'Unpin' : 'Pin to top'}
              aria-label={isPinned ? 'Unpin' : 'Pin to top'}
            >
              <PinIcon size={12} strokeWidth={2.2} />
            </button>
          )}
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatListItem;
