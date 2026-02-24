import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getPrayerTimes, getCalculationMethods } from '../services/prayerService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const PrayerPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [methods, setMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(4);
  const [citySearch, setCitySearch] = useState('');
  const [nextPrayer, setNextPrayer] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
  const [nearbyMosques, setNearbyMosques] = useState([]);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadMethods();
    detectLocation();
  }, []);

  useEffect(() => {
    if (location) {
      loadPrayerTimes();
    }
  }, [location, selectedMethod, selectedDate]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          // Get city name from coordinates
          reverseGeocode(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Location error:', error);
          // Default to Dhaka
          setLocation({ lat: 23.8103, lng: 90.4125, city: 'ঢাকা' });
          toast.error(t('errors.location'));
        }
      );
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=${currentLanguage}`
      );
      const data = await response.json();
      setLocation(prev => ({
        ...prev,
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country
      }));
    } catch (error) {
      console.error('Reverse geocode error:', error);
    }
  };

  const loadMethods = async () => {
    try {
      const data = await getCalculationMethods();
      setMethods(data);
    } catch (error) {
      console.error('Error loading methods:', error);
    }
  };

  const loadPrayerTimes = async () => {
    try {
      setLoading(true);
      const data = await getPrayerTimes(
        location.lat, 
        location.lng, 
        selectedMethod,
        selectedDate
      );
      setPrayerTimes(data);
      calculateNextPrayer(data.timings);
    } catch (error) {
      console.error('Error loading prayer times:', error);
      toast.error(t('errors.prayerTimes'));
    } finally {
      setLoading(false);
    }
  };

  const calculateNextPrayer = (timings) => {
    const now = currentTime;
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTotal = currentHours * 60 + currentMinutes;
    
    const prayers = [
      { name: 'Fajr', time: timings.Fajr, arabic: 'الفجر', bangla: 'ফজর' },
      { name: 'Sunrise', time: timings.Sunrise, arabic: 'الشروق', bangla: 'সূর্যোদয়' },
      { name: 'Dhuhr', time: timings.Dhuhr, arabic: 'الظهر', bangla: 'যোহর' },
      { name: 'Asr', time: timings.Asr, arabic: 'العصر', bangla: 'আসর' },
      { name: 'Maghrib', time: timings.Maghrib, arabic: 'المغرب', bangla: 'মাগরিব' },
      { name: 'Isha', time: timings.Isha, arabic: 'العشاء', bangla: 'ইশা' }
    ];

    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':');
      const prayerTotal = parseInt(hours) * 60 + parseInt(minutes);
      
      if (prayerTotal > currentTotal) {
        setNextPrayer(prayers[i]);
        
        // Calculate progress
        const prevPrayer = i > 0 ? prayers[i-1] : prayers[prayers.length-1];
        const [prevHours, prevMinutes] = prevPrayer.time.split(':');
        const prevTotal = parseInt(prevHours) * 60 + parseInt(prevMinutes);
        
        const total = prayerTotal > prevTotal 
          ? prayerTotal - prevTotal 
          : (24 * 60 - prevTotal) + prayerTotal;
        
        const elapsed = currentTotal > prevTotal 
          ? currentTotal - prevTotal 
          : (24 * 60 - prevTotal) + currentTotal;
        
        setProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)));
        
        return;
      }
    }
    
    // Next day Fajr
    setNextPrayer(prayers[0]);
    setProgress(0);
  };

  const searchCity = async () => {
    if (!citySearch.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&limit=1&accept-language=${currentLanguage}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        setLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          city: data[0].display_name.split(',')[0]
        });
        toast.success(t('location.updated'));
        setCitySearch('');
      } else {
        toast.error(t('errors.cityNotFound'));
      }
    } catch (error) {
      console.error('Error searching city:', error);
      toast.error(t('errors.searchFailed'));
    }
  };

  const getTimeRemaining = (prayerTime) => {
    const now = currentTime;
    const [hours, minutes] = prayerTime.split(':');
    const prayerDate = new Date(now);
    prayerDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    if (now > prayerDate) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const diff = prayerDate - now;
    
    if (diff < 0) return '00:00:00';
    
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
  };

  const formatBanglaNumber = (num) => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, d => banglaDigits[d]);
  };

  const getPrayerName = (prayer) => {
    if (currentLanguage === 'bn') {
      const names = {
        Fajr: 'ফজর',
        Sunrise: 'সূর্যোদয়',
        Dhuhr: 'যোহর',
        Asr: 'আসর',
        Maghrib: 'মাগরিব',
        Isha: 'ইশা'
      };
      return names[prayer] || prayer;
    }
    return prayer;
  };

  const getIslamicDate = () => {
    if (!prayerTimes?.hijri) return '';
    const { day, month, year } = prayerTimes.hijri;
    if (currentLanguage === 'bn') {
      return `${formatBanglaNumber(day)} ${t(`months.hijri.${month}`)} ${formatBanglaNumber(year)} হিজরি`;
    }
    return `${day} ${month} ${year} AH`;
  };

  const changeDate = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  if (loading) return <Loader message={t('common.loading')} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header with Islamic Date */}
      <div className="glass p-6 bg-gradient-to-r from-[#d4af37]/20 to-transparent">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-[#d4af37] flex items-center">
              <i className="fas fa-clock mr-3"></i>
              {t('prayer.times')}
            </h1>
            <p className="text-white/70 font-bangla">{t('prayer.subtitle')}</p>
          </div>
          {prayerTimes?.hijri && (
            <div className="mt-2 md:mt-0 glass px-4 py-2">
              <i className="fas fa-calendar-alt text-[#d4af37] mr-2"></i>
              <span className="text-[#d4af37]">{getIslamicDate()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Date Navigation */}
      <div className="glass p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="text-center">
            <div className="text-lg font-bold text-[#d4af37]">
              {selectedDate.toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="text-sm text-white/50">
              {selectedDate.toDateString() === new Date().toDateString() 
                ? `📅 ${t('common.today')}` 
                : ''}
            </div>
          </div>
          
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            disabled={selectedDate.toDateString() === new Date().toDateString()}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      {/* Location and Method */}
      <div className="glass p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div>
            <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
              <i className="fas fa-map-marker-alt mr-2"></i>
              {t('location.current')}
            </h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCity()}
                  placeholder={t('location.searchPlaceholder')}
                  className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
                  dir={currentLanguage === 'bn' ? 'auto' : 'ltr'}
                />
                <button
                  onClick={searchCity}
                  className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-bold flex items-center">
                  <i className="fas fa-city text-[#d4af37] mr-2"></i>
                  {location?.city || t('common.loading')}
                  {location?.country && <span className="text-sm text-white/50 ml-2">({location.country})</span>}
                </p>
                <p className="text-sm text-white/50 mt-1">
                  {currentLanguage === 'bn' 
                    ? `${formatBanglaNumber(location?.lat?.toFixed(4))}, ${formatBanglaNumber(location?.lng?.toFixed(4))}`
                    : `${location?.lat?.toFixed(4)}, ${location?.lng?.toFixed(4)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Method */}
          <div>
            <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
              <i className="fas fa-calculator mr-2"></i>
              {t('prayer.calculationMethod')}
            </h3>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
            >
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {currentLanguage === 'bn' ? method.nameBn || method.name : method.name}
                </option>
              ))}
            </select>
            
            {/* View Mode Toggle */}
            <div className="mt-4">
              <div className="flex gap-2">
                {['daily', 'weekly', 'monthly'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`flex-1 px-3 py-2 rounded-lg transition ${
                      viewMode === mode 
                        ? 'bg-[#d4af37] text-[#1a3f54]' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    {t(`prayer.${mode}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Prayer with Live Counter */}
      {nextPrayer && (
        <motion.div 
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          className="glass p-6 text-center bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30"
        >
          <p className="text-lg text-white/70 mb-2 font-bangla flex items-center justify-center">
            <i className="fas fa-hourglass-half text-[#d4af37] mr-2 animate-pulse"></i>
            {t('prayer.next')}
          </p>
          <h2 className="text-4xl md:text-5xl font-bold text-[#d4af37] mb-2">
            {getPrayerName(nextPrayer.name)}
          </h2>
          <p className="text-3xl md:text-4xl mb-4 font-mono">{nextPrayer.time}</p>
          
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">{t('prayer.timeRemaining')}</span>
              <span className="text-[#d4af37] font-mono text-xl">
                {getTimeRemaining(nextPrayer.time)}
              </span>
            </div>
            
            <div className="progress-bar h-3">
              <div 
                className="progress-fill h-full" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <p className="text-xs text-white/30 mt-2">
              {nextPrayer.name === 'Sunrise' 
                ? t('prayer.sunriseNote') 
                : t('prayer.nextNote')}
            </p>
          </div>
        </motion.div>
      )}

      {/* All Prayer Times */}
      {prayerTimes && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
            <i className="fas fa-list mr-2"></i>
            {t('prayer.allTimes')}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => {
              const isNext = nextPrayer?.name === prayer;
              const isSunrise = prayer === 'Sunrise';
              
              return (
                <motion.div
                  key={prayer}
                  whileHover={{ scale: 1.05 }}
                  className={`prayer-card p-4 text-center rounded-lg transition-all ${
                    isNext 
                      ? 'bg-gradient-to-br from-[#d4af37]/30 to-transparent border-2 border-[#d4af37]' 
                      : 'bg-white/5 hover:bg-white/10'
                  } ${isSunrise ? 'opacity-80' : ''}`}
                >
                  <div className="text-sm text-white/70 mb-2 font-bangla flex items-center justify-center">
                    {isNext && <i className="fas fa-arrow-right text-[#d4af37] mr-1 text-xs"></i>}
                    {getPrayerName(prayer)}
                    {prayer === 'Sunrise' && (
                      <i className="fas fa-sun text-yellow-500 ml-1 text-xs"></i>
                    )}
                  </div>
                  <div className="text-2xl font-bold text-[#d4af37] font-mono">
                    {prayerTimes.timings[prayer]}
                  </div>
                  {isNext && (
                    <div className="text-xs text-[#d4af37] mt-1 animate-pulse">
                      ⏰ {t('prayer.next')}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ramadan Special Section */}
      {prayerTimes?.isRamadan && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 bg-gradient-to-r from-emerald-900/20 to-transparent border border-emerald-500/30"
        >
          <h3 className="text-xl mb-4 text-emerald-400 flex items-center">
            <i className="fas fa-moon mr-2"></i>
            🌙 {t('ramadan.title')} 🌙
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <div className="text-sm text-white/70 mb-2 font-bangla flex items-center justify-center">
                <i className="fas fa-sunset text-orange-400 mr-2"></i>
                {t('ramadan.iftar')}
              </div>
              <div className="text-3xl font-bold text-emerald-400 font-mono">
                {prayerTimes.timings.Maghrib}
              </div>
              <div className="text-xs text-white/30 mt-2">
                {t('ramadan.iftarDesc')}
              </div>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <div className="text-sm text-white/70 mb-2 font-bangla flex items-center justify-center">
                <i className="fas fa-cloud-moon text-blue-400 mr-2"></i>
                {t('ramadan.suhoor')}
              </div>
              <div className="text-3xl font-bold text-blue-400 font-mono">
                {prayerTimes.timings.Fajr}
              </div>
              <div className="text-xs text-white/30 mt-2">
                {t('ramadan.suhoorDesc')}
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-[#d4af37]/10 rounded-lg text-center">
            <p className="text-sm text-[#d4af37]">
              <i className="fas fa-info-circle mr-1"></i>
              {t('ramadan.note')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Prayer Times Table */}
      {viewMode !== 'daily' && prayerTimes?.weekly && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37]">
            <i className="fas fa-calendar-week mr-2"></i>
            {viewMode === 'weekly' ? t('prayer.weekly') : t('prayer.monthly')}
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[#d4af37] border-b border-white/10">
                  <th className="py-2 text-left">{t('common.date')}</th>
                  <th className="py-2">ফজর</th>
                  <th className="py-2">যোহর</th>
                  <th className="py-2">আসর</th>
                  <th className="py-2">মাগরিব</th>
                  <th className="py-2">ইশা</th>
                </tr>
              </thead>
              <tbody>
                {prayerTimes.weekly?.map((day, index) => (
                  <tr key={index} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2">
                      {new Date(day.date).toLocaleDateString(currentLanguage === 'bn' ? 'bn-BD' : 'en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-2 text-center font-mono">{day.Fajr}</td>
                    <td className="py-2 text-center font-mono">{day.Dhuhr}</td>
                    <td className="py-2 text-center font-mono">{day.Asr}</td>
                    <td className="py-2 text-center font-mono">{day.Maghrib}</td>
                    <td className="py-2 text-center font-mono">{day.Isha}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Islamic Quote */}
      <div className="glass p-4 text-center bg-gradient-to-r from-[#d4af37]/5 to-transparent">
        <i className="fas fa-quote-right text-[#d4af37] opacity-30 text-2xl mb-2"></i>
        <p className="text-sm text-white/60 italic font-bangla">
          {currentLanguage === 'bn' 
            ? 'নিশ্চয়ই সালাত নির্দিষ্ট সময়ে মুমিনদের উপর ফরয করা হয়েছে।' 
            : 'Indeed, prayer has been decreed upon the believers a decree of specified times.'}
        </p>
        <p className="text-xs text-[#d4af37] mt-1">
          {currentLanguage === 'bn' ? 'সূরা আন-নিসা (৪:১০৩)' : 'Surah An-Nisa (4:103)'}
        </p>
      </div>
    </motion.div>
  );
};

export default PrayerPage;
