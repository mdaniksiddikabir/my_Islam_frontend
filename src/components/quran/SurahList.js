import React from 'react';

const SurahList = ({ surahs, currentSurah, onSelect, language }) => {
  return (
    <div>
      <h3 className="text-lg mb-3 text-[#d4af37]">
        <i className="fas fa-list mr-2"></i>
        Surahs
      </h3>
      <div className="space-y-1">
        {surahs.map((surah) => (
          <button
            key={surah.id}
            onClick={() => onSelect(surah.id)}
            className={`w-full text-left p-3 rounded-lg transition ${
              currentSurah?.id === surah.id
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'hover:bg-white/10'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-arabic">{surah.name}</span>
              <span className="text-xs opacity-70">{surah.totalVerses}</span>
            </div>
            <div className="text-xs mt-1 opacity-70">
              {surah.translation}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SurahList;