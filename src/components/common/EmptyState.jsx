import { useAuth } from '../../context/AuthContext';
import { ChatIcon, ChannelIcon, ContactsIcon } from './Icons';

function EmptyState({ onSelectTab }) {
  const { user } = useAuth();
  const org = user?.currentOrganization;

  return (
    <div className="empty-state-container">
      <div className="empty-state-card" style={{ maxWidth: '580px', width: '100%' }}>
        <div className="empty-state-icon">
          <ChatIcon size={44} color="#0284c7" strokeWidth={1.5} className="chat-empty-svg" />
        </div>
        <h2 className="empty-state-title">Welcome to {org?.name || 'V Chat'}</h2>
        <p className="empty-state-text">
          Select a conversation from the sidebar or choose a channel to start collaborating with your team in real-time.
        </p>

        <div className="empty-state-features">
          <button
            type="button"
            className="feature-pill feature-pill-btn"
            onClick={() => onSelectTab?.('chats')}
            aria-label="Navigate to Chats"
          >
            <ChatIcon size={15} />
            <span>Chats</span>
          </button>
          <button
            type="button"
            className="feature-pill feature-pill-btn"
            onClick={() => onSelectTab?.('channels')}
            aria-label="Navigate to Channels"
          >
            <ChannelIcon size={15} />
            <span>Channels</span>
          </button>
          <button
            type="button"
            className="feature-pill feature-pill-btn"
            onClick={() => onSelectTab?.('contacts')}
            aria-label="Navigate to Team Members"
          >
            <ContactsIcon size={15} />
            <span>Team Members</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmptyState;
