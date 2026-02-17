import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from './useLocation';
import { calculateDistance } from '../utils/helpers';
import toast from 'react-hot-toast';

export const useQibla = () => {
  const { location } = useLocation();
  const [direction, setDirection] = useState(null);
  const [distance, setDistance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const KAABA_COORDS = { lat: 21.4225, lng: 39.8262 };

  useEffect(() => {
    if (location) {
      fetchQiblaDirection();
      calculateDistanceToKaaba();
    }
  }, [location]);

  const fetchQiblaDirection = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://api.aladhan.com/v1/qibla/${location.lat}/${location.lng}`
      );
      setDirection(response.data.data.direction);
      setError(null);
    } catch (err) {
      console.error('Error fetching qibla direction:', err);
      setError(err.message);
      toast.error('Failed to load qibla direction');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistanceToKaaba = () => {
    if (location) {
      const dist = calculateDistance(
        location.lat, location.lng,
        KAABA_COORDS.lat, KAABA_COORDS.lng
      );
      setDistance(Math.round(dist));
    }
  };

  return {
    direction,
    distance,
    kaabaCoords: KAABA_COORDS,
    loading,
    error,
    refresh: fetchQiblaDirection
  };
};