import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Register({ onSwitchToLogin, onBack, initialEmail = '', invitationToken = null }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccessMsg('');

    // Client-side validation
    if (!name.trim() || !email.trim() || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    const result = await register(name, email, password, invitationToken);
    setIsSubmitting(false);

    if (result.success) {
      if (invitationToken) {
        setSuccessMsg('Account created and joined company workspace! Loading...');
        setTimeout(() => {
          window.location.href = '/';
        }, 1200);
      } else {
        setSuccessMsg('Account created successfully! Redirecting to login...');
        setTimeout(() => {
          onSwitchToLogin();
        }, 1200);
      }
    } else {
      setLocalError(result.error);
    }
  };

  return (
    <div className="auth-card">
      {onBack && (
        <button className="back-link-btn" onClick={onBack} aria-label="Go back">← Back</button>
      )}
      <h2 className="auth-title">Create an Account</h2>
      <p className="auth-subtitle">
        {invitationToken ? 'Accept your invitation and join your team' : 'Join Your Team — team communication platform'}
      </p>

      {localError && <div className="alert alert-error">{localError}</div>}
      {successMsg && <div className="alert alert-success">{successMsg}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label" htmlFor="register-name">Full Name</label>
          <input
            id="register-name"
            type="text"
            className="form-input"
            placeholder="e.g. Abinaya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-email">Email Address</label>
          <input
            id="register-email"
            type="email"
            className="form-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting || Boolean(initialEmail)}
            readOnly={Boolean(initialEmail)}
            required
          />
          {initialEmail && (
            <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
              Locked to your invited email address
            </small>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="register-password">Password</label>
          <input
            id="register-password"
            type="password"
            className="form-input"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account?{' '}
        <button
          type="button"
          className="link-btn"
          onClick={onSwitchToLogin}
        >
          Login
        </button>
      </div>
    </div>
  );
}

export default Register;
