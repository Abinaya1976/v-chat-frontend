import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Login({ onSwitchToRegister, onBack, initialEmail = '', invitationToken = null }) {
  const { login } = useAuth();
  const [email, setEmail] = useState(initialEmail || '');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email.trim() || !password) {
      setLocalError('Please enter both email and password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password, invitationToken);
    setIsSubmitting(false);

    if (!result.success) {
      setLocalError(result.error);
    }
  };

  return (
    <div className="auth-card">
      {onBack && (
        <button className="back-link-btn" onClick={onBack} aria-label="Go back">← Back</button>
      )}
      <h2 className="auth-title">Welcome Back</h2>
      <p className="auth-subtitle">
        {invitationToken ? 'Sign in to accept your invitation' : 'Sign in to Your Workspace'}
      </p>

      {localError && <div className="alert alert-error">{localError}</div>}

      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label" htmlFor="login-email">Email Address</label>
          <input
            id="login-email"
            type="email"
            className="form-input"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="form-input"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Login'}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account?{' '}
        <button
          type="button"
          className="link-btn"
          onClick={onSwitchToRegister}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

export default Login;
