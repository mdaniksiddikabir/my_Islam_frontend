import React from 'react';
import { motion } from 'framer-motion';
import Profile from '../components/user/Profile';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const ProfilePage = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <Profile />
    </motion.div>
  );
};

export default ProfilePage;