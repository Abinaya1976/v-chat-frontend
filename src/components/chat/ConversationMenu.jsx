import { useEffect, useRef } from 'react';
import { PinIcon, ReminderIcon, BellOffIcon } from '../common/Icons';

function ConversationMenu({
  isOpen,
  onClose,
  muted = false,
  onToggleMute,
  onOpenPinned,
  onEditChannel = null,
  onAddMembers = null,
  label = 'conversation',
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="conversation-menu"
      role="menu"
      aria-label={`${label} controls`}
    >
      <button
        type="button"
        className="conversation-menu-item"
        role="menuitem"
        onClick={() => {
          onToggleMute?.();
          onClose();
        }}
      >
        <span className="conv-menu-icon">{muted ? <ReminderIcon size={16} /> : <BellOffIcon size={16} />}</span>
        <span>{muted ? 'Unmute notifications' : 'Mute notifications'}</span>
      </button>

      {onOpenPinned && (
        <button
          type="button"
          className="conversation-menu-item"
          role="menuitem"
          onClick={() => {
            onOpenPinned();
            onClose();
          }}
        >
          <span className="conv-menu-icon">
            <PinIcon size={15} strokeWidth={2} />
          </span>
          <span>Pinned messages</span>
        </button>
      )}

      {onAddMembers && (
        <button
          type="button"
          className="conversation-menu-item"
          role="menuitem"
          onClick={() => {
            onAddMembers();
            onClose();
          }}
        >
          <span className="conv-menu-icon">👤➕</span>
          <span>Invite / Add Members</span>
        </button>
      )}

      {onEditChannel && (
        <button
          type="button"
          className="conversation-menu-item"
          role="menuitem"
          onClick={() => {
            onEditChannel();
            onClose();
          }}
        >
          <span className="conv-menu-icon">✏️</span>
          <span>Edit Channel</span>
        </button>
      )}
    </div>
  );
}

export default ConversationMenu;

