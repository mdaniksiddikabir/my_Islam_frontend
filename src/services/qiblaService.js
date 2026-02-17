import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const getQiblaDirection = async (lat, lng) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/qibla/direction`, {
      params: { lat, lng }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching qibla direction:', error);
    throw error;
  }
};

export const getKaabaCoordinates = () => {
  return {
    lat: 21.4225,
    lng: 39.8262,
    name: 'Kaaba, Makkah'
  };
};