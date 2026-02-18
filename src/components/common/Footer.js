import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t, currentLanguage } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="glass mt-10 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <i className="fas fa-moon text-2xl text-[#d4af37]"></i>
            <span className="text-sm text-white/60">
              © {year} {t('app.name')}
            </span>import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Footer = () => {
  const { t, currentLanguage } = useLanguage();
  const year = new Date().getFullYear();

  return (
    <footer className="glass mt-10 py-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <i className="fas fa-moon text-2xl text-[#d4af37]"></i>
            <span className="text-sm text-white/60">
              © {year} {t('app.name')}
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/60 hover:text-[#d4af37] transition">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-white/60 hover:text-[#d4af37] transition">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-white/60 hover:text-[#d4af37] transition">
              <i className="fab fa-telegram"></i>
            </a>
          </div>
          
          {/* ✅ FIXED: Added fallback text */}
          <div className="text-sm text-white/40">
            {t('footer.rights') || 'All rights reserved'}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-white/60 hover:text-[#d4af37] transition">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-white/60 hover:text-[#d4af37] transition">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-white/60 hover:text-[#d4af37] transition">
              <i className="fab fa-telegram"></i>
            </a>
            <a href="#" className="text-white/60 hover:text-[#d4af37] transition">
              <i className="fab fa-whatsapp"></i>
            </a>
          </div>
          
          <div className="text-sm text-white/40">
            {t('footer.rights')}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
