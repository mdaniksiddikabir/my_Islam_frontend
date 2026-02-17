import api from './api';

export const getPrayerTimes = async (lat, lng, method = 4) => {
  const response = await api.get('/prayer/times', {
    params: { lat, lng, method }
  });
  return response.data.data;
};

export const getPrayerTimesByCity = async (city, country, method = 4) => {
  const response = await api.get('/prayer/by-city', {
    params: { city, country, method }
  });
  return response.data.data;
};

export const getCalculationMethods = async () => {
  const response = await api.get('/prayer/methods');
  return response.data.data;
};

export const getNextPrayer = async () => {
  const response = await api.get('/prayer/next');
  return response.data.data;
};

export const getWeeklyPrayers = async (lat, lng, method = 4) => {
  const response = await api.get('/prayer/weekly', {
    params: { lat, lng, method }
  });
  return response.data.data;
};

export const logPrayer = async (prayerData) => {
  const response = await api.post('/prayer/log', prayerData);
  return response.data;
};

export const getPrayerStats = async (period = 'week') => {
  const response = await api.get('/prayer/stats', {
    params: { period }
  });
  return response.data.data;
};