import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { useLocation } from '../../hooks/useLocations';
import hijriService from '../../services/hijriService';
import citySearchService from '../../services/citySearchService';
import { format } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { fontNikoshBold } from '../../Fonts/Nikosh-bold.js';

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location: userLocation, loading: locationLoading, updateLocation } = useLocation();
  const [ramadanData, setRamadanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState(4); // Default Umm Al-Qura
  const [useOffsets, setUseOffsets] = useState(false);
  const [showMethodSelector, setShowMethodSelector] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

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

  useEffect(() => {
    if (userLocation) {
      loadRamadanData();
    }
  }, [userLocation, selectedMethod, useOffsets]);

  const loadRamadanData = async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      
      const toastId = toast.loading(
        language === 'bn' ? '📅 রমজান ক্যালেন্ডার তৈরি হচ্ছে...' : '📅 Generating Ramadan calendar...'
      );
      
      // ✅ Get complete data from hijriService (includes offsets)
      const data = await hijriService.getCompleteRamadanData(
        userLocation,
        selectedMethod,
        useOffsets
      );
      
      setRamadanData(data);
      
      toast.success(
        language === 'bn' ? '✅ ক্যালেন্ডার লোড সম্পন্ন' : '✅ Calendar loaded successfully', 
        { id: toastId }
      );
      
    } catch (error) {
      console.error('Error loading Ramadan data:', error);
      toast.error(
        language === 'bn' ? '❌ ডেটা লোড করতে সমস্যা হয়েছে' : '❌ Failed to load data'
      );
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
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
    toast.success(
      language === 'bn' ? `📍 ${city.name} নির্বাচিত হয়েছে` : `📍 ${city.name} selected`
    );
  };

  const exportToPDF = () => {
    if (!ramadanData?.days) return;
    
    try {
      const loadingToast = toast.loading(
        language === 'bn' ? '📄 পিডিএফ তৈরি হচ্ছে...' : '📄 Generating PDF...'
      );
      
      const doc = new jsPDF();
      
      if (language === 'bn') {
        try {
          doc.addFileToVFS('Nikosh-bold.ttf', fontNikoshBold);
          doc.addFont('Nikosh-bold.ttf', 'Nikosh', 'bold');
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
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      doc.text(`${language === 'bn' ? 'অবস্থান' : 'Location'}: ${userLocation?.city}, ${userLocation?.country}`, 20, yPos);
      yPos += 6;
      doc.text(`Method: ${methodNames[selectedMethod]}`, 20, yPos);
      yPos += 6;
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
      yPos += 10;
      
      // Table headers
      const headers = language === 'bn' 
        ? ['রোজা', 'তারিখ', 'হিজরি', 'বার', 'সেহরি', 'ইফতার', 'সময়']
        : ['Day', 'Date', 'Hijri', 'Day', 'Sehri', 'Iftar', 'Fasting'];
      
      const rows = ramadanData.days.map(day => {
        if (language === 'bn') {
          return [
            day.day.toString(),
            format(day.gregorian, 'dd MMM', { locale: bn }),
            `${day.hijri.day} Ramadan ${day.hijri.year}`,
            banglaWeekdays[day.gregorian.getDay()],
            day.sehri12,
            day.iftar12,
            day.fastingHours
          ];
        } else {
          return [
            day.day.toString(),
            format(day.gregorian, 'dd MMM', { locale: enUS }),
            `${day.hijri.day} Ramadan ${day.hijri.year}`,
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

  const today = ramadanData?.days?.find(day => day.isToday);

  if (loading || locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-moon text-5xl text-[#d4af37] animate-pulse mb-4"></i>
          <p className="text-xl text-white/70 mb-2">
            {language === 'bn' ? 'লোড হচ্ছে...' : 'Loading...'}
          </p>
          <p className="text-sm text-white/50">{loadingProgress}%</p>
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
            <h1 className="text-2xl md:text-3xl font-bold text-amber-400 mb-2">
              🌙 {language === 'bn' ? `রমজান ${ramadanData?.year} - ৩০ দিনের সময়সূচি` : `Ramadan ${ramadanData?.year} - 30 Days Schedule`}
            </h1>
            <p className="text-sm md:text-base text-white/70">
              {language === 'bn' ? 'সেহরি ও ইফতার সময়' : 'Sehri & Iftar Times'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Method selector */}
            <button 
              onClick={() => setShowMethodSelector(!showMethodSelector)} 
              className="glass px-3 py-2 text-amber-400 hover:bg-white/10 transition rounded-lg text-sm"
            >
              <i className="fas fa-calculator mr-2"></i>
              <span className="hidden md:inline">
                {language === 'bn' ? 'পদ্ধতি' : 'Method'}
              </span>
            </button>
            
            {/* Offset toggle */}
            <button 
              onClick={() => setUseOffsets(!useOffsets)}
              className={`px-3 py-2 rounded-lg transition text-sm ${
                useOffsets ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-white/70'
              }`}
            >
              <i className="fas fa-map-pin mr-2"></i>
              {useOffsets 
                ? (language === 'bn' ? 'চালু' : 'On') 
                : (language === 'bn' ? 'বন্ধ' : 'Off')}
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
        {showMethodSelector && (
          <div className="mt-4 glass p-4 rounded-xl">
            <h3 className="font-bold text-amber-400 mb-3">
              {language === 'bn' ? 'পদ্ধতি' : 'Calculation Method'}
            </h3>
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
        {today && today.sehri12 !== '--:-- --' && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="glass p-4 bg-emerald-900/30 rounded-xl text-center">
              <p className="text-sm text-white/50 mb-1">
                {language === 'bn' ? 'সেহরি' : 'Sehri'}
              </p>
              <p className="text-2xl font-bold text-emerald-400">{today.sehri12}</p>
            </div>
            <div className="glass p-4 bg-orange-900/30 rounded-xl text-center">
              <p className="text-sm text-white/50 mb-1">
                {language === 'bn' ? 'ইফতার' : 'Iftar'}
              </p>
              <p className="text-2xl font-bold text-orange-400">{today.iftar12}</p>
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
            <span>{language === 'bn' ? 'পিডিএফ ডাউনলোড' : 'Download PDF'}</span>
          </button>
        </div>
      </div>

      {/* City Search Modal */}
      {showCitySearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass max-w-md w-full p-6 rounded-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 text-amber-400">
              {language === 'bn' ? 'শহর খুঁজুন' : 'Search City'}
            </h3>
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={searchCity} 
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCityByName()}
                placeholder={language === 'bn' ? 'শহরের নাম' : 'City name'} 
                className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg focus:border-amber-400 text-white"
                disabled={searching} 
                autoFocus 
              />
              <button 
                onClick={searchCityByName} 
                disabled={searching}
                className="px-6 py-2 bg-amber-500 text-[#1a3f54] rounded-lg hover:bg-amber-400 transition disabled:opacity-50"
              >
                {searching ? <i className="fas fa-spinner fa-spin"></i> : (language === 'bn' ? 'খুঁজুন' : 'Search')}
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
              {language === 'bn' ? 'বন্ধ' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Ramadan Days List */}
      {ramadanData?.days && (
        <div className="space-y-3">
          {ramadanData.days.map((day, index) => (
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
                      {format(day.gregorian, 'dd MMM', { locale: language === 'bn' ? bn : enUS })}
                    </div>
                    <div className="text-xs text-white/30">
                      {day.hijri.day} Ramadan {day.hijri.year}
                    </div>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="text-right">
                    <div className="text-xs text-white/50">
                      {language === 'bn' ? 'সেহরি' : 'Sehri'}
                    </div>
                    <div className={`font-mono font-bold ${day.sehri12 !== '--:-- --' ? 'text-emerald-400' : 'text-white/30'}`}>
                      {day.sehri12}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/50">
                      {language === 'bn' ? 'ইফতার' : 'Iftar'}
                    </div>
                    <div className={`font-mono font-bold ${day.iftar12 !== '--:-- --' ? 'text-orange-400' : 'text-white/30'}`}>
                      {day.iftar12}
                    </div>
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-white/50">
                      {language === 'bn' ? 'সময়' : 'Fasting'}
                    </div>
                    <div className={`font-bold ${day.fastingHours !== '--h --m' ? 'text-amber-400' : 'text-white/30'}`}>
                      {day.fastingHours}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ashra Sections */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-900/30 p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">1-10</p>
          <p className="text-sm font-bold text-emerald-400">
            {language === 'bn' ? 'প্রথম আশরা (রহমত)' : 'First Ashra (Mercy)'}
          </p>
        </div>
        <div className="bg-amber-900/30 p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">11-20</p>
          <p className="text-sm font-bold text-amber-400">
            {language === 'bn' ? 'দ্বিতীয় আশরা (মাগফিরাত)' : 'Second Ashra (Forgiveness)'}
          </p>
        </div>
        <div className="bg-red-900/30 p-3 rounded-lg text-center">
          <p className="text-xs text-white/50">21-30</p>
          <p className="text-sm font-bold text-red-400">
            {language === 'bn' ? 'তৃতীয় আশরা (নাজাত)' : 'Third Ashra (Salvation)'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default RamadanTable;
