import ChannelItem from './ChannelItem';
import { PinIcon } from '../common/Icons';

function ChannelList({
  channels = [],
  currentUserId,
  selectedChannel,
  onSelectChannel,
  onJoinChannel,
  onOpenCreateModal,
  searchQuery = '',
  loading = false,
  isPlanDisabled = false,
  isExpired = false,
  isSuspended = false,
  pinnedChannelIds = [],
  pinnedChatIds = [],
  onPinItem = null,
  onUnpinItem = null,
}) {
  const query = searchQuery.toLowerCase().trim();

  // Filter channels by search query
  const filteredChannels = channels.filter((ch) => {
    const name = (ch.name || '').toLowerCase();
    const desc = (ch.description || '').toLowerCase();
    return name.includes(query) || desc.includes(query);
  });

  const isChannelPinned = (ch) => {
    const id = (ch?._id || ch?.id)?.toString();
    if (!id) return false;
    return pinnedChannelIds.includes(id) || pinnedChatIds.includes(id);
  };

  // Pinned channels among filtered channels
  const pinnedChannels = filteredChannels.filter(isChannelPinned);

  // Categorize channels based on current user's membership
  const allYourChannels = filteredChannels.filter((ch) =>
    ch.members?.some((m) => (m._id || m.id || m)?.toString() === currentUserId?.toString())
  );

  // Unpinned joined channels for YOUR CHANNELS section
  const yourUnpinnedChannels = allYourChannels.filter((ch) => !isChannelPinned(ch));

  const discoverableChannels = filteredChannels.filter(
    (ch) =>
      !ch.isPrivate &&
      !ch.members?.some((m) => (m._id || m.id || m)?.toString() === currentUserId?.toString()) &&
      !isChannelPinned(ch)
  );

  const totalPinnedCount = (pinnedChatIds?.length || 0) + (pinnedChannelIds?.length || 0);
  const totalChannelsCount =
    pinnedChannels.length + yourUnpinnedChannels.length + discoverableChannels.length;

  return (
    <div className="channel-list-container">
      {/* Top Header */}
      <div className="section-sub-header">
        <div className="sub-header-title-group">
          <span className="section-sub-title">Channels</span>
        </div>
        <button
          type="button"
          className="btn-create-channel-inline"
          onClick={isPlanDisabled ? undefined : onOpenCreateModal}
          disabled={isPlanDisabled}
          title={
            isPlanDisabled
              ? (isExpired ? 'Your subscription plan has expired.' : 'Your subscription has been Ended')
              : 'Create a new channel'
          }
        >
          + New Channel
        </button>
      </div>

      {loading ? (
        <div className="empty-filter-state">Loading channels...</div>
      ) : totalChannelsCount === 0 ? (
        <div className="empty-filter-state">
          {searchQuery
            ? `No channels matching "${searchQuery}"`
            : 'No channels available. Create one to get started!'}
        </div>
      ) : (
        <div className="channel-items-scroll">
          {/* TOP PINNED CHANNELS SECTION */}
          {pinnedChannels.length > 0 && (
            <div className="channel-category-section pinned-channels-section">
              <div className="channel-category-header">
                <span className="channel-category-title">
                  <PinIcon size={12} strokeWidth={2.2} style={{ marginRight: 5 }} />
                  PINNED ({totalPinnedCount}/10)
                </span>
              </div>
              {pinnedChannels.map((channel) => {
                const chId = (channel._id || channel.id)?.toString();
                const selId = (selectedChannel?._id || selectedChannel?.id)?.toString();
                const isSelected = Boolean(selId && chId && selId === chId);

                return (
                  <ChannelItem
                    key={`pinned-${chId || Math.random()}`}
                    channel={channel}
                    isSelected={isSelected}
                    onSelect={onSelectChannel}
                    isDiscoverable={false}
                    isPinned={true}
                    onTogglePin={() => onUnpinItem?.(channel, 'channel')}
                  />
                );
              })}
            </div>
          )}

          {/* 1. YOUR CHANNELS SECTION (Unpinned only) */}
          <div className="channel-category-section">
            <div className="channel-category-header">
              <span className="channel-category-title">YOUR CHANNELS</span>
            </div>

            {allYourChannels.length === 0 ? (
              <div className="channel-section-empty">
                {query ? 'No joined channels match query' : 'You have not joined any channels yet'}
              </div>
            ) : yourUnpinnedChannels.length === 0 ? (
              <div className="channel-section-empty">
                All joined channels are pinned above
              </div>
            ) : (
              yourUnpinnedChannels.map((channel) => {
                const chId = (channel._id || channel.id)?.toString();
                const selId = (selectedChannel?._id || selectedChannel?.id)?.toString();
                const isSelected = Boolean(selId && chId && selId === chId);

                return (
                  <ChannelItem
                    key={chId || Math.random()}
                    channel={channel}
                    isSelected={isSelected}
                    onSelect={onSelectChannel}
                    isDiscoverable={false}
                    isPinned={false}
                    onTogglePin={() => onPinItem?.(channel, 'channel')}
                  />
                );
              })
            )}
          </div>

          {/* 2. DISCOVER PUBLIC CHANNELS SECTION */}
          <div className="channel-category-section">
            <div className="channel-category-header">
              <span className="channel-category-title">DISCOVER PUBLIC CHANNELS</span>
            </div>

            {discoverableChannels.length === 0 ? (
              <div className="channel-section-empty">
                {query ? 'No public channels match query' : 'No new public channels to discover'}
              </div>
            ) : (
              discoverableChannels.map((channel) => {
                const chId = (channel._id || channel.id)?.toString();
                const selId = (selectedChannel?._id || selectedChannel?.id)?.toString();
                const isSelected = Boolean(selId && chId && selId === chId);

                return (
                  <ChannelItem
                    key={chId || Math.random()}
                    channel={channel}
                    isSelected={isSelected}
                    onSelect={onSelectChannel}
                    isDiscoverable={true}
                    onJoin={onJoinChannel}
                  />
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChannelList;
