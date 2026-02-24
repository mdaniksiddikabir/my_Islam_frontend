import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import hijriService from '../../services/hijriService';
import citySearchService from '../../services/citySearchService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getBangladeshOffset } from '../../services/bangladeshOffsets';

// Import Bangla font
import { fontNikoshBold } from '../../Fonts/Nikosh-bold.js';

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location: userLocation, loading: locationLoading, updateLocation } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayInfo, setTodayInfo] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(1);
  const [useOffsets, setUseOffsets] = useState(true);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [offsetInfo, setOffsetInfo] = useState({ offset: 0, description: '', group: '' });
  const [ramadanInfo, setRamadanInfo] = useState({ year: 1447, currentDay: null });
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  const methodNames = {
    1: 'University of Islamic Sciences, Karachi',
    4: 'Umm Al-Qura University, Makkah',
    2: 'Islamic Society of North America (ISNA)',
    3: 'Muslim World League (MWL)',
    5: 'Egyptian General Authority of Survey'
  };

  useEffect(() => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      loadRamadanData(userLocation);
    }
  }, [userLocation, selectedMethod, useOffsets]);

  const loadRamadanData = async (location) => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      
      const toastId = toast.loading(language === 'bn' ? '📅 রমজান ক্যালেন্ডার তৈরি হচ্ছে...' : '📅 Generating Ramadan calendar...');
      
      // Get calendar data
      const calendarData = await hijriService.getRamadanCalendar(location, useOffsets);
      
      const offset = hijriService.getCountryOffset(location);
      const description = hijriService.getOffsetDescription(location, useOffsets);
      const group = offset === 0 ? 'Group 1 (Feb 18 Start)' : 'Group 2 (Feb 19 Start)';
      
      setOffsetInfo({ offset, description, group });
      setRamadanInfo({ 
        year: calendarData.year, 
        currentDay: calendarData.currentDay 
      });
      
      // Sequential API calls - one by one
      const days = [];
      let todayData = null;
      
      for (let i = 0; i < calendarData.days.length; i++) {
        const day = calendarData.days[i];
        
        setLoadingProgress(Math.round((i + 1) / 30 * 100));
        toast.loading(language === 'bn' 
          ? `⏳ দিন ${i + 1}/৩০ লোড হচ্ছে...` 
          : `⏳ Loading day ${i + 1}/30...`, 
          { id: toastId }
        );
        
        try {
          const prayerData = await getPrayerTimes(
            location.lat,
            location.lng,
            selectedMethod,
            day.gregorianStr
          );
          
          let sehriTime = prayerData?.timings?.Fajr || '05:30';
          let iftarTime = prayerData?.timings?.Maghrib || '18:15';
          
          if (location.country === 'Bangladesh' && useOffsets) {
            const offset = getBangladeshOffset(location.city);
            const [sehriHour, sehriMin] = sehriTime.split(':').map(Number);
            const [iftarHour, iftarMin] = iftarTime.split(':').map(Number);
            
            const sehriTotal = sehriHour * 60 + sehriMin - offset.sehri;
            const iftarTotal = iftarHour * 60 + iftarMin + offset.iftar;
            
            sehriTime = `${Math.floor(sehriTotal / 60)}:${(sehriTotal % 60).toString().padStart(2, '0')}`;
            iftarTime = `${Math.floor(iftarTotal / 60)}:${(iftarTotal % 60).toString().padStart(2, '0')}`;
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
            fastingHours: calculateFastingHours(sehriTime, iftarTime),
            isToday: day.isToday
          };
          
          if (day.isToday) {
            todayData = dayData;
          }
          
          days.push(dayData);
        } catch (error) {
          console.error(`Day ${day.day} failed:`, error);
          toast.error(language === 'bn' 
            ? `❌ দিন ${day.day} লোড করতে সমস্যা হয়েছে` 
            : `❌ Failed to load day ${day.day}`
          );
        }
      }
      
      setRamadanDays(days);
      setTodayInfo(todayData);
      
      toast.success(language === 'bn' ? '✅ ক্যালেন্ডার লোড সম্পন্ন' : '✅ Calendar loaded successfully', { id: toastId });
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(language === 'bn' ? '❌ ডেটা লোড করতে সমস্যা হয়েছে' : '❌ Failed to load data');
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  };

  const calculateFastingHours = (sehri, iftar) => {
    const [sehriHour, sehriMin] = sehri.split(':').map(Number);
    const [iftarHour, iftarMin] = iftar.split(':').map(Number);
    let total = (iftarHour * 60 + iftarMin) - (sehriHour * 60 + sehriMin);
    if (total < 0) total += 24 * 60;
    return `${Math.floor(total / 60)}h ${total % 60}m`;
  };

  const convertTo12Hour = (time) => {
    if (!time || time === '--:--') return '--:--';
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const formatDayMonth = (date) => {
    return format(date, 'dd MMM', { locale: language === 'bn' ? bn : enUS });
  };

  const searchCityByName = async () => {
    if (!searchCity.trim()) {
      toast.error(language === 'bn' ? 'শহরের নাম লিখুন' : 'Please enter a city name');
      return;
    }
    setSearching(true);
    try {
      const results = await citySearchService.searchCities(searchCity);
      setSearchResults(results);
      if (results.length === 0) {
        toast.error(language === 'bn' ? 'কোনো শহর পাওয়া যায়নি' : 'No cities found');
      }
    } catch (error) {
      toast.error(language === 'bn' ? 'অনুসন্ধান ব্যর্থ হয়েছে' : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectCity = (city) => {
    setShowCitySearch(false);
    setSearchCity('');
    setSearchResults([]);
    updateLocation({
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      country: city.country
    });
    toast.success(language === 'bn' ? `📍 ${city.name} নির্বাচিত হয়েছে` : `📍 ${city.name} selected`);
  };

  const exportToPDF = () => {
    try {
      const loadingToast = toast.loading(language === 'bn' ? '📄 পিডিএফ তৈরি হচ্ছে...' : '📄 Generating PDF...');
      
      const doc = new jsPDF();
      
      // Register Bangla font
      try {
        doc.addFileToVFS('Nikosh-bold.ttf', fontNikoshBold);
        doc.addFont('Nikosh-bold.ttf', 'Nikosh', 'bold');
      } catch (e) {
        console.warn('Font registration failed');
      }
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      
      let yPos = 20;
      
      if (language === 'bn') {
        doc.setFont('Nikosh', 'bold');
        doc.text('রমজান', 20, yPos);
        yPos += 8;
        doc.text(`${ramadanInfo.year} - ৩০ দিনের সময়সূচি`, 20, yPos);
      } else {
        doc.setFont('helvetica');
        doc.text(`Ramadan ${ramadanInfo.year} - 30 Days Schedule`, 20, yPos);
      }
      
      yPos += 10;
      
      // Location
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      if (selectedLocation) {
        if (language === 'bn') {
          doc.setFont('Nikosh', 'bold');
          doc.text('অবস্থান:', 20, yPos);
          doc.setFont('helvetica');
          doc.text(`${selectedLocation.city}, ${selectedLocation.country}`, 45, yPos);
        } else {
          doc.setFont('helvetica');
          doc.text(`Location: ${selectedLocation.city}, ${selectedLocation.country}`, 20, yPos);
        }
      } else {
        doc.setFont('helvetica');
        doc.text(language === 'bn' ? 'অবস্থান নির্ধারিত নয়' : 'Location not set', 20, yPos);
      }
      
      yPos += 6;
      
      // Method
      doc.setFont('helvetica');
      doc.text(`Method: ${methodNames[selectedMethod] || 'Karachi'}`, 20, yPos);
      yPos += 6;
      
      // Date
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 6;
      
      // Table headers
      const headers = language === 'bn' 
        ? ['রোজা', 'তারিখ', 'হিজরি', 'বার', 'সেহরি', 'ইফতার', 'সময়']
        : ['Day', 'Date', 'Hijri', 'Day', 'Sehri', 'Iftar', 'Fasting'];
      
      const rows = ramadanDays.map(day => {
        if (language === 'bn') {
          return [
            day.day.toString(),
            format(day.gregorianDate, 'dd MMM', { locale: bn }),
            day.hijriDate,
            banglaWeekdays[day.gregorianDate.getDay()],
            day.sehri12,
            day.iftar12,
            day.fastingHours
          ];
        } else {
          return [
            day.day.toString(),
            format(day.gregorianDate, 'dd MMM', { locale: enUS }),
            day.hijriDate,
            day.shortWeekday,
            day.sehri12,
            day.iftar12,
            day.fastingHours
          ];
        }
      });
      
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: yPos,
        styles: { 
          fontSize: 8,
          font: language === 'bn' ? 'Nikosh' : 'helvetica',
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [212, 175, 55], 
          textColor: [26, 63, 84],
          fontStyle: 'bold'
        }
      });
      
      const fileName = language === 'bn'
        ? `রমজান-${ramadanInfo.year}-${selectedLocation?.city || 'সময়সূচি'}.pdf`
        : `Ramadan-${ramadanInfo.year}-${selectedLocation?.city || 'Schedule'}.pdf`;
      
      doc.save(fileName);
      
      toast.dismiss(loadingToast);
      toast.success(language === 'bn' ? '✅ পিডিএফ ডাউনলোড হয়েছে' : '✅ PDF downloaded successfully');
      
    } catch (error) {
      console.error('PDF error:', error);
      toast.error(language === 'bn' ? '❌ পিডিএফ তৈরি করতে সমস্যা হয়েছে' : '❌ PDF generation failed');
    }
  };

  const translations = {
    en: {
      title: `Ramadan ${ramadanInfo.year} - 30 Days Schedule`,
      subtitle: 'Sehri & Iftar Times',
      day: 'Day',
      date: 'Date',
      hijri: 'Hijri',
      gregorian: 'Gregorian',
      weekday: 'Day',
      sehri: 'Sehri',
      iftar: 'Iftar',
      fasting: 'Fasting',
      today: 'Today',
      downloadPDF: 'Download PDF',
      location: 'Location',
      notes: 'Times based on your location',
      sehriNote: 'Stop eating at Sehri time',
      iftarNote: 'Break fast at Iftar time',
      day1to10: 'First Ashra (Mercy)',
      day11to20: 'Second Ashra (Forgiveness)',
      day21to30: 'Third Ashra (Salvation)',
      changeCity: 'Change City',
      searchCity: 'Search City',
      search: 'Search',
      close: 'Close',
      loading: 'Loading...',
      calculationMethod: 'Method',
      offsets: 'Local Offsets',
      offsetsEnabled: 'On',
      offsetsDisabled: 'Off',
      popularCities: 'Popular Cities'
    },
    bn: {
      title: `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`,
      subtitle: 'সেহরি ও ইফতার সময়',
      day: 'রোজা',
      date: 'তারিখ',
      hijri: 'হিজরি',
      gregorian: 'ইংরেজি',
      weekday: 'বার',
      sehri: 'সেহরি',
      iftar: 'ইফতার',
      fasting: 'সময়',
      today: 'আজ',
      downloadPDF: 'পিডিএফ ডাউনলোড',
      location: 'অবস্থান',
      notes: 'আপনার অবস্থান অনুযায়ী সময়',
      sehriNote: 'সেহরির সময় খাওয়া শেষ করুন',
      iftarNote: 'ইফতারের সময় ইফতার করুন',
      day1to10: 'প্রথম আশরা (রহমত)',
      day11to20: 'দ্বিতীয় আশরা (মাগফিরাত)',
      day21to30: 'তৃতীয় আশরা (নাজাত)',
      changeCity: 'শহর পরিবর্তন',
      searchCity: 'শহর খুঁজুন',
      search: 'অনুসন্ধান',
      close: 'বন্ধ',
      loading: 'লোড হচ্ছে...',
      calculationMethod: 'পদ্ধতি',
      offsets: 'স্থানীয় সমন্বয়',
      offsetsEnabled: 'চালু',
      offsetsDisabled: 'বন্ধ',
      popularCities: 'জনপ্রিয় শহর'
    }
  };

  const txt = translations[language] || translations.en;

  if (loading || locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-moon text-5xl text-[#d4af37] animate-pulse mb-4"></i>
          <p className="text-xl text-white/70 mb-2">{txt.loading}</p>
          <p className="text-sm text-white/50">
            {language === 'bn' ? 'দিন ' : 'Day '} 
            {loadingProgress}%
          </p>
          <div className="w-64 h-2 bg-white/10 rounded-full mt-4 mx-auto">
            <div 
              className="h-full bg-[#d4af37] rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6 p-4 max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-amber-400 mb-2">🌙 {txt.title}</h1>
            <p className="text-sm md:text-base text-white/70">{txt.subtitle}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Method selector */}
            <button 
              onClick={() => setShowMethodSelector(!showMethodSelector)} 
              className="glass px-3 py-2 text-amber-400 hover:bg-white/10 transition rounded-lg text-sm"
            >
              <i className="fas fa-calculator mr-2"></i>
              <span className="hidden md:inline">{txt.calculationMethod}</span>
            </button>
            
            {/* Offset toggle */}
            <button 
              onClick={() => setUseOffsets(!useOffsets)}
              className={`px-3 py-2 rounded-lg transition text-sm ${
                useOffsets ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-white/70'
              }`}
            >
              <i className="fas fa-map-pin mr-2"></i>
              {useOffsets ? txt.offsetsEnabled : txt.offsetsDisabled}
            </button>
            
            {/* Location */}
            {selectedLocation ? (
              <div className="glass px-3 py-2 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-amber-400"></i>
                <span className="text-sm font-medium max-w-[100px] truncate">{selectedLocation.city}</span>
                <button 
                  onClick={() => setShowCitySearch(true)} 
                  className="text-xs bg-amber-500/20 px-2 py-1 rounded hover:bg-amber-500/30 transition"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowCitySearch(true)} 
                className="glass px-3 py-2 text-amber-400 hover:bg-white/10 transition rounded-lg"
              >
                <i className="fas fa-search mr-2"></i>
                <span className="hidden md:inline">{txt.searchCity}</span>
              </button>
            )}
          </div>
        </div>

        {/* Method selector dropdown */}
        {showMethodSelector && (
          <div className="mt-4 glass p-4 rounded-xl">
            <h3 className="font-bold text-amber-400 mb-3">{txt.calculationMethod}</h3>
            <select 
              value={selectedMethod} 
              onChange={(e) => {
                setSelectedMethod(parseInt(e.target.value));
                setShowMethodSelector(false);
              }} 
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-400 text-white"
            >
              {Object.entries(methodNames).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Today's info */}
        {todayInfo && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="glass p-4 bg-emerald-900/30 rounded-xl text-center">
              <p className="text-sm text-white/50 mb-1">{txt.sehri}</p>
              <p className="text-2xl font-bold text-emerald-400">{todayInfo.sehri12}</p>
            </div>
            <div className="glass p-4 bg-orange-900/30 rounded-xl text-center">
              <p className="text-sm text-white/50 mb-1">{txt.iftar}</p>
              <p className="text-2xl font-bold text-orange-400">{todayInfo.iftar12}</p>
            </div>
          </div>
        )}

        {/* PDF Export */}
        <div className="flex justify-end mt-4">
          <button 
            onClick={exportToPDF} 
            className="px-4 py-2 bg-amber-500 text-[#1a3f54] rounded-lg hover:bg-amber-400 transition font-bold flex items-center gap-2"
          >
            <i className="fas fa-file-pdf"></i>
            <span>{txt.downloadPDF}</span>
          </button>
        </div>
      </div>

      {/* City Search Modal */}
      {showCitySearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass max-w-md w-full p-6 rounded-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-amber-400">{txt.searchCity}</h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={searchCity} 
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCityByName()}
                placeholder={txt.searchCity} 
                className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-400 text-white"
                disabled={searching} 
                autoFocus 
              />
              <button 
                onClick={searchCityByName} 
                disabled={searching}
                className="px-6 py-2 bg-amber-500 text-[#1a3f54] rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
              >
                {searching ? <i className="fas fa-spinner fa-spin"></i> : txt.search}
              </button>
            </div>
            
            {searchResults.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {searchResults.map((city, i) => (
                  <button 
                    key={i} 
                    onClick={() => selectCity(city)}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition"
                  >
                    <div className="font-bold">{city.name}</div>
                    <div className="text-sm text-white/50">{city.country}</div>
                  </button>
                ))}
              </div>
            ) : searchCity && !searching && (
              <div className="p-4 bg-yellow-900/30 rounded-lg text-center text-yellow-500">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {language === 'bn' ? 'কোনো শহর পাওয়া যায়নি' : 'No cities found'}
              </div>
            )}
            
            <button 
              onClick={() => setShowCitySearch(false)} 
              className="mt-4 text-sm text-white/50 hover:text-white w-full"
            >
              {txt.close}
            </button>
          </div>
        </div>
      )}

      {/* Ramadan Days List */}
      <div className="space-y-3">
        {ramadanDays.map((day, index) => (
          <motion.div
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`glass p-4 rounded-xl ${
              day.isToday ? 'border-2 border-amber-500 bg-amber-900/20' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  day.isToday ? 'bg-amber-500 text-[#1a3f54]' : 'bg-white/10 text-amber-400'
                }`}>
                  {day.day}
                </div>
                <div>
                  <div className="text-sm text-white/50">
                    {format(day.gregorianDate, 'dd MMM', { locale: language === 'bn' ? bn : enUS })}
                  </div>
                  <div className="text-xs text-white/30">{day.hijriDate}</div>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-right">
                  <div className="text-xs text-white/50">{txt.sehri}</div>
                  <div className="font-mono text-emerald-400 font-bold">{day.sehri12}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50">{txt.iftar}</div>
                  <div className="font-mono text-orange-400 font-bold">{day.iftar12}</div>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-white/50">{txt.fasting}</div>
                  <div className="text-amber-400 font-bold">{day.fastingHours}</div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ashra Sections */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-900/30 p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">1-10</p>
          <p className="text-sm font-bold text-emerald-400">{txt.day1to10}</p>
        </div>
        <div className="bg-amber-900/30 p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">11-20</p>
          <p className="text-sm font-bold text-amber-400">{txt.day11to20}</p>
        </div>
        <div className="bg-red-900/30 p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">21-30</p>
          <p className="text-sm font-bold text-red-400">{txt.day21to30}</p>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="glass p-4 text-xs text-white/50 rounded-xl">
        <p className="flex items-center gap-2"><i className="fas fa-info-circle text-amber-400"></i>{txt.notes}</p>
        <p className="flex items-center gap-2 mt-1"><i className="fas fa-clock text-emerald-400"></i>{txt.sehriNote}</p>
        <p className="flex items-center gap-2 mt-1"><i className="fas fa-clock text-orange-400"></i>{txt.iftarNote}</p>
        {selectedLocation && (
          <p className="flex items-center gap-2 mt-2 text-amber-400/70">
            <i className="fas fa-globe"></i>
            {selectedLocation.city}, {selectedLocation.country}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default RamadanTable;
