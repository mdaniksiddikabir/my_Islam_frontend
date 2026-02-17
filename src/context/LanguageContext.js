import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFromStorage, saveToStorage } from '../utils/helpers';
import { enTranslations, bnTranslations } from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return getFromStorage('language', 'bn');
  });

  const [translations, setTranslations] = useState(
    language === 'bn' ? bnTranslations : enTranslations
  );

  useEffect(() => {
    saveToStorage('language', language);
    setTranslations(language === 'bn' ? bnTranslations : enTranslations);
    
    // Set HTML lang attribute
    document.documentElement.lang = language;
    
    // Set direction (Arabic would be RTL)
    document.documentElement.dir = 'ltr';
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value;
  };

  const value = {
    language,
    setLanguage,
    t,
    isBangla: language === 'bn',
    isEnglish: language === 'en'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};