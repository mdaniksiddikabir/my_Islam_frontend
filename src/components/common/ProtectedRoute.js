import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('🛡️ ProtectedRoute - loading:', loading);

  if (loading) {
    return <Loader fullScreen message="Loading..." />;
  }

  if (!isAuthenticated) {
    console.log('🛡️ Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('🛡️ Authenticated, rendering protected content');
  return children;
};

export default ProtectedRoute;
