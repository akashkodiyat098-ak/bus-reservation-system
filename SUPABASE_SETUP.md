# Supabase Backend Setup Guide

This guide walks you through setting up your **Supabase backend** for the Bus Reservation System in 3 quick steps.

---

## Step 1: Create a Free Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and log in or sign up for a free account.
2. In the Supabase Dashboard, click **New Project**.
3. Fill in:
   - **Name**: `bus-reservation-system` (or any name you prefer)
   - **Database Password**: Choose a strong password and save it
   - **Region**: Choose the region closest to you (e.g. *South Asia - Mumbai*)
4. Click **Create new project** and wait 1–2 minutes for the database to spin up.

---

## Step 2: Run the Database Schema & Seed Data

1. In your Supabase project dashboard, click the **SQL Editor** tab (icon `>_` on the left sidebar).
2. Click **+ New query**.
3. Open the file [`supabase/schema.sql`](./supabase/schema.sql) in this project, copy all its contents, and paste them into the SQL editor.
4. Click the green **Run** button (or press `Ctrl + Enter`).
5. You should see `Success. No rows returned` in the console.

### What this creates:
- **`profiles` table**: Synchronized with Supabase Auth users via an automatic database trigger (`on_auth_user_created`).
- **`buses` table**: Catalog of buses, operators, routes, schedules, prices, amenities, and ratings.
- **`bookings` table**: Confirmed/cancelled ticket reservations with passenger info and reference IDs (`BRS-XXXXXX`).
- **`booking_seats` table**: Real-time seat reservation map with database-level `UNIQUE (bus_id, journey_date, seat_number)` constraint to eliminate race conditions and double-booking.
- **ACID Stored Procedures**:
  - `create_booking(...)`: Locks seats, verifies availability, creates booking, and reserves seats atomically.
  - `cancel_booking(...)`: Securely cancels user's booking and frees up seats.
  - `get_booked_seats(...)`: Fetches already booked seats for any date.
- **Row Level Security (RLS)**: Enforced on all tables to keep user bookings secure.
- **Seed Data**: 10 real-world routes across major Indian cities (Bangalore, Chennai, Mumbai, Pune, Goa, Delhi, Jaipur, Hyderabad, etc.).

---

## Step 3: Configure Your Environment Variables

1. In your Supabase Dashboard, go to **Project Settings** (gear icon at the bottom of the left sidebar) -> **API**.
2. Copy the two values:
   - **Project URL**: (e.g. `https://xyzcompany.supabase.co`)
   - **Project API Keys -> `anon` / `public`**: (e.g. `eyJhbGciOi...`)
3. In the root of this project, open or create the `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
4. Restart your Vite development server:
   ```bash
   npm run dev
   ```

---

## Authentication Configuration (Optional)

By default, Supabase requires email confirmation before a user can sign in. If you want users to sign in immediately after registration without verifying their email:
1. In the Supabase Dashboard, go to **Authentication** -> **Providers** -> **Email**.
2. Toggle off **Confirm email**.
3. Click **Save**.
