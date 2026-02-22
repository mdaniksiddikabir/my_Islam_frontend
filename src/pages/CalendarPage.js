// src/pages/CalendarPage.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { 
  getHijriCalendar, 
  getGregorianCalendar, 
  getIslamicEvents,
  getCurrentHijri,
  convertDate 
} from '../services/calendarService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import DateConverter from '../components/calendar/DateConverter';

const CalendarPage = () => {
  const { t, currentLanguage } = useLanguage(); // 'bn' or 'en'
  const [loading, setLoading] = useState(true);
  const [calendarType, setCalendarType] = useState('hijri');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDate, setHijriDate] = useState(null);
  const [gregorianDate, setGregorianDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConverter, setShowConverter] = useState(false);
  const [currentHijri, setCurrentHijri] = useState(null);
  const [currentHijriError, setCurrentHijriError] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  const [hijriYearForCalendar, setHijriYearForCalendar] = useState(null);
  const [hijriMonthForCalendar, setHijriMonthForCalendar] = useState(null);
  
  // MANUAL OFFSET FOR YOUR AREA
  // If API shows 5th but actual is 4th, set offset to -1
  const DATE_OFFSET = -1; // Change this based on your location
  
  // Converter states
  const [convertFrom, setConvertFrom] = useState('gregorian');
  const [convertTo, setConvertTo] = useState('hijri');
  const [convertInput, setConvertInput] = useState({
    day: '',
    month: '',
    year: ''
  });
  const [convertResult, setConvertResult] = useState(null);

  // Hijri month names
  const hijriMonths = {
    en: [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
      'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
    ],
    bn: [
      'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
      'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান',
      'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'
    ]
  };

  // Gregorian month names
  const gregorianMonths = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
  };

  // Weekday names
  const weekdays = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']
  };

  // Load current Hijri date on mount
  useEffect(() => {
    fetchCurrentHijri();
    getUserCountry();
  }, []);

  // When currentHijri is loaded, set the calendar to show that month
  useEffect(() => {
    if (currentHijri && !currentHijriError) {
      const adjusted = getAdjustedHijriDate();
      console.log('Setting calendar to show Hijri month:', adjusted.month);
      
      // Set the Hijri year and month for calendar display
      setHijriYearForCalendar(adjusted.year);
      setHijriMonthForCalendar(adjusted.month);
      
      // Load calendar data with the correct Hijri month
      loadHijriCalendarForMonth(adjusted.year, adjusted.month);
    }
  }, [currentHijri]);

  // Load calendar data when date or type changes
  useEffect(() => {
    if (calendarType === 'hijri') {
      if (hijriYearForCalendar && hijriMonthForCalendar) {
        loadHijriCalendarForMonth(hijriYearForCalendar, hijriMonthForCalendar);
      }
    } else {
      loadGregorianCalendar();
    }
  }, [calendarType, hijriYearForCalendar, hijriMonthForCalendar]);

  // Load events when currentHijri changes
  useEffect(() => {
    if (currentHijri) {
      loadEvents();
    }
  }, [currentHijri, currentLanguage]);

  const getUserCountry = () => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const region = timezone.split('/')[0];
      const city = timezone.split('/')[1];
      
      if (region === 'Asia') {
        if (city === 'Dhaka') setUserCountry('Bangladesh');
        else if (city === 'Kolkata') setUserCountry('India');
        else if (city === 'Karachi') setUserCountry('Pakistan');
        else setUserCountry(city || region);
      } else {
        setUserCountry(region);
      }
    } catch (error) {
      setUserCountry('Unknown');
    }
  };

  // Function to apply offset to Hijri date
  const getAdjustedHijriDate = () => {
    if (!currentHijri) return null;
    
    let adjustedDay = currentHijri.day + DATE_OFFSET;
    let adjustedMonth = currentHijri.month;
    let adjustedYear = currentHijri.year;
    
    // Handle month boundary
    if (adjustedDay < 1) {
      adjustedMonth -= 1;
      if (adjustedMonth < 1) {
        adjustedMonth = 12;
        adjustedYear -= 1;
      }
      // Get last day of previous month (simplified - assume 30 days)
      adjustedDay = 30 + adjustedDay;
    } else if (adjustedDay > 30) {
      adjustedMonth += 1;
      if (adjustedMonth > 12) {
        adjustedMonth = 1;
        adjustedYear += 1;
      }
      adjustedDay = adjustedDay - 30;
    }
    
    return {
      day: adjustedDay,
      month: adjustedMonth,
      year: adjustedYear,
      monthName: hijriMonths.en[adjustedMonth - 1],
      monthNameBn: hijriMonths.bn[adjustedMonth - 1]
    };
  };

  const fetchCurrentHijri = async () => {
    try {
      setCurrentHijriError(false);
      const data = await getCurrentHijri();
      // data is { day: 5, month: 9, monthName: "رمضان", year: 1447 }
      setCurrentHijri(data || null);
      console.log('Raw API data:', data);
      console.log('Adjusted date:', getAdjustedHijriDate());
    } catch (error) {
      console.warn('Current Hijri date API not available:', error);
      setCurrentHijriError(true);
      setCurrentHijri(null);
    }
  };

  // NEW FUNCTION: Load Hijri calendar for a specific Hijri year and month
  const loadHijriCalendarForMonth = async (hijriYear, hijriMonth) => {
    try {
      setLoading(true);
      
      // We need to convert Hijri year/month to Gregorian to get the calendar data
      // This is a simplified approach - in production you'd use a proper conversion
      
      // For now, we'll use the current Gregorian date but we know the Hijri month
      // In a real app, you'd have an API endpoint that accepts Hijri year/month
      
      // Since your API might not accept Hijri directly, we'll use the current Gregorian date
      // but store the Hijri month for display
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      console.log(`Loading Hijri calendar for Hijri month ${hijriMonth}/${hijriYear} using Gregorian ${month}/${year}`);
      
      const data = await getHijriCalendar(year, month);
      setHijriDate({
        ...data,
        // Override with our Hijri month info
        hijriYear: hijriYear,
        hijriMonth: hijriMonth,
        month: hijriMonth, // Use the actual Hijri month
        year: hijriYear
      });
      
      if (data) {
        generateHijriCalendar(data, hijriYear, hijriMonth);
      } else {
        setCalendarDays([]);
      }
      
    } catch (error) {
      console.error('Error loading Hijri calendar:', error);
      toast.error(t('errors.calendar') || 'Failed to load calendar');
      setCalendarDays([]);
    } finally {
      setLoading(false);
    }
  };

  const loadGregorianCalendar = async () => {
    try {
      setLoading(true);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      const data = await getGregorianCalendar(year, month);
      setGregorianDate(data || null);
      if (data) {
        generateGregorianCalendar(data);
      } else {
        setCalendarDays([]);
      }
      
    } catch (error) {
      console.error('Error loading Gregorian calendar:', error);
      toast.error(t('errors.calendar') || 'Failed to load calendar');
      setCalendarDays([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const adjustedDate = getAdjustedHijriDate();
      const year = adjustedDate?.year || 1447;
      const data = await getIslamicEvents(year);
      setEvents(data || []);
      
      // Generate upcoming events using adjusted date
      if (data && data.length > 0 && adjustedDate) {
        const upcoming = data
          .filter(event => {
            if (event.hijriMonth > adjustedDate.month) return true;
            if (event.hijriMonth === adjustedDate.month && event.hijriDay >= adjustedDate.day) return true;
            return false;
          })
          .sort((a, b) => {
            if (a.hijriMonth !== b.hijriMonth) return a.hijriMonth - b.hijriMonth;
            return a.hijriDay - b.hijriDay;
          })
          .slice(0, 5);
        
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      setUpcomingEvents([]);
    }
  };

  // MODIFIED: Generate Hijri calendar with actual Hijri month info
  const generateHijriCalendar = (data, actualHijriYear, actualHijriMonth) => {
    if (!data || !data.days) {
      setCalendarDays([]);
      return;
    }

    const days = [];
    const firstDay = data.firstDay || 0;
    const totalDays = data.daysInMonth || 30;
    const adjustedDate = getAdjustedHijriDate();

    // Add empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add days of month
    for (let d = 1; d <= totalDays; d++) {
      const dayData = data.days?.find(day => day?.day === d) || {};
      
      // Check if this day is today using ADJUSTED date
      const isToday = adjustedDate && 
                     d === adjustedDate.day && 
                     actualHijriMonth === adjustedDate.month &&
                     actualHijriYear === adjustedDate.year;

      // Find events for this day (using actual Hijri month)
      const dayEvents = events.filter(event => 
        event.hijriDay === d && 
        event.hijriMonth === actualHijriMonth
      );

      days.push({
        day: d,
        isToday,
        events: dayEvents,
        gregorian: dayData.gregorian || '',
        isRamadan: actualHijriMonth === 9,
        hijriDate: {
          day: d,
          month: actualHijriMonth,
          year: actualHijriYear
        }
      });
    }

    setCalendarDays(days);
  };

  const generateGregorianCalendar = (data) => {
    if (!data || !data.days) {
      setCalendarDays([]);
      return;
    }

    const days = [];
    const firstDay = data.firstDay || 0;
    const totalDays = data.daysInMonth || 30;

    // Add empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add days of month
    for (let d = 1; d <= totalDays; d++) {
      const dayData = data.days?.find(day => day?.day === d) || {};
      
      const today = new Date();
      const isToday = d === today.getDate() && 
                     data.month === (today.getMonth() + 1) &&
                     data.year === today.getFullYear();

      days.push({
        day: d,
        isToday,
        weekday: dayData.weekday || weekdays.en[(firstDay + d - 1) % 7],
        hijri: dayData.hijri || null
      });
    }

    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    if (calendarType === 'hijri') {
      // For Hijri calendar, we need to go to previous Hijri month
      if (hijriMonthForCalendar && hijriYearForCalendar) {
        let newMonth = hijriMonthForCalendar - 1;
        let newYear = hijriYearForCalendar;
        
        if (newMonth < 1) {
          newMonth = 12;
          newYear -= 1;
        }
        
        setHijriMonthForCalendar(newMonth);
        setHijriYearForCalendar(newYear);
      }
    } else {
      // For Gregorian calendar
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  const handleNextMonth = () => {
    if (calendarType === 'hijri') {
      // For Hijri calendar, we need to go to next Hijri month
      if (hijriMonthForCalendar && hijriYearForCalendar) {
        let newMonth = hijriMonthForCalendar + 1;
        let newYear = hijriYearForCalendar;
        
        if (newMonth > 12) {
          newMonth = 1;
          newYear += 1;
        }
        
        setHijriMonthForCalendar(newMonth);
        setHijriYearForCalendar(newYear);
      }
    } else {
      // For Gregorian calendar
      const newDate = new Date(currentDate);
      newDate.setMonth(currentDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

  const handleToday = () => {
    // Reset to today's Hijri date
    fetchCurrentHijri();
    
    const adjusted = getAdjustedHijriDate();
    if (adjusted) {
      setHijriYearForCalendar(adjusted.year);
      setHijriMonthForCalendar(adjusted.month);
    }
    
    setCurrentDate(new Date());
    
    toast.success(
      currentLanguage === 'bn' 
        ? 'আজকের তারিখে ফিরে গেছেন' 
        : 'Returned to today\'s date'
    );
  };

  const handleDateClick = (day) => {
    if (day?.empty) return;
    
    if (calendarType === 'hijri') {
      setSelectedDate({
        ...day,
        type: 'hijri',
        month: hijriMonthForCalendar,
        year: hijriYearForCalendar,
        monthName: currentLanguage === 'bn' 
          ? hijriMonths.bn[(hijriMonthForCalendar || 1) - 1]
          : hijriMonths.en[(hijriMonthForCalendar || 1) - 1]
      });
    } else {
      setSelectedDate({
        ...day,
        type: 'gregorian',
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        monthName: currentLanguage === 'bn' 
          ? gregorianMonths.bn[currentDate.getMonth()]
          : gregorianMonths.en[currentDate.getMonth()]
      });
    }
  };

  const handleConvert = async () => {
    if (!convertInput?.day || !convertInput?.month || !convertInput?.year) {
      toast.error(t('errors.fillAllFields') || 'Please fill all fields');
      return;
    }

    try {
      const result = await convertDate(
        convertFrom,
        convertTo,
        convertInput
      );
      setConvertResult(result || null);
      toast.success(t('calendar.converted') || 'Date converted successfully');
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(t('errors.conversion') || 'Conversion failed');
    }
  };

  const formatNumber = (num) => {
    if (num === undefined || num === null) return '';
    if (currentLanguage === 'bn') {
      const banglaDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
      return num.toString().split('').map(d => banglaDigits[d] || d).join('');
    }
    return num;
  };

  if (loading && !currentHijri) {
    return <Loader />;
  }

  // Get adjusted date for display
  const adjustedHijri = getAdjustedHijriDate();
  
  // Check if current month is Ramadan using adjusted date
  const isRamadan = adjustedHijri?.month === 9;

  // Calculate days remaining in Ramadan using adjusted date
  const ramadanDaysRemaining = isRamadan && adjustedHijri?.day 
    ? 30 - adjustedHijri.day 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      dir={currentLanguage === 'bn' ? 'ltr' : 'ltr'}
    >
      {/* Header with Location */}
      <div className="glass p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#d4af37] flex items-center">
              <i className="fas fa-calendar-alt mr-3"></i>
              {t('calendar.title') || (currentLanguage === 'bn' ? 'ইসলামিক ক্যালেন্ডার' : 'Islamic Calendar')}
            </h1>
            <p className="text-white/70">
              {t('calendar.subtitle') || (currentLanguage === 'bn' ? 'ইসলামিক তারিখ এবং ইভেন্ট ট্র্যাক করুন' : 'Track Islamic dates and events')}
            </p>
          </div>
          
          {userCountry && (
            <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#d4af37]"></i>
              <span className="text-sm font-medium">
                {currentLanguage === 'bn' ? getBanglaCountryName(userCountry) : userCountry}
              </span>
            </div>
          )}
        </div>
        
        {/* Current Hijri Date - showing ADJUSTED date */}
        {adjustedHijri && !currentHijriError && (
          <div className="mt-4 inline-block bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5 px-6 py-4 rounded-lg border-l-4 border-[#d4af37]">
            <p className="text-sm text-white/50 mb-1 flex items-center gap-2">
              <i className="fas fa-moon text-[#d4af37]"></i>
              {currentLanguage === 'en' ? 'Today\'s Hijri Date:' : 'আজকের হিজরি তারিখ:'}
              {DATE_OFFSET !== 0 && (
                <span className="text-xs bg-[#d4af37]/30 px-2 py-0.5 rounded-full">
                  {currentLanguage === 'bn' ? 'স্থানীয় সমন্বয়' : 'Local adjusted'}
                </span>
              )}
            </p>
            <p className="text-2xl font-bold text-[#d4af37]">
              {formatNumber(adjustedHijri.day)} {
                currentLanguage === 'bn' 
                  ? hijriMonths.bn[adjustedHijri.month - 1]
                  : hijriMonths.en[adjustedHijri.month - 1]
              } {formatNumber(adjustedHijri.year)} AH
            </p>
            <p className="text-sm text-white/50 mt-1">
              {new Date().toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            {DATE_OFFSET !== 0 && (
              <p className="text-xs text-white/30 mt-1">
                {currentLanguage === 'bn' 
                  ? `API তে দেখায়: ${currentHijri?.day} রমজান` 
                  : `API shows: ${currentHijri?.day} Ramadan`}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Ramadan Banner - using adjusted date */}
      {isRamadan && (
        <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30 border-l-4 border-emerald-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <i className="fas fa-moon text-2xl text-emerald-400"></i>
            </div>
            <div>
              <h2 className="text-xl font-bold text-emerald-400">
                {currentLanguage === 'bn' ? 'রমজান মোবারক' : 'Ramadan Mubarak'}
              </h2>
              <p className="text-sm text-white/70">
                {currentLanguage === 'bn' 
                  ? `রমজান ${formatNumber(adjustedHijri?.day || 1)} | ${formatNumber(ramadanDaysRemaining)} দিন বাকি`
                  : `Ramadan ${formatNumber(adjustedHijri?.day || 1)} | ${formatNumber(ramadanDaysRemaining)} days remaining`
                }
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">
                {currentLanguage === 'bn' ? 'রমজানের অগ্রগতি' : 'Ramadan Progress'}
              </span>
              <span className="text-emerald-400">
                {Math.round(((adjustedHijri?.day || 1) / 30) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${((adjustedHijri?.day || 1) / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Calendar Type Selector */}
      <div className="glass p-4">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCalendarType('hijri')}
            className={`px-6 py-2 rounded-full transition flex items-center gap-2 ${
              calendarType === 'hijri'
                ? 'bg-[#d4af37] text-[#1a3f54] font-medium'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <i className="fas fa-moon"></i>
            {currentLanguage === 'bn' ? 'হিজরি' : 'Hijri'}
          </button>
          <button
            onClick={() => setCalendarType('gregorian')}
            className={`px-6 py-2 rounded-full transition flex items-center gap-2 ${
              calendarType === 'gregorian'
                ? 'bg-[#d4af37] text-[#1a3f54] font-medium'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <i className="fas fa-sun"></i>
            {currentLanguage === 'bn' ? 'গ্রেগরিয়ান' : 'Gregorian'}
          </button>
        </div>
      </div>

      {/* Main Calendar Section */}
      <div className="glass p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <h2 className="text-2xl font-bold">
            {calendarType === 'hijri' ? (
              <>
                {currentLanguage === 'bn' 
                  ? hijriMonths.bn[(hijriMonthForCalendar || 1) - 1]
                  : hijriMonths.en[(hijriMonthForCalendar || 1) - 1]
                } {formatNumber(hijriYearForCalendar || currentHijri?.year || 1447)} AH
              </>
            ) : (
              <>
                {currentLanguage === 'bn' 
                  ? gregorianMonths.bn[currentDate.getMonth()]
                  : gregorianMonths.en[currentDate.getMonth()]
                } {formatNumber(currentDate.getFullYear())}
              </>
            )}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Today Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 rounded-full transition flex items-center gap-2"
          >
            <i className="fas fa-calendar-check"></i>
            {currentLanguage === 'bn' ? 'আজকের তারিখ' : 'Today'}
            {adjustedHijri && calendarType === 'hijri' && (
              <span className="text-xs bg-[#d4af37]/30 px-2 py-1 rounded-full">
                {formatNumber(adjustedHijri.day)} {
                  currentLanguage === 'bn' 
                    ? hijriMonths.bn[adjustedHijri.month - 1]?.substring(0, 3)
                    : hijriMonths.en[adjustedHijri.month - 1]?.substring(0, 3)
                }
              </span>
            )}
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekdays[currentLanguage]?.map((day, index) => (
            <div key={index} className="text-center text-sm font-medium text-white/50 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day.empty) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            
            return (
              <button
                key={`day-${day.day}`}
                onClick={() => handleDateClick(day)}
                className={`aspect-square p-2 rounded-lg transition relative group
                  ${day.isToday 
                    ? 'bg-[#d4af37] text-[#1a3f54] font-bold ring-2 ring-[#d4af37] ring-offset-2 ring-offset-[#1a3f54]' 
                    : 'hover:bg-white/10'
                  }
                  ${day.events?.length > 0 ? 'bg-opacity-20 bg-[#d4af37]' : ''}
                `}
              >
                <span className="text-lg">{formatNumber(day.day)}</span>
                
                {/* Event Indicator */}
                {day.events?.length > 0 && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex gap-0.5">
                    {day.events.slice(0, 3).map((_, i) => (
                      <div key={i} className="w-1 h-1 rounded-full bg-[#d4af37]" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events Section */}
      {upcomingEvents.length > 0 && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center gap-2">
            <i className="fas fa-calendar-alt"></i>
            {currentLanguage === 'bn' ? 'আগামী ইভেন্ট' : 'Upcoming Events'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event, index) => {
              const daysUntil = adjustedHijri?.month === event.hijriMonth
                ? event.hijriDay - (adjustedHijri?.day || 0)
                : (event.hijriMonth - (adjustedHijri?.month || 0)) * 30 + event.hijriDay - (adjustedHijri?.day || 0);
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition cursor-pointer border-l-2 border-[#d4af37]"
                  onClick={() => {
                    const dayToFind = calendarDays.find(d => 
                      !d.empty && 
                      d.day === event.hijriDay
                    );
                    if (dayToFind) {
                      handleDateClick(dayToFind);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-[#d4af37]">
                        {currentLanguage === 'bn' ? event.nameBn : event.name}
                      </h4>
                      <p className="text-sm text-white/70 mt-1 line-clamp-2">
                        {currentLanguage === 'bn' ? event.descriptionBn : event.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                        <span>
                          {formatNumber(event.hijriDay)} {
                            currentLanguage === 'bn' 
                              ? hijriMonths.bn[event.hijriMonth - 1]
                              : hijriMonths.en[event.hijriMonth - 1]
                          }
                        </span>
                        {event.gregorianDate && (
                          <>
                            <span>•</span>
                            <span>{event.gregorianDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="bg-[#d4af37]/20 px-2 py-1 rounded text-xs whitespace-nowrap">
                      {daysUntil > 0 
                        ? `${daysUntil} ${currentLanguage === 'bn' ? 'দিন' : 'days'}`
                        : daysUntil === 0
                        ? currentLanguage === 'bn' ? 'আজ' : 'Today'
                        : currentLanguage === 'bn' ? 'অতীত' : 'Past'
                      }
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && selectedDate.day && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            {currentLanguage === 'bn' ? 'তারিখের বিবরণ' : 'Date Details'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-lg">
              <p className="text-sm text-white/50 mb-1">
                {selectedDate.type === 'hijri' 
                  ? (currentLanguage === 'bn' ? 'হিজরি' : 'Hijri')
                  : (currentLanguage === 'bn' ? 'গ্রেগরিয়ান' : 'Gregorian')
                }
              </p>
              <p className="text-xl font-bold">
                {selectedDate.type === 'hijri' ? (
                  <>
                    {formatNumber(selectedDate.day)} {selectedDate.monthName} {formatNumber(selectedDate.year)} AH
                  </>
                ) : (
                  <>
                    {formatNumber(selectedDate.day)} {selectedDate.monthName} {formatNumber(selectedDate.year)}
                  </>
                )}
              </p>
              {selectedDate.isToday && (
                <span className="mt-2 inline-block bg-emerald-500/30 px-2 py-1 rounded-full text-xs">
                  {currentLanguage === 'bn' ? 'আজ' : 'Today'}
                </span>
              )}
            </div>

            {selectedDate.type === 'hijri' && selectedDate.gregorian && (
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50 mb-1">
                  {currentLanguage === 'bn' ? 'গ্রেগরিয়ান' : 'Gregorian'}
                </p>
                <p className="text-xl">{selectedDate.gregorian}</p>
              </div>
            )}

            {selectedDate.type === 'gregorian' && selectedDate.hijri && (
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50 mb-1">
                  {currentLanguage === 'bn' ? 'হিজরি' : 'Hijri'}
                </p>
                <p className="text-xl">
                  {formatNumber(selectedDate.hijri.day)} {
                    currentLanguage === 'bn' 
                      ? hijriMonths.bn[selectedDate.hijri.month - 1]
                      : hijriMonths.en[selectedDate.hijri.month - 1]
                  } {formatNumber(selectedDate.hijri.year)} AH
                </p>
              </div>
            )}
          </div>

          {/* Events on selected date */}
          {selectedDate.events && selectedDate.events.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg mb-2 text-[#d4af37]">
                {currentLanguage === 'bn' ? 'ইভেন্টসমূহ' : 'Events'}
              </h4>
              <div className="space-y-2">
                {selectedDate.events.map((event, index) => (
                  <div key={index} className="bg-[#d4af37]/10 p-3 rounded-lg">
                    <p className="font-bold">
                      {currentLanguage === 'bn' ? event.nameBn : event.name}
                    </p>
                    <p className="text-sm text-white/70">
                      {currentLanguage === 'bn' ? event.descriptionBn : event.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date Converter */}
      <div className="glass p-6">
        <button
          onClick={() => setShowConverter(!showConverter)}
          className="w-full text-left flex items-center justify-between"
        >
          <h3 className="text-xl text-[#d4af37] flex items-center gap-2">
            <i className="fas fa-exchange-alt"></i>
            {currentLanguage === 'bn' ? 'তারিখ রূপান্তর' : 'Date Converter'}
          </h3>
          <i className={`fas fa-chevron-${showConverter ? 'up' : 'down'} text-[#d4af37]`}></i>
        </button>

        {showConverter && (
          <DateConverter
            fromType={convertFrom}
            toType={convertTo}
            date={convertInput}
            result={convertResult}
            onFromChange={setConvertFrom}
            onToChange={setConvertTo}
            onDateChange={setConvertInput}
            onConvert={handleConvert}
            currentLanguage={currentLanguage}
          />
        )}
      </div>
    </motion.div>
  );
};

// Helper function to get Bengali country names
const getBanglaCountryName = (country) => {
  const countryMap = {
    'Bangladesh': 'বাংলাদেশ',
    'India': 'ভারত',
    'Pakistan': 'পাকিস্তান',
    'Saudi Arabia': 'সৌদি আরব',
    'UAE': 'সংযুক্ত আরব আমিরাত',
    'USA': 'মার্কিন যুক্তরাষ্ট্র',
    'UK': 'যুক্তরাজ্য',
    'Canada': 'কানাডা',
    'Australia': 'অস্ট্রেলিয়া',
    'Malaysia': 'মালয়েশিয়া',
    'Indonesia': 'ইন্দোনেশিয়া',
    'Turkey': 'তুরস্ক',
    'Egypt': 'মিশর',
    'Jordan': 'জর্ডান',
    'Syria': 'সিরিয়া',
    'Iraq': 'ইরাক',
    'Iran': 'ইরান',
    'Afghanistan': 'আফগানিস্তান',
    'Nepal': 'নেপাল',
    'Bhutan': 'ভুটান',
    'Myanmar': 'মায়ানমার',
    'Thailand': 'থাইল্যান্ড',
    'Singapore': 'সিঙ্গাপুর',
    'China': 'চীন',
    'Japan': 'জাপান',
    'South Korea': 'দক্ষিণ কোরিয়া',
    'Russia': 'রাশিয়া',
    'Germany': 'জার্মানি',
    'France': 'ফ্রান্স',
    'Italy': 'ইতালি',
    'Spain': 'স্পেন',
    'Portugal': 'পর্তুগাল',
    'Netherlands': 'নেদারল্যান্ডস',
    'Belgium': 'বেলজিয়াম',
    'Switzerland': 'সুইজারল্যান্ড',
    'Austria': 'অস্ট্রিয়া',
    'Sweden': 'সুইডেন',
    'Norway': 'নরওয়ে',
    'Denmark': 'ডেনমার্ক',
    'Finland': 'ফিনল্যান্ড',
    'Greece': 'গ্রীস',
    'Poland': 'পোল্যান্ড',
    'Ukraine': 'ইউক্রেন',
    'Romania': 'রোমানিয়া',
    'Hungary': 'হাঙ্গেরি',
    'Czech Republic': 'চেক প্রজাতন্ত্র',
    'Slovakia': 'স্লোভাকিয়া',
    'Bulgaria': 'বুলগেরিয়া',
    'Serbia': 'সার্বিয়া',
    'Croatia': 'ক্রোয়েশিয়া',
    'Bosnia': 'বসনিয়া',
    'Albania': 'আলবেনিয়া',
    'Kosovo': 'কসোভো',
    'Morocco': 'মরক্কো',
    'Algeria': 'আলজেরিয়া',
    'Tunisia': 'তিউনিসিয়া',
    'Libya': 'লিবিয়া',
    'Sudan': 'সুদান',
    'Ethiopia': 'ইথিওপিয়া',
    'Somalia': 'সোমালিয়া',
    'Kenya': 'কেনিয়া',
    'Tanzania': 'তানজানিয়া',
    'Uganda': 'উগান্ডা',
    'Nigeria': 'নাইজেরিয়া',
    'Ghana': 'ঘানা',
    'South Africa': 'দক্ষিণ আফ্রিকা',
    'Brazil': 'ব্রাজিল',
    'Argentina': 'আর্জেন্টিনা',
    'Chile': 'চিলি',
    'Peru': 'পেরু',
    'Colombia': 'কলম্বিয়া',
    'Venezuela': 'ভেনেজুয়েলা',
    'Mexico': 'মেক্সিকো'
  };
  
  return countryMap[country] || country;
};

export default CalendarPage;
