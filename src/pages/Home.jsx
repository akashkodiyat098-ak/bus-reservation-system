import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/buses?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}&date=${date}`);
  };

  const popularRoutes = [
    { from: 'Bangalore', to: 'Chennai', price: '₹850' },
    { from: 'Mumbai', to: 'Goa', price: '₹1450' },
    { from: 'Delhi', to: 'Jaipur', price: '₹599' },
    { from: 'Hyderabad', to: 'Bangalore', price: '₹1050' },
  ];

  return (
    <main className="page-wrapper">
      {/* Hero */}
      <section className="hero">
        <h1>🚌 Book Your Bus Ticket</h1>
        <p>Search available buses, pick your preferred seat, and confirm your booking instantly.</p>

        {/* Quick Search Widget */}
        <div style={{ maxWidth: '800px', margin: '1.5rem auto 0', background: 'var(--white)', padding: '1.5rem', borderRadius: '14px', color: 'var(--text)', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
          <form onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'flex-end', textAlign: 'left' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="home-source">From</label>
              <input
                id="home-source"
                type="text"
                placeholder="e.g. Bangalore"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="home-dest">To</label>
              <input
                id="home-dest"
                type="text"
                placeholder="e.g. Chennai"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label htmlFor="home-date">Journey Date</label>
              <input
                id="home-date"
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-success" style={{ height: '42px', fontSize: '1rem' }}>
              Search Buses &rarr;
            </button>
          </form>
        </div>
      </section>

      {/* Popular Routes */}
      <section style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>Popular Intercity Routes</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {popularRoutes.map((route, idx) => (
            <div
              key={idx}
              className="card"
              style={{ padding: '1.25rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'transform .2s' }}
              onClick={() => navigate(`/buses?source=${route.from}&destination=${route.to}&date=${todayStr}`)}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{route.from} &rarr; {route.to}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Daily departures</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>from</span>
                <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{route.price}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <h2 style={{ marginBottom: '.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Why use BusReservationSystem?</h2>
      <div className="features-grid">
        <div className="feature-card">
          <div className="icon">🔍</div>
          <h3>Easy Search</h3>
          <p>Find buses by route and journey date instantly.</p>
        </div>
        <div className="feature-card">
          <div className="icon">💺</div>
          <h3>Interactive Seat Selection</h3>
          <p>Choose your favorite lower or upper berth with live availability.</p>
        </div>
        <div className="feature-card">
          <div className="icon">⚡</div>
          <h3>Supabase Powered</h3>
          <p>ACID transactions prevent race conditions & double booking.</p>
        </div>
        <div className="feature-card">
          <div className="icon">📋</div>
          <h3>Instant Boarding Pass</h3>
          <p>View, print, or cancel tickets anytime from your dashboard.</p>
        </div>
      </div>
    </main>
  );
}
