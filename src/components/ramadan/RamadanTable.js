import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../hooks/useLocations';
import { useRamadan } from '../../context/RamadanContext';
import citySearchService from '../../services/citySearchService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { fontNikoshBold } from '../../Fonts/Nikosh-bold.js';

const RamadanTable = () => {
  const { language } = useLanguage();
  const { location: userLocation, updateLocation } = useLocation();
  const { 
    ramadanData, 
    loading, 
    loadingProgress,
    loadingMessage,
    error,
    selectedMethod,
    useOffsets,
    updateMethod,
    toggleOffsets,
    refreshData,
    lastLocation
  } = useRamadan();
  
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [filter, setFilter] = useState('all');

  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const banglaWeekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];

  const methodNames = {
    1: 'University of Islamic Sciences, Karachi',
    2: 'Islamic Society of North America (ISNA)',
    3: 'Muslim World League',
    4: 'Umm Al-Qura University, Makkah',
    5: 'Egyptian General Authority of Survey',
    8: 'Gulf Region',
    9: 'Kuwait',
    10: 'Qatar'
  };

  // Filter days based on selected filter
  const getFilteredDays = () => {
    if (!ramadanData?.days) return [];
    
    switch(filter) {
      case 'first10':
        return ramadanData.days.filter(day => day.day <= 10);
      case 'second10':
        return ramadanData.days.filter(day => day.day > 10 && day.day <= 20);
      case 'third10':
        return ramadanData.days.filter(day => day.day > 20);
      default:
        return ramadanData.days;
    }
  };

  const filteredDays = getFilteredDays();
  const today = ramadanData?.days?.find(day => day.isToday);

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
      console.error('Search error:', error);
      toast.error(language === 'bn' ? 'অনুসন্ধান ব্যর্থ হয়েছে' : 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const selectCity = async (city) => {
  try {
    setShowCitySearch(false);
    setSearchCity('');
    setSearchResults([]);
    
    console.log('📍 Selecting city:', city);
    
    // Show loading toast
    const toastId = toast.loading(
      language === 'bn' 
        ? `📍 ${city.name} এর জন্য ডেটা লোড হচ্ছে...` 
        : `📍 Loading data for ${city.name}...`
     );
    
    // Update location - this will trigger the locationUpdated event
    updateLocation({
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      country: city.country
     });
    
    // Don't dismiss toast here - it will be dismissed when data loads
    
   } catch (error) {
    console.error('Error selecting city:', error);
    toast.error(
      language === 'bn' 
        ? '❌ শহর নির্বাচন করতে সমস্যা হয়েছে' 
        : '❌ Failed to select city'
     );
   }
  };
  const exportToPDF = () => {
    if (!ramadanData?.days) return;
    
    try {
      const loadingToast = toast.loading(
        language === 'bn' ? '📄 পিডিএফ তৈরি হচ্ছে...' : '📄 Generating PDF...'
      );
      
      const doc = new jsPDF();
      
      // Register Bangla font if needed
      if (language === 'bn') {
        try {
          doc.addFileToVFS('Nikosh-bold.ttf', fontNikoshBold);
          doc.addFont('Nikosh-bold.ttf', 'Nikosh', 'bold');
          doc.addFont('Nikosh-bold.ttf', 'Nikosh', 'normal');
        } catch (e) {
          console.warn('Font registration failed');
        }
      }
      
      // Title
      doc.setFontSize(18);
      doc.setTextColor(212, 175, 55);
      
      let yPos = 20;
      
      if (language === 'bn') {
        doc.setFont('Nikosh', 'bold');
        doc.text(`রমজান ${ramadanData.year} - ৩০ দিনের সময়সূচি`, 20, yPos);
      } else {
        doc.setFont('helvetica', 'bold');
        doc.text(`Ramadan ${ramadanData.year} - 30 Days Schedule`, 20, yPos);
      }
      
      yPos += 10;
      
      // Location and info
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      
      if (language === 'bn') {
        doc.setFont('Nikosh', 'normal');
        doc.text(`অবস্থান: ${userLocation?.city}, ${userLocation?.country}`, 20, yPos);
      } else {
        doc.setFont('helvetica', 'normal');
        doc.text(`Location: ${userLocation?.city}, ${userLocation?.country}`, 20, yPos);
      }
      
      yPos += 6;
      doc.text(`Method: ${methodNames[selectedMethod]}`, 20, yPos);
      yPos += 6;
      
      const dateStr = new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(`Generated: ${dateStr}`, 20, yPos);
      yPos += 10;
      
      // Table headers
      const headers = language === 'bn' 
        ? ['রোজা', 'তারিখ', 'হিজরি', 'বার', 'সেহরি', 'ইফতার', 'সময়']
        : ['Day', 'Date', 'Hijri', 'Day', 'Sehri', 'Iftar', 'Fasting'];
      
      const rows = filteredDays.map(day => {
        if (language === 'bn') {
          const gregorianDate = format(day.gregorian, 'dd MMM', { locale: bn });
          const banglaDay = banglaWeekdays[day.gregorian.getDay()];
          
          return [
            day.day.toString(),
            gregorianDate,
            `${day.hijri.day} রমজান ${day.hijri.year}`,
            banglaDay,
            day.sehri12,
            day.iftar12,
            day.fastingHours
          ];
        } else {
          return [
            day.day.toString(),
            format(day.gregorian, 'dd MMM', { locale: enUS }),
            `${day.hijri.day} Ramadan ${day.hijri.year}`,
            day.shortWeekday || weekdays[day.gregorian.getDay()].substring(0, 3),
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
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245, 0.1]
        }
      });
      
      const fileName = language === 'bn'
        ? `রমজান-${ramadanData.year}-${userLocation?.city || 'সময়সূচি'}.pdf`
        : `Ramadan-${ramadanData.year}-${userLocation?.city || 'Schedule'}.pdf`;
      
      doc.save(fileName);
      
      toast.dismiss(loadingToast);
      toast.success(
        language === 'bn' ? '✅ পিডিএফ ডাউনলোড হয়েছে' : '✅ PDF downloaded successfully'
      );
      
    } catch (error) {
      console.error('PDF error:', error);
      toast.error(
        language === 'bn' ? '❌ পিডিএফ তৈরি করতে সমস্যা হয়েছে' : '❌ PDF generation failed'
      );
    }
  };

  // Loading State
  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-4"
      >
        <div className="glass p-8 rounded-2xl max-w-md w-full text-center">
          {/* Animated Moon */}
          <div className="relative mb-6">
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <i className="fas fa-moon text-6xl text-[#d4af37]"></i>
            </motion.div>
            
            {/* Stars */}
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-2 -right-2"
            >
              <i className="fas fa-star text-xs text-amber-300"></i>
            </motion.div>
            
            <motion.div
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-2 -left-2"
            >
              <i className="fas fa-star text-xs text-amber-300"></i>
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-[#d4af37] mb-2">
            {language === 'bn' ? 'রমজান ক্যালেন্ডার' : 'Ramadan Calendar'}
          </h2>
          
          {/* Location */}
          {userLocation && (
            <p className="text-sm text-white/50 mb-4 flex items-center justify-center">
              <i className="fas fa-map-marker-alt text-[#d4af37] mr-2"></i>
              {userLocation.city}, {userLocation.country}
            </p>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">{loadingMessage || (language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...')}</span>
              <span className="text-[#d4af37] font-bold">{loadingProgress}%</span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-[#d4af37] to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${loadingProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Progress Details */}
          <div className="grid grid-cols-3 gap-2 mt-6">
            <div className="text-center">
              <div className={`text-xs ${loadingProgress >= 33 ? 'text-emerald-400' : 'text-white/30'}`}>
                <i className={`fas fa-${loadingProgress >= 33 ? 'check-circle' : 'circle'} mr-1`}></i>
                {language === 'bn' ? 'তথ্য' : 'Data'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-xs ${loadingProgress >= 66 ? 'text-emerald-400' : 'text-white/30'}`}>
                <i className={`fas fa-${loadingProgress >= 66 ? 'check-circle' : 'circle'} mr-1`}></i>
                {language === 'bn' ? 'সময়' : 'Times'}
              </div>
            </div>
            <div className="text-center">
              <div className={`text-xs ${loadingProgress >= 100 ? 'text-emerald-400' : 'text-white/30'}`}>
                <i className={`fas fa-${loadingProgress >= 100 ? 'check-circle' : 'circle'} mr-1`}></i>
                {language === 'bn' ? 'সম্পন্ন' : 'Ready'}
              </div>
            </div>
          </div>

          {/* Animated Dots */}
          <div className="flex justify-center gap-1 mt-6">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-[#d4af37] rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
              className="w-2 h-2 bg-[#d4af37] rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity, delay: 0.6 }}
              className="w-2 h-2 bg-[#d4af37] rounded-full"
            />
          </div>

          {/* Tip */}
          <p className="text-xs text-white/30 mt-6">
            {language === 'bn' 
              ? '৩০ দিনের ডেটা সংগ্রহ করা হচ্ছে...' 
              : 'Collecting data for 30 days...'}
          </p>
        </div>
      </motion.div>
    );
  }

  // Error State
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-4"
      >
        <div className="glass p-8 rounded-2xl max-w-md w-full text-center">
          <i className="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
          <h2 className="text-xl font-bold text-red-500 mb-2">
            {language === 'bn' ? 'সমস্যা হয়েছে' : 'Error Occurred'}
          </h2>
          <p className="text-white/70 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={refreshData}
              className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-amber-400 transition"
            >
              <i className="fas fa-sync-alt mr-2"></i>
              {language === 'bn' ? 'আবার চেষ্টা করুন' : 'Try Again'}
            </button>
            <button 
              onClick={() => setShowCitySearch(true)}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition"
            >
              <i className="fas fa-map-marker-alt mr-2"></i>
              {language === 'bn' ? 'শহর পরিবর্তন' : 'Change City'}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // No Data State
  if (!ramadanData?.days || ramadanData.days.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] p-4"
      >
        <div className="glass p-8 rounded-2xl max-w-md w-full text-center">
          <i className="fas fa-calendar-times text-4xl text-amber-500 mb-3"></i>
          <h2 className="text-xl font-bold text-amber-500 mb-2">
            {language === 'bn' ? 'কোনো তথ্য নেই' : 'No Data Available'}
          </h2>
          <p className="text-white/70 mb-6">
            {language === 'bn' 
              ? 'রমজান ক্যালেন্ডার লোড করতে সমস্যা হয়েছে' 
              : 'Failed to load Ramadan calendar'}
          </p>
          <button 
            onClick={refreshData}
            className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-amber-400 transition"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            {language === 'bn' ? 'আবার লোড করুন' : 'Reload'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6 p-4 max-w-6xl mx-auto"
    >
      {/* Header Section */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 via-[#d4af37]/10 to-emerald-700/30 rounded-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-amber-400 mb-2 flex items-center">
              <i className="fas fa-moon mr-3"></i>
              {language === 'bn' 
                ? `রমজান ${ramadanData.year} - ৩০ দিনের সময়সূচি` 
                : `Ramadan ${ramadanData.year} - 30 Days Schedule`}
            </h1>
            <p className="text-sm md:text-base text-white/70 flex items-center">
              <i className="fas fa-clock mr-2 text-amber-400"></i>
              {language === 'bn' ? 'সেহরি ও ইফতার সময়' : 'Sehri & Iftar Times'}
              {useOffsets && (
                <span className="ml-2 text-xs bg-emerald-600/30 text-emerald-400 px-2 py-1 rounded-full">
                  <i className="fas fa-map-pin mr-1"></i>
                  {language === 'bn' ? 'স্থানীয় সমন্বয়' : 'Local Offsets'}
                </span>
              )}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="glass px-3 py-2 text-white bg-transparent border border-white/10 rounded-lg focus:border-amber-400 text-sm"
            >
              <option value="all">{language === 'bn' ? 'সব দিন' : 'All Days'}</option>
              <option value="first10">{language === 'bn' ? 'প্রথম ১০ দিন' : 'First 10 Days'}</option>
              <option value="second10">{language === 'bn' ? 'দ্বিতীয় ১০ দিন' : 'Second 10 Days'}</option>
              <option value="third10">{language === 'bn' ? 'তৃতীয় ১০ দিন' : 'Third 10 Days'}</option>
            </select>
            
            {/* Method selector */}
            <button 
              onClick={() => setShowMethodSelector(!showMethodSelector)} 
              className="glass px-3 py-2 text-amber-400 hover:bg-white/10 transition rounded-lg text-sm flex items-center"
            >
              <i className="fas fa-calculator mr-2"></i>
              <span className="hidden md:inline">
                {language === 'bn' ? 'পদ্ধতি' : 'Method'}
              </span>
            </button>
            
            {/* Offset toggle */}
            <button 
              onClick={toggleOffsets}
              className={`px-3 py-2 rounded-lg transition text-sm flex items-center ${
                useOffsets ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-white/70'
              }`}
            >
              <i className="fas fa-map-pin mr-2"></i>
              {useOffsets 
                ? (language === 'bn' ? 'চালু' : 'On') 
                : (language === 'bn' ? 'বন্ধ' : 'Off')}
            </button>
            
            {/* Refresh button */}
            <button 
              onClick={refreshData}
              className="glass px-3 py-2 text-amber-400 hover:bg-white/10 transition rounded-lg text-sm"
              title={language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
            >
              <i className="fas fa-sync-alt"></i>
            </button>
            
            {/* Location */}
            {userLocation && (
              <div className="glass px-3 py-2 flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-amber-400"></i>
                <span className="text-sm font-medium max-w-[100px] truncate">{userLocation.city}</span>
                <button 
                  onClick={() => setShowCitySearch(true)} 
                  className="text-xs bg-amber-500/20 px-2 py-1 rounded hover:bg-amber-500/30 transition"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Method selector dropdown */}
        <AnimatePresence>
          {showMethodSelector && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 glass p-4 rounded-xl"
            >
              <h3 className="font-bold text-amber-400 mb-3">
                {language === 'bn' ? 'পদ্ধতি নির্বাচন' : 'Calculation Method'}
              </h3>
              <select 
                value={selectedMethod} 
                onChange={(e) => {
                  updateMethod(parseInt(e.target.value));
                  setShowMethodSelector(false);
                }} 
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-400 text-white"
              >
                {Object.entries(methodNames).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Today's info - Only show if data exists */}
        {today && today.sehri12 !== '--:-- --' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="glass p-4 bg-emerald-900/30 rounded-xl text-center">
              <p className="text-sm text-white/50 mb-1 flex items-center justify-center">
                <i className="fas fa-utensils text-emerald-400 mr-2"></i>
                {language === 'bn' ? 'সেহরির শেষ সময়' : 'Sehri Ends'}
              </p>
              <p className="text-3xl font-bold text-emerald-400 font-mono">{today.sehri12}</p>
              <p className="text-xs text-white/30 mt-1">
                {language === 'bn' ? 'ফজরের আগে' : 'Before Fajr'}
              </p>
            </div>
            <div className="glass p-4 bg-orange-900/30 rounded-xl text-center">
              <p className="text-sm text-white/50 mb-1 flex items-center justify-center">
                <i className="fas fa-sunset text-orange-400 mr-2"></i>
                {language === 'bn' ? 'ইফতারের সময়' : 'Iftar Time'}
              </p>
              <p className="text-3xl font-bold text-orange-400 font-mono">{today.iftar12}</p>
              <p className="text-xs text-white/30 mt-1">
                {language === 'bn' ? 'মাগরিবের সময়' : 'At Maghrib'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats Bar */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white/5 p-2 rounded-lg text-center">
            <div className="text-xs text-white/50">{language === 'bn' ? 'মোট দিন' : 'Total Days'}</div>
            <div className="text-lg font-bold text-amber-400">30</div>
          </div>
          <div className="bg-white/5 p-2 rounded-lg text-center">
            <div className="text-xs text-white/50">{language === 'bn' ? 'বর্তমান দিন' : 'Current Day'}</div>
            <div className="text-lg font-bold text-emerald-400">{ramadanData.currentDay || '-'}</div>
          </div>
          <div className="bg-white/5 p-2 rounded-lg text-center">
            <div className="text-xs text-white/50">{language === 'bn' ? 'সেহরি' : 'Sehri'}</div>
            <div className="text-lg font-bold text-emerald-400">{today?.sehri12 || '--:--'}</div>
          </div>
          <div className="bg-white/5 p-2 rounded-lg text-center">
            <div className="text-xs text-white/50">{language === 'bn' ? 'ইফতার' : 'Iftar'}</div>
            <div className="text-lg font-bold text-orange-400">{today?.iftar12 || '--:--'}</div>
          </div>
        </div>

        {/* PDF Export and Info */}
        <div className="flex flex-wrap justify-between items-center mt-4">
          <div className="text-xs text-white/30">
            <i className="fas fa-info-circle mr-1 text-amber-400"></i>
            {language === 'bn' 
              ? `${filteredDays.length} দিন দেখানো হচ্ছে` 
              : `Showing ${filteredDays.length} days`}
          </div>
          <button 
            onClick={exportToPDF} 
            className="px-4 py-2 bg-amber-500 text-[#1a3f54] rounded-lg hover:bg-amber-400 transition font-bold flex items-center gap-2"
          >
            <i className="fas fa-file-pdf"></i>
            <span>{language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* City Search Modal */}
      <AnimatePresence>
        {showCitySearch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCitySearch(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass max-w-md w-full p-6 rounded-xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 text-amber-400 flex items-center">
                <i className="fas fa-search mr-2"></i>
                {language === 'bn' ? 'শহর খুঁজুন' : 'Search City'}
              </h3>
              
              <div className="flex gap-2 mb-4">
                <input 
                  type="text" 
                  value={searchCity} 
                  onChange={(e) => setSearchCity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCityByName()}
                  placeholder={language === 'bn' ? 'শহরের নাম লিখুন' : 'Enter city name'} 
                  className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-400 text-white"
                  disabled={searching} 
                  autoFocus 
                />
                <button 
                  onClick={searchCityByName} 
                  disabled={searching}
                  className="px-6 py-2 bg-amber-500 text-[#1a3f54] rounded-lg hover:bg-amber-400 transition disabled:opacity-50 min-w-[80px]"
                >
                  {searching ? <i className="fas fa-spinner fa-spin"></i> : (language === 'bn' ? 'খুঁজুন' : 'Search')}
                </button>
              </div>
              
              {/* Search Results */}
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
                      <div className="text-xs text-white/30 mt-1">
                        {language === 'bn' ? 'লোড করতে ক্লিক করুন' : 'Click to load data'}
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchCity && !searching && (
                <div className="p-4 bg-yellow-900/30 rounded-lg text-center text-yellow-500">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  {language === 'bn' ? 'কোনো শহর পাওয়া যায়নি' : 'No cities found'}
                </div>
              )}
              
              {/* Popular Cities */}
              {searchResults.length === 0 && !searchCity && (
                <div className="mt-4">
                  <p className="text-sm text-white/50 mb-2">
                    {language === 'bn' ? 'জনপ্রিয় শহর:' : 'Popular Cities:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna'].map(city => (
                      <button
                        key={city}
                        onClick={() => {
                          setSearchCity(city);
                          setTimeout(() => searchCityByName(), 100);
                        }}
                        className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-xs"
                      >
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <button 
                onClick={() => setShowCitySearch(false)} 
                className="mt-6 text-sm text-white/50 hover:text-white w-full"
              >
                {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ramadan Days List */}
      {filteredDays.length > 0 ? (
        <div className="space-y-3">
          {filteredDays.map((day, index) => (
            <motion.div
              key={day.day}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`glass p-4 rounded-xl cursor-pointer transition-all ${
                day.isToday 
                  ? 'border-2 border-amber-500 bg-amber-900/20 shadow-lg shadow-amber-500/10' 
                  : 'hover:border-amber-500/30'
              }`}
              onClick={() => setExpandedDay(expandedDay === day.day ? null : day.day)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    day.isToday 
                      ? 'bg-amber-500 text-[#1a3f54]' 
                      : 'bg-white/10 text-amber-400'
                  }`}>
                    {day.day}
                  </div>
                  <div>
                    <div className="text-sm text-white/50 flex items-center gap-2">
                      <i className="fas fa-calendar-alt text-amber-400 text-xs"></i>
                      {format(day.gregorian, 'dd MMMM yyyy', { locale: language === 'bn' ? bn : enUS })}
                      {day.isToday && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                          {language === 'bn' ? 'আজ' : 'Today'}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/30 flex items-center gap-1">
                      <i className="fas fa-moon text-amber-400"></i>
                      {day.hijriDate || `${day.hijri.day} Ramadan ${day.hijri.year}`}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-white/50 flex items-center justify-end gap-1">
                      <i className="fas fa-utensils text-emerald-400"></i>
                      {language === 'bn' ? 'সেহরি' : 'Sehri'}
                    </div>
                    <div className={`font-mono font-bold ${day.sehri12 !== '--:-- --' ? 'text-emerald-400' : 'text-white/30'}`}>
                      {day.sehri12}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-xs text-white/50 flex items-center justify-end gap-1">
                      <i className="fas fa-sunset text-orange-400"></i>
                      {language === 'bn' ? 'ইফতার' : 'Iftar'}
                    </div>
                    <div className={`font-mono font-bold ${day.iftar12 !== '--:-- --' ? 'text-orange-400' : 'text-white/30'}`}>
                      {day.iftar12}
                    </div>
                  </div>
                  
                  <div className="text-right hidden md:block">
                    <div className="text-xs text-white/50">{language === 'bn' ? 'সময়' : 'Fasting'}</div>
                    <div className={`font-bold ${day.fastingHours !== '--h --m' ? 'text-amber-400' : 'text-white/30'}`}>
                      {day.fastingHours}
                    </div>
                  </div>
                  
                  <div className="text-amber-400">
                    <i className={`fas fa-chevron-${expandedDay === day.day ? 'up' : 'down'} text-xs`}></i>
                  </div>
                </div>
              </div>

              {/* Expanded Details - Removed 24h format */}
              <AnimatePresence>
                {expandedDay === day.day && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/10"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="bg-white/5 p-2 rounded-lg">
                        <div className="text-xs text-white/50">{language === 'bn' ? 'গ্রেগরিয়ান' : 'Gregorian'}</div>
                        <div className="text-sm font-bold">
                          {format(day.gregorian, 'dd MMM yyyy', { locale: language === 'bn' ? bn : enUS })}
                        </div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg">
                        <div className="text-xs text-white/50">{language === 'bn' ? 'বার' : 'Weekday'}</div>
                        <div className="text-sm font-bold">
                          {language === 'bn' ? banglaWeekdays[day.gregorian.getDay()] : day.weekday}
                        </div>
                      </div>
                      <div className="bg-white/5 p-2 rounded-lg">
                        <div className="text-xs text-white/50">{language === 'bn' ? 'রোজার সময়' : 'Fasting Duration'}</div>
                        <div className="text-sm font-bold text-amber-400">{day.fastingHours}</div>
                      </div>
                    </div>
                    
                    {day.isToday && (
                      <div className="mt-3 p-2 bg-amber-500/10 rounded-lg text-center">
                        <p className="text-xs text-amber-400">
                          <i className="fas fa-info-circle mr-1"></i>
                          {language === 'bn' 
                            ? 'আজকের রোজার সময়সূচী' 
                            : "Today's fasting schedule"}
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="glass p-8 text-center">
          <i className="fas fa-calendar-times text-4xl text-white/30 mb-3"></i>
          <p className="text-white/50">
            {language === 'bn' ? 'কোনো দিন পাওয়া যায়নি' : 'No days found'}
          </p>
        </div>
      )}

      {/* Ashra Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-emerald-900/50 to-emerald-900/20 p-4 rounded-xl text-center border border-emerald-500/30"
        >
          <p className="text-xs text-white/50">১-১০</p>
          <p className="text-lg font-bold text-emerald-400">
            {language === 'bn' ? 'প্রথম আশরা' : 'First Ashra'}
          </p>
          <p className="text-xs text-emerald-400/70">
            {language === 'bn' ? 'রহমত' : 'Mercy'}
          </p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-amber-900/50 to-amber-900/20 p-4 rounded-xl text-center border border-amber-500/30"
        >
          <p className="text-xs text-white/50">১১-২০</p>
          <p className="text-lg font-bold text-amber-400">
            {language === 'bn' ? 'দ্বিতীয় আশরা' : 'Second Ashra'}
          </p>
          <p className="text-xs text-amber-400/70">
            {language === 'bn' ? 'মাগফিরাত' : 'Forgiveness'}
          </p>
        </motion.div>
        
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-red-900/50 to-red-900/20 p-4 rounded-xl text-center border border-red-500/30"
        >
          <p className="text-xs text-white/50">২১-৩০</p>
          <p className="text-lg font-bold text-red-400">
            {language === 'bn' ? 'তৃতীয় আশরা' : 'Third Ashra'}
          </p>
          <p className="text-xs text-red-400/70">
            {language === 'bn' ? 'নাজাত' : 'Salvation'}
          </p>
        </motion.div>
      </div>

      {/* Footer Notes */}
      <div className="glass p-4 text-xs text-white/50 rounded-xl">
        <div className="flex flex-wrap gap-4 justify-between">
          <div className="flex items-center gap-2">
            <i className="fas fa-info-circle text-amber-400"></i>
            <span>{language === 'bn' ? 'আপনার অবস্থান অনুযায়ী সময়' : 'Times based on your location'}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-clock text-emerald-400"></i>
            <span>{language === 'bn' ? 'সেহরির সময় খাওয়া শেষ করুন' : 'Stop eating at Sehri time'}</span>
          </div>
          <div className="flex items-center gap-2">
            <i className="fas fa-clock text-orange-400"></i>
            <span>{language === 'bn' ? 'ইফতারের সময় ইফতার করুন' : 'Break fast at Iftar time'}</span>
          </div>
        </div>
        
        {userLocation && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-amber-400/70">
            <i className="fas fa-globe"></i>
            <span className="font-medium">{userLocation.city}, {userLocation.country}</span>
            {useOffsets && (
              <span className="text-xs bg-emerald-600/30 text-emerald-400 px-2 py-0.5 rounded-full ml-2">
                <i className="fas fa-check-circle mr-1"></i>
                {language === 'bn' ? 'স্থানীয় সময়' : 'Local time'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button for quick city change */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        onClick={() => setShowCitySearch(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 rounded-full shadow-lg flex items-center justify-center text-[#1a3f54] hover:bg-amber-400 transition z-40 md:hidden"
      >
        <i className="fas fa-map-marker-alt text-xl"></i>
      </motion.button>
    </motion.div>
  );
};

export default RamadanTable;
