import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import PrayerPage from './pages/PrayerPage';
import QiblaPage from './pages/QiblaPage';
import QuranPage from './pages/QuranPage';
import CalendarPage from './pages/CalendarPage';
import DuaPage from './pages/DuaPage';
import SettingsPage from './pages/SettingsPage';

// User Components
import Login from './components/user/Login';
import Register from './components/user/Register';
import Dashboard from './components/user/Dashboard';
import Profile from './components/user/Profile';
import ForgotPassword from './components/user/ForgotPassword';
import ResetPassword from './components/user/ResetPassword';

// Common Components
import NotFoundPage from './pages/NotFoundPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loader from './components/common/Loader';

const AppRoutes = () => {
  const { loading, isAuthenticated } = useAuth();

  // Show loader while checking authentication
  if (loading) {
    return <Loader fullScreen message="Loading application..." />;
  }

  return (
    <Routes>
      {/* ========== PUBLIC ROUTES ========== */}
      <Route path="/" element={<HomePage />} />
      <Route path="/prayer" element={<PrayerPage />} />
      <Route path="/qibla" element={<QiblaPage />} />
      <Route path="/quran" element={<QuranPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/duas" element={<DuaPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      
      {/* ========== AUTH ROUTES ========== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      
      {/* ========== PROTECTED ROUTES ========== */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      
      {/* ========== 404 ROUTE ========== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
