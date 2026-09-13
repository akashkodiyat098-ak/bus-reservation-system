import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Fallback seed buses in case Supabase credentials have not been configured yet
export const FALLBACK_BUSES = [
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    bus_number: 'KA-01-AB-1001',
    name: 'GreenLine Volvo Club Class',
    operator: 'GreenLine Travels',
    bus_type: 'Luxury Volvo Multi-Axle (2+2)',
    source: 'Bangalore',
    destination: 'Chennai',
    departure_time: '22:00:00',
    arrival_time: '05:30:00',
    duration_hours: 7.5,
    total_seats: 36,
    price_per_seat: 850.00,
    amenities: ['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Live Tracking'],
    rating: 4.8,
    is_active: true
  },
  {
    id: 'b2222222-2222-2222-2222-222222222222',
    bus_number: 'KA-01-AB-1002',
    name: 'KSRTC Airavat Diamond',
    operator: 'KSRTC Express',
    bus_type: 'Luxury Volvo Multi-Axle (2+2)',
    source: 'Bangalore',
    destination: 'Hyderabad',
    departure_time: '21:30:00',
    arrival_time: '06:30:00',
    duration_hours: 9.0,
    total_seats: 40,
    price_per_seat: 1100.00,
    amenities: ['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Reading Light'],
    rating: 4.7,
    is_active: true
  },
  {
    id: 'b3333333-3333-3333-3333-333333333333',
    bus_number: 'MH-12-CD-2001',
    name: 'Neeta Sleeper Express',
    operator: 'Neeta Tours',
    bus_type: 'AC Sleeper (2+1)',
    source: 'Mumbai',
    destination: 'Pune',
    departure_time: '07:00:00',
    arrival_time: '10:30:00',
    duration_hours: 3.5,
    total_seats: 30,
    price_per_seat: 450.00,
    amenities: ['Air Conditioning', 'Charging Point', 'Water Bottle'],
    rating: 4.5,
    is_active: true
  },
  {
    id: 'b4444444-4444-4444-4444-444444444444',
    bus_number: 'MH-12-CD-2002',
    name: 'IntrCity SmartBus Premium',
    operator: 'IntrCity',
    bus_type: 'AC Sleeper (2+1)',
    source: 'Mumbai',
    destination: 'Goa',
    departure_time: '19:30:00',
    arrival_time: '07:30:00',
    duration_hours: 12.0,
    total_seats: 32,
    price_per_seat: 1450.00,
    amenities: ['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Snacks'],
    rating: 4.9,
    is_active: true
  },
  {
    id: 'b5555555-5555-5555-5555-555555555555',
    bus_number: 'DL-01-EF-3001',
    name: 'Zingbus Maxx AC Seater',
    operator: 'Zingbus',
    bus_type: 'AC Seater (2+2)',
    source: 'Delhi',
    destination: 'Jaipur',
    departure_time: '06:30:00',
    arrival_time: '11:30:00',
    duration_hours: 5.0,
    total_seats: 42,
    price_per_seat: 599.00,
    amenities: ['Air Conditioning', 'WiFi', 'Charging Point', 'Live Tracking'],
    rating: 4.6,
    is_active: true
  },
  {
    id: 'b6666666-6666-6666-6666-666666666666',
    bus_number: 'DL-01-EF-3002',
    name: 'VRL Multi-Axle Sleeper',
    operator: 'VRL Travels',
    bus_type: 'AC Sleeper (2+1)',
    source: 'Delhi',
    destination: 'Manali',
    departure_time: '18:00:00',
    arrival_time: '08:00:00',
    duration_hours: 14.0,
    total_seats: 28,
    price_per_seat: 1699.00,
    amenities: ['Air Conditioning', 'Blanket', 'Charging Point', 'Heater', 'Water Bottle'],
    rating: 4.8,
    is_active: true
  },
  {
    id: 'b7777777-7777-7777-7777-777777777777',
    bus_number: 'TN-09-GH-4001',
    name: 'Orange Travels Executive',
    operator: 'Orange Travels',
    bus_type: 'AC Sleeper (2+1)',
    source: 'Chennai',
    destination: 'Bangalore',
    departure_time: '23:15:00',
    arrival_time: '06:45:00',
    duration_hours: 7.5,
    total_seats: 30,
    price_per_seat: 890.00,
    amenities: ['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle'],
    rating: 4.7,
    is_active: true
  },
  {
    id: 'b8888888-8888-8888-8888-888888888888',
    bus_number: 'TS-08-IJ-5001',
    name: 'Kaveri Travels Golden AC',
    operator: 'Kaveri Travels',
    bus_type: 'Luxury Volvo Multi-Axle (2+2)',
    source: 'Hyderabad',
    destination: 'Bangalore',
    departure_time: '22:00:00',
    arrival_time: '07:00:00',
    duration_hours: 9.0,
    total_seats: 38,
    price_per_seat: 1050.00,
    amenities: ['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket'],
    rating: 4.6,
    is_active: true
  },
  {
    id: 'b9999999-9999-9999-9999-999999999999',
    bus_number: 'GJ-01-KL-6001',
    name: 'Patel Tours Semi-Sleeper',
    operator: 'Patel Travels',
    bus_type: 'AC Seater (2+2)',
    source: 'Ahmedabad',
    destination: 'Mumbai',
    departure_time: '21:00:00',
    arrival_time: '06:00:00',
    duration_hours: 9.0,
    total_seats: 44,
    price_per_seat: 750.00,
    amenities: ['Air Conditioning', 'Charging Point', 'Water Bottle'],
    rating: 4.4,
    is_active: true
  },
  {
    id: 'baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    bus_number: 'KL-07-MN-7001',
    name: 'Kerala Lines Air Suspension',
    operator: 'Kerala Lines',
    bus_type: 'AC Sleeper (2+1)',
    source: 'Bangalore',
    destination: 'Kochi',
    departure_time: '20:30:00',
    arrival_time: '07:00:00',
    duration_hours: 10.5,
    total_seats: 32,
    price_per_seat: 1350.00,
    amenities: ['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Emergency SOS'],
    rating: 4.8,
    is_active: true
  }
];

/**
 * Fetch all active buses or search with optional filters
 */
export async function searchBuses({ source = '', destination = '' } = {}) {
  if (isSupabaseConfigured()) {
    try {
      let query = supabase
        .from('buses')
        .select('*')
        .eq('is_active', true)
        .order('departure_time', { ascending: true });

      if (source.trim()) {
        query = query.ilike('source', `%${source.trim()}%`);
      }
      if (destination.trim()) {
        query = query.ilike('destination', `%${destination.trim()}%`);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return { data, error: null };
      }
      // If table is empty or query had error, fallback smoothly
      if (error) console.warn("Supabase buses query error:", error.message);
    } catch (err) {
      console.warn("Supabase fetch failed, using fallback:", err);
    }
  }

  // Fallback filtering
  let results = getStoredBuses().filter(b => b.is_active !== false);
  if (source.trim()) {
    const s = source.trim().toLowerCase();
    results = results.filter(b => b.source.toLowerCase().includes(s));
  }
  if (destination.trim()) {
    const d = destination.trim().toLowerCase();
    results = results.filter(b => b.destination.toLowerCase().includes(d));
  }
  return { data: results, error: null };
}

/**
 * Admin: Get all buses including inactive ones
 */
export async function getAllBusesAdmin() {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .order('departure_time', { ascending: true });
      if (!error && data) return { data, error: null };
      if (error) console.warn("Error fetching all admin buses:", error.message);
    } catch (err) {
      console.warn("Supabase fetch all admin buses failed:", err);
    }
  }

  // Fallback to local storage or FALLBACK_BUSES
  const localBuses = getStoredBuses();
  return { data: localBuses, error: null };
}

const LOCAL_BUSES_KEY = 'brs_admin_custom_buses';

function getStoredBuses() {
  try {
    const custom = JSON.parse(localStorage.getItem(LOCAL_BUSES_KEY) || 'null');
    if (custom && Array.isArray(custom) && custom.length > 0) {
      return custom;
    }
    localStorage.setItem(LOCAL_BUSES_KEY, JSON.stringify(FALLBACK_BUSES));
    return FALLBACK_BUSES;
  } catch {
    return FALLBACK_BUSES;
  }
}

function saveStoredBuses(buses) {
  try {
    localStorage.setItem(LOCAL_BUSES_KEY, JSON.stringify(buses));
  } catch (e) {
    console.warn("Could not save buses to localStorage:", e);
  }
}

/**
 * Admin: Create a new bus
 */
export async function createBus(busData) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('buses')
        .insert({
          bus_number: busData.bus_number,
          name: busData.name,
          operator: busData.operator,
          bus_type: busData.bus_type,
          source: busData.source,
          destination: busData.destination,
          departure_time: busData.departure_time,
          arrival_time: busData.arrival_time,
          duration_hours: parseFloat(busData.duration_hours) || 6.0,
          total_seats: parseInt(busData.total_seats) || 32,
          price_per_seat: parseFloat(busData.price_per_seat) || 500,
          amenities: Array.isArray(busData.amenities) ? busData.amenities : [],
          rating: parseFloat(busData.rating) || 4.5,
          is_active: busData.is_active !== undefined ? busData.is_active : true
        })
        .select()
        .single();

      if (!error && data) return { data, error: null };
      if (error) return { data: null, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Local storage fallback
  const list = getStoredBuses();
  const newBus = {
    ...busData,
    id: 'b-local-' + Date.now(),
    duration_hours: parseFloat(busData.duration_hours) || 6.0,
    total_seats: parseInt(busData.total_seats) || 32,
    price_per_seat: parseFloat(busData.price_per_seat) || 500,
    amenities: Array.isArray(busData.amenities) ? busData.amenities : [],
    rating: parseFloat(busData.rating) || 4.5,
    is_active: busData.is_active !== undefined ? busData.is_active : true
  };
  list.unshift(newBus);
  saveStoredBuses(list);
  return { data: newBus, error: null };
}

/**
 * Admin: Update an existing bus
 */
export async function updateBus(id, updates) {
  if (isSupabaseConfigured()) {
    try {
      const payload = { ...updates };
      if (payload.duration_hours) payload.duration_hours = parseFloat(payload.duration_hours);
      if (payload.total_seats) payload.total_seats = parseInt(payload.total_seats);
      if (payload.price_per_seat) payload.price_per_seat = parseFloat(payload.price_per_seat);
      if (payload.rating) payload.rating = parseFloat(payload.rating);

      const { data, error } = await supabase
        .from('buses')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) return { data, error: null };
      if (error) return { data: null, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Local storage fallback
  const list = getStoredBuses();
  const idx = list.findIndex(b => b.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    saveStoredBuses(list);
    return { data: list[idx], error: null };
  }
  return { data: null, error: { message: 'Bus not found' } };
}

/**
 * Admin: Delete a bus
 */
export async function deleteBus(id) {
  if (isSupabaseConfigured()) {
    try {
      const { error } = await supabase
        .from('buses')
        .delete()
        .eq('id', id);

      if (!error) return { success: true, error: null };
      if (error) return { success: false, error };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  // Local storage fallback
  const list = getStoredBuses().filter(b => b.id !== id);
  saveStoredBuses(list);
  return { success: true, error: null };
}

/**
 * Get a single bus by ID
 */
export async function getBusById(busId) {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('buses')
        .select('*')
        .eq('id', busId)
        .single();
      if (!error && data) return { data, error: null };
    } catch (err) {
      console.warn("Error getting bus by ID from Supabase:", err);
    }
  }

  const list = getStoredBuses();
  const bus = list.find(b => b.id === busId) || FALLBACK_BUSES.find(b => b.id === busId) || list[0] || FALLBACK_BUSES[0];
  return { data: bus, error: null };
}

/**
 * Get unique city list for search dropdowns/autocompletes
 */
export async function getDistinctCities() {
  const { data } = await searchBuses();
  const cities = new Set();
  (data || []).forEach(b => {
    cities.add(b.source);
    cities.add(b.destination);
  });
  return Array.from(cities).sort();
}

