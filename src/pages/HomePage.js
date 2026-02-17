import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getPrayerTimes } from '../services/prayerService';
import { getDailyVerse } from '../services/quranService';
import { getDailyDua } from '../services/duaService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [dailyVerse, setDailyVerse] = useState(null);
  const [dailyDua, setDailyDua] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);

  useEffect(() => {
    loadData();
  }, [currentLanguage]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const loc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setLocation(loc);
            
            // Load prayer times
            const prayers = await getPrayerTimes(loc.lat, loc.lng);
            setPrayerTimes(prayers);
            
            // Find next prayer
            const next = findNextPrayer(prayers.timings);
            setNextPrayer(next);
          },
          (error) => {
            console.error('Location error:', error);
            toast.error(t('errors.location'));
          }
        );
      }

      // Load daily content
      const verse = await getDailyVerse(currentLanguage);
      setDailyVerse(verse);
      
      const dua = await getDailyDua(currentLanguage);
      setDailyDua(dua);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error(t('errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  const findNextPrayer = (timings) => {
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
      const [hours, minutes] = prayer.time.split(':');
      const prayerTime = parseInt(hours) * 60 + parseInt(minutes);
      
      if (prayerTime > currentTime) {
        return prayer;
      }
    }
    
    return prayers[0]; // Next day Fajr
  };

  if (loading) return <Loader />;

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
            <span>{new Date().toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</span>
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

      {/* Quick Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass p-4 text-center hover:border-[#d4af37] transition">
          <i className="fas fa-clock text-3xl text-[#d4af37] mb-3"></i>
          <h3 className="text-lg text-white/70 font-bangla">{t('home.nextPrayer')}</h3>
          <p className="text-2xl font-bold text-[#d4af37]">
            {nextPrayer ? (currentLanguage === 'bn' ? t(`prayer.${nextPrayer.name.toLowerCase()}`) : nextPrayer.name) : '--'}
          </p>
          <p className="text-sm text-white/50">{nextPrayer?.time || '--:--'}</p>
        </div>

        <div className="glass p-4 text-center hover:border-[#d4af37] transition">
          <i className="fas fa-quran text-3xl text-[#d4af37] mb-3"></i>
          <h3 className="text-lg text-white/70 font-bangla">{t('home.todaysVerse')}</h3>
          <p className="text-sm text-white/80 line-clamp-2">{dailyVerse?.translation}</p>
        </div>

        <div className="glass p-4 text-center hover:border-[#d4af37] transition">
          <i className="fas fa-compass text-3xl text-[#d4af37] mb-3"></i>
          <h3 className="text-lg text-white/70 font-bangla">{t('home.qiblaDirection')}</h3>
          <p className="text-2xl font-bold text-[#d4af37]">--°</p>
          <p className="text-sm text-white/50">{t('qibla.fromNorth')}</p>
        </div>
      </motion.div>

      {/* Daily Verse */}
      {dailyVerse && (
        <motion.div variants={itemVariants} className="verse-card">
          <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
            <i className="fas fa-quran mr-2"></i>
            {t('quran.dailyVerse')}
          </h3>
          <p className="text-2xl mb-4 text-right font-arabic">{dailyVerse.arabic}</p>
          <p className="text-white/80 mb-2 font-bangla">{dailyVerse.translation}</p>
          <p className="text-sm text-[#d4af37]">
            {t('quran.surah')} {dailyVerse.surahName} - {t('quran.verse')} {dailyVerse.verseId}
          </p>
        </motion.div>
      )}

      {/* Daily Dua */}
      {dailyDua && (
        <motion.div variants={itemVariants} className="verse-card">
          <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
            <i className="fas fa-hands-praying mr-2"></i>
            {t('dua.daily')}
          </h3>
          <p className="text-2xl mb-4 text-right font-arabic">{dailyDua.arabic}</p>
          <p className="text-white/80 mb-2 font-bangla">{dailyDua.translation}</p>
          <p className="text-sm text-[#d4af37]">{dailyDua.reference}</p>
        </motion.div>
      )}

      {/* Prayer Times Preview */}
      {prayerTimes && (
        <motion.div variants={itemVariants} className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
            <i className="fas fa-clock mr-2"></i>
            {t('prayer.todayTimes')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
              <div key={prayer} className="prayer-card">
                <div className="text-sm text-white/70 mb-1 font-bangla">
                  {currentLanguage === 'bn' ? t(`prayer.${prayer.toLowerCase()}`) : prayer}
                </div>
                <div className="text-xl font-bold text-[#d4af37]">{prayerTimes.timings[prayer]}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default HomePage;