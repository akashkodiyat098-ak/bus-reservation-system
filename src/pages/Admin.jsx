import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getAllBusesAdmin,
  createBus,
  updateBus,
  deleteBus
} from '../services/busService';
import {
  getAllBookingsAdmin,
  updateBookingStatusAdmin
} from '../services/bookingService';

export default function Admin() {
  const { user, profile, isLiveAuth, toggleRole } = useAuth();

  // Active Tab: 'overview' | 'buses' | 'bookings'
  const [activeTab, setActiveTab] = useState('overview');

  // Buses State
  const [buses, setBuses] = useState([]);
  const [busesLoading, setBusesLoading] = useState(true);
  const [busSearch, setBusSearch] = useState('');

  // Bookings State
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [bookingSearch, setBookingSearch] = useState('');

  // Notification / Alert Message
  const [msg, setMsg] = useState(null);

  // Modal State for Bus Create / Edit
  const [showBusModal, setShowBusModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [busForm, setBusForm] = useState({
    bus_number: '',
    name: '',
    operator: '',
    bus_type: 'AC Sleeper (2+1)',
    source: '',
    destination: '',
    departure_time: '20:00:00',
    arrival_time: '06:00:00',
    duration_hours: 10,
    total_seats: 32,
    price_per_seat: 950,
    amenities: 'Air Conditioning, Charging Point, Water Bottle',
    rating: 4.8,
    is_active: true
  });
  const [busSaving, setBusSaving] = useState(false);

  // Load Data
  const loadBuses = async () => {
    setBusesLoading(true);
    const { data } = await getAllBusesAdmin();
    setBuses(data || []);
    setBusesLoading(false);
  };

  const loadBookings = async () => {
    setBookingsLoading(true);
    const { data } = await getAllBookingsAdmin();
    setBookings(data || []);
    setBookingsLoading(false);
  };

  useEffect(() => {
    loadBuses();
    loadBookings();
  }, []);

  // Compute Overview Metrics
  const totalRevenue = bookings
    .filter(b => b.booking_status === 'CONFIRMED')
    .reduce((acc, b) => acc + (parseFloat(b.total_amount) || 0), 0);

  const totalTicketsBooked = bookings
    .filter(b => b.booking_status === 'CONFIRMED')
    .reduce((acc, b) => acc + (b.seat_numbers?.length || 1), 0);

  const activeBusesCount = buses.filter(b => b.is_active !== false).length;
  const cancelledBookingsCount = bookings.filter(b => b.booking_status === 'CANCELLED').length;

  // Handlers for Bus Modal
  const handleOpenAddBus = () => {
    setEditingBus(null);
    setBusForm({
      bus_number: 'KA-0' + Math.floor(10 + Math.random() * 90) + '-XY-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      operator: '',
      bus_type: 'AC Sleeper (2+1)',
      source: '',
      destination: '',
      departure_time: '21:00:00',
      arrival_time: '06:30:00',
      duration_hours: 9.5,
      total_seats: 32,
      price_per_seat: 899,
      amenities: 'Air Conditioning, WiFi, Charging Point, Water Bottle',
      rating: 4.7,
      is_active: true
    });
    setShowBusModal(true);
  };

  const handleOpenEditBus = (bus) => {
    setEditingBus(bus);
    setBusForm({
      bus_number: bus.bus_number || '',
      name: bus.name || '',
      operator: bus.operator || '',
      bus_type: bus.bus_type || 'AC Sleeper (2+1)',
      source: bus.source || '',
      destination: bus.destination || '',
      departure_time: bus.departure_time || '20:00:00',
      arrival_time: bus.arrival_time || '06:00:00',
      duration_hours: bus.duration_hours || 8,
      total_seats: bus.total_seats || 32,
      price_per_seat: bus.price_per_seat || 500,
      amenities: Array.isArray(bus.amenities) ? bus.amenities.join(', ') : (bus.amenities || ''),
      rating: bus.rating || 4.5,
      is_active: bus.is_active !== false
    });
    setShowBusModal(true);
  };

  const handleSaveBus = async (e) => {
    e.preventDefault();
    if (!busForm.name.trim() || !busForm.source.trim() || !busForm.destination.trim()) {
      alert("Please fill in Bus Name, Source, and Destination.");
      return;
    }

    setBusSaving(true);
    const amenitiesArr = busForm.amenities
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      ...busForm,
      amenities: amenitiesArr
    };

    let result;
    if (editingBus) {
      result = await updateBus(editingBus.id, payload);
    } else {
      result = await createBus(payload);
    }

    setBusSaving(false);

    if (result.error) {
      alert("Error saving bus: " + (result.error.message || 'Operation failed'));
      return;
    }

    setMsg({
      type: 'success',
      text: editingBus ? `Bus ${payload.bus_number} updated!` : `Bus ${payload.bus_number} created successfully!`
    });
    setShowBusModal(false);
    loadBuses();
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDeleteBus = async (bus) => {
    if (!window.confirm(`Are you sure you want to permanently delete bus ${bus.bus_number} (${bus.name})?`)) {
      return;
    }

    const { success, error } = await deleteBus(bus.id);
    if (success) {
      setMsg({ type: 'success', text: `Bus ${bus.bus_number} removed.` });
      loadBuses();
      setTimeout(() => setMsg(null), 3000);
    } else {
      alert("Delete failed: " + (error?.message || 'Error occurred'));
    }
  };

  const handleToggleBusStatus = async (bus) => {
    const nextStatus = !bus.is_active;
    const { error } = await updateBus(bus.id, { is_active: nextStatus });
    if (!error) {
      setMsg({
        type: 'info',
        text: `Bus ${bus.bus_number} marked as ${nextStatus ? 'Active' : 'Inactive'}.`
      });
      loadBuses();
      setTimeout(() => setMsg(null), 3000);
    } else {
      alert("Update failed: " + error.message);
    }
  };

  // Handlers for Bookings Status
  const handleBookingStatusChange = async (bookingId, newStatus) => {
    const actionName = newStatus === 'CANCELLED' ? 'cancel' : 'confirm';
    if (!window.confirm(`Are you sure you want to ${actionName} this booking?`)) return;

    const { error } = await updateBookingStatusAdmin(bookingId, newStatus);
    if (!error) {
      setMsg({ type: 'success', text: `Booking status updated to ${newStatus}.` });
      loadBookings();
      setTimeout(() => setMsg(null), 3000);
    } else {
      alert("Failed to update status: " + error.message);
    }
  };

  // Filtered Buses
  const filteredBuses = buses.filter(b => {
    const term = busSearch.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(term)) ||
      (b.bus_number && b.bus_number.toLowerCase().includes(term)) ||
      (b.source && b.source.toLowerCase().includes(term)) ||
      (b.destination && b.destination.toLowerCase().includes(term)) ||
      (b.operator && b.operator.toLowerCase().includes(term))
    );
  });

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter !== 'ALL' && b.booking_status !== bookingFilter) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      const matchRef = b.booking_reference?.toLowerCase().includes(q);
      const matchName = b.passenger_name?.toLowerCase().includes(q);
      const matchEmail = b.passenger_email?.toLowerCase().includes(q);
      const matchBus = b.buses?.name?.toLowerCase().includes(q);
      return matchRef || matchName || matchEmail || matchBus;
    }
    return true;
  });

  return (
    <main className="page-wrapper" style={{ maxWidth: '1240px', paddingBottom: '4rem' }}>
      {/* Admin Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>⚙️ Admin Control Panel</h1>
            <span className="badge badge-info" style={{ textTransform: 'uppercase', letterSpacing: '.5px' }}>
              Administrator
            </span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: '.3rem' }}>
            Manage fleet schedules, ticket reservations, passenger bookings, and real-time operations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={toggleRole}
            title="Switch your role between Admin and Passenger to preview both user experiences"
          >
            🔄 Switch to Passenger View
          </button>
          <Link to="/buses" className="btn btn-primary btn-sm">
            🚌 View Customer Portal
          </Link>
        </div>
      </div>

      {msg && (
        <div className={`alert alert-${msg.type}`} style={{ marginBottom: '1.25rem' }}>
          {msg.type === 'success' ? '✅' : 'ℹ️'} {msg.text}
        </div>
      )}

      {/* Admin Nav Tabs */}
      <div style={{ display: 'flex', gap: '.5rem', borderBottom: '2px solid var(--border)', marginBottom: '1.75rem', overflowX: 'auto' }}>
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          style={{
            background: 'none',
            border: 'none',
            padding: '.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'overview' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'overview' ? 'var(--primary)' : 'var(--muted)'
          }}
        >
          📊 Dashboard Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buses')}
          style={{
            background: 'none',
            border: 'none',
            padding: '.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'buses' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'buses' ? 'var(--primary)' : 'var(--muted)'
          }}
        >
          🚌 Bus Fleet Management ({buses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          style={{
            background: 'none',
            border: 'none',
            padding: '.75rem 1.25rem',
            fontWeight: 700,
            fontSize: '.95rem',
            cursor: 'pointer',
            borderBottom: activeTab === 'bookings' ? '3px solid var(--primary)' : '3px solid transparent',
            color: activeTab === 'bookings' ? 'var(--primary)' : 'var(--muted)'
          }}
        >
          🎟️ All Reservations ({bookings.length})
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW METRICS */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div>
          {/* Stat Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                💰
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '.85rem', fontWeight: 600 }}>Total Revenue</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '.2rem' }}>₹{totalRevenue.toLocaleString('en-IN')}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--accent)', marginTop: '.2rem' }}>Confirmed bookings</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                🎟️
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '.85rem', fontWeight: 600 }}>Seats Booked</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '.2rem' }}>{totalTicketsBooked}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.2rem' }}>Across active schedules</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                🚌
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '.85rem', fontWeight: 600 }}>Active Fleet</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '.2rem' }}>{activeBusesCount} / {buses.length}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.2rem' }}>Operational buses</div>
              </div>
            </div>

            <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #ef4444' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
                ↩️
              </div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '.85rem', fontWeight: 600 }}>Cancellations</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '.2rem' }}>{cancelledBookingsCount}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: '.2rem' }}>Seats auto-restored</div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Recent Bookings */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {/* Quick Actions */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', fontWeight: 700 }}>⚡ Fleet Operations</h3>
              <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: '1.25rem' }}>
                Quick controls to add new routes, modify ticket rates, or view system status.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ justifyContent: 'center' }}
                  onClick={() => { setActiveTab('buses'); handleOpenAddBus(); }}
                >
                  + Add New Bus Route
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ justifyContent: 'center' }}
                  onClick={() => setActiveTab('bookings')}
                >
                  Inspect Passenger Manifest &rarr;
                </button>
              </div>

              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)', fontSize: '.85rem', color: 'var(--muted)' }}>
                <div><strong>Backend mode:</strong> {isLiveAuth ? '⚡ Live Supabase PostgreSQL' : '🧪 Simulated Local Storage'}</div>
                <div style={{ marginTop: '.25rem' }}><strong>Signed in as:</strong> {user?.email}</div>
              </div>
            </div>

            {/* Recent 5 Bookings */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>🕒 Recent Bookings</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('bookings')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '.85rem', fontWeight: 600 }}
                >
                  View All &rarr;
                </button>
              </div>

              {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                  No reservations placed yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                  {bookings.slice(0, 5).map(b => (
                    <div
                      key={b.id}
                      style={{
                        padding: '.75rem',
                        background: 'var(--secondary)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '.85rem'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{b.booking_reference}</div>
                        <div style={{ color: 'var(--text)', fontWeight: 600 }}>{b.passenger_name}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                          {b.buses?.source} &rarr; {b.buses?.destination} | Seats: {b.seat_numbers?.join(', ')}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800 }}>₹{b.total_amount}</div>
                        <span
                          className={`badge badge-${b.booking_status === 'CONFIRMED' ? 'success' : 'danger'}`}
                          style={{ fontSize: '.7rem', marginTop: '.2rem' }}
                        >
                          {b.booking_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: BUS FLEET MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'buses' && (
        <div>
          {/* Controls Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '.75rem', flex: 1, maxWidth: '450px' }}>
              <input
                type="text"
                placeholder="Search buses by name, number, city, or operator..."
                value={busSearch}
                onChange={(e) => setBusSearch(e.target.value)}
                style={{ padding: '.5rem .85rem', fontSize: '.9rem' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleOpenAddBus}
            >
              + Add New Bus Route
            </button>
          </div>

          {/* Buses Table */}
          {busesLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Loading buses...</p>
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <h3>No buses match your filter</h3>
              <p style={{ color: 'var(--muted)', marginTop: '.5rem' }}>Try changing the search keywords or add a new bus.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem' }}>Bus & Operator</th>
                    <th style={{ padding: '1rem' }}>Route</th>
                    <th style={{ padding: '1rem' }}>Schedule</th>
                    <th style={{ padding: '1rem' }}>Seats & Type</th>
                    <th style={{ padding: '1rem' }}>Fare</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuses.map((bus) => (
                    <tr key={bus.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700 }}>{bus.name}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                          {bus.operator} • <span style={{ fontFamily: 'monospace' }}>{bus.bus_number}</span>
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{bus.source} &rarr; {bus.destination}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Duration: {bus.duration_hours}h</div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div>Dep: <strong>{bus.departure_time?.substring(0, 5)}</strong></div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Arr: {bus.arrival_time?.substring(0, 5)}</div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div>{bus.total_seats} seats</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{bus.bus_type}</div>
                      </td>

                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--accent)' }}>
                        ₹{bus.price_per_seat}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleBusStatus(bus)}
                          className={`badge badge-${bus.is_active !== false ? 'success' : 'danger'}`}
                          style={{ cursor: 'pointer', border: 'none' }}
                          title="Click to toggle Active/Inactive"
                        >
                          {bus.is_active !== false ? '● Active' : '○ Inactive'}
                        </button>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '.4rem' }}>
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEditBus(bus)}
                            title="Edit details"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteBus(bus)}
                            title="Delete bus"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: ALL PASSENGER RESERVATIONS */}
      {/* ======================================================== */}
      {activeTab === 'bookings' && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '.75rem', flex: 1, maxWidth: '450px' }}>
              <input
                type="text"
                placeholder="Search by Reference ID (BRS-...), passenger, email..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                style={{ padding: '.5rem .85rem', fontSize: '.9rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '.5rem' }}>
              {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setBookingFilter(st)}
                  className={`btn btn-sm ${bookingFilter === st ? 'btn-primary' : 'btn-outline'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Table */}
          {bookingsLoading ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner"></div>
              <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Loading reservations...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <h3>No reservations found</h3>
              <p style={{ color: 'var(--muted)', marginTop: '.5rem' }}>No customer reservations match the current filter.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.9rem' }}>
                <thead>
                  <tr style={{ background: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '1rem' }}>Reference ID</th>
                    <th style={{ padding: '1rem' }}>Passenger Contact</th>
                    <th style={{ padding: '1rem' }}>Bus & Route</th>
                    <th style={{ padding: '1rem' }}>Journey Date</th>
                    <th style={{ padding: '1rem' }}>Seats Reserved</th>
                    <th style={{ padding: '1rem' }}>Amount</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => (
                    <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace', fontSize: '.95rem' }}>
                          {b.booking_reference}
                        </div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                          {new Date(b.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 700 }}>{b.passenger_name}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{b.passenger_email}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>{b.passenger_phone || 'No phone'}</div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{b.buses?.name || 'Bus Service'}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>
                          {b.buses?.source || 'City A'} &rarr; {b.buses?.destination || 'City B'}
                        </div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 600 }}>{b.journey_date}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>Dep: {b.buses?.departure_time?.substring(0, 5) || 'TBD'}</div>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '.25rem', flexWrap: 'wrap' }}>
                          {(b.seat_numbers || []).map(seat => (
                            <span
                              key={seat}
                              style={{
                                padding: '.2rem .4rem',
                                background: 'rgba(37,99,235,0.1)',
                                color: 'var(--primary)',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '.75rem'
                              }}
                            >
                              {seat}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--accent)' }}>
                        ₹{b.total_amount}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <span className={`badge badge-${b.booking_status === 'CONFIRMED' ? 'success' : 'danger'}`}>
                          {b.booking_status}
                        </span>
                      </td>

                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {b.booking_status === 'CONFIRMED' ? (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: '.75rem' }}
                            onClick={() => handleBookingStatusChange(b.id, 'CANCELLED')}
                          >
                            Cancel Ticket
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--accent)', borderColor: 'var(--accent)', fontSize: '.75rem' }}
                            onClick={() => handleBookingStatusChange(b.id, 'CONFIRMED')}
                          >
                            Re-instate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREATE / EDIT BUS ROUTE */}
      {/* ======================================================== */}
      {showBusModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {editingBus ? '✏️ Edit Bus Route' : '🚌 Add New Bus Route'}
              </h3>
              <button
                type="button"
                onClick={() => setShowBusModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveBus}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Bus / Route Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SRS Scania Executive"
                    value={busForm.name}
                    onChange={(e) => setBusForm({ ...busForm, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Operator Name</label>
                  <input
                    type="text"
                    placeholder="e.g. SRS Travels"
                    value={busForm.operator}
                    onChange={(e) => setBusForm({ ...busForm, operator: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Bus Registration Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. KA-01-AB-1234"
                    value={busForm.bus_number}
                    onChange={(e) => setBusForm({ ...busForm, bus_number: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Bus Coach Type</label>
                  <select
                    value={busForm.bus_type}
                    onChange={(e) => setBusForm({ ...busForm, bus_type: e.target.value })}
                  >
                    <option value="AC Sleeper (2+1)">AC Sleeper (2+1)</option>
                    <option value="Luxury Volvo Multi-Axle (2+2)">Luxury Volvo Multi-Axle (2+2)</option>
                    <option value="AC Seater (2+2)">AC Seater (2+2)</option>
                    <option value="Non-AC Seater/Sleeper">Non-AC Seater/Sleeper</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Source City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bangalore"
                    value={busForm.source}
                    onChange={(e) => setBusForm({ ...busForm, source: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Destination City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hyderabad"
                    value={busForm.destination}
                    onChange={(e) => setBusForm({ ...busForm, destination: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Departure Time</label>
                  <input
                    type="time"
                    required
                    value={busForm.departure_time.substring(0, 5)}
                    onChange={(e) => setBusForm({ ...busForm, departure_time: e.target.value + ':00' })}
                  />
                </div>

                <div className="form-group">
                  <label>Arrival Time</label>
                  <input
                    type="time"
                    required
                    value={busForm.arrival_time.substring(0, 5)}
                    onChange={(e) => setBusForm({ ...busForm, arrival_time: e.target.value + ':00' })}
                  />
                </div>

                <div className="form-group">
                  <label>Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={busForm.duration_hours}
                    onChange={(e) => setBusForm({ ...busForm, duration_hours: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Price Per Seat (₹) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={busForm.price_per_seat}
                    onChange={(e) => setBusForm({ ...busForm, price_per_seat: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Total Seats</label>
                  <input
                    type="number"
                    min="10"
                    max="60"
                    value={busForm.total_seats}
                    onChange={(e) => setBusForm({ ...busForm, total_seats: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Rating (out of 5)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={busForm.rating}
                    onChange={(e) => setBusForm({ ...busForm, rating: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label>Amenities (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="Air Conditioning, WiFi, Charging Point, Blanket"
                  value={busForm.amenities}
                  onChange={(e) => setBusForm({ ...busForm, amenities: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginTop: '1rem' }}>
                <input
                  type="checkbox"
                  id="bus-active"
                  checked={busForm.is_active}
                  onChange={(e) => setBusForm({ ...busForm, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="bus-active" style={{ margin: 0, cursor: 'pointer', fontWeight: 600 }}>
                  Active and available for booking
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowBusModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                  disabled={busSaving}
                >
                  {busSaving ? 'Saving...' : editingBus ? 'Update Bus' : 'Create Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
