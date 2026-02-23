import api from './api';

// Default location (Dhaka, Bangladesh)
const DEFAULT_LOCATION = {
  lat: 23.8103,
  lng: 90.4125,
  city: 'Dhaka',
  country: 'Bangladesh'
};

// Cache for reverse geocoding results
const geocodeCache = new Map();

/**
 * Check if geolocation is available and permitted
 */
export const checkLocationStatus = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        available: false,
        permission: 'unsupported',
        message: 'Geolocation not supported by this browser'
      });
      return;
    }

    // Check permission status
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        resolve({
          available: true,
          permission: result.state,
          message: `Permission ${result.state}`
        });
      }).catch(() => {
        // Permissions API not supported
        resolve({
          available: true,
          permission: 'unknown',
          message: 'Permission status unknown'
        });
      });
    } else {
      resolve({
        available: true,
        permission: 'unknown',
        message: 'Permissions API not supported'
      });
    }
  });
};

/**
 * Get current location from browser GPS with better error handling
 */
export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported, using default location');
      resolve(DEFAULT_LOCATION);
      return;
    }

    console.log('📍 Requesting location...');

    // Set timeout for location request
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Location request timeout, using default location');
      resolve(DEFAULT_LOCATION);
    }, 15000); // Increased to 15 seconds

    // Request current position with better options
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        
        const { latitude, longitude, accuracy } = position.coords;
        console.log(`✅ Got coordinates: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);
        
        // If accuracy is very low, warn but still use
        if (accuracy > 1000) {
          console.log(`⚠️ Low accuracy: ${accuracy}m`);
        }
        
        try {
          // Try to get city name from coordinates
          const locationData = await reverseGeocodeWithCache(latitude, longitude);
          
          resolve({
            lat: latitude,
            lng: longitude,
            city: locationData.city || 'Unknown',
            country: locationData.country || 'Unknown',
            accuracy: accuracy
          });
        } catch (error) {
          console.error('❌ Reverse geocoding failed, using coordinates only');
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
        
        // Detailed error handling
        let errorMessage = '';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied location permission';
            console.log('❌ ' + errorMessage);
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            console.log('❌ ' + errorMessage);
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            console.log('❌ ' + errorMessage);
            break;
          default:
            errorMessage = 'Unknown location error';
            console.log('❌ ' + errorMessage);
        }
        
        resolve(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

/**
 * Reverse geocode with caching to avoid repeated API calls
 */
const reverseGeocodeWithCache = async (lat, lng) => {
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  
  // Check cache first
  if (geocodeCache.has(cacheKey)) {
    console.log('📍 Using cached location data');
    return geocodeCache.get(cacheKey);
  }

  // Try multiple services in order
  const services = [
    reverseGeocodeBigDataCloud,
    reverseGeocodeOpenStreetMap,
    reverseGeocodeLocationIQ
  ];

  for (const service of services) {
    try {
      const result = await service(lat, lng);
      if (result.city !== 'Unknown') {
        // Cache the result
        geocodeCache.set(cacheKey, result);
        return result;
      }
    } catch (error) {
      console.log(`Service failed, trying next...`);
    }
  }

  return { city: 'Unknown', country: 'Unknown' };
};

/**
 * BigDataCloud reverse geocoding (primary, no CORS issues)
 */
const reverseGeocodeBigDataCloud = async (lat, lng) => {
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
    console.log('BigDataCloud failed');
  }
  return { city: 'Unknown', country: 'Unknown' };
};

/**
 * OpenStreetMap reverse geocoding (backup)
 */
const reverseGeocodeOpenStreetMap = async (lat, lng) => {
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
  return { city: 'Unknown', country: 'Unknown' };
};

/**
 * LocationIQ reverse geocoding (additional backup)
 */
const reverseGeocodeLocationIQ = async (lat, lng) => {
  try {
    // Using a free API key - you should get your own
    const apiKey = 'pk.YOUR_API_KEY'; // You'll need to sign up for a free key
    const response = await fetch(
      `https://us1.locationiq.com/v1/reverse.php?key=${apiKey}&lat=${lat}&lon=${lng}&format=json`
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown'
      };
    }
  } catch (error) {
    console.log('LocationIQ failed');
  }
  return { city: 'Unknown', country: 'Unknown' };
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
