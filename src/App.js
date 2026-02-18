import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SettingsProvider } from './context/SettingsContext';

// Pages
import HomePage from './pages/HomePage';
import PrayerPage from './pages/PrayerPage';
import QiblaPage from './pages/QiblaPage';
import QuranPage from './pages/QuranPage';
import CalendarPage from './pages/CalendarPage';
import DuaPage from './pages/DuaPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// User Components
import Login from './components/user/Login';
import Register from './components/user/Register';
import Dashboard from './components/user/Dashboard';

// Common Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import PrivateRoute from './components/common/PrivateRoute';
import Loader from './components/common/Loader';
import ErrorBoundary from './components/common/ErrorBoundary';

// Styles
import './styles/globals.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <SettingsProvider>
                <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      
                      {/* Feature Routes (Public) */}
                      <Route path="/prayer" element={<PrayerPage />} />
                      <Route path="/qibla" element={<QiblaPage />} />
                      <Route path="/quran" element={<QuranPage />} />
                      <Route path="/calendar" element={<CalendarPage />} />
                      <Route path="/dua" element={<DuaPage />} />
                      
                      {/* Protected Routes (Require Authentication) */}
                      <Route path="/dashboard" element={
                        <PrivateRoute>
                          <Dashboard />
                        </PrivateRoute>
                      } />
                      <Route path="/profile" element={
                        <PrivateRoute>
                          <ProfilePage />
                        </PrivateRoute>
                      } />
                      <Route path="/settings" element={
                        <PrivateRoute>
                          <SettingsPage />
                        </PrivateRoute>
                      } />
                      
                      {/* 404 Route */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </SettingsProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
