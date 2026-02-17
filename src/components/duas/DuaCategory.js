import React from 'react';

const DuaCategory = ({ category, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg transition ${
        isSelected
          ? 'bg-[#d4af37] text-[#1a3f54]'
          : 'bg-white/5 hover:bg-white/10'
      }`}
    >
      <span className="text-2xl mb-2 block">{category.icon}</span>
      <span className="text-sm">{category.name}</span>
      {category.count && (
        <span className="text-xs opacity-70 mt-1 block">
          {category.count} duas
        </span>
      )}
    </button>
  );
};

export default DuaCategory;