import React from 'react';
import { motion } from 'framer-motion';

const PrayerCard = ({ prayer, isNext }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={`prayer-card ${isNext ? 'current' : ''}`}
    >
      <div className="text-2xl mb-2">{prayer.icon}</div>
      <h4 className="text-sm text-white/70 mb-1">{prayer.name}</h4>
      <p className="text-lg font-bold text-[#d4af37]">{prayer.time}</p>
    </motion.div>
  );
};

export default PrayerCard;