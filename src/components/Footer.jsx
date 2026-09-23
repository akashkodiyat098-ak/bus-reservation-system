import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', textAlign: 'left' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
            <span style={{ fontSize: '1.5rem', filter: 'drop-shadow(0 2px 8px rgba(99, 102, 241, 0.6))' }}>🚌</span>
            <span>Bus<span style={{ color: '#818cf8' }}>Go</span></span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '.85rem', marginTop: '.4rem', maxWidth: '380px', lineHeight: 1.5 }}>
            Next-generation bus ticketing platform with interactive live seat maps, instant digital passes, and instant sync.
          </p>
          <div style={{ display: 'flex', gap: '.6rem', marginTop: '.75rem' }}>
            <span style={{ fontSize: '.75rem', background: 'rgba(255,255,255,0.06)', padding: '.2rem .6rem', borderRadius: '4px', color: '#cbd5e1' }}>
              🔒 256-bit Encrypted
            </span>
            <span style={{ fontSize: '.75rem', background: 'rgba(255,255,255,0.06)', padding: '.2rem .6rem', borderRadius: '4px', color: '#cbd5e1' }}>
              ⚡ Real-time Availability
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '2rem', fontSize: '.9rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Explore</span>
            <Link to="/" style={{ color: '#94a3b8' }}>Home</Link>
            <Link to="/buses" style={{ color: '#94a3b8' }}>Search Buses</Link>
            <Link to="/my-bookings" style={{ color: '#94a3b8' }}>My Bookings</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
            <span style={{ color: '#ffffff', fontWeight: 700, fontSize: '.8rem', textTransform: 'uppercase', letterSpacing: '.05em' }}>Manage</span>
            <Link to="/admin" style={{ color: '#94a3b8' }}>Admin Panel</Link>
            <Link to="/login" style={{ color: '#94a3b8' }}>Sign In</Link>
            <Link to="/signup" style={{ color: '#94a3b8' }}>Create Account</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1180px', margin: '2rem auto 0', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.82rem', color: '#64748b', flexWrap: 'wrap', gap: '.5rem' }}>
        <div>&copy; {new Date().getFullYear()} BusGo Technologies. Crafted for seamless travel.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          <span>Powered by React &bull; Vite &bull; Supabase</span>
        </div>
      </div>
    </footer>
  );
}
