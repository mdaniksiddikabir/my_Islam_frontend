import api from './api';

// Cache for prayer times to prevent repeated failures
const prayerCache = new Map();

export const getPrayerTimes = async (lat, lng, method = 4, date = null) => {
  const cacheKey = `${lat},${lng},${method},${date || 'today'}`;
  
  // Check memory cache first (fastest)
  if (prayerCache.has(cacheKey)) {
    console.log(`✅ Cache HIT for ${date || 'today'}`);
    return prayerCache.get(cacheKey);
  }
  
  try {
    const params = { lat, lng, method };
    
    if (date) {
      params.date = date;
    }
    
    console.log(`📡 Fetching times for ${date || 'today'}...`);
    
    const response = await api.get('/api/prayer/times', { 
      params,
      timeout: 10000 // 10 second timeout
    });
    
    if (response.data && response.data.success && response.data.data) {
      console.log(`✅ SUCCESS for ${date || 'today'}`);
      
      // Store in cache
      prayerCache.set(cacheKey, response.data.data);
      
      // Clear cache after 1 hour
      setTimeout(() => prayerCache.delete(cacheKey), 60 * 60 * 1000);
      
      return response.data.data;
    }
  } catch (error) {
    console.error(`❌ Failed for ${date || 'today'}:`, error.message);
  }
  
  return null;
};

// ... rest of your functions
// ... rest of your functions

export const getPrayerTimesByCity = async (city, country, method = 4, date = null) => {
  try {
    const params = { city, country, method };
    
    // ✅ Add date if provided
    if (date) {
      params.date = date;
    }
    
    const response = await api.get('/api/prayer/by-city', { params });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching prayer times by city:', error);
    throw error;
  }
};

export const getCalculationMethods = async () => {
  try {
    const response = await api.get('/api/prayer/methods');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching calculation methods:', error);
    throw error;
  }
};

export const getNextPrayer = async (lat, lng, method = 4) => {
  try {
    const response = await api.get('/api/prayer/next', {
      params: { lat, lng, method }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching next prayer:', error);
    throw error;
  }
};
