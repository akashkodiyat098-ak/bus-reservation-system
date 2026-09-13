import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState(null); // { type: 'error' | 'success' | 'info', text: string }
  const [submitting, setSubmitting] = useState(false);

  // Forgot password state
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState(null);
  const [resetting, setResetting] = useState(false);

  const { user, login, resetPassword, isLiveAuth } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '/';

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [user, navigate, redirectTarget]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password) {
      setMsg({ type: 'error', text: 'Please enter both your email and password.' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    const { error } = await login(email.trim(), password);

    setSubmitting(false);

    if (error) {
      const errLower = (error.message || '').toLowerCase();
      if (errLower.includes('invalid') || errLower.includes('credentials')) {
        setMsg({ type: 'error', text: 'Incorrect email or password. Please try again.' });
      } else if (errLower.includes('not confirmed') || errLower.includes('confirm')) {
        setMsg({
          type: 'error',
          text: 'Email not confirmed yet. Please check your inbox for the verification link, or disable "Confirm email" in Supabase Auth settings.'
        });
      } else {
        setMsg({ type: 'error', text: error.message || 'Login failed. Please check your credentials.' });
      }
      return;
    }

    setMsg({ type: 'success', text: 'Login successful! Redirecting…' });
    setTimeout(() => {
      navigate(redirectTarget, { replace: true });
    }, 800);
  };

  const handleFillDemo = () => {
    setEmail('demo@example.com');
    setPassword('password123');
    setMsg({ type: 'info', text: 'Filled demo credentials! Click "Log In" to continue.' });
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetMsg({ type: 'error', text: 'Please enter your registered email address.' });
      return;
    }

    setResetting(true);
    setResetMsg(null);

    const { error } = await resetPassword(resetEmail.trim());

    setResetting(false);

    if (error) {
      setResetMsg({ type: 'error', text: error.message });
    } else {
      setResetMsg({ type: 'success', text: 'Password reset link sent to your email (if registered)!' });
    }
  };

  const getAlertIcon = (type) => {
    if (type === 'error') return '❌';
    if (type === 'success') return '✅';
    return 'ℹ️';
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
          <h2 style={{ margin: 0 }}>Welcome back 👋</h2>
          <span className={`status-pill ${isLiveAuth ? 'live' : 'demo'}`} style={{ fontSize: '.7rem' }}>
            {isLiveAuth ? '⚡ Supabase Auth' : '🧪 Demo Auth'}
          </span>
        </div>
        <p className="subtitle">Log in to manage bookings and board with ease.</p>

        {redirectTarget !== '/' && (
          <div className="alert alert-info" style={{ fontSize: '.85rem', marginBottom: '1rem' }}>
            ℹ️ Please log in to continue to your requested page.
          </div>
        )}

        {msg && (
          <div id="msg-box">
            <div className={`alert alert-${msg.type}`}>
              {getAlertIcon(msg.type)} {msg.text}
            </div>
          </div>
        )}

        <form id="login-form" noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => { setShowResetModal(true); setResetEmail(email); }}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '.8rem', cursor: 'pointer', padding: 0 }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative', marginTop: '.4rem' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  color: 'var(--muted)'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            id="login-btn"
            style={{ width: '100%', height: '44px', marginTop: '.5rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner"></span> Logging In…
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        {/* 1-Click Demo Fill Shortcut */}
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)', textAlign: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ width: '100%', fontSize: '.85rem' }}
            onClick={handleFillDemo}
          >
            ⚡ Auto-Fill Demo Credentials (demo@example.com)
          </button>
        </div>

        <div className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Reset Password</h3>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: '1rem' }}>
              Enter your email and we will send you a link to reset your password.
            </p>

            {resetMsg && (
              <div className={`alert alert-${resetMsg.type}`} style={{ marginBottom: '1rem' }}>
                {getAlertIcon(resetMsg.type)} {resetMsg.text}
              </div>
            )}

            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label htmlFor="reset-email">Your Email Address</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowResetModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                  disabled={resetting}
                >
                  {resetting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
