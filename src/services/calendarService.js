import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Get Hijri calendar for a specific month/year
export const getHijriCalendar = async (year, month) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/calendar/hijri`, {
      params: { year, month }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Hijri calendar:', error);
    throw error;
  }
};

// Get Gregorian calendar for a specific month/year
export const getGregorianCalendar = async (year, month) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/calendar/gregorian`, {
      params: { year, month }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Gregorian calendar:', error);
    throw error;
  }
};

// Get Islamic events for a specific year
export const getIslamicEvents = async (year) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/calendar/events`, {
      params: { year }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching Islamic events:', error);
    throw error;
  }
};

// Convert date between Hijri and Gregorian
export const convertDate = async (from, to, date) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/calendar/convert`, {
      from,
      to,
      date
    });
    return response.data.data;
  } catch (error) {
    console.error('Error converting date:', error);
    throw error;
  }
};

// Get today's Hijri date
export const getTodayHijri = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/calendar/today-hijri`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching today\'s Hijri date:', error);
    throw error;
  }
};
