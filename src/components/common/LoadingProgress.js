import React from 'react';
import { motion } from 'framer-motion';

const LoadingProgress = ({ progress, message = 'Loading...' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 z-50"
    >
      <div className="glass p-4 rounded-lg shadow-xl border border-[#d4af37]/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full border-4 border-[#d4af37]/20"></div>
            <div 
              className="absolute top-0 left-0 w-10 h-10 rounded-full border-4 border-[#d4af37]"
              style={{
                clipPath: `inset(0 ${100 - progress}% 0 0)`,
                transition: 'clip-path 0.3s'
              }}
            ></div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">{message}</p>
            <p className="text-xs text-[#d4af37]">{progress}% Complete</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-2 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-[#d4af37] rounded-full"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default LoadingProgress;
