import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getBusById } from '../services/busService';
import { getBookedSeats, createBooking } from '../services/bookingService';
import { useAuth } from '../context/AuthContext';

export default function Seats() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const busId = searchParams.get('busId');
  const journeyDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const [bus, setBus] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDeck, setActiveDeck] = useState('lower'); // 'lower' | 'upper'

  // Booking Modal & Passenger Form State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [passengerName, setPassengerName] = useState(user?.user_metadata?.full_name || '');
  const [passengerEmail, setPassengerEmail] = useState(user?.email || '');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [passengerAge, setPassengerAge] = useState('');
  const [passengerGender, setPassengerGender] = useState('Male');
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Confirmed Ticket State
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (busId) {
        const { data: busData } = await getBusById(busId);
        setBus(busData);

        const { data: seatsData } = await getBookedSeats(busId, journeyDate);
        setBookedSeats(seatsData || []);
      }
      setLoading(false);
    }
    loadData();
  }, [busId, journeyDate]);

  // Sync user details once when user is available (only fill if empty)
  useEffect(() => {
    if (user) {
      setPassengerEmail((prev) => prev || user.email || '');
      setPassengerName((prev) => prev || user.user_metadata?.full_name || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!busId) {
    return (
      <main className="page-wrapper">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>No bus selected</h2>
          <p style={{ color: 'var(--muted)', margin: '1rem 0' }}>Please choose a bus from the schedule to pick seats.</p>
          <Link to="/buses" className="btn btn-primary">Go to Bus Search &rarr;</Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="page-wrapper">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ borderColor: 'rgba(37,99,235,.3)', borderTopColor: 'var(--primary)' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Loading seat layout...</p>
        </div>
      </main>
    );
  }

  const isSleeper = bus?.bus_type?.toLowerCase().includes('sleeper');
  const totalSeats = bus?.total_seats || 32;
  const halfSeats = Math.ceil(totalSeats / 2);

  // Generate seat numbers
  const lowerSeats = [];
  const upperSeats = [];

  for (let i = 1; i <= totalSeats; i++) {
    const seatId = `S${i}`;
    if (isSleeper && i > halfSeats) {
      upperSeats.push(seatId);
    } else {
      lowerSeats.push(seatId);
    }
  }

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= 3) {
        alert("You can select up to 3 seats per booking.");
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const baseFare = selectedSeats.length * (bus?.price_per_seat || 0);
  const gst = Math.round(baseFare * 0.05);
  const totalFare = baseFare + gst;

  const handleOpenCheckout = () => {
    if (selectedSeats.length === 0) {
      alert("Please select at least one seat to proceed.");
      return;
    }
    setBookingError(null);
    setShowCheckoutModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerEmail.trim() || !passengerPhone.trim()) {
      setBookingError("Please fill in all passenger contact details.");
      return;
    }

    setSubmitting(true);
    setBookingError(null);

    const { data: bookingResult, error } = await createBooking({
      busId: bus.id,
      journeyDate,
      seatNumbers: selectedSeats,
      totalAmount: totalFare,
      passengerName: passengerName.trim(),
      passengerEmail: passengerEmail.trim(),
      passengerPhone: passengerPhone.trim(),
      passengerAge: passengerAge,
      passengerGender: passengerGender,
      user
    });

    setSubmitting(false);

    if (error) {
      setBookingError(error.message || "Booking failed. Please try again.");
      return;
    }

    setShowCheckoutModal(false);
    setConfirmedBooking(bookingResult);
  };

  // If booking is confirmed, render boarding pass
  if (confirmedBooking) {
    return (
      <main className="page-wrapper">
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem' }}>🎉</div>
            <h2 style={{ color: '#16a34a', margin: '.5rem 0' }}>Booking Confirmed!</h2>
            <p style={{ color: 'var(--muted)' }}>Your digital boarding pass has been generated.</p>
          </div>

          <div className="ticket-card">
            <div className="ticket-header">
              <div>
                <strong>{bus.operator || bus.name}</strong>
                <div style={{ fontSize: '.8rem', opacity: .9 }}>{bus.bus_type}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-success" style={{ background: '#fff', color: '#16a34a' }}>CONFIRMED</span>
                <div style={{ fontSize: '.85rem', marginTop: '.2rem' }}>Ref: <strong>{confirmedBooking.booking_reference}</strong></div>
              </div>
            </div>

            <div className="ticket-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>ROUTE</span>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{bus.source} &rarr; {bus.destination}</div>
                </div>
                <div>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>JOURNEY DATE</span>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    {new Date(journeyDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>DEPARTURE TIME</span>
                  <div style={{ fontWeight: 700 }}>{bus.departure_time?.substring(0, 5)} hrs</div>
                </div>
                <div>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>ARRIVAL TIME</span>
                  <div style={{ fontWeight: 700 }}>{bus.arrival_time?.substring(0, 5)} hrs</div>
                </div>
              </div>

              <div className="ticket-divider"></div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>PASSENGER</span>
                  <div style={{ fontWeight: 700 }}>{passengerName}</div>
                  <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{passengerPhone}</div>
                </div>
                <div>
                  <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>SEAT(S)</span>
                  <div>
                    {selectedSeats.map(s => (
                      <span key={s} className="seat-tag" style={{ background: '#dcfce7', color: '#15803d' }}>{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '.9rem', color: 'var(--muted)' }}>Total Amount Paid (incl. taxes)</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>₹{totalFare}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => window.print()}
            >
              🖨️ Print Ticket
            </button>
            <Link to="/my-bookings" className="btn btn-primary">
              View in My Bookings &rarr;
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const seatsToRender = isSleeper && activeDeck === 'upper' ? upperSeats : lowerSeats;

  return (
    <main className="page-wrapper">
      {/* Route & Bus Mini Header */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.25rem' }}>
              <Link to="/buses" style={{ fontSize: '.85rem' }}>&larr; Back to Buses</Link>
            </div>
            <h2 style={{ fontSize: '1.35rem', margin: 0 }}>{bus.name}</h2>
            <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
              {bus.source} &rarr; {bus.destination} &bull; {new Date(journeyDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} &bull; Dep: {bus.departure_time?.substring(0, 5)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-info">{bus.bus_type}</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '.25rem' }}>
              ₹{Number(bus.price_per_seat).toFixed(0)} <span style={{ fontSize: '.8rem', color: 'var(--muted)', fontWeight: 400 }}>/ seat</span>
            </div>
          </div>
        </div>
      </div>

      <div className="seats-layout-grid">
        {/* Seat Layout Cabin */}
        {/* Realistic Bus Interior View */}
        <div className="bus-deck-wrapper">
          {isSleeper && (
            <div className="deck-tabs">
              <button
                type="button"
                className={`deck-tab ${activeDeck === 'lower' ? 'active' : ''}`}
                onClick={() => setActiveDeck('lower')}
              >
                🛏️ Lower Deck ({lowerSeats.length} berths)
              </button>
              <button
                type="button"
                className={`deck-tab ${activeDeck === 'upper' ? 'active' : ''}`}
                onClick={() => setActiveDeck('upper')}
              >
                🛏️ Upper Deck ({upperSeats.length} berths)
              </button>
            </div>
          )}

          {/* Seat Status Legend */}
          <div className="bus-legend-bar">
            <div className="legend-item">
              <div className="legend-seat-sample avail">
                <span className="sample-headrest"></span>
                <span className="sample-cushion"></span>
              </div>
              <span>Available</span>
            </div>
            <div className="legend-item">
              <div className="legend-seat-sample sel">
                <span className="sample-headrest"></span>
                <span className="sample-cushion"></span>
              </div>
              <span>Selected ({selectedSeats.length})</span>
            </div>
            <div className="legend-item">
              <div className="legend-seat-sample occ">
                <span className="sample-headrest"></span>
                <span className="sample-cushion"></span>
              </div>
              <span>Booked</span>
            </div>
          </div>

          {/* Bus Body Top-Down View */}
          <div className="bus-chassis-scroll">
            <div className="bus-chassis">
              {/* Bus Exterior Roof/Mirrors Accents */}
              <div className="bus-mirror bus-mirror-left"></div>
              <div className="bus-mirror bus-mirror-right"></div>

              {/* Front Wheel Arches */}
              <div className="bus-wheel-arch wheel-front-left"></div>
              <div className="bus-wheel-arch wheel-front-right"></div>

              {/* Rear Wheel Arches */}
              <div className="bus-wheel-arch wheel-rear-left"></div>
              <div className="bus-wheel-arch wheel-rear-right"></div>

              {/* Front Windshield & Driver Cockpit */}
              <div className="bus-front-header">
                <div className="windshield-glass">
                  <div className="windshield-wiper left"></div>
                  <div className="windshield-wiper right"></div>
                  <span className="windshield-label">FRONT / WINDSHIELD</span>
                </div>

                <div className="cockpit-area">
                  <div className="cockpit-door">
                    <span className="door-icon">🚪</span>
                    <span className="door-label">FRONT ENTRANCE</span>
                  </div>

                  <div className="cockpit-center-console">
                    <div className="speedometer-cluster">
                      <span className="dash-indicator"></span>
                      <span className="dash-indicator"></span>
                    </div>
                  </div>

                  <div className="cockpit-driver">
                    <div className="driver-wheel-wrap" title="Driver's Cabin">
                      <div className="realistic-steering-wheel">
                        <div className="wheel-center"></div>
                      </div>
                    </div>
                    <div className="driver-seat-box">
                      <span className="driver-label">DRIVER</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passenger Cabin Interior */}
              <div className="bus-cabin-interior">
                {/* Windows strip along sides */}
                <div className="interior-side-rail left-rail"></div>
                <div className="interior-side-rail right-rail"></div>

                {/* Seater: 2 + Walkway + 2 arrangement */}
                {!isSleeper ? (
                  <div className="bus-seating-plan">
                    {Array.from({ length: Math.ceil(seatsToRender.length / 4) }).map((_, rowIndex) => {
                      const s1 = seatsToRender[rowIndex * 4];
                      const s2 = seatsToRender[rowIndex * 4 + 1];
                      const s3 = seatsToRender[rowIndex * 4 + 2];
                      const s4 = seatsToRender[rowIndex * 4 + 3];

                      const renderSeat = (seatId) => {
                        if (!seatId) return <div className="seat-placeholder" key={`empty-${Math.random()}`}></div>;
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);

                        return (
                          <button
                            type="button"
                            key={seatId}
                            className={`bus-seat ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleSeat(seatId)}
                            disabled={isBooked}
                            title={isBooked ? `Seat ${seatId} - Booked` : `Seat ${seatId} - Click to select`}
                            aria-label={`Seat ${seatId}`}
                          >
                            <span className="seat-armrest left-armrest"></span>
                            <div className="seat-main-body">
                              <span className="seat-headrest"></span>
                              <div className="seat-inner-cushion">
                                <span className="seat-number">{seatId}</span>
                              </div>
                              <span className="seat-indicator-strip"></span>
                            </div>
                            <span className="seat-armrest right-armrest"></span>
                          </button>
                        );
                      };

                      return (
                        <div key={`row-${rowIndex}`} className="bus-cabin-row">
                          <div className="seat-column-pair left-pair">
                            {renderSeat(s1)}
                            {renderSeat(s2)}
                          </div>

                          <div className="cabin-aisle">
                            <span className="aisle-guide-arrow">▲</span>
                            <span className="aisle-text">AISLE</span>
                          </div>

                          <div className="seat-column-pair right-pair">
                            {renderSeat(s3)}
                            {renderSeat(s4)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Sleeper: 2 + Walkway + 1 realistic berth arrangement */
                  <div className="bus-sleeper-plan">
                    {Array.from({ length: Math.ceil(seatsToRender.length / 3) }).map((_, rowIndex) => {
                      const b1 = seatsToRender[rowIndex * 3];
                      const b2 = seatsToRender[rowIndex * 3 + 1];
                      const b3 = seatsToRender[rowIndex * 3 + 2];

                      const renderBerth = (seatId, isSingle = false) => {
                        if (!seatId) return <div className={`berth-placeholder ${isSingle ? 'single' : 'double'}`} key={`empty-b-${Math.random()}`}></div>;
                        const isBooked = bookedSeats.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);

                        return (
                          <button
                            type="button"
                            key={seatId}
                            className={`bus-berth ${isSingle ? 'berth-single' : 'berth-double'} ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleSeat(seatId)}
                            disabled={isBooked}
                            title={isBooked ? `Berth ${seatId} - Booked` : `Berth ${seatId} - Click to select`}
                            aria-label={`Berth ${seatId}`}
                          >
                            <div className="berth-pillow">
                              <span className="pillow-shape"></span>
                            </div>
                            <div className="berth-mattress">
                              <span className="berth-number">{seatId}</span>
                              <span className="berth-type-label">{activeDeck === 'upper' ? 'UB' : 'LB'}</span>
                            </div>
                            <span className="berth-bedsheet-fold"></span>
                          </button>
                        );
                      };

                      return (
                        <div key={`sleeper-row-${rowIndex}`} className="bus-sleeper-row">
                          <div className="berth-column-pair left-berths">
                            {renderBerth(b1)}
                            {renderBerth(b2)}
                          </div>

                          <div className="cabin-aisle">
                            <span className="aisle-guide-arrow">▲</span>
                            <span className="aisle-text">WALKWAY</span>
                          </div>

                          <div className="berth-column-single right-berths">
                            {renderBerth(b3, true)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Rear of Bus / Emergency Exit */}
              <div className="bus-rear-section">
                <div className="emergency-exit-zone">
                  <span className="rear-icon">🚪</span>
                  <span className="rear-label">EMERGENCY EXIT / REAR</span>
                </div>
                <div className="rear-taillights">
                  <span className="taillight left"></span>
                  <span className="taillight right"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Summary Sidebar */}
        <aside className="summary-card">
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>Booking Summary</h3>

          <div className="summary-row">
            <span>Route</span>
            <strong>{bus.source} &rarr; {bus.destination}</strong>
          </div>

          <div className="summary-row">
            <span>Selected Seats</span>
            <div>
              {selectedSeats.length > 0 ? (
                selectedSeats.map(s => <span key={s} className="seat-tag">{s}</span>)
              ) : (
                <span style={{ color: 'var(--muted)', fontStyle: 'italic' }}>None selected</span>
              )}
            </div>
          </div>

          <div className="summary-row">
            <span>Base Fare ({selectedSeats.length} &times; ₹{bus.price_per_seat})</span>
            <span>₹{baseFare}</span>
          </div>

          <div className="summary-row">
            <span>Taxes & GST (5%)</span>
            <span>₹{gst}</span>
          </div>

          <div className="summary-row total">
            <span>Grand Total</span>
            <span>₹{totalFare}</span>
          </div>

          <button
            type="button"
            className="btn btn-success"
            style={{ width: '100%', marginTop: '1.25rem' }}
            disabled={selectedSeats.length === 0}
            onClick={handleOpenCheckout}
          >
            Proceed to Book ({selectedSeats.length} Seats) &rarr;
          </button>
        </aside>
      </div>

      {/* Passenger Details & Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Passenger Information</h3>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            {bookingError && (
              <div className="alert alert-error">
                ❌ {bookingError}
              </div>
            )}

            <div style={{ background: 'var(--secondary)', padding: '.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '.85rem' }}>
              Selected Seats: <strong>{selectedSeats.join(', ')}</strong> &bull; Total: <strong>₹{totalFare}</strong>
            </div>

            <form onSubmit={handleConfirmBooking}>
              <div className="form-group">
                <label htmlFor="p-name">Full Name *</label>
                <input
                  id="p-name"
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-email">Email Address * (For e-ticket)</label>
                <input
                  id="p-email"
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={passengerEmail}
                  onChange={(e) => setPassengerEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="p-phone">Phone Number *</label>
                <input
                  id="p-phone"
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label htmlFor="p-age">Age</label>
                  <input
                    id="p-age"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 28"
                    value={passengerAge}
                    onChange={(e) => setPassengerAge(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="p-gender">Gender</label>
                  <select
                    id="p-gender"
                    value={passengerGender}
                    onChange={(e) => setPassengerGender(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => setShowCheckoutModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success"
                  style={{ flex: 1.5 }}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner"></span> Confirming…
                    </>
                  ) : (
                    `Pay ₹${totalFare} & Confirm`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
