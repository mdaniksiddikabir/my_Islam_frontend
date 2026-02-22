import api from './api';

// Default location (Dhaka, Bangladesh)
const DEFAULT_LOCATION = {
  lat: 23.8103,
  lng: 90.4125,
  city: 'Dhaka',
  country: 'Bangladesh'
};

/**
 * Get current location from browser GPS
 * Returns Promise with lat, lng, city, country
 */
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using default location');
      resolve(DEFAULT_LOCATION);
      return;
    }

    // Set timeout for location request (10 seconds)
    const timeoutId = setTimeout(() => {
      console.log('Location request timeout, using default location');
      resolve(DEFAULT_LOCATION);
    }, 10000);

    // Request current position
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`📍 Got coordinates: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        
        try {
          // Try to get city name from coordinates
          const locationData = await reverseGeocode(latitude, longitude);
          
          resolve({
            lat: latitude,
            lng: longitude,
            city: locationData.city || 'Unknown',
            country: locationData.country || 'Unknown',
            accuracy: accuracy
          });
        } catch (error) {
          console.error('Reverse geocoding failed, using coordinates only');
          resolve({
            lat: latitude,
            lng: longitude,
            city: 'Unknown',
            country: 'Unknown',
            accuracy: accuracy
          });
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        
        // Handle specific geolocation errors
        switch(error.code) {
          case error.PERMISSION_DENIED:
            console.log('Location permission denied, using default');
            break;
          case error.POSITION_UNAVAILABLE:
            console.log('Location unavailable, using default');
            break;
          case error.TIMEOUT:
            console.log('Location timeout, using default');
            break;
          default:
            console.log('Unknown location error, using default');
        }
        
        resolve(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Reverse geocode coordinates to get city/country name
 */
const reverseGeocode = async (lat, lng) => {
  // Try BigDataCloud first (no CORS issues, free)
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        city: data.city || data.locality || data.principalSubdivision || 'Unknown',
        country: data.countryName || 'Unknown'
      };
    }
  } catch (error) {
    console.log('BigDataCloud failed, trying OpenStreetMap...');
  }

  // Try OpenStreetMap as backup
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IslamicApp/1.0'
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown'
      };
    }
  } catch (error) {
    console.log('OpenStreetMap failed');
  }

  // Return unknown if all fail
  return {
    city: 'Unknown',
    country: 'Unknown'
  };
};

/**
 * Search for a city by name
 */
export const searchCity = async (query) => {
  if (!query || query.trim().length < 2) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IslamicApp/1.0'
        }
      }
    );
    
    if (!response.ok) throw new Error('Search failed');
    
    const data = await response.json();
    
    return data.map(item => ({
      name: item.display_name.split(',')[0],
      fullName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      country: item.address?.country || item.display_name.split(',').pop().trim(),
      city: item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0].trim()
    }));
  } catch (error) {
    console.error('Error searching city:', error);
    return [];
  }
};

/**
 * Save favorite city to user account
 */
export const saveFavoriteCity = async (cityData) => {
  const response = await api.post('/api/users/favorites', cityData);
  return response.data;
};

/**
 * Get user's favorite cities
 */
export const getFavoriteCities = async () => {
  const response = await api.get('/api/users/favorites');
  return response.data.data;
};

/**
 * Remove a favorite city
 */
export const removeFavoriteCity = async (cityId) => {
  const response = await api.delete(`/api/users/favorites/${cityId}`);
  return response.data;
};
