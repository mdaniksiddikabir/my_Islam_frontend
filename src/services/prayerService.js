import api from './api';

export const getPrayerTimes = async (lat, lng, method = 4, date = null) => {
  try {
    const params = { lat, lng, method };
    
    // CRITICAL: Add date to params if provided
    if (date) {
      params.date = date;
    }
    
    console.log(`📡 Fetching times for ${date || 'today'}...`);
    
    const response = await api.get('/api/prayer/times', { params });
    
    if (response.data && response.data.success && response.data.data) {
      console.log(`✅ Received times for ${date || 'today'}`);
      return response.data.data;
    } else {
      console.warn(`⚠️ Invalid response for ${date || 'today'}`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error fetching prayer times for ${date}:`, error);
    return null; // Return null instead of throwing
  }
};

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
