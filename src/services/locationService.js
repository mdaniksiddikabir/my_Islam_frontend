import api from './api';

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Use a CORS proxy or different approach for reverse geocoding
          const { lat, lng } = position.coords;
          
          // Try multiple approaches to get location name
          let locationData = await reverseGeocodeWithFallback(lat, lng);
          
          resolve({
            lat,
            lng,
            city: locationData.city || 'Unknown',
            country: locationData.country || 'Unknown',
            accuracy: position.coords.accuracy
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Still return coordinates even if reverse geocoding fails
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            city: 'Unknown',
            country: 'Unknown',
            accuracy: position.coords.accuracy
          });
        }
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};

// Fallback function with multiple approaches
const reverseGeocodeWithFallback = async (lat, lng) => {
  // Try OpenStreetMap first (with timeout)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'IslamicApp/1.0'
        }
      }
    );
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        city: data.address?.city || data.address?.town || data.address?.village || 'Unknown',
        country: data.address?.country || 'Unknown'
      };
    }
  } catch (error) {
    console.log('OpenStreetMap failed, trying backup...');
  }

  // Try BigDataCloud as backup (free, no CORS issues)
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

  // Return default if all fail
  return {
    city: 'Unknown',
    country: 'Unknown'
  };
};

export const searchCity = async (query) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
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

export const reverseGeocode = async (lat, lng) => {
  return reverseGeocodeWithFallback(lat, lng);
};

export const saveFavoriteCity = async (cityData) => {
  const response = await api.post('/api/users/favorites', cityData);
  return response.data;
};

export const getFavoriteCities = async () => {
  const response = await api.get('/api/users/favorites');
  return response.data.data;
};

export const removeFavoriteCity = async (cityId) => {
  const response = await api.delete(`/api/users/favorites/${cityId}`);
  return response.data;
};

export const detectCountryFromIP = async () => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
      country: data.country_name,
      code: data.country_code,
      city: data.city,
      lat: data.latitude,
      lng: data.longitude
    };
  } catch (error) {
    console.error('IP detection failed:', error);
    return null;
  }
};
