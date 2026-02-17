import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Loader = () => {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative">
        <i className="fas fa-moon text-5xl text-[#d4af37] animate-pulse"></i>
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-12">
          <div className="w-12 h-12 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
      <p className="mt-6 text-lg text-white/70 font-bangla">{t('common.loading')}</p>
    </div>
  );
};

export default Loader;