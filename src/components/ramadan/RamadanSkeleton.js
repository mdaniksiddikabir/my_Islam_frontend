import React from 'react';
import { motion } from 'framer-motion';

const RamadanSkeleton = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 p-4"
    >
      {/* Header Skeleton */}
      <div className="glass p-6 bg-gradient-to-r from-emerald-900/30 to-emerald-700/30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-3">
            <div className="h-8 w-64 bg-white/10 rounded-full animate-pulse"></div>
            <div className="h-4 w-48 bg-white/10 rounded-full animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-white/10 rounded-full animate-pulse"></div>
        </div>

        {/* Countdown Skeletons */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="glass p-4 h-32 bg-white/5 animate-pulse">
              <div className="h-4 w-20 bg-white/10 rounded-full mb-4"></div>
              <div className="h-8 w-32 bg-white/10 rounded-full mx-auto"></div>
            </div>
          ))}
        </div>

        {/* Ashra Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="glass p-6 overflow-x-auto">
        <div className="h-96 bg-white/5 rounded-lg animate-pulse"></div>
      </div>

      {/* Notes Skeleton */}
      <div className="glass p-4">
        <div className="h-4 w-3/4 bg-white/10 rounded-full animate-pulse mb-2"></div>
        <div className="h-4 w-1/2 bg-white/10 rounded-full animate-pulse"></div>
      </div>
    </motion.div>
  );
};

export default RamadanSkeleton;
