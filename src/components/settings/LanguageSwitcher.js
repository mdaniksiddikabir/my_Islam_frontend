import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="space-y-3">
      <button
        onClick={() => setLanguage('en')}
        className={`w-full p-4 rounded-lg transition flex items-center gap-3 ${
          language === 'en'
            ? 'bg-[#d4af37] text-[#1a3f54]'
            : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        <span className="text-2xl">🇬🇧</span>
        <div className="flex-1 text-left">
          <p className="font-bold">English</p>
          <p className="text-sm opacity-70">US, UK</p>
        </div>
        {language === 'en' && (
          <i className="fas fa-check"></i>
        )}
      </button>

      <button
        onClick={() => setLanguage('bn')}
        className={`w-full p-4 rounded-lg transition flex items-center gap-3 ${
          language === 'bn'
            ? 'bg-[#d4af37] text-[#1a3f54]'
            : 'bg-white/5 hover:bg-white/10'
        }`}
      >
        <span className="text-2xl">🇧🇩</span>
        <div className="flex-1 text-left">
          <p className="font-bold">বাংলা</p>
          <p className="text-sm opacity-70">Bangladesh</p>
        </div>
        {language === 'bn' && (
          <i className="fas fa-check"></i>
        )}
      </button>
    </div>
  );
};

export default LanguageSwitcher;