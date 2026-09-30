import { useEffect, useState } from 'react';
import { getSavedMessages } from '../../services/savedMessageService';
import { ChannelIcon, ChatIcon } from '../common/Icons';

function SavedMessagesPage({ onOpenMessage, onError }) {
  const [query, setQuery] = useState('');
  const [savedMessages, setSavedMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSavedMessages({ q: query, limit: 50 })
      .then((data) => {
        if (!cancelled) setSavedMessages(data.savedMessages || []);
      })
      .catch(() => {
        if (!cancelled) onError?.('Unable to load saved messages.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [query, onError]);

  return (
    <div className="saved-messages-page">
      <div className="saved-messages-header">
        <div className="saved-page-title-group">
          <span className="saved-page-kicker">Private to you</span>
          <h2 className="saved-page-heading">Saved Messages</h2>
        </div>
        <div className="search-bar-wrapper saved-search-bar">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search saved messages..."
            aria-label="Search saved messages"
          />
        </div>
      </div>
      <div className="saved-messages-list">
        {loading && <div className="empty-filter-state">Loading saved messages...</div>}
        {!loading && savedMessages.length === 0 && (
          <div className="empty-filter-state">
            {query ? 'No saved messages found.' : "You haven't saved any messages yet."}
          </div>
        )}
        {!loading && savedMessages.map((saved) => {
          const message = saved.messageId;
          const unavailable = saved.unavailable;
          const deleted = !unavailable && (!message || message.deleted);
          const senderName = message?.sender?.name || 'Teammate';
          const contentPreview = unavailable
            ? 'This message is no longer available.'
            : deleted
            ? 'This message was deleted.'
            : message.content || 'Attachment';
          const location = saved.channelId ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ChannelIcon size={12} /> {saved.channelId.name || 'Channel'}
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ChatIcon size={12} /> Direct message
            </span>
          );

          return (
            <button
              type="button"
              key={saved._id}
              className={`saved-message-item ${deleted || unavailable ? 'saved-message-unavailable' : ''}`}
              onClick={() => !deleted && !unavailable && onOpenMessage(saved)}
              disabled={deleted || unavailable}
            >
              <div className="saved-message-meta">
                <strong className="saved-sender-name">{senderName}</strong>
                <span className="saved-location-tag">{location}</span>
              </div>
              <span className="saved-message-content">{contentPreview}</span>
              <small className="saved-message-timestamp">
                Saved {new Date(saved.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </small>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default SavedMessagesPage;
