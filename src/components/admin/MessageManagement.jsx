import { useState, useEffect, useCallback } from 'react';
import Avatar from '../common/Avatar';
import AdminConfirmModal from './AdminConfirmModal';
import { ChannelIcon, ChatIcon } from '../common/Icons';
import { getAdminMessages, deleteAdminMessage } from '../../services/adminService';

function MessageManagement() {
  const [messages, setMessages] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [messageTypeFilter, setMessageTypeFilter] = useState('');
  const [onlyAttachments, setOnlyAttachments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Delete message confirmation modal state
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    message: null,
    loading: false,
  });

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminMessages({
        page,
        limit: 15,
        q: search || undefined,
        messageType: messageTypeFilter || undefined,
        hasAttachments: onlyAttachments ? 'true' : undefined,
      });
      if (data.success) {
        setMessages(data.messages || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch admin messages:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch messages for moderation');
    } finally {
      setLoading(false);
    }
  }, [page, search, messageTypeFilter, onlyAttachments]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const handleDeleteConfirm = async () => {
    const { message: targetMsg } = deleteModalState;
    if (!targetMsg) return;

    setDeleteModalState((prev) => ({ ...prev, loading: true }));
    setError(null);

    try {
      const res = await deleteAdminMessage(targetMsg._id);
      if (res.success) {
        setSuccessMessage('Message deleted successfully by administrator.');
        setDeleteModalState({ isOpen: false, message: null, loading: false });
        await loadMessages();
      }
    } catch (err) {
      console.error('Failed to delete message:', err.message);
      setError(err.response?.data?.message || 'Failed to delete message');
      setDeleteModalState((prev) => ({ ...prev, loading: false }));
    } finally {
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getFileUrl = (url, download = false, filename = '') => {
    if (!url) return '#';
    let finalUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      finalUrl = `${backendUrl.replace(/\/$/, '')}${url}`;
    }
    const token = sessionStorage.getItem('chatapp_token');
    
    // Construct query parameters
    const urlObj = new URL(finalUrl, window.location.origin);
    if (token && finalUrl.includes('/uploads/') && !urlObj.searchParams.has('token')) {
      urlObj.searchParams.append('token', token);
    }
    if (download) {
      urlObj.searchParams.append('download', '1');
      if (filename) {
        urlObj.searchParams.append('filename', filename);
      }
    }
    return urlObj.toString();
  };

  return (
    <div className="admin-section-container">
      {/* Control Bar: Search and Filters */}
      <div className="admin-control-bar">
        <div className="admin-search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search messages by keyword or filename..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="admin-filter-group">
          <select
            className="admin-select"
            value={messageTypeFilter}
            onChange={(e) => {
              setMessageTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="text">Text Only</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
            <option value="file">Files & Documents</option>
          </select>

          <label className="checkbox-filter-label">
            <input
              type="checkbox"
              checked={onlyAttachments}
              onChange={(e) => {
                setOnlyAttachments(e.target.checked);
                setPage(1);
              }}
            />
            <span>Only Attachments</span>
          </label>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="admin-alert-box alert-error">
          <span>⚠️ {error}</span>
          <button type="button" className="btn-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="admin-alert-box alert-success">
          <span>{successMessage}</span>
          <button type="button" className="btn-dismiss" onClick={() => setSuccessMessage(null)}>✕</button>
        </div>
      )}

      {/* Messages Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sender</th>
              <th>Content / Snippet</th>
              <th>Context</th>
              <th>Type</th>
              <th>Attachments</th>
              <th>Timestamp</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-6">
                  <span className="admin-spinner" /> Loading messages...
                </td>
              </tr>
            ) : messages.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-6 text-muted">
                  No messages found matching search criteria.
                </td>
              </tr>
            ) : (
              messages.map((msg) => {
                const isChannel = Boolean(msg.channelId);
                const contextName = isChannel
                  ? `#${msg.channelId?.name || 'channel'}`
                  : 'Direct Message';
                const hasFiles = msg.attachments && msg.attachments.length > 0;

                return (
                  <tr key={msg._id}>
                    <td>
                      <div className="user-cell">
                        <Avatar name={msg.sender?.name || 'User'} image={msg.sender?.avatar} size="small" />
                        <span className="font-semibold">{msg.sender?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="text-snippet-large">
                      {msg.content || <span className="text-muted italic">(No text content)</span>}
                    </td>
                    <td>
                      <span className="badge-context" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {isChannel ? <ChannelIcon size={13} /> : <ChatIcon size={13} />}
                        {isChannel ? (msg.channelId?.name || 'channel') : 'Direct Message'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-message-type">{msg.messageType}</span>
                    </td>
                    <td>
                      {hasFiles ? (
                        <div className="admin-attachments-cell">
                          {msg.attachments.map((att, idx) => {
                            const rawExt = (att.fileName?.split('.').pop() || '').toLowerCase();
                            const isVid =
                              att.fileType?.startsWith('video/') ||
                              ['mp4', 'webm', 'mov'].includes(rawExt);
                            return (
                              <a
                                key={idx}
                                href={getFileUrl(att.fileUrl, true, att.fileName)}
                                target="_self"
                                className={`admin-file-link-pill ${isVid ? 'admin-video-link-pill' : ''}`}
                                title={`Download ${att.fileName}`}
                                download={att.fileName}
                              >
                                {isVid ? '🎥' : '📎'} {att.fileName}
                              </a>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="text-muted">{formatDate(msg.createdAt)}</td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-action-small btn-danger"
                        onClick={() => setDeleteModalState({ isOpen: true, message: msg, loading: false })}
                        title="Delete message permanently"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="admin-pagination-footer">
        <span className="pagination-count">
          Showing <strong>{messages.length}</strong> of <strong>{totalCount}</strong> messages
        </span>
        <div className="pagination-controls">
          <button
            type="button"
            className="btn-page"
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page <= 1 || loading}
          >
            ← Previous
          </button>
          <span className="page-indicator">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            className="btn-page"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page >= totalPages || loading}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AdminConfirmModal
        isOpen={deleteModalState.isOpen}
        title="Moderate: Delete Message"
        message={`Are you sure you want to permanently delete this message sent by "${deleteModalState.message?.sender?.name || 'User'}"?`}
        confirmText="Delete Message"
        isDanger={true}
        loading={deleteModalState.loading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModalState({ isOpen: false, message: null, loading: false })}
      />
    </div>
  );
}

export default MessageManagement;
