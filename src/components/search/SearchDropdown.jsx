import { useState } from 'react';
import Avatar from '../common/Avatar';

// Helper to highlight matching keyword
const HighlightMatch = ({ text = '', query = '' }) => {
  if (!query || !text) return <span>{text}</span>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="search-highlight">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </span>
  );
};

function SearchDropdown({
  query = '',
  results = { messages: [], files: [], channels: [], users: [] },
  loading = false,
  activeFilter = 'all',
  onFilterChange,
  onSelectResult,
  onClose,
}) {
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const totalCount =
    (results.messages?.length || 0) +
    (results.files?.length || 0) +
    (results.channels?.length || 0) +
    (results.users?.length || 0);

  return (
    <div className="search-dropdown-menu" role="dialog" aria-label="Search Results">
      {/* Category Tabs Header */}
      <div className="search-dropdown-header">
        <div className="search-category-tabs">
          <button
            type="button"
            className={`search-tab-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => onFilterChange('all')}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            className={`search-tab-pill ${activeFilter === 'messages' ? 'active' : ''}`}
            onClick={() => onFilterChange('messages')}
          >
            Messages ({results.messages?.length || 0})
          </button>
          <button
            type="button"
            className={`search-tab-pill ${activeFilter === 'files' ? 'active' : ''}`}
            onClick={() => onFilterChange('files')}
          >
            Files ({results.files?.length || 0})
          </button>
          <button
            type="button"
            className={`search-tab-pill ${activeFilter === 'channels' ? 'active' : ''}`}
            onClick={() => onFilterChange('channels')}
          >
            Channels ({results.channels?.length || 0})
          </button>
          <button
            type="button"
            className={`search-tab-pill ${activeFilter === 'users' ? 'active' : ''}`}
            onClick={() => onFilterChange('users')}
          >
            People ({results.users?.length || 0})
          </button>
        </div>

        <button
          type="button"
          className="btn-close-search-dropdown"
          onClick={onClose}
          aria-label="Close search"
        >
          ✕
        </button>
      </div>

      {/* Results Content Body */}
      <div className="search-dropdown-body">
        {loading ? (
          <div className="search-status-message">
            <span className="search-spinner" /> Searching workspace...
          </div>
        ) : totalCount === 0 ? (
          <div className="search-status-message">
            No results found for &ldquo;<strong>{query}</strong>&rdquo;
          </div>
        ) : (
          <div className="search-results-list">
            {/* 1. Messages Section */}
            {(activeFilter === 'all' || activeFilter === 'messages') &&
              results.messages?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-label">Messages</div>
                  {results.messages.map((msg) => {
                    const isChannel = Boolean(msg.channelId);
                    const contextLabel = isChannel
                      ? `#${msg.channelId?.name || 'channel'}`
                      : 'Direct Message';
                    const senderName = msg.sender?.name || 'Teammate';

                    return (
                      <div
                        key={msg._id}
                        className="search-result-item"
                        onClick={() => onSelectResult(msg, 'message')}
                      >
                        <Avatar
                          name={senderName}
                          image={msg.sender?.avatar}
                          size="small"
                        />
                        <div className="search-item-info">
                          <div className="search-item-header">
                            <span className="search-item-sender">{senderName}</span>
                            <span className="search-item-context">{contextLabel}</span>
                            <span className="search-item-time">{formatTime(msg.createdAt)}</span>
                          </div>
                          <div className="search-item-snippet">
                            <HighlightMatch text={msg.content} query={query} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* 2. Files Section */}
            {(activeFilter === 'all' || activeFilter === 'files') &&
              results.files?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-label">Files & Media</div>
                  {results.files.map((msg) => {
                    const isChannel = Boolean(msg.channelId);
                    const contextLabel = isChannel
                      ? `#${msg.channelId?.name || 'channel'}`
                      : 'Direct Message';
                    const senderName = msg.sender?.name || 'Teammate';
                    const attachment = msg.attachments?.[0];
                    const rawExt = (attachment?.fileName?.split('.').pop() || '').toLowerCase();
                    const isVideo =
                      msg.messageType === 'video' ||
                      attachment?.fileType?.startsWith('video/') ||
                      ['mp4', 'webm', 'mov'].includes(rawExt);
                    const ext = rawExt.toUpperCase() || 'FILE';

                    return (
                      <div
                        key={msg._id}
                        className={`search-result-item search-file-item ${isVideo ? 'search-video-item' : ''}`}
                        onClick={() => onSelectResult(msg, 'file')}
                      >
                        <div className={`search-file-badge ${isVideo ? 'video-badge-highlight' : ''}`}>
                          {isVideo ? '🎥 ' + ext : ext}
                        </div>
                        <div className="search-item-info">
                          <div className="search-item-header">
                            <span className="search-file-name">
                              <HighlightMatch
                                text={attachment?.fileName || 'Attachment'}
                                query={query}
                              />
                            </span>
                            <span className="search-item-context">{contextLabel}</span>
                            <span className="search-item-time">{formatTime(msg.createdAt)}</span>
                          </div>
                          <div className="search-item-meta">
                            Shared by {senderName} {msg.content && `• "${msg.content}"`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            {/* 3. Channels Section */}
            {(activeFilter === 'all' || activeFilter === 'channels') &&
              results.channels?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-label">Channels</div>
                  {results.channels.map((ch) => (
                    <div
                      key={ch._id}
                      className="search-result-item search-channel-item"
                      onClick={() => onSelectResult(ch, 'channel')}
                    >
                      <span className="search-channel-hash">#</span>
                      <div className="search-item-info">
                        <div className="search-item-header">
                          <span className="search-channel-name">
                            <HighlightMatch text={ch.name} query={query} />
                          </span>
                          {ch.isPrivate && (
                            <span className="search-badge-private"></span>
                          )}
                        </div>
                        {ch.description && (
                          <div className="search-item-snippet">
                            <HighlightMatch text={ch.description} query={query} />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            {/* 4. People Section */}
            {(activeFilter === 'all' || activeFilter === 'users') &&
              results.users?.length > 0 && (
                <div className="search-section">
                  <div className="search-section-label">People</div>
                  {results.users.map((u) => (
                    <div
                      key={u._id}
                      className="search-result-item search-user-item"
                      onClick={() => onSelectResult(u, 'user')}
                    >
                      <Avatar name={u.name} image={u.avatar} size="small" />
                      <div className="search-item-info">
                        <div className="search-item-header">
                          <span className="search-user-name">
                            <HighlightMatch text={u.name} query={query} />
                          </span>
                        </div>
                        <div className="search-user-email">
                          <HighlightMatch text={u.email} query={query} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchDropdown;
