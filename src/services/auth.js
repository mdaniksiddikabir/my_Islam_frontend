import api from './api';

export const login = async (email, password) => {
  try {
    // Your backend expects /api/auth/login
    const response = await api.post('/api/auth/login', { email, password });
    
    // Your backend returns { success: true, data: { user, token, refreshToken } }
    if (response.data.success && response.data.data) {
      const { user, token, refreshToken } = response.data.data;
      
      // Store tokens and user data
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data; // Return the data object
    }
    
    throw new Error(response.data.message || 'Login failed');
  } catch (error) {
    console.error('Login service error:', error);
    throw error;
  }
};

export const register = async (userData, retryCount = 0) => {
  try {
    console.log('📤 Sending registration data:', userData);
    
    const response = await api.post('/api/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password
    });
    
    console.log('📥 Registration response:', response.data);
    
    if (response.data.success && response.data.data) {
      const { user, token, refreshToken } = response.data.data;
      
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Registration failed');
  } catch (error) {
    // If it's a network error and we haven't retried too many times
    if ((error.message === 'Network Error' || error.code === 'ECONNABORTED') && retryCount < 3) {
      console.log(`🌐 Network error, retrying (${retryCount + 1}/3)...`);
      // Wait 2 seconds before retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return register(userData, retryCount + 1);
    }
    
    console.error('❌ Register service error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

export const logout = () => {
  // Optional: Call logout endpoint
  try {
    api.post('/api/auth/logout').catch(() => {});
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    window.location.href = '/login';
  }
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
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) throw new Error('No refresh token');

    const response = await api.post('/api/auth/refresh-token', { 
      refreshToken: refreshTokenValue 
    });
    
    if (response.data.success && response.data.data) {
      const { token, refreshToken: newRefreshToken } = response.data.data;
      
      localStorage.setItem('token', token);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      return token;
    }
    throw new Error('Failed to refresh token');
  } catch (error) {
    console.error('Refresh token error:', error);
    logout();
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error);
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    const response = await api.post(`/api/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/api/auth/change-password', {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error('Change password error:', error);
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await api.post(`/api/auth/verify-email/${token}`);
    return response.data;
  } catch (error) {
    console.error('Email verification error:', error);
    throw error;
  }
};

export const resendVerification = async () => {
  try {
    const response = await api.post('/api/auth/resend-verification');
    return response.data;
  } catch (error) {
    console.error('Resend verification error:', error);
    throw error;
  }
};
