import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocation';
import hijriService from '../../services/hijriService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [ramadanInfo, setRamadanInfo] = useState({
    year: 1447,
    currentDay: 5,
    startDate: null,
    endDate: null
  });
  const [loading, setLoading] = useState(true);
  const [todayInfo, setTodayInfo] = useState(null);

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  useEffect(() => {
    loadRamadanData();
  }, []);

  const loadRamadanData = async () => {
    try {
      setLoading(true);
      
      // Get Ramadan calendar from hijri service
      const calendarData = await hijriService.getRamadanCalendar();
      
      setRamadanInfo({
        year: calendarData.year,
        currentDay: calendarData.currentDay,
        startDate: calendarData.startDate,
        endDate: calendarData.endDate
      });
      
      // Get prayer times for each day if location available
      const days = [];
      let todayData = null;
      
      for (const day of calendarData.days) {
        let sehriTime = '05:30';
        let iftarTime = '18:15';
        
        if (location) {
          try {
            const prayerData = await getPrayerTimes(
              location.lat,
              location.lng,
              4,
              day.gregorianStr
            );
            sehriTime = prayerData?.timings?.Fajr || '05:30';
            iftarTime = prayerData?.timings?.Maghrib || '18:15';
          } catch (error) {
            console.log(`Using default times for day ${day.day}`);
          }
        }

        const dayData = {
          day: day.day,
          gregorianDate: day.gregorian,
          hijriDate: day.hijri.format,
          weekday: weekdays[day.gregorian.getDay()],
          shortWeekday: weekdays[day.gregorian.getDay()].substring(0, 3),
          sehri: convertTo12Hour(sehriTime),
          iftar: convertTo12Hour(iftarTime),
          isToday: day.isToday,
          isPast: day.gregorian < new Date(),
          fastingHours: calculateFastingHours(sehriTime, iftarTime),
        };

        if (day.isToday) {
          todayData = dayData;
        }

        days.push(dayData);
      }

      setTodayInfo(todayData);
      setRamadanDays(days);
      
    } catch (error) {
      console.error('Error loading Ramadan data:', error);
      toast.error('Failed to load Ramadan schedule');
    } finally {
      setLoading(false);
    }
  };

  const calculateFastingHours = (sehri, iftar) => {
    const [sehriHour, sehriMin] = sehri.split(':').map(Number);
    const [iftarHour, iftarMin] = iftar.split(':').map(Number);
    
    let totalMinutes = (iftarHour * 60 + iftarMin) - (sehriHour * 60 + sehriMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const convertTo12Hour = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
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
      title: `Ramadan ${ramadanInfo.year} - 30 Days Schedule`,
      subtitle: 'Complete Sehri & Iftar Times',
      day: 'Day',
      date: 'Date',
      hijri: 'Hijri',
      gregorian: 'Gregorian',
      weekday: 'Weekday',
      sehri: 'Sehri',
      iftar: 'Iftar',
      fasting: 'Fasting',
      today: 'Today',
      todaysSchedule: 'Today\'s Schedule',
      sehriTime: 'Sehri Time',
      iftarTime: 'Iftar Time',
    },
    bn: {
      title: `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`,
      subtitle: 'সম্পূর্ণ সেহরি ও ইফতার সময়',
      day: 'রোজা',
      date: 'তারিখ',
      hijri: 'হিজরি',
      gregorian: 'ইংরেজি',
      weekday: 'বার',
      sehri: 'সেহরি',
      iftar: 'ইফতার',
      fasting: 'রোজার সময়',
      today: 'আজ',
      todaysSchedule: 'আজকের সময়সূচি',
      sehriTime: 'সেহরির সময়',
      iftarTime: 'ইফতারের সময়',
    }
  };

  const txt = translations[language] || translations.en;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-moon text-4xl text-[#d4af37] animate-pulse mb-4"></i>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4"
    >
      {/* Header */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
        <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37] mb-2">
          🌙 {txt.title}
        </h1>
        <p className="text-white/80">{txt.subtitle}</p>
        
        {/* Today's Highlight */}
        {todayInfo && (
          <div className="mt-6 glass p-6 bg-[#d4af37]/20">
            <h3 className="text-xl font-bold text-[#d4af37] mb-4">
              {txt.todaysSchedule}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50">{txt.sehriTime}</p>
                <p className="text-2xl font-bold text-emerald-400">{todayInfo.sehri}</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50">{txt.iftarTime}</p>
                <p className="text-2xl font-bold text-orange-400">{todayInfo.iftar}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="glass p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 px-2 text-left text-[#d4af37]">#</th>
              <th className="py-2 px-2 text-left text-[#d4af37]">{txt.gregorian}</th>
              <th className="py-2 px-2 text-left text-[#d4af37]">{txt.hijri}</th>
              <th className="py-2 px-2 text-left text-[#d4af37]">{txt.weekday}</th>
              <th className="py-2 px-2 text-left text-[#d4af37]">{txt.sehri}</th>
              <th className="py-2 px-2 text-left text-[#d4af37]">{txt.iftar}</th>
              <th className="py-2 px-2 text-left text-[#d4af37]">{txt.fasting}</th>
            </tr>
          </thead>
          <tbody>
            {ramadanDays.map((day) => (
              <tr
                key={day.day}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                  getDayStatusClass(day)
                }`}
              >
                <td className="py-2 px-2 font-bold text-[#d4af37]">{day.day}</td>
                <td className="py-2 px-2">{formatDayMonth(day.gregorianDate)}</td>
                <td className="py-2 px-2">{day.hijriDate}</td>
                <td className="py-2 px-2">
                  {language === 'bn' ? banglaWeekdays[day.gregorianDate.getDay()] : day.weekday}
                </td>
                <td className="py-2 px-2 text-emerald-400">{day.sehri}</td>
                <td className="py-2 px-2 text-orange-400">{day.iftar}</td>
                <td className="py-2 px-2 text-[#d4af37]">{day.fastingHours}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default RamadanTable;
