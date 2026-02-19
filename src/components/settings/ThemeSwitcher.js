import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const { t, language } = useLanguage();

  const themes = [
    { 
      id: 'dark', 
      name: { en: 'Dark', bn: 'ডার্ক' },
      icon: '🌙', 
      description: { 
        en: 'Easy on the eyes at night',
        bn: 'রাতে চোখের জন্য আরামদায়ক'
      }
    },
    { 
      id: 'light', 
      name: { en: 'Light', bn: 'লাইট' },
      icon: '☀️', 
      description: { 
        en: 'Bright and clean',
        bn: 'উজ্জ্বল ও পরিষ্কার'
      }
    },
    { 
      id: 'auto', 
      name: { en: 'Auto', bn: 'অটো' },
      icon: '⚙️', 
      description: { 
        en: 'Follow system settings',
        bn: 'সিস্টেম সেটিংস অনুসরণ করুন'
      }
    }
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`p-4 rounded-lg transition-all duration-200 ${
              theme === t.id
                ? 'bg-[#d4af37] text-[#1a3f54] shadow-lg scale-105'
                : 'bg-white/5 hover:bg-white/10 text-white hover:scale-102'
            }`}
            aria-label={t.name[language] || t.name.en}
          >
            <span className="text-3xl mb-2 block">{t.icon}</span>
            <p className="font-bold text-sm">
              {t.name[language] || t.name.en}
            </p>
            <p className="text-xs opacity-70 mt-1 line-clamp-2">
              {t.description[language] || t.description.en}
            </p>
            
            {/* Active indicator */}
            {theme === t.id && (
              <div className="mt-2">
                <i className="fas fa-check text-xs"></i>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Theme Preview */}
      <div className="mt-4 p-4 bg-white/5 rounded-lg">
        <p className="text-sm text-white/70 mb-2">
          {language === 'bn' ? 'বর্তমান থিম:' : 'Current theme:'}
        </p>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full ${
            theme === 'dark' ? 'bg-gray-900 border-2 border-[#d4af37]' :
            theme === 'light' ? 'bg-white border-2 border-[#d4af37]' :
            'bg-gradient-to-r from-gray-900 to-white border-2 border-[#d4af37]'
          }`}></div>
          <div>
            <p className="font-bold text-white">
              {themes.find(t => t.id === theme)?.name[language] || 
               themes.find(t => t.id === theme)?.name.en}
            </p>
            <p className="text-xs text-white/50">
              {themes.find(t => t.id === theme)?.description[language] || 
               themes.find(t => t.id === theme)?.description.en}
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      {theme === 'auto' && (
        <div className="mt-2 p-3 bg-[#d4af37]/10 rounded-lg border border-[#d4af37]/20">
          <p className="text-xs text-[#d4af37] flex items-center gap-2">
            <i className="fas fa-info-circle"></i>
            {language === 'bn' 
              ? 'আপনার ডিভাইসের সিস্টেম সেটিংস অনুযায়ী থিম স্বয়ংক্রিয়ভাবে পরিবর্তিত হবে'
              : 'Theme will automatically change based on your device system settings'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
