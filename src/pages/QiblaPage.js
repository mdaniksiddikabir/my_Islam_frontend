import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getQiblaDirection } from '../services/qiblaService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const QiblaPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [qiblaData, setQiblaData] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [deviceSupported, setDeviceSupported] = useState(true);

  useEffect(() => {
    detectLocation();
    initCompass();
  }, []);

  const detectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setLocation(loc);
          loadQiblaData(loc.lat, loc.lng);
        },
        (error) => {
          console.error('Location error:', error);
          toast.error(t('errors.location'));
          setLoading(false);
        }
      );
    } else {
      toast.error(t('errors.geolocation'));
      setLoading(false);
    }
  };

  const loadQiblaData = async (lat, lng) => {
    try {
      const data = await getQiblaDirection(lat, lng);
      setQiblaData(data);
      
      // Calculate distance to Kaaba
      const distance = calculateDistance(
        lat, lng,
        21.4225, 39.8262 // Kaaba coordinates
      );
      setQiblaData(prev => ({ ...prev, distance }));
      
    } catch (error) {
      console.error('Error loading qibla data:', error);
      toast.error(t('errors.qibla'));
    } finally {
      setLoading(false);
    }
  };

  const initCompass = () => {
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute', handleCompass);
      setDeviceSupported(true);
    } else {
      setDeviceSupported(false);
      toast.warning(t('qibla.compassNotSupported'));
    }
  };

  const handleCompass = (event) => {
    let heading = null;
    
    if (event.webkitCompassHeading) {
      // iOS
      heading = event.webkitCompassHeading;
    } else if (event.alpha) {
      // Android
      heading = 360 - event.alpha;
    }
    
    if (heading !== null) {
      setCompassHeading(heading);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
  };

  const getCardinalDirection = (angle) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((angle % 360) / 45)) % 8;
    return directions[index];
  };

  const getQiblaOffset = () => {
    if (!qiblaData) return 0;
    return qiblaData.direction - compassHeading;
  };

  const needleRotation = getQiblaOffset();

  if (loading) return <Loader />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37]">
          <i className="fas fa-compass mr-3"></i>
          {t('qibla.finder')}
        </h1>
        <p className="text-white/70 font-bangla">{t('qibla.subtitle')}</p>
      </div>

      {/* Main Compass */}
      <div className="glass p-8">
        <div className="flex flex-col items-center">
          {/* Compass */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 mb-8">
            {/* Compass Background */}
            <div className="absolute inset-0 rounded-full border-4 border-[#d4af37] bg-white/5">
              {/* Cardinal Points */}
              <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-[#d4af37] font-bold">N</div>
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#d4af37] font-bold">E</div>
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-[#d4af37] font-bold">S</div>
              <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[#d4af37] font-bold">W</div>
              
              {/* Degree Markers */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-4 bg-white/30"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${deg}deg) translateY(-120px)`,
                    transformOrigin: '0 0'
                  }}
                />
              ))}
            </div>

            {/* Compass Needle */}
            <div
              className="absolute inset-0 transition-transform duration-300 ease-out"
              style={{ transform: `rotate(${compassHeading}deg)` }}
            >
              {/* North Needle */}
              <div className="absolute top-1/2 left-1/2 w-1 h-24 bg-gradient-to-t from-[#d4af37] to-red-500 origin-bottom"
                style={{ transform: 'translate(-50%, -100%) rotate(0deg)' }}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
              
              {/* South Needle */}
              <div className="absolute top-1/2 left-1/2 w-1 h-24 bg-gradient-to-b from-[#d4af37] to-blue-500 origin-top"
                style={{ transform: 'translate(-50%, 0) rotate(180deg)' }}>
                <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
            </div>

            {/* Qibla Indicator */}
            {qiblaData && (
              <div
                className="absolute inset-0 transition-transform duration-500"
                style={{ transform: `rotate(${qiblaData.direction}deg)` }}
              >
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
                  <i className="fas fa-map-marker-alt text-2xl text-[#d4af37] animate-pulse"></i>
                </div>
              </div>
            )}

            {/* Center Point */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#d4af37] rounded-full border-4 border-white z-10"></div>
          </div>

          {/* Compass Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-[#d4af37] mb-2">
              {t('qibla.direction')}
            </h2>
            <p className="text-4xl font-bold mb-2">
              {qiblaData ? Math.round(qiblaData.direction) : '--'}°
            </p>
            <p className="text-xl text-white/70">
              {qiblaData ? getCardinalDirection(qiblaData.direction) : ''}
            </p>
          </div>

          {/* Compass Status */}
          {!deviceSupported && (
            <div className="bg-yellow-500/20 text-yellow-500 p-4 rounded-lg text-center mb-4">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              {t('qibla.compassNotSupported')}
            </div>
          )}
        </div>
      </div>

      {/* Qibla Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Direction Card */}
        <div className="glass p-6 text-center">
          <div className="text-4xl text-[#d4af37] mb-3">
            <i className="fas fa-arrow-up"></i>
          </div>
          <h3 className="text-lg text-white/70 mb-2 font-bangla">{t('qibla.fromNorth')}</h3>
          <p className="text-2xl font-bold">
            {qiblaData ? `${Math.round(qiblaData.direction)}°` : '--°'}
          </p>
        </div>

        {/* Distance Card */}
        <div className="glass p-6 text-center">
          <div className="text-4xl text-[#d4af37] mb-3">
            <i className="fas fa-road"></i>
          </div>
          <h3 className="text-lg text-white/70 mb-2 font-bangla">{t('qibla.distance')}</h3>
          <p className="text-2xl font-bold">
            {qiblaData ? `${qiblaData.distance} km` : '-- km'}
          </p>
        </div>

        {/* Location Card */}
        <div className="glass p-6 text-center">
          <div className="text-4xl text-[#d4af37] mb-3">
            <i className="fas fa-map-marker-alt"></i>
          </div>
          <h3 className="text-lg text-white/70 mb-2 font-bangla">{t('qibla.yourLocation')}</h3>
          <p className="text-sm font-mono">
            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : '--'}
          </p>
        </div>
      </div>

      {/* Kaaba Information */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-kaaba mr-2"></i>
          {t('qibla.kaabaInfo')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kaaba Image */}
          <div className="bg-white/5 rounded-lg overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1542816417-9d9a7e4f1b6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Kaaba"
              className="w-full h-48 object-cover opacity-90"
            />
          </div>

          {/* Kaaba Details */}
          <div className="space-y-3">
            <div>
              <span className="text-white/50 text-sm">{t('qibla.name')}:</span>
              <p className="text-lg font-arabic">الكعبة المشرفة</p>
              <p className="text-white/80">Al-Kaaba Al-Musharrafah</p>
            </div>
            
            <div>
              <span className="text-white/50 text-sm">{t('qibla.location')}:</span>
              <p className="text-lg">Makkah Al-Mukarramah</p>
              <p className="text-sm text-white/50">21.4225° N, 39.8262° E</p>
            </div>
            
            <div>
              <span className="text-white/50 text-sm">{t('qibla.dimensions')}:</span>
              <p className="text-lg">13.1m (H) × 11.0m (W) × 12.8m (L)</p>
            </div>
          </div>
        </div>
      </div>

      {/* How to Use */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-info-circle mr-2"></i>
          {t('qibla.howToUse')}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold">1</div>
            <div>
              <p className="font-bold">{t('qibla.step1')}</p>
              <p className="text-sm text-white/60 font-bangla">{t('qibla.step1Desc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold">2</div>
            <div>
              <p className="font-bold">{t('qibla.step2')}</p>
              <p className="text-sm text-white/60 font-bangla">{t('qibla.step2Desc')}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center text-[#d4af37] font-bold">3</div>
            <div>
              <p className="font-bold">{t('qibla.step3')}</p>
              <p className="text-sm text-white/60 font-bangla">{t('qibla.step3Desc')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Mode (if compass not working) */}
      {!deviceSupported && (
        <div className="glass p-6">
          <h3 className="text-lg mb-4 text-[#d4af37]">
            <i className="fas fa-hand-pointer mr-2"></i>
            {t('qibla.manualMode')}
          </h3>
          
          <p className="text-white/70 mb-4 font-bangla">
            {t('qibla.manualDesc')}
          </p>
          
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 bg-white/5 rounded-full border-4 border-[#d4af37] mb-4 relative">
              <div className="absolute top-1/2 left-1/2 w-1 h-20 bg-[#d4af37] origin-bottom"
                style={{ transform: `translate(-50%, -100%) rotate(${qiblaData?.direction || 0}deg)` }}>
              </div>
            </div>
            
            <p className="text-center">
              <span className="text-2xl font-bold text-[#d4af37]">
                {qiblaData ? Math.round(qiblaData.direction) : '--'}°
              </span>
              <span className="text-white/70"> {t('qibla.fromNorth')}</span>
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default QiblaPage;
