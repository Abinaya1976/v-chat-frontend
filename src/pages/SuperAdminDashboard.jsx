import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/common/Avatar';
import {
  ShieldStarIcon,
  BuildingIcon,
  UsersIcon,
  AlertTriangleIcon,
  ToggleOnIcon,
  ToggleOffIcon,
  CalendarIcon,
  CrownIcon,
  SlidersIcon,
  CreditCardIcon,
  RefreshIcon,
  SearchIcon,
  CheckIcon,
  CloseIcon,
  OverviewIcon,
  LogoutIcon,
} from '../components/common/Icons';
import {
  getPlatformStats,
  getAllOrganizations,
  getOrganizationDetail,
  activateOrganization,
  rejectOrganization,
  suspendOrganization,
  updateSubscription,
  updateFeatures,
} from '../services/superAdminService';
import { StatusBadge, PlanBadge, formatExpiryDate } from '../components/common/OrgStatusBadge';

// ─── Stat card component ─────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="sa-stat-card" style={{ '--sa-accent': accent }}>
      <div className="sa-stat-icon">
        <Icon size={22} color={accent} />
      </div>
      <div className="sa-stat-body">
        <span className="sa-stat-value">{value ?? '—'}</span>
        <span className="sa-stat-label">{label}</span>
      </div>
    </div>
  );
}

// ─── Approval / Activation Modal ─────────────────────────────────────────────
function ApprovalModal({ org, onClose, onApproved }) {
  const todayStr = new Date().toISOString().substring(0, 10);
  const defaultEndFree = new Date();
  defaultEndFree.setDate(defaultEndFree.getDate() + 30);
  const defaultEndFreeStr = defaultEndFree.toISOString().substring(0, 10);

  const [plan, setPlan] = useState(org?.subscription?.plan || 'free');
  const [startDate, setStartDate] = useState(org?.subscription?.startedAt ? org.subscription.startedAt.substring(0, 10) : todayStr);
  const [endDate, setEndDate] = useState(org?.subscription?.expiresAt ? org.subscription.expiresAt.substring(0, 10) : defaultEndFreeStr);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handlePlanChange = (newPlan) => {
    setPlan(newPlan);
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    if (newPlan === 'free') {
      end.setDate(end.getDate() + 30);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }
    setEndDate(end.toISOString().substring(0, 10));
  };

  const handleApprove = async () => {
    if (!startDate || !endDate) {
      setError('Please provide both Start Date and End Date.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End Date must be strictly after Start Date.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await activateOrganization(org._id, { plan, startDate, endDate });
      onApproved(org, plan);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal-card sa-sub-card" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div className="sa-modal-title-row">
            <CheckIcon size={22} color="#16a34a" />
            <h3>Activate Organization</h3>
          </div>
          <p className="sa-modal-subtitle">
            <BuildingIcon size={14} /> <strong>{org?.name}</strong> (Requested by: {org?.createdBy?.name || 'Owner'})
          </p>
          <button className="sa-modal-close" onClick={onClose}><CloseIcon size={18} /></button>
        </div>

        <div className="sa-form-grid">
          <div className="sa-form-group">
            <label className="sa-form-label">Plan</label>
            <select
              className="sa-form-select"
              value={plan}
              onChange={(e) => handlePlanChange(e.target.value)}
            >
              <option value="free">Free</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="sa-form-group">
            <label className="sa-form-label">Start Date</label>
            <input
              type="date"
              className="sa-form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="sa-form-group">
            <label className="sa-form-label">End Date</label>
            <input
              type="date"
              className="sa-form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {error && <div className="sa-error-msg">{error}</div>}

        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sa-btn sa-btn-success" onClick={handleApprove} disabled={saving}>
            {saving ? 'Activating...' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Rejection Modal ─────────────────────────────────────────────────────────
function RejectionModal({ org, onClose, onRejected }) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleReject = async () => {
    setSaving(true);
    setError(null);
    try {
      await rejectOrganization(org._id, { reason });
      onRejected(org, reason);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal-card sa-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="sa-confirm-header">
          <AlertTriangleIcon size={24} color="#ef4444" />
          <h3>Reject Organization Request</h3>
        </div>
        <p className="sa-confirm-msg">
          Are you sure you want to decline the registration request for <strong>"{org?.name}"</strong>? The organization creator will not receive workspace access.
        </p>

        <div className="sa-form-group" style={{ marginTop: '12px' }}>
          <label className="sa-form-label">Rejection Reason (Optional)</label>
          <textarea
            className="sa-form-input"
            rows="3"
            placeholder="e.g. Incomplete company information or invalid business details"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && <div className="sa-error-msg">{error}</div>}

        <div className="sa-confirm-actions">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sa-btn sa-btn-danger" onClick={handleReject} disabled={saving}>
            {saving ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation Dialog ─────────────────────────────────────────────────────
function ConfirmDialog({ isOpen, title, message, confirmLabel, confirmDanger, onConfirm, onCancel }) {
  if (!isOpen) return null;
  return (
    <div className="sa-modal-overlay" onClick={onCancel}>
      <div className="sa-modal-card sa-confirm-card" onClick={(e) => e.stopPropagation()}>
        <div className="sa-confirm-header">
          <AlertTriangleIcon size={24} color={confirmDanger ? '#ef4444' : '#d97706'} />
          <h3>{title}</h3>
        </div>
        <p className="sa-confirm-msg">{message}</p>
        <div className="sa-confirm-actions">
          <button className="sa-btn sa-btn-ghost" onClick={onCancel}>Cancel</button>
          <button
            className={`sa-btn ${confirmDanger ? 'sa-btn-danger' : 'sa-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Feature Controls Modal ──────────────────────────────────────────────────
function FeaturesModal({ org, onClose, onSaved }) {
  const [features, setFeatures] = useState({
    chat: org?.features?.chat !== false,
    channels: org?.features?.channels !== false,
    todos: org?.features?.todos !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const toggle = (key) => setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateFeatures(org._id, features);
      onSaved(features);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update features');
    } finally {
      setSaving(false);
    }
  };

  const featureList = [
    { key: 'chat', label: 'Direct Messaging & Chat', desc: 'Allows members to send direct messages' },
    { key: 'channels', label: 'Channels', desc: 'Allows creating and using public/private channels' },
    { key: 'todos', label: 'To-Dos', desc: 'Allows members to create and manage tasks' },
  ];

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal-card sa-features-card" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div className="sa-modal-title-row">
            <SlidersIcon size={20} color="var(--primary-accent)" />
            <h3>Feature Controls</h3>
          </div>
          <p className="sa-modal-subtitle">
            <BuildingIcon size={14} /> {org?.name}
          </p>
          <button className="sa-modal-close" onClick={onClose}><CloseIcon size={18} /></button>
        </div>

        <div className="sa-features-list">
          {featureList.map((f) => (
            <div key={f.key} className={`sa-feature-row ${features[f.key] ? 'enabled' : 'disabled'}`}>
              <div className="sa-feature-info">
                <span className="sa-feature-label">{f.label}</span>
                <span className="sa-feature-desc">{f.desc}</span>
              </div>
              <button
                className="sa-feature-toggle"
                onClick={() => toggle(f.key)}
                title={features[f.key] ? 'Click to disable' : 'Click to enable'}
              >
                {features[f.key]
                  ? <ToggleOnIcon size={32} color="var(--primary-accent)" />
                  : <ToggleOffIcon size={32} color="var(--text-muted)" />
                }
              </button>
            </div>
          ))}
        </div>

        {error && <div className="sa-error-msg">{error}</div>}

        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sa-btn sa-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription Modal ──────────────────────────────────────────────────────
function SubscriptionModal({ org, onClose, onSaved }) {
  const [form, setForm] = useState({
    plan: org?.subscription?.plan || 'free',
    status: org?.subscription?.status || 'pending',
    startedAt: org?.subscription?.startedAt ? org.subscription.startedAt.substring(0, 10) : '',
    expiresAt: org?.subscription?.expiresAt ? org.subscription.expiresAt.substring(0, 10) : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateSubscription(org._id, form);
      onSaved(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal-card sa-sub-card" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <div className="sa-modal-title-row">
            <CreditCardIcon size={20} color="var(--primary-accent)" />
            <h3>Subscription Settings</h3>
          </div>
          <p className="sa-modal-subtitle">
            <BuildingIcon size={14} /> {org?.name}
          </p>
          <button className="sa-modal-close" onClick={onClose}><CloseIcon size={18} /></button>
        </div>

        <div className="sa-form-grid">
          <div className="sa-form-group">
            <label className="sa-form-label">Plan</label>
            <select
              className="sa-form-select"
              value={form.plan}
              onChange={(e) => setForm((p) => ({ ...p, plan: e.target.value }))}
            >
              <option value="free">Free</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="sa-form-group">
            <label className="sa-form-label">Status</label>
            <select
              className="sa-form-select"
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
            >
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="sa-form-group">
            <label className="sa-form-label">Start Date</label>
            <input
              type="date"
              className="sa-form-input"
              value={form.startedAt}
              onChange={(e) => setForm((p) => ({ ...p, startedAt: e.target.value }))}
            />
          </div>

          <div className="sa-form-group">
            <label className="sa-form-label">Expiry Date</label>
            <input
              type="date"
              className="sa-form-input"
              value={form.expiresAt}
              onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
            />
          </div>
        </div>

        {error && <div className="sa-error-msg">{error}</div>}

        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="sa-btn sa-btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Organization row ────────────────────────────────────────────────────────
function OrgRow({ org, onApprove, onReject, onSuspend, onFeatures }) {
  const sub = org.subscription || {};
  const orgStatus = org.status || sub.status || 'pending';
  const expiryStr = formatExpiryDate(sub.expiresAt);
  const isPending = orgStatus === 'pending';
  const isRejected = orgStatus === 'rejected';
  const isActive = orgStatus === 'active';
  const isSuspended = orgStatus === 'suspended';

  return (
    <div className={`sa-org-row ${isPending ? 'sa-row-pending' : ''}`}>
      <div className="sa-org-main">
        <div className="sa-org-icon">
          <BuildingIcon size={18} color="var(--primary-accent, #0284c7)" />
        </div>
        <div className="sa-org-info">
          <span className="sa-org-name" title={org.name}>{org.name}</span>
          <span className="sa-org-meta">
            <UsersIcon size={12} /> {org.memberCount || 0} {org.memberCount === 1 ? 'member' : 'members'}
            {org.primaryAdmin && (
              <> · Requested by {org.primaryAdmin.name}</>
            )}
            {isRejected && org.rejectionReason && (
              <span className="sa-rejection-note" style={{ color: '#ef4444', display: 'block', fontSize: '11px' }}>
                Reason: {org.rejectionReason}
              </span>
            )}
          </span>
        </div>
      </div>

      <div className="sa-org-status">
        <StatusBadge status={orgStatus} expiresAt={sub.expiresAt} />
      </div>

      <div className="sa-org-plan">
        {sub.plan ? (
          <PlanBadge plan={sub.plan} />
        ) : (
          <span className="sa-empty-dash" style={{ color: 'var(--text-muted, #64748b)', fontSize: '13px', fontWeight: 500 }}>—</span>
        )}
      </div>

      <div className="sa-org-expiry">
        <span>{expiryStr}</span>
      </div>

      <div className="sa-org-actions">
        {isPending && (
          <>
            <button className="sa-btn sa-btn-sm sa-btn-ghost" onClick={() => onFeatures(org)} title="Manage Features">
              <SlidersIcon size={13} /> Features
            </button>
            <button className="sa-btn sa-btn-sm sa-btn-success" onClick={() => onApprove(org)} title="Activate Organization">
              <CheckIcon size={13} /> Activate
            </button>
          </>
        )}

        {isActive && (
          <>
            <button className="sa-btn sa-btn-sm sa-btn-ghost" onClick={() => onFeatures(org)} title="Manage Features">
              <SlidersIcon size={13} /> Features
            </button>
            <button className="sa-btn sa-btn-sm sa-btn-danger" onClick={() => onSuspend(org)} title="Suspend Organization">
              <AlertTriangleIcon size={13} /> Suspend
            </button>
          </>
        )}

        {isSuspended && (
          <>
            <button className="sa-btn sa-btn-sm sa-btn-ghost" onClick={() => onFeatures(org)} title="Manage Features">
              <SlidersIcon size={13} /> Features
            </button>
            <button className="sa-btn sa-btn-sm sa-btn-success" onClick={() => onApprove(org)} title="Reactivate Organization">
              <CheckIcon size={13} /> Activate
            </button>
          </>
        )}

        {isRejected && (
          <button className="sa-btn sa-btn-sm sa-btn-ghost" onClick={() => onApprove(org)} title="Re-evaluate / Approve">
            <CheckIcon size={13} /> Re-evaluate
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Super Admin Dashboard ──────────────────────────────────────────────
function SuperAdminDashboard() {
  const { user, logout, socket } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Organizations state
  const [orgs, setOrgs] = useState([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [orgsTotal, setOrgsTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [approvalModal, setApprovalModal] = useState(null);
  const [rejectionModal, setRejectionModal] = useState(null);
  const [featuresModal, setFeaturesModal] = useState(null);
  const [subscriptionModal, setSubscriptionModal] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMsg({ msg, isError });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await getPlatformStats();
      if (data.success) setStats(data.stats);
    } catch (err) {
      console.error('Stats error:', err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadOrgs = useCallback(async () => {
    setOrgsLoading(true);
    try {
      const params = { limit: 50 };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (statusFilter) params.status = statusFilter;
      const data = await getAllOrganizations(params);
      if (data.success) {
        setOrgs(data.organizations || []);
        setOrgsTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error('Orgs error:', err.message);
    } finally {
      setOrgsLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    if (activeTab === 'organizations') loadOrgs();
  }, [activeTab, loadOrgs]);

  // Real-time listener for incoming company registration requests
  useEffect(() => {
    if (!socket) return;
    const handleCompanyRequest = () => {
      showToast('New organization registration request received!');
      loadStats();
      if (activeTab === 'organizations') loadOrgs();
    };
    const handleStatusChanged = () => {
      loadStats();
      if (activeTab === 'organizations') loadOrgs();
    };

    socket.on('superadmin:company_request', handleCompanyRequest);
    socket.on('org:statusChanged', handleStatusChanged);

    return () => {
      socket.off('superadmin:company_request', handleCompanyRequest);
      socket.off('org:statusChanged', handleStatusChanged);
    };
  }, [socket, activeTab, loadStats, loadOrgs]);

  // Approve Callback
  const handleApproved = (org, plan) => {
    showToast(`"${org.name}" has been approved and activated on ${plan.toUpperCase()} plan.`);
    loadOrgs();
    loadStats();
  };

  // Reject Callback
  const handleRejected = (org, reason) => {
    showToast(`"${org.name}" registration request was declined.`);
    loadOrgs();
    loadStats();
  };

  // Suspend
  const handleSuspend = (org) => {
    setConfirmDialog({
      title: 'Suspend Organization',
      message: `Are you sure you want to suspend "${org.name}"? Members will lose access to protected workspace features until reactivated.`,
      confirmLabel: 'Suspend',
      confirmDanger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        setActionLoading(true);
        try {
          await suspendOrganization(org._id);
          showToast(`"${org.name}" has been suspended.`);
          loadOrgs();
          loadStats();
        } catch (err) {
          showToast(err.response?.data?.message || 'Failed to suspend', true);
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  const handleFeaturesSaved = () => {
    showToast('Feature entitlements updated.');
    loadOrgs();
  };

  const handleSubscriptionSaved = () => {
    showToast('Subscription updated.');
    loadOrgs();
    loadStats();
  };

  return (
    <div className="sa-root">
      {/* Toast Notification */}
      {toastMsg && (
        <div className={`sa-toast ${toastMsg.isError ? 'sa-toast-error' : 'sa-toast-success'}`}>
          {toastMsg.isError ? <AlertTriangleIcon size={16} /> : <CheckIcon size={16} />}
          <span>{toastMsg.msg}</span>
        </div>
      )}

      {/* Sidebar */}
      <aside className="sa-sidebar">
        <div className="sa-sidebar-brand">
          <ShieldStarIcon size={26} color="#fff" />
          <div className="sa-brand-text">
            <span className="sa-brand-title">Flock</span>
            <span className="sa-brand-sub">Platform Admin</span>
          </div>
        </div>

        <nav className="sa-sidebar-nav">
          <button
            className={`sa-nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <OverviewIcon size={18} />
            <span>Dashboard</span>
          </button>
          <button
            className={`sa-nav-btn ${activeTab === 'organizations' ? 'active' : ''}`}
            onClick={() => setActiveTab('organizations')}
          >
            <BuildingIcon size={18} />
            <span>Organizations</span>
            {stats?.pendingOrgs > 0 && (
              <span className="sa-nav-badge">{stats.pendingOrgs}</span>
            )}
          </button>
        </nav>

        <div className="sa-sidebar-user">
          <Avatar name={user?.name} size="small" />
          <div className="sa-sidebar-user-info">
            <span className="sa-sidebar-user-name">{user?.name}</span>
            <span className="sa-sidebar-user-role">Super Admin</span>
          </div>
          <button className="sa-btn-logout" onClick={logout} title="Logout">
            <LogoutIcon size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="sa-main">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="sa-panel">
            <div className="sa-panel-header">
              <div>
                <h1 className="sa-panel-title">Platform Dashboard</h1>
                <p className="sa-panel-subtitle">Overview of all organizations and platform health</p>
              </div>
              <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={loadStats} disabled={statsLoading}>
                <RefreshIcon size={14} /> {statsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {statsLoading ? (
              <div className="sa-loading">Loading platform statistics...</div>
            ) : (
              <>
                <div className="sa-stats-grid">
                  <StatCard label="Total Organizations" value={stats?.totalOrgs} icon={BuildingIcon} accent="#0284c7" />
                  <StatCard label="Active" value={stats?.activeOrgs} icon={CheckIcon} accent="#16a34a" />
                  <StatCard label="Pending Approval" value={stats?.pendingOrgs} icon={CalendarIcon} accent="#d97706" />
                  <StatCard label="Suspended" value={stats?.suspendedOrgs} icon={AlertTriangleIcon} accent="#ef4444" />
                  <StatCard label="Expired" value={stats?.expiredOrgs} icon={AlertTriangleIcon} accent="#9ca3af" />
                  <StatCard label="Total Users" value={stats?.totalUsers} icon={UsersIcon} accent="#7c3aed" />
                </div>

                <div className="sa-plan-summary">
                  <h2 className="sa-section-title">Subscription Plans</h2>
                  <div className="sa-plan-grid">
                    <div className="sa-plan-card sa-plan-card-free">
                      <div className="sa-plan-card-header">
                        <PlanBadge plan="free" />
                      </div>
                      <div className="sa-plan-card-price">
                        <span className="sa-price-currency">₹</span>
                        <span className="sa-price-amount">0</span>
                        <span className="sa-price-period">/mo</span>
                      </div>
                      <div className="sa-plan-card-features">
                        <div className="sa-plan-feature">
                          <UsersIcon size={16} color="var(--text-muted)" />
                          <span>Up to 25 employees</span>
                        </div>
                        <div className="sa-plan-feature">
                          <CheckIcon size={16} color="#16a34a" />
                          <span>Basic chat & channels</span>
                        </div>
                      </div>
                    </div>
                    <div className="sa-plan-card sa-plan-card-pro">
                      <div className="sa-plan-card-header">
                        <PlanBadge plan="professional" />
                        <span className="sa-plan-popular">Popular</span>
                      </div>
                      <div className="sa-plan-card-price">
                        <span className="sa-price-currency">₹</span>
                        <span className="sa-price-amount">100</span>
                        <span className="sa-price-period"> / month</span>
                      </div>
                      <div className="sa-plan-card-features">
                        <div className="sa-plan-feature">
                          <UsersIcon size={16} color="var(--text-muted)" />
                          <span>Unlimited employees</span>
                        </div>
                        <div className="sa-plan-feature">
                          <CheckIcon size={16} color="#16a34a" />
                          <span>Advanced organization tools</span>
                        </div>
                      </div>
                    </div>
                    <div className="sa-plan-card sa-plan-card-enterprise">
                      <div className="sa-plan-card-header">
                        <PlanBadge plan="enterprise" />
                      </div>
                      <div className="sa-plan-card-price">
                        <span className="sa-price-amount" style={{ fontSize: '1.5rem' }}>Custom</span>
                      </div>
                      <div className="sa-plan-card-features">
                        <div className="sa-plan-feature">
                          <UsersIcon size={16} color="var(--text-muted)" />
                          <span>Unlimited employees</span>
                        </div>
                        <div className="sa-plan-feature">
                          <CheckIcon size={16} color="#16a34a" />
                          <span>Dedicated support & SSO</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ORGANIZATIONS TAB */}
        {activeTab === 'organizations' && (
          <div className="sa-panel">
            <div className="sa-panel-header">
              <div>
                <h1 className="sa-panel-title">Organizations</h1>
                <p className="sa-panel-subtitle">{orgsTotal} total organizations</p>
              </div>
              <button className="sa-btn sa-btn-ghost sa-btn-sm" onClick={loadOrgs} disabled={orgsLoading}>
                <RefreshIcon size={14} /> {orgsLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {/* Search + filter bar */}
            <div className="sa-filter-bar">
              <div className="sa-search-box">
                <SearchIcon size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  className="sa-search-input"
                  placeholder="Search organizations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadOrgs()}
                />
                {searchQuery && (
                  <button className="sa-search-clear" onClick={() => setSearchQuery('')}>
                    <CloseIcon size={13} />
                  </button>
                )}
              </div>
              <select
                className="sa-form-select sa-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Approval</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Column headers */}
            <div className="sa-org-list-header">
              <span className="sa-col-org">Organization</span>
              <span className="sa-col-status">Status</span>
              <span className="sa-col-plan">Plan</span>
              <span className="sa-col-expires">Expires</span>
              <span className="sa-col-actions">Actions</span>
            </div>

            {/* Organization rows */}
            <div className="sa-org-list">
              {orgsLoading ? (
                <div className="sa-loading">Loading organizations...</div>
              ) : orgs.length === 0 ? (
                <div className="sa-empty-state">
                  <BuildingIcon size={32} color="var(--text-muted)" />
                  <p>No organizations found.</p>
                </div>
              ) : (
                orgs.map((org) => (
                  <OrgRow
                    key={org._id}
                    org={org}
                    onApprove={(o) => setApprovalModal(o)}
                    onReject={(o) => setRejectionModal(o)}
                    onSuspend={handleSuspend}
                    onFeatures={(o) => setFeaturesModal(o)}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {approvalModal && (
        <ApprovalModal
          org={approvalModal}
          onClose={() => setApprovalModal(null)}
          onApproved={handleApproved}
        />
      )}

      {rejectionModal && (
        <RejectionModal
          org={rejectionModal}
          onClose={() => setRejectionModal(null)}
          onRejected={handleRejected}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel}
        confirmDanger={confirmDialog?.confirmDanger}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />

      {featuresModal && (
        <FeaturesModal
          org={featuresModal}
          onClose={() => setFeaturesModal(null)}
          onSaved={handleFeaturesSaved}
        />
      )}

      {subscriptionModal && (
        <SubscriptionModal
          org={subscriptionModal}
          onClose={() => setSubscriptionModal(null)}
          onSaved={handleSubscriptionSaved}
        />
      )}
    </div>
  );
}

export default SuperAdminDashboard;
