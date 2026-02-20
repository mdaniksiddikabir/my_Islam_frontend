import api from './api';

export const login = async (email, password) => {
  try {
    // Make sure the endpoint matches your backend
    const response = await api.post('/api/auth/login', { email, password });
    
    if (response.data.success && response.data.data) {
      const { user, token, refreshToken } = response.data.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data;
    }
    throw new Error('Invalid response structure');
  } catch (error) {
    console.error('Login service error:', error);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    // Make sure the endpoint matches your backend
    const response = await api.post('/api/auth/register', userData);
    
    if (response.data.success && response.data.data) {
      const { user, token, refreshToken } = response.data.data;
      
      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data;
    }
    throw new Error('Invalid response structure');
  } catch (error) {
    console.error('Register service error:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('rememberMe');
  window.location.href = '/login';
};

export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

export const refreshToken = async () => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token');

    const response = await api.post('/api/auth/refresh-token', { refreshToken });
    
    if (response.data.success && response.data.data) {
      const { token, refreshToken: newRefreshToken } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', newRefreshToken);
      
      return token;
    }
    throw new Error('Failed to refresh token');
  } catch (error) {
    console.error('Refresh token error:', error);
    logout();
    throw error;
  }
};
