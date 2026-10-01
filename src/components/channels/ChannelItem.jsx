import { LockIcon, ChannelIcon, PinIcon } from '../common/Icons';

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

function ChannelItem({
  channel,
  isSelected,
  onSelect,
  isDiscoverable = false,
  onJoin = null,
  isPinned = false,
  onTogglePin = null,
}) {
  const memberCount = Array.isArray(channel.members)
    ? channel.members.length
    : channel.memberCount || 0;

  const time = formatChatTime(channel.lastMessageAt || channel.updatedAt || channel.createdAt);

  const handleJoinClick = (e) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(channel._id || channel.id);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className={`channel-list-item ${isSelected ? 'selected' : ''} ${isDiscoverable ? 'discoverable-channel-item' : ''}`}
      onClick={() => onSelect(channel)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(channel);
        }
      }}
      aria-label={`Select channel ${channel.name}`}
    >
      <div className="channel-icon-hash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {channel.isPrivate ? <LockIcon size={18} /> : <ChannelIcon size={18} />}
      </div>
      <div className="channel-item-details">
        <div className="channel-name-row">
          <span className="channel-name" style={{ display: 'flex', alignItems: 'center' }}>
            {channel.name}
            {isPinned && (
              <span className="pinned-badge-indicator" title="Pinned to top" style={{ marginLeft: '6px' }}>
                <PinIcon size={12} strokeWidth={2.2} />
              </span>
            )}
          </span>
        </div>
        <div className="channel-desc-row">
          <p className="channel-desc">
            {channel.lastMessage?.content
              ? `${channel.lastMessage.sender?.name ? channel.lastMessage.sender.name.split(' ')[0] + ': ' : ''}${channel.lastMessage.content}`
              : (channel.description || `${memberCount} member${memberCount === 1 ? '' : 's'}`)}
          </p>
        </div>
      </div>

      {!isDiscoverable && (
        <div className="chat-item-meta-right">
          <span className="chat-item-time">{time}</span>
          <div className="chat-item-badges">
            {onTogglePin && (
              <button
                type="button"
                className={`btn-pin-item ${isPinned ? 'pinned-active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                }}
                title={isPinned ? 'Unpin channel' : 'Pin channel'}
                aria-label={isPinned ? 'Unpin channel' : 'Pin channel'}
              >
                <PinIcon size={13} strokeWidth={2.2} />
              </button>
            )}

            {channel.unread > 0 && (
              <span className="unread-badge">{channel.unread}</span>
            )}
          </div>
        </div>
      )}



      {isDiscoverable && (
        <div className="channel-item-action">
          <button
            type="button"
            className="btn-join-channel-pill"
            onClick={handleJoinClick}
            title={`Join ${channel.name}`}
          >
            Join
          </button>
        </div>
      )}
    </div>
  );
}

export default ChannelItem;
