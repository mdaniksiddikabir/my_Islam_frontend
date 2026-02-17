import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DuaCategory from './DuaCategory';
import DailyDua from './DailyDua';

const DuaLibrary = ({ duas, categories, onSelectDua }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredDuas = duas.filter(dua => {
    const matchesSearch = dua.arabic.includes(searchQuery) ||
                         dua.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || dua.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="glass p-4">
        <div className="relative">
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/30"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search duas..."
            className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none"
          />
        </div>
      </div>

      {/* Daily Dua */}
      <DailyDua />

      {/* Categories */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37]">Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.map((category) => (
            <DuaCategory
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )}
            />
          ))}
        </div>
      </div>

      {/* Duas List */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37]">
          {selectedCategory 
            ? categories.find(c => c.id === selectedCategory)?.name
            : 'All Duas'}
        </h3>
        
        <div className="space-y-3">
          {filteredDuas.map((dua) => (
            <motion.div
              key={dua.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => onSelectDua(dua)}
              className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <p className="text-xl mb-2 text-right font-arabic">{dua.arabic}</p>
              <p className="text-white/80 line-clamp-2">{dua.translation}</p>
              <p className="text-sm text-[#d4af37] mt-2">{dua.reference}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DuaLibrary;