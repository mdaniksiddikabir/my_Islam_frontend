import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loader from '../common/Loader';

const Profile = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [stats, setStats] = useState({
    prayers: { total: 0, streak: 0, onTime: 0, missed: 0 },
    quran: { versesRead: 0, bookmarks: 0, surahsCompleted: 0, juzCompleted: 0 },
    duas: { bookmarks: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchStats();
  }, [currentLanguage]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch user stats
      const response = await axios.get('/api/users/stats');
      
      if (response.data?.success && response.data?.data) {
        setStats(response.data.data);
        
        // Generate recent activity from stats
        generateRecentActivity(response.data.data);
      } else {
        // If no data, use defaults
        setStats({
          prayers: { total: 0, streak: 0, onTime: 0, missed: 0 },
          quran: { versesRead: 0, bookmarks: 0, surahsCompleted: 0, juzCompleted: 0 },
          duas: { bookmarks: 0 }
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
      toast.error(t('errors.stats') || 'Failed to load stats');
      
      // Set default stats on error
      setStats({
        prayers: { total: 0, streak: 0, onTime: 0, missed: 0 },
        quran: { versesRead: 0, bookmarks: 0, surahsCompleted: 0, juzCompleted: 0 },
        duas: { bookmarks: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivity = (statsData) => {
    const activities = [];
    const now = new Date();
    
    // Prayer activity
    if (statsData.prayers?.total > 0) {
      activities.push({
        id: 1,
        type: 'prayer',
        icon: 'fas fa-check',
        title: currentLanguage === 'bn' ? 'নামাজ লগ করা হয়েছে' : 'Prayer Logged',
        description: currentLanguage === 'bn' 
          ? `মোট ${statsData.prayers.total}টি নামাজ লগ করা হয়েছে`
          : `Total ${statsData.prayers.total} prayers logged`,
        time: currentLanguage === 'bn' ? 'আজ' : 'Today',
        color: 'text-emerald-400'
      });
    }

    // Quran activity
    if (statsData.quran?.versesRead > 0) {
      activities.push({
        id: 2,
        type: 'quran',
        icon: 'fas fa-book-open',
        title: currentLanguage === 'bn' ? 'কোরআন পড়া' : 'Quran Reading',
        description: currentLanguage === 'bn' 
          ? `${statsData.quran.versesRead}টি আয়াত পড়া হয়েছে`
          : `${statsData.quran.versesRead} verses read`,
        time: currentLanguage === 'bn' ? 'আজ' : 'Today',
        color: 'text-blue-400'
      });
    }

    // Dua activity
    if (statsData.duas?.bookmarks > 0) {
      activities.push({
        id: 3,
        type: 'dua',
        icon: 'fas fa-star',
        title: currentLanguage === 'bn' ? 'দোয়া বুকমার্ক' : 'Dua Bookmarked',
        description: currentLanguage === 'bn' 
          ? `${statsData.duas.bookmarks}টি দোয়া বুকমার্ক করা হয়েছে`
          : `${statsData.duas.bookmarks} duas bookmarked`,
        time: currentLanguage === 'bn' ? 'আজ' : 'Today',
        color: 'text-amber-400'
      });
    }

    // Streak activity
    if (statsData.prayers?.streak > 0) {
      activities.push({
        id: 4,
        type: 'streak',
        icon: 'fas fa-fire',
        title: currentLanguage === 'bn' ? 'নামাজের ধারা' : 'Prayer Streak',
        description: currentLanguage === 'bn' 
          ? `${statsData.prayers.streak} দিনের ধারা`
          : `${statsData.prayers.streak} day streak`,
        time: currentLanguage === 'bn' ? 'চলমান' : 'Active',
        color: 'text-orange-400'
      });
    }

    setRecentActivity(activities);
  };

  // Safe date formatter
  const formatJoinDate = () => {
    if (!user?.createdAt) return currentLanguage === 'bn' ? 'N/A' : 'N/A';
    try {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return currentLanguage === 'bn' ? 'N/A' : 'N/A';
    }
  };

  if (loading) {
    return <Loader fullScreen message={currentLanguage === 'bn' ? 'প্রোফাইল লোড হচ্ছে...' : 'Loading profile...'} />;
  }

  // Safety check for user
  if (!user) {
    return (
      <div className="glass p-6 text-center">
        <i className="fas fa-exclamation-triangle text-4xl text-yellow-500 mb-4"></i>
        <p className="text-white/70 mb-4">
          {currentLanguage === 'bn' ? 'প্রোফাইল দেখতে লগ ইন করুন' : 'Please log in to view your profile'}
        </p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="px-6 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold"
        >
          {currentLanguage === 'bn' ? 'লগ ইন করুন' : 'Log In'}
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Error Message */}
      {error && (
        <div className="glass p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-center">
          <p className="text-red-400">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-2 text-sm text-white/50 hover:text-white"
          >
            <i className="fas fa-sync-alt mr-1"></i>
            {currentLanguage === 'bn' ? 'পুনরায় চেষ্টা' : 'Retry'}
          </button>
        </div>
      )}

      {/* Profile Header */}
      <div className="glass p-6 text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#d4af37]/5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 rounded-full -ml-12 -mb-12"></div>
        
        <div className="relative z-10">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#d4af37] to-amber-600 mx-auto mb-4 flex items-center justify-center shadow-lg shadow-[#d4af37]/20">
            <i className="fas fa-user text-4xl text-[#1a3f54]"></i>
          </div>
          <h1 className="text-2xl font-bold text-[#d4af37] mb-1">{user?.name || 'User'}</h1>
          <p className="text-white/70 mb-2">{user?.email || 'No email'}</p>
          <div className="inline-block glass px-4 py-2 rounded-full">
            <i className="fas fa-calendar-alt text-[#d4af37] mr-2"></i>
            <span className="text-sm text-white/70">
              {currentLanguage === 'bn' ? 'সদস্য since' : 'Member since'} {formatJoinDate()}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Prayer Stats Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass p-6 text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          <i className="fas fa-mosque text-3xl text-emerald-400 mb-3"></i>
          <h3 className="text-lg text-white/70 mb-2">
            {currentLanguage === 'bn' ? 'নামাজের পরিসংখ্যান' : 'Prayer Stats'}
          </h3>
          <p className="text-3xl font-bold text-emerald-400 mb-1">{stats.prayers.total}</p>
          <p className="text-sm text-white/50">
            {currentLanguage === 'bn' ? 'মোট নামাজ' : 'Total Prayers'}
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-xs px-2 py-1 bg-emerald-500/20 rounded-full text-emerald-400">
              <i className="fas fa-check mr-1"></i>
              {stats.prayers.onTime || 0}
            </span>
            <span className="text-xs px-2 py-1 bg-red-500/20 rounded-full text-red-400">
              <i className="fas fa-times mr-1"></i>
              {stats.prayers.missed || 0}
            </span>
          </div>
          <p className="text-sm text-[#d4af37] mt-3">
            <i className="fas fa-fire mr-1"></i>
            {stats.prayers.streak} {currentLanguage === 'bn' ? 'দিনের ধারা' : 'Day Streak'}
          </p>
        </motion.div>

        {/* Quran Stats Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass p-6 text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          <i className="fas fa-quran text-3xl text-blue-400 mb-3"></i>
          <h3 className="text-lg text-white/70 mb-2">
            {currentLanguage === 'bn' ? 'কোরআন অগ্রগতি' : 'Quran Progress'}
          </h3>
          <p className="text-3xl font-bold text-blue-400 mb-1">{stats.quran.versesRead}</p>
          <p className="text-sm text-white/50">
            {currentLanguage === 'bn' ? 'পঠিত আয়াত' : 'Verses Read'}
          </p>
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="text-xs px-2 py-1 bg-blue-500/20 rounded-full text-blue-400">
              {stats.quran.surahsCompleted || 0} {currentLanguage === 'bn' ? 'সূরা' : 'Surahs'}
            </span>
            <span className="text-xs px-2 py-1 bg-purple-500/20 rounded-full text-purple-400">
              {stats.quran.juzCompleted || 0} {currentLanguage === 'bn' ? 'পারা' : 'Juz'}
            </span>
          </div>
          <p className="text-sm text-[#d4af37] mt-3">
            <i className="fas fa-bookmark mr-1"></i>
            {stats.quran.bookmarks} {currentLanguage === 'bn' ? 'বুকমার্ক' : 'Bookmarks'}
          </p>
        </motion.div>

        {/* Duas Stats Card */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="glass p-6 text-center relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
          <i className="fas fa-hands-praying text-3xl text-amber-400 mb-3"></i>
          <h3 className="text-lg text-white/70 mb-2">
            {currentLanguage === 'bn' ? 'দোয়া' : 'Duas'}
          </h3>
          <p className="text-3xl font-bold text-amber-400 mb-1">{stats.duas.bookmarks}</p>
          <p className="text-sm text-white/50">
            {currentLanguage === 'bn' ? 'সংরক্ষিত দোয়া' : 'Bookmarked Duas'}
          </p>
          <div className="mt-6">
            <span className="text-xs px-3 py-1 bg-amber-500/20 rounded-full text-amber-400">
              <i className="fas fa-star mr-1"></i>
              {currentLanguage === 'bn' ? 'পঠিত' : 'Recent'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-history mr-2"></i>
          {currentLanguage === 'bn' ? 'সাম্প্রতিক কার্যক্রম' : 'Recent Activity'}
        </h3>
        
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition group"
              >
                <div className={`w-10 h-10 rounded-full ${activity.color}/20 flex items-center justify-center group-hover:scale-110 transition`}>
                  <i className={`${activity.icon} ${activity.color}`}></i>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white/90">{activity.title}</p>
                  <p className="text-sm text-white/50">{activity.description}</p>
                </div>
                <span className="text-xs text-white/30">{activity.time}</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <i className="fas fa-clock text-4xl text-white/20 mb-3"></i>
            <p className="text-white/50">
              {currentLanguage === 'bn' ? 'কোনো কার্যক্রম নেই' : 'No recent activity'}
            </p>
          </div>
        )}
      </div>

      {/* Achievement Badges */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-trophy mr-2"></i>
          {currentLanguage === 'bn' ? 'অর্জন' : 'Achievements'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Streak Badge */}
          {stats.prayers.streak >= 7 && (
            <div className="p-3 bg-gradient-to-br from-amber-900/30 to-amber-800/10 rounded-lg text-center">
              <i className="fas fa-fire text-2xl text-amber-400 mb-2"></i>
              <p className="text-xs font-bold">7 Day Streak</p>
              <p className="text-[10px] text-white/50">Consistent Prayer</p>
            </div>
          )}
          
          {/* Quran Badge */}
          {stats.quran.versesRead >= 100 && (
            <div className="p-3 bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 rounded-lg text-center">
              <i className="fas fa-quran text-2xl text-emerald-400 mb-2"></i>
              <p className="text-xs font-bold">100+ Verses</p>
              <p className="text-[10px] text-white/50">Quran Reader</p>
            </div>
          )}
          
          {/* Dua Badge */}
          {stats.duas.bookmarks >= 10 && (
            <div className="p-3 bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-lg text-center">
              <i className="fas fa-bookmark text-2xl text-blue-400 mb-2"></i>
              <p className="text-xs font-bold">10+ Duas</p>
              <p className="text-[10px] text-white/50">Dua Collector</p>
            </div>
          )}
          
          {/* Default Badge */}
          <div className="p-3 bg-gradient-to-br from-[#d4af37]/30 to-[#d4af37]/10 rounded-lg text-center">
            <i className="fas fa-star text-2xl text-[#d4af37] mb-2"></i>
            <p className="text-xs font-bold">Member</p>
            <p className="text-[10px] text-white-50">Active User</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Profile;
