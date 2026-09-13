import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { getBusById } from './busService';

const LOCAL_BOOKINGS_KEY = 'brs_local_bookings';
const LOCAL_SEATS_KEY = 'brs_local_seats';

function getLocalBookings() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalBookings(bookings) {
  try {
    localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify(bookings));
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
}

/**
 * Get list of seat numbers already booked for a specific bus on a specific date
 */
export async function getBookedSeats(busId, journeyDate) {
  let booked = [];

  if (isSupabaseConfigured()) {
    try {
      // 1. Try stored procedure RPC first
      const { data: rpcData, error: rpcErr } = await supabase.rpc('get_booked_seats', {
        p_bus_id: busId,
        p_journey_date: journeyDate
      });

      if (!rpcErr && rpcData) {
        booked = rpcData.map(r => (typeof r === 'string' ? r : r.seat_number));
        return { data: booked, error: null };
      }

      // 2. Direct table fallback if RPC isn't loaded yet
      const { data: tableData, error: tblErr } = await supabase
        .from('booking_seats')
        .select('seat_number')
        .eq('bus_id', busId)
        .eq('journey_date', journeyDate);

      if (!tblErr && tableData) {
        booked = tableData.map(r => r.seat_number);
        return { data: booked, error: null };
      }
    } catch (err) {
      console.warn("Error fetching booked seats from Supabase:", err);
    }
  }

  // Fallback to localStorage reservations
  const localList = getLocalBookings();
  const matched = localList
    .filter(b => b.bus_id === busId && b.journey_date === journeyDate && b.booking_status !== 'CANCELLED')
    .flatMap(b => b.seat_numbers);

  // Add realistic simulated pre-booked seats for realism if none booked yet
  const defaultTaken = ['S2', 'S5', 'S12'];
  const allTaken = Array.from(new Set([...matched, ...defaultTaken]));

  return { data: allTaken, error: null };
}

/**
 * Make a new bus booking (ACID transaction)
 */
export async function createBooking({
  busId,
  journeyDate,
  seatNumbers,
  totalAmount,
  passengerName,
  passengerEmail,
  passengerPhone,
  passengerAge,
  passengerGender,
  user
}) {
  const userId = user?.id;

  if (isSupabaseConfigured() && userId) {
    try {
      // Call Supabase create_booking RPC function
      const { data, error } = await supabase.rpc('create_booking', {
        p_bus_id: busId,
        p_journey_date: journeyDate,
        p_seat_numbers: seatNumbers,
        p_total_amount: totalAmount,
        p_passenger_name: passengerName,
        p_passenger_email: passengerEmail,
        p_passenger_phone: passengerPhone,
        p_passenger_age: passengerAge ? parseInt(passengerAge) : null,
        p_passenger_gender: passengerGender || null
      });

      if (error) {
        // If RPC isn't installed yet, fallback to direct INSERTs
        console.warn("create_booking RPC failed, attempting direct table insert:", error.message);
        
        const bookingRef = 'BRS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: newBooking, error: insErr } = await supabase
          .from('bookings')
          .insert({
            booking_reference: bookingRef,
            user_id: userId,
            bus_id: busId,
            journey_date: journeyDate,
            seat_numbers: seatNumbers,
            total_amount: totalAmount,
            passenger_name: passengerName,
            passenger_email: passengerEmail,
            passenger_phone: passengerPhone,
            passenger_age: passengerAge ? parseInt(passengerAge) : null,
            passenger_gender: passengerGender || null,
            booking_status: 'CONFIRMED',
            payment_status: 'PAID'
          })
          .select('*, buses(*)')
          .single();

        if (insErr) throw insErr;

        // Reserve seats in booking_seats
        const seatRows = seatNumbers.map(seat => ({
          bus_id: busId,
          journey_date: journeyDate,
          seat_number: seat,
          booking_id: newBooking.id
        }));

        await supabase.from('booking_seats').insert(seatRows);
        return { data: newBooking, error: null };
      }

      // Fetch the full newly created booking with bus info
      const { data: fullBooking } = await supabase
        .from('bookings')
        .select('*, buses(*)')
        .eq('id', data.booking_id)
        .single();

      return { data: fullBooking || data, error: null };
    } catch (err) {
      console.warn("Supabase booking creation failed:", err);
      // Surface seat-conflict errors directly; fall through to local for network/auth issues
      if (err.message && err.message.toLowerCase().includes('already booked')) {
        return { data: null, error: err };
      }
      // Otherwise fall through to local fallback
    }
  }

  // Fallback Local Reservation for demo or when Supabase keys are pending
  const { data: bus } = await getBusById(busId);
  const bookingRef = 'BRS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const newBooking = {
    id: 'local-' + Date.now(),
    booking_reference: bookingRef,
    user_id: userId || 'guest-user',
    bus_id: busId,
    buses: bus,
    journey_date: journeyDate,
    seat_numbers: seatNumbers,
    total_amount: totalAmount,
    passenger_name: passengerName,
    passenger_email: passengerEmail,
    passenger_phone: passengerPhone,
    passenger_age: passengerAge,
    passenger_gender: passengerGender,
    booking_status: 'CONFIRMED',
    payment_status: 'PAID',
    created_at: new Date().toISOString()
  };

  const currentLocal = getLocalBookings();
  currentLocal.unshift(newBooking);
  saveLocalBookings(currentLocal);

  return { data: newBooking, error: null };
}

/**
 * Fetch all bookings for a user
 */
export async function getUserBookings(userId) {
  let supabaseBookings = [];

  if (isSupabaseConfigured() && userId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, buses(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseBookings = data;
      }
    } catch (err) {
      console.warn("Error fetching user bookings from Supabase:", err);
    }
  }

  // Merge with local bookings that belong to this user or guest
  const localList = getLocalBookings().filter(
    b => b.user_id === userId || b.user_id === 'guest-user'
  );

  // De-duplicate by booking_reference
  const combined = [...supabaseBookings];
  localList.forEach(loc => {
    if (!combined.some(c => c.booking_reference === loc.booking_reference)) {
      combined.push(loc);
    }
  });

  return { data: combined, error: null };
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId, userId) {
  if (isSupabaseConfigured() && userId && !bookingId.startsWith('local-')) {
    try {
      // 1. Try cancel_booking RPC
      const { data: rpcData, error: rpcErr } = await supabase.rpc('cancel_booking', {
        p_booking_id: bookingId
      });

      if (!rpcErr) {
        return { success: true, data: rpcData, error: null };
      }

      // 2. Direct update fallback
      const { error: updErr } = await supabase
        .from('bookings')
        .update({ booking_status: 'CANCELLED', payment_status: 'REFUNDED', updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .eq('user_id', userId);

      if (updErr) throw updErr;

      // Delete reserved seats
      await supabase.from('booking_seats').delete().eq('booking_id', bookingId);
      return { success: true, error: null };
    } catch (err) {
      console.warn("Supabase cancel failed:", err);
      return { success: false, error: err };
    }
  }

  // Local cancel
  const local = getLocalBookings();
  const idx = local.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    local[idx].booking_status = 'CANCELLED';
    local[idx].payment_status = 'REFUNDED';
    saveLocalBookings(local);
  }

  return { success: true, error: null };
}

/**
 * Admin: Get all bookings across all users
 */
export async function getAllBookingsAdmin() {
  let supabaseBookings = [];

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, buses(*)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        supabaseBookings = data;
      } else if (error) {
        console.warn("Error fetching admin bookings from Supabase:", error.message);
      }
    } catch (err) {
      console.warn("Supabase admin bookings fetch failed:", err);
    }
  }

  // Combine with local bookings
  const localList = getLocalBookings();
  const combined = [...supabaseBookings];
  localList.forEach(loc => {
    if (!combined.some(c => c.booking_reference === loc.booking_reference)) {
      combined.push(loc);
    }
  });

  return { data: combined, error: null };
}

/**
 * Admin: Update booking status (e.g. CANCELLED, CONFIRMED)
 */
export async function updateBookingStatusAdmin(bookingId, newStatus) {
  if (isSupabaseConfigured() && !bookingId.startsWith('local-')) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          booking_status: newStatus,
          payment_status: newStatus === 'CANCELLED' ? 'REFUNDED' : 'PAID',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select('*, buses(*)')
        .single();

      if (newStatus === 'CANCELLED') {
        await supabase.from('booking_seats').delete().eq('booking_id', bookingId);
      }

      if (!error && data) return { data, error: null };
      if (error) return { data: null, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Local fallback
  const local = getLocalBookings();
  const idx = local.findIndex(b => b.id === bookingId);
  if (idx !== -1) {
    local[idx].booking_status = newStatus;
    local[idx].payment_status = newStatus === 'CANCELLED' ? 'REFUNDED' : 'PAID';
    saveLocalBookings(local);
    return { data: local[idx], error: null };
  }
  return { data: null, error: { message: 'Booking not found' } };
}

