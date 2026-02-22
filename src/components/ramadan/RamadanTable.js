import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes, getCalculationMethods } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import hijriService from '../../services/hijriService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Simple PDF font handling
const setupPDFFont = (doc, language) => {
  doc.setFont('helvetica');
  if (language === 'bn') {
    doc.setFontSize(14);
  }
};

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location: userLocation, loading: locationLoading, updateLocation } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayInfo, setTodayInfo] = useState(null);
  const [calculationMethods, setCalculationMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(4);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  
  // Countdown state
  const [countdown, setCountdown] = useState({
    nextEvent: '',
    timeRemaining: '',
    hours: 0,
    minutes: 0,
    seconds: 0,
    type: '' // 'sehri' or 'iftar'
  });
  
  const [offsetInfo, setOffsetInfo] = useState({
    offset: 0,
    description: '',
    group: ''
  });
  
  const [ramadanInfo, setRamadanInfo] = useState({
    year: 1447,
    currentDay: null,
    startDate: null,
    endDate: null
  });
  
  // Search state
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  // Method names for display
  const methodNames = {
    0: 'Shia Ithna-Ashari',
    1: 'University of Islamic Sciences, Karachi',
    2: 'Islamic Society of North America (ISNA)',
    3: 'Muslim World League (MWL)',
    4: 'Umm Al-Qura University, Makkah',
    5: 'Egyptian General Authority of Survey',
    7: 'Institute of Geophysics, University of Tehran',
    8: 'Gulf Region',
    9: 'Kuwait',
    10: 'Qatar',
    11: 'Majlis Ugama Islam Singapura, Singapore',
    12: 'Union Organization islamic de France',
    13: 'Diyanet İşleri Başkanlığı, Turkey',
    14: 'Spiritual Administration of Muslims of Russia',
    15: 'Moonsighting Committee Worldwide',
    16: 'Dubai',
    17: 'Jabatan Kemajuan Islam Malaysia (JAKIM)',
    18: 'Tunisia',
    19: 'Algeria',
    20: 'Morocco',
    21: 'Comoros',
    22: 'Oman',
    23: 'Lebanon',
    24: 'Sudan',
    25: 'Somalia',
    26: 'Djibouti',
    27: 'Mauritania',
    28: 'Palestine',
    29: 'Jordan'
  };

  useEffect(() => {
    loadCalculationMethods();
  }, []);

  useEffect(() => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      loadRamadanData(userLocation);
    }
  }, [userLocation, selectedMethod]);

  // Countdown timer effect
  useEffect(() => {
    if (!todayInfo) return;

    const timer = setInterval(() => {
      updateCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, [todayInfo]);

  const updateCountdown = () => {
    if (!todayInfo) return;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Parse today's times
    const [sehriHour, sehriMin] = todayInfo.sehri24.split(':').map(Number);
    const [iftarHour, iftarMin] = todayInfo.iftar24.split(':').map(Number);

    const sehriTime = sehriHour * 60 + sehriMin;
    const iftarTime = iftarHour * 60 + iftarMin;

    let targetTime;
    let eventType;

    if (currentTime < sehriTime) {
      // Next is Sehri
      targetTime = sehriTime;
      eventType = 'sehri';
    } else if (currentTime < iftarTime) {
      // Next is Iftar
      targetTime = iftarTime;
      eventType = 'iftar';
    } else {
      // Next is tomorrow's Sehri
      targetTime = sehriTime + 24 * 60;
      eventType = 'sehri';
    }

    const minutesRemaining = targetTime - currentTime;
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    const seconds = 59 - now.getSeconds(); // Approximate seconds

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    setCountdown({
      nextEvent: eventType === 'sehri' ? 'Sehri' : 'Iftar',
      timeRemaining: timeString,
      hours,
      minutes,
      seconds,
      type: eventType
    });
  };

  const loadCalculationMethods = async () => {
    try {
      const methods = await getCalculationMethods();
      setCalculationMethods(methods);
    } catch (error) {
      console.error('Error loading calculation methods:', error);
    }
  };

  const loadRamadanData = async (location) => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      
      const calendarData = await hijriService.getRamadanCalendar(location);
      
      const offset = hijriService.getCountryOffset(location);
      const description = hijriService.getOffsetDescription(location);
      const group = offset === 0 ? 'Group 1 (Feb 18 Start)' : 'Group 2 (Feb 19 Start)';
      
      setOffsetInfo({ offset, description, group });
      
      setRamadanInfo({
        year: calendarData.year,
        currentDay: calendarData.currentDay,
        startDate: calendarData.startDate,
        endDate: calendarData.endDate
      });
      
      const days = [];
      let todayData = null;
      
      const toastId = toast.loading(`Fetching times using ${methodNames[selectedMethod] || 'selected method'}...`);
      
      for (let i = 0; i < calendarData.days.length; i++) {
        const day = calendarData.days[i];
        
        const progress = Math.round(((i + 1) / calendarData.days.length) * 100);
        setLoadingProgress(progress);
        toast.loading(`Fetching times: ${progress}%`, { id: toastId });
        
        let sehriTime = '--:--';
        let iftarTime = '--:--';
        
        if (location) {
          try {
            const prayerData = await getPrayerTimes(
              location.lat,
              location.lng,
              selectedMethod,
              day.gregorianStr
            );
            
            sehriTime = prayerData?.timings?.Fajr || '--:--';
            iftarTime = prayerData?.timings?.Maghrib || '--:--';
            
          } catch (error) {
            console.error(`Failed to get times for day ${day.day}:`, error);
          }
        }

        const dayData = {
          day: day.day,
          gregorianDate: day.gregorian,
          gregorianStr: day.gregorianStr,
          hijriDate: day.hijri.format,
          weekday: weekdays[day.gregorian.getDay()],
          shortWeekday: weekdays[day.gregorian.getDay()].substring(0, 3),
          sehri24: sehriTime,
          sehri12: convertTo12Hour(sehriTime),
          iftar24: iftarTime,
          iftar12: convertTo12Hour(iftarTime),
          isToday: day.isToday,
          isPast: day.gregorian < new Date(),
          fastingHours: calculateFastingHours(sehriTime, iftarTime),
        };

        if (day.isToday) {
          todayData = dayData;
        }

        days.push(dayData);
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.success(`Loaded times for ${days.length} days`, { id: toastId });
      
      setTodayInfo(todayData);
      setRamadanDays(days);
      
    } catch (error) {
      console.error('Error loading Ramadan data:', error);
      toast.error('Failed to load Ramadan schedule');
    } finally {
      setLoading(false);
      setLoadingProgress(0);
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

  const searchCityByName = async () => {
    if (!searchCity.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchCity)}&limit=10`
      );
      const data = await response.json();
      
      setSearchResults(data.map(item => ({
        name: item.display_name.split(',')[0],
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        country: item.display_name.split(',').pop().trim(),
        city: item.display_name.split(',')[0].trim()
      })));
    } catch (error) {
      console.error('Error searching city:', error);
      toast.error('City search failed');
    }
  };

  const selectCity = (city) => {
    setSelectedLocation(city);
    updateLocation(city);
    setShowCitySearch(false);
    setSearchCity('');
    setSearchResults([]);
    loadRamadanData(city);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      setupPDFFont(doc, language);
      
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      
      const title = language === 'bn' 
        ? `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`
        : `Ramadan ${ramadanInfo.year} - 30 Days Schedule`;
      doc.text(title, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      const locationText = selectedLocation 
        ? `${selectedLocation.city}, ${selectedLocation.country}`
        : 'Location not set';
      doc.text(locationText, 14, 30);
      doc.text(`Method: ${methodNames[selectedMethod] || 'Umm Al-Qura'}`, 14, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);
      
      const tableColumn = language === 'bn' 
        ? ['রোজা', 'তারিখ', 'হিজরি', 'বার', 'সেহরি', 'ইফতার', 'সময়']
        : ['Day', 'Date', 'Hijri', 'Day', 'Sehri', 'Iftar', 'Fasting'];
      
      const tableRows = ramadanDays.map(day => [
        day.day,
        formatDayMonth(day.gregorianDate),
        day.hijriDate,
        language === 'bn' ? banglaWeekdays[day.gregorianDate.getDay()] : day.shortWeekday,
        day.sehri12,
        day.iftar12,
        day.fastingHours
      ]);
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [212, 175, 55], textColor: [26, 63, 84] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Stop eating before Sehri time', 14, finalY);
      doc.text('Break fast at Iftar time', 14, finalY + 5);
      
      doc.save(`Ramadan-${ramadanInfo.year}-${selectedLocation?.city || 'Schedule'}.pdf`);
      toast.success('PDF downloaded successfully');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('PDF generation failed');
    }
  };

  const translations = {
    en: {
      title: `Ramadan ${ramadanInfo.year} - 30 Days Schedule`,
      subtitle: 'Exact Sehri & Iftar Times',
      day: 'Day',
      date: 'Date',
      hijri: 'Hijri',
      gregorian: 'Gregorian',
      weekday: 'Weekday',
      sehri: 'Sehri',
      iftar: 'Iftar',
      fasting: 'Fasting',
      today: 'Today',
      downloadPDF: 'Download PDF',
      location: 'Location',
      notes: 'Times are based on your exact location',
      sehriNote: 'Stop eating exactly at Sehri time',
      iftarNote: 'Break fast exactly at Iftar time',
      day1to10: 'First Ashra (Mercy)',
      day11to20: 'Second Ashra (Forgiveness)',
      day21to30: 'Third Ashra (Salvation)',
      changeCity: 'Change City',
      searchCity: 'Search for your city',
      search: 'Search',
      searchPlaceholder: 'Enter city name...',
      searchResults: 'Search Results',
      close: 'Close',
      loading: 'Loading...',
      fetchingTimes: 'Fetching prayer times...',
      progress: 'Progress',
      calculationMethod: 'Calculation Method',
      changeMethod: 'Change Method',
      nextEvent: 'Next',
      timeRemaining: 'Time Remaining',
      sehri: 'Sehri',
      iftar: 'Iftar',
    },
    bn: {
      title: `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`,
      subtitle: 'নির্ভুল সেহরি ও ইফতার সময়',
      day: 'রোজা',
      date: 'তারিখ',
      hijri: 'হিজরি',
      gregorian: 'ইংরেজি',
      weekday: 'বার',
      sehri: 'সেহরি',
      iftar: 'ইফতার',
      fasting: 'রোজার সময়',
      today: 'আজ',
      downloadPDF: 'পিডিএফ ডাউনলোড',
      location: 'অবস্থান',
      notes: 'সময় আপনার সঠিক অবস্থান অনুযায়ী',
      sehriNote: 'সেহরির সময়ে খাওয়া বন্ধ করুন',
      iftarNote: 'ইফতারের সময়ে ইফতার করুন',
      day1to10: 'প্রথম আশরা (রহমত)',
      day11to20: 'দ্বিতীয় আশরা (মাগফিরাত)',
      day21to30: 'তৃতীয় আশরা (নাজাত)',
      changeCity: 'শহর পরিবর্তন',
      searchCity: 'আপনার শহর খুঁজুন',
      search: 'অনুসন্ধান',
      searchPlaceholder: 'শহরের নাম লিখুন...',
      searchResults: 'অনুসন্ধানের ফলাফল',
      close: 'বন্ধ',
      loading: 'লোড হচ্ছে...',
      fetchingTimes: 'নামাজের সময় আনা হচ্ছে...',
      progress: 'অগ্রগতি',
      calculationMethod: 'গণনা পদ্ধতি',
      changeMethod: 'পদ্ধতি পরিবর্তন',
      nextEvent: 'পরবর্তী',
      timeRemaining: 'অবশিষ্ট সময়',
      sehri: 'সেহরি',
      iftar: 'ইফতার',
    }
  };

  const txt = translations[language] || translations.en;

  if (loading || locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-moon text-4xl text-[#d4af37] animate-pulse mb-4"></i>
          <p className="text-white/70">{txt.loading}</p>
          {loadingProgress > 0 && (
            <>
              <div className="w-64 h-2 bg-white/10 rounded-full mt-4 mx-auto">
                <div 
                  className="h-full bg-[#d4af37] rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-white/50 mt-2">{txt.fetchingTimes} {loadingProgress}%</p>
            </>
          )}
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
      {/* Header with Countdown */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37] mb-2">
              🌙 {txt.title}
            </h1>
            <p className="text-white/80">{txt.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Method Selector Button */}
            <button
              onClick={() => setShowMethodSelector(!showMethodSelector)}
              className="glass px-4 py-2 text-[#d4af37] hover:bg-white/10 transition flex items-center gap-2"
              title={txt.changeMethod}
            >
              <i className="fas fa-calculator"></i>
              <span className="hidden md:inline">{txt.calculationMethod}</span>
            </button>
            
            {/* Location Button */}
            {selectedLocation ? (
              <div className="glass px-4 py-2 flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-[#d4af37]"></i>
                <div>
                  <span>{selectedLocation.city}</span>
                  <div className="text-xs mt-1">
                    <span className="text-[#d4af37]">{offsetInfo.group}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCitySearch(true)}
                  className="text-xs bg-[#d4af37]/20 px-2 py-1 rounded hover:bg-[#d4af37]/30 transition"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCitySearch(true)}
                className="glass px-4 py-2 text-[#d4af37] hover:bg-white/10 transition"
              >
                <i className="fas fa-search mr-2"></i>
                {txt.searchCity}
              </button>
            )}
          </div>
        </div>

        {/* Countdown Timer Section */}
        {todayInfo && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Countdown Card */}
            <div className="glass p-4 bg-gradient-to-r from-[#d4af37]/10 to-transparent border border-[#d4af37]/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/50">{txt.nextEvent}:</span>
                <span className="text-lg font-bold text-[#d4af37]">{countdown.nextEvent}</span>
              </div>
              <div className="text-center">
                <div className="text-4xl font-mono font-bold text-[#d4af37]">
                  {countdown.hours.toString().padStart(2, '0')}:
                  {countdown.minutes.toString().padStart(2, '0')}:
                  {countdown.seconds.toString().padStart(2, '0')}
                </div>
                <p className="text-xs text-white/30 mt-1">{txt.timeRemaining}</p>
              </div>
            </div>

            {/* Today's Times Card */}
            <div className="glass p-4 bg-gradient-to-l from-[#d4af37]/10 to-transparent border border-[#d4af37]/30">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-white/50">{txt.sehri}</p>
                  <p className="text-xl font-bold text-emerald-400">{todayInfo.sehri12}</p>
                  <p className="text-xs text-white/30">{todayInfo.sehri24}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-white/50">{txt.iftar}</p>
                  <p className="text-xl font-bold text-orange-400">{todayInfo.iftar12}</p>
                  <p className="text-xs text-white/30">{todayInfo.iftar24}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Method Selector Dropdown */}
        {showMethodSelector && (
          <div className="mt-4 glass p-4">
            <h3 className="text-lg font-bold text-[#d4af37] mb-3">{txt.calculationMethod}</h3>
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(parseInt(e.target.value));
                setShowMethodSelector(false);
              }}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
            >
              {Object.entries(methodNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Today's Highlight */}
        {todayInfo && (
          <div className="mt-6 glass p-6 bg-[#d4af37]/20 border-2 border-[#d4af37]">
            <h3 className="text-xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <i className="fas fa-star"></i>
              {txt.todaysSchedule || 'Today\'s Schedule'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50">{txt.sehriTime || 'Sehri'}</p>
                <p className="text-3xl font-bold text-emerald-400">{todayInfo.sehri12}</p>
                <p className="text-xs text-white/30 mt-1">({todayInfo.sehri24})</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50">{txt.iftarTime || 'Iftar'}</p>
                <p className="text-3xl font-bold text-orange-400">{todayInfo.iftar12}</p>
                <p className="text-xs text-white/30 mt-1">({todayInfo.iftar24})</p>
              </div>
            </div>
          </div>
        )}

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

        {/* PDF Export Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={exportToPDF}
            className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold flex items-center gap-2"
            disabled={ramadanDays.length === 0}
          >
            <i className="fas fa-file-pdf"></i>
            {txt.downloadPDF}
          </button>
        </div>
      </div>

      {/* City Search Modal */}
      {showCitySearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass max-w-md w-full p-6 rounded-lg max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{txt.searchCity}</h3>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCityByName()}
                placeholder={txt.searchPlaceholder}
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
                autoFocus
              />
              <button
                onClick={searchCityByName}
                className="px-6 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition"
              >
                {txt.search}
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm text-white/50 mb-2">{txt.searchResults}</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((city, index) => {
                    const offset = hijriService.getCountryOffset(city);
                    const group = offset === 0 ? 'Group 1' : 'Group 2';
                    return (
                      <button
                        key={index}
                        onClick={() => selectCity(city)}
                        className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition group"
                      >
                        <div className="font-bold">{city.name}</div>
                        <div className="text-sm text-white/50 flex justify-between">
                          <span>{city.country}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            offset === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {group}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <button
              onClick={() => setShowCitySearch(false)}
              className="mt-4 text-sm text-white/50 hover:text-white w-full text-center"
            >
              {txt.close}
            </button>
          </div>
        </div>
      )}

      {/* Full Time Table */}
      <div className="glass p-6 overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-2 text-left text-[#d4af37]">#</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.gregorian}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.hijri}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.weekday}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.sehri}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.iftar}</th>
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
                title={day.isToday ? txt.today : ''}
              >
                <td className="py-3 px-2 font-bold text-[#d4af37]">{day.day}</td>
                <td className="py-3 px-2">{formatDayMonth(day.gregorianDate)}</td>
                <td className="py-3 px-2">{day.hijriDate}</td>
                <td className="py-3 px-2">
                  {language === 'bn' ? banglaWeekdays[day.gregorianDate.getDay()] : day.shortWeekday}
                </td>
                <td className="py-3 px-2">
                  <span className="font-mono text-emerald-400">{day.sehri12}</span>
                  <span className="text-xs text-white/30 ml-1">({day.sehri24})</span>
                </td>
                <td className="py-3 px-2">
                  <span className="font-mono text-orange-400">{day.iftar12}</span>
                  <span className="text-xs text-white/30 ml-1">({day.iftar24})</span>
                </td>
                <td className="py-3 px-2 text-[#d4af37]">{day.fastingHours}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

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
        <p className="flex items-center gap-2 mt-2 text-xs">
          <i className="fas fa-calculator text-[#d4af37]"></i>
          {txt.calculationMethod}: {methodNames[selectedMethod]}
        </p>
        {selectedLocation && offsetInfo && (
          <p className="flex items-center gap-2 mt-1 text-xs">
            <i className="fas fa-globe text-[#d4af37]"></i>
            {offsetInfo.description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default RamadanTable;
