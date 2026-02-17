import { useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getCurrentUser, isAuthenticated } from '../services/auth';
import { useNavigate } from 'react-router-dom';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const userData = getCurrentUser();
    const auth = isAuthenticated();
    
    setUser(userData);
    setAuthenticated(auth);
    setLoading(false);
  };

  const login = async (email, password) => {
    const response = await apiLogin(email, password);
    setUser(response.user);
    setAuthenticated(true);
    return response;
  };

  const register = async (userData) => {
    const response = await apiRegister(userData);
    setUser(response.user);
    setAuthenticated(true);
    return response;
  };

  const logout = () => {
    apiLogout();
    setUser(null);
    setAuthenticated(false);
    navigate('/login');
  };

  return {
    user,
    loading,
    isAuthenticated: authenticated,
    login,
    register,
    logout,
    checkAuth
  };
};