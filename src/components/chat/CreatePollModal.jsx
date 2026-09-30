import React, { useState } from 'react';
import { PollIcon } from '../common/Icons';

function CreatePollModal({ isOpen, onClose, onCreatePoll }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleOptionChange = (index, value) => {
    setError('');
    setOptions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAddOption = () => {
    if (options.length >= 10) {
      setError('Maximum 10 options allowed per poll.');
      return;
    }
    setError('');
    setOptions((prev) => [...prev, '']);
  };

  const handleRemoveOption = (indexToRemove) => {
    if (options.length <= 2) {
      setError('A poll must have at least 2 options.');
      return;
    }
    setError('');
    setOptions((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const cleanQuestion = question.trim();
    if (!cleanQuestion) {
      setError('Please enter a poll question.');
      return;
    }

    const cleanOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (cleanOptions.length < 2) {
      setError('Please provide at least 2 non-empty options.');
      return;
    }

    // Check for duplicates
    const uniqueOptions = new Set(cleanOptions.map((o) => o.toLowerCase()));
    if (uniqueOptions.size !== cleanOptions.length) {
      setError('Options must be unique.');
      return;
    }

    onCreatePoll({
      question: cleanQuestion,
      options: cleanOptions,
    });

    // Reset and close
    setQuestion('');
    setOptions(['', '']);
    setError('');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="create-poll-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="document"
      >
        <div className="create-poll-header">
          <div className="create-poll-title-wrap">
            <div className="poll-icon-badge">
              <PollIcon size={20} color="#2563eb" strokeWidth={2.4} />
            </div>
            <div>
              <h3 className="create-poll-title">Create a Poll</h3>
              <p className="create-poll-subtitle">Gather opinions and votes from your team</p>
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

        <form onSubmit={handleSubmit} className="create-poll-form">
          {error && <div className="create-poll-error-banner">⚠️ {error}</div>}

          <div className="create-poll-field">
            <label className="create-poll-label" htmlFor="poll-question-input">
              Question <span className="required-star">*</span>
            </label>
            <input
              id="poll-question-input"
              type="text"
              className="create-poll-input"
              placeholder="Ask a question (e.g. Which design direction should we pick?)..."
              value={question}
              onChange={(e) => {
                setError('');
                setQuestion(e.target.value);
              }}
              autoFocus
              maxLength={250}
            />
          </div>

          <div className="create-poll-field">
            <label className="create-poll-label">
              Answer Options <span className="required-star">*</span>
            </label>
            <div className="create-poll-options-list">
              {options.map((opt, idx) => (
                <div key={idx} className="create-poll-option-row">
                  <span className="create-poll-option-num">{idx + 1}</span>
                  <input
                    type="text"
                    className="create-poll-input option-input"
                    placeholder={`Option ${idx + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    maxLength={100}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      className="btn-remove-poll-option"
                      onClick={() => handleRemoveOption(idx)}
                      title="Remove option"
                      aria-label={`Remove option ${idx + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 10 && (
              <button
                type="button"
                className="btn-add-poll-option"
                onClick={handleAddOption}
              >
                + Add Option
              </button>
            )}
          </div>

          <div className="create-poll-expiry-banner">
            <span className="expiry-banner-icon">🕒</span>
            <div className="expiry-banner-text">
              <strong>7-Day Expiry:</strong> This poll will automatically expire exactly 7 days after creation.
            </div>
          </div>

          <div className="create-poll-actions">
            <button
              type="button"
              className="btn-create-poll-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-create-poll-submit"
              onClick={handleSubmit}
            >
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreatePollModal;
