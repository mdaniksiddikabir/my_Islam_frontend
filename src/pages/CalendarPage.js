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

const CalendarPage = () => {
  const { t, currentLanguage } = useLanguage(); // 'bn' or 'en'
  const [loading, setLoading] = useState(true);
  const [calendarType, setCalendarType] = useState('hijri');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDate, setHijriDate] = useState(null);
  const [gregorianDate, setGregorianDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConverter, setShowConverter] = useState(false);
  const [currentHijri, setCurrentHijri] = useState(null); // This will now get { day, month, monthName, year }
  const [currentHijriError, setCurrentHijriError] = useState(false);
  const [location, setLocation] = useState(null);
  const [loadingPrayer, setLoadingPrayer] = useState(false);
  
  // Converter states
  const [convertFrom, setConvertFrom] = useState('gregorian');
  const [convertTo, setConvertTo] = useState('hijri');
  const [convertInput, setConvertInput] = useState({
    day: '',
    month: '',
    year: ''
  });
  const [convertResult, setConvertResult] = useState(null);

  // Hijri month names - English and Bengali only
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

  // Gregorian month names - English and Bengali only
  const gregorianMonths = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
  };

  // Load current Hijri date on mount
  useEffect(() => {
    fetchCurrentHijri();
    getUserLocation();
  }, []);

  // Load calendar data when date or type changes
  useEffect(() => {
    loadCalendarData();
    loadEvents();
  }, [currentDate, calendarType]);

  // Load prayer times when location changes or date changes
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
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Makkah coordinates
          setLocation({ lat: 21.4225, lng: 39.8262 });
          toast.error(
            currentLanguage === 'bn' 
              ? 'অবস্থান পাওয়া যায়নি, মক্কার সময় দেখানো হচ্ছে' 
              : 'Location not found, showing Makkah times'
          );
        }
      );
    } else {
      // Default to Makkah
      setLocation({ lat: 21.4225, lng: 39.8262 });
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

  // FIXED: This now handles your API response correctly
  const fetchCurrentHijri = async () => {
    try {
      setCurrentHijriError(false);
      const data = await getCurrentHijri();
      // data is now { day: 3, month: 9, monthName: "رمضان", year: 1447 }
      setCurrentHijri(data || null);
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
        const data = await getHijriCalendar(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setHijriDate(data || null);
        if (data) {
          generateHijriCalendar(data);
        } else {
          setCalendarDays([]);
        }
      } else {
        const data = await getGregorianCalendar(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
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
      const year = calendarType === 'hijri' 
        ? (hijriDate?.year || currentDate.getFullYear())
        : currentDate.getFullYear();
      
      const data = await getIslamicEvents(year);
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
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
      
      // FIXED: Check if this day is today using currentHijri
      const isToday = currentHijri && 
                     d === currentHijri.day && 
                     data.month === currentHijri.month &&
                     data.year === currentHijri.year;

      // Find events for this day
      const dayEvents = events.filter(event => 
        event.hijriDay === d && 
        event.hijriMonth === data.month &&
        event.year === data.year
      );

      days.push({
        day: d,
        isToday,
        events: dayEvents,
        gregorian: dayData.gregorian || '',
        isRamadan: data.month === 9,
        isSpecial: dayData.isSpecial || false,
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

      days.push({
        day: d,
        isToday,
        weekday: dayData.weekday || '',
        hijri: dayData.hijri || null
      });
    }

    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    if (calendarType === 'hijri') {
      let newMonth = (currentDate.getMonth() - 1 + 12) % 12;
      let newYear = currentDate.getFullYear();
      if (newMonth === 11) newYear--;
      setCurrentDate(new Date(newYear, newMonth, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const handleNextMonth = () => {
    if (calendarType === 'hijri') {
      let newMonth = (currentDate.getMonth() + 1) % 12;
      let newYear = currentDate.getFullYear();
      if (newMonth === 0) newYear++;
      setCurrentDate(new Date(newYear, newMonth, 1));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day) => {
    if (day?.empty) return;
    
    setSelectedDate({
      ...day,
      month: calendarType === 'hijri' ? hijriDate?.month : currentDate.getMonth() + 1,
      year: calendarType === 'hijri' ? hijriDate?.year : currentDate.getFullYear()
    });
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

  if (loading) {
    return <Loader />;
  }

  // Check if current month is Ramadan - FIXED: using currentHijri
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
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37] flex items-center">
          <i className="fas fa-calendar-alt mr-3"></i>
          {t('calendar.title') || 'Islamic Calendar'}
        </h1>
        <p className="text-white/70">
          {t('calendar.subtitle') || 'Track Islamic dates and events'}
        </p>
        
        {/* Current Hijri Date - FIXED to use the correct structure */}
        {currentHijri && !currentHijriError && (
          <div className="mt-4 inline-block bg-[#d4af37]/10 px-6 py-3 rounded-lg">
            <p className="text-sm text-white/50 mb-1">
              {currentLanguage === 'en' ? 'Today\'s Hijri Date:' : 'আজকের হিজরি তারিখ:'}
            </p>
            <p className="text-xl font-bold text-[#d4af37]">
              {formatNumber(currentHijri.day)} {hijriMonths[currentLanguage]?.[currentHijri.month - 1] || hijriMonths.en[currentHijri.month - 1]} {formatNumber(currentHijri.year)} AH
            </p>
            {/* Optional: Show Gregorian date from API if available */}
            {currentHijri.gregorian && (
              <p className="text-sm text-white/50 mt-1">
                {currentHijri.gregorian}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Ramadan Banner - Show if current month is Ramadan */}
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
            
            {/* Iftar & Sehri Times */}
            {prayerTimes && !loadingPrayer && (
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-black/20 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">
                    {currentLanguage === 'bn' ? 'সেহরি শেষ' : 'Sehri Ends'}
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    {formatTime(prayerTimes.fajr)}
                  </p>
                </div>
                <div className="text-center px-4 py-2 bg-black/20 rounded-lg">
                  <p className="text-xs text-white/50 mb-1">
                    {currentLanguage === 'bn' ? 'ইফতার' : 'Iftar'}
                  </p>
                  <p className="text-lg font-bold text-amber-400">
                    {formatTime(prayerTimes.maghrib)}
                  </p>
                </div>
              </div>
            )}
            {loadingPrayer && (
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 bg-black/20 rounded-lg">
                  <i className="fas fa-spinner fa-spin text-emerald-400"></i>
                </div>
              </div>
            )}
          </div>

          {/* Ramadan Progress Bar */}
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
            className={`px-6 py-2 rounded-full transition ${
              calendarType === 'hijri'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <i className="fas fa-moon mr-2"></i>
            {t('calendar.hijri') || 'Hijri'}
          </button>
          <button
            onClick={() => setCalendarType('gregorian')}
            className={`px-6 py-2 rounded-full transition ${
              calendarType === 'gregorian'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <i className="fas fa-sun mr-2"></i>
            {t('calendar.gregorian') || 'Gregorian'}
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="glass p-6">
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
                {hijriMonths[currentLanguage]?.[hijriDate?.month ? hijriDate.month - 1 : currentDate.getMonth()] || 
                 hijriMonths.en[hijriDate?.month ? hijriDate.month - 1 : currentDate.getMonth()]} {formatNumber(hijriDate?.year || currentDate.getFullYear())} AH
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
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Today Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 rounded-full transition flex items-center gap-2"
          >
            <i className="fas fa-calendar-check"></i>
            {t('calendar.today') || 'Today'}
          </button>
        </div>

        {/* Calendar Display */}
        {calendarType === 'hijri' ? (
          <IslamicCalendar
            year={hijriDate?.year || currentDate.getFullYear()}
            month={hijriDate?.month || currentDate.getMonth() + 1}
            days={calendarDays}
            events={events}
            prayerTimes={prayerTimes}
            onDayClick={handleDateClick}
          />
        ) : (
          <GregorianCalendar
            year={currentDate.getFullYear()}
            month={currentDate.getMonth() + 1}
            days={calendarDays}
            onDayClick={handleDateClick}
          />
        )}
      </div>

      {/* Date Details */}
      {selectedDate && selectedDate.day && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            {t('calendar.dateDetails') || 'Date Details'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-lg">
              <p className="text-sm text-white/50 mb-1">
                {t('calendar.hijri') || 'Hijri'}
              </p>
              <p className="text-2xl font-arabic">
                {formatNumber(selectedDate.day)} {hijriMonths[currentLanguage]?.[selectedDate.month - 1] || hijriMonths.en[selectedDate.month - 1]} {formatNumber(selectedDate.year)} AH
              </p>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg">
              <p className="text-sm text-white/50 mb-1">
                {t('calendar.gregorian') || 'Gregorian'}
              </p>
              <p className="text-2xl">
                {selectedDate.gregorian 
                  ? selectedDate.gregorian
                  : `${formatNumber(selectedDate.day)} ${gregorianMonths[currentLanguage]?.[currentDate.getMonth()] || gregorianMonths.en[currentDate.getMonth()]} ${formatNumber(currentDate.getFullYear())}`
                }
              </p>
            </div>
          </div>

          {/* Iftar/Sehri for selected date (if Ramadan) */}
          {isRamadan && prayerTimes && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 p-4 rounded-lg text-center border border-emerald-500/20">
                <i className="fas fa-moon text-emerald-400 mb-2"></i>
                <p className="text-sm text-white/50 mb-1">
                  {currentLanguage === 'bn' ? 'সেহরি শেষ' : 'Sehri Ends'}
                </p>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatTime(prayerTimes.fajr)}
                </p>
              </div>
              <div className="bg-amber-500/10 p-4 rounded-lg text-center border border-amber-500/20">
                <i className="fas fa-sun text-amber-400 mb-2"></i>
                <p className="text-sm text-white/50 mb-1">
                  {currentLanguage === 'bn' ? 'ইফতার' : 'Iftar'}
                </p>
                <p className="text-2xl font-bold text-amber-400">
                  {formatTime(prayerTimes.maghrib)}
                </p>
              </div>
            </div>
          )}

          {/* Events on this day */}
          {selectedDate.events && selectedDate.events.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg mb-2 text-[#d4af37]">
                {t('calendar.events') || 'Events'}
              </h4>
              <div className="space-y-2">
                {selectedDate.events.map((event, index) => (
                  <div key={index} className="bg-[#d4af37]/10 p-3 rounded-lg">
                    <p className="font-bold">
                      {currentLanguage === 'bn' ? event?.nameBn : event?.name}
                    </p>
                    <p className="text-sm text-white/70">
                      {currentLanguage === 'bn' ? event?.descriptionBn : event?.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Date Converter Toggle */}
      <div className="glass p-6">
        <button
          onClick={() => setShowConverter(!showConverter)}
          className="w-full text-left flex items-center justify-between"
        >
          <h3 className="text-xl text-[#d4af37] flex items-center">
            <i className="fas fa-exchange-alt mr-2"></i>
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
