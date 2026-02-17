import { useState, useEffect } from 'react';
import { getCurrentLocation, reverseGeocode } from '../services/locationService';
import toast from 'react-hot-toast';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      setLoading(true);
      const coords = await getCurrentLocation();
      const address = await reverseGeocode(coords.lat, coords.lng);
      
      setLocation({
        ...coords,
        ...address
      });
      setError(null);
    } catch (err) {
      console.error('Location detection failed:', err);
      setError(err.message);
      toast.error('Could not detect your location. Using default.');
      
      // Default to Dhaka
      setLocation({
        lat: 23.8103,
        lng: 90.4125,
        city: 'Dhaka',
        country: 'Bangladesh'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (cityData) => {
    setLocation(cityData);
    toast.success('Location updated');
  };

  return {
    location,
    loading,
    error,
    detectLocation,
    updateLocation
  };
};