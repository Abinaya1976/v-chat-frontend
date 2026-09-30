import React from 'react';
import { PollIcon } from '../common/Icons';
import { formatPollRemainingTime, isPollExpired } from '../../services/pollService';

function PollCard({ poll, currentUserId, onOpenModal }) {
  if (!poll || !poll.options) return null;

  const totalVotes = poll.options.reduce(
    (sum, opt) => sum + (opt.votes ? opt.votes.length : 0),
    0
  );

  const expired = isPollExpired(poll.expiresAt, poll.isClosed);
  const expiryText = formatPollRemainingTime(poll.expiresAt, poll.isClosed);

  const userHasVoted = poll.options.some((opt) =>
    (opt.votes || []).some(
      (v) => (v._id || v.id || v)?.toString() === currentUserId?.toString()
    )
  );

  return (
    <div
      className={`poll-card-container ${expired ? 'poll-card-expired' : ''}`}
      onClick={onOpenModal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenModal?.();
        }
      }}
      aria-label={`Poll: ${poll.question}. Click to view or vote.`}
    >
      <div className="poll-card-header">
        <div className="poll-card-title-row">
          <span className="poll-header-badge">
            <PollIcon size={16} color="#2563eb" strokeWidth={2.4} />
            <span className="poll-header-label">POLL</span>
          </span>
          {expired ? (
            <span className="poll-status-pill expired">Closed</span>
          ) : (
            <span className="poll-status-pill active">Active</span>
          )}
        </div>
        <h4 className="poll-question-text">{poll.question}</h4>
      </div>

      <div className="poll-card-options-list">
        {poll.options.map((opt, idx) => {
          const voteCount = opt.votes ? opt.votes.length : 0;
          const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isMyVote = (opt.votes || []).some(
            (v) => (v._id || v.id || v)?.toString() === currentUserId?.toString()
          );

          return (
            <div
              key={opt._id || idx}
              className={`poll-option-row ${isMyVote ? 'user-voted-option' : ''}`}
            >
              <div
                className="poll-option-fill"
                style={{ width: `${percent}%` }}
                aria-hidden="true"
              />
              <div className="poll-option-content">
                <div className="poll-option-left">
                  {isMyVote && <span className="poll-my-vote-check" title="Your vote">✓</span>}
                  <span className="poll-option-text">{opt.text}</span>
                </div>
                <div className="poll-option-right">
                  <span className="poll-option-count">
                    {voteCount} {voteCount === 1 ? 'vote' : 'votes'} ({percent}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="poll-card-footer">
        <div className="poll-footer-meta">
          <span className={`poll-expiry-badge ${expired ? 'is-expired' : ''}`}>
            <span className="poll-expiry-icon">{expired ? '⚠️' : '🕒'}</span>
            <span className="poll-expiry-label">{expiryText}</span>
          </span>
          <span className="poll-total-votes-count">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} total
          </span>
        </div>

        <button
          type="button"
          className="btn-poll-action-pill"
          onClick={(e) => {
            e.stopPropagation();
            onOpenModal?.();
          }}
        >
          {expired ? 'View Results' : userHasVoted ? 'Change Vote' : 'Vote'}
        </button>
      </div>
    </div>
  );
}

export default PollCard;
