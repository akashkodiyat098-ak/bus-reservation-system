import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchBuses, getDistinctCities } from '../services/busService';
import { isSupabaseConfigured } from '../supabaseClient';

export default function Buses() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().split('T')[0];

  const [source, setSource] = useState(searchParams.get('source') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [journeyDate, setJourneyDate] = useState(searchParams.get('date') || todayStr);

  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableCities, setAvailableCities] = useState([]);
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('departure'); // 'departure' | 'price' | 'rating'

  const isLive = isSupabaseConfigured();

  // Load cities list once
  useEffect(() => {
    getDistinctCities().then(setAvailableCities);
  }, []);

  // Fetch buses on filter/search change
  const fetchBuses = async () => {
    setLoading(true);
    const { data } = await searchBuses({ source, destination });
    setBuses(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, destination]);

  const handleSwap = () => {
    const temp = source;
    setSource(destination);
    setDestination(temp);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBuses();
  };

  const handleSelectSeats = (busId) => {
    navigate(`/seats?busId=${busId}&date=${encodeURIComponent(journeyDate)}`);
  };

  // Filter & Sort
  const filteredBuses = buses
    .filter(bus => {
      if (selectedType === 'All') return true;
      return bus.bus_type.includes(selectedType);
    })
    .sort((a, b) => {
      if (sortBy === 'price') return a.price_per_seat - b.price_per_seat;
      if (sortBy === 'rating') return b.rating - a.rating;
      return a.departure_time.localeCompare(b.departure_time);
    });

  return (
    <main className="page-wrapper">
      {/* Search Header Form */}
      <section className="search-card">
        <form onSubmit={handleSearchSubmit} className="search-grid">
          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="source">From</label>
            <input
              id="source"
              type="text"
              list="cities-source"
              placeholder="e.g. Bangalore"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
            <datalist id="cities-source">
              {availableCities.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <button
            type="button"
            className="swap-btn"
            onClick={handleSwap}
            title="Swap locations"
          >
            ⇄
          </button>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="destination">To</label>
            <input
              id="destination"
              type="text"
              list="cities-dest"
              placeholder="e.g. Chennai"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
            <datalist id="cities-dest">
              {availableCities.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label htmlFor="journey-date">Journey Date</label>
            <input
              id="journey-date"
              type="date"
              min={todayStr}
              value={journeyDate}
              onChange={(e) => setJourneyDate(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ height: '42px', padding: '0 1.5rem' }}>
            Search Buses
          </button>
        </form>
      </section>

      {!isLive && (
        <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
          <span>ℹ️</span>
          <div>
            <strong>Demo Mode Active:</strong> Using local bus database. To connect live Supabase tables, follow the steps in <code>SUPABASE_SETUP.md</code> and update your <code>.env</code> file.
          </div>
        </div>
      )}

      {/* Filter Chips & Sorting */}
      <div className="filters-bar">
        <div className="filter-chips">
          {['All', 'Sleeper', 'Seater', 'Volvo'].map(type => (
            <button
              key={type}
              type="button"
              className={`chip-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type === 'All' ? 'All Buses' : type}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
          <span style={{ fontSize: '.85rem', color: 'var(--muted)', fontWeight: 600 }}>Sort By:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '.35rem .75rem', borderRadius: '6px', border: '1px solid var(--border)', fontSize: '.85rem' }}
          >
            <option value="departure">Departure Time</option>
            <option value="price">Lowest Price</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      {/* Bus Results List */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ borderColor: 'rgba(37,99,235,.3)', borderTopColor: 'var(--primary)' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Searching available buses...</p>
        </div>
      ) : filteredBuses.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem' }}>🚌💨</div>
          <h3 style={{ margin: '1rem 0 .5rem' }}>No buses found for this route</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            Try clearing filters or search between Bangalore, Chennai, Mumbai, Pune, Goa, or Delhi.
          </p>
          <button
            className="btn btn-outline"
            onClick={() => { setSource(''); setDestination(''); setSelectedType('All'); }}
          >
            View All Available Routes
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '.9rem', color: 'var(--muted)', fontWeight: 600 }}>
              Showing {filteredBuses.length} buses found
            </span>
            <span style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
              Journey Date: <strong>{new Date(journeyDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </span>
          </div>

          {filteredBuses.map((bus) => {
            const depTimeFormatted = bus.departure_time?.substring(0, 5) || '10:00';
            const arrTimeFormatted = bus.arrival_time?.substring(0, 5) || '18:00';

            return (
              <article key={bus.id} className="bus-card">
                <div className="bus-card-header">
                  <div>
                    <h3 className="bus-operator-title">{bus.name}</h3>
                    <div className="bus-type-subtitle">
                      {bus.bus_type} &bull; Bus No: <code>{bus.bus_number}</code>
                    </div>
                  </div>
                  <div className="rating-badge" title={`${bus.rating} out of 5 stars`}>
                    ★ {bus.rating}
                  </div>
                </div>

                <div className="bus-card-body">
                  <div className="route-timeline">
                    <div className="timeline-point">
                      <div className="timeline-time">{depTimeFormatted}</div>
                      <div className="timeline-city">{bus.source}</div>
                    </div>

                    <div className="timeline-duration">
                      <span>⏱️ {bus.duration_hours} hrs</span>
                    </div>

                    <div className="timeline-point end">
                      <div className="timeline-time">{arrTimeFormatted}</div>
                      <div className="timeline-city">{bus.destination}</div>
                    </div>
                  </div>

                  <div className="bus-card-action">
                    <div className="bus-price">₹{Number(bus.price_per_seat).toFixed(0)}</div>
                    <div className="bus-price-sub">per passenger</div>
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleSelectSeats(bus.id)}
                    >
                      Select Seats &rarr;
                    </button>
                  </div>
                </div>

                {bus.amenities && bus.amenities.length > 0 && (
                  <div className="amenities-list">
                    {bus.amenities.map((item, idx) => (
                      <span key={idx} className="amenity-tag">
                        ✓ {item}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
