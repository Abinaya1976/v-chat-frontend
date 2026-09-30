import React from 'react';
import { AlertTriangleIcon, CheckIcon, CalendarIcon, CrownIcon, ShieldStarIcon } from './Icons';

/**
 * Single source of truth for formatting expiration dates cleanly.
 * Examples:
 *   - "03 Oct 2026"
 *   - "Expired · 03 Sep 2026"
 *   - "No Expiry / Lifetime"
 */
export function formatExpiryDate(expiresAt) {
  if (!expiresAt) return 'No Expiry';
  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) return '—';

  const isExpired = new Date() > expDate;
  const formatted = expDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }); // e.g. "03 Oct 2026"

  return isExpired ? `Expired · ${formatted}` : formatted;
}

/**
 * Single centralized Status Badge component used throughout the entire application.
 * Normalizes 'active', 'pending', 'suspended', 'rejected', 'expired'.
 * Uses normal title case (Active, Pending, Suspended, Rejected, Expired) with no tick/check marks.
 */
export function StatusBadge({ status, expiresAt }) {
  const isDateExpired = expiresAt && new Date() > new Date(expiresAt);
  const normalizedStatus = isDateExpired && status === 'active' ? 'expired' : (status || 'pending').toLowerCase();

  const configs = {
    active: {
      label: 'Active',
      cls: 'org-badge-active',
    },
    pending: {
      label: 'Pending',
      cls: 'org-badge-pending',
    },
    suspended: {
      label: 'Suspended',
      cls: 'org-badge-suspended',
    },
    rejected: {
      label: 'Rejected',
      cls: 'org-badge-rejected',
    },
    expired: {
      label: 'Expired',
      cls: 'org-badge-expired',
    },
  };

  const cfg = configs[normalizedStatus] || configs.pending;

  return (
    <span className={`org-status-badge ${cfg.cls}`}>
      <span className="status-badge-text">{cfg.label}</span>
    </span>
  );
}

/**
 * Single centralized Plan Badge component.
 * Displays human-readable, clean plan names in normal title case: Free, Professional, Enterprise.
 * Uses a small rounded rectangular badge design with consistent dimensions.
 */
export function PlanBadge({ plan, fallback = null }) {
  if (!plan) {
    if (fallback) {
      return (
        <span className="org-plan-badge org-plan-none">
          <span className="plan-badge-text">{fallback}</span>
        </span>
      );
    }
    return null;
  }

  const normPlan = String(plan).toLowerCase().trim();

  const configs = {
    free: { label: 'Free', cls: 'org-plan-free' },
    professional: { label: 'Professional', cls: 'org-plan-pro' },
    enterprise: { label: 'Enterprise', cls: 'org-plan-enterprise' },
  };

  const cfg = configs[normPlan] || {
    label: normPlan.charAt(0).toUpperCase() + normPlan.slice(1),
    cls: 'org-plan-free',
  };

  return (
    <span className={`org-plan-badge ${cfg.cls}`}>
      <span className="plan-badge-text">{cfg.label}</span>
    </span>
  );
}

/**
 * Prominent, professional Organization Suspension Banner.
 * Displayed globally across the workspace main page and dashboards when status = SUSPENDED.
 */
export function SuspensionBanner({ organization, message, compact = false }) {
  const orgStatus = (
    organization?.status ||
    organization?.subscription?.status ||
    organization?.organizationStatus ||
    (typeof organization === 'string' ? organization : '') ||
    ''
  ).toLowerCase();

  const isExpired =
    orgStatus === 'expired' ||
    Boolean(
      organization?.subscription?.expiresAt &&
        new Date() > new Date(organization.subscription.expiresAt)
    );
  const isSuspended = orgStatus === 'suspended' && !isExpired;

  if (!isSuspended && !isExpired) return null;

  const title = isExpired
    ? 'Your subscription plan has expired.'
    : 'Your subscription has been Ended';

  const subMessage =
    message ||
    (isExpired
      ? 'Please contact your administrator to renew your company subscription.'
      : 'Please contact your administrator or support for assistance.');

  return (
    <div className={`org-suspension-banner ${isExpired ? 'expired' : ''} ${compact ? 'compact' : ''}`}>
      <div className="suspension-banner-icon">
        <AlertTriangleIcon size={compact ? 18 : 22} color={isExpired ? '#d97706' : '#ef4444'} />
      </div>
      <div className="suspension-banner-content">
        <strong className="suspension-banner-title">
          {title}
        </strong>
        <span className="suspension-banner-sub">
          {subMessage}
        </span>
      </div>
    </div>
  );
}

/**
 * Unified, Coherent Organization & Subscription Overview Card.
 * Displays Status [ Active ] [ Free ] and Expires together with consistent alignment.
 */
export function OrgOverviewCard({ organization, className = '' }) {
  if (!organization) return null;

  const sub = organization.subscription || {};
  const orgStatus = (organization.status || sub.status || 'pending').toLowerCase();
  const isSuspended = orgStatus === 'suspended';
  const plan = sub.plan || 'free';
  const expiresStr = formatExpiryDate(sub.expiresAt);
  const isDateExpired = sub.expiresAt && new Date() > new Date(sub.expiresAt);

  const features = organization.features || {};
  const featureList = [
    { label: 'Direct Messages', enabled: features.chat !== false },
    { label: 'Channels', enabled: features.channels !== false },
    { label: 'To-Dos', enabled: features.todos !== false },
    { label: 'Team Members', enabled: true },
    { label: 'Notifications', enabled: true },
  ];

  return (
    <div className={`org-overview-card ${isSuspended ? 'org-card-suspended' : ''} ${className}`}>
      {/* Header with Organization Name */}
      <div className="org-overview-header">
        <div className="org-title-group">
          <span className="org-header-label">Organization</span>
          <h3 className="org-header-name">{organization.name}</h3>
        </div>
      </div>

      {/* Prominent Suspension Warning if Suspended */}
      {isSuspended && (
        <div className="org-card-suspension-alert">
          <AlertTriangleIcon size={18} color="#ef4444" />
          <div>
            <strong>Your organization is currently suspended.</strong>
            <span>Please contact your organization administrator for assistance.</span>
          </div>
        </div>
      )}

      {/* Status + Plan and Expiration Grid */}
      <div className="org-metrics-grid">
        <div className="org-metric-item org-metric-status-plan">
          <span className="metric-label">Status</span>
          <div className="metric-val org-status-plan-group">
            <StatusBadge status={orgStatus} expiresAt={sub.expiresAt} />
            <PlanBadge plan={plan} />
          </div>
        </div>

        <div className="org-metric-item">
          <span className="metric-label">Expires</span>
          <div className={`metric-val metric-date ${isDateExpired ? 'date-expired' : ''}`}>
            <CalendarIcon size={13} />
            <span>{expiresStr}</span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="org-card-divider" />

      {/* Features Section */}
      <div className="org-features-section">
        <span className="features-section-title">Features</span>
        <div className="features-chips-list">
          {featureList.map((f, idx) => (
            <div key={idx} className={`feature-status-chip ${f.enabled ? 'chip-enabled' : 'chip-disabled'}`}>
              <span className="feature-check-icon">{f.enabled ? '✓' : '✕'}</span>
              <span className="feature-name">{f.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default OrgOverviewCard;
