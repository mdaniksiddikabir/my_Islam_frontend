import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import { format, addDays } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import moment from 'moment-hijri';

const RamadanTimeTable = () => {
  const { language, t } = useLanguage();
  const { location } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ramadanInfo, setRamadanInfo] = useState({
    year: null,
    startDate: null,
    endDate: null,
    currentDay: null
  });

  useEffect(() => {
    initializeRamadan();
  }, []);

  useEffect(() => {
    if (ramadanInfo.startDate && location) {
      generateFullTimeTable();
    }
  }, [ramadanInfo, location]);

  const initializeRamadan = () => {
    const today = moment();
    const hijriMonth = today.iMonth() + 1;
    const hijriYear = today.iYear();
    
    // For demo/development, you can set a specific year
    // Comment this out for production to use actual date
    const FORCE_RAMADAN_YEAR = 1446; // Set to desired year for testing
    
    // Use either current date or forced year
    const year = FORCE_RAMADAN_YEAR || hijriYear;
    
    // Calculate Ramadan dates for the year
    const startOfRamadan = moment().iYear(year).iMonth(8).iDate(1);
    const endOfRamadan = moment().iYear(year).iMonth(8).iDate(30);
    
    setRamadanInfo({
      year: year,
      startDate: startOfRamadan.toDate(),
      endDate: endOfRamadan.toDate(),
      currentDay: today.iMonth() + 1 === 9 ? today.iDate() : null
    });
  };

  const generateFullTimeTable = async () => {
    try {
      setLoading(true);
      const days = [];
      
      // Generate all 30 days of Ramadan
      for (let i = 0; i < 30; i++) {
        const currentDate = addDays(ramadanInfo.startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Get prayer times for this date
        let sehriTime = '--:--';
        let iftarTime = '--:--';
        
        if (location) {
          try {
            const prayerData = await getPrayerTimes(
              location.lat,
              location.lng,
              4,
              dateStr
            );
            sehriTime = prayerData?.timings?.Fajr || '--:--';
            iftarTime = prayerData?.timings?.Maghrib || '--:--';
          } catch (error) {
            console.log(`Using default times for day ${i + 1}`);
          }
        }

        const dayData = {
          day: i + 1,
          gregorianDate: currentDate,
          hijriDate: `${i + 1} Ramadan ${ramadanInfo.year}`,
          weekday: format(currentDate, 'EEEE', { 
            locale: language === 'bn' ? bn : enUS 
          }),
          shortWeekday: format(currentDate, 'EEE', {
            locale: language === 'bn' ? bn : enUS
          }),
          sehri: sehriTime,
          iftar: iftarTime,
          isToday: i + 1 === ramadanInfo.currentDay,
          isPast: ramadanInfo.currentDay ? i + 1 < ramadanInfo.currentDay : false,
          isFuture: ramadanInfo.currentDay ? i + 1 > ramadanInfo.currentDay : true,
          fastingHours: calculateFastingHours(sehriTime, iftarTime),
          sehriTime12hr: convertTo12Hour(sehriTime),
          iftarTime12hr: convertTo12Hour(iftarTime),
        };

        days.push(dayData);
      }

      setRamadanDays(days);
    } catch (error) {
      console.error('Error generating Ramadan timetable:', error);
      toast.error('Failed to load Ramadan schedule');
    } finally {
      setLoading(false);
    }
  };

  const calculateFastingHours = (sehri, iftar) => {
    if (!sehri || sehri === '--:--' || !iftar || iftar === '--:--') return '--:--';
    
    const [sehriHour, sehriMin] = sehri.split(':').map(Number);
    const [iftarHour, iftarMin] = iftar.split(':').map(Number);
    
    let totalMinutes = (iftarHour * 60 + iftarMin) - (sehriHour * 60 + sehriMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const convertTo12Hour = (time) => {
    if (!time || time === '--:--') return '--:--';
    
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'dd MMM yyyy', {
      locale: language === 'bn' ? bn : enUS
    });
  };

  const formatDayMonth = (date) => {
    return format(date, 'dd MMM', {
      locale: language === 'bn' ? bn : enUS
    });
  };

  const getDayStatusClass = (day) => {
    if (day.isToday) return 'bg-[#d4af37]/20 border-2 border-[#d4af37]';
    if (day.isPast) return 'opacity-60';
    return '';
  };

  const translations = {
    en: {
      title: `Ramadan ${ramadanInfo.year} - 30 Days Time Table`,
      subtitle: 'Complete Sehri & Iftar Schedule',
      day: 'Day',
      date: 'Date',
      hijri: 'Hijri',
      gregorian: 'Gregorian',
      weekday: 'Day',
      sehri: 'Sehri Ends',
      iftar: 'Iftar Time',
      fasting: 'Fasting Hours',
      today: 'Today',
      past: 'Completed',
      future: 'Upcoming',
      downloadPDF: 'Download PDF',
      print: 'Print Table',
      location: 'Location',
      notes: 'Times are based on your location',
      sehriNote: 'Stop eating 10-15 minutes before Sehri time',
      iftarNote: 'Break fast exactly at Iftar time',
      day1to10: 'First Ashra (Mercy)',
      day11to20: 'Second Ashra (Forgiveness)',
      day21to30: 'Third Ashra (Salvation)',
    },
    bn: {
      title: `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`,
      subtitle: 'সম্পূর্ণ সেহরি ও ইফতার সময়সূচি',
      day: 'রোজা',
      date: 'তারিখ',
      hijri: 'হিজরি',
      gregorian: 'ইংরেজি',
      weekday: 'বার',
      sehri: 'সেহরি শেষ',
      iftar: 'ইফতার',
      fasting: 'রোজার সময়',
      today: 'আজ',
      past: 'সম্পন্ন',
      future: 'আসছে',
      downloadPDF: 'পিডিএফ ডাউনলোড',
      print: 'প্রিন্ট',
      location: 'অবস্থান',
      notes: 'সময় আপনার অবস্থান অনুযায়ী',
      sehriNote: 'সেহরি সময়ের ১০-১৫ মিনিট আগে খাওয়া শেষ করুন',
      iftarNote: 'ঠিক ইফতার সময়ে ইফতার করুন',
      day1to10: 'প্রথম আশরা (রহমত)',
      day11to20: 'দ্বিতীয় আশরা (মাগফিরাত)',
      day21to30: 'তৃতীয় আশরা (নাজাত)',
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37] mb-2">
              🌙 {txt.title}
            </h1>
            <p className="text-white/80">{txt.subtitle}</p>
          </div>
          
          {location && (
            <div className="glass px-4 py-2">
              <i className="fas fa-map-marker-alt text-[#d4af37] mr-2"></i>
              <span>{location.city}, {location.country}</span>
            </div>
          )}
        </div>

        {/* Ashra Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <div className="bg-emerald-900/40 p-3 rounded-lg text-center">
            <p className="text-xs text-white/50">1-10</p>
            <p className="text-sm font-bold text-emerald-400">{txt.day1to10}</p>
          </div>
          <div className="bg-amber-900/40 p-3 rounded-lg text-center">
            <p className="text-xs text-white/50">11-20</p>
            <p className="text-sm font-bold text-amber-400">{txt.day11to20}</p>
          </div>
          <div className="bg-red-900/40 p-3 rounded-lg text-center">
            <p className="text-xs text-white/50">21-30</p>
            <p className="text-sm font-bold text-red-400">{txt.day21to30}</p>
          </div>
        </div>
      </div>

      {/* Full Time Table */}
      <div className="glass p-6 overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-2 text-left text-[#d4af37]">#</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.gregorian}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.hijri}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.weekday}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.sehri}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">12h Format</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.iftar}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">12h Format</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.fasting}</th>
            </tr>
          </thead>
          <tbody>
            {ramadanDays.map((day) => (
              <motion.tr
                key={day.day}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: day.day * 0.02 }}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                  getDayStatusClass(day)
                }`}
                onClick={() => console.log('Selected day:', day)}
              >
                <td className="py-3 px-2 font-bold text-[#d4af37]">{day.day}</td>
                <td className="py-3 px-2">{formatDayMonth(day.gregorianDate)}</td>
                <td className="py-3 px-2">{day.hijriDate}</td>
                <td className="py-3 px-2">{day.shortWeekday}</td>
                <td className="py-3 px-2 font-mono text-emerald-400">{day.sehri}</td>
                <td className="py-3 px-2 font-mono text-emerald-400/70 text-sm">{day.sehriTime12hr}</td>
                <td className="py-3 px-2 font-mono text-orange-400">{day.iftar}</td>
                <td className="py-3 px-2 font-mono text-orange-400/70 text-sm">{day.iftarTime12hr}</td>
                <td className="py-3 px-2 text-[#d4af37]">{day.fastingHours}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Today's Highlight */}
      {ramadanInfo.currentDay && (
        <div className="glass p-4 bg-[#d4af37]/10">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🌙</div>
            <div>
              <p className="text-sm text-white/50">{txt.today}</p>
              <p className="text-xl font-bold text-[#d4af37]">
                Day {ramadanInfo.currentDay} of 30
              </p>
              <p className="text-sm text-white/70">
                {ramadanDays[ramadanInfo.currentDay - 1]?.sehri} - {ramadanDays[ramadanInfo.currentDay - 1]?.iftar}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="glass p-4 text-sm text-white/50">
        <p className="flex items-center gap-2">
          <i className="fas fa-info-circle text-[#d4af37]"></i>
          {txt.notes}
        </p>
        <p className="flex items-center gap-2 mt-1">
          <i className="fas fa-clock text-emerald-400"></i>
          {txt.sehriNote}
        </p>
        <p className="flex items-center gap-2 mt-1">
          <i className="fas fa-clock text-orange-400"></i>
          {txt.iftarNote}
        </p>
      </div>
    </motion.div>
  );
};

export default RamadanTable;
