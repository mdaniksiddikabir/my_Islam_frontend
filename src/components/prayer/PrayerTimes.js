import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PrayerCard from './PrayerCard';
import ProgressBar from './ProgressBar';
import CalculationMethod from './CalculationMethod';

const PrayerTimes = ({ prayerTimes, nextPrayer, onMethodChange, currentMethod }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [progress, setProgress] = useState(0);

  const prayers = [
    { name: 'Fajr', time: prayerTimes?.Fajr, icon: '🌅' },
    { name: 'Sunrise', time: prayerTimes?.Sunrise, icon: '☀️' },
    { name: 'Dhuhr', time: prayerTimes?.Dhuhr, icon: '🌤️' },
    { name: 'Asr', time: prayerTimes?.Asr, icon: '⛅' },
    { name: 'Maghrib', time: prayerTimes?.Maghrib, icon: '🌆' },
    { name: 'Isha', time: prayerTimes?.Isha, icon: '🌙' }
  ];

  useEffect(() => {
    if (nextPrayer) {
      calculateTimeRemaining();
      const interval = setInterval(calculateTimeRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [nextPrayer]);

  const calculateTimeRemaining = () => {
    if (!nextPrayer?.time) return;

    const now = new Date();
    const [hours, minutes] = nextPrayer.time.split(':');
    const prayerTime = new Date();
    prayerTime.setHours(parseInt(hours), parseInt(minutes), 0);

    if (now > prayerTime) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }

    const diff = prayerTime - now;
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

    setTimeRemaining(
      `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`
    );

    // Calculate progress to next prayer
    const prevPrayerIndex = prayers.findIndex(p => p.name === nextPrayer.name) - 1;
    if (prevPrayerIndex >= 0) {
      const prevPrayer = prayers[prevPrayerIndex];
      const [prevHours, prevMinutes] = prevPrayer.time.split(':');
      const prevTime = parseInt(prevHours) * 60 + parseInt(prevMinutes);
      const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
      const prayerTimeInMinutes = parseInt(hours) * 60 + parseInt(minutes);
      
      const total = prayerTimeInMinutes - prevTime;
      const elapsed = currentTimeInMinutes - prevTime;
      setProgress(Math.min(100, Math.max(0, (elapsed / total) * 100)));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Next Prayer Highlight */}
      {nextPrayer && (
        <div className="glass p-6 text-center">
          <h3 className="text-lg text-white/70 mb-2">Next Prayer</h3>
          <h2 className="text-4xl font-bold text-[#d4af37] mb-2">{nextPrayer.name}</h2>
          <p className="text-2xl mb-4">{nextPrayer.time}</p>
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm mb-2">
              <span>Time Remaining</span>
              <span className="text-[#d4af37] font-mono">{timeRemaining}</span>
            </div>
            <ProgressBar progress={progress} />
          </div>
        </div>
      )}

      {/* All Prayers Grid */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl text-[#d4af37]">Today's Prayer Times</h3>
          <CalculationMethod
            currentMethod={currentMethod}
            onMethodChange={onMethodChange}
          />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {prayers.map((prayer) => (
            <PrayerCard
              key={prayer.name}
              prayer={prayer}
              isNext={nextPrayer?.name === prayer.name}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PrayerTimes;