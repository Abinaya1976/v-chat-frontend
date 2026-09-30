import { useState, useRef, useEffect, useCallback } from 'react';
import AttachmentPreview from './AttachmentPreview';
import { useSettings } from '../../context/SettingsContext';
import { PollIcon, MicIcon } from '../common/Icons';
import CreatePollModal from './CreatePollModal';
import VoiceRecorder from './VoiceRecorder';

// Recursively convert contentEditable DOM tree to clean Markdown
const domToMarkdown = (node) => {
  if (!node) return '';

  if (node.nodeType === 3) {
    return node.nodeValue || '';
  }

  if (node.nodeType !== 1) {
    return '';
  }

  const tagName = node.tagName.toLowerCase();

  let inner = '';
  for (const child of node.childNodes) {
    inner += domToMarkdown(child);
  }

  if (tagName === 'b' || tagName === 'strong') {
    if (!inner || !inner.trim()) return inner;
    const leading = inner.match(/^\s*/)[0];
    const trailing = inner.match(/\s*$/)[0];
    const trimmed = inner.slice(leading.length, inner.length - trailing.length);
    return `${leading}**${trimmed}**${trailing}`;
  }
  if (tagName === 'i' || tagName === 'em') {
    if (!inner || !inner.trim()) return inner;
    const leading = inner.match(/^\s*/)[0];
    const trailing = inner.match(/\s*$/)[0];
    const trimmed = inner.slice(leading.length, inner.length - trailing.length);
    return `${leading}*${trimmed}*${trailing}`;
  }
  if (tagName === 'u') {
    if (!inner || !inner.trim()) return inner;
    const leading = inner.match(/^\s*/)[0];
    const trailing = inner.match(/\s*$/)[0];
    const trimmed = inner.slice(leading.length, inner.length - trailing.length);
    return `${leading}<u>${trimmed}</u>${trailing}`;
  }
  if (tagName === 'div' || tagName === 'p') {
    return inner ? `\n${inner}` : '';
  }
  if (tagName === 'br') {
    return '\n';
  }
  if (tagName === 'span') {
    let result = inner;
    const style = node.getAttribute ? (node.getAttribute('style') || '') : '';
    if (/font-weight:\s*(bold|[7-9]00)/i.test(style) && result.trim()) {
      const leading = result.match(/^\s*/)[0];
      const trailing = result.match(/\s*$/)[0];
      const trimmed = result.slice(leading.length, result.length - trailing.length);
      result = `${leading}**${trimmed}**${trailing}`;
    }
    if (/font-style:\s*italic/i.test(style) && result.trim()) {
      const leading = result.match(/^\s*/)[0];
      const trailing = result.match(/\s*$/)[0];
      const trimmed = result.slice(leading.length, result.length - trailing.length);
      result = `${leading}*${trimmed}*${trailing}`;
    }
    if (/text-decoration:\s*underline/i.test(style) && result.trim()) {
      const leading = result.match(/^\s*/)[0];
      const trailing = result.match(/\s*$/)[0];
      const trimmed = result.slice(leading.length, result.length - trailing.length);
      result = `${leading}<u>${trimmed}</u>${trailing}`;
    }
    return result;
  }

  return inner;
};

// Helper to determine character offset within contentEditable element
const getCaretOffset = (element) => {
  let caretOffset = 0;
  try {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      caretOffset = preCaretRange.toString().length;
    }
  } catch (err) {
    // fallback
  }
  return caretOffset;
};

function MessageInput({
  onSendMessage,
  onTyping,
  onStopTyping,
  placeholder = 'Type a message...',
  disabled = false,
  replyingTo = null,
  onCancelReply = null,
  members = [],
  onCreatePoll = null,
}) {
  const { settings } = useSettings();
  const enterToSend = settings.chat?.enterToSend !== false;

  const [text, setText] = useState('');
  const [isEmpty, setIsEmpty] = useState(true);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [mentionActive, setMentionActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const attachMenuRef = useRef(null);

  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const onStopTypingRef = useRef(onStopTyping);

  useEffect(() => {
    const handleDocumentClick = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  useEffect(() => {
    onStopTypingRef.current = onStopTyping;
  }, [onStopTyping]);

  const updateActiveFormats = useCallback(() => {
    try {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
      setIsUnderline(document.queryCommandState('underline'));
    } catch (err) {
      // ignore
    }
  }, []);

  // Update active format indicators on selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const el = editorRef.current;
      if (!el) return;
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        updateActiveFormats();
        const rawText = el.innerText || '';
        const offset = getCaretOffset(el);
        checkForMention(rawText, offset);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [updateActiveFormats]);

  const MAX_IMAGE_FILE_SIZE = 20 * 1024 * 1024; // 20MB for images
  const MAX_DOC_FILE_SIZE = 100 * 1024 * 1024; // 100MB for documents / other files
  const MAX_VIDEO_FILE_SIZE = 500 * 1024 * 1024; // 500MB for video files
  const MAX_FILES_COUNT = 5;

  const checkForMention = (textVal, cursorPos) => {
    const textBeforeCursor = textVal.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);
    if (match) {
      const query = match[1];
      setMentionActive(true);
      setMentionQuery(query);
      setMentionIndex(0);
    } else {
      setMentionActive(false);
      setMentionQuery('');
    }
  };

  const handleInput = () => {
    const el = editorRef.current;
    if (!el) return;

    const rawText = el.innerText || '';
    const trimmedPlain = rawText.replace(/\n$/, '');
    const textOnly = el.textContent ? el.textContent.replace(/[\n\r\s]/g, '') : '';
    const hasNoMedia = !el.querySelector('img, video, iframe, object, embed');
    const currentlyEmpty = textOnly === '' && hasNoMedia;

    if (currentlyEmpty && el.innerHTML !== '') {
      el.innerHTML = '';
    }

    setIsEmpty(currentlyEmpty);

    const markdown = domToMarkdown(el);
    setText(markdown);

    const offset = getCaretOffset(el);
    checkForMention(rawText, offset);
    updateActiveFormats();

    if (!currentlyEmpty) {
      if (onTyping) {
        onTyping();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTypingRef.current) {
          onStopTypingRef.current();
        }
      }, 1500);
    } else {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (onStopTypingRef.current) {
        onStopTypingRef.current();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteText = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (pasteText) {
      document.execCommand('insertText', false, pasteText);
    }
    handleInput();
  };

  const handleFileSelect = (e) => {
    setFileError(null);
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    // Check prohibited executable extensions
    const DISALLOWED = ['.exe', '.bat', '.cmd', '.sh', '.vbs', '.js', '.msi', '.php', '.py', '.ps1'];
    const hasDisallowed = newFiles.some((f) => {
      const ext = '.' + (f.name.split('.').pop() || '').toLowerCase();
      return DISALLOWED.includes(ext);
    });

    if (hasDisallowed) {
      setFileError('Executable or script files cannot be uploaded.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Validate per-file size limits
    for (const file of newFiles) {
      const ext = (file.name.split('.').pop() || '').toLowerCase();
      const isVideo = file.type.startsWith('video/') || ['mp4', 'webm', 'mov'].includes(ext);
      const isImage = file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);

      if (isVideo && file.size > MAX_VIDEO_FILE_SIZE) {
        setFileError(`Video "${file.name}" exceeds the maximum allowed size of 500MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (isImage && file.size > MAX_IMAGE_FILE_SIZE) {
        setFileError(`Image "${file.name}" exceeds the maximum allowed size of 20MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      if (!isVideo && !isImage && file.size > MAX_DOC_FILE_SIZE) {
        setFileError(`Document "${file.name}" exceeds the maximum allowed size of 100MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
    }

    setSelectedFiles((prev) => {
      const combined = [...prev, ...newFiles];
      if (combined.length > MAX_FILES_COUNT) {
        setFileError(`You can attach up to ${MAX_FILES_COUNT} files per message.`);
      }
      return combined.slice(0, MAX_FILES_COUNT);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFileError(null);
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const memberItems = (members || [])
    .map((m) => {
      const id = (m._id || m.id || m)?.toString();
      const name = typeof m === 'object' ? (m.name || m.username || 'User') : 'User';
      return {
        id,
        label: `@${name}`,
        mentionText: `@${name}`,
        subtitle: typeof m === 'object' ? m.email || '' : '',
        avatar: typeof m === 'object' ? m.avatar : null,
        isAll: false,
      };
    })
    .filter((item) => {
      if (!mentionQuery) return true;
      return (
        item.label.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(mentionQuery.toLowerCase()))
      );
    });

  const suggestions = [
    ...(!mentionQuery || 'all'.startsWith(mentionQuery.toLowerCase())
      ? [
          {
            id: '__all__',
            label: '@all',
            mentionText: '@all',
            subtitle: 'Notify everyone in this chat',
            isAll: true,
          },
        ]
      : []),
    ...memberItems,
  ].slice(0, 8);

  const selectMention = (item) => {
    if (!item || !editorRef.current) return;
    const el = editorRef.current;
    el.focus();

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const offset = getCaretOffset(el);
      const textBefore = (el.innerText || '').slice(0, offset);
      const atIndex = textBefore.lastIndexOf('@');
      if (atIndex !== -1) {
        const charsToDelete = offset - atIndex;
        for (let i = 0; i < charsToDelete; i++) {
          document.execCommand('delete', false, null);
        }
        document.execCommand('insertText', false, `${item.mentionText} `);
      }
    }
    setMentionActive(false);
    setMentionQuery('');
    handleInput();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const el = editorRef.current;
    const contentToSend = el ? domToMarkdown(el).trim() : text.trim();
    const hasText = Boolean(contentToSend);
    const hasFiles = selectedFiles.length > 0;

    if ((!hasText && !hasFiles) || disabled) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (onStopTyping) {
      onStopTyping();
    }

    const filesToSend = [...selectedFiles];
    const replyToId = replyingTo ? (replyingTo._id || replyingTo.id) : null;

    if (el) {
      el.innerHTML = '';
    }
    setText('');
    setIsEmpty(true);
    setIsBold(false);
    setIsItalic(false);
    setIsUnderline(false);
    setSelectedFiles([]);
    setFileError(null);
    setMentionActive(false);

    onSendMessage(contentToSend, filesToSend, replyToId);
  };

  const toggleFormat = (formatType) => {
    const el = editorRef.current;
    if (!el || disabled) return;

    el.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }

    document.execCommand(formatType, false, null);
    updateActiveFormats();
  };

  const handleKeyDown = (e) => {
    // Keyboard shortcuts for formatting (Ctrl+B, Ctrl+I, Ctrl+U)
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        toggleFormat('bold');
        return;
      }
      if (key === 'i') {
        e.preventDefault();
        toggleFormat('italic');
        return;
      }
      if (key === 'u') {
        e.preventDefault();
        toggleFormat('underline');
        return;
      }
    }

    if (mentionActive && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(suggestions[mentionIndex] || suggestions[0]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMentionActive(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      if (enterToSend) {
        e.preventDefault();
        handleSubmit(e);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      onStopTypingRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (replyingTo && editorRef.current) {
      editorRef.current.focus();
    }
  }, [replyingTo]);

  const canSubmit = (!isEmpty || selectedFiles.length > 0) && !disabled;

  const replySenderName =
    replyingTo && typeof replyingTo.sender === 'object'
      ? replyingTo.sender?.name || 'Teammate'
      : 'Teammate';
  const replySnippet =
    replyingTo?.content ||
    (replyingTo?.attachments?.length > 0 ? `📎 ${replyingTo.attachments[0].fileName}` : 'Attachment');

  return (
    <>
      <form className="message-input-form" onSubmit={handleSubmit}>
        {/* Replying Banner */}
        {replyingTo && (
          <div className="input-reply-preview-bar">
            <div className="input-reply-left">
              <span className="input-reply-icon">↩</span>
              <div className="input-reply-text">
                <span className="input-reply-to">Replying to <strong>{replySenderName}</strong></span>
                <span className="input-reply-snippet">&quot;{replySnippet}&quot;</span>
              </div>
            </div>
            {onCancelReply && (
              <button
                type="button"
                className="btn-cancel-reply"
                onClick={onCancelReply}
                title="Cancel reply"
                aria-label="Cancel reply"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Mention Autocomplete Menu */}
        {mentionActive && suggestions.length > 0 && (
          <div className="mention-autocomplete-menu" role="listbox" aria-label="Mention suggestions">
            <div className="mention-menu-items" style={{ padding: '8px' }}>
              {suggestions.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={`mention-menu-item ${idx === mentionIndex ? 'active' : ''} ${item.isAll ? 'mention-item-all' : ''}`}
                  onClick={(e) => { e.preventDefault(); selectMention(item); }}
                  onMouseDown={(e) => { e.preventDefault(); selectMention(item); }}
                  role="option"
                  aria-selected={idx === mentionIndex}
                  style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '4px' }}
                >
                  <div className="mention-item-details">
                    <div className="mention-item-label-row">
                      <span className="mention-item-label">{item.label}</span>
                      {item.isAll && <span className="mention-all-tag-badge">Notify all</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Validation Error Banner */}
        {fileError && (
          <div className="input-file-error-banner">
            <span>⚠️ {fileError}</span>
            <button
              type="button"
              className="btn-dismiss-file-error"
              onClick={() => setFileError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Selected File Previews Strip */}
        <AttachmentPreview
          files={selectedFiles}
          onRemoveFile={handleRemoveFile}
          disabled={disabled}
        />

        {/* Text Formatting Toolbar (Bold, Italic, Underline) */}
        <div className="composer-formatting-toolbar" role="toolbar" aria-label="Text formatting options">
          <button
            type="button"
            className={`btn-format-toolbar format-bold ${isBold ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleFormat('bold')}
            disabled={disabled}
            title="Bold (Ctrl+B)"
            aria-label="Bold text"
            aria-pressed={isBold}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`btn-format-toolbar format-italic ${isItalic ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleFormat('italic')}
            disabled={disabled}
            title="Italic (Ctrl+I)"
            aria-label="Italic text"
            aria-pressed={isItalic}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`btn-format-toolbar format-underline ${isUnderline ? 'active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => toggleFormat('underline')}
            disabled={disabled}
            title="Underline (Ctrl+U)"
            aria-label="Underline text"
            aria-pressed={isUnderline}
          >
            <u>U</u>
          </button>
        </div>

        <div className="message-input-wrapper">
          {/* Hidden File Picker Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept="image/*,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
            style={{ display: 'none' }}
          />

          {/* Attachment Dropdown Menu */}
          <div className="attach-dropdown-wrapper" ref={attachMenuRef}>
            <button
              type="button"
              className={`btn-attach-file ${showAttachMenu ? 'active' : ''}`}
              onClick={() => setShowAttachMenu((prev) => !prev)}
              disabled={disabled}
              title="Attach or Create Poll"
              aria-label="Attach or Create Poll"
              aria-haspopup="true"
              aria-expanded={showAttachMenu}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>

            {showAttachMenu && (
              <div className="attach-menu-dropdown" role="menu">
                <button
                  type="button"
                  className="attach-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowAttachMenu(false);
                    fileInputRef.current?.click();
                  }}
                >
                  <div className="attach-menu-item-icon">
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                  </div>
                  <div className="attach-menu-item-text">
                    <span className="attach-menu-item-title">Attach File</span>
                    <span className="attach-menu-item-sub">Images, videos, documents</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="attach-menu-item"
                  role="menuitem"
                  onClick={() => {
                    setShowAttachMenu(false);
                    setShowCreatePollModal(true);
                  }}
                >
                  <div className="attach-menu-item-icon poll-icon-accent">
                    <PollIcon size={18} color="#2563eb" strokeWidth={2.4} />
                  </div>
                  <div className="attach-menu-item-text">
                    <span className="attach-menu-item-title">Create Poll</span>
                    <span className="attach-menu-item-sub">Ask a question with 7-day expiry</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div
            ref={editorRef}
            className="message-rich-editor"
            contentEditable={!disabled}
            data-placeholder={disabled ? 'Sending attachment...' : placeholder}
            data-empty={isEmpty ? 'true' : 'false'}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => {
              handleInput();
              updateActiveFormats();
            }}
            onMouseUp={updateActiveFormats}
            onPaste={handlePaste}
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
            tabIndex={0}
          />

          {!showVoiceRecorder ? (
            <>
              {(!isEmpty || selectedFiles.length > 0) ? (
                <button
                  type="submit"
                  className="btn-send-message"
                  disabled={!canSubmit}
                  aria-label="Send message"
                >
                  {disabled ? (
                    <span className="send-spinner" aria-hidden="true" />
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="send-icon"
                    >
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-mic-record"
                  onClick={() => setShowVoiceRecorder(true)}
                  disabled={disabled}
                  aria-label="Record voice message"
                >
                  <MicIcon size={20} />
                </button>
              )}
            </>
          ) : null}
        </div>
        
        {showVoiceRecorder && (
          <VoiceRecorder 
            disabled={disabled}
            onCancel={() => setShowVoiceRecorder(false)}
            onSend={(audioBlob) => {
              const file = new File([audioBlob], `VoiceMessage_${Date.now()}.webm`, { type: audioBlob.type || 'audio/webm' });
              onSendMessage({ messageType: 'audio' }, [file], replyingTo ? (replyingTo._id || replyingTo.id) : null);
              setShowVoiceRecorder(false);
            }}
          />
        )}
      </form>

      {showCreatePollModal && (
        <CreatePollModal
          isOpen={showCreatePollModal}
          onClose={() => setShowCreatePollModal(false)}
          onCreatePoll={(pollData) => {
            if (onCreatePoll) {
              onCreatePoll(pollData);
            }
          }}
        />
      )}
    </>
  );
}

export default MessageInput;
