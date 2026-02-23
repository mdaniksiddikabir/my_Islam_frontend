import { useState, useEffect } from 'react';
import { getCurrentLocation, checkLocationStatus } from '../services/locationService';

export const useLocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  useEffect(() => {
    checkStatusAndDetect();
  }, []);

  const checkStatusAndDetect = async () => {
    try {
      setLoading(true);
      
      // Check location status first
      const status = await checkLocationStatus();
      setPermissionStatus(status.permission);
      
      if (!status.available) {
        setError('Geolocation not supported');
        setLocation(getDefaultLocation());
        setLoading(false);
        return;
      }

      // Try to get location
      const coords = await getCurrentLocation();
      setLocation(coords);
      setError(null);

    } catch (err) {
      console.error('Location detection failed:', err);
      setError('Using default location');
      setLocation(getDefaultLocation());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultLocation = () => ({
    lat: 23.8103,
    lng: 90.4125,
    city: 'Dhaka',
    country: 'Bangladesh'
  });

  const requestLocation = () => {
    setLoading(true);
    checkStatusAndDetect();
  };

  const updateLocation = (newLocation) => {
    setLocation(newLocation);
    setError(null);
  };

  return {
    location,
    loading,
    error,
    permissionStatus,
    requestLocation,
    updateLocation
  };
};
