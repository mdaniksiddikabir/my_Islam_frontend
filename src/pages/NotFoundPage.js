import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-[80vh] flex items-center justify-center"
    >
      <div className="glass max-w-md w-full p-8 text-center">
        <div className="text-8xl mb-4">🕋</div>
        <h1 className="text-4xl font-bold text-[#d4af37] mb-2">404</h1>
        <h2 className="text-2xl mb-4">Page Not Found</h2>
        <p className="text-white/70 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold"
        >
          <i className="fas fa-home mr-2"></i>
          Go Home
        </Link>
      </div>
    </motion.div>
  );
};

export default NotFoundPage;