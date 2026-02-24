import api from './api';

// Token storage keys
const TOKEN_KEY = 'token';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const REMEMBER_ME_KEY = 'rememberMe';

// Helper functions for storage
const storage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  },
  get: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error(`Failed to get ${key}:`, e);
      return null;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Failed to remove ${key}:`, e);
    }
  },
  setJson: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
    }
  },
  getJson: (key) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error(`Failed to parse ${key}:`, e);
      return null;
    }
  }
};

// ✅ FIXED: Added rememberMe parameter
export const login = async (email, password, rememberMe = false) => {
  try {
    console.log('🔐 Login attempt for:', email);
    console.log('📤 Sending with rememberMe:', rememberMe);
    
    // ✅ Send rememberMe to backend
    const response = await api.post('/api/auth/login', { 
      email, 
      password, 
      rememberMe 
    });
    
    console.log('📥 Login response:', response.data);
    
    if (response.data?.success && response.data?.data) {
      const { user, token, refreshToken } = response.data.data;
      
      // Validate required data
      if (!token || !user) {
        throw new Error('Invalid response: missing token or user data');
      }
      
      // Store tokens and user data
      storage.set(TOKEN_KEY, token);
      if (refreshToken) {
        storage.set(REFRESH_TOKEN_KEY, refreshToken);
      }
      storage.setJson(USER_KEY, user);
      
      // Store remember me preference
      if (rememberMe) {
        storage.set(REMEMBER_ME_KEY, 'true');
      } else {
        storage.remove(REMEMBER_ME_KEY);
      }
      
      console.log('✅ Login successful for:', user.email);
      return {
        success: true,
        data: { user, token, refreshToken }
      };
    }
    
    throw new Error(response.data?.message || 'Login failed');
    
  } catch (error) {
    console.error('❌ Login service error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// ✅ REST OF YOUR CODE IS PERFECT - No other changes needed
export const register = async (userData, retryCount = 0) => {
  try {
    console.log('📤 Sending registration data:', { 
      ...userData, 
      password: '***' 
    });
    
    const response = await api.post('/api/auth/register', {
      name: userData.name,
      email: userData.email,
      password: userData.password
    });
    
    console.log('📥 Registration response:', response.data);
    
    if (response.data?.success && response.data?.data) {
      const { user, token, refreshToken } = response.data.data;
      
      if (!token || !user) {
        throw new Error('Invalid response: missing token or user data');
      }
      
      storage.set(TOKEN_KEY, token);
      if (refreshToken) {
        storage.set(REFRESH_TOKEN_KEY, refreshToken);
      }
      storage.setJson(USER_KEY, user);
      
      console.log('✅ Registration successful for:', user.email);
      return {
        success: true,
        data: { user, token, refreshToken }
      };
    }
    
    throw new Error(response.data?.message || 'Registration failed');
    
  } catch (error) {
    // Handle network errors with retry
    if ((error.message === 'Network Error' || error.code === 'ECONNABORTED') && retryCount < 3) {
      console.log(`🌐 Network error, retrying (${retryCount + 1}/3)...`);
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
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

export const logout = async (callApi = true) => {
  try {
    if (callApi) {
      await api.post('/api/auth/logout').catch(() => {});
    }
  } finally {
    storage.remove(TOKEN_KEY);
    storage.remove(REFRESH_TOKEN_KEY);
    storage.remove(USER_KEY);
    storage.remove(REMEMBER_ME_KEY);
    console.log('✅ Logout successful');
    window.location.href = '/login';
  }
};

export const getCurrentUser = () => {
  return storage.getJson(USER_KEY);
};

export const getToken = () => {
  return storage.get(TOKEN_KEY);
};

export const getRefreshToken = () => {
  return storage.get(REFRESH_TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!storage.get(TOKEN_KEY);
};

export const refreshToken = async () => {
  try {
    const refreshTokenValue = getRefreshToken();
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing token...');
    
    const response = await api.post('/api/auth/refresh-token', { 
      refreshToken: refreshTokenValue 
    });
    
    if (response.data?.success && response.data?.data) {
      const { token, refreshToken: newRefreshToken } = response.data.data;
      
      if (!token) {
        throw new Error('No token in refresh response');
      }
      
      storage.set(TOKEN_KEY, token);
      if (newRefreshToken) {
        storage.set(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      
      console.log('✅ Token refreshed successfully');
      return token;
    }
    
    throw new Error(response.data?.message || 'Failed to refresh token');
    
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    await logout(false);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    console.log('🔑 Forgot password for:', email);
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    throw error;
  }
};

export const resetPassword = async (token, password) => {
  try {
    console.log('🔑 Resetting password with token');
    const response = await api.post(`/api/auth/reset-password/${token}`, { password });
    return response.data;
  } catch (error) {
    console.error('❌ Reset password error:', error);
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await api.put('/api/auth/change-password', {
      currentPassword,
      newPassword
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Change password error:', error);
    throw error;
  }
};

export const verifyEmail = async (token) => {
  try {
    const response = await api.post(`/api/auth/verify-email/${token}`);
    
    if (response.data?.success) {
      const user = getCurrentUser();
      if (user) {
        user.emailVerified = true;
        storage.setJson(USER_KEY, user);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Email verification error:', error);
    throw error;
  }
};

export const resendVerification = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const response = await api.post('/api/auth/resend-verification', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data;
  } catch (error) {
    console.error('❌ Resend verification error:', error);
    throw error;
  }
};

export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Date.now() >= (payload.exp * 1000);
  } catch (e) {
    console.error('Failed to decode token:', e);
    return true;
  }
};

export const ensureValidToken = async () => {
  const token = getToken();
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    console.log('🔄 Token expired, refreshing...');
    try {
      return await refreshToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      await logout(false);
      return null;
    }
  }
  
  return token;
};
