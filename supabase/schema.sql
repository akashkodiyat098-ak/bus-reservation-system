-- ============================================================
--  BUS RESERVATION SYSTEM – SUPABASE BACKEND SCHEMA
-- ============================================================
-- Run this complete script in the Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click Run
-- ============================================================

-- 1. Enable UUID Extension (standard in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. TABLE: PROFILES
-- Linked with auth.users to store passenger profile details
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for email search
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Trigger: Automatically create public.profiles entry upon user signup in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 3. TABLE: BUSES
-- Catalog of buses, operators, routes, schedules, and fares
-- ============================================================
CREATE TABLE IF NOT EXISTS public.buses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    operator TEXT NOT NULL,
    bus_type TEXT NOT NULL CHECK (bus_type IN ('AC Sleeper (2+1)', 'Non-AC Sleeper (2+1)', 'AC Seater (2+2)', 'Luxury Volvo Multi-Axle (2+2)')),
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_hours NUMERIC(4, 1) NOT NULL,
    total_seats INTEGER NOT NULL DEFAULT 32 CHECK (total_seats > 0),
    price_per_seat NUMERIC(10, 2) NOT NULL CHECK (price_per_seat > 0),
    amenities TEXT[] DEFAULT ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Reading Light']::TEXT[],
    rating NUMERIC(2, 1) DEFAULT 4.6 CHECK (rating >= 1.0 AND rating <= 5.0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buses_route ON public.buses(source, destination);

-- ============================================================
-- 4. TABLE: BOOKINGS
-- Holds passenger reservations and booking statuses
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE RESTRICT,
    journey_date DATE NOT NULL,
    seat_numbers TEXT[] NOT NULL CHECK (cardinality(seat_numbers) > 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    passenger_name TEXT NOT NULL,
    passenger_email TEXT NOT NULL,
    passenger_phone TEXT NOT NULL,
    passenger_age INTEGER,
    passenger_gender TEXT CHECK (passenger_gender IN ('Male', 'Female', 'Other')),
    booking_status TEXT NOT NULL DEFAULT 'CONFIRMED' CHECK (booking_status IN ('CONFIRMED', 'CANCELLED', 'COMPLETED')),
    payment_status TEXT NOT NULL DEFAULT 'PAID' CHECK (payment_status IN ('PAID', 'REFUNDED', 'PENDING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bus_date ON public.bookings(bus_id, journey_date);

-- ============================================================
-- 5. TABLE: BOOKING_SEATS
-- Normalised seat locking table to prevent race conditions & double bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS public.booking_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bus_id UUID NOT NULL REFERENCES public.buses(id) ON DELETE CASCADE,
    journey_date DATE NOT NULL,
    seat_number TEXT NOT NULL,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Strict uniqueness: No seat can be booked twice for the same bus and journey date!
    CONSTRAINT uq_bus_journey_seat UNIQUE (bus_id, journey_date, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_booking_seats_lookup ON public.booking_seats(bus_id, journey_date);

-- ============================================================
-- 6. STORED PROCEDURES / RPC FUNCTIONS
-- ============================================================

-- A. Safe Booking RPC with ACID lock
CREATE OR REPLACE FUNCTION public.create_booking(
    p_bus_id UUID,
    p_journey_date DATE,
    p_seat_numbers TEXT[],
    p_total_amount NUMERIC,
    p_passenger_name TEXT,
    p_passenger_email TEXT,
    p_passenger_phone TEXT,
    p_passenger_age INTEGER DEFAULT NULL,
    p_passenger_gender TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_booking_id UUID;
    v_booking_ref TEXT;
    v_seat TEXT;
    v_conflicting_seat TEXT;
    v_result JSONB;
BEGIN
    -- Get current authenticated user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to make a booking';
    END IF;

    -- Generate human-friendly reference e.g. BRS-948123
    v_booking_ref := 'BRS-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

    -- Check if any of the requested seats are already booked
    SELECT seat_number INTO v_conflicting_seat
    FROM public.booking_seats
    WHERE bus_id = p_bus_id
      AND journey_date = p_journey_date
      AND seat_number = ANY(p_seat_numbers)
    LIMIT 1;

    IF v_conflicting_seat IS NOT NULL THEN
        RAISE EXCEPTION 'Seat % is already booked for this journey date.', v_conflicting_seat;
    END IF;

    -- Insert Booking
    INSERT INTO public.bookings (
        booking_reference,
        user_id,
        bus_id,
        journey_date,
        seat_numbers,
        total_amount,
        passenger_name,
        passenger_email,
        passenger_phone,
        passenger_age,
        passenger_gender,
        booking_status,
        payment_status
    ) VALUES (
        v_booking_ref,
        v_user_id,
        p_bus_id,
        p_journey_date,
        p_seat_numbers,
        p_total_amount,
        p_passenger_name,
        p_passenger_email,
        p_passenger_phone,
        p_passenger_age,
        p_passenger_gender,
        'CONFIRMED',
        'PAID'
    ) RETURNING id INTO v_booking_id;

    -- Insert individual seats into reservation map
    FOREACH v_seat IN ARRAY p_seat_numbers
    LOOP
        INSERT INTO public.booking_seats (
            bus_id,
            journey_date,
            seat_number,
            booking_id
        ) VALUES (
            p_bus_id,
            p_journey_date,
            v_seat,
            v_booking_id
        );
    END LOOP;

    -- Return full booking JSON
    SELECT json_build_object(
        'success', true,
        'booking_id', v_booking_id,
        'booking_reference', v_booking_ref,
        'seats', p_seat_numbers,
        'total_amount', p_total_amount
    )::JSONB INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Cancel Booking RPC
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_booking RECORD;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to cancel a booking';
    END IF;

    -- Fetch booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found';
    END IF;

    IF v_booking.user_id <> v_user_id THEN
        RAISE EXCEPTION 'You are not authorized to cancel this booking';
    END IF;

    IF v_booking.booking_status = 'CANCELLED' THEN
        RAISE EXCEPTION 'Booking is already cancelled';
    END IF;

    -- Update booking status
    UPDATE public.bookings
    SET booking_status = 'CANCELLED',
        payment_status = 'REFUNDED',
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- Remove seats from booking_seats to free them for other passengers
    DELETE FROM public.booking_seats
    WHERE booking_id = p_booking_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Booking cancelled successfully and seats released'
    )::JSONB;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Get Booked Seats for a bus & date
CREATE OR REPLACE FUNCTION public.get_booked_seats(p_bus_id UUID, p_journey_date DATE)
RETURNS TABLE (seat_number TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT bs.seat_number
    FROM public.booking_seats bs
    WHERE bs.bus_id = p_bus_id
      AND bs.journey_date = p_journey_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_seats ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Buses Policies
DROP POLICY IF EXISTS "Active buses are viewable by all" ON public.buses;
CREATE POLICY "Active buses are viewable by all" 
    ON public.buses FOR SELECT 
    USING (is_active = true);

-- Bookings Policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Users can view their own bookings" 
    ON public.bookings FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Users can create their own bookings" 
    ON public.bookings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Users can update their own bookings" 
    ON public.bookings FOR UPDATE 
    USING (auth.uid() = user_id);

-- Booking Seats Policies
DROP POLICY IF EXISTS "Anyone can view booked seats" ON public.booking_seats;
CREATE POLICY "Anyone can view booked seats" 
    ON public.booking_seats FOR SELECT 
    USING (true);

-- ============================================================
-- 8. SEED DATA
-- Insert realistic sample buses and popular intercity routes
-- ============================================================
INSERT INTO public.buses (bus_number, name, operator, bus_type, source, destination, departure_time, arrival_time, duration_hours, total_seats, price_per_seat, amenities, rating)
VALUES
    ('KA-01-AB-1001', 'GreenLine Volvo Club Class', 'GreenLine Travels', 'Luxury Volvo Multi-Axle (2+2)', 'Bangalore', 'Chennai', '22:00', '05:30', 7.5, 36, 850.00, ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Live Tracking'], 4.8),
    ('KA-01-AB-1002', 'KSRTC Airavat Diamond', 'KSRTC Express', 'Luxury Volvo Multi-Axle (2+2)', 'Bangalore', 'Hyderabad', '21:30', '06:30', 9.0, 40, 1100.00, ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Reading Light'], 4.7),
    ('MH-12-CD-2001', 'Neeta Sleeper Express', 'Neeta Tours', 'AC Sleeper (2+1)', 'Mumbai', 'Pune', '07:00', '10:30', 3.5, 30, 450.00, ARRAY['Air Conditioning', 'Charging Point', 'Water Bottle'], 4.5),
    ('MH-12-CD-2002', 'IntrCity SmartBus Premium', 'IntrCity', 'AC Sleeper (2+1)', 'Mumbai', 'Goa', '19:30', '07:30', 12.0, 32, 1450.00, ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Snacks'], 4.9),
    ('DL-01-EF-3001', 'Zingbus Maxx AC Seater', 'Zingbus', 'AC Seater (2+2)', 'Delhi', 'Jaipur', '06:30', '11:30', 5.0, 42, 599.00, ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Live Tracking'], 4.6),
    ('DL-01-EF-3002', 'VRL Multi-Axle Sleeper', 'VRL Travels', 'AC Sleeper (2+1)', 'Delhi', 'Manali', '18:00', '08:00', 14.0, 28, 1699.00, ARRAY['Air Conditioning', 'Blanket', 'Charging Point', 'Heater', 'Water Bottle'], 4.8),
    ('TN-09-GH-4001', 'Orange Travels Executive', 'Orange Travels', 'AC Sleeper (2+1)', 'Chennai', 'Bangalore', '23:15', '06:45', 7.5, 30, 890.00, ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle'], 4.7),
    ('TS-08-IJ-5001', 'Kaveri Travels Golden AC', 'Kaveri Travels', 'Luxury Volvo Multi-Axle (2+2)', 'Hyderabad', 'Bangalore', '22:00', '07:00', 9.0, 38, 1050.00, ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket'], 4.6),
    ('GJ-01-KL-6001', 'Patel Tours Semi-Sleeper', 'Patel Travels', 'AC Seater (2+2)', 'Ahmedabad', 'Mumbai', '21:00', '06:00', 9.0, 44, 750.00, ARRAY['Air Conditioning', 'Charging Point', 'Water Bottle'], 4.4),
    ('KL-07-MN-7001', 'Kerala Lines Air Suspension', 'Kerala Lines', 'AC Sleeper (2+1)', 'Bangalore', 'Kochi', '20:30', '07:00', 10.5, 32, 1350.00, ARRAY['Air Conditioning', 'WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Emergency SOS'], 4.8)
ON CONFLICT (bus_number) DO NOTHING;
