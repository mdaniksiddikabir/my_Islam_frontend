import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import { format, addDays } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import moment from 'moment-hijri';

const RamadanCalendar = () => {
  const { language, t } = useLanguage();
  const { location } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRamadan, setIsRamadan] = useState(false);
  const [ramadanInfo, setRamadanInfo] = useState({
    year: null,
    startDate: null,
    endDate: null,
    currentDay: null
  });

  useEffect(() => {
    checkIfRamadan();
  }, []);

  useEffect(() => {
    if (isRamadan && location) {
      generateRamadanCalendar();
    }
  }, [isRamadan, location]);

  const checkIfRamadan = () => {
    const today = moment();
    const hijriMonth = today.iMonth() + 1; // iMonth() returns 0-11
    
    // Check if current Hijri month is Ramadan (month 9)
    if (hijriMonth === 9) {
      const hijriYear = today.iYear();
      const currentDay = today.iDate();
      
      // Calculate Gregorian dates for Ramadan
      const startOfRamadan = moment().iYear(hijriYear).iMonth(8).iDate(1); // Month 9 (index 8)
      const endOfRamadan = moment().iYear(hijriYear).iMonth(8).iDate(30);
      
      setIsRamadan(true);
      setRamadanInfo({
        year: hijriYear,
        startDate: startOfRamadan.toDate(),
        endDate: endOfRamadan.toDate(),
        currentDay: currentDay
      });
      
      console.log(`🌙 Ramadan ${hijriYear} detected! Day ${currentDay} of 30`);
    } else {
      setIsRamadan(false);
      console.log('Not Ramadan month');
    }
  };

  const generateRamadanCalendar = async () => {
    try {
      setLoading(true);
      const days = [];
      
      // Generate 30 days of Ramadan
      for (let i = 0; i < 30; i++) {
        const currentDate = addDays(ramadanInfo.startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Get prayer times for this date
        const prayerData = location ? await getPrayerTimes(
          location.lat,
          location.lng,
          4,
          dateStr
        ) : null;

        const dayData = {
          day: i + 1,
          gregorianDate: currentDate,
          hijriDate: `${i + 1} Ramadan ${ramadanInfo.year}`,
          weekday: format(currentDate, 'EEEE', { 
            locale: language === 'bn' ? bn : enUS 
          }),
          sehri: prayerData?.timings?.Fajr || '--:--',
          iftar: prayerData?.timings?.Maghrib || '--:--',
          isToday: i + 1 === ramadanInfo.currentDay,
          isPast: i + 1 < ramadanInfo.currentDay,
          isFuture: i + 1 > ramadanInfo.currentDay,
          fastingHours: calculateFastingHours(
            prayerData?.timings?.Fajr,
            prayerData?.timings?.Maghrib
          ),
        };

        days.push(dayData);
      }

      setRamadanDays(days);
    } catch (error) {
      console.error('Error generating Ramadan calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFastingHours = (sehri, iftar) => {
    if (!sehri || !iftar) return '--:--';
    
    const [sehriHour, sehriMin] = sehri.split(':').map(Number);
    const [iftarHour, iftarMin] = iftar.split(':').map(Number);
    
    let totalMinutes = (iftarHour * 60 + iftarMin) - (sehriHour * 60 + sehriMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'dd MMM yyyy', {
      locale: language === 'bn' ? bn : enUS
    });
  };

  const getDayStatusClass = (day) => {
    if (day.isToday) return 'bg-[#d4af37]/20 border-2 border-[#d4af37]';
    if (day.isPast) return 'opacity-60';
    if (day.isFuture) return 'opacity-90';
    return '';
  };

  // If not Ramadan, don't show anything
  if (!isRamadan) {
    return null;
  }

  const translations = {
    en: {
      title: `Ramadan ${ramadanInfo.year} Calendar`,
      subtitle: 'Daily Sehri & Iftar Times',
      day: 'Day',
      date: 'Date',
      weekday: 'Day',
      sehri: 'Sehri Ends',
      iftar: 'Iftar Time',
      fastingHours: 'Fasting Hours',
      today: 'Today',
      gregorianDate: 'Gregorian',
      hijriDate: 'Hijri',
      progress: 'Ramadan Progress',
      dayProgress: `Day ${ramadanInfo.currentDay} of 30`,
      daysLeft: `${30 - ramadanInfo.currentDay} days remaining`,
      sehriNote: 'Stop eating before this time',
      iftarNote: 'Break your fast at this time',
      ramadanMubarak: 'Ramadan Mubarak!',
      prayer: 'Prayer',
    },
    bn: {
      title: `রমজান ${ramadanInfo.year} ক্যালেন্ডার`,
      subtitle: 'দৈনিক সেহরি ও ইফতারের সময়সূচি',
      day: 'রোজা',
      date: 'তারিখ',
      weekday: 'বার',
      sehri: 'সেহরি শেষ',
      iftar: 'ইফতার',
      fastingHours: 'রোজার সময়',
      today: 'আজ',
      gregorianDate: 'ইংরেজি',
      hijriDate: 'হিজরি',
      progress: 'রমজানের অগ্রগতি',
      dayProgress: `${ramadanInfo.currentDay}তম রোজা`,
      daysLeft: `${30 - ramadanInfo.currentDay} দিন বাকি`,
      sehriNote: 'এই সময়ের আগে খাওয়া শেষ করুন',
      iftarNote: 'এই সময়ে ইফতার করুন',
      ramadanMubarak: 'রমজান মোবারক!',
      prayer: 'নামাজ',
    }
  };

  const txt = translations[language] || translations.en;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-moon text-4xl text-[#d4af37] animate-pulse mb-4"></i>
          <p className="text-white/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Ramadan Header - Only visible in Ramadan */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/40 to-emerald-700/40 border-2 border-[#d4af37]/30">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-5xl animate-pulse">🌙</div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#d4af37] font-arabic">
              {txt.ramadanMubarak}
            </h1>
            <p className="text-white/80">{txt.title}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{txt.progress}</span>
            <span className="text-[#d4af37]">
              {Math.round((ramadanInfo.currentDay / 30) * 100)}%
            </span>
          </div>
          <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-[#d4af37] rounded-full transition-all duration-500"
              style={{ width: `${(ramadanInfo.currentDay / 30) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-2 text-white/50">
            <span>{txt.dayProgress}</span>
            <span>{txt.daysLeft}</span>
          </div>
        </div>

        {/* Location */}
        {location && (
          <div className="mt-4 glass inline-block px-4 py-2">
            <i className="fas fa-map-marker-alt text-[#d4af37] mr-2"></i>
            <span>{location.city}, {location.country}</span>
          </div>
        )}
      </div>

      {/* Calendar Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ramadanDays.map((day) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: day.day * 0.02 }}
            className={`glass p-4 ${getDayStatusClass(day)} transition-all hover:scale-105 cursor-pointer`}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-bold text-[#d4af37]">
                #{day.day}
              </span>
              {day.isToday && (
                <span className="px-2 py-1 bg-[#d4af37] text-[#1a3f54] text-xs rounded-full">
                  {txt.today}
                </span>
              )}
            </div>

            {/* Dates */}
            <div className="space-y-1 text-sm">
              <p className="text-white/70">
                <span className="text-white/50">{txt.gregorianDate}:</span>{' '}
                {formatDate(day.gregorianDate)}
              </p>
              <p className="text-white/70">
                <span className="text-white/50">{txt.hijriDate}:</span>{' '}
                {day.hijriDate}
              </p>
              <p className="text-white/70">
                <span className="text-white/50">{txt.weekday}:</span>{' '}
                {day.weekday}
              </p>
            </div>

            {/* Times */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-emerald-900/30 p-3 rounded-lg text-center">
                <i className="fas fa-moon text-emerald-400 mb-1"></i>
                <p className="text-xs text-white/50">{txt.sehri}</p>
                <p className="text-lg font-bold text-emerald-400">{day.sehri}</p>
              </div>
              <div className="bg-orange-900/30 p-3 rounded-lg text-center">
                <i className="fas fa-sun text-orange-400 mb-1"></i>
                <p className="text-xs text-white/50">{txt.iftar}</p>
                <p className="text-lg font-bold text-orange-400">{day.iftar}</p>
              </div>
            </div>

            {/* Fasting Hours */}
            <div className="mt-3 text-center text-sm">
              <span className="text-white/50">{txt.fastingHours}:</span>{' '}
              <span className="font-bold text-[#d4af37]">{day.fastingHours}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Notes */}
      <div className="glass p-4 text-center text-sm text-white/50">
        <p>🕌 {txt.sehriNote}</p>
        <p>🌅 {txt.iftarNote}</p>
      </div>
    </motion.div>
  );
};

export default RamadanCalendar;
