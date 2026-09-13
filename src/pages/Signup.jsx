import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { user, signup, isLiveAuth } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = fullName.trim();
    const mail = email.trim();
    const tel = phone.trim();

    // Client-side validation
    if (!name || !mail || !password || !confirmPassword) {
      setMsg({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }

    if (password.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setSubmitting(true);
    setMsg(null);

    const { data, error } = await signup(mail, password, name, tel);

    setSubmitting(false);

    if (error) {
      setMsg({ type: 'error', text: error.message || 'Registration failed.' });
      return;
    }

    if (data?.session) {
      setMsg({ type: 'success', text: 'Account created successfully! Redirecting…' });
      setTimeout(() => {
        navigate('/');
      }, 1200);
    } else {
      setMsg({
        type: 'success',
        text: 'Account registered! Please check your email to verify your account, then log in. (Or disable email confirmation in Supabase settings for instant login).'
      });
    }
  };

  const getAlertIcon = (type) => {
    if (type === 'error') return '❌';
    if (type === 'success') return '✅';
    return 'ℹ️';
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.3rem' }}>
          <h2 style={{ margin: 0 }}>Create account 🚀</h2>
          <span className={`status-pill ${isLiveAuth ? 'live' : 'demo'}`} style={{ fontSize: '.7rem' }}>
            {isLiveAuth ? '⚡ Supabase Auth' : '🧪 Demo Auth'}
          </span>
        </div>
        <p className="subtitle">Register to book bus tickets and receive e-tickets instantly.</p>

        {msg && (
          <div id="msg-box">
            <div className={`alert alert-${msg.type}`}>
              {getAlertIcon(msg.type)} {msg.text}
            </div>
          </div>
        )}

        <form id="signup-form" noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full-name">Full Name *</label>
            <input
              type="text"
              id="full-name"
              placeholder="e.g. John Doe"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address *</label>
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
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password * <small style={{ color: 'var(--muted)' }}>(min 6 characters)</small>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
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

          <div className="form-group">
            <label htmlFor="confirm-password">Confirm Password *</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirm-password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            id="signup-btn"
            style={{ width: '100%', height: '44px', marginTop: '.5rem' }}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner"></span> Creating Account…
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
