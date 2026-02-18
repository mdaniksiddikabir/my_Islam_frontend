import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { LanguageProvider } from './context/LanguageContext';

// Pages
import HomePage from './pages/HomePage';
import PrayerPage from './pages/PrayerPage';
import QiblaPage from './pages/QiblaPage';
import QuranPage from './pages/QuranPage';
import CalendarPage from './pages/CalendarPage';
import DuaPage from './pages/DuaPage';
import SettingsPage from './pages/SettingsPage';
import Login from './components/user/Login';

// Components
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ErrorBoundary from './components/common/ErrorBoundary'; // ← ADDED

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <ErrorBoundary> {/* ← ADDED */}
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <Router>
            <div className="min-h-screen bg-gradient-to-br from-[#0a2a3b] to-[#1a3f54] text-white">
              <Navbar />
              <main className="pt-20 pb-10 px-4 max-w-7xl mx-auto">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<login />} />
                  <Route path="/prayer" element={<PrayerPage />} />
                  <Route path="/qibla" element={<QiblaPage />} />
                  <Route path="/quran" element={<QuranPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/duas" element={<DuaPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
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
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
