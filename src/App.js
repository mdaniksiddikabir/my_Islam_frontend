import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeProvider'; // If you have this
import { SettingsProvider } from './context/SettingsContext'; // If you have this

// Pages
import HomePage from './pages/HomePage';
import PrayerPage from './pages/PrayerPage';
import QiblaPage from './pages/QiblaPage';
import QuranPage from './pages/QuranPage';
import CalendarPage from './pages/CalendarPage';
import DuaPage from './pages/DuaPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
import Register from './components/user/Register';
import ForgotPassword from './components/user/ForgotPassword';
import ResetPassword from './components/user/ResetPassword';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary';
import ProtectedRoute from './components/common/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>      {/* MUST be before AuthProvider if Auth uses Language */}
          <AuthProvider>         {/* AuthProvider wraps everything that needs auth */}
            <ThemeProvider>      {/* If you have theme */}
              <SettingsProvider> {/* If you have settings */}
                <Router>
                  <div className="min-h-screen bg-gradient-to-br from-[#0a2a3b] to-[#1a3f54] text-white">
                    <Navbar />
                    <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password/:token" element={<ResetPassword />} />
                        <Route path="/prayer" element={<PrayerPage />} />
                        <Route path="/qibla" element={<QiblaPage />} />
                        <Route path="/quran" element={<QuranPage />} />
                        <Route path="/calendar" element={<CalendarPage />} />
                        <Route path="/duas" element={<DuaPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        
                        {/* Protected Routes */}
                        <Route path="/profile" element={
                          <ProtectedRoute>
                            <ProfilePage />
                          </ProtectedRoute>
                        } />
                        
                        {/* 404 Route */}
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                    </main>
                    <Footer />
                    <Toaster 
                      position="bottom-right"
                      toastOptions={{
                        duration: 4000,
                        style: {
                          background: '#1a3f54',
                          color: '#fff',
                          border: '1px solid #d4af37',
                        },
                      }}
                    />
                  </div>
                </Router>
              </SettingsProvider>
            </ThemeProvider>
          </AuthProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
