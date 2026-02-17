import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const DailyDua = () => {
  const [dua, setDua] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyDua();
  }, []);

  const fetchDailyDua = async () => {
    try {
      const response = await axios.get('/api/duas/daily');
      setDua(response.data.data);
    } catch (error) {
      console.error('Error fetching daily dua:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d4af37] mx-auto"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 bg-gradient-to-r from-[#d4af37]/20 to-transparent"
    >
      <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
        <i className="fas fa-star mr-2"></i>
        Daily Dua
      </h3>
      
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-2xl mb-3 text-right font-arabic">{dua?.arabic}</p>
          <p className="text-white/80 mb-2">{dua?.translation}</p>
          <p className="text-sm text-[#d4af37]">{dua?.reference}</p>
        </div>
        
        <button
          onClick={() => navigator.clipboard.writeText(dua?.arabic)}
          className="ml-4 p-2 hover:bg-[#d4af37]/20 rounded-lg"
        >
          <i className="far fa-copy text-[#d4af37]"></i>
        </button>
      </div>
    </motion.div>
  );
};

export default DailyDua;