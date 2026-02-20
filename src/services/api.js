import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://my-islam-backend.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout (increased from default)
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${config.method.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors with retry logic
api.interceptors.response.use(
  (response) => {
    // Log responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📥 ${response.status} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log errors
    console.error('❌ Response Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Handle network errors (timeout, no connection)
    if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
      console.log('🌐 Network error detected, retrying...');
      
      // Retry logic for network errors (max 3 retries)
      originalRequest.retryCount = originalRequest.retryCount || 0;
      
      if (originalRequest.retryCount < 3) {
        originalRequest.retryCount += 1;
        
        // Exponential backoff: wait longer between retries
        const delay = originalRequest.retryCount * 2000; // 2s, 4s, 6s
        console.log(`⏳ Retry ${originalRequest.retryCount}/3 after ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(originalRequest);
      } else {
        console.error('❌ Max retries reached for:', originalRequest.url);
      }
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('🔥 Server error:', error.response.data);
    }

    return Promise.reject(error);
  }
);

// Helper function to check if backend is reachable
export const checkBackendHealth = async () => {
  try {
    const response = await api.get('/health');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return { success: false, error: error.message };
  }
};

export default api;
