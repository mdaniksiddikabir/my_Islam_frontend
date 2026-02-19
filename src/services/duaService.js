import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Get duas by category
export const getDuasByCategory = async (category, language = 'bn') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/duas/category/${category}`, {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching duas:', error);
    throw error;
  }
};

// Get daily dua
export const getDailyDua = async (language = 'bn') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/duas/daily`, {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching daily dua:', error);
    throw error;
  }
};

// Search duas
export const searchDuas = async (query, language = 'bn') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/duas/search`, {
      params: { q: query, language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error searching duas:', error);
    throw error;
  }
};

// Get all dua categories
export const getDuaCategories = async (language = 'bn') => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/duas/categories`, {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
