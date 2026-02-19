import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const SettingsLanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">
          {t('settings.language')}
        </h3>
      </div>

      {/* English Option */}
      <button
        onClick={() => setLanguage('en')}
        className={`w-full p-4 rounded-lg transition flex items-center gap-4 ${
          language === 'en'
            ? 'bg-[#d4af37] text-[#1a3f54]'
            : 'bg-white/5 hover:bg-white/10 text-white'
        }`}
      >
        <span className="text-3xl">🇬🇧</span>
        <div className="flex-1 text-left">
          <p className="font-bold text-lg">English</p>
          <p className={`text-sm ${language === 'en' ? 'text-[#1a3f54]/70' : 'text-white/50'}`}>
            United States, United Kingdom
          </p>
        </div>
        {language === 'en' && (
          <div className="w-8 h-8 rounded-full bg-[#1a3f54] flex items-center justify-center">
            <i className="fas fa-check text-[#d4af37]"></i>
          </div>
        )}
      </button>

      {/* Bangla Option */}
      <button
        onClick={() => setLanguage('bn')}
        className={`w-full p-4 rounded-lg transition flex items-center gap-4 ${
          language === 'bn'
            ? 'bg-[#d4af37] text-[#1a3f54]'
            : 'bg-white/5 hover:bg-white/10 text-white'
        }`}
      >
        <span className="text-3xl">🇧🇩</span>
        <div className="flex-1 text-left">
          <p className="font-bold text-lg">বাংলা</p>
          <p className={`text-sm ${language === 'bn' ? 'text-[#1a3f54]/70' : 'text-white/50'}`}>
            বাংলাদেশ
          </p>
        </div>
        {language === 'bn' && (
          <div className="w-8 h-8 rounded-full bg-[#1a3f54] flex items-center justify-center">
            <i className="fas fa-check text-[#d4af37]"></i>
          </div>
        )}
      </button>

      {/* Language Description */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <p className="text-sm text-white/70">
          {language === 'bn' 
            ? 'আপনার পছন্দের ভাষায় অ্যাপ ব্যবহার করুন। সব কন্টেন্ট স্বয়ংক্রিয়ভাবে অনূদিত হবে।'
            : 'Use the app in your preferred language. All content will be automatically translated.'
          }
        </p>
      </div>
    </div>
  );
};

export default SettingsLanguageSwitcher;
