import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getMyOrganizations,
  createOrganization,
  switchOrganization,
} from '../../services/organizationService';
import {
  CompanyIcon,
  PlusIcon,
  AdminIcon,
  CheckIcon,
  CloseIcon,
} from '../common/Icons';
import { StatusBadge, PlanBadge, formatExpiryDate } from '../common/OrgStatusBadge';

function CompanyModal({ isOpen, onClose, onCompanySwitched }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'create'

  // My Organizations
  const [myOrgs, setMyOrgs] = useState([]);
  const [loadingMy, setLoadingMy] = useState(false);

  // Create Company Form
  const [createForm, setCreateForm] = useState({ name: '', description: '' });
  const [creating, setCreating] = useState(false);

  // Alerts
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const loadMyOrgs = useCallback(async () => {
    setLoadingMy(true);
    try {
      const res = await getMyOrganizations();
      if (res.success) {
        setMyOrgs(res.organizations || []);
      }
    } catch (err) {
      console.error('Failed to load my organizations:', err.message);
    } finally {
      setLoadingMy(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      loadMyOrgs();
    }
  }, [isOpen, loadMyOrgs]);

  if (!isOpen) return null;

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    if (!createForm.name.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const res = await createOrganization({
        name: createForm.name.trim(),
        description: createForm.description.trim(),
      });
      if (res.success) {
        setSuccess(`Company "${res.organization.name}" created successfully! You are now the Administrator.`);
        setCreateForm({ name: '', description: '' });
        await loadMyOrgs();
        setTimeout(() => {
          onCompanySwitched?.(res.organization);
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Create company failed:', err.message);
      setError(err.response?.data?.message || 'Failed to create company');
    } finally {
      setCreating(false);
    }
  };

  const handleSwitchCompany = async (org) => {
    try {
      const res = await switchOrganization(org._id);
      if (res.success) {
        onCompanySwitched?.(org);
        onClose();
        window.location.reload();
      }
    } catch (err) {
      console.error('Switch company failed:', err.message);
      setError(err.response?.data?.message || 'Failed to switch workspace');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container company-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          animation: 'modalFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="company-modal-title-group">
            <span className="modal-icon-badge">
              <CompanyIcon size={20} color="var(--primary-accent)" />
            </span>
            <div>
              <h3 className="modal-title">Company & Workspaces</h3>
              <p className="modal-subtitle">Manage your organizations and switch workspaces</p>
            </div>
          </div>
          <button type="button" className="btn-modal-close" onClick={onClose} aria-label="Close modal">
            <CloseIcon size={16} />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="company-modal-tabs">
          <button
            type="button"
            className={`company-tab-btn ${activeTab === 'my' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('my');
              setError(null);
              setSuccess(null);
            }}
          >
            <CompanyIcon size={15} />
            <span>My Companies ({myOrgs.length})</span>
          </button>
          <button
            type="button"
            className={`company-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              setError(null);
              setSuccess(null);
            }}
          >
            <PlusIcon size={15} />
            <span>Create Company</span>
          </button>
        </div>

        {/* Alert Boxes */}
        {error && (
          <div className="company-alert alert-error">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="company-alert alert-success">
            <CheckIcon size={16} color="#059669" />
            <span>{success}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body company-modal-body">
          {/* TAB 1: MY COMPANIES */}
          {activeTab === 'my' && (
            <div className="company-list-section">
              {loadingMy ? (
                <div className="text-center py-6 text-muted">
                  <span className="admin-spinner" /> Loading your companies...
                </div>
              ) : myOrgs.length === 0 ? (
                <div className="company-empty-state">
                  <span className="empty-icon-circle">
                    <CompanyIcon size={28} color="var(--primary-accent)" />
                  </span>
                  <h4>No Companies Yet</h4>
                  <p>Create a company or ask your workspace admin to invite you.</p>
                  <button
                    type="button"
                    className="btn-primary mt-3"
                    onClick={() => setActiveTab('create')}
                  >
                    + Create a Company
                  </button>
                </div>
              ) : (
                <div className="company-cards-grid">
                  {myOrgs.map((org) => (
                    <div
                      key={org._id}
                      className={`company-card ${org.isCurrent ? 'company-card-active' : ''}`}
                    >
                      <div className="company-card-main">
                        <div className="company-card-badge">
                          <CompanyIcon size={22} color="var(--primary-accent)" />
                        </div>
                        <div className="company-card-info">
                          <div className="company-name-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                            <strong className="company-card-name">{org.name}</strong>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <PlanBadge plan={org.subscription?.plan} />
                              <StatusBadge status={org.status || org.subscription?.status} expiresAt={org.subscription?.expiresAt} />
                            </div>
                          </div>
                          <div className="company-meta-row" style={{ marginTop: '4px', fontSize: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap', color: 'var(--text-muted)' }}>
                            <span>Role: <strong>{org.role === 'admin' || org.role === 'owner' ? 'Administrator' : 'Member'}</strong></span>
                            {org.subscription?.expiresAt && (
                              <span>Expires: <strong>{formatExpiryDate(org.subscription.expiresAt)}</strong></span>
                            )}
                          </div>
                          {(org.status === 'suspended' || org.subscription?.status === 'suspended') && (
                            <div style={{ marginTop: '6px', padding: '4px 8px', background: '#fee2e2', borderRadius: '4px', color: '#991b1b', fontSize: '11px', fontWeight: 600 }}>
                              ⚠️ Suspended workspace
                            </div>
                          )}
                          {org.description && (
                            <p className="company-card-desc" style={{ marginTop: '6px' }}>{org.description}</p>
                          )}
                        </div>
                      </div>

                      {!org.isCurrent && (
                        <div className="company-card-footer">
                          <button
                            type="button"
                            className="btn-action-small btn-secondary btn-switch-org"
                            onClick={() => handleSwitchCompany(org)}
                          >
                            Switch Workspace →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE COMPANY */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateCompany} className="company-create-form">
              <div className="form-group">
                <label className="form-label">Company / Organization Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp, Design Studio"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description / Industry</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="What does your company do?"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="company-create-notice">
                <AdminIcon size={16} color="var(--primary-accent)" />
                <span>As the creator, you will automatically be assigned as the Company Administrator.</span>
              </div>

              <div className="modal-footer px-0 pb-0">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setActiveTab('my')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !createForm.name.trim()}
                >
                  {creating ? 'Creating Company...' : 'Create Company'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyModal;
