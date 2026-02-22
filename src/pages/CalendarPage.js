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
import { getPrayerTimes } from '../services/prayerService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';
import IslamicCalendar from '../components/calendar/IslamicCalendar';
import GregorianCalendar from '../components/calendar/GregorianCalendar';
import DateConverter from '../components/calendar/DateConverter';
import EventList from '../components/calendar/EventList'; // You'll need to create this component

const CalendarPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [calendarType, setCalendarType] = useState('hijri');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDate, setHijriDate] = useState(null);
  const [gregorianDate, setGregorianDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConverter, setShowConverter] = useState(false);
  const [showEvents, setShowEvents] = useState(true);
  const [currentHijri, setCurrentHijri] = useState(null);
  const [currentHijriError, setCurrentHijriError] = useState(false);
  const [location, setLocation] = useState(null);
  const [loadingPrayer, setLoadingPrayer] = useState(false);
  const [userCountry, setUserCountry] = useState(null);
  
  // Converter states
  const [convertFrom, setConvertFrom] = useState('gregorian');
  const [convertTo, setConvertTo] = useState('hijri');
  const [convertInput, setConvertInput] = useState({
    day: '',
    month: '',
    year: ''
  });
  const [convertResult, setConvertResult] = useState(null);

  // FIXED: Hijri month names - with correct mapping
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
    getUserLocation();
  }, []);

  // FIXED: When calendar type changes, reload data with correct type
  useEffect(() => {
    loadCalendarData();
    if (calendarType === 'hijri') {
      loadEvents();
    }
  }, [calendarType, currentDate]);

  // Load prayer times when location changes
  useEffect(() => {
    if (location) {
      fetchPrayerTimes();
    }
  }, [location, currentDate]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          
          // Get country from coordinates
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&accept-language=${currentLanguage}`)
            .then(response => response.json())
            .then(data => {
              if (data.address && data.address.country) {
                setUserCountry(data.address.country);
              }
            })
            .catch(error => console.error('Error getting country:', error));
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocation({ lat: 21.4225, lng: 39.8262 });
          setUserCountry('Saudi Arabia');
          toast.error(
            currentLanguage === 'bn' 
              ? 'অবস্থান পাওয়া যায়নি, মক্কার সময় দেখানো হচ্ছে' 
              : 'Location not found, showing Makkah times'
          );
        }
      );
    } else {
      setLocation({ lat: 21.4225, lng: 39.8262 });
      setUserCountry('Saudi Arabia');
    }
  };

  const fetchPrayerTimes = async () => {
    try {
      setLoadingPrayer(true);
      if (!location) return;
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const times = await getPrayerTimes(location.lat, location.lng, dateStr);
      setPrayerTimes(times);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
    } finally {
      setLoadingPrayer(false);
    }
  };

  const fetchCurrentHijri = async () => {
    try {
      setCurrentHijriError(false);
      const data = await getCurrentHijri();
      
      // FIXED: Check if we need to adjust for Asia
      // If API returns 5 but actual is 4, we can add an offset parameter
      // For now, let's assume the API is correct
      setCurrentHijri(data || null);
      
      console.log('Current Hijri from API:', data);
    } catch (error) {
      console.warn('Current Hijri date API not available:', error);
      setCurrentHijriError(true);
      setCurrentHijri(null);
    }
  };

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      if (calendarType === 'hijri') {
        // For Hijri calendar, use the current date but we'll highlight today based on API
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const data = await getHijriCalendar(year, month);
        setHijriDate(data || null);
        if (data) {
          generateHijriCalendar(data);
        } else {
          setCalendarDays([]);
        }
      } else {
        // For Gregorian calendar, use the current date properly
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        
        const data = await getGregorianCalendar(year, month);
        setGregorianDate(data || null);
        if (data) {
          generateGregorianCalendar(data);
        } else {
          setCalendarDays([]);
        }
      }
      
    } catch (error) {
      console.error('Error loading calendar:', error);
      toast.error(t('errors.calendar') || 'Failed to load calendar');
      setCalendarDays([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      // Load events for current Hijri year
      const year = currentHijri?.year || 1447; // Default to 1447 if not available
      const data = await getIslamicEvents(year);
      setEvents(data || []);
      
      // Generate upcoming events
      if (data && data.length > 0 && currentHijri) {
        const upcoming = data
          .filter(event => {
            // Only show events from current month onwards
            if (event.hijriMonth > currentHijri.month) return true;
            if (event.hijriMonth === currentHijri.month && event.hijriDay >= currentHijri.day) return true;
            return false;
          })
          .sort((a, b) => {
            if (a.hijriMonth !== b.hijriMonth) return a.hijriMonth - b.hijriMonth;
            return a.hijriDay - b.hijriDay;
          })
          .slice(0, 5); // Show only next 5 events
        
        setUpcomingEvents(upcoming);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
      setUpcomingEvents([]);
    }
  };

  const generateHijriCalendar = (data) => {
    if (!data || !data.days) {
      setCalendarDays([]);
      return;
    }

    const days = [];
    const firstDay = data.firstDay || 0;
    const totalDays = data.daysInMonth || 30;

    // Add empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add days of month
    for (let d = 1; d <= totalDays; d++) {
      const dayData = data.days?.find(day => day?.day === d) || {};
      
      // FIXED: Use API data to determine today
      const isToday = currentHijri && 
                     d === currentHijri.day && 
                     data.month === currentHijri.month &&
                     data.year === currentHijri.year;

      // Find events for this day
      const dayEvents = events.filter(event => 
        event.hijriDay === d && 
        event.hijriMonth === data.month
      );

      days.push({
        day: d,
        isToday,
        events: dayEvents,
        gregorian: dayData.gregorian || '',
        isRamadan: data.month === 9,
        isSpecial: dayData.isSpecial || false,
        weekday: dayData.weekday || '',
        hijriDate: {
          day: d,
          month: data.month,
          year: data.year
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

    // Add empty cells for days before month start
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

      // Find corresponding Hijri date for this Gregorian day
      const hijriForDay = dayData.hijri || null;

      days.push({
        day: d,
        isToday,
        weekday: dayData.weekday || weekdays.en[(firstDay + d - 1) % 7],
        hijri: hijriForDay,
        events: [] // Gregorian events would go here
      });
    }

    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    if (calendarType === 'hijri') {
      // Refresh Hijri data
      fetchCurrentHijri();
    }
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
        month: hijriDate?.month,
        year: hijriDate?.year,
        monthName: hijriMonths[currentLanguage]?.[(hijriDate?.month || 1) - 1] || 
                   hijriMonths.en[(hijriDate?.month || 1) - 1]
      });
    } else {
      setSelectedDate({
        ...day,
        type: 'gregorian',
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        monthName: gregorianMonths[currentLanguage]?.[currentDate.getMonth()] || 
                   gregorianMonths.en[currentDate.getMonth()]
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

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading && !currentHijri) {
    return <Loader />;
  }

  // Check if current month is Ramadan
  const isRamadan = currentHijri?.month === 9;

  // Calculate days remaining in Ramadan
  const ramadanDaysRemaining = isRamadan && currentHijri?.day 
    ? 30 - currentHijri.day 
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Location */}
      <div className="glass p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#d4af37] flex items-center">
              <i className="fas fa-calendar-alt mr-3"></i>
              {t('calendar.title') || 'Islamic Calendar'}
            </h1>
            <p className="text-white/70">
              {t('calendar.subtitle') || 'Track Islamic dates and events'}
            </p>
          </div>
          
          {userCountry && (
            <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-[#d4af37]"></i>
              <span className="text-sm font-medium">{userCountry}</span>
            </div>
          )}
        </div>
        
        {/* Current Hijri Date */}
        {currentHijri && !currentHijriError && (
          <div className="mt-4 inline-block bg-gradient-to-r from-[#d4af37]/20 to-[#d4af37]/5 px-6 py-4 rounded-lg border-l-4 border-[#d4af37]">
            <p className="text-sm text-white/50 mb-1 flex items-center gap-2">
              <i className="fas fa-moon text-[#d4af37]"></i>
              {currentLanguage === 'en' ? 'Today\'s Hijri Date:' : 'আজকের হিজরি তারিখ:'}
            </p>
            <p className="text-2xl font-bold text-[#d4af37]">
              {formatNumber(currentHijri.day)} {hijriMonths[currentLanguage]?.[currentHijri.month - 1] || hijriMonths.en[currentHijri.month - 1]} {formatNumber(currentHijri.year)} AH
            </p>
            <p className="text-sm text-white/50 mt-1">
              {new Date().toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', { 
                weekday: 'long',
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        )}
      </div>

      {/* Ramadan Banner */}
      {isRamadan && (
        <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30 border-l-4 border-emerald-500">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <i className="fas fa-moon text-2xl text-emerald-400"></i>
              </div>
              <div>
                <h2 className="text-xl font-bold text-emerald-400">
                  {currentLanguage === 'bn' ? 'রমজান মোবারক' : 'Ramadan Mubarak'}
                </h2>
                <p className="text-sm text-white/70">
                  {currentLanguage === 'bn' 
                    ? `রমজান ${formatNumber(currentHijri?.day || 1)} | ${formatNumber(ramadanDaysRemaining)} দিন বাকি`
                    : `Ramadan ${formatNumber(currentHijri?.day || 1)} | ${formatNumber(ramadanDaysRemaining)} days remaining`
                  }
                </p>
              </div>
            </div>
            
            {/* Prayer Times */}
            {prayerTimes && !loadingPrayer && (
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-black/20 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">
                    {currentLanguage === 'bn' ? 'ফজর' : 'Fajr'}
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatTime(prayerTimes.fajr)}
                  </p>
                </div>
                <div className="text-center px-4 py-2 bg-black/20 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">
                    {currentLanguage === 'bn' ? 'মাগরিব' : 'Maghrib'}
                  </p>
                  <p className="text-lg font-bold text-amber-400">
                    {formatTime(prayerTimes.maghrib)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">
                {currentLanguage === 'bn' ? 'রমজানের অগ্রগতি' : 'Ramadan Progress'}
              </span>
              <span className="text-emerald-400">
                {Math.round(((currentHijri?.day || 1) / 30) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${((currentHijri?.day || 1) / 30) * 100}%` }}
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
            {t('calendar.hijri') || 'Hijri Calendar'}
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
            {t('calendar.gregorian') || 'Gregorian Calendar'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section - Takes 2/3 of the space on large screens */}
        <div className="lg:col-span-2">
          <div className="glass p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                aria-label="Previous month"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              
              <h2 className="text-2xl font-bold">
                {calendarType === 'hijri' ? (
                  <>
                    {hijriMonths[currentLanguage]?.[(hijriDate?.month || currentDate.getMonth() + 1) - 1] || 
                     hijriMonths.en[(hijriDate?.month || currentDate.getMonth() + 1) - 1]} {formatNumber(hijriDate?.year || currentDate.getFullYear())} AH
                  </>
                ) : (
                  <>
                    {gregorianMonths[currentLanguage]?.[currentDate.getMonth()] || 
                     gregorianMonths.en[currentDate.getMonth()]} {formatNumber(currentDate.getFullYear())}
                  </>
                )}
              </h2>
              
              <button
                onClick={handleNextMonth}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
                aria-label="Next month"
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
                {currentHijri && calendarType === 'hijri' && (
                  <span className="text-xs bg-[#d4af37]/30 px-2 py-1 rounded-full">
                    {formatNumber(currentHijri.day)} {hijriMonths.en[currentHijri.month - 1]?.substring(0, 3)}
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
                    
                    {/* Tooltip for events */}
                    {day.events?.length > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                        {day.events.length} {currentLanguage === 'bn' ? 'টি ইভেন্ট' : 'event(s)'}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar - Events and Details */}
        <div className="space-y-6">
          {/* Upcoming Events Section */}
          <div className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-[#d4af37] flex items-center gap-2">
                <i className="fas fa-calendar-alt"></i>
                {currentLanguage === 'bn' ? 'আগামী ইভেন্ট' : 'Upcoming Events'}
              </h3>
              <button
                onClick={() => setShowEvents(!showEvents)}
                className="text-white/50 hover:text-white"
              >
                <i className={`fas fa-chevron-${showEvents ? 'up' : 'down'}`}></i>
              </button>
            </div>

            {showEvents && (
              <div className="space-y-3">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/5 p-4 rounded-lg hover:bg-white/10 transition cursor-pointer border-l-2 border-[#d4af37]"
                      onClick={() => {
                        // Find and highlight this date in calendar
                        const dayToFind = calendarDays.find(d => 
                          !d.empty && 
                          d.day === event.hijriDay && 
                          hijriDate?.month === event.hijriMonth
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
                          <p className="text-sm text-white/70 mt-1">
                            {currentLanguage === 'bn' ? event.descriptionBn : event.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
                            <span>{formatNumber(event.hijriDay)} {hijriMonths.en[event.hijriMonth - 1]}</span>
                            <span>•</span>
                            <span>{event.gregorianDate || ''}</span>
                          </div>
                        </div>
                        <div className="bg-[#d4af37]/20 px-2 py-1 rounded text-xs">
                          {Math.abs(event.hijriDay - (currentHijri?.day || 0))} {currentLanguage === 'bn' ? 'দিন' : 'days'}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-white/50">
                    <i className="fas fa-calendar-times text-3xl mb-2"></i>
                    <p>{currentLanguage === 'bn' ? 'কোন ইভেন্ট নেই' : 'No upcoming events'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDate.day && (
            <div className="glass p-6">
              <h3 className="text-xl mb-4 text-[#d4af37] flex items-center gap-2">
                <i className="fas fa-info-circle"></i>
                {currentLanguage === 'bn' ? 'তারিখের বিবরণ' : 'Date Details'}
              </h3>
              
              <div className="space-y-4">
                <div className="bg-black/20 p-4 rounded-lg">
                  <p className="text-sm text-white/50 mb-1">
                    {selectedDate.type === 'hijri' ? 'Hijri' : 'Gregorian'}
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
                    <p className="text-sm text-white/50 mb-1">Gregorian</p>
                    <p className="text-xl">{selectedDate.gregorian}</p>
                  </div>
                )}

                {selectedDate.type === 'gregorian' && selectedDate.hijri && (
                  <div className="bg-black/20 p-4 rounded-lg">
                    <p className="text-sm text-white/50 mb-1">Hijri</p>
                    <p className="text-xl">
                      {formatNumber(selectedDate.hijri.day)} {hijriMonths.en[selectedDate.hijri.month - 1]} {formatNumber(selectedDate.hijri.year)} AH
                    </p>
                  </div>
                )}

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
            </div>
          )}

          {/* Prayer Times Card */}
          {prayerTimes && !loadingPrayer && (
            <div className="glass p-6">
              <h3 className="text-xl mb-4 text-[#d4af37] flex items-center gap-2">
                <i className="fas fa-mosque"></i>
                {currentLanguage === 'bn' ? 'আজকের নামাজের সময়' : 'Today\'s Prayer Times'}
              </h3>
              <div className="space-y-2">
                {Object.entries(prayerTimes).map(([name, time]) => (
                  <div key={name} className="flex justify-between items-center p-2 bg-white/5 rounded">
                    <span className="capitalize">{name}</span>
                    <span className="font-mono">{formatTime(time)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Converter */}
      <div className="glass p-6">
        <button
          onClick={() => setShowConverter(!showConverter)}
          className="w-full text-left flex items-center justify-between"
        >
          <h3 className="text-xl text-[#d4af37] flex items-center gap-2">
            <i className="fas fa-exchange-alt"></i>
            {t('calendar.dateConverter') || 'Date Converter'}
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
          />
        )}
      </div>
    </motion.div>
  );
};

export default CalendarPage;
