import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
    { from: 'Bangalore', to: 'Chennai', price: '₹850', duration: '7.5 hrs', operator: 'GreenLine Volvo' },
    { from: 'Mumbai', to: 'Goa', price: '₹1450', duration: '12 hrs', operator: 'IntrCity SmartBus' },
    { from: 'Delhi', to: 'Jaipur', price: '₹599', duration: '5 hrs', operator: 'Zingbus Maxx' },
    { from: 'Hyderabad', to: 'Bangalore', price: '₹1050', duration: '9 hrs', operator: 'Kaveri Travels' },
  ];

  const quickStats = [
    { number: '10,000+', label: 'Daily Travelers' },
    { number: '150+', label: 'Verified Routes' },
    { number: '4.8 ★', label: 'Average Rating' },
    { number: '100% Instant', label: 'Booking Confirmation' },
  ];

  return (
    <main className="page-wrapper" style={{ paddingBottom: '5rem' }}>
      {/* Hero Section */}
      <section className="hero">
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', padding: '.35rem 1rem', borderRadius: '9999px', fontSize: '.85rem', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.15)', color: '#c7d2fe' }}>
          <span>✨</span> India's Next-Gen Bus Reservation Platform
        </div>
        <h1>Effortless Bus Journeys,<br />Booked in Seconds</h1>
        <p>Real-time seat layout map, zero hidden charges, and instant digital boarding passes directly to your phone.</p>
      </section>

      {/* Quick Search Widget */}
      <div className="search-card" style={{ maxWidth: '920px', margin: '0 auto 2.5rem' }}>
        <form onSubmit={handleSearch} className="search-grid">
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="home-source">📍 From</label>
            <input
              id="home-source"
              type="text"
              placeholder="Leaving from (e.g. Bangalore)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="swap-btn"
            onClick={() => {
              const temp = source;
              setSource(destination);
              setDestination(temp);
            }}
            title="Swap Origin & Destination"
          >
            ⇄
          </button>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="home-dest">🏁 To</label>
            <input
              id="home-dest"
              type="text"
              placeholder="Going to (e.g. Chennai)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="home-date">📅 Journey Date</label>
            <input
              id="home-date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '46px', fontSize: '1rem' }}>
            Find Buses &rarr;
          </button>
        </form>

        {/* Quick city suggestions */}
        <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap', fontSize: '.82rem' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Popular Hubs:</span>
          {['Bangalore', 'Chennai', 'Mumbai', 'Goa', 'Hyderabad', 'Pune', 'Delhi'].map(city => (
            <button
              key={city}
              type="button"
              onClick={() => {
                if (!source) setSource(city);
                else setDestination(city);
              }}
              style={{
                background: 'var(--secondary)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '.25rem .65rem',
                borderRadius: '9999px',
                cursor: 'pointer',
                fontSize: '.8rem',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--text)';
              }}
            >
              +{city}
            </button>
          ))}
        </div>
      </div>

      {/* Live Booking Notification Strip */}
      <div style={{
        maxWidth: '920px',
        margin: '0 auto 2.5rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '.75rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', fontSize: '.88rem' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }}></span>
          <span style={{ fontWeight: 600, color: 'var(--text)' }}>Live Activity:</span>
          <span style={{ color: 'var(--text-muted)' }}>Passenger Rahul just reserved 2 Sleeper seats on Bangalore &rarr; Chennai</span>
        </div>
        <span style={{ fontSize: '.78rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '.2rem .55rem', borderRadius: '6px' }}>
          ⚡ 12 mins ago
        </span>
      </div>

      {/* Quick Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '3.5rem' }}>
        {quickStats.map((st, i) => (
          <div key={i} className="card" style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--surface)' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>
              {st.number}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '.85rem', fontWeight: 500, marginTop: '.2rem' }}>
              {st.label}
            </div>
          </div>
        ))}
      </div>

      {/* Popular Routes */}
      <section style={{ marginBottom: '3.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Popular Express Routes</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginTop: '.2rem' }}>
              Frequently booked intercity services with guaranteed departures.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/buses')}
          >
            Explore All &rarr;
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {popularRoutes.map((route, idx) => (
            <div
              key={idx}
              className="card route-interactive-card"
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                border: '1.5px solid var(--border)',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={() => navigate(`/buses?source=${route.from}&destination=${route.to}&date=${todayStr}`)}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {route.operator}
                  </span>
                  <span style={{ fontSize: '.7rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '.2rem .5rem', borderRadius: '4px', fontWeight: 700 }}>
                    🔥 Top Rated
                  </span>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', marginTop: '.6rem', color: 'var(--text)' }}>
                  {route.from} <span style={{ color: 'var(--primary)' }}>&rarr;</span> {route.to}
                </div>
                <div style={{ fontSize: '.85rem', color: 'var(--text-muted)', marginTop: '.35rem', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                  <span>⏱️ {route.duration}</span> • <span style={{ color: '#10b981', fontWeight: 600 }}>AC Sleeper</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px dashed var(--border)' }}>
                <div>
                  <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>Fares starting</span>
                  <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.3rem' }}>{route.price}</div>
                </div>
                <span className="btn btn-sm btn-primary" style={{ padding: '.45rem .85rem', fontSize: '.82rem', borderRadius: '8px' }}>
                  Book Seat &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Why Travel With Us?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '.95rem', marginTop: '.3rem' }}>
            Engineered for reliability, live seat visibility, and lightning-fast checkouts.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">🎯</div>
            <h3>Direct Seat Selection</h3>
            <p>Pick your exact seat—window, aisle, lower berth, or sleeper with live occupancy indicators.</p>
          </div>
          <div className="feature-card">
            <div className="icon">⚡</div>
            <h3>Supabase Real-Time Engine</h3>
            <p>ACID database-level concurrency prevents race conditions and accidental double-bookings.</p>
          </div>
          <div className="feature-card">
            <div className="icon">📲</div>
            <h3>Digital Boarding Pass</h3>
            <p>Instant booking reference ID, boarding timings, and seat tags accessible straight from your browser.</p>
          </div>
          <div className="feature-card">
            <div className="icon">🛡️</div>
            <h3>Hassle-Free Cancellation</h3>
            <p>Change of plans? Cancel reservations with a single click and restore seat inventory instantly.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
