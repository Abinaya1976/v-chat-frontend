import Avatar from '../common/Avatar';

function ContactItem({ contact, onMessageContact }) {
  return (
    <div className="contact-list-item">
      <div className="contact-avatar-wrapper">
        <Avatar
          name={contact.name}
          image={contact.avatar}
          size="medium"
        />
      </div>

      <div className="contact-details">
        <div className="contact-name-row">
          <span className="contact-name">{contact.name}</span>
        </div>
        <span className="contact-email">{contact.email}</span>
      </div>

      <button
        type="button"
        className="btn-contact-action"
        onClick={() => onMessageContact(contact)}
        aria-label={`Send message to ${contact.name}`}
        style={{ padding: '6px 12px', fontSize: '13px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="msg-icon"
          style={{ width: '14px', height: '14px', marginRight: '4px' }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Message
      </button>
    </div>
  );
}

export default ContactItem;
