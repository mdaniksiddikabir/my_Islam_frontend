import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getPrayerTimes } from '../../services/prayerService';
import { useLocation } from '../../hooks/useLocations';
import { format, addDays } from 'date-fns';
import { bn, enUS } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import moment from 'moment-hijri';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Register Bangla font for PDF
const registerBanglaFont = (doc) => {
  doc.addFileToVFS('Nikosh.ttf', 'src/Fonts/Nikosh.ttf'); // You'll need to add Bangla font
  doc.addFont('Nikosh.ttf', 'Nikosh', 'normal');
  doc.setFont('Nikosh');
};

const RamadanTable = () => {
  const { language, t } = useLanguage();
  const { location, loading: locationLoading, updateLocation } = useLocation();
  const [ramadanDays, setRamadanDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCitySearch, setShowCitySearch] = useState(false);
  const [todayInfo, setTodayInfo] = useState(null);
  const [ramadanInfo, setRamadanInfo] = useState({
    year: null,
    startDate: null,
    endDate: null,
    currentDay: null
  });

  // Fixed weekday names in English (not changing with language)
  const weekdays = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  const banglaWeekdays = [
    'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
  ];

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
    
    const FORCE_RAMADAN_YEAR = 1446;
    const year = FORCE_RAMADAN_YEAR || hijriYear;
    
    const startOfRamadan = moment().iYear(year).iMonth(8).iDate(1);
    const endOfRamadan = moment().iYear(year).iMonth(8).iDate(30);
    
    setRamadanInfo({
      year: year,
      startDate: startOfRamadan.toDate(),
      endDate: endOfRamadan.toDate(),
      currentDay: today.iMonth() + 1 === 9 ? today.iDate() : 15
    });
  };

  const generateFullTimeTable = async () => {
    try {
      setLoading(true);
      const days = [];
      let todayData = null;
      
      for (let i = 0; i < 30; i++) {
        const currentDate = addDays(ramadanInfo.startDate, i);
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        
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
            sehriTime = calculateDefaultSehri(i);
            iftarTime = calculateDefaultIftar(i);
          }
        } else {
          sehriTime = calculateDefaultSehri(i);
          iftarTime = calculateDefaultIftar(i);
        }

        const sehri12 = convertTo12Hour(sehriTime);
        const iftar12 = convertTo12Hour(iftarTime);
        
        const dayData = {
          day: i + 1,
          gregorianDate: currentDate,
          hijriDate: `${i + 1} Ramadan ${ramadanInfo.year}`,
          weekday: weekdays[currentDate.getDay()], // Fixed English weekday
          shortWeekday: weekdays[currentDate.getDay()].substring(0, 3),
          sehri: sehri12, // Only 12h format with AM/PM
          iftar: iftar12, // Only 12h format with AM/PM
          isToday: i + 1 === ramadanInfo.currentDay,
          isPast: ramadanInfo.currentDay ? i + 1 < ramadanInfo.currentDay : false,
          fastingHours: calculateFastingHours(sehriTime, iftarTime),
        };

        if (dayData.isToday) {
          todayData = dayData;
        }

        days.push(dayData);
      }

      setTodayInfo(todayData);
      setRamadanDays(days);
    } catch (error) {
      console.error('Error generating Ramadan timetable:', error);
      toast.error('Failed to load Ramadan schedule');
    } finally {
      setLoading(false);
    }
  };

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

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Set font based on language
    if (language === 'bn') {
      try {
        registerBanglaFont(doc);
      } catch (e) {
        console.log('Bangla font not available, using default');
      }
    }
    
    // Add title
    doc.setFontSize(18);
    doc.setTextColor(212, 175, 55);
    doc.text(language === 'bn' ? `রমজান ${ramadanInfo.year} - ৩০ দিনের সময়সূচি` : `Ramadan ${ramadanInfo.year} - 30 Days Schedule`, 14, 22);
    
    // Add location and date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const locationText = location ? `${location.city}, ${location.country}` : 'Location not set';
    doc.text(locationText, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
    
    // Prepare table data
    const tableColumn = [
      language === 'bn' ? 'রোজা' : 'Day',
      language === 'bn' ? 'তারিখ' : 'Date',
      language === 'bn' ? 'হিজরি' : 'Hijri',
      language === 'bn' ? 'বার' : 'Weekday',
      language === 'bn' ? 'সেহরি' : 'Sehri',
      language === 'bn' ? 'ইফতার' : 'Iftar',
      language === 'bn' ? 'রোজার সময়' : 'Fasting'
    ];
    
    const tableRows = ramadanDays.map(day => [
      day.day,
      formatDayMonth(day.gregorianDate),
      day.hijriDate,
      language === 'bn' ? banglaWeekdays[new Date(day.gregorianDate).getDay()] : day.weekday,
      day.sehri,
      day.iftar,
      day.fastingHours
    ]);
    
    // Add table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { 
        fontSize: 8,
        font: language === 'bn' ? 'Nikosh' : 'helvetica'
      },
      headStyles: { fillColor: [212, 175, 55], textColor: [26, 63, 84] },
      alternateRowStyles: { fillColor: [240, 240, 240] }
    });
    
    // Save PDF
    doc.save(`Ramadan-${ramadanInfo.year}-Schedule.pdf`);
    toast.success(language === 'bn' ? 'পিডিএফ ডাউনলোড হয়েছে' : 'PDF downloaded successfully');
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
      locationError: 'Could not get your location. Using default times.',
      refreshLocation: 'Refresh',
      todaysSchedule: 'Today\'s Schedule',
      sehriTime: 'Sehri Time',
      iftarTime: 'Iftar Time',
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
      locationError: 'আপনার অবস্থান পাওয়া যায়নি। ডিফল্ট সময় ব্যবহার করা হচ্ছে।',
      refreshLocation: 'রিফ্রেশ',
      todaysSchedule: 'আজকের সময়সূচি',
      sehriTime: 'সেহরির সময়',
      iftarTime: 'ইফতারের সময়',
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
          </div>
        </div>

        {/* Today's Highlight - Before Table */}
        {todayInfo && (
          <div className="mt-6 glass p-6 bg-[#d4af37]/20 border-2 border-[#d4af37]">
            <h3 className="text-xl font-bold text-[#d4af37] mb-4 flex items-center gap-2">
              <i className="fas fa-star"></i>
              {txt.todaysSchedule}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50 mb-1">{txt.sehriTime}</p>
                <p className="text-3xl font-bold text-emerald-400">{todayInfo.sehri}</p>
                <p className="text-xs text-white/30 mt-1">{txt.sehriNote}</p>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <p className="text-sm text-white/50 mb-1">{txt.iftarTime}</p>
                <p className="text-3xl font-bold text-orange-400">{todayInfo.iftar}</p>
                <p className="text-xs text-white/30 mt-1">{txt.iftarNote}</p>
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
          >
            <i className="fas fa-file-pdf"></i>
            {txt.downloadPDF}
          </button>
        </div>
      </div>

      {/* City Search Modal */}
      {showCitySearch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="glass max-w-md w-full p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">{txt.searchCity}</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchCityByName()}
                placeholder="Dhaka, Chittagong, etc."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
              />
              <button
                onClick={searchCityByName}
                className="px-6 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition"
              >
                {txt.search}
              </button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((city, index) => (
                  <button
                    key={index}
                    onClick={() => selectCity(city)}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition"
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => setShowCitySearch(false)}
              className="mt-4 text-sm text-white/50 hover:text-white"
            >
              Cancel
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
              >
                <td className="py-3 px-2 font-bold text-[#d4af37]">{day.day}</td>
                <td className="py-3 px-2">{formatDayMonth(day.gregorianDate)}</td>
                <td className="py-3 px-2">{day.hijriDate}</td>
                <td className="py-3 px-2">
                  {language === 'bn' ? banglaWeekdays[new Date(day.gregorianDate).getDay()] : day.weekday}
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
      </div>
    </motion.div>
  );
};

export default RamadanTable;
