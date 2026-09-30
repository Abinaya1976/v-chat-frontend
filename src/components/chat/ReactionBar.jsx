import { useState, useRef } from 'react';
import EmojiPicker from './EmojiPicker';

function ReactionBar({ reactions = [], currentUserId, onReaction }) {
  const [hoveredEmoji, setHoveredEmoji] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const addBtnRef = useRef(null);

  if (!onReaction) return null;

  const myId = currentUserId?.toString();

  // Filter out empty reactions (no users)
  const validReactions = reactions.filter(
    (r) => r.users && r.users.length > 0
  );

  if (validReactions.length === 0) return null;

  const handleReactionClick = (emoji) => {
    onReaction(emoji);
  };

  const handlePickerSelect = (emoji) => {
    onReaction(emoji);
  };

  // Build tooltip text for a reaction
  const getTooltipText = (reaction) => {
    if (!reaction.users || reaction.users.length === 0) return '';
    const names = reaction.users.map((u) => {
      if (typeof u === 'object') {
        const uid = (u._id || u.id)?.toString();
        return uid === myId ? 'You' : (u.name || 'Teammate');
      }
      return u.toString() === myId ? 'You' : 'Teammate';
    });

    if (names.length <= 4) {
      return names.join(', ');
    }
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} others`;
  };

  // Check if current user has reacted with this emoji
  const hasUserReacted = (reaction) => {
    return reaction.users.some((u) => {
      const uid = (typeof u === 'object' ? (u._id || u.id) : u)?.toString();
      return uid === myId;
    });
  };

  return (
    <div className="reaction-bar">
      {validReactions.map((reaction) => {
        const isActive = hasUserReacted(reaction);
        const tooltipText = getTooltipText(reaction);

        return (
          <div
            key={reaction.emoji}
            className="reaction-pill-wrapper"
            onMouseEnter={() => setHoveredEmoji(reaction.emoji)}
            onMouseLeave={() => setHoveredEmoji(null)}
          >
            <button
              type="button"
              className={`reaction-pill ${isActive ? 'reaction-pill-active' : ''}`}
              onClick={() => handleReactionClick(reaction.emoji)}
              aria-label={`${isActive ? 'Remove' : 'Add'} ${reaction.emoji} reaction (${reaction.users.length})`}
              title={tooltipText}
            >
              <span className="reaction-emoji">{reaction.emoji}</span>
              <span className="reaction-count">{reaction.users.length}</span>
            </button>

            {/* Tooltip on hover */}
            {hoveredEmoji === reaction.emoji && tooltipText && (
              <div className="reaction-tooltip">
                <span className="reaction-tooltip-emoji">{reaction.emoji}</span>
                <span className="reaction-tooltip-names">{tooltipText}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* Add Reaction Button */}
      <button
        type="button"
        className="reaction-add-btn"
        ref={addBtnRef}
        onClick={() => setShowPicker((prev) => !prev)}
        aria-label="Add a reaction"
        title="Add a reaction"
      >
        <span className="reaction-add-icon">+</span>
        <span className="reaction-add-emoji">😊</span>
      </button>

      {showPicker && (
        <EmojiPicker
          onSelectEmoji={handlePickerSelect}
          onClose={() => setShowPicker(false)}
          triggerRef={addBtnRef}
        />
      )}
    </div>
  );
}

export default ReactionBar;
