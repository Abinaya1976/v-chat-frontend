import ChatListItem from './ChatListItem';
import { PinIcon, SearchIcon } from '../common/Icons';
import NotificationBell from '../notifications/NotificationBell';

function ChatList({
  chats = [],
  joinedChannels = [],
  items = null,
  currentUserId,
  onlineUserIds,
  selectedChat,
  selectedChannel,
  onSelectChat,
  onSelectChannel,
  searchQuery = '',
  onSearchChange,
  loading = false,
  pinnedChatIds = [],
  pinnedChannelIds = [],
  onPinItem = null,
  onUnpinItem = null,
  onSelectNotification = null,
}) {
  // Combine direct conversations and joined channels into a single unified list
  const rawList = items || [
    ...chats,
    ...joinedChannels.filter(
      (jc) => !chats.some((c) => (c._id || c.id)?.toString() === (jc._id || jc.id)?.toString())
    ),
  ];

  // Helper to robustly identify if an item is a self-conversation for current user
  const isSelfItem = (item) => {
    if (!item) return false;
    const isChannel = Boolean(
      item.isChannel ||
      item.itemType === 'channel' ||
      (item.isPrivate !== undefined && !item.participants) ||
      (item.members && !item.participants)
    );
    if (isChannel) return false;
    if (item.isMe) return true;
    const myId = currentUserId?.toString();
    if (!myId) return false;
    if (item.participants && Array.isArray(item.participants) && item.participants.length > 0) {
      return item.participants.every((p) => {
        const pId = (p?._id || p?.id || p)?.toString();
        return pId && pId === myId;
      });
    }
    return false;
  };

  // Separate all self-chats from other chats
  const allSelfChats = rawList.filter(isSelfItem);
  const otherChats = rawList.filter((item) => !isSelfItem(item));

  // Deduplicate other chats by unique item ID
  const seenOtherIds = new Set();
  const uniqueOtherChats = otherChats.filter((item) => {
    const id = (item._id || item.id)?.toString();
    if (!id || seenOtherIds.has(id)) return false;
    seenOtherIds.add(id);
    return true;
  });

  uniqueOtherChats.sort((a, b) => {
    const timeA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Exactly ONE self-chat at the top (preferring the one with isMe or latest activity)
  let meChat = null;
  if (allSelfChats.length > 0) {
    allSelfChats.sort((a, b) => {
      if (a.isMe && !b.isMe) return -1;
      if (!a.isMe && b.isMe) return 1;
      const tA = new Date(a.lastMessageAt || a.updatedAt || a.createdAt || 0).getTime();
      const tB = new Date(b.lastMessageAt || b.updatedAt || b.createdAt || 0).getTime();
      return tB - tA;
    });
    meChat = { ...allSelfChats[0], isMe: true };
  }

  const sortedList = meChat ? [meChat, ...uniqueOtherChats] : uniqueOtherChats;

  // Helper to extract searchable text from conversation or channel
  const getSearchableName = (item) => {
    const isChannel = Boolean(
      item.isChannel ||
      item.itemType === 'channel' ||
      (item.isPrivate !== undefined && !item.participants) ||
      (item.members && !item.participants)
    );

    if (isChannel) {
      return item.name || '';
    }

    if (isSelfItem(item)) {
      return 'Me Notes to self';
    }

    if (item.participants && Array.isArray(item.participants)) {
      const otherUser = item.participants.find(
        (p) => (p._id || p.id || p)?.toString() !== currentUserId?.toString()
      );
      return otherUser?.name || 'Teammate';
    }
    return item.name || '';
  };

  const getSearchableSnippet = (item) => {
    if (item.lastMessage) {
      return typeof item.lastMessage === 'object'
        ? item.lastMessage.content || ''
        : item.lastMessage;
    }
    return '';
  };

  // Filter items by search query
  const query = searchQuery.toLowerCase().trim();
  const filteredItems = sortedList.filter((item) => {
    if (!query) return true;
    const name = getSearchableName(item).toLowerCase();
    const snippet = getSearchableSnippet(item).toLowerCase();
    const cleanQuery = query.startsWith('#') ? query.slice(1).trim() : query;
    return (
      name.includes(cleanQuery) ||
      snippet.includes(cleanQuery) ||
      name.includes(query)
    );
  });

  // Helper to check if an item is pinned
  const isItemPinned = (item) => {
    const id = (item?._id || item?.id)?.toString();
    if (!id) return false;
    return pinnedChatIds.includes(id) || pinnedChannelIds.includes(id);
  };

  const totalPinnedCount = (pinnedChatIds?.length || 0) + (pinnedChannelIds?.length || 0);
  const pinnedItems = filteredItems.filter(isItemPinned);
  const unpinnedItems = filteredItems.filter((item) => !isItemPinned(item));

  const handleSelectItem = (item) => {
    const isChannel = Boolean(
      item.isChannel ||
      item.itemType === 'channel' ||
      (item.isPrivate !== undefined && !item.participants) ||
      (item.members && !item.participants)
    );

    if (isChannel) {
      if (onSelectChannel) {
        onSelectChannel(item);
      } else if (onSelectChat) {
        onSelectChat(item);
      }
    } else {
      if (onSelectChat) {
        onSelectChat(item);
      }
    }
  };

  return (
    <div className="chat-list-container">
      <div className="section-sub-header">
        <span className="section-sub-title">CHATS</span>
        <NotificationBell onSelectNotification={onSelectNotification} />
      </div>

      <div className="sidebar-search-container">
        <div className="sidebar-search-wrapper">
          <SearchIcon size={14} className="sidebar-search-icon" />
          <input
            type="text"
            className="sidebar-search-input"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="sidebar-search-clear-btn"
              onClick={() => onSearchChange?.('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="empty-filter-state">Loading conversations...</div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-filter-state">
          {searchQuery
            ? `No conversations matching "${searchQuery}"`
            : 'No conversations yet. Start a direct chat or join a channel!'}
        </div>
      ) : (
        <div className="chat-items-scroll">
          {/* Top Pinned Section */}
          {pinnedItems.length > 0 && (
            <div className="pinned-sidebar-section">
              <div className="pinned-section-header">
                <span className="pinned-section-title">
                  <PinIcon size={12} strokeWidth={2.2} style={{ marginRight: 5 }} />
                  PINNED ({totalPinnedCount}/10)
                </span>
              </div>
              <div className="pinned-items-container">
                {pinnedItems.map((item) => {
                  const itemId = (item._id || item.id)?.toString();
                  const selectedChatId = (selectedChat?._id || selectedChat?.id)?.toString();
                  const selectedChannelId = (selectedChannel?._id || selectedChannel?.id)?.toString();
                  const isSelected =
                    Boolean(itemId && (itemId === selectedChatId || itemId === selectedChannelId));
                  const isChannel = Boolean(
                    item.isChannel ||
                    item.itemType === 'channel' ||
                    (item.isPrivate !== undefined && !item.participants) ||
                    (item.members && !item.participants)
                  );

                  return (
                    <ChatListItem
                      key={`pinned-${itemId || Math.random()}`}
                      chat={item}
                      currentUserId={currentUserId}
                      onlineUserIds={onlineUserIds}
                      isSelected={isSelected}
                      onSelect={handleSelectItem}
                      isPinned={true}
                      onTogglePin={() => onUnpinItem?.(itemId, isChannel ? 'channel' : 'chat')}
                    />
                  );
                })}
              </div>
              <div className="pinned-section-divider" />
            </div>
          )}

          {/* Main Conversations List (Unpinned only) */}
          {pinnedItems.length > 0 && unpinnedItems.length > 0 && (
            <div className="pinned-section-header" style={{ paddingTop: 4 }}>
              <span className="pinned-section-title">ALL CHATS</span>
            </div>
          )}
          {unpinnedItems.map((item) => {
            const itemId = (item._id || item.id)?.toString();
            const selectedChatId = (selectedChat?._id || selectedChat?.id)?.toString();
            const selectedChannelId = (selectedChannel?._id || selectedChannel?.id)?.toString();
            const isSelected =
              Boolean(itemId && (itemId === selectedChatId || itemId === selectedChannelId));
            const isChannel = Boolean(
              item.isChannel ||
              item.itemType === 'channel' ||
              (item.isPrivate !== undefined && !item.participants) ||
              (item.members && !item.participants)
            );

            return (
              <ChatListItem
                key={itemId || Math.random()}
                chat={item}
                currentUserId={currentUserId}
                onlineUserIds={onlineUserIds}
                isSelected={isSelected}
                onSelect={handleSelectItem}
                isPinned={false}
                onTogglePin={() => onPinItem?.(itemId, isChannel ? 'channel' : 'chat')}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChatList;
