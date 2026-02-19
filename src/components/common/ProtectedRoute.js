import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  // 🔧 TEMPORARY: Always allow access for testing
  // Remove this line when backend is ready
  const isAuthenticated = true; // ✅ FORCE TRUE FOR TESTING
  
  // 🔒 REAL CODE (commented out for now)
  // const token = localStorage.getItem('token');
  // const isAuthenticated = !!token;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
