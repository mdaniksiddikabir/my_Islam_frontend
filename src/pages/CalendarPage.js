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
import IslamicCalendar from '../components/calendar/IslamicCalendar';
import GregorianCalendar from '../components/calendar/GregorianCalendar';
import DateConverter from '../components/calendar/DateConverter';
import ErrorBoundary from '../components/common/ErrorBoundary';

const CalendarPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [calendarType, setCalendarType] = useState('hijri');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDate, setHijriDate] = useState(null);
  const [gregorianDate, setGregorianDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConverter, setShowConverter] = useState(false);
  const [currentHijri, setCurrentHijri] = useState(null);
  const [currentHijriError, setCurrentHijriError] = useState(false);
  
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
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    bn: [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ]
  };

  // Load current Hijri date on mount
  useEffect(() => {
    fetchCurrentHijri();
  }, []);

  // Load calendar data when date or type changes
  useEffect(() => {
    loadCalendarData();
    loadEvents();
  }, [currentDate, calendarType]);

  const fetchCurrentHijri = async () => {
    try {
      setCurrentHijriError(false);
      const data = await getCurrentHijri();
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
      
      const isToday = d === data.currentDay && 
                     data.month === (new Date().getMonth() + 1);

      days.push({
        day: d,
        isToday,
        events: dayData.events || [],
        gregorian: dayData.gregorian || '',
        isRamadan: data.month === 9,
        isSpecial: dayData.isSpecial || false
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
      
      const isToday = d === data.currentDay && 
                     data.month === (new Date().getMonth() + 1) &&
                     data.year === new Date().getFullYear();

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

  if (loading) return <Loader />;

  return (
    <ErrorBoundary t={t}>
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
          
          {/* Current Hijri Date - Fixed endpoint */}
          {currentHijri && !currentHijriError && currentHijri.day && (
            <div className="mt-4 inline-block bg-[#d4af37]/10 px-6 py-3 rounded-lg">
              <p className="text-sm text-white/50 mb-1">
                {currentLanguage === 'en' ? 'Today\'s Hijri Date:' : 
                 currentLanguage === 'bn' ? 'আজকের হিজরি তারিখ:' : 
                 'Today\'s Hijri Date:'}
              </p>
              <p className="text-xl font-bold text-[#d4af37]">
                {formatNumber(currentHijri.day)} {hijriMonths[currentLanguage]?.[currentHijri.month - 1] || ''} {formatNumber(currentHijri.year)} AH
              </p>
              <p className="text-sm text-white/50 mt-1">
                {currentHijri.gregorian || ''}
              </p>
            </div>
          )}
        </div>

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
                  {hijriMonths[currentLanguage]?.[(currentDate.getMonth()) % 12] || ''} {formatNumber(currentDate.getFullYear())} AH
                </>
              ) : (
                <>
                  {gregorianMonths[currentLanguage]?.[currentDate.getMonth()] || ''} {formatNumber(currentDate.getFullYear())}
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
              days={calendarDays || []}
              events={events || []}
              onDayClick={handleDateClick}
            />
          ) : (
            <GregorianCalendar
              year={currentDate.getFullYear()}
              month={currentDate.getMonth() + 1}
              days={calendarDays || []}
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
                  {formatNumber(selectedDate.day)} {hijriMonths[currentLanguage]?.[selectedDate.month - 1] || ''} {formatNumber(selectedDate.year)} AH
                </p>
              </div>
              
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50 mb-1">
                  {t('calendar.gregorian') || 'Gregorian'}
                </p>
                <p className="text-2xl">
                  {selectedDate.gregorian 
                    ? selectedDate.gregorian
                    : `${formatNumber(selectedDate.day)} ${gregorianMonths[currentLanguage]?.[currentDate.getMonth()] || ''} ${formatNumber(currentDate.getFullYear())}`
                  }
                </p>
              </div>
            </div>

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

        {/* Islamic Events */}
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
            <i className="fas fa-star mr-2"></i>
            {t('calendar.islamicEvents') || 'Islamic Events'}
          </h3>

          {!events || events.length === 0 ? (
            <p className="text-white/50 text-center py-4">
              {t('calendar.noEvents') || 'No events found'}
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={index}
                  className="bg-white/5 p-4 rounded-lg hover:bg-[#d4af37]/10 transition cursor-pointer"
                  onClick={() => {
                    if (event?.hijriMonth) {
                      const newDate = new Date(currentDate);
                      newDate.setMonth(event.hijriMonth - 1);
                      setCurrentDate(newDate);
                      setCalendarType('hijri');
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-[#d4af37]">
                        {currentLanguage === 'bn' ? event?.nameBn : event?.name}
                      </h4>
                      <p className="text-sm text-white/70 mt-1">
                        {currentLanguage === 'bn' ? event?.descriptionBn : event?.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-arabic">
                        {event?.hijriDay} {hijriMonths[currentLanguage]?.[event?.hijriMonth - 1] || ''}
                      </p>
                      <p className="text-sm text-white/50">
                        {event?.gregorianDate || ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ramadan Info */}
        {hijriDate?.month === 9 && hijriDate?.currentDay && (
          <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
            <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
              <i className="fas fa-moon mr-2"></i>
              {t('ramadan.mubarak') || 'Ramadan Mubarak'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-black/20 p-4 rounded-lg text-center">
                <p className="text-sm text-white/70 mb-1">
                  {t('ramadan.day') || 'Ramadan Day'}
                </p>
                <p className="text-3xl font-bold text-[#d4af37]">
                  {formatNumber(hijriDate.currentDay)} / {formatNumber(30)}
                </p>
              </div>

              <div className="bg-black/20 p-4 rounded-lg text-center">
                <p className="text-sm text-white/70 mb-1">
                  {t('ramadan.juz') || 'Juz'}
                </p>
                <p className="text-3xl font-bold text-[#d4af37]">
                  {formatNumber(Math.ceil((hijriDate.currentDay / 30) * 30))}
                </p>
              </div>

              <div className="bg-black/20 p-4 rounded-lg text-center">
                <p className="text-sm text-white/70 mb-1">
                  {t('ramadan.laylatAlQadr') || 'Laylat al-Qadr'}
                </p>
                <p className="text-3xl font-bold text-[#d4af37]">
                  {hijriDate.currentDay >= 21 && hijriDate.currentDay <= 29 ? '✨' : ''}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>{t('ramadan.progress') || 'Ramadan Progress'}</span>
                <span className="text-[#d4af37]">
                  {Math.round((hijriDate.currentDay / 30) * 100)}%
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${(hijriDate.currentDay / 30) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </ErrorBoundary>
  );
};

export default CalendarPage;
