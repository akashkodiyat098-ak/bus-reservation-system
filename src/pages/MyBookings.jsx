import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserBookings, cancelBooking } from '../services/bookingService';

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [viewTicket, setViewTicket] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await getUserBookings(user?.id);
    setBookings(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCancel = async (booking) => {
    const confirmCancel = window.confirm(
      `Are you sure you want to cancel booking ${booking.booking_reference}? Your seats will be released and amount will be refunded.`
    );
    if (!confirmCancel) return;

    setCancellingId(booking.id);
    setActionMsg(null);

    const { success, error } = await cancelBooking(booking.id, user?.id);
    setCancellingId(null);

    if (success) {
      setActionMsg({ type: 'success', text: `Booking ${booking.booking_reference} cancelled successfully.` });
      fetchBookings();
    } else {
      setActionMsg({ type: 'error', text: error?.message || 'Failed to cancel booking.' });
    }
  };

  return (
    <main className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>My Bookings</h1>
          <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
            View, download tickets, or cancel your bus reservations.
          </p>
        </div>

        <Link to="/buses" className="btn btn-primary">
          + Book Another Ticket
        </Link>
      </div>

      {actionMsg && (
        <div className={`alert alert-${actionMsg.type}`} style={{ marginBottom: '1.5rem' }}>
          {actionMsg.type === 'success' ? '✅' : '❌'} {actionMsg.text}
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ borderColor: 'rgba(37,99,235,.3)', borderTopColor: 'var(--primary)' }}></div>
          <p style={{ marginTop: '1rem', color: 'var(--muted)' }}>Fetching your bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3.5rem' }}>🎫</div>
          <h3 style={{ margin: '1rem 0 .5rem' }}>No Bookings Found</h3>
          <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
            You have not booked any bus trips yet. Ready to explore?
          </p>
          <Link to="/buses" className="btn btn-success">
            Search & Book Buses Now &rarr;
          </Link>
        </div>
      ) : (
        <div>
          {bookings.map((booking) => {
            const bus = booking.buses || {};
            const isCancelled = booking.booking_status === 'CANCELLED';

            return (
              <div key={booking.id} className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '.85rem', marginBottom: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{booking.booking_reference}</span>
                      <span className={`badge ${isCancelled ? 'badge-danger' : 'badge-success'}`}>
                        {booking.booking_status}
                      </span>
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: '.2rem' }}>
                      Booked on: {new Date(booking.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isCancelled ? 'var(--muted)' : 'var(--primary)' }}>
                      ₹{Number(booking.total_amount).toFixed(0)}
                    </div>
                    <span style={{ fontSize: '.8rem', color: isCancelled ? '#dc2626' : '#16a34a' }}>
                      {booking.payment_status}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>BUS & ROUTE</div>
                    <div style={{ fontWeight: 700 }}>{bus.name || 'Express Bus'}</div>
                    <div style={{ fontSize: '.9rem', color: 'var(--text)' }}>
                      {bus.source || 'Origin'} &rarr; {bus.destination || 'Destination'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>JOURNEY DATE</div>
                    <div style={{ fontWeight: 700 }}>
                    {new Date(booking.journey_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
                      Departure: {bus.departure_time?.substring(0, 5) || '10:00'} hrs
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>SEATS RESERVED</div>
                    <div>
                      {booking.seat_numbers && booking.seat_numbers.map(s => (
                        <span key={s} className="seat-tag">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>PASSENGER</div>
                    <div style={{ fontWeight: 700 }}>{booking.passenger_name}</div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{booking.passenger_phone}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setViewTicket(booking)}
                  >
                    🎫 View Boarding Pass
                  </button>

                  {!isCancelled && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={cancellingId === booking.id}
                      onClick={() => handleCancel(booking)}
                    >
                      {cancellingId === booking.id ? (
                        <>
                          <span className="spinner"></span> Cancelling…
                        </>
                      ) : (
                        'Cancel Ticket'
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Preview Modal */}
      {viewTicket && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Boarding Pass Preview</h3>
              <button
                type="button"
                onClick={() => setViewTicket(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>

            <div className="ticket-card">
              <div className="ticket-header">
                <div>
                  <strong>{viewTicket.buses?.operator || viewTicket.buses?.name || 'BusReservationSystem'}</strong>
                  <div style={{ fontSize: '.8rem', opacity: .9 }}>{viewTicket.buses?.bus_type}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${viewTicket.booking_status === 'CANCELLED' ? 'badge-danger' : 'badge-success'}`} style={{ background: '#fff' }}>
                    {viewTicket.booking_status}
                  </span>
                  <div style={{ fontSize: '.85rem', marginTop: '.2rem' }}>Ref: <strong>{viewTicket.booking_reference}</strong></div>
                </div>
              </div>

              <div className="ticket-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>JOURNEY</span>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {viewTicket.buses?.source} &rarr; {viewTicket.buses?.destination}
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>DATE</span>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                      {new Date(viewTicket.journey_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>

                <div className="ticket-divider"></div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>PASSENGER</span>
                    <div style={{ fontWeight: 700 }}>{viewTicket.passenger_name}</div>
                    <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>{viewTicket.passenger_phone}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>SEATS</span>
                    <div>
                      {viewTicket.seat_numbers?.map(s => (
                        <span key={s} className="seat-tag">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '.85rem', color: 'var(--muted)' }}>Total Amount</span>
                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>₹{viewTicket.total_amount}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => window.print()}
              >
                🖨️ Print Ticket
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setViewTicket(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
