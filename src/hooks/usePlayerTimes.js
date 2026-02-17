import { useState, useEffect } from 'react';
import { getPrayerTimes, getNextPrayer } from '../services/prayerService';
import { useLocation } from './useLocation';
import toast from 'react-hot-toast';

export const usePrayerTimes = (method = 4) => {
  const { location } = useLocation();
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [nextPrayer, setNextPrayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (location) {
      fetchPrayerTimes();
    }
  }, [location, method]);

  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      const data = await getPrayerTimes(location.lat, location.lng, method);
      setPrayerTimes(data);
      
      const next = await getNextPrayer();
      setNextPrayer(next);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching prayer times:', err);
      setError(err.message);
      toast.error('Failed to load prayer times');
    } finally {
      setLoading(false);
    }
  };

  const refreshTimes = () => {
    fetchPrayerTimes();
  };

  const getTimeRemaining = () => {
    if (!nextPrayer) return null;
    
    const now = new Date();
    const [hours, minutes] = nextPrayer.time.split(':');
    const prayerTime = new Date();
    prayerTime.setHours(parseInt(hours), parseInt(minutes), 0);

    if (now > prayerTime) {
      prayerTime.setDate(prayerTime.getDate() + 1);
    }

    return prayerTime - now;
  };

  return {
    prayerTimes,
    nextPrayer,
    loading,
    error,
    refreshTimes,
    getTimeRemaining
  };
};