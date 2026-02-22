import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import hijriService from '../../services/hijriService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Simple PDF font handling - no external font files needed
const setupPDFFont = (doc, language) => {
  // Always use helvetica which is built-in
  doc.setFont('helvetica');
  
  // For Bangla, we'll use a slightly larger font for better readability
  if (language === 'bn') {
    doc.setFontSize(16); // Slightly larger for Bangla text
  }
};

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location: userLocation, loading: locationLoading, error: locationError, updateLocation } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [ramadanInfo, setRamadanInfo] = useState({
    year: 1447,
    currentDay: null,
    startDate: null,
    endDate: null,
    offset: 0
  });
  const [loading, setLoading] = useState(true);
  const [todayInfo, setTodayInfo] = useState(null);
  
  // Search state
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [locationRetryCount, setLocationRetryCount] = useState(0);
  
  // Default location (Dhaka, Bangladesh as fallback)
  const defaultLocation = {
    city: 'Dhaka',
    country: 'Bangladesh',
    lat: 23.8103,
    lng: 90.4125
  };

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  // Check location permission on mount
  useEffect(() => {
    checkLocationPermission();
  }, []);

  // Load data when location is available or after retry
  useEffect(() => {
    if (userLocation) {
      console.log('Location detected:', userLocation);
      setSelectedLocation(userLocation);
      loadRamadanData(userLocation);
    } else if (locationError && locationRetryCount < 2) {
      // If location error, retry after a delay
      const timer = setTimeout(() => {
        console.log('Retrying location detection...');
        setLocationRetryCount(prev => prev + 1);
        window.location.reload(); // Simple reload to retry
      }, 2000);
      return () => clearTimeout(timer);
    } else if (!userLocation && !locationLoading && locationRetryCount >= 2) {
      // After 2 retries, use default location
      console.log('Using default location (Dhaka)');
      setSelectedLocation(defaultLocation);
      updateLocation(defaultLocation);
      toast.info('Using default location (Dhaka)');
    }
  }, [userLocation, locationError, locationRetryCount]);

  const checkLocationPermission = () => {
    if (!navigator.geolocation) {
      setLocationPermission('unsupported');
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    // Check if permission is already granted/denied
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setLocationPermission(result.state);
        
        if (result.state === 'denied') {
          toast.error('Location access denied. Please enable location or search for your city.');
          setShowCitySearch(true); // Show search modal automatically
        }
      });
    }
  };

  const requestLocationPermission = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationPermission('granted');
        toast.success('Location access granted');
      },
      (error) => {
        setLocationPermission('denied');
        toast.error('Could not get your location. Please search for your city.');
        setShowCitySearch(true);
      }
    );
  };

  const loadRamadanData = async (location) => {
    try {
      setLoading(true);
      
      // Get Ramadan calendar with country-specific offset
      const calendarData = await hijriService.getRamadanCalendar(location);
      
      // Get offset info
      const offset = hijriService.getCountryOffset(location);
      const description = hijriService.getOffsetDescription(location);
      const group = offset === 0 ? 'Group 1 (Feb 18 Start)' : 'Group 2 (Feb 19 Start)';
      
      setOffsetInfo({ offset, description, group });
      
      setRamadanInfo({
        year: calendarData.year,
        currentDay: calendarData.currentDay,
        startDate: calendarData.startDate,
        endDate: calendarData.endDate,
        offset: calendarData.offset
      });
      
      // Get prayer times for each day
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
          gregorianStr: day.gregorianStr,
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
      
      toast.success(`Loaded Ramadan calendar for ${location.city}, ${location.country}`);
      
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

  // City search function
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

  const retryLocation = () => {
    setLocationRetryCount(0);
    window.location.reload();
  };

  // PDF Export function - simplified, no external fonts needed
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Setup font (using built-in fonts only)
      setupPDFFont(doc, language);
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      
      const title = language === 'bn' 
        ? `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`
        : `Ramadan ${ramadanInfo.year} - 30 Days Schedule`;
      doc.text(title, 14, 22);
      
      // Location and offset info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      const locationText = selectedLocation 
        ? `${selectedLocation.city}, ${selectedLocation.country}`
        : 'Location not set';
      doc.text(locationText, 14, 30);
      
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
      
      // Offset info
      doc.text(`Ramadan Start: ${offsetInfo.group}`, 14, 40);
      
      // Table headers
      const tableColumn = language === 'bn' 
        ? ['রোজা', 'তারিখ', 'হিজরি', 'বার', 'সেহরি', 'ইফতার', 'সময়']
        : ['Day', 'Date', 'Hijri', 'Day', 'Sehri', 'Iftar', 'Fasting'];
      
      const tableRows = ramadanDays.map(day => [
        day.day,
        formatDayMonth(day.gregorianDate),
        day.hijriDate,
        language === 'bn' ? banglaWeekdays[day.gregorianDate.getDay()] : day.shortWeekday,
        day.sehri,
        day.iftar,
        day.fastingHours
      ]);
      
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { 
          fontSize: 8,
          font: 'helvetica' // Always use helvetica for reliability
        },
        headStyles: { fillColor: [212, 175, 55], textColor: [26, 63, 84] },
        alternateRowStyles: { fillColor: [240, 240, 240] }
      });
      
      // Add footer with notes
      const finalY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      
      const sehriNote = language === 'bn' 
        ? 'সেহরি সময়ের আগে খাওয়া শেষ করুন'
        : 'Stop eating before Sehri time';
      const iftarNote = language === 'bn'
        ? 'ইফতার সময়ে ইফতার করুন'
        : 'Break fast at Iftar time';
      
      // For Bangla text in PDF, we'll use a slightly different approach
      if (language === 'bn') {
        // For Bangla, we'll just use the English version in PDF to avoid font issues
        doc.text('Stop eating before Sehri time', 14, finalY);
        doc.text('Break fast at Iftar time', 14, finalY + 5);
      } else {
        doc.text(sehriNote, 14, finalY);
        doc.text(iftarNote, 14, finalY + 5);
      }
      
      doc.save(`Ramadan-${ramadanInfo.year}-${selectedLocation?.city || 'Schedule'}.pdf`);
      toast.success(language === 'bn' ? 'পিডিএফ ডাউনলোড হয়েছে' : 'PDF downloaded successfully');
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(language === 'bn' ? 'পিডিএফ তৈরি করতে সমস্যা হয়েছে' : 'PDF generation failed');
    }
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
      downloadPDF: 'Download PDF',
      location: 'Location',
      notes: 'Times are based on your location',
      sehriNote: 'Stop eating before Sehri time',
      iftarNote: 'Break fast at Iftar time',
      day1to10: 'First Ashra (Mercy)',
      day11to20: 'Second Ashra (Forgiveness)',
      day21to30: 'Third Ashra (Salvation)',
      changeCity: 'Change City',
      searchCity: 'Search for your city',
      search: 'Search',
      currentLocation: 'Using your current location',
      locationError: 'Could not get your location. Please search for your city.',
      refreshLocation: 'Refresh Location',
      todaysSchedule: 'Today\'s Schedule',
      sehriTime: 'Sehri Time',
      iftarTime: 'Iftar Time',
      offset: 'Ramadan Start',
      group1: 'Group 1 (Feb 18 Start)',
      group2: 'Group 2 (Feb 19 Start)',
      searchPlaceholder: 'Enter city name...',
      searchResults: 'Search Results',
      close: 'Close',
      selectCity: 'Select a city',
      loading: 'Loading...',
      locationPermissionDenied: 'Location access denied. Please search for your city.',
      locationUnsupported: 'Geolocation not supported. Please search for your city.',
      retryLocation: 'Retry Location',
      usingDefaultLocation: 'Using default location (Dhaka)',
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
      downloadPDF: 'পিডিএফ ডাউনলোড',
      location: 'অবস্থান',
      notes: 'সময় আপনার অবস্থান অনুযায়ী',
      sehriNote: 'সেহরি সময়ের আগে খাওয়া শেষ করুন',
      iftarNote: 'ইফতার সময়ে ইফতার করুন',
      day1to10: 'প্রথম আশরা (রহমত)',
      day11to20: 'দ্বিতীয় আশরা (মাগফিরাত)',
      day21to30: 'তৃতীয় আশরা (নাজাত)',
      changeCity: 'শহর পরিবর্তন',
      searchCity: 'আপনার শহর খুঁজুন',
      search: 'অনুসন্ধান',
      currentLocation: 'আপনার বর্তমান অবস্থান ব্যবহার করা হচ্ছে',
      locationError: 'আপনার অবস্থান পাওয়া যায়নি। অনুগ্রহ করে আপনার শহর খুঁজুন।',
      refreshLocation: 'অবস্থান রিফ্রেশ',
      todaysSchedule: 'আজকের সময়সূচি',
      sehriTime: 'সেহরির সময়',
      iftarTime: 'ইফতারের সময়',
      offset: 'রমজান শুরু',
      group1: 'গ্রুপ ১ (১৮ ফেব্রুয়ারি)',
      group2: 'গ্রুপ ২ (১৯ ফেব্রুয়ারি)',
      searchPlaceholder: 'শহরের নাম লিখুন...',
      searchResults: 'অনুসন্ধানের ফলাফল',
      close: 'বন্ধ',
      selectCity: 'শহর নির্বাচন করুন',
      loading: 'লোড হচ্ছে...',
      locationPermissionDenied: 'অবস্থান অনুমতি দেওয়া হয়নি। অনুগ্রহ করে আপনার শহর খুঁজুন।',
      locationUnsupported: 'জিওলোকেশন সমর্থিত নয়। অনুগ্রহ করে আপনার শহর খুঁজুন।',
      retryLocation: 'পুনরায় চেষ্টা করুন',
      usingDefaultLocation: 'ডিফল্ট অবস্থান (ঢাকা) ব্যবহার করা হচ্ছে',
    }
  };

  const txt = translations[language] || translations.en;

  // Show permission request if needed
  const showLocationPermissionUI = () => {
    if (locationPermission === 'denied') {
      return (
        <div className="glass p-4 mb-4 bg-yellow-900/30 border border-yellow-500/50">
          <div className="flex items-center justify-between">
            <div>
              <i className="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
              <span className="text-yellow-500">{txt.locationPermissionDenied}</span>
            </div>
            <button
              onClick={() => setShowCitySearch(true)}
              className="px-3 py-1 bg-[#d4af37] text-[#1a3f54] rounded-lg text-sm hover:bg-[#c4a037] transition"
            >
              {txt.searchCity}
            </button>
          </div>
        </div>
      );
    }
    if (locationPermission === 'prompt' && !selectedLocation) {
      return (
        <div className="glass p-4 mb-4 bg-blue-900/30 border border-blue-500/50">
          <div className="flex items-center justify-between">
            <div>
              <i className="fas fa-info-circle text-blue-500 mr-2"></i>
              <span className="text-blue-500">Please allow location access for accurate prayer times</span>
            </div>
            <button
              onClick={requestLocationPermission}
              className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition"
            >
              Allow Location
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading && !selectedLocation) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-moon text-4xl text-[#d4af37] animate-pulse mb-4"></i>
          <p className="text-white/70">{txt.loading}</p>
          {locationLoading && <p className="text-sm text-white/50 mt-2">Detecting your location...</p>}
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
      {/* Location Permission UI */}
      {showLocationPermissionUI()}

      {/* Header with Location and Search */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37] mb-2">
              🌙 {txt.title}
            </h1>
            <p className="text-white/80">{txt.subtitle}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {/* Location Display with Search Button */}
            {selectedLocation ? (
              <div className="glass px-4 py-2 flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-[#d4af37]"></i>
                <div>
                  <span>{selectedLocation.city}, {selectedLocation.country}</span>
                  <div className="text-xs mt-1">
                    <span className="text-[#d4af37]">{offsetInfo.group}</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowCitySearch(true)}
                  className="text-xs bg-[#d4af37]/20 px-2 py-1 rounded hover:bg-[#d4af37]/30 transition"
                  title={txt.changeCity}
                >
                  <i className="fas fa-search mr-1"></i>
                  {txt.changeCity}
                </button>
                <button
                  onClick={retryLocation}
                  className="text-xs bg-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/30 transition"
                  title={txt.retryLocation}
                >
                  <i className="fas fa-sync-alt"></i>
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

        {/* Today's Highlight */}
        {todayInfo && (
          <div className="mt-6 glass p-6 bg-[#d4af37]/20 border-2 border-[#d4af37]">
            <h3 className="text-xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <i className="fas fa-star"></i>
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
            
            {/* Search Input */}
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
            
            {/* Search Results */}
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
            
            {/* Close Button */}
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
        <table className="w-full min-w-[700px]">
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
                <td className="py-3 px-2 font-mono text-emerald-400">{day.sehri}</td>
                <td className="py-3 px-2 font-mono text-orange-400">{day.iftar}</td>
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
        {selectedLocation && (
          <p className="flex items-center gap-2 mt-2 text-xs">
            <i className="fas fa-globe text-[#d4af37]"></i>
            {offsetInfo.description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default RamadanTable;
