import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getPrayerTimes } from '../services/prayerService';
import { getDailyVerse } from '../services/quranService';
import { getDailyDua } from '../services/duaService';
import Loader from '../components/common/Loader';
import { useLocation } from '../hooks/useLocations';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { t, currentLanguage } = useLanguage();
  const { location: userLocation, loading: locationLoading } = useLocation();
  const [loading, setLoading] = useState(true);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [dailyVerse, setDailyVerse] = useState(null);
  const [dailyDua, setDailyDua] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [todayIftar, setTodayIftar] = useState(null);
  const [todaySehri, setTodaySehri] = useState(null);
  const [countdown, setCountdown] = useState({ next: '', time: '' });

  useEffect(() => {
    if (userLocation) {
      loadData();
    }
  }, [userLocation, currentLanguage]);

  // Countdown timer
  useEffect(() => {
    if (!prayerTimes || !nextPrayer) return;
    
    const timer = setInterval(() => {
      updateCountdown();
    }, 1000);
    
    return () => clearInterval(timer);
  }, [prayerTimes, nextPrayer]);

  const updateCountdown = () => {
    if (!nextPrayer?.time) return;
    
    const now = new Date();
    const [hours, minutes] = nextPrayer.time.split(':').map(Number);
    const target = new Date();
    target.setHours(hours, minutes, 0);
    
    if (now > target) {
      target.setDate(target.getDate() + 1);
    }
    
    const diff = target - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
    
    setCountdown({
      next: nextPrayer.name,
      time: `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`
    });
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load prayer times with user location
      if (userLocation) {
        try {
          const prayers = await getPrayerTimes(userLocation.lat, userLocation.lng);
          setPrayerTimes(prayers);
          
          if (prayers?.timings) {
            const next = findNextPrayer(prayers.timings);
            setNextPrayer(next);
            
            // Set today's Iftar (Maghrib) and Sehri (Fajr)
            setTodayIftar(prayers.timings.Maghrib);
            setTodaySehri(prayers.timings.Fajr);
          }
        } catch (error) {
          console.error('Error loading prayer times:', error);
          toast.error(t('errors.prayerTimes'));
        }
      }

      // Load daily content with fallbacks
      try {
        const verse = await getDailyVerse(currentLanguage);
        setDailyVerse(verse);
      } catch (error) {
        console.error('Error loading daily verse:', error);
        setDailyVerse({
          arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
          translation: currentLanguage === 'bn' 
            ? "পরম করুণাময়, অতি দয়ালু আল্লাহর নামে শুরু"
            : "In the name of Allah, the Most Gracious, the Most Merciful",
          surahName: "Al-Fatihah",
          verseId: 1
        });
      }
      
      try {
        const dua = await getDailyDua(currentLanguage);
        setDailyDua(dua);
      } catch (error) {
        console.error('Error loading daily dua:', error);
        setDailyDua({
          arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
          translation: currentLanguage === 'bn' 
            ? "হে আমাদের রব! আমাদের দুনিয়াতে কল্যাণ দিন এবং আখিরাতেও কল্যাণ দিন এবং আমাদেরকে জাহান্নামের আযাব থেকে রক্ষা করুন"
            : "Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire",
          reference: "Surah Al-Baqarah, Verse 201"
        });
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  const findNextPrayer = (timings) => {
    if (!timings) return null;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Fajr', time: timings.Fajr },
      { name: 'Dhuhr', time: timings.Dhuhr },
      { name: 'Asr', time: timings.Asr },
      { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isha', time: timings.Isha }
    ];

    for (let prayer of prayers) {
      if (!prayer.time) continue;
      
      const [hours, minutes] = prayer.time.split(':').map(Number);
      const prayerTime = hours * 60 + minutes;
      
      if (prayerTime > currentTime) {
        return prayer;
      }
    }
    
    return prayers[0];
  };

  const convertTo12Hour = (time) => {
    if (!time) return '--:--';
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  if (loading || locationLoading) return <Loader />;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const formattedDate = new Date().toLocaleDateString(
    currentLanguage === 'bn' ? 'bn-BD' : 'en-US', 
    {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants} className="glass p-6 md:p-8 text-center">
        <h1 className="text-3xl md:text-4xl font-arabic text-[#d4af37] mb-4">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </h1>
        <p className="text-xl text-white/80 font-bangla">
          {t('home.welcome')}
        </p>
        
        {/* Date Display */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
          <div className="glass px-4 py-2">
            <i className="fas fa-calendar text-[#d4af37] mr-2"></i>
            <span>{formattedDate}</span>
          </div>
          {prayerTimes && (
            <div className="glass px-4 py-2">
              <i className="fas fa-moon text-[#d4af37] mr-2"></i>
              <span>
                {prayerTimes.hijri.day} {prayerTimes.hijri.month} {prayerTimes.hijri.year}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Iftar & Sehri Cards - Highlighted */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Iftar Card */}
        <div className="glass p-6 text-center bg-gradient-to-br from-orange-900/40 to-orange-800/20 border-2 border-orange-500/30 hover:border-orange-500 transition-all">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center">
              <i className="fas fa-sunset text-4xl text-orange-400"></i>
            </div>
          </div>
          <h3 className="text-xl text-white/70 mb-2 font-bangla">{t('prayer.iftar') || 'Iftar Time'}</h3>
          <p className="text-4xl md:text-5xl font-bold text-orange-400 mb-2">
            {todayIftar ? convertTo12Hour(todayIftar) : '--:--'}
          </p>
          <p className="text-sm text-white/50">
            {todayIftar ? `(${todayIftar} 24h)` : ''}
          </p>
          <p className="text-xs text-white/30 mt-2">
            {t('prayer.iftarNote') || 'Break your fast at this time'}
          </p>
        </div>

        {/* Sehri Card */}
        <div className="glass p-6 text-center bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-2 border-emerald-500/30 hover:border-emerald-500 transition-all">
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <i className="fas fa-moon text-4xl text-emerald-400"></i>
            </div>
          </div>
          <h3 className="text-xl text-white/70 mb-2 font-bangla">{t('prayer.suhoor') || 'Sehri Time'}</h3>
          <p className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">
            {todaySehri ? convertTo12Hour(todaySehri) : '--:--'}
          </p>
          <p className="text-sm text-white/50">
            {todaySehri ? `(${todaySehri} 24h)` : ''}
          </p>
          <p className="text-xs text-white/30 mt-2">
            {t('prayer.suhoorNote') || 'Stop eating at this time'}
          </p>
        </div>
      </motion.div>

      {/* Next Prayer Countdown */}
      {nextPrayer && (
        <motion.div variants={itemVariants} className="glass p-6 text-center bg-gradient-to-r from-[#d4af37]/20 to-transparent border border-[#d4af37]/30">
          <h3 className="text-lg text-white/70 mb-2 font-bangla">{t('home.nextPrayer')}</h3>
          <p className="text-2xl font-bold text-[#d4af37] mb-2">
            {currentLanguage === 'bn' ? t(`prayer.${nextPrayer.name.toLowerCase()}`) : nextPrayer.name}
          </p>
          <p className="text-4xl md:text-5xl font-mono font-bold text-[#d4af37] mb-2">
            {countdown.time || '00:00:00'}
          </p>
          <p className="text-sm text-white/50">
            {t('prayer.timeRemaining')}
          </p>
        </motion.div>
      )}

      {/* Quick Prayer Times Summary */}
      <motion.div variants={itemVariants} className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-clock mr-2"></i>
          {t('prayer.todayTimes')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
            <div key={prayer} className="prayer-card bg-white/5 p-3 rounded-lg text-center hover:border-[#d4af37] transition">
              <div className="text-sm text-white/50 mb-1">
                {currentLanguage === 'bn' ? t(`prayer.${prayer.toLowerCase()}`) : prayer}
              </div>
              <div className="text-lg font-bold text-[#d4af37]">
                {prayerTimes?.timings?.[prayer] ? convertTo12Hour(prayerTimes.timings[prayer]) : '--:--'}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Daily Verse */}
      {dailyVerse && (
        <motion.div variants={itemVariants} className="verse-card glass p-6 bg-gradient-to-r from-[#d4af37]/10 to-transparent">
          <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
            <i className="fas fa-quran mr-2"></i>
            {t('quran.dailyVerse')}
          </h3>
          <p className="text-2xl mb-4 text-right font-arabic leading-loose">{dailyVerse.arabic}</p>
          <p className="text-white/80 mb-2 font-bangla">{dailyVerse.translation}</p>
          <p className="text-sm text-[#d4af37]">
            {t('quran.surah')} {dailyVerse.surahName} - {t('quran.verse')} {dailyVerse.verseId}
          </p>
        </motion.div>
      )}

      {/* Daily Dua */}
      {dailyDua && (
        <motion.div variants={itemVariants} className="verse-card glass p-6 bg-gradient-to-r from-emerald-900/20 to-transparent">
          <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
            <i className="fas fa-hands-praying mr-2"></i>
            {t('dua.daily')}
          </h3>
          <p className="text-2xl mb-4 text-right font-arabic leading-loose">{dailyDua.arabic}</p>
          <p className="text-white/80 mb-2 font-bangla">{dailyDua.translation}</p>
          <p className="text-sm text-[#d4af37]">{dailyDua.reference}</p>
        </motion.div>
      )}

      {/* Location Info */}
      {userLocation && (
        <motion.div variants={itemVariants} className="glass p-4 text-sm text-white/50 flex items-center justify-center gap-2">
          <i className="fas fa-map-marker-alt text-[#d4af37]"></i>
          <span>{userLocation.city}, {userLocation.country}</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HomePage;
