import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { isSupabaseConfigured } from '../supabaseClient';
import ProfileModal from './ProfileModal';

export default function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isLive = isSupabaseConfigured();
  const [showProfile, setShowProfile] = useState(false);

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      alert("Logout failed: " + error.message);
      return;
    }
    navigate('/');
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Passenger';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.85rem' }}>
          <Link className="brand" to="/">
            <span className="brand-logo-icon">🚌</span>
            <span className="brand-text">Bus<span className="brand-highlight">Go</span></span>
          </Link>
          {isLive ? (
            <span className="status-pill live" title="Connected to Supabase PostgreSQL">
              <span className="live-dot"></span> Supabase
            </span>
          ) : (
            <span className="status-pill demo" title="Local demo backend. Add Supabase credentials in .env to connect live.">
              🧪 Demo Mode
            </span>
          )}
        </div>

        <ul className="nav-links" id="nav-links">
          <li>
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/buses" className={({ isActive }) => (isActive ? 'active' : '')}>
              Search Buses
            </NavLink>
          </li>

          {user ? (
            <>
              <li>
                <NavLink to="/my-bookings" className={({ isActive }) => (isActive ? 'active' : '')}>
                  My Bookings
                </NavLink>
              </li>

              {isAdmin && (
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => (isActive ? 'active' : '')}
                    style={{
                      background: 'rgba(245, 158, 11, 0.2)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      borderRadius: '8px',
                      padding: '.25rem .6rem',
                      fontWeight: 700,
                      color: '#fbbf24'
                    }}
                  >
                    ⚙️ Admin
                  </NavLink>
                </li>
              )}

              {/* User Profile Pill Button */}
              <li>
                <button
                  type="button"
                  onClick={() => setShowProfile(true)}
                  className="user-profile-btn"
                  title="View / Edit Profile"
                >
                  <span className="user-avatar-initial">{initial}</span>
                  <span>{displayName}</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className="btn btn-outline btn-sm logout-nav-btn"
                  id="logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink to="/signup" className={({ isActive }) => (isActive ? 'active nav-cta' : 'nav-cta')}>
                  Sign Up ✨
                </NavLink>
              </li>
            </>
          )}

          {/* Creative Theme Mode Toggle Button */}
          <li>
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
          </li>
        </ul>
      </nav>

      {/* Profile Modal */}
      {/* Profile Modal */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}

