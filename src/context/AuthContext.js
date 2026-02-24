import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, isAuthenticated, logout as logoutService } from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const userData = getCurrentUser();
      const auth = isAuthenticated();
      
      setUser(userData);
      setAuthenticated(auth);
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      // Clear any corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData, token) => {
    try {
      // Ensure token is stored
      if (token) {
        localStorage.setItem('token', token);
      }
      
      // Store user data
      if (userData) {
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      setUser(userData);
      setAuthenticated(true);
      
      console.log('✅ User logged in successfully:', userData?.email);
    } catch (error) {
      console.error('❌ Login error in context:', error);
    }
  };

  const logout = () => {
    try {
      logoutService();
      setUser(null);
      setAuthenticated(false);
      console.log('✅ User logged out successfully');
    } catch (error) {
      console.error('❌ Logout error in context:', error);
      // Force clear even if service fails
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setAuthenticated(false);
    }
  };

  const updateUser = (updatedUserData) => {
    try {
      const currentUser = getCurrentUser();
      const newUserData = { ...currentUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUserData));
      setUser(newUserData);
      console.log('✅ User updated successfully');
    } catch (error) {
      console.error('❌ User update failed:', error);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: authenticated,
    login,
    logout,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
