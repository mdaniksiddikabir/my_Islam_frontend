import api from './api';

export const getCurrentLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.log('Geolocation not supported, using default location');
      resolve({
        lat: 23.8103,
        lng: 90.4125,
        city: 'Dhaka',
        country: 'Bangladesh',
        accuracy: 0
      });
      return;
    }

    // Try to get location with timeout
    const timeoutId = setTimeout(() => {
      console.log('Location timeout, using default');
      resolve({
        lat: 23.8103,
        lng: 90.4125,
        city: 'Dhaka',
        country: 'Bangladesh',
        accuracy: 0
      });
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        clearTimeout(timeoutId);
        const { lat, lng } = position.coords;
        
        try {
          // Try to get city name from coordinates
          const locationData = await reverseGeocodeSimple(lat, lng);
          
          resolve({
            lat,
            lng,
            city: locationData.city || 'Unknown',
            country: locationData.country || 'Unknown',
            accuracy: position.coords.accuracy
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Return coordinates only
          resolve({
            lat,
            lng,
            city: 'Unknown',
            country: 'Unknown',
            accuracy: position.coords.accuracy
          });
        }
      },
      (error) => {
        clearTimeout(timeoutId);
        console.error('Geolocation error:', error.message);
        // Return default location on error
        resolve({
          lat: 23.8103,
          lng: 90.4125,
          city: 'Dhaka',
          country: 'Bangladesh',
          accuracy: 0
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  });
};

// Simple reverse geocoding with better error handling
const reverseGeocodeSimple = async (lat, lng) => {
  // Try BigDataCloud first (no CORS issues)
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
    console.log('BigDataCloud failed, trying backup...');
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

  // Return default if all fail
  return {
    city: 'Unknown',
    country: 'Unknown'
  };
};

export const searchCity = async (query) => {
  if (!query.trim()) return [];
  
  try {
    // Try OpenStreetMap first
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
    
    // Return some major cities as fallback
    return getFallbackCities(query);
  }
};

// Fallback cities for common searches
const getFallbackCities = (query) => {
  const lowerQuery = query.toLowerCase();
  const cities = [
    { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
    { name: 'Chittagong', country: 'Bangladesh', lat: 22.3569, lng: 91.7832 },
    { name: 'Sylhet', country: 'Bangladesh', lat: 24.8949, lng: 91.8687 },
    { name: 'Beijing', country: 'China', lat: 39.9042, lng: 116.4074 },
    { name: 'Shanghai', country: 'China', lat: 31.2304, lng: 121.4737 },
    { name: 'Liaoning', country: 'China', lat: 41.8057, lng: 123.4315 },
    { name: 'Shenyang', country: 'China', lat: 41.8057, lng: 123.4315 },
    { name: 'Dalian', country: 'China', lat: 38.9140, lng: 121.6147 },
    { name: 'Makkah', country: 'Saudi Arabia', lat: 21.3891, lng: 39.8579 },
    { name: 'Madinah', country: 'Saudi Arabia', lat: 24.5247, lng: 39.5692 },
    { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
    { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    { name: 'Abu Dhabi', country: 'UAE', lat: 24.4539, lng: 54.3773 },
    { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.5310 },
    { name: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lng: 47.9774 },
    { name: 'Muscat', country: 'Oman', lat: 23.5880, lng: 58.3829 },
    { name: 'Baghdad', country: 'Iraq', lat: 33.3152, lng: 44.3661 },
    { name: 'Tehran', country: 'Iran', lat: 35.6892, lng: 51.3890 },
    { name: 'Ankara', country: 'Turkey', lat: 39.9334, lng: 32.8597 },
    { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
    { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
    { name: 'Alexandria', country: 'Egypt', lat: 31.2001, lng: 29.9187 },
    { name: 'Tripoli', country: 'Libya', lat: 32.8872, lng: 13.1913 },
    { name: 'Tunis', country: 'Tunisia', lat: 36.8065, lng: 10.1815 },
    { name: 'Algiers', country: 'Algeria', lat: 36.7538, lng: 3.0588 },
    { name: 'Rabat', country: 'Morocco', lat: 34.0209, lng: -6.8416 },
    { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
    { name: 'Nouakchott', country: 'Mauritania', lat: 18.0735, lng: -15.9582 },
    { name: 'Dakar', country: 'Senegal', lat: 14.7167, lng: -17.4677 },
    { name: 'Bamako', country: 'Mali', lat: 12.6392, lng: -8.0029 },
    { name: 'Ouagadougou', country: 'Burkina Faso', lat: 12.3714, lng: -1.5197 },
    { name: 'Niamey', country: 'Niger', lat: 13.5127, lng: 2.1126 },
    { name: 'N\'Djamena', country: 'Chad', lat: 12.1348, lng: 15.0557 },
    { name: 'Khartoum', country: 'Sudan', lat: 15.5007, lng: 32.5599 },
    { name: 'Asmara', country: 'Eritrea', lat: 15.3229, lng: 38.9251 },
    { name: 'Addis Ababa', country: 'Ethiopia', lat: 9.0320, lng: 38.7469 },
    { name: 'Mogadishu', country: 'Somalia', lat: 2.0469, lng: 45.3182 },
    { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
    { name: 'Kampala', country: 'Uganda', lat: 0.3476, lng: 32.5825 },
    { name: 'Dodoma', country: 'Tanzania', lat: -6.1629, lng: 35.7516 },
    { name: 'Dar es Salaam', country: 'Tanzania', lat: -6.7924, lng: 39.2083 },
    { name: 'Maputo', country: 'Mozambique', lat: -25.9692, lng: 32.5732 },
    { name: 'Pretoria', country: 'South Africa', lat: -25.7479, lng: 28.2293 },
    { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
    { name: 'Durban', country: 'South Africa', lat: -29.8587, lng: 31.0218 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    { name: 'Manchester', country: 'United Kingdom', lat: 53.4808, lng: -2.2426 },
    { name: 'Birmingham', country: 'United Kingdom', lat: 52.4862, lng: -1.8904 },
    { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    { name: 'Lyon', country: 'France', lat: 45.7640, lng: 4.8357 },
    { name: 'Marseille', country: 'France', lat: 43.2965, lng: 5.3698 },
    { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
    { name: 'Munich', country: 'Germany', lat: 48.1351, lng: 11.5820 },
    { name: 'Frankfurt', country: 'Germany', lat: 50.1109, lng: 8.6821 },
    { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
    { name: 'Milan', country: 'Italy', lat: 45.4642, lng: 9.1900 },
    { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
    { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 },
    { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
    { name: 'Amsterdam', country: 'Netherlands', lat: 52.3702, lng: 4.8952 },
    { name: 'Brussels', country: 'Belgium', lat: 50.8503, lng: 4.3517 },
    { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
    { name: 'Zurich', country: 'Switzerland', lat: 47.3769, lng: 8.5417 },
    { name: 'Geneva', country: 'Switzerland', lat: 46.2044, lng: 6.1432 },
    { name: 'Stockholm', country: 'Sweden', lat: 59.3293, lng: 18.0686 },
    { name: 'Oslo', country: 'Norway', lat: 59.9139, lng: 10.7522 },
    { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
    { name: 'Helsinki', country: 'Finland', lat: 60.1699, lng: 24.9384 },
    { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426 },
    { name: 'Dublin', country: 'Ireland', lat: 53.3498, lng: -6.2603 },
    { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
    { name: 'Saint Petersburg', country: 'Russia', lat: 59.9343, lng: 30.3351 },
    { name: 'Kazan', country: 'Russia', lat: 55.8304, lng: 49.0661 },
    { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
    { name: 'Ankara', country: 'Turkey', lat: 39.9334, lng: 32.8597 },
    { name: 'Izmir', country: 'Turkey', lat: 38.4192, lng: 27.1287 },
    { name: 'Bursa', country: 'Turkey', lat: 40.1828, lng: 29.0669 },
    { name: 'Antalya', country: 'Turkey', lat: 36.8841, lng: 30.7056 },
    { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
    { name: 'Los Angeles', country: 'United States', lat: 34.0522, lng: -118.2437 },
    { name: 'Chicago', country: 'United States', lat: 41.8781, lng: -87.6298 },
    { name: 'Houston', country: 'United States', lat: 29.7604, lng: -95.3698 },
    { name: 'Phoenix', country: 'United States', lat: 33.4484, lng: -112.0740 },
    { name: 'Philadelphia', country: 'United States', lat: 39.9526, lng: -75.1652 },
    { name: 'San Antonio', country: 'United States', lat: 29.4241, lng: -98.4936 },
    { name: 'San Diego', country: 'United States', lat: 32.7157, lng: -117.1611 },
    { name: 'Dallas', country: 'United States', lat: 32.7767, lng: -96.7970 },
    { name: 'San Jose', country: 'United States', lat: 37.3382, lng: -121.8863 },
    { name: 'Austin', country: 'United States', lat: 30.2672, lng: -97.7431 },
    { name: 'Jacksonville', country: 'United States', lat: 30.3322, lng: -81.6557 },
    { name: 'Fort Worth', country: 'United States', lat: 32.7555, lng: -97.3308 },
    { name: 'Columbus', country: 'United States', lat: 39.9612, lng: -82.9988 },
    { name: 'Charlotte', country: 'United States', lat: 35.2271, lng: -80.8431 },
    { name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
    { name: 'Indianapolis', country: 'United States', lat: 39.7684, lng: -86.1581 },
    { name: 'Seattle', country: 'United States', lat: 47.6062, lng: -122.3321 },
    { name: 'Denver', country: 'United States', lat: 39.7392, lng: -104.9903 },
    { name: 'Washington', country: 'United States', lat: 38.9072, lng: -77.0369 },
    { name: 'Boston', country: 'United States', lat: 42.3601, lng: -71.0589 },
    { name: 'El Paso', country: 'United States', lat: 31.7619, lng: -106.4850 },
    { name: 'Nashville', country: 'United States', lat: 36.1627, lng: -86.7816 },
    { name: 'Detroit', country: 'United States', lat: 42.3314, lng: -83.0458 },
    { name: 'Oklahoma City', country: 'United States', lat: 35.4676, lng: -97.5164 },
    { name: 'Portland', country: 'United States', lat: 45.5051, lng: -122.6750 },
    { name: 'Las Vegas', country: 'United States', lat: 36.1699, lng: -115.1398 },
    { name: 'Memphis', country: 'United States', lat: 35.1495, lng: -90.0490 },
    { name: 'Louisville', country: 'United States', lat: 38.2527, lng: -85.7585 },
    { name: 'Baltimore', country: 'United States', lat: 39.2904, lng: -76.6122 },
    { name: 'Milwaukee', country: 'United States', lat: 43.0389, lng: -87.9065 },
    { name: 'Albuquerque', country: 'United States', lat: 35.0853, lng: -106.6056 },
    { name: 'Tucson', country: 'United States', lat: 32.2226, lng: -110.9747 },
    { name: 'Fresno', country: 'United States', lat: 36.7378, lng: -119.7871 },
    { name: 'Sacramento', country: 'United States', lat: 38.5816, lng: -121.4944 },
    { name: 'Kansas City', country: 'United States', lat: 39.0997, lng: -94.5786 },
    { name: 'Mesa', country: 'United States', lat: 33.4152, lng: -111.8315 },
    { name: 'Atlanta', country: 'United States', lat: 33.7490, lng: -84.3880 },
    { name: 'Omaha', country: 'United States', lat: 41.2565, lng: -95.9345 },
    { name: 'Colorado Springs', country: 'United States', lat: 38.8339, lng: -104.8214 },
    { name: 'Raleigh', country: 'United States', lat: 35.7796, lng: -78.6382 },
    { name: 'Miami', country: 'United States', lat: 25.7617, lng: -80.1918 },
    { name: 'Virginia Beach', country: 'United States', lat: 36.8529, lng: -75.9780 },
    { name: 'Oakland', country: 'United States', lat: 37.8044, lng: -122.2711 },
    { name: 'Minneapolis', country: 'United States', lat: 44.9778, lng: -93.2650 },
    { name: 'Tulsa', country: 'United States', lat: 36.1540, lng: -95.9928 },
    { name: 'Wichita', country: 'United States', lat: 37.6872, lng: -97.3301 },
    { name: 'New Orleans', country: 'United States', lat: 29.9511, lng: -90.0715 },
    { name: 'Arlington', country: 'United States', lat: 32.7357, lng: -97.1081 },
    { name: 'Cleveland', country: 'United States', lat: 41.4993, lng: -81.6944 },
    { name: 'Bakersfield', country: 'United States', lat: 35.3733, lng: -119.0187 },
    { name: 'Tampa', country: 'United States', lat: 27.9506, lng: -82.4572 },
    { name: 'Aurora', country: 'United States', lat: 39.7294, lng: -104.8319 },
    { name: 'Honolulu', country: 'United States', lat: 21.3069, lng: -157.8583 },
    { name: 'Anaheim', country: 'United States', lat: 33.8366, lng: -117.9143 },
    { name: 'Santa Ana', country: 'United States', lat: 33.7455, lng: -117.8677 },
    { name: 'Corpus Christi', country: 'United States', lat: 27.8006, lng: -97.3964 },
    { name: 'Riverside', country: 'United States', lat: 33.9806, lng: -117.3755 },
    { name: 'St. Louis', country: 'United States', lat: 38.6270, lng: -90.1994 },
    { name: 'Lexington', country: 'United States', lat: 38.0406, lng: -84.5037 },
    { name: 'Pittsburgh', country: 'United States', lat: 40.4406, lng: -79.9959 },
    { name: 'Stockton', country: 'United States', lat: 37.9577, lng: -121.2908 },
    { name: 'Cincinnati', country: 'United States', lat: 39.1031, lng: -84.5120 },
    { name: 'Saint Paul', country: 'United States', lat: 44.9537, lng: -93.0900 },
    { name: 'Toledo', country: 'United States', lat: 41.6528, lng: -83.5379 },
    { name: 'Greensboro', country: 'United States', lat: 36.0726, lng: -79.7910 },
    { name: 'Newark', country: 'United States', lat: 40.7357, lng: -74.1724 },
    { name: 'Plano', country: 'United States', lat: 33.0198, lng: -96.6989 },
    { name: 'Henderson', country: 'United States', lat: 36.0395, lng: -114.9817 },
    { name: 'Lincoln', country: 'United States', lat: 40.8258, lng: -96.6852 },
    { name: 'Buffalo', country: 'United States', lat: 42.8864, lng: -78.8784 },
    { name: 'Jersey City', country: 'United States', lat: 40.7282, lng: -74.0776 },
    { name: 'Chula Vista', country: 'United States', lat: 32.6401, lng: -117.0842 },
    { name: 'Fort Wayne', country: 'United States', lat: 41.0793, lng: -85.1394 },
    { name: 'Orlando', country: 'United States', lat: 28.5383, lng: -81.3792 },
    { name: 'St. Petersburg', country: 'United States', lat: 27.7676, lng: -82.6403 },
    { name: 'Chandler', country: 'United States', lat: 33.3062, lng: -111.8413 },
    { name: 'Laredo', country: 'United States', lat: 27.5064, lng: -99.5075 },
    { name: 'Norfolk', country: 'United States', lat: 36.8508, lng: -76.2859 },
    { name: 'Durham', country: 'United States', lat: 35.9940, lng: -78.8986 },
    { name: 'Madison', country: 'United States', lat: 43.0731, lng: -89.4012 },
    { name: 'Lubbock', country: 'United States', lat: 33.5779, lng: -101.8552 },
    { name: 'Winston-Salem', country: 'United States', lat: 36.0999, lng: -80.2442 },
    { name: 'Glendale', country: 'United States', lat: 33.5387, lng: -112.1859 },
    { name: 'Garland', country: 'United States', lat: 32.9126, lng: -96.6389 },
    { name: 'Hialeah', country: 'United States', lat: 25.8576, lng: -80.2781 },
    { name: 'Reno', country: 'United States', lat: 39.5296, lng: -119.8138 },
    { name: 'Baton Rouge', country: 'United States', lat: 30.4515, lng: -91.1871 },
    { name: 'Irvine', country: 'United States', lat: 33.6846, lng: -117.8265 },
    { name: 'Irving', country: 'United States', lat: 32.8140, lng: -96.9489 }
  ];
  
  return cities.filter(city => 
    city.name.toLowerCase().includes(lowerQuery) || 
    city.country.toLowerCase().includes(lowerQuery)
  ).slice(0, 5);
};

export const reverseGeocode = async (lat, lng) => {
  return reverseGeocodeSimple(lat, lng);
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
