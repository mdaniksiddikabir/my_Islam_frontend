

import api from './api';

// Simple in-memory cache
const prayerCache = new Map();

export const getPrayerTimes = async (lat, lng, method = 4, date = null) => {
  const cacheKey = `${lat},${lng},${method},${date || 'today'}`;
  
  // Check cache first
  if (prayerCache.has(cacheKey)) {
    return prayerCache.get(cacheKey);
  }
  
  try {
    const params = { lat, lng, method };
    if (date) params.date = date;
    
    const response = await api.get('/api/prayer/times', { params });
    
    if (response.data?.success && response.data?.data) {
      // Store in cache for 1 hour
      prayerCache.set(cacheKey, response.data.data);
      setTimeout(() => prayerCache.delete(cacheKey), 60 * 60 * 1000);
      return response.data.data;
    }
  } catch (error) {
    console.error(`Error for ${date}:`, error.message);
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
