import ContactItem from './ContactItem';

function ContactList({
  contacts = [],
  onlineUserIds,
  onMessageContact,
  searchQuery = '',
  loading = false,
}) {
  const filteredContacts = contacts.filter((c) => {
    const name = (c.name || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const role = (c.role || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || email.includes(query) || role.includes(query);
  });

  return (
    <div className="contact-list-container">
      <div className="section-sub-header">
        <span className="section-sub-title">Team Members</span>
      </div>

      {loading ? (
        <div className="empty-filter-state">Loading team members...</div>
      ) : filteredContacts.length === 0 ? (
        <div className="empty-filter-state">
          {searchQuery
            ? `No contacts matching "${searchQuery}"`
            : 'No other team members registered yet.'}
        </div>
      ) : (
        <div className="contact-items-scroll">
          {filteredContacts.map((contact) => (
            <ContactItem
              key={contact._id || contact.id}
              contact={contact}
              onMessageContact={onMessageContact}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ContactList;
