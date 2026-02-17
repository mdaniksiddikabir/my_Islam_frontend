import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { 
  getHijriCalendar, 
  getGregorianCalendar, 
  getIslamicEvents,
  convertDate 
} from '../services/calendarService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const CalendarPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [calendarType, setCalendarType] = useState('hijri'); // 'hijri' or 'gregorian'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hijriDate, setHijriDate] = useState(null);
  const [gregorianDate, setGregorianDate] = useState(null);
  const [calendarDays, setCalendarDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConverter, setShowConverter] = useState(false);
  const [convertFrom, setConvertFrom] = useState('hijri');
  const [convertTo, setConvertTo] = useState('gregorian');
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

  // Week day names
  const weekDays = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']
  };

  useEffect(() => {
    loadCalendarData();
    loadEvents();
  }, [currentDate, calendarType]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      
      if (calendarType === 'hijri') {
        const data = await getHijriCalendar(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setHijriDate(data);
        generateHijriCalendar(data);
      } else {
        const data = await getGregorianCalendar(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1
        );
        setGregorianDate(data);
        generateGregorianCalendar(data);
      }
      
    } catch (error) {
      console.error('Error loading calendar:', error);
      toast.error(t('errors.calendar'));
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async () => {
    try {
      const data = await getIslamicEvents(currentDate.getFullYear());
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const generateHijriCalendar = (data) => {
    if (!data) return;

    const days = [];
    const firstDay = data.firstDayOfWeek || 1; // 1 = Monday
    const totalDays = data.daysInMonth || 30;

    // Add empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add days of month
    for (let d = 1; d <= totalDays; d++) {
      const isToday = d === data.currentDay && 
                     data.month === data.currentMonth && 
                     data.year === data.currentYear;
      
      const dayEvents = events.filter(event => 
        event.hijriDay === d && 
        event.hijriMonth === data.month
      );

      days.push({
        day: d,
        isToday,
        events: dayEvents,
        gregorian: data.gregorianDates?.[d],
        isRamadan: data.month === 9, // Ramadan month
        isSpecial: [1, 10, 13, 15, 27].includes(d) // Special days
      });
    }

    setCalendarDays(days);
  };

  const generateGregorianCalendar = (data) => {
    if (!data) return;

    const days = [];
    const firstDay = new Date(data.year, data.month - 1, 1).getDay();
    const totalDays = new Date(data.year, data.month, 0).getDate();

    // Add empty cells for days before month start
    for (let i = 0; i < firstDay; i++) {
      days.push({ empty: true });
    }

    // Add days of month
    for (let d = 1; d <= totalDays; d++) {
      const isToday = d === new Date().getDate() && 
                     data.month === new Date().getMonth() + 1 && 
                     data.year === new Date().getFullYear();

      days.push({
        day: d,
        isToday,
        weekday: new Date(data.year, data.month - 1, d).getDay()
      });
    }

    setCalendarDays(days);
  };

  const handlePrevMonth = () => {
    if (calendarType === 'hijri') {
      // Handle Hijri month navigation
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
    if (day.empty) return;
    
    setSelectedDate({
      ...day,
      month: calendarType === 'hijri' ? hijriDate?.month : currentDate.getMonth() + 1,
      year: calendarType === 'hijri' ? hijriDate?.year : currentDate.getFullYear()
    });
  };

  const handleConvert = async () => {
    try {
      const result = await convertDate(
        convertFrom,
        convertTo,
        convertInput
      );
      setConvertResult(result);
      toast.success(t('calendar.converted'));
    } catch (error) {
      toast.error(t('errors.conversion'));
    }
  };

  const formatNumber = (num) => {
    if (currentLanguage === 'bn') {
      const banglaDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
      return num.toString().split('').map(d => banglaDigits[d] || d).join('');
    }
    return num;
  };

  if (loading) return <Loader />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37]">
          <i className="fas fa-calendar-alt mr-3"></i>
          {t('calendar.title')}
        </h1>
        <p className="text-white/70 font-bangla">{t('calendar.subtitle')}</p>
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
            {t('calendar.hijri')}
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
            {t('calendar.gregorian')}
          </button>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <h2 className="text-2xl font-bold">
            {calendarType === 'hijri' ? (
              <>
                {hijriMonths[currentLanguage][(currentDate.getMonth()) % 12]} {formatNumber(currentDate.getFullYear())} AH
              </>
            ) : (
              <>
                {gregorianMonths[currentLanguage][currentDate.getMonth()]} {formatNumber(currentDate.getFullYear())}
              </>
            )}
          </h2>
          
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Today Button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 rounded-full transition"
          >
            <i className="fas fa-calendar-check mr-2"></i>
            {t('calendar.today')}
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays[currentLanguage].map((day, index) => (
            <div key={index} className="text-center text-[#d4af37] font-bold py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDateClick(day)}
              className={`
                aspect-square p-2 rounded-lg cursor-pointer transition-all
                ${day.empty ? 'opacity-0' : 'hover:bg-[#d4af37]/20'}
                ${day.isToday ? 'border-2 border-[#d4af37] bg-[#d4af37]/10' : ''}
                ${day.isRamadan ? 'bg-emerald-500/10' : ''}
                ${day.isSpecial ? 'bg-purple-500/10' : ''}
                ${day.events?.length > 0 ? 'relative' : ''}
              `}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold">{formatNumber(day.day)}</span>
                
                {/* Event indicators */}
                {day.events?.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {day.events.map((event, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"
                        title={event.name}
                      />
                    ))}
                  </div>
                )}
                
                {/* Special day indicators */}
                {day.isSpecial && !day.events?.length && (
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1" />
                )}
              </div>

              {/* Gregorian date for Hijri calendar */}
              {calendarType === 'hijri' && day.gregorian && (
                <div className="text-[10px] text-white/40 text-center mt-1">
                  {formatNumber(day.gregorian)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Date Details */}
      {selectedDate && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
            <i className="fas fa-info-circle mr-2"></i>
            {t('calendar.dateDetails')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-sm text-white/50 mb-1">{t('calendar.hijri')}</p>
              <p className="text-2xl font-arabic">
                {formatNumber(selectedDate.day)} {hijriMonths[currentLanguage][selectedDate.month - 1]} {formatNumber(selectedDate.year)} AH
              </p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-sm text-white/50 mb-1">{t('calendar.gregorian')}</p>
              <p className="text-2xl">
                {selectedDate.gregorian 
                  ? `${formatNumber(selectedDate.gregorian)} ${gregorianMonths[currentLanguage][currentDate.getMonth()]} ${formatNumber(currentDate.getFullYear())}`
                  : `${formatNumber(selectedDate.day)} ${gregorianMonths[currentLanguage][currentDate.getMonth()]} ${formatNumber(currentDate.getFullYear())}`
                }
              </p>
            </div>
          </div>

          {/* Events on this day */}
          {selectedDate.events?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-lg mb-2 text-[#d4af37]">{t('calendar.events')}</h4>
              <div className="space-y-2">
                {selectedDate.events.map((event, index) => (
                  <div key={index} className="bg-[#d4af37]/10 p-3 rounded-lg">
                    <p className="font-bold">{event.name}</p>
                    <p className="text-sm text-white/70">{event.description}</p>
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
          <h3 className="text-xl text-[#d4af37] flex items-center">
            <i className="fas fa-exchange-alt mr-2"></i>
            {t('calendar.dateConverter')}
          </h3>
          <i className={`fas fa-chevron-${showConverter ? 'up' : 'down'} text-[#d4af37]`}></i>
        </button>

        {showConverter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-4 space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/50 mb-2">{t('calendar.convertFrom')}</label>
                <select
                  value={convertFrom}
                  onChange={(e) => setConvertFrom(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                >
                  <option value="hijri">{t('calendar.hijri')}</option>
                  <option value="gregorian">{t('calendar.gregorian')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-white/50 mb-2">{t('calendar.convertTo')}</label>
                <select
                  value={convertTo}
                  onChange={(e) => setConvertTo(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                >
                  <option value="hijri">{t('calendar.hijri')}</option>
                  <option value="gregorian">{t('calendar.gregorian')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="number"
                  placeholder={t('calendar.day')}
                  value={convertInput.day}
                  onChange={(e) => setConvertInput({...convertInput, day: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder={t('calendar.month')}
                  value={convertInput.month}
                  onChange={(e) => setConvertInput({...convertInput, month: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder={t('calendar.year')}
                  value={convertInput.year}
                  onChange={(e) => setConvertInput({...convertInput, year: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
                />
              </div>
            </div>

            <button
              onClick={handleConvert}
              className="w-full py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold"
            >
              {t('calendar.convert')}
            </button>

            {convertResult && (
              <div className="bg-[#d4af37]/10 p-4 rounded-lg text-center">
                <p className="text-lg mb-1">{t('calendar.result')}:</p>
                <p className="text-2xl font-bold text-[#d4af37]">
                  {convertResult.day} {convertResult.month} {convertResult.year}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Islamic Events */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-star mr-2"></i>
          {t('calendar.islamicEvents')}
        </h3>

        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={index}
              className="bg-white/5 p-4 rounded-lg hover:bg-[#d4af37]/10 transition cursor-pointer"
              onClick={() => {
                setCurrentDate(new Date(event.year, event.month - 1, event.day));
                setCalendarType('hijri');
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-[#d4af37]">{event.name}</h4>
                  <p className="text-sm text-white/70 mt-1">{event.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-arabic">
                    {event.hijriDay} {hijriMonths[currentLanguage][event.hijriMonth - 1]}
                  </p>
                  <p className="text-sm text-white/50">
                    {event.gregorianDate}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ramadan Info (if in Ramadan) */}
      {hijriDate?.month === 9 && (
        <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
            <i className="fas fa-moon mr-2"></i>
            {t('ramadan.mubarak')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-black/20 p-4 rounded-lg text-center">
              <p className="text-sm text-white/70 mb-1">{t('ramadan.day')}</p>
              <p className="text-3xl font-bold text-[#d4af37]">
                {formatNumber(hijriDate.day)} / 30
              </p>
            </div>

            <div className="bg-black/20 p-4 rounded-lg text-center">
              <p className="text-sm text-white/70 mb-1">{t('ramadan.juz')}</p>
              <p className="text-3xl font-bold text-[#d4af37]">
                {formatNumber(Math.ceil(hijriDate.day / 20 * 30))}
              </p>
            </div>

            <div className="bg-black/20 p-4 rounded-lg text-center">
              <p className="text-sm text-white/70 mb-1">{t('ramadan.laylatAlQadr')}</p>
              <p className="text-3xl font-bold text-[#d4af37]">
                {hijriDate.day >= 21 && hijriDate.day <= 29 ? '✨' : ''}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>{t('ramadan.progress')}</span>
              <span className="text-[#d4af37]">{Math.round((hijriDate.day / 30) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(hijriDate.day / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default CalendarPage;