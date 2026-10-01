import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createOrganization } from '../services/organizationService';

/**
 * CreateCompanyPage
 * Two modes:
 *  - If user is already authenticated: just ask for company details
 *  - If user is NOT authenticated: collect full registration + company details in one form
 */
function CreateCompanyPage({ onBack, onSuccess }) {
  const { user, login } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!companyName.trim()) {
      setError('Company name is required.');
      return;
    }

    setSubmitting(true);
    try {
      if (user) {
        // Already signed in — create org via authenticated endpoint
        const result = await createOrganization({
          name: companyName.trim(),
          description: companyDescription.trim(),
        });
        if (result.success) {
          onSuccess && onSuccess();
        } else {
          setError(result.message || 'Failed to create company.');
        }
      } else {
        // Not signed in — single-pass register + create company
        if (!name.trim() || !email.trim() || !password) {
          setError('Please fill in all fields.');
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setSubmitting(false);
          return;
        }

        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/organizations/register-company`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password,
            companyName: companyName.trim(),
            companyDescription: companyDescription.trim(),
          }),
        });
        const data = await res.json();

        if (data.success) {
          // Store token and update auth context via login
          localStorage.setItem('token', data.token);
          // Reload to let AuthContext pick up the stored token
          window.location.reload();
        } else {
          setError(data.message || 'Failed to create company.');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <div className="auth-card">
      <div className="create-company-header">
        <button className="back-link-btn" onClick={onBack} aria-label="Go back">
          ← Back
        </button>
        <h2 className="auth-title">Create a Company</h2>
        <p className="auth-subtitle">
          {user
            ? 'Set up a new workspace for your team.'
            : 'Create your account and start your company workspace.'}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Account fields — only shown when not signed in */}
        {!user && (
          <div className="form-section">
            <p className="form-section-label">Your Account</p>
            <div className="form-group">
              <label className="form-label" htmlFor="cc-name">Full Name</label>
              <input
                id="cc-name"
                type="text"
                className="form-input"
                placeholder="e.g. Abinaya"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cc-email">Work Email</label>
              <input
                id="cc-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="cc-password">Password</label>
              <input
                id="cc-password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
          </div>
        )}

        {/* Company fields */}
        <div className="form-section">
          <p className="form-section-label">Company Details</p>
          <div className="form-group">
            <label className="form-label" htmlFor="cc-company-name">Company Name</label>
            <input
              id="cc-company-name"
              type="text"
              className="form-input"
              placeholder="e.g. Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="cc-company-desc">
              Description <span className="form-label-optional">(optional)</span>
            </label>
            <input
              id="cc-company-desc"
              type="text"
              className="form-input"
              placeholder="What does your company do?"
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Creating...' : '🏢 Create Company'}
        </button>
      </form>

      {!user && (
        <div className="auth-footer">
          Already have an account?{' '}
          <button type="button" className="link-btn" onClick={onBack}>
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}

export default CreateCompanyPage;
