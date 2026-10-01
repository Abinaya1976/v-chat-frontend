import { useState, useEffect, useRef } from 'react';
import Avatar from '../common/Avatar';
import { searchMessages } from '../../services/searchService';

// Format message timestamp for search results
const formatSearchTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) {
    return `Today at ${timeStr}`;
  }
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
};

function InChatSearch({
  isOpen,
  onClose,
  conversationId = null,
  channelId = null,
  contextTitle = 'this conversation',
  onSelectMessage,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // Auto-focus input when search opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setResults([]);
      setError(null);
    }
  }, [isOpen]);

  // Reset search when conversation or channel context changes
  useEffect(() => {
    setQuery('');
    setResults([]);
    setError(null);
  }, [conversationId, channelId]);

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const debounceTimer = setTimeout(async () => {
      try {
        const params = {
          q: trimmed,
          limit: 30,
        };

        if (conversationId) {
          params.conversationId = conversationId;
        } else if (channelId) {
          params.channelId = channelId;
        }

        const data = await searchMessages(params);
        if (data.success) {
          setResults(data.messages || []);
          setTotalCount(data.totalCount || (data.messages || []).length);
        } else {
          setError(data.message || 'Failed to search messages');
        }
      } catch (err) {
        console.error('In-Chat Search Error:', err.message);
        setError(err.response?.data?.message || 'Error searching messages');
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(debounceTimer);
  }, [query, conversationId, channelId]);

  if (!isOpen) return null;

  const handleResultClick = (msg) => {
    const msgId = (msg._id || msg.id)?.toString();
    if (msgId && onSelectMessage) {
      onSelectMessage(msgId);
    }
    onClose();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <div className="inchat-search-wrapper">
      {/* Search Input Bar */}
      <div className="inchat-search-bar">
        <div className="inchat-search-input-box">
          <input
            ref={inputRef}
            type="text"
            className="inchat-search-input"
            placeholder={`Search messages in ${contextTitle}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                onClose();
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="inchat-btn-clear"
              onClick={handleClear}
              title="Clear search"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          className="inchat-btn-close"
          onClick={onClose}
          title="Close search (Esc)"
          aria-label="Close search"
        >
          Done
        </button>
      </div>

      {/* Search Results Dropdown Overlay */}
      {query.trim() && (
        <div className="inchat-results-overlay">
          <div className="inchat-results-header">
            {loading ? (
              <span>Searching in {contextTitle}...</span>
            ) : results.length > 0 ? (
              <span>
                Found <strong>{totalCount}</strong> matching {totalCount === 1 ? 'message' : 'messages'}
              </span>
            ) : (
              <span>No messages found matching &quot;{query}&quot;</span>
            )}
          </div>

          {loading ? (
            <div className="inchat-loading-state">
              <div className="search-spinner"></div>
              <span>Searching conversation...</span>
            </div>
          ) : error ? (
            <div className="inchat-error-state">⚠️ {error}</div>
          ) : results.length === 0 ? (
            <div className="inchat-empty-state">
              <p>No messages match your search term in {contextTitle}.</p>
            </div>
          ) : (
            <div className="inchat-results-list">
              {results.map((msg) => {
                const msgId = (msg._id || msg.id)?.toString();
                const senderName =
                  typeof msg.sender === 'object' ? msg.sender?.name || 'Teammate' : msg.sender || 'Teammate';
                const senderAvatar = typeof msg.sender === 'object' ? msg.sender?.avatar : '';
                const timeStr = formatSearchTime(msg.createdAt);
                const attachments = msg.attachments || [];

                return (
                  <div
                    key={msgId}
                    role="button"
                    tabIndex={0}
                    className="inchat-result-card"
                    onClick={() => handleResultClick(msg)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleResultClick(msg);
                      }
                    }}
                  >
                    <div className="inchat-result-top">
                      <div className="inchat-result-author">
                        <Avatar name={senderName} image={senderAvatar} size="small" />
                        <span className="inchat-author-name">{senderName}</span>
                      </div>
                      <span className="inchat-result-time">{timeStr}</span>
                    </div>

                    {msg.content && (
                      <p className="inchat-result-snippet">{msg.content}</p>
                    )}

                    {attachments.length > 0 && (
                      <div className="inchat-result-attachments">
                        {attachments.map((att, idx) => {
                          const isImage = att.fileType?.startsWith('image/');
                          const isVideo = att.fileType?.startsWith('video/');
                          const icon = isVideo ? '🎥' : isImage ? '📷' : '📎';
                          return (
                            <span key={idx} className="inchat-attachment-chip">
                              {icon} {att.fileName}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InChatSearch;
