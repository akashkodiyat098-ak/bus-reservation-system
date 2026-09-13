import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProfileModal({ isOpen, onClose }) {
  const { user, profile, updateProfile, toggleRole, isLiveAuth } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || user?.user_metadata?.phone || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Sync form state when profile loads asynchronously
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.phone !== undefined) setPhone(profile.phone || '');
  }, [profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setMsg({ type: 'error', text: 'Full name cannot be empty.' });
      return;
    }

    setSaving(true);
    setMsg(null);

    const { error } = await updateProfile({
      fullName: fullName.trim(),
      phone: phone.trim()
    });

    setSaving(false);

    if (error) {
      setMsg({ type: 'error', text: error.message || 'Failed to update profile.' });
    } else {
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setMsg(null);
      }, 2500);
    }
  };

  const initial = (fullName || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>My Account & Profile</h3>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            &times;
          </button>
        </div>

        {/* Profile Card Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--secondary)', borderRadius: '10px', marginBottom: '1.25rem' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
            {initial}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{profile?.full_name || 'Passenger'}</div>
            <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{user?.email}</div>
            <div style={{ marginTop: '.35rem', display: 'flex', gap: '.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={`badge ${profile?.role === 'admin' ? 'badge-warning' : 'badge-info'}`} style={{ fontSize: '.7rem', textTransform: 'uppercase' }}>
                {profile?.role === 'admin' ? '👑 Admin' : '👤 Passenger'}
              </span>
              <span className={`status-pill ${isLiveAuth ? 'live' : 'demo'}`} style={{ fontSize: '.7rem' }}>
                {isLiveAuth ? 'Supabase' : 'Demo'}
              </span>
              <button
                type="button"
                onClick={toggleRole}
                style={{
                  background: 'none',
                  border: '1px dashed var(--muted)',
                  borderRadius: '4px',
                  fontSize: '.7rem',
                  padding: '.15rem .45rem',
                  cursor: 'pointer',
                  color: 'var(--primary)'
                }}
                title="Toggle between user and admin roles"
              >
                Switch to {profile?.role === 'admin' ? 'Passenger' : 'Admin'}
              </button>
            </div>
          </div>
        </div>

        {msg && (
          <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1rem' }}>
            {msg.type === 'success' ? '✅' : '❌'} {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="edit-name">Full Name</label>
            <input
              id="edit-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-email">Email Address</label>
            <input
              id="edit-email"
              type="email"
              disabled
              value={user?.email || ''}
              style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
            />
            <small style={{ color: 'var(--muted)', fontSize: '.75rem' }}>Email is tied to your login identity</small>
          </div>

          <div className="form-group">
            <label htmlFor="edit-phone">Phone Number</label>
            <input
              id="edit-phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1.5 }}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner"></span> Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
