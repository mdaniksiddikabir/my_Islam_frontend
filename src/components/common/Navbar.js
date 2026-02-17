import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = [
    { path: '/', icon: 'fas fa-home', label: 'home' },
    { path: '/prayer', icon: 'fas fa-clock', label: 'prayer' },
    { path: '/qibla', icon: 'fas fa-compass', label: 'qibla' },
    { path: '/quran', icon: 'fas fa-quran', label: 'quran' },
    { path: '/calendar', icon: 'fas fa-calendar', label: 'calendar' },
    { path: '/duas', icon: 'fas fa-hands-praying', label: 'duas' },
    { path: '/settings', icon: 'fas fa-cog', label: 'settings' },
  ];

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <i className="fas fa-moon text-2xl text-[#d4af37]"></i>
          <span className="text-xl font-bold hidden sm:block font-bangla">
            {t('app.name')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <i className={item.icon}></i>
              <span className="font-bangla">{t(`nav.${item.label}`)}</span>
            </Link>
          ))}
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
          >
            <i className={`fas fa-${isOpen ? 'times' : 'bars'} text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass-nav border-t border-white/10 p-4">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`nav-item w-full ${location.pathname === item.path ? 'active' : ''}`}
              >
                <i className={`${item.icon} w-6`}></i>
                <span className="font-bangla">{t(`nav.${item.label}`)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;