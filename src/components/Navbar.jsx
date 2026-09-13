import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../supabaseClient';
import ProfileModal from './ProfileModal';

export default function Navbar() {
  const { user, profile, isAdmin, logout } = useAuth();
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
            <span>🚌</span> BusReservationSystem
          </Link>
          {isLive ? (
            <span className="status-pill live" title="Connected to Supabase PostgreSQL">
              ⚡ Supabase
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
                      background: 'rgba(255, 215, 0, 0.2)',
                      border: '1px solid rgba(255, 215, 0, 0.4)',
                      borderRadius: '6px',
                      padding: '.25rem .6rem',
                      fontWeight: 700
                    }}
                  >
                    ⚙️ Admin Panel
                  </NavLink>
                </li>
              )}

              {/* User Profile Pill Button */}
              <li>
                <button
                  type="button"
                  onClick={() => setShowProfile(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.5rem',
                    background: 'rgba(255,255,255,0.18)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff',
                    padding: '.35rem .75rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '.85rem',
                    fontWeight: 600,
                    transition: 'background .2s'
                  }}
                  title="View / Edit Profile"
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#fff',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '.75rem',
                      fontWeight: 800
                    }}
                  >
                    {initial}
                  </span>
                  <span>{displayName}</span>
                </button>
              </li>

              <li>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  id="logout-btn"
                  style={{ color: '#fff', borderColor: '#fff' }}
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
                <NavLink to="/signup" className={({ isActive }) => (isActive ? 'active' : '')}>
                  Sign Up
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </>
  );
}
