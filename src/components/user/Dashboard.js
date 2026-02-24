import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../context/LanguageContext';
import axios from 'axios';
import Loader from '../common/Loader';
import { toast } from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [nextPrayer, setNextPrayer] = useState(null);
  const [dailyVerse, setDailyVerse] = useState(null);
  const [dailyDua, setDailyDua] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [stats, setStats] = useState({
    prayers: { total: 0, streak: 0 },
    quran: { versesRead: 0, bookmarks: 0 },
    duas: { bookmarks: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState({
    gregorian: '',
    hijri: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, [currentLanguage]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel with error handling
      const [
        prayerRes, 
        verseRes, 
        duaRes, 
        statsRes,
        hijriRes
      ] = await Promise.allSettled([
        axios.get('/api/prayer/next').catch(() => ({ value: { data: { data: null } } })),
        axios.get('/api/quran/daily').catch(() => ({ value: { data: { data: null } } })),
        axios.get('/api/duas/daily').catch(() => ({ value: { data: { data: null } } })),
        axios.get('/api/users/stats').catch(() => ({ value: { data: { data: null } } })),
        axios.get('/api/calendar/today').catch(() => ({ value: { data: { data: null } } }))
      ]);

      // Process prayer times
      if (prayerRes.status === 'fulfilled' && prayerRes.value?.data?.data) {
        setNextPrayer(prayerRes.value.data.data);
      }

      // Process daily verse
      if (verseRes.status === 'fulfilled' && verseRes.value?.data?.data) {
        setDailyVerse(verseRes.value.data.data);
      } else {
        // Set fallback verse
        setDailyVerse({
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          translation: currentLanguage === 'bn' 
            ? "পরম করুণাময়, অতি দয়ালু আল্লাহর নামে শুরু"
            : "In the name of Allah, the Most Gracious, the Most Merciful",
          surah: "Al-Fatihah",
          verse: 1
        });
      }

      // Process daily dua
      if (duaRes.status === 'fulfilled' && duaRes.value?.data?.data) {
        setDailyDua(duaRes.value.data.data);
      } else {
        setDailyDua({
          arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
          translation: currentLanguage === 'bn' 
            ? "হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দিন এবং আখিরাতেও কল্যাণ দিন এবং আমাদেরকে জাহান্নামের আযাব থেকে রক্ষা করুন"
            : "Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire",
          reference: "Surah Al-Baqarah, Verse 201"
        });
      }

      // Process user stats
      if (statsRes.status === 'fulfilled' && statsRes.value?.data?.data) {
        setStats(statsRes.value.data.data);
      }

      // Process hijri date
      if (hijriRes.status === 'fulfilled' && hijriRes.value?.data?.data) {
        const data = hijriRes.value.data.data;
        setTodayDate({
          gregorian: data.gregorian || new Date().toLocaleDateString(),
          hijri: `${data.hijri?.day || ''} ${data.hijri?.month || ''} ${data.hijri?.year || ''}`
        });
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(t('errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  const convertTo12Hour = (time) => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  // Show loader while checking auth or loading data
  if (!user) {
    return <Loader fullScreen message={t('common.loading')} />;
  }

  if (loading) {
    return <Loader fullScreen message={t('common.loading')} />;
  }

  const quickActions = [
    { to: '/prayer', icon: 'fas fa-clock', label: 'Prayer Times', color: 'text-blue-400' },
    { to: '/quran', icon: 'fas fa-quran', label: 'Read Quran', color: 'text-emerald-400' },
    { to: '/duas', icon: 'fas fa-hands-praying', label: 'Daily Duas', color: 'text-amber-400' },
    { to: '/qibla', icon: 'fas fa-compass', label: 'Qibla Finder', color: 'text-purple-400' },
    { to: '/calendar', icon: 'fas fa-calendar', label: 'Ramadan Calendar', color: 'text-rose-400' },
    { to: '/profile', icon: 'fas fa-user', label: 'My Profile', color: 'text-indigo-400' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Welcome Banner with Date */}
      <div className="glass p-6 bg-gradient-to-r from-[#d4af37]/20 via-transparent to-emerald-900/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37] mb-2">
              {t('dashboard.welcome') || 'Welcome back'}, {user?.name?.split(' ')[0] || 'User'}! 🌙
            </h1>
            <p className="text-white/70">
              {t('dashboard.subtitle') || 'Your spiritual journey continues'}
            </p>
          </div>
          <div className="glass px-4 py-2 text-right">
            <p className="text-sm text-white/50">{todayDate.gregorian}</p>
            <p className="text-[#d4af37] font-semibold">{todayDate.hijri}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 flex items-center gap-4 hover:border-[#d4af37] transition">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <i className="fas fa-praying-hands text-emerald-400 text-xl"></i>
          </div>
          <div>
            <p className="text-sm text-white/50">{t('dashboard.prayers') || 'Prayers'}</p>
            <p className="text-2xl font-bold text-[#d4af37]">{stats.prayers?.total || 0}</p>
            <p className="text-xs text-white/30">
              {t('dashboard.streak') || 'Streak'}: {stats.prayers?.streak || 0} {t('common.days')}
            </p>
          </div>
        </div>

        <div className="glass p-4 flex items-center gap-4 hover:border-[#d4af37] transition">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
            <i className="fas fa-quran text-blue-400 text-xl"></i>
          </div>
          <div>
            <p className="text-sm text-white/50">{t('dashboard.quran') || 'Quran'}</p>
            <p className="text-2xl font-bold text-[#d4af37]">{stats.quran?.versesRead || 0}</p>
            <p className="text-xs text-white/30">
              {t('dashboard.verses') || 'Verses'} • {stats.quran?.bookmarks || 0} {t('dashboard.bookmarks')}
            </p>
          </div>
        </div>

        <div className="glass p-4 flex items-center gap-4 hover:border-[#d4af37] transition">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
            <i className="fas fa-bookmark text-amber-400 text-xl"></i>
          </div>
          <div>
            <p className="text-sm text-white/50">{t('dashboard.duas') || 'Duas'}</p>
            <p className="text-2xl font-bold text-[#d4af37]">{stats.duas?.bookmarks || 0}</p>
            <p className="text-xs text-white-30">
              {t('dashboard.bookmarked') || 'Bookmarked Duas'}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="glass p-6">
        <h3 className="text-lg mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-bolt mr-2"></i>
          {t('dashboard.quickActions') || 'Quick Actions'}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.to}
              className="glass p-4 text-center hover:border-[#d4af37] transition group"
            >
              <i className={`${action.icon} text-2xl ${action.color} mb-2 group-hover:scale-110 transition`}></i>
              <h3 className="text-xs">{t(`nav.${action.label.toLowerCase().replace(' ', '')}`) || action.label}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Today's Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Next Prayer Card */}
        {nextPrayer && (
          <div className="glass p-6 bg-gradient-to-br from-[#d4af37]/10 to-transparent border border-[#d4af37]/30">
            <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
              <i className="fas fa-clock mr-2"></i>
              {t('dashboard.nextPrayer') || 'Next Prayer'}
            </h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#d4af37] mb-2">
                {nextPrayer?.name || t('common.na')}
              </p>
              <p className="text-2xl mb-3">{convertTo12Hour(nextPrayer?.time)}</p>
              <div className="glass inline-block px-4 py-2 bg-[#d4af37]/20 rounded-full">
                <i className="fas fa-hourglass-half mr-2 text-[#d4af37]"></i>
                <span className="text-sm">{nextPrayer?.remaining || '0 min'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Daily Verse Card */}
        {dailyVerse && (
          <div className="glass p-6 bg-gradient-to-bl from-emerald-900/20 to-transparent border border-emerald-500/30">
            <h3 className="text-lg mb-3 text-emerald-400 flex items-center">
              <i className="fas fa-quran mr-2"></i>
              {t('quran.dailyVerse')}
            </h3>
            <p className="text-xl mb-3 text-right font-arabic">{dailyVerse?.arabic}</p>
            <p className="text-white/80 mb-2 text-sm">{dailyVerse?.translation}</p>
            <p className="text-xs text-emerald-400">
              {dailyVerse?.surah} - {t('quran.verse')} {dailyVerse?.verse}
            </p>
          </div>
        )}
      </div>

      {/* Daily Dua Card */}
      {dailyDua && (
        <div className="glass p-6 bg-gradient-to-r from-amber-900/20 via-transparent to-emerald-900/20 border border-amber-500/30">
          <h3 className="text-lg mb-3 text-amber-400 flex items-center">
            <i className="fas fa-star mr-2"></i>
            {t('dua.daily')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <p className="text-xl mb-3 text-right font-arabic">{dailyDua?.arabic}</p>
              <p className="text-white/80">{dailyDua?.translation}</p>
            </div>
            <div className="glass p-3 bg-white/5 rounded-lg flex flex-col items-center justify-center">
              <i className="fas fa-bookmark text-amber-400 mb-2"></i>
              <p className="text-xs text-center text-white/50">{dailyDua?.reference}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Placeholder */}
      <div className="glass p-6">
        <h3 className="text-lg mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-history mr-2"></i>
          {t('dashboard.recentActivity') || 'Recent Activity'}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <i className="fas fa-check text-emerald-400 text-xs"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{t('dashboard.prayerLogged') || 'Prayer Logged'}</p>
              <p className="text-xs text-white/50">{t('dashboard.justNow') || 'Just now'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <i className="fas fa-book-open text-blue-400 text-xs"></i>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{t('dashboard.quranRead') || 'Quran Reading'}</p>
              <p className="text-xs text-white/50">{t('dashboard.today') || 'Today'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="glass p-4 text-center bg-gradient-to-r from-[#d4af37]/5 to-transparent">
        <i className="fas fa-quote-right text-[#d4af37] opacity-30 text-2xl mb-2"></i>
        <p className="text-sm text-white/60 italic">
          "The best of deeds are those done consistently, even if they are small."
        </p>
        <p className="text-xs text-[#d4af37] mt-1">- Prophet Muhammad (PBUH)</p>
      </div>
    </motion.div>
  );
};

export default Dashboard;
