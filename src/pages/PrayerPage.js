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

  useEffect(() => {
    loadMethods();
    detectLocation();
  }, []);

  useEffect(() => {
    if (location) {
      loadPrayerTimes();
    }
  }, [location, selectedMethod]);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Location error:', error);
          // Default to Dhaka
          setLocation({ lat: 23.8103, lng: 90.4125 });
          toast.error(t('errors.location'));
        }
      );
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
      const data = await getPrayerTimes(location.lat, location.lng, selectedMethod);
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
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const prayers = [
      { name: 'Fajr', time: timings.Fajr },
      { name: 'Dhuhr', time: timings.Dhuhr },
      { name: 'Asr', time: timings.Asr },
      { name: 'Maghrib', time: timings.Maghrib },
      { name: 'Isha', time: timings.Isha }
    ];

    for (let i = 0; i < prayers.length; i++) {
      const [hours, minutes] = prayers[i].time.split(':');
      const prayerTime = parseInt(hours) * 60 + parseInt(minutes);
      
      if (prayerTime > currentTime) {
        setNextPrayer(prayers[i]);
        
        // Calculate progress
        const prevPrayer = i > 0 ? prayers[i-1] : prayers[prayers.length-1];
        const [prevHours, prevMinutes] = prevPrayer.time.split(':');
        const prevTime = parseInt(prevHours) * 60 + parseInt(prevMinutes);
        
        const total = prayerTime - prevTime;
        const elapsed = currentTime - prevTime;
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearch)}&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        setLocation({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          city: data[0].display_name.split(',')[0]
        });
        toast.success(t('location.updated'));
      } else {
        toast.error(t('errors.cityNotFound'));
      }
    } catch (error) {
      console.error('Error searching city:', error);
      toast.error(t('errors.searchFailed'));
    }
  };

  if (loading) return <Loader />;

  const getTimeRemaining = (prayerTime) => {
    const now = new Date();
    const [hours, minutes] = prayerTime.split(':');
    const prayerDate = new Date();
    prayerDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    if (now > prayerDate) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const diff = prayerDate - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37]">
          <i className="fas fa-clock mr-3"></i>
          {t('prayer.times')}
        </h1>
        <p className="text-white/70 font-bangla">{t('prayer.subtitle')}</p>
      </div>

      {/* Location and Method */}
      <div className="glass p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Location */}
          <div>
            <h3 className="text-lg mb-3 text-[#d4af37]">
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
                />
                <button
                  onClick={searchCity}
                  className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition"
                >
                  <i className="fas fa-search"></i>
                </button>
              </div>
              <div className="p-3 bg-white/5 rounded-lg">
                <p className="font-bold">{location?.city || 'Loading...'}</p>
                <p className="text-sm text-white/50">
                  {location?.lat?.toFixed(4)}, {location?.lng?.toFixed(4)}
                </p>
              </div>
            </div>
          </div>

          {/* Calculation Method */}
          <div>
            <h3 className="text-lg mb-3 text-[#d4af37]">
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
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Next Prayer */}
      {nextPrayer && (
        <div className="glass p-6 text-center">
          <p className="text-lg text-white/70 mb-2 font-bangla">{t('prayer.next')}</p>
          <h2 className="text-4xl font-bold text-[#d4af37] mb-2">
            {currentLanguage === 'bn' ? t(`prayer.${nextPrayer.name.toLowerCase()}`) : nextPrayer.name}
          </h2>
          <p className="text-2xl mb-4">{nextPrayer.time}</p>
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span>{t('prayer.timeRemaining')}</span>
              <span className="text-[#d4af37] font-mono">{getTimeRemaining(nextPrayer.time)}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* All Prayer Times */}
      {prayerTimes && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37]">
            <i className="fas fa-list mr-2"></i>
            {t('prayer.allTimes')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((prayer) => (
              <div
                key={prayer}
                className={`prayer-card ${nextPrayer?.name === prayer ? 'current' : ''}`}
              >
                <div className="text-sm text-white/70 mb-1 font-bangla">
                  {currentLanguage === 'bn' ? t(`prayer.${prayer.toLowerCase()}`) : prayer}
                </div>
                <div className="text-xl font-bold text-[#d4af37]">{prayerTimes.timings[prayer]}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ramadan Info */}
      {prayerTimes?.isRamadan && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
            <i className="fas fa-moon mr-2"></i>
            {t('ramadan.title')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <div className="text-sm text-white/70 mb-2 font-bangla">{t('ramadan.iftar')}</div>
              <div className="text-2xl font-bold text-[#d4af37]">{prayerTimes.timings.Maghrib}</div>
            </div>
            <div className="p-4 bg-white/5 rounded-lg text-center">
              <div className="text-sm text-white/70 mb-2 font-bangla">{t('ramadan.suhoor')}</div>
              <div className="text-2xl font-bold text-[#d4af37]">{prayerTimes.timings.Fajr}</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default PrayerPage;