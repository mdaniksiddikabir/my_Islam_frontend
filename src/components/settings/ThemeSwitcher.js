import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'dark', name: 'Dark', icon: '🌙', description: 'Easy on the eyes at night' },
    { id: 'light', name: 'Light', icon: '☀️', description: 'Bright and clean' },
    { id: 'auto', name: 'Auto', icon: '⚙️', description: 'Follow system settings' }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className={`p-4 rounded-lg transition ${
            theme === t.id
              ? 'bg-[#d4af37] text-[#1a3f54]'
              : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          <span className="text-2xl mb-2 block">{t.icon}</span>
          <p className="font-bold text-sm">{t.name}</p>
          <p className="text-xs opacity-70 mt-1">{t.description}</p>
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;