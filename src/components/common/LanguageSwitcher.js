import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const LanguageSwitcher = () => {
  const { currentLanguage, changeLanguage } = useLanguage();

  return (
    <div className="lang-switch">
      <button
        onClick={() => changeLanguage('bn')}
        className={`lang-btn ${currentLanguage === 'bn' ? 'active' : ''}`}
      >
        বাংলা
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`lang-btn ${currentLanguage === 'en' ? 'active' : ''}`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;