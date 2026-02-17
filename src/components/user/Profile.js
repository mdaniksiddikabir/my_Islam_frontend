import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import axios from 'axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    prayers: { total: 0, streak: 0 },
    quran: { versesRead: 0, bookmarks: 0 },
    duas: { bookmarks: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/users/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#d4af37]"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Profile Header */}
      <div className="glass p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-[#d4af37]/20 mx-auto mb-4 flex items-center justify-center">
          <i className="fas fa-user text-4xl text-[#d4af37]"></i>
        </div>
        <h1 className="text-2xl font-bold text-[#d4af37]">{user?.name}</h1>
        <p className="text-white/70">{user?.email}</p>
        <p className="text-sm text-white/50 mt-2">
          Member since {new Date(user?.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-6 text-center">
          <i className="fas fa-mosque text-3xl text-[#d4af37] mb-3"></i>
          <h3 className="text-lg text-white/70 mb-2">Prayer Stats</h3>
          <p className="text-2xl font-bold text-[#d4af37]">{stats.prayers.total}</p>
          <p className="text-sm text-white/50">Total Prayers</p>
          <p className="text-sm text-[#d4af37] mt-2">
            <i className="fas fa-fire mr-1"></i>
            {stats.prayers.streak} Day Streak
          </p>
        </div>

        <div className="glass p-6 text-center">
          <i className="fas fa-quran text-3xl text-[#d4af37] mb-3"></i>
          <h3 className="text-lg text-white/70 mb-2">Quran Progress</h3>
          <p className="text-2xl font-bold text-[#d4af37]">{stats.quran.versesRead}</p>
          <p className="text-sm text-white/50">Verses Read</p>
          <p className="text-sm text-[#d4af37] mt-2">
            <i className="fas fa-bookmark mr-1"></i>
            {stats.quran.bookmarks} Bookmarks
          </p>
        </div>

        <div className="glass p-6 text-center">
          <i className="fas fa-hands-praying text-3xl text-[#d4af37] mb-3"></i>
          <h3 className="text-lg text-white/70 mb-2">Duas</h3>
          <p className="text-2xl font-bold text-[#d4af37]">{stats.duas.bookmarks}</p>
          <p className="text-sm text-white/50">Bookmarked Duas</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37]">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
              <i className="fas fa-check text-[#d4af37]"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold">Prayer Logged</p>
              <p className="text-sm text-white/50">Fajr prayer - Today at 5:30 AM</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
              <i className="fas fa-book-open text-[#d4af37]"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold">Quran Reading</p>
              <p className="text-sm text-white/50">Surah Al-Kahf, Verse 1-10 - Yesterday</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
              <i className="fas fa-star text-[#d4af37]"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold">Dua Bookmarked</p>
              <p className="text-sm text-white/50">Morning Dua - 2 days ago</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;