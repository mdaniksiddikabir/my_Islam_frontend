import { useState, useEffect } from 'react';
import { getCurrentLocation, reverseGeocode, detectCountryFromIP } from '../services/locationService';

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
      
      // Try geolocation first
      const coords = await getCurrentLocation();
      setLocation(coords);
      setError(null);
      
    } catch (err) {
      console.error('Location detection failed:', err);
      
      // Try IP detection as fallback
      try {
        const ipData = await detectCountryFromIP();
        if (ipData) {
          setLocation({
            lat: ipData.lat,
            lng: ipData.lng,
            city: ipData.city || 'Unknown',
            country: ipData.country || 'Unknown'
          });
          setError(null);
        } else {
          // Final fallback to Dhaka
          setLocation({
            lat: 23.8103,
            lng: 90.4125,
            city: 'Dhaka',
            country: 'Bangladesh'
          });
          setError('Using default location');
        }
      } catch (ipErr) {
        // Final fallback to Dhaka
        setLocation({
          lat: 23.8103,
          lng: 90.4125,
          city: 'Dhaka',
          country: 'Bangladesh'
        });
        setError('Using default location');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = (newLocation) => {
    setLocation(newLocation);
  };

  return {
    location,
    loading,
    error,
    detectLocation,
    updateLocation
  };
};
