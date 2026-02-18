import api from './api';

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  });
};

export const searchCity = async (query) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
  );
  const data = await response.json();
  
  return data.map(item => ({
    name: item.display_name.split(',')[0],
    fullName: item.display_name,
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    country: item.display_name.split(',').pop().trim()
  }));
};

export const reverseGeocode = async (lat, lng) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await response.json();
  
  return {
    city: data.address.city || data.address.town || data.address.village,
    country: data.address.country,
    fullAddress: data.display_name
  };
};

// ✅ FIXED: Added /api prefix to these functions
export const saveFavoriteCity = async (cityData) => {
  const response = await api.post('/api/users/favorites', cityData);  // Added /api
  return response.data;
};

export const getFavoriteCities = async () => {
  const response = await api.get('/api/users/favorites');  // Added /api
  return response.data.data;
};

export const removeFavoriteCity = async (cityId) => {
  const response = await api.delete(`/api/users/favorites/${cityId}`);  // Added /api
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
