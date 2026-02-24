import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes, getCalculationMethods } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import hijriService from '../../services/hijriService';
import citySearchService from '../../services/citySearchService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getBangladeshOffset } from '../../services/bangladeshOffsets';
import RamadanSkeleton from './RamadanSkeleton';
import LoadingProgress from '../common/LoadingProgress';

// Import Bangla font (auto-registers with jsPDF)
import '../../Fonts/Nikosh-bold.js';

// Beautiful list item component
const RamadanListItem = ({ day, isToday, language, weekdays, banglaWeekdays, txt, index, onDayClick }) => {
  const [expanded, setExpanded] = useState(false);
  
  const dayOfWeek = language === 'bn' 
    ? banglaWeekdays[day.gregorianDate.getDay()]
    : weekdays[day.gregorianDate.getDay()].substring(0, 3);
  
  const handleClick = () => {
    setExpanded(!expanded);
    if (onDayClick) onDayClick(day);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`mb-3 rounded-xl overflow-hidden transition-all duration-300 ${
        isToday 
          ? 'bg-gradient-to-r from-amber-900/40 to-emerald-900/40 border-2 border-amber-500 shadow-lg shadow-amber-500/20' 
          : 'glass hover:bg-white/10 hover:shadow-lg'
      }`}
    >
      {/* Main row - always visible */}
      <div 
        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer transition-all ${
          expanded ? 'border-b border-white/10' : ''
        }`}
        onClick={handleClick}
      >
        <div className="flex items-center gap-4 mb-3 sm:mb-0">
          {/* Day number badge */}
          <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl overflow-hidden ${
            isToday 
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-[#1a3f54] shadow-lg' 
              : 'bg-gradient-to-br from-amber-900/40 to-amber-800/20 text-amber-400 border border-amber-500/30'
          }`}>
            <div className="absolute inset-0 bg-black/10"></div>
            <span className="relative z-10">{day.day}</span>
            {isToday && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-pulse"></div>
            )}
          </div>
          
          {/* Date info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-light text-white/40 uppercase tracking-wider">{txt.date}:</span>
              <span className="font-medium text-white/90">
                {format(day.gregorianDate, 'dd MMM', { locale: language === 'bn' ? bn : enUS })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-light text-white/40 uppercase tracking-wider">{txt.weekday}:</span>
              <span className="text-sm text-white/80">{dayOfWeek}</span>
            </div>
            <div className="flex items-center gap-2 sm:hidden">
              <span className="text-xs font-light text-white/40 uppercase tracking-wider">{txt.hijri}:</span>
              <span className="text-xs text-white/60">{day.hijriDate}</span>
            </div>
          </div>
        </div>
        
        {/* Times section */}
        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
          <div className="flex items-center gap-4">
            {/* Sehri time card */}
            <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 px-4 py-2 rounded-xl border border-emerald-500/30 min-w-[100px] text-center">
              <div className="text-xs font-light text-emerald-300/60 mb-1">{txt.sehri}</div>
              <div className="font-mono text-emerald-400 font-bold text-base md:text-lg tracking-wider">
                {day.sehri12}
              </div>
            </div>
            
            {/* Iftar time card */}
            <div className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 px-4 py-2 rounded-xl border border-orange-500/30 min-w-[100px] text-center">
              <div className="text-xs font-light text-orange-300/60 mb-1">{txt.iftar}</div>
              <div className="font-mono text-orange-400 font-bold text-base md:text-lg tracking-wider">
                {day.iftar12}
              </div>
            </div>
          </div>
          
          {/* Fasting hours - desktop only */}
          <div className="hidden lg:block bg-white/5 px-3 py-2 rounded-xl">
            <div className="text-xs font-light text-white/40 mb-1">{txt.fasting}</div>
            <div className="text-amber-400 font-bold text-center">{day.fastingHours}</div>
          </div>
          
          {/* Expand/collapse icon */}
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="ml-2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-chevron-down text-white/40"></i>
          </motion.div>
        </div>
      </div>
      
      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-gradient-to-b from-black/30 to-transparent">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Hijri date */}
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-xs font-light text-white/40 mb-1 flex items-center gap-1">
                    <i className="fas fa-moon text-amber-400 text-xs"></i>
                    {txt.hijri}
                  </div>
                  <div className="text-sm font-medium text-white/90">{day.hijriDate}</div>
                </div>
                
                {/* Gregorian full date */}
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-xs font-light text-white/40 mb-1 flex items-center gap-1">
                    <i className="fas fa-calendar-alt text-amber-400 text-xs"></i>
                    {txt.gregorian}
                  </div>
                  <div className="text-sm font-medium text-white/90">
                    {format(day.gregorianDate, 'dd MMM yyyy')}
                  </div>
                </div>
                
                {/* Fasting hours */}
                <div className="bg-white/5 p-3 rounded-xl">
                  <div className="text-xs font-light text-white/40 mb-1 flex items-center gap-1">
                    <i className="fas fa-hourglass-half text-amber-400 text-xs"></i>
                    {txt.fasting}
                  </div>
                  <div className="text-sm font-bold text-amber-400">{day.fastingHours}</div>
                </div>
              </div>
              
              {/* Notes for today */}
              {day.isToday && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-900/30 to-emerald-900/30 rounded-xl border border-amber-500/30">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-star text-amber-400 animate-pulse"></i>
                    <span className="text-sm text-white/90">
                      {txt.todaysSchedule || 'Today\'s schedule'} - {day.sehri12} to {day.iftar12}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

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
  const [ramadanInfo, setRamadanInfo] = useState({ year: 1447, currentDay: null, startDate: null, endDate: null });
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [popularCities, setPopularCities] = useState([]);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedDay, setSelectedDay] = useState(null);
  const [countdown, setCountdown] = useState({ nextEvent: '', timeRemaining: '', hours: 0, minutes: 0, seconds: 0, type: '' });
  const [isDataReady, setIsDataReady] = useState(false);

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  const methodNames = {
    1: 'University of Islamic Sciences, Karachi',
    4: 'Umm Al-Qura University, Makkah',
    2: 'Islamic Society of North America (ISNA)',
    3: 'Muslim World League (MWL)',
    5: 'Egyptian General Authority of Survey'
  };

  // Load popular cities
  useEffect(() => {
    setPopularCities(citySearchService.getPopularCities());
  }, []);

  // Load data when location changes
  useEffect(() => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      loadRamadanData(userLocation);
    }
  }, [userLocation, selectedMethod, useOffsets]);

  // Countdown timer - only start when data is ready
  useEffect(() => {
    if (!todayInfo || !isDataReady) return;
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [todayInfo, isDataReady]);

  const updateCountdown = () => {
    if (!todayInfo) return;
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [sehriHour, sehriMin] = todayInfo.sehri24.split(':').map(Number);
    const [iftarHour, iftarMin] = todayInfo.iftar24.split(':').map(Number);
    
    const sehriTime = sehriHour * 60 + sehriMin;
    const iftarTime = iftarHour * 60 + iftarMin;
    
    let targetTime, eventType;
    
    if (currentTime < sehriTime) {
      targetTime = sehriTime;
      eventType = 'sehri';
    } else if (currentTime < iftarTime) {
      targetTime = iftarTime;
      eventType = 'iftar';
    } else {
      targetTime = sehriTime + 24 * 60;
      eventType = 'sehri';
    }
    
    const minutesRemaining = targetTime - currentTime;
    const hours = Math.floor(minutesRemaining / 60);
    const minutes = minutesRemaining % 60;
    const seconds = 59 - now.getSeconds();
    
    setCountdown({
      nextEvent: eventType === 'sehri' ? 'Sehri' : 'Iftar',
      timeRemaining: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      hours, minutes, seconds,
      type: eventType
    });
  };

  const loadRamadanData = async (location) => {
    try {
      setLoading(true);
      setIsDataReady(false);
      setLoadingProgress(0);
      
      const loadingToast = toast.loading(language === 'bn' ? '📅 রমজান ক্যালেন্ডার তৈরি হচ্ছে...' : '📅 Generating Ramadan calendar...');
      
      // Step 1: Get calendar data
      const calendarData = await hijriService.getRamadanCalendar(location, useOffsets);
      
      const offset = hijriService.getCountryOffset(location);
      const description = hijriService.getOffsetDescription(location, useOffsets);
      const group = offset === 0 ? 'Group 1 (Feb 18 Start)' : 'Group 2 (Feb 19 Start)';
      
      setOffsetInfo({ offset, description, group });
      setRamadanInfo({ 
        year: calendarData.year, 
        currentDay: calendarData.currentDay,
        startDate: calendarData.startDate,
        endDate: calendarData.endDate
      });
      
      // Step 2: Fetch ALL 30 days in PARALLEL
      toast.loading(language === 'bn' ? '⏳ ৩০ দিনের সময় লোড হচ্ছে...' : '⏳ Loading 30 days times...', { id: loadingToast });
      
      const fetchPromises = calendarData.days.map(async (day) => {
        try {
          const prayerData = await getPrayerTimes(
            location.lat,
            location.lng,
            selectedMethod,
            day.gregorianStr
          );
          
          return {
            day: day.day,
            sehri24: prayerData?.timings?.Fajr || '05:30',
            iftar24: prayerData?.timings?.Maghrib || '18:15',
            success: true
          };
        } catch (error) {
          console.log(`Day ${day.day} failed, using fallback`);
          return {
            day: day.day,
            sehri24: calculateApproxSehri(day.day),
            iftar24: calculateApproxIftar(day.day),
            success: false
          };
        }
      });
      
      // Wait for ALL promises to complete
      const results = await Promise.all(fetchPromises);
      
      // Step 3: Create final days array with all data
      const finalDays = calendarData.days.map(day => {
        const result = results.find(r => r.day === day.day);
        
        return {
          day: day.day,
          gregorianDate: day.gregorian,
          gregorianStr: day.gregorianStr,
          hijriDate: day.hijri.format,
          sehri24: result.sehri24,
          sehri12: convertTo12Hour(result.sehri24),
          iftar24: result.iftar24,
          iftar12: convertTo12Hour(result.iftar24),
          fastingHours: calculateFastingHours(result.sehri24, result.iftar24),
          isToday: day.isToday,
          isApprox: !result.success
        };
      });
      
      // Step 4: Update state with all data
      setRamadanDays(finalDays);
      setTodayInfo(finalDays.find(d => d.isToday));
      
      // Step 5: Mark data as ready
      setIsDataReady(true);
      
      const successCount = results.filter(r => r.success).length;
      toast.success(
        language === 'bn' 
          ? `✅ ${successCount}/৩০ দিন লোড হয়েছে` 
          : `✅ Loaded ${successCount}/30 days`, 
        { id: loadingToast }
      );
      
    } catch (error) {
      console.error('Error:', error);
      toast.error(language === 'bn' ? '❌ ডেটা লোড করতে সমস্যা হয়েছে' : '❌ Failed to load data');
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    
    if (day.isApprox) {
      toast.info(
        language === 'bn' 
          ? `📅 দিন ${day.day}: আনুমানিক সময়` 
          : `📅 Day ${day.day}: Estimated times`, 
        { duration: 2000, icon: '⏳' }
      );
    } else {
      toast.success(
        language === 'bn' 
          ? `📅 দিন ${day.day}: সেহরি ${day.sehri12}, ইফতার ${day.iftar12}` 
          : `📅 Day ${day.day}: Sehri at ${day.sehri12}, Iftar at ${day.iftar12}`, 
        { duration: 3000, icon: '🌙' }
      );
    }
  };

  const selectCity = (city) => {
    setShowCitySearch(false);
    setSearchCity('');
    setSearchResults([]);
    
    const loadingToast = toast.loading(language === 'bn' ? `📅 ${city.name} এর জন্য ক্যালেন্ডার লোড হচ্ছে...` : `📅 Loading calendar for ${city.name}...`);
    
    updateLocation({
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      country: city.country
    });
    
    setTimeout(() => {
      toast.dismiss(loadingToast);
    }, 500);
  };

  // Helper functions
  const calculateApproxSehri = (day) => {
    const baseHour = 5;
    const baseMin = 10;
    const totalMin = (baseHour * 60 + baseMin) - (day * 1.5);
    const hours = Math.floor(totalMin / 60);
    const minutes = Math.floor(totalMin % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateApproxIftar = (day) => {
    const baseHour = 18;
    const baseMin = 5;
    const totalMin = (baseHour * 60 + baseMin) + (day * 1);
    const hours = Math.floor(totalMin / 60);
    const minutes = Math.floor(totalMin % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateFastingHours = (sehri, iftar) => {
    if (!sehri || !iftar) return '--:--';
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

  // PDF Export
  const exportToPDF = () => {
    try {
      const loadingToast = toast.loading(language === 'bn' ? '📄 পিডিএফ তৈরি হচ্ছে...' : '📄 Generating PDF...');
      
      const doc = new jsPDF();
      
      // Try to use Bangla font
      try {
        doc.setFont('Nikosh', 'bold');
      } catch (e) {
        doc.setFont('helvetica');
      }
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      
      if (language === 'bn') {
        doc.text(`রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`, 20, 20);
      } else {
        doc.text(`Ramadan ${ramadanInfo.year} - 30 Days Schedule`, 20, 20);
      }
      
      // Location
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      const locationText = selectedLocation 
        ? `${selectedLocation.city}, ${selectedLocation.country}`
        : (language === 'bn' ? 'অবস্থান নির্ধারিত নয়' : 'Location not set');
      doc.text(locationText, 20, 30);
      doc.text(`${language === 'bn' ? 'পদ্ধতি' : 'Method'}: ${methodNames[selectedMethod] || 'Karachi'}`, 20, 35);
      doc.text(`${language === 'bn' ? 'তৈরির তারিখ' : 'Generated'}: ${new Date().toLocaleDateString()}`, 20, 40);
      
      // Table headers
      const headers = language === 'bn' 
        ? [['রোজা', 'তারিখ', 'হিজরি', 'বার', 'সেহরি', 'ইফতার', 'সময়']]
        : [['Day', 'Date', 'Hijri', 'Day', 'Sehri', 'Iftar', 'Fasting']];
      
      // Table data
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
            weekdays[day.gregorianDate.getDay()].substring(0, 3),
            day.sehri12,
            day.iftar12,
            day.fastingHours
          ];
        }
      });
      
      doc.autoTable({
        head: headers,
        body: rows,
        startY: 45,
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
      
      // Footer
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      if (language === 'bn') {
        doc.text('সেহরির সময়ে খাওয়া বন্ধ করুন', 20, finalY);
        doc.text('ইফতারের সময়ে ইফতার করুন', 20, finalY + 5);
      } else {
        doc.text('Stop eating before Sehri time', 20, finalY);
        doc.text('Break fast at Iftar time', 20, finalY + 5);
      }
      
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
      fetchingTimes: 'Loading times...',
      calculationMethod: 'Method',
      changeMethod: 'Change Method',
      nextEvent: 'Next',
      timeRemaining: 'Time Left',
      offsets: 'Local Offsets',
      offsetsEnabled: 'On',
      offsetsDisabled: 'Off',
      popularCities: 'Popular Cities',
      todaysSchedule: 'Today\'s Schedule',
      sehriTime: 'Sehri',
      iftarTime: 'Iftar',
      loadingAccurate: 'Loading accurate times...'
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
      fetchingTimes: 'সময় আনা হচ্ছে...',
      calculationMethod: 'পদ্ধতি',
      changeMethod: 'পদ্ধতি পরিবর্তন',
      nextEvent: 'পরবর্তী',
      timeRemaining: 'বাকি সময়',
      offsets: 'স্থানীয় সমন্বয়',
      offsetsEnabled: 'চালু',
      offsetsDisabled: 'বন্ধ',
      popularCities: 'জনপ্রিয় শহর',
      todaysSchedule: 'আজকের সময়সূচি',
      sehriTime: 'সেহরি',
      iftarTime: 'ইফতার',
      loadingAccurate: 'সঠিক সময় লোড হচ্ছে...'
    }
  };

  const txt = translations[language] || translations.en;

  // City search modal component
  const CitySearchModal = () => (
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
  );

  // Show loading skeleton while data is being fetched
  if (loading || locationLoading || !isDataReady) {
    return (
      <>
        <RamadanSkeleton />
        {loadingProgress > 0 && loadingProgress < 100 && (
          <LoadingProgress progress={loadingProgress} message={`${txt.fetchingTimes} ${loadingProgress}%`} />
        )}
      </>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-4 max-w-4xl mx-auto">
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
              title={txt.changeMethod}
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
              title={txt.enableOffsets || 'Toggle offsets'}
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
                  title={txt.changeCity}
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

        {/* Countdown - only shown when data is ready */}
        {todayInfo && isDataReady && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass p-4 bg-gradient-to-r from-amber-900/20 to-transparent border border-amber-500/30 rounded-xl">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-white/50">{txt.nextEvent}:</span>
                <span className="font-bold text-amber-400">{countdown.nextEvent}</span>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-mono font-bold text-amber-400">
                  {countdown.hours.toString().padStart(2,'0')}:
                  {countdown.minutes.toString().padStart(2,'0')}:
                  {countdown.seconds.toString().padStart(2,'0')}
                </div>
                <p className="text-xs text-white/30 mt-1">{txt.timeRemaining}</p>
              </div>
            </div>

            <div className="glass p-4 bg-gradient-to-l from-amber-900/20 to-transparent border border-amber-500/30 rounded-xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-xs text-white/50">{txt.sehri}</p>
                  <p className="text-lg md:text-xl font-bold text-emerald-400">{todayInfo.sehri12}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/50">{txt.iftar}</p>
                  <p className="text-lg md:text-xl font-bold text-orange-400">{todayInfo.iftar12}</p>
                </div>
              </div>
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
      {showCitySearch && <CitySearchModal />}

      {/* Beautiful List of Ramadan Days */}
      <div className="space-y-2">
        {ramadanDays.map((day, index) => (
          <RamadanListItem
            key={day.day}
            day={day}
            isToday={day.isToday}
            language={language}
            weekdays={weekdays}
            banglaWeekdays={banglaWeekdays}
            txt={txt}
            index={index}
            onDayClick={handleDayClick}
          />
        ))}
      </div>

      {/* Ashra Sections */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-emerald-900/40 p-2 md:p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">1-10</p>
          <p className="text-xs md:text-sm font-bold text-emerald-400">{txt.day1to10}</p>
        </div>
        <div className="bg-amber-900/40 p-2 md:p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">11-20</p>
          <p className="text-xs md:text-sm font-bold text-amber-400">{txt.day11to20}</p>
        </div>
        <div className="bg-red-900/40 p-2 md:p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">21-30</p>
          <p className="text-xs md:text-sm font-bold text-red-400">{txt.day21to30}</p>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="glass p-4 text-xs text-white/40 rounded-xl">
        <p className="flex items-center gap-2"><i className="fas fa-info-circle text-amber-400"></i>{txt.notes}</p>
        <p className="flex items-center gap-2 mt-1"><i className="fas fa-clock text-emerald-400"></i>{txt.sehriNote}</p>
        <p className="flex items-center gap-2 mt-1"><i className="fas fa-clock text-orange-400"></i>{txt.iftarNote}</p>
        <p className="flex items-center gap-2 mt-2 text-xs"><i className="fas fa-calculator text-amber-400"></i>{methodNames[selectedMethod]}</p>
        <p className="flex items-center gap-2 mt-1"><i className="fas fa-map-pin text-amber-400"></i>{txt.offsets}: {useOffsets ? txt.offsetsEnabled : txt.offsetsDisabled}</p>
        {selectedLocation && offsetInfo && (
          <p className="flex items-center gap-2 mt-1"><i className="fas fa-globe text-amber-400"></i>{offsetInfo.description}</p>
        )}
      </div>
    </motion.div>
  );
};

export default RamadanTable;
