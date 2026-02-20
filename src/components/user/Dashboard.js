import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import Loader from '../common/Loader';

const Dashboard = () => {
  const { user } = useAuth();
  const [nextPrayer, setNextPrayer] = useState(null);
  const [dailyVerse, setDailyVerse] = useState(null);
  const [dailyDua, setDailyDua] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [prayerRes, verseRes, duaRes] = await Promise.all([
        axios.get('/api/prayer/next').catch(() => ({ data: { data: null } })),
        axios.get('/api/quran/daily').catch(() => ({ data: { data: null } })),
        axios.get('/api/duas/daily').catch(() => ({ data: { data: null } }))
      ]);
      
      setNextPrayer(prayerRes?.data?.data);
      setDailyVerse(verseRes?.data?.data);
      setDailyDua(duaRes?.data?.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show loader while checking auth or loading data
  if (!user) {
    return <Loader fullScreen message="Loading user..." />;
  }

  if (loading) {
    return <Loader fullScreen message="Loading dashboard..." />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <div className="glass p-6 bg-gradient-to-r from-[#d4af37]/20 to-transparent">
        <h1 className="text-2xl font-bold text-[#d4af37] mb-2">
          Welcome back, {user?.name || 'User'}!
        </h1>
        <p className="text-white/70">
          Your spiritual journey continues. Here's your daily summary.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/prayer" className="glass p-4 text-center hover:border-[#d4af37] transition">
          <i className="fas fa-clock text-2xl text-[#d4af37] mb-2"></i>
          <h3 className="text-sm">Prayer Times</h3>
        </Link>

        <Link to="/quran" className="glass p-4 text-center hover:border-[#d4af37] transition">
          <i className="fas fa-quran text-2xl text-[#d4af37] mb-2"></i>
          <h3 className="text-sm">Read Quran</h3>
        </Link>

        <Link to="/duas" className="glass p-4 text-center hover:border-[#d4af37] transition">
          <i className="fas fa-hands-praying text-2xl text-[#d4af37] mb-2"></i>
          <h3 className="text-sm">Daily Duas</h3>
        </Link>

        <Link to="/qibla" className="glass p-4 text-center hover:border-[#d4af37] transition">
          <i className="fas fa-compass text-2xl text-[#d4af37] mb-2"></i>
          <h3 className="text-sm">Qibla Finder</h3>
        </Link>
      </div>

      {/* Today's Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Prayer */}
        {nextPrayer && (
          <div className="glass p-6">
            <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
              <i className="fas fa-clock mr-2"></i>
              Next Prayer
            </h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#d4af37] mb-2">
                {nextPrayer?.name || 'N/A'}
              </p>
              <p className="text-xl">{nextPrayer?.time || '--:--'}</p>
              <p className="text-sm text-white/50 mt-2">
                Time remaining: {nextPrayer?.remaining || '0 min'}
              </p>
            </div>
          </div>
        )}

        {/* Daily Verse */}
        {dailyVerse && (
          <div className="glass p-6">
            <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
              <i className="fas fa-quran mr-2"></i>
              Today's Verse
            </h3>
            <p className="text-xl mb-2 text-right font-arabic">{dailyVerse?.arabic || ''}</p>
            <p className="text-white/80 mb-2">{dailyVerse?.translation || ''}</p>
            <p className="text-sm text-[#d4af37]">
              {dailyVerse?.surah || ''} - Verse {dailyVerse?.verse || ''}
            </p>
          </div>
        )}
      </div>

      {/* Daily Dua */}
      {dailyDua && (
        <div className="glass p-6">
          <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
            <i className="fas fa-star mr-2"></i>
            Daily Dua
          </h3>
          <p className="text-xl mb-2 text-right font-arabic">{dailyDua?.arabic || ''}</p>
          <p className="text-white/80">{dailyDua?.translation || ''}</p>
          <p className="text-sm text-[#d4af37] mt-2">{dailyDua?.reference || ''}</p>
        </div>
      )}

      {/* Show message if no data */}
      {!nextPrayer && !dailyVerse && !dailyDua && (
        <div className="glass p-6 text-center">
          <p className="text-white/50">No data available. Check back later.</p>
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
