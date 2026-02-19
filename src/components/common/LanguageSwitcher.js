import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="lang-switch">
      <button
        onClick={() => setLanguage('bn')}
        className={`lang-btn ${language === 'bn' ? 'active' : ''}`}
      >
        বাংলা
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
