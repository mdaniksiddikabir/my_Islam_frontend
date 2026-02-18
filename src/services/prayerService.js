import api from './api';

export const getPrayerTimes = async (lat, lng, method = 4) => {
  try {
    // ✅ ADDED /api
    const response = await api.get('/api/prayer/times', {
      params: { lat, lng, method }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw error;
  }
};

export const getPrayerTimesByCity = async (city, country, method = 4) => {
  try {
    // ✅ ADDED /api
    const response = await api.get('/api/prayer/by-city', {
      params: { city, country, method }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching prayer times by city:', error);
    throw error;
  }
};

export const getCalculationMethods = async () => {
  try {
    // ✅ ADDED /api
    const response = await api.get('/api/prayer/methods');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching calculation methods:', error);
    throw error;
  }
};

export const getNextPrayer = async (lat, lng, method = 4) => {
  try {
    // ✅ ADDED /api
    const response = await api.get('/api/prayer/next', {
      params: { lat, lng, method }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching next prayer:', error);
    throw error;
  }
};
