import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, profile, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ borderColor: 'rgba(37,99,235,.3)', borderTopColor: 'var(--primary)', width: '32px', height: '32px' }}></div>
      </div>
    );
  }

  if (!user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${returnUrl}`} replace />;
  }

  if (!isAdmin) {
    return (
      <main className="page-wrapper">
        <div className="card" style={{ textAlign: 'center', padding: '3rem', maxWidth: '540px', margin: '2rem auto' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '.5rem' }}>Admin Access Restricted</h2>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your account (<strong>{user.email}</strong>) is currently designated with standard passenger privileges (<code>role: {profile?.role || 'user'}</code>).
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <a href="/" className="btn btn-outline">Return to Home</a>
            <a href="/login" className="btn btn-primary">Switch Account</a>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
