import React, { useState, useEffect, useMemo } from 'react';
import { PollIcon } from '../common/Icons';
import { votePoll, unvotePoll, formatPollRemainingTime, isPollExpired } from '../../services/pollService';

function PollModal({ isOpen, onClose, message, currentUserId, onVoteSuccess }) {
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(null);
  const [voting, setVoting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState('');

  const poll = message?.poll;

  // Find user's existing vote index
  const existingVoteIndex = useMemo(() => {
    if (!poll?.options || !currentUserId) return -1;
    return poll.options.findIndex((opt) =>
      (opt.votes || []).some(
        (v) => (v._id || v.id || v)?.toString() === currentUserId.toString()
      )
    );
  }, [poll, currentUserId]);

  const hasVoted = existingVoteIndex !== -1;

  // Initialize selected option based on user's existing vote
  useEffect(() => {
    if (existingVoteIndex !== -1) {
      setSelectedOptionIndex(existingVoteIndex);
    } else {
      setSelectedOptionIndex(null);
    }
  }, [existingVoteIndex, isOpen]);

  if (!isOpen || !poll) return null;

  const totalVotes = (poll.options || []).reduce(
    (sum, opt) => sum + (opt.votes ? opt.votes.length : 0),
    0
  );

  const expired = isPollExpired(poll.expiresAt, poll.isClosed);
  const remainingText = formatPollRemainingTime(poll.expiresAt, poll.isClosed);

  const formatExpiryDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleOptionClick = (idx) => {
    if (expired) return;
    setError('');
    // If user clicks their currently selected option which is also their existing vote, toggle off to unvote
    if (selectedOptionIndex === idx && existingVoteIndex === idx) {
      setSelectedOptionIndex(null);
    } else {
      setSelectedOptionIndex(idx);
    }
  };

  const handleRemoveVote = async () => {
    if (expired) {
      setError('This poll has expired and is no longer active.');
      return;
    }

    setVoting(true);
    setIsRemoving(true);
    setError('');

    try {
      const data = await unvotePoll(message._id || message.id);
      if (data?.success) {
        onVoteSuccess?.(data.poll || data.message?.poll, message._id || message.id);
        onClose();
      } else {
        setError(data?.message || 'Failed to remove vote');
      }
    } catch (err) {
      console.error('Remove vote failed:', err);
      setError(err.response?.data?.message || 'Failed to remove vote. Please try again.');
    } finally {
      setVoting(false);
      setIsRemoving(false);
    }
  };

  const handleVoteSubmit = async () => {
    if (expired) {
      setError('This poll has expired and is no longer accepting votes.');
      return;
    }

    // If user unselected their vote and clicked submit, execute unvote
    if (selectedOptionIndex === null) {
      if (hasVoted) {
        return handleRemoveVote();
      }
      setError('Please select an option to vote.');
      return;
    }

    // If same option as current vote, no change needed
    if (hasVoted && selectedOptionIndex === existingVoteIndex) {
      onClose();
      return;
    }

    setVoting(true);
    setIsRemoving(false);
    setError('');

    try {
      const data = await votePoll(message._id || message.id, selectedOptionIndex);
      if (data?.success) {
        onVoteSuccess?.(data.poll || data.message?.poll, message._id || message.id);
        onClose();
      } else {
        setError(data?.message || 'Failed to submit vote');
      }
    } catch (err) {
      console.error('Vote failed:', err);
      setError(err.response?.data?.message || 'Failed to submit vote. Please try again.');
    } finally {
      setVoting(false);
    }
  };

  const creatorName =
    message.sender?.name || (typeof message.sender === 'string' ? 'Teammate' : 'Teammate');

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="poll-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Header */}
        <div className="poll-modal-header">
          <div className="poll-modal-title-wrap">
            <div className="poll-icon-badge">
              <PollIcon size={20} color="#2563eb" strokeWidth={2.4} />
            </div>
            <div>
              <div className="poll-modal-badge-row">
                <span className="poll-header-label">POLL</span>
                {expired ? (
                  <span className="poll-status-pill expired">Expired / Closed</span>
                ) : (
                  <span className="poll-status-pill active">Active</span>
                )}
              </div>
              <h3 className="poll-modal-question">{poll.question}</h3>
              <p className="poll-modal-creator-meta">
                Created by <strong>{creatorName}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Expiry Banner */}
        <div className={`poll-modal-expiry-banner ${expired ? 'expired' : ''}`}>
          <span className="expiry-banner-icon">{expired ? '⛔' : '🕒'}</span>
          <div className="expiry-banner-text">
            {expired ? (
              <span>
                <strong>Poll Closed:</strong> This poll expired on {formatExpiryDate(poll.expiresAt)}. Voting is no longer active.
              </span>
            ) : (
              <span>
                <strong>{remainingText}</strong> (Ends {formatExpiryDate(poll.expiresAt)})
              </span>
            )}
          </div>
        </div>

        {error && <div className="create-poll-error-banner">⚠️ {error}</div>}

        {/* Voting Options */}
        <div className="poll-modal-options-list">
          {poll.options.map((opt, idx) => {
            const voteCount = opt.votes ? opt.votes.length : 0;
            const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
            const isSelected = selectedOptionIndex === idx;
            const isCurrentVote = (opt.votes || []).some(
              (v) => (v._id || v.id || v)?.toString() === currentUserId?.toString()
            );

            return (
              <div
                key={opt._id || idx}
                className={`poll-modal-option-card ${isSelected ? 'selected' : ''} ${expired ? 'disabled' : ''}`}
                onClick={() => handleOptionClick(idx)}
              >
                <div className="poll-modal-option-top">
                  <label
                    className="poll-radio-label"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOptionClick(idx);
                    }}
                  >
                    <input
                      type="radio"
                      name="poll-option"
                      checked={isSelected}
                      onChange={() => handleOptionClick(idx)}
                      disabled={expired}
                      className="poll-radio-input"
                    />
                    <span className="poll-option-title">{opt.text}</span>
                    {isCurrentVote && (
                      <span className="poll-my-vote-tag">Your Vote</span>
                    )}
                  </label>
                  <span className="poll-option-tally">
                    {voteCount} ({percent}%)
                  </span>
                </div>

                <div className="poll-modal-progress-track">
                  <div
                    className={`poll-modal-progress-fill ${isCurrentVote ? 'my-vote' : ''}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Summary */}
        <div className="poll-modal-summary-row">
          <span>Total Votes: <strong>{totalVotes}</strong></span>
          <span className="poll-expiry-bottom-note">
            {remainingText}
          </span>
        </div>

        {/* Actions */}
        <div className="poll-modal-actions">
          <button
            type="button"
            className="btn-create-poll-cancel"
            onClick={onClose}
          >
            Close
          </button>
          {!expired && hasVoted && (
            <button
              type="button"
              className="btn-poll-remove-vote"
              onClick={handleRemoveVote}
              disabled={voting}
            >
              {voting && isRemoving ? 'Removing...' : 'Remove Vote'}
            </button>
          )}
          {!expired && (
            <button
              type="button"
              className="btn-create-poll-submit"
              onClick={handleVoteSubmit}
              disabled={
                voting ||
                (selectedOptionIndex === null && !hasVoted) ||
                (hasVoted && selectedOptionIndex === existingVoteIndex)
              }
            >
              {voting && !isRemoving
                ? 'Saving...'
                : selectedOptionIndex === null && hasVoted
                ? 'Remove Vote'
                : hasVoted
                ? 'Change Vote'
                : 'Submit Vote'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PollModal;
