import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes, getCalculationMethods } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import hijriService from '../../services/hijriService';
import citySearchService from '../../services/citySearchService';
import pdfFontService from '../../services/pdfFontService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getBangladeshOffset } from '../../services/bangladeshOffsets';
import RamadanSkeleton from './RamadanSkeleton';
import LoadingProgress from '../common/LoadingProgress';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location: userLocation, loading: locationLoading, updateLocation } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayInfo, setTodayInfo] = useState(null);
  const [calculationMethods, setCalculationMethods] = useState([]);
  
  // Default to Karachi method (ID: 1)
  const [selectedMethod, setSelectedMethod] = useState(1);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  
  // Offset toggle
  const [useOffsets, setUseOffsets] = useState(true);
  
  // Countdown state
  const [countdown, setCountdown] = useState({
    nextEvent: '',
    timeRemaining: '',
    hours: 0,
    minutes: 0,
    seconds: 0,
    type: ''
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
  const [searching, setSearching] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [popularCities, setPopularCities] = useState([]);
  const [mobileView, setMobileView] = useState('compact'); // 'compact' or 'detailed'

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  // Method names
  const methodNames = {
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
    29: 'Jordan',
    99: 'Custom'
  };

  // Detect screen size for responsive design
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setMobileView('compact');
      } else {
        setMobileView('detailed');
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load popular cities
  useEffect(() => {
    setPopularCities(citySearchService.getPopularCities());
  }, []);

  // Load calculation methods
  useEffect(() => {
    loadCalculationMethods();
  }, []);

  // Load data when location/method/offset changes
  useEffect(() => {
    if (userLocation) {
      setSelectedLocation(userLocation);
      loadRamadanData(userLocation);
    }
  }, [userLocation, selectedMethod, useOffsets]);

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
      
      // Create unique cache key for this specific city
      const cacheKey = `ramadan_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${selectedMethod}_${useOffsets}`;
      
      console.log('📍 Loading for city:', location.city);
      console.log('🔑 Cache key:', cacheKey);
      
      // Check if we have cached data for THIS city
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const cacheAge = Date.now() - timestamp;
        
        if (cacheAge < CACHE_DURATION) {
          console.log(`📦 Using cached data for ${location.city}`);
          setRamadanDays(data.days);
          setTodayInfo(data.todayInfo);
          setRamadanInfo(data.ramadanInfo);
          setOffsetInfo(data.offsetInfo);
          setLoading(false);
          toast.success(`Loaded ${location.city} from cache`);
          return;
        }
      }
      
      // No cache - load fresh data
      console.log('🌍 Fetching fresh data for', location.city);
      
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
      
      const toastId = toast.loading(`Loading 30 days for ${location.city}...`);
      
      // Fetch ALL 30 days in PARALLEL
      const fetchPromises = calendarData.days.map(async (day) => {
        try {
          const prayerData = await getPrayerTimes(
            location.lat,
            location.lng,
            selectedMethod,
            day.gregorianStr
          );
          
          let sehriTime = prayerData?.timings?.Fajr || '05:30';
          let iftarTime = prayerData?.timings?.Maghrib || '18:15';
          
          // Apply Bangladesh offsets if needed
          if (location.country === 'Bangladesh' && useOffsets) {
            const adjusted = applyBangladeshOffset(sehriTime, iftarTime, location.city);
            sehriTime = adjusted.sehri;
            iftarTime = adjusted.iftar;
          }
          
          return {
            day: day.day,
            sehri24: sehriTime,
            iftar24: iftarTime,
            success: true
          };
        } catch (error) {
          console.error(`Failed day ${day.day}:`, error);
          return {
            day: day.day,
            sehri24: '05:30',
            iftar24: '18:15',
            success: false
          };
        }
      });
      
      const results = await Promise.all(fetchPromises);
      
      const updatedDays = calendarData.days.map(day => {
        const result = results.find(r => r.day === day.day);
        
        return {
          day: day.day,
          gregorianDate: day.gregorian,
          gregorianStr: day.gregorianStr,
          hijriDate: day.hijri.format,
          weekday: weekdays[day.gregorian.getDay()],
          shortWeekday: weekdays[day.gregorian.getDay()].substring(0, 3),
          sehri24: result.sehri24,
          sehri12: convertTo12Hour(result.sehri24),
          iftar24: result.iftar24,
          iftar12: convertTo12Hour(result.iftar24),
          isToday: day.isToday,
          fastingHours: calculateFastingHours(result.sehri24, result.iftar24),
          isLoading: false
        };
      });
      
      const todayData = updatedDays.find(d => d.isToday);
      
      setRamadanDays(updatedDays);
      setTodayInfo(todayData);
      
      // Save to cache
      const cacheData = {
        days: updatedDays,
        todayInfo: todayData,
        ramadanInfo: {
          year: calendarData.year,
          currentDay: calendarData.currentDay,
          startDate: calendarData.startDate,
          endDate: calendarData.endDate
        },
        offsetInfo: { offset, description, group }
      };
      
      localStorage.setItem(cacheKey, JSON.stringify({
        data: cacheData,
        timestamp: Date.now()
      }));
      
      const successCount = results.filter(r => r.success).length;
      toast.success(`Loaded ${successCount}/30 days for ${location.city}`, { id: toastId });
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  };

  const applyBangladeshOffset = (sehriTime, iftarTime, city) => {
    if (!useOffsets) return { sehri: sehriTime, iftar: iftarTime };
    
    if (selectedLocation?.country === 'Bangladesh') {
      const offset = getBangladeshOffset(city || selectedLocation.city);
      
      const [sehriHour, sehriMin] = sehriTime.split(':').map(Number);
      const [iftarHour, iftarMin] = iftarTime.split(':').map(Number);
      
      const sehriTotal = sehriHour * 60 + sehriMin - offset.sehri;
      const iftarTotal = iftarHour * 60 + iftarMin + offset.iftar;
      
      const newSehriHour = Math.floor(sehriTotal / 60);
      const newSehriMin = sehriTotal % 60;
      const newIftarHour = Math.floor(iftarTotal / 60);
      const newIftarMin = iftarTotal % 60;
      
      return {
        sehri: `${newSehriHour.toString().padStart(2, '0')}:${newSehriMin.toString().padStart(2, '0')}`,
        iftar: `${newIftarHour.toString().padStart(2, '0')}:${newIftarMin.toString().padStart(2, '0')}`
      };
    }
    return { sehri: sehriTime, iftar: iftarTime };
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

  // Countdown timer
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

    const [sehriHour, sehriMin] = todayInfo.sehri24.split(':').map(Number);
    const [iftarHour, iftarMin] = todayInfo.iftar24.split(':').map(Number);

    const sehriTime = sehriHour * 60 + sehriMin;
    const iftarTime = iftarHour * 60 + iftarMin;

    let targetTime;
    let eventType;

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
      hours,
      minutes,
      seconds,
      type: eventType
    });
  };

  // City search
  const searchCityByName = async () => {
    if (!searchCity.trim()) {
      toast.error('Please enter a city name');
      return;
    }

    setSearching(true);
    setSearchResults([]);

    try {
      const results = await citySearchService.searchCities(searchCity);
      
      if (results.length === 0) {
        toast.error('No cities found. Please try a different name.');
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message || 'Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const selectCity = (city) => {
    setShowCitySearch(false);
    setSearchCity('');
    setSearchResults([]);
    
    const loadingToast = toast.loading(`Loading calendar for ${city.name}...`);
    
    updateLocation({
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      country: city.country
    });
    
    toast.dismiss(loadingToast);
  };

  // PDF Export - Fixed Bangla Support
  const exportToPDF = async () => {
    try {
      const loadingToast = toast.loading(language === 'bn' ? 'পিডিএফ তৈরি হচ্ছে...' : 'Generating PDF...');
      
      const doc = new jsPDF();
      
      // Always use English for PDF to avoid font issues
      doc.setFont('helvetica');
      
      // Title in English only
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      doc.text(`Ramadan ${ramadanInfo.year} - 30 Days Schedule`, 14, 22);
      
      // Location
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      const locationText = selectedLocation 
        ? `${selectedLocation.city}, ${selectedLocation.country}`
        : 'Location not set';
      doc.text(locationText, 14, 30);
      doc.text(`Method: ${methodNames[selectedMethod] || 'Karachi'}`, 14, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);
      
      // Table headers in English
      const tableColumn = ['Day', 'Date', 'Hijri', 'Day', 'Sehri', 'Iftar', 'Fasting'];
      
      // Table data - use English format
      const tableRows = ramadanDays.map(day => [
        day.day.toString(),
        format(new Date(day.gregorianDate), 'dd MMM', { locale: enUS }),
        day.hijriDate,
        day.shortWeekday,
        day.sehri12,
        day.iftar12,
        day.fastingHours
      ]);
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { 
          fontSize: 8,
          font: 'helvetica',
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [212, 175, 55], 
          textColor: [26, 63, 84],
          fontStyle: 'bold'
        },
        alternateRowStyles: { 
          fillColor: [240, 240, 240] 
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 25 },
          2: { cellWidth: 30 },
          3: { cellWidth: 20 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 },
          6: { cellWidth: 25 }
        }
      });
      
      // Footer
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Stop eating before Sehri time', 14, finalY);
      doc.text('Break fast at Iftar time', 14, finalY + 5);
      
      // Save
      const fileName = `Ramadan-${ramadanInfo.year}-${selectedLocation?.city || 'Schedule'}.pdf`;
      doc.save(fileName);
      
      toast.dismiss(loadingToast);
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
      searchPlaceholder: 'Enter city name (e.g., Dhaka, London, New York)',
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
      offsets: 'Use Local Offsets',
      offsetsEnabled: 'Enabled',
      offsetsDisabled: 'Disabled',
      enableOffsets: 'Enable location-based adjustments',
      popularCities: 'Popular Cities',
      searchNow: 'Search Now',
      compactView: 'Compact View',
      detailedView: 'Detailed View',
      tapForDetails: 'Tap for details'
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
      searchPlaceholder: 'শহরের নাম লিখুন (যেমন: ঢাকা, লন্ডন, নিউ ইয়র্ক)',
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
      offsets: 'স্থানীয় সমন্বয় ব্যবহার করুন',
      offsetsEnabled: 'সক্রিয়',
      offsetsDisabled: 'নিষ্ক্রিয়',
      enableOffsets: 'অবস্থান-ভিত্তিক সমন্বয় সক্রিয় করুন',
      popularCities: 'জনপ্রিয় শহর',
      searchNow: 'এখনই খুঁজুন',
      compactView: 'সংক্ষিপ্ত ভিউ',
      detailedView: 'বিস্তারিত ভিউ',
      tapForDetails: 'বিস্তারিত দেখতে ট্যাপ করুন'
    }
  };

  const txt = translations[language] || translations.en;

  if (loading || locationLoading) {
    return (
      <>
        <RamadanSkeleton />
        {loadingProgress > 0 && loadingProgress < 100 && (
          <LoadingProgress 
            progress={loadingProgress} 
            message={`${txt.fetchingTimes} ${loadingProgress}%`} 
          />
        )}
      </>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4"
    >
      {/* Header */}
      <div className="glass p-4 md:p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-[#d4af37] mb-2">
              🌙 {txt.title}
            </h1>
            <p className="text-sm md:text-base text-white/80">{txt.subtitle}</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            {/* Method Selector - Icon only on mobile */}
            <button
              onClick={() => setShowMethodSelector(!showMethodSelector)}
              className="glass p-2 md:px-4 md:py-2 text-[#d4af37] hover:bg-white/10 transition"
              title={txt.changeMethod}
            >
              <i className="fas fa-calculator text-lg md:mr-2"></i>
              <span className="hidden md:inline">{txt.calculationMethod}</span>
            </button>
            
            {/* Offset Toggle - Icon only on mobile */}
            <button
              onClick={() => setUseOffsets(!useOffsets)}
              className={`p-2 md:px-4 md:py-2 rounded-lg transition ${
                useOffsets 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-gray-600 text-white/70'
              }`}
              title={txt.enableOffsets}
            >
              <i className="fas fa-map-pin text-lg md:mr-2"></i>
              <span className="hidden md:inline">
                {useOffsets ? txt.offsetsEnabled : txt.offsetsDisabled}
              </span>
            </button>
            
            {/* Location - Simplified on mobile */}
            {selectedLocation ? (
              <div className="glass px-2 md:px-4 py-2 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-[#d4af37]"></i>
                <span className="text-sm md:text-base font-medium truncate max-w-[100px] md:max-w-none">
                  {selectedLocation.city}
                </span>
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
                className="glass px-3 md:px-4 py-2 text-[#d4af37] hover:bg-white/10 transition"
              >
                <i className="fas fa-search md:mr-2"></i>
                <span className="hidden md:inline">{txt.searchCity}</span>
              </button>
            )}
          </div>
        </div>

        {/* Countdown - Simplified on mobile */}
        {todayInfo && (
          <div className="mt-4 md:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            <div className="glass p-3 md:p-4 bg-gradient-to-r from-[#d4af37]/10 to-transparent border border-[#d4af37]/30">
              <div className="flex items-center justify-between mb-1 md:mb-2">
                <span className="text-xs md:text-sm text-white/50">{txt.nextEvent}:</span>
                <span className="text-sm md:text-lg font-bold text-[#d4af37]">{countdown.nextEvent}</span>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-4xl font-mono font-bold text-[#d4af37]">
                  {countdown.hours.toString().padStart(2, '0')}:
                  {countdown.minutes.toString().padStart(2, '0')}:
                  {countdown.seconds.toString().padStart(2, '0')}
                </div>
                <p className="text-xs text-white/30 mt-1">{txt.timeRemaining}</p>
              </div>
            </div>

            <div className="glass p-3 md:p-4 bg-gradient-to-l from-[#d4af37]/10 to-transparent border border-[#d4af37]/30">
              <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div className="text-center">
                  <p className="text-xs md:text-sm text-white/50">{txt.sehri}</p>
                  <p className="text-base md:text-xl font-bold text-emerald-400">{todayInfo.sehri12}</p>
                  <p className="text-xs text-white/30 hidden md:block">{todayInfo.sehri24}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs md:text-sm text-white/50">{txt.iftar}</p>
                  <p className="text-base md:text-xl font-bold text-orange-400">{todayInfo.iftar12}</p>
                  <p className="text-xs text-white/30 hidden md:block">{todayInfo.iftar24}</p>
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
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none text-sm"
            >
              {Object.entries(methodNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Today's Highlight - Simplified on mobile */}
        {todayInfo && (
          <div className="mt-4 md:mt-6 glass p-4 md:p-6 bg-[#d4af37]/20 border-2 border-[#d4af37]">
            <h3 className="text-lg md:text-xl font-bold text-[#d4af37] mb-3 md:mb-4">
              <i className="fas fa-star mr-2"></i>
              {txt.todaysSchedule || 'Today\'s Schedule'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div className="bg-black/20 p-3 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-white/50">{txt.sehriTime || 'Sehri'}</p>
                <p className="text-xl md:text-3xl font-bold text-emerald-400">{todayInfo.sehri12}</p>
                <p className="text-xs text-white/30 mt-1 hidden md:block">({todayInfo.sehri24})</p>
              </div>
              <div className="bg-black/20 p-3 md:p-4 rounded-lg">
                <p className="text-xs md:text-sm text-white/50">{txt.iftarTime || 'Iftar'}</p>
                <p className="text-xl md:text-3xl font-bold text-orange-400">{todayInfo.iftar12}</p>
                <p className="text-xs text-white/30 mt-1 hidden md:block">({todayInfo.iftar24})</p>
              </div>
            </div>
          </div>
        )}

        {/* Ashra Sections - Scrollable on mobile */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mt-4 md:mt-6 overflow-x-auto pb-2">
          <div className="bg-emerald-900/40 p-2 md:p-3 rounded-lg text-center min-w-[100px]">
            <p className="text-xs text-white/50">1-10</p>
            <p className="text-xs md:text-sm font-bold text-emerald-400">{txt.day1to10}</p>
          </div>
          <div className="bg-amber-900/40 p-2 md:p-3 rounded-lg text-center min-w-[100px]">
            <p className="text-xs text-white/50">11-20</p>
            <p className="text-xs md:text-sm font-bold text-amber-400">{txt.day11to20}</p>
          </div>
          <div className="bg-red-900/40 p-2 md:p-3 rounded-lg text-center min-w-[100px]">
            <p className="text-xs text-white/50">21-30</p>
            <p className="text-xs md:text-sm font-bold text-red-400">{txt.day21to30}</p>
          </div>
        </div>

        {/* PDF Export Button */}
        <div className="flex justify-end mt-4">
          <button
            onClick={exportToPDF}
            className="px-3 md:px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold flex items-center gap-2 text-sm md:text-base"
            disabled={ramadanDays.length === 0}
          >
            <i className="fas fa-file-pdf"></i>
            <span className="hidden md:inline">{txt.downloadPDF}</span>
            <span className="md:hidden">PDF</span>
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
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none text-sm"
                autoFocus
                disabled={searching}
              />
              <button
                onClick={searchCityByName}
                disabled={searching}
                className="px-4 md:px-6 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition disabled:opacity-50 flex items-center gap-2 text-sm"
              >
                {searching ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    <span className="hidden md:inline">Searching...</span>
                  </>
                ) : (
                  txt.search
                )}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="mt-4">
                <h4 className="text-sm text-white/50 mb-2">{txt.searchResults} ({searchResults.length})</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => selectCity(city)}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition"
                    >
                      <div className="font-bold text-sm">{city.name}</div>
                      <div className="text-xs text-white/50">{city.country}</div>
                    </button>
                  ))}
                </div>
              </div>
            ) : searchCity.trim() !== '' && !searching && (
              <div className="mt-4 p-4 bg-yellow-900/30 rounded-lg text-center">
                <p className="text-yellow-500 text-sm">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  No cities found. Please try a different name.
                </p>
              </div>
            )}

            {/* Popular Cities */}
            {popularCities.length > 0 && searchResults.length === 0 && !searching && (
              <div className="mt-4">
                <h4 className="text-sm text-white/50 mb-2">{txt.popularCities}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {popularCities.slice(0, 6).map((city, index) => (
                    <button
                      key={index}
                      onClick={() => selectCity(city)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-center transition"
                    >
                      <div className="font-bold text-xs">{city.name}</div>
                      <div className="text-xs text-white/50">{city.country}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setShowCitySearch(false);
                setSearchCity('');
                setSearchResults([]);
              }}
              className="mt-4 text-sm text-white/50 hover:text-white w-full text-center"
            >
              {txt.close}
            </button>
          </div>
        </div>
      )}

      {/* Responsive Time Table - No horizontal scroll needed */}
      <div className="glass p-3 md:p-6">
        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {ramadanDays.map((day) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: day.day * 0.02 }}
              className={`p-3 rounded-lg border ${
                day.isToday 
                  ? 'bg-[#d4af37]/20 border-[#d4af37]' 
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold text-[#d4af37]">Day {day.day}</span>
                {day.isToday && (
                  <span className="px-2 py-1 bg-[#d4af37] text-[#1a3f54] text-xs rounded-full">
                    {txt.today}
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="text-xs text-white/50">{txt.gregorian}</div>
                <div className="text-xs text-white/50">{txt.hijri}</div>
                <div className="text-sm">{formatDayMonth(day.gregorianDate)}</div>
                <div className="text-sm">{day.hijriDate}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-emerald-900/30 p-2 rounded text-center">
                  <div className="text-xs text-white/50">{txt.sehri}</div>
                  <div className="text-sm font-bold text-emerald-400">{day.sehri12}</div>
                </div>
                <div className="bg-orange-900/30 p-2 rounded text-center">
                  <div className="text-xs text-white/50">{txt.iftar}</div>
                  <div className="text-sm font-bold text-orange-400">{day.iftar12}</div>
                </div>
              </div>
              
              <div className="mt-2 text-center">
                <span className="text-xs text-white/50">{txt.fasting}: </span>
                <span className="text-sm font-bold text-[#d4af37]">{day.fastingHours}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-3 px-2 text-left text-[#d4af37] text-sm">#</th>
                <th className="py-3 px-2 text-left text-[#d4af37] text-sm">{txt.gregorian}</th>
                <th className="py-3 px-2 text-left text-[#d4af37] text-sm">{txt.hijri}</th>
                <th className="py-3 px-2 text-left text-[#d4af37] text-sm">{txt.weekday}</th>
                <th className="py-3 px-2 text-left text-[#d4af37] text-sm">{txt.sehri}</th>
                <th className="py-3 px-2 text-left text-[#d4af37] text-sm">{txt.iftar}</th>
                <th className="py-3 px-2 text-left text-[#d4af37] text-sm">{txt.fasting}</th>
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
                  <td className="py-3 px-2 font-bold text-[#d4af37] text-sm">{day.day}</td>
                  <td className="py-3 px-2 text-sm">{formatDayMonth(day.gregorianDate)}</td>
                  <td className="py-3 px-2 text-sm">{day.hijriDate}</td>
                  <td className="py-3 px-2 text-sm">
                    {language === 'bn' ? banglaWeekdays[day.gregorianDate.getDay()] : day.shortWeekday}
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span className="font-mono text-emerald-400">{day.sehri12}</span>
                  </td>
                  <td className="py-3 px-2 text-sm">
                    <span className="font-mono text-orange-400">{day.iftar12}</span>
                  </td>
                  <td className="py-3 px-2 text-sm text-[#d4af37]">{day.fastingHours}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes - Simplified on mobile */}
      <div className="glass p-3 md:p-4 text-xs md:text-sm text-white/50">
        <p className="flex items-center gap-2">
          <i className="fas fa-info-circle text-[#d4af37]"></i>
          {txt.notes}
        </p>
        <p className="flex items-center gap-2 mt-1">
          <i className="fas fa-clock text-emerald-400"></i>
          <span className="hidden md:inline">{txt.sehriNote}</span>
          <span className="md:hidden">Stop before Sehri</span>
        </p>
        <p className="flex items-center gap-2 mt-1">
          <i className="fas fa-clock text-orange-400"></i>
          <span className="hidden md:inline">{txt.iftarNote}</span>
          <span className="md:hidden">Break at Iftar</span>
        </p>
        <p className="flex items-center gap-2 mt-2 text-xs">
          <i className="fas fa-calculator text-[#d4af37]"></i>
          <span className="truncate">{methodNames[selectedMethod]}</span>
        </p>
        <p className="flex items-center gap-2 mt-1 text-xs">
          <i className="fas fa-map-pin text-[#d4af37]"></i>
          {txt.offsets}: {useOffsets ? txt.offsetsEnabled : txt.offsetsDisabled}
        </p>
        {selectedLocation && offsetInfo && (
          <p className="flex items-center gap-2 mt-1 text-xs">
            <i className="fas fa-globe text-[#d4af37]"></i>
            <span className="truncate">{offsetInfo.description}</span>
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default RamadanTable;
