import { useState, useEffect, useCallback } from 'react';
import Avatar from '../common/Avatar';
import {
  HistoryIcon,
  SearchIcon,
  UsersIcon,
  ChannelIcon,
  SettingsIcon,
  InboxIcon,
  AdminIcon,
} from '../common/Icons';
import { getAdminAuditLogs } from '../../services/adminService';

function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminAuditLogs({
        page,
        limit: 15,
        targetType: targetTypeFilter || undefined,
      });
      if (data.success) {
        setLogs(data.logs || []);
        setTotalCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, targetTypeFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? '—'
      : d.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionBadgeClass = (action = '') => {
    if (action.includes('DELETED') || action.includes('REMOVED') || action.includes('REJECTED')) return 'action-danger';
    if (action.includes('UPDATED') || action.includes('STATUS') || action.includes('ARCHIVED')) return 'action-warning';
    return 'action-info';
  };

  const getTargetIcon = (targetType) => {
    switch (targetType) {
      case 'User':
        return <UsersIcon size={14} />;
      case 'Channel':
        return <ChannelIcon size={14} />;
      case 'Organization':
        return <SettingsIcon size={14} />;
      case 'JoinRequest':
        return <InboxIcon size={14} />;
      default:
        return <AdminIcon size={14} />;
    }
  };

  // Client-side search on current page of logs (matches actor, targetName, details, or action)
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const actor = (log.admin?.name || '').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const targetName = (log.targetName || log.targetType || '').toLowerCase();
    const details = (log.details || '').toLowerCase();
    return actor.includes(q) || action.includes(q) || targetName.includes(q) || details.includes(q);
  });

  return (
    <div className="admin-section-container">
      {/* 1. Filter and Search Control Bar */}
      <div className="admin-control-bar" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div className="admin-search-input-wrapper" style={{ flex: 1 }}>
          <span className="search-icon"><SearchIcon size={15} color="var(--text-muted)" /></span>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search activity by actor, action, or target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-filter-group" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select
            className="admin-select"
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Activity Types</option>
            <option value="User">User & Role Events</option>
            <option value="Channel">Channel Events</option>
            <option value="Organization">Company Settings Events</option>
            <option value="JoinRequest">Join Request Events</option>
          </select>

          <button
            type="button"
            className="btn-action-small btn-secondary"
            onClick={loadLogs}
            disabled={loading}
            title="Refresh latest workspace activity"
          >
            <HistoryIcon size={14} style={{ marginRight: 6 }} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-alert-box alert-error">
          <span>{error}</span>
          <button type="button" className="btn-dismiss" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* 2. Audit Log Table */}
      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Admin Actor</th>
              <th>Action</th>
              <th>Target Entity</th>
              <th>Event Details</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-6">
                  <span className="admin-spinner" /> Loading audit history...
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-muted">
                  {searchTerm
                    ? `No activity records found matching "${searchTerm}".`
                    : 'No activity logs recorded for this workspace yet.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log._id}>
                  <td>
                    <div className="user-cell">
                      <Avatar name={log.admin?.name || 'Admin'} image={log.admin?.avatar} size="small" />
                      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.3' }}>
                        <span className="font-semibold" style={{ color: 'var(--text-main)' }}>
                          {log.admin?.name || 'Administrator'}
                        </span>
                        {log.admin?.email && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {log.admin.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge-audit-action ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <span className="target-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--primary-accent)', display: 'flex', alignItems: 'center' }}>
                        {getTargetIcon(log.targetType)}
                      </span>
                      <strong>{log.targetType}:</strong> {log.targetName || log.targetId || '—'}
                    </span>
                  </td>
                  <td className="text-snippet-large text-muted">{log.details || '—'}</td>
                  <td className="text-muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(log.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Pagination Footer */}
      <div className="admin-pagination-footer">
        <span className="pagination-count">
          Showing <strong>{filteredLogs.length}</strong> of <strong>{totalCount}</strong> audit records
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
    </div>
  );
}

export default AuditLogViewer;
