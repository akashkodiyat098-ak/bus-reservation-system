import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import Buses from './pages/Buses';
import Seats from './pages/Seats';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';

export default function App() {
  const location = useLocation();
  const isAuthPage = ['/login', '/login.html', '/signup', '/signup.html'].includes(location.pathname);

  return (
    <>
      {!isAuthPage && <Navbar />}
      <Routes>
        {/* Home */}
        <Route path="/" element={<Home />} />
        <Route path="/index.html" element={<Home />} />

        {/* Buses */}
        <Route path="/buses" element={<Buses />} />
        <Route path="/buses.html" element={<Buses />} />

        {/* Seats */}
        <Route path="/seats" element={<Seats />} />
        <Route path="/seats.html" element={<Seats />} />

        {/* My Bookings (Protected - requires login) */}
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings.html"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard (Protected - requires admin role) */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
        <Route
          path="/admin.html"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        {/* Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/login.html" element={<Login />} />

        {/* Signup */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup.html" element={<Signup />} />

        {/* Fallback */}
        <Route path="*" element={<Home />} />
      </Routes>
      {!isAuthPage && <Footer />}
    </>
  );
}
