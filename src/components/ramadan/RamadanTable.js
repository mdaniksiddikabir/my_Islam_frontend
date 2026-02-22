import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations'; // Fixed import path
import { format, addDays } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import moment from 'moment-hijri';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location, loading: locationLoading, error: locationError, updateLocation } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [ramadanInfo, setRamadanInfo] = useState({
    year: null,
    startDate: null,
    endDate: null,
    currentDay: null
  });

  useEffect(() => {
    initializeRamadan();
  }, []);

  useEffect(() => {
    if (ramadanInfo.startDate && location) {
      generateFullTimeTable();
    }
  }, [ramadanInfo, location]);

  const initializeRamadan = () => {
    const today = moment();
    const hijriMonth = today.iMonth() + 1;
    const hijriYear = today.iYear();
    
    // For demo/development, you can set a specific year
    const FORCE_RAMADAN_YEAR = 1446; // Set to desired year for testing
    
    // Use either current date or forced year
    const year = FORCE_RAMADAN_YEAR || hijriYear;
    
    // Calculate Ramadan dates for the year
    const startOfRamadan = moment().iYear(year).iMonth(8).iDate(1);
    const endOfRamadan = moment().iYear(year).iMonth(8).iDate(30);
    
    setRamadanInfo({
      year: year,
      startDate: startOfRamadan.toDate(),
      endDate: endOfRamadan.toDate(),
      currentDay: today.iMonth() + 1 === 9 ? today.iDate() : 15 // Default to 15 for demo
    });
  };

  const generateFullTimeTable = async () => {
    try {
      setLoading(true);
      const days = [];
      
      // Generate all 30 days of Ramadan
      for (let i = 0; i < 30; i++) {
        const currentDate = addDays(ramadanInfo.startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
        // Get prayer times for this date
        let sehriTime = '--:--';
        let iftarTime = '--:--';
        
        if (location) {
          try {
            const prayerData = await getPrayerTimes(
              location.lat,
              location.lng,
              4,
              dateStr
            );
            sehriTime = prayerData?.timings?.Fajr || '--:--';
            iftarTime = prayerData?.timings?.Maghrib || '--:--';
          } catch (error) {
            console.log(`Using default times for day ${i + 1}`);
            // Set default times for demo
            sehriTime = calculateDefaultSehri(i);
            iftarTime = calculateDefaultIftar(i);
          }
        } else {
          // Set default times for demo when no location
          sehriTime = calculateDefaultSehri(i);
          iftarTime = calculateDefaultIftar(i);
        }

        const dayData = {
          day: i + 1,
          gregorianDate: currentDate,
          hijriDate: `${i + 1} Ramadan ${ramadanInfo.year}`,
          weekday: format(currentDate, 'EEEE', { 
            locale: language === 'bn' ? bn : enUS 
          }),
          shortWeekday: format(currentDate, 'EEE', {
            locale: language === 'bn' ? bn : enUS
          }),
          sehri24: sehriTime,
          iftar24: iftarTime,
          sehri12: convertTo12Hour(sehriTime),
          iftar12: convertTo12Hour(iftarTime),
          isToday: i + 1 === ramadanInfo.currentDay,
          isPast: ramadanInfo.currentDay ? i + 1 < ramadanInfo.currentDay : false,
          isFuture: ramadanInfo.currentDay ? i + 1 > ramadanInfo.currentDay : true,
          fastingHours: calculateFastingHours(sehriTime, iftarTime),
        };

        days.push(dayData);
      }

      setRamadanDays(days);
    } catch (error) {
      console.error('Error generating Ramadan timetable:', error);
      toast.error('Failed to load Ramadan schedule');
    } finally {
      setLoading(false);
    }
  };

  // Default time calculators for demo
  const calculateDefaultSehri = (day) => {
    const baseHour = 5;
    const baseMinute = 0;
    const totalMinutes = (baseHour * 60 + baseMinute) - day * 2;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const calculateDefaultIftar = (day) => {
    const baseHour = 18;
    const baseMinute = 15;
    const totalMinutes = (baseHour * 60 + baseMinute) + day * 1;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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

  const formatDate = (date) => {
    if (!date) return '';
    return format(date, 'dd MMM yyyy', {
      locale: language === 'bn' ? bn : enUS
    });
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchCity)}&limit=5`
      );
      const data = await response.json();
      
      setSearchResults(data.map(item => ({
        name: item.display_name.split(',')[0],
        fullName: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      })));
    } catch (error) {
      console.error('Error searching city:', error);
      toast.error('City search failed');
    }
  };

  const selectCity = (city) => {
    updateLocation(city);
    setShowCitySearch(false);
    setSearchCity('');
    setSearchResults([]);
    toast.success(`Location updated to ${city.name}`);
  };

  // PDF Export function
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55);
    doc.text(txt.title, 14, 22);
    
    // Add location and date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const locationText = location ? `${location.city}, ${location.country}` : 'Location not set';
    doc.text(locationText, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    
    // Prepare table data
    const tableColumn = [
      'Day',
      'Date',
      'Hijri',
      'Day',
      'Sehri',
      'Iftar',
      'Fasting'
    ];
    
    const tableRows = ramadanDays.map(day => [
      day.day,
      formatDayMonth(day.gregorianDate),
      day.hijriDate,
      day.shortWeekday,
      `${day.sehri24} (${day.sehri12})`,
      `${day.iftar24} (${day.iftar12})`,
      day.fastingHours
    ]);
    
    // Add table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [212, 175, 55], textColor: [26, 63, 84] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Save PDF
    doc.save(`Ramadan-${ramadanInfo.year}-Schedule.pdf`);
    toast.success('PDF downloaded successfully');
  };

  const translations = {
    en: {
      title: `Ramadan ${ramadanInfo.year} - 30 Days Time Table`,
      subtitle: 'Complete Sehri & Iftar Schedule',
      day: 'Day',
      date: 'Date',
      hijri: 'Hijri',
      gregorian: 'Gregorian',
      weekday: 'Day',
      sehri: 'Sehri',
      iftar: 'Iftar',
      fasting: 'Fasting',
      today: 'Today',
      past: 'Completed',
      future: 'Upcoming',
      downloadPDF: 'Download PDF',
      print: 'Print Table',
      location: 'Location',
      notes: 'Times are based on your location',
      sehriNote: 'Stop eating 10-15 minutes before Sehri time',
      iftarNote: 'Break fast exactly at Iftar time',
      day1to10: 'First Ashra (Mercy)',
      day11to20: 'Second Ashra (Forgiveness)',
      day21to30: 'Third Ashra (Salvation)',
      changeCity: 'Change City',
      searchCity: 'Search for your city',
      search: 'Search',
      currentLocation: 'Using your current location',
      locationError: 'Could not get your location. Using default times.',
      refreshLocation: 'Refresh Location',
      am: 'AM',
      pm: 'PM',
      format24h: '24h',
      format12h: '12h',
    },
    bn: {
      title: `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি`,
      subtitle: 'সম্পূর্ণ সেহরি ও ইফতার সময়সূচি',
      day: 'রোজা',
      date: 'তারিখ',
      hijri: 'হিজরি',
      gregorian: 'ইংরেজি',
      weekday: 'বার',
      sehri: 'সেহরি',
      iftar: 'ইফতার',
      fasting: 'রোজার সময়',
      today: 'আজ',
      past: 'সম্পন্ন',
      future: 'আসছে',
      downloadPDF: 'পিডিএফ ডাউনলোড',
      print: 'প্রিন্ট',
      location: 'অবস্থান',
      notes: 'সময় আপনার অবস্থান অনুযায়ী',
      sehriNote: 'সেহরি সময়ের ১০-১৫ মিনিট আগে খাওয়া শেষ করুন',
      iftarNote: 'ঠিক ইফতার সময়ে ইফতার করুন',
      day1to10: 'প্রথম আশরা (রহমত)',
      day11to20: 'দ্বিতীয় আশরা (মাগফিরাত)',
      day21to30: 'তৃতীয় আশরা (নাজাত)',
      changeCity: 'শহর পরিবর্তন',
      searchCity: 'আপনার শহর খুঁজুন',
      search: 'অনুসন্ধান',
      currentLocation: 'আপনার বর্তমান অবস্থান ব্যবহার করা হচ্ছে',
      locationError: 'আপনার অবস্থান পাওয়া যায়নি। ডিফল্ট সময় ব্যবহার করা হচ্ছে।',
      refreshLocation: 'অবস্থান রিফ্রেশ',
      am: 'পূর্বাহ্ন',
      pm: 'অপরাহ্ন',
      format24h: '২৪ঘ',
      format12h: '১২ঘ',
    }
  };

  const txt = translations[language] || translations.en;

  if (loading || locationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <i className="fas fa-moon text-4xl text-[#d4af37] animate-pulse mb-4"></i>
          <p className="text-white/70">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with Location Controls */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#d4af37] mb-2">
              🌙 {txt.title}
            </h1>
            <p className="text-white/80">{txt.subtitle}</p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {/* Location Display */}
            {location ? (
              <div className="glass px-4 py-2 flex items-center gap-3">
                <i className="fas fa-map-marker-alt text-[#d4af37]"></i>
                <span>{location.city}, {location.country}</span>
                <button
                  onClick={() => setShowCitySearch(!showCitySearch)}
                  className="text-xs bg-[#d4af37]/20 px-2 py-1 rounded hover:bg-[#d4af37]/30 transition"
                >
                  {txt.changeCity}
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs bg-emerald-500/20 px-2 py-1 rounded hover:bg-emerald-500/30 transition"
                  title={txt.refreshLocation}
                >
                  <i className="fas fa-sync-alt"></i>
                </button>
              </div>
            ) : (
              <div className="glass px-4 py-2 text-yellow-400">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {txt.locationError}
                <button
                  onClick={() => setShowCitySearch(true)}
                  className="ml-2 text-xs bg-[#d4af37]/20 px-2 py-1 rounded hover:bg-[#d4af37]/30 transition"
                >
                  {txt.searchCity}
                </button>
              </div>
            )}

            {/* City Search Modal */}
            {showCitySearch && (
              <div className="absolute top-20 right-4 w-80 glass p-4 rounded-lg shadow-xl z-50">
                <h3 className="text-lg font-bold mb-2">{txt.searchCity}</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchCityByName()}
                    placeholder="Dhaka, Chittagong, etc."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
                  />
                  <button
                    onClick={searchCityByName}
                    className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition"
                  >
                    {txt.search}
                  </button>
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    {searchResults.map((city, index) => (
                      <button
                        key={index}
                        onClick={() => selectCity(city)}
                        className="w-full text-left p-2 hover:bg-white/10 rounded transition"
                      >
                        {city.name}
                      </button>
                    ))}
                  </div>
                )}
                
                <button
                  onClick={() => setShowCitySearch(false)}
                  className="mt-2 text-sm text-white/50 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

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
          >
            <i className="fas fa-file-pdf"></i>
            {txt.downloadPDF}
          </button>
        </div>
      </div>

      {/* Full Time Table */}
      <div className="glass p-6 overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-3 px-2 text-left text-[#d4af37]">#</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.gregorian}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.hijri}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.weekday}</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.sehri} (24h)</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.sehri} (12h)</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.iftar} (24h)</th>
              <th className="py-3 px-2 text-left text-[#d4af37]">{txt.iftar} (12h)</th>
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
                onClick={() => console.log('Selected day:', day)}
              >
                <td className="py-3 px-2 font-bold text-[#d4af37]">{day.day}</td>
                <td className="py-3 px-2">{formatDayMonth(day.gregorianDate)}</td>
                <td className="py-3 px-2">{day.hijriDate}</td>
                <td className="py-3 px-2">{day.shortWeekday}</td>
                <td className="py-3 px-2 font-mono text-emerald-400">{day.sehri24}</td>
                <td className="py-3 px-2 font-mono text-emerald-400/70">{day.sehri12}</td>
                <td className="py-3 px-2 font-mono text-orange-400">{day.iftar24}</td>
                <td className="py-3 px-2 font-mono text-orange-400/70">{day.iftar12}</td>
                <td className="py-3 px-2 text-[#d4af37]">{day.fastingHours}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Today's Highlight */}
      {ramadanInfo.currentDay && ramadanDays[ramadanInfo.currentDay - 1] && (
        <div className="glass p-4 bg-[#d4af37]/10">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🌙</div>
            <div>
              <p className="text-sm text-white/50">{txt.today}</p>
              <p className="text-xl font-bold text-[#d4af37]">
                Day {ramadanInfo.currentDay} of 30
              </p>
              <p className="text-sm text-white/70">
                {ramadanDays[ramadanInfo.currentDay - 1].sehri12} - {ramadanDays[ramadanInfo.currentDay - 1].iftar12}
              </p>
            </div>
          </div>
        </div>
      )}

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
      </div>
    </motion.div>
  );
};

export default RamadanTable;
