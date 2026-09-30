import { useState, useRef, useEffect } from 'react';

// Curated emoji set organized by category — lightweight, no npm dependency
const EMOJI_CATEGORIES = [
  {
    label: 'Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
      '😎', '🤩', '🥳', '😏', '🤔', '🤗', '🤭', '😬',
      '😢', '😭', '😤', '😡', '🤯', '😱', '😴', '🥱',
    ],
  },
  {
    label: 'Gestures',
    emojis: [
      '👍', '👎', '👏', '🙌', '🤝', '✊', '✌️', '🤞',
      '🫶', '💪', '☝️', '🙏', '👋', '🤙', '👊', '🫡',
    ],
  },
  {
    label: 'Hearts & Symbols',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔',
      '💯', '💥', '✨', '⭐', '🌟', '💫', '🔥', '⚡',
    ],
  },
  {
    label: 'Objects & Celebration',
    emojis: [
      '🎉', '🎊', '🎈', '🏆', '🥇', '🎯', '🚀', '💡',
      '📌', '✅', '❌', '⚠️', '💬', '👀', '🎵', '☕',
    ],
  },
];

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '😢', '😡'];

function EmojiPicker({ onSelectEmoji, onClose, triggerRef }) {
  const [activeCategory, setActiveCategory] = useState(0);
  const pickerRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Position the picker relative to the trigger button
  useEffect(() => {
    if (triggerRef?.current && pickerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const pickerHeight = 340;
      const pickerWidth = 320;
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      let top = triggerRect.bottom + 4;
      let left = triggerRect.left;

      // Flip up if not enough space below
      if (top + pickerHeight > viewportH) {
        top = triggerRect.top - pickerHeight - 4;
      }

      // Prevent going off the right edge
      if (left + pickerWidth > viewportW) {
        left = viewportW - pickerWidth - 8;
      }

      // Prevent going off the left edge
      if (left < 8) {
        left = 8;
      }

      setPosition({ top, left });
    }
  }, [triggerRef]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(e.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose, triggerRef]);

  const handleSelect = (emoji) => {
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <div
      className="emoji-picker-container"
      ref={pickerRef}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      role="dialog"
      aria-label="Emoji picker"
    >
      {/* Quick Reactions Row */}
      <div className="emoji-quick-row">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emoji-quick-btn"
            onClick={() => handleSelect(emoji)}
            aria-label={`React with ${emoji}`}
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="emoji-picker-divider" />

      {/* Category Tabs */}
      <div className="emoji-category-tabs">
        {EMOJI_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.label}
            type="button"
            className={`emoji-cat-tab ${activeCategory === idx ? 'emoji-cat-tab-active' : ''}`}
            onClick={() => setActiveCategory(idx)}
            aria-label={cat.label}
            title={cat.label}
          >
            {cat.emojis[0]}
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="emoji-picker-grid">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            className="emoji-grid-btn"
            onClick={() => handleSelect(emoji)}
            aria-label={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Category Label */}
      <div className="emoji-category-label">
        {EMOJI_CATEGORIES[activeCategory].label}
      </div>
    </div>
  );
}

export default EmojiPicker;
