import { useState, useEffect, useCallback } from 'react';
import {
  getAdminOrganizationSettings,
  updateAdminOrganizationSettings,
} from '../../services/adminService';
import { AdminIcon, MailIcon, UsersIcon, ChannelIcon, LockIcon } from '../common/Icons';

function OrganizationSettings() {
  const [settings, setSettings] = useState({
    companyName: '',
    companyDescription: '',
    requireJoinApproval: true,
    allowPublicChannels: true,
    allowPrivateChannels: true,
    allowUserChannelCreation: true,
    allowMemberInvites: true,
    allowMemberChannelDeletion: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrganizationSettings();
      if (data.success && data.settings) {
        setSettings({
          companyName: data.settings.companyName || '',
          companyDescription: data.settings.companyDescription || '',
          requireJoinApproval: Boolean(data.settings.requireJoinApproval ?? true),
          allowPublicChannels: Boolean(data.settings.allowPublicChannels ?? true),
          allowPrivateChannels: Boolean(data.settings.allowPrivateChannels ?? true),
          allowUserChannelCreation: Boolean(data.settings.allowUserChannelCreation ?? true),
          allowMemberInvites: Boolean(data.settings.allowMemberInvites ?? true),
          allowMemberChannelDeletion: Boolean(data.settings.allowMemberChannelDeletion ?? false),
        });
      }
    } catch (err) {
      console.error('Failed to load organization settings:', err.message);
      setError(err.response?.data?.message || 'Failed to load organization settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleToggle = async (field) => {
    const nextValue = !settings[field];
    const newSettings = { ...settings, [field]: nextValue };
    setSettings(newSettings);
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await updateAdminOrganizationSettings({ [field]: nextValue });
      if (res.success) {
        setSuccessMessage('Organization policy updated in real time.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Failed to update organization setting:', err.message);
      setError(err.response?.data?.message || 'Failed to update setting');
      setSettings(settings);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTextSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await updateAdminOrganizationSettings({
        companyName: settings.companyName,
        companyDescription: settings.companyDescription,
      });
      if (res.success) {
        setSuccessMessage('Company details saved successfully.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save company details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section-container">
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

      <div className="admin-settings-card" style={{ marginBottom: '24px' }}>
        <div className="admin-settings-header">
          <h3>General Company Info</h3>
          <p className="text-muted">Company profile details visible in workspace search and title header.</p>
        </div>

        <form onSubmit={handleSaveTextSettings} style={{ padding: '0 20px 20px 20px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Company Name</label>
            <input
              type="text"
              className="form-input"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Company Description</label>
            <textarea
              className="form-input"
              rows="3"
              value={settings.companyDescription}
              onChange={(e) => setSettings({ ...settings, companyDescription: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save General Info'}
          </button>
        </form>
      </div>

      <div className="admin-settings-card">
        <div className="admin-settings-header">
          <h3>Member & Channel Governance Policies</h3>
          <p className="text-muted">
            Configure workspace-wide permissions for join requests and channels. Enforced directly on the backend.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-6">
            <span className="admin-spinner" /> Loading organization settings...
          </div>
        ) : (
          <div className="admin-settings-list">
            {/* Setting 1: Require Admin Approval for Join Requests */}
            <div className="admin-setting-item">
              <div className="setting-info">
                <div className="setting-title-row">
                  <span className="setting-icon"><AdminIcon size={16} color="var(--primary-accent)" /></span>
                  <strong>Require Approval for Join Requests</strong>
                  <span className={`setting-status-tag ${settings.requireJoinApproval ? 'tag-enabled' : 'tag-disabled'}`}>
                    {settings.requireJoinApproval ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="setting-description">
                  When ON, new users requesting to join must be approved by an Admin or Owner before accessing workspace channels.
                </p>
              </div>
              <div className="setting-toggle-wrapper">
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.requireJoinApproval}
                    onChange={() => handleToggle('requireJoinApproval')}
                    disabled={saving}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            </div>

            {/* Setting 2: Allow Members to Invite */}
            <div className="admin-setting-item">
              <div className="setting-info">
                <div className="setting-title-row">
                  <span className="setting-icon"><MailIcon size={16} color="var(--primary-accent)" /></span>
                  <strong>Allow Admins to Invite Teammates</strong>
                  <span className={`setting-status-tag ${settings.allowMemberInvites ? 'tag-enabled' : 'tag-disabled'}`}>
                    {settings.allowMemberInvites ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="setting-description">
                  When enabled, admins can invite new colleagues to join this company.
                </p>
              </div>
              <div className="setting-toggle-wrapper">
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.allowMemberInvites}
                    onChange={() => handleToggle('allowMemberInvites')}
                    disabled={saving}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            </div>

            {/* Setting 3: Allow Users to Create Channels */}
            <div className="admin-setting-item">
              <div className="setting-info">
                <div className="setting-title-row">
                  <span className="setting-icon"><UsersIcon size={16} color="var(--primary-accent)" /></span>
                  <strong>Allow Members to Create Channels</strong>
                  <span className={`setting-status-tag ${settings.allowUserChannelCreation ? 'tag-enabled' : 'tag-disabled'}`}>
                    {settings.allowUserChannelCreation ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="setting-description">
                  When turned OFF, only workspace administrators can create new channels. Normal users receive 403 on creation.
                </p>
              </div>
              <div className="setting-toggle-wrapper">
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.allowUserChannelCreation}
                    onChange={() => handleToggle('allowUserChannelCreation')}
                    disabled={saving}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            </div>

            {/* Setting 4: Allow Public Channels */}
            <div className="admin-setting-item">
              <div className="setting-info">
                <div className="setting-title-row">
                  <span className="setting-icon"><ChannelIcon size={16} color="var(--primary-accent)" /></span>
                  <strong>Allow Public Channels</strong>
                  <span className={`setting-status-tag ${settings.allowPublicChannels ? 'tag-enabled' : 'tag-disabled'}`}>
                    {settings.allowPublicChannels ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="setting-description">
                  When enabled, public channels can be created for everyone in the company to discover and join.
                </p>
              </div>
              <div className="setting-toggle-wrapper">
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.allowPublicChannels}
                    onChange={() => handleToggle('allowPublicChannels')}
                    disabled={saving}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            </div>

            {/* Setting 5: Allow Private Channels */}
            <div className="admin-setting-item">
              <div className="setting-info">
                <div className="setting-title-row">
                  <span className="setting-icon"><LockIcon size={16} color="var(--primary-accent)" /></span>
                  <strong>Allow Private Channels</strong>
                  <span className={`setting-status-tag ${settings.allowPrivateChannels ? 'tag-enabled' : 'tag-disabled'}`}>
                    {settings.allowPrivateChannels ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="setting-description">
                  When enabled, private channels accessible only to invited teammates can be created.
                </p>
              </div>
              <div className="setting-toggle-wrapper">
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.allowPrivateChannels}
                    onChange={() => handleToggle('allowPrivateChannels')}
                    disabled={saving}
                  />
                  <span className="slider-round"></span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganizationSettings;
