import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer>
      <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', textAlign: 'left' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
            <span>🚌</span> BusGo Reservation System
          </div>
          <p style={{ color: '#64748b', fontSize: '.8rem', marginTop: '.3rem' }}>
            Reliable intercity bus ticketing with live seat layouts & PostgreSQL sync.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '.85rem' }}>
          <Link to="/" style={{ color: '#94a3b8' }}>Home</Link>
          <Link to="/buses" style={{ color: '#94a3b8' }}>Search Buses</Link>
          <Link to="/my-bookings" style={{ color: '#94a3b8' }}>My Bookings</Link>
          <Link to="/admin" style={{ color: '#94a3b8' }}>Admin Panel</Link>
        </div>
      </div>

      <div style={{ maxWidth: '1180px', margin: '1.25rem auto 0', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.8rem', color: '#64748b', flexWrap: 'wrap', gap: '.5rem' }}>
        <div>&copy; {new Date().getFullYear()} BusGo Inc. All rights reserved.</div>
        <div>Built with React, Vite & Supabase</div>
      </div>
    </footer>
  );
}
