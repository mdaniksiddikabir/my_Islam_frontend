import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { logout as logoutService } from '../../services/auth';
import LanguageSwitcher from './LanguageSwitcher';
import useRamadan from '../../hooks/useRamadan';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const { t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const { isRamadan, ramadanInfo } = useRamadan();

  // Base navigation items
  const baseNavItems = [
    { path: '/', icon: 'fas fa-home', label: 'home' },
    { path: '/prayer', icon: 'fas fa-clock', label: 'prayer' },
    { path: '/qibla', icon: 'fas fa-compass', label: 'qibla' },
    { path: '/quran', icon: 'fas fa-quran', label: 'quran' },
    { path: '/calendar', icon: 'fas fa-calendar', label: 'calendar' },
    { path: '/duas', icon: 'fas fa-hands-praying', label: 'duas' },
  ];

  // Settings at the end
  const settingsItem = { path: '/settings', icon: 'fas fa-cog', label: 'settings' };

  // Ramadan item (only shown during Ramadan)
  const ramadanItem = {
    path: '/ramadan',
    icon: 'fas fa-moon',
    label: 'ramadan',
    badge: `Day ${ramadanInfo.day}/30`
  };

  // Build final nav items
  const navItems = isRamadan 
    ? [...baseNavItems, ramadanItem, settingsItem]
    : [...baseNavItems, settingsItem];

  const handleLogout = async () => {
    try {
      await logoutService();
      logout();
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  // Translation keys for Ramadan
  const translations = {
    en: {
      ramadan: 'Ramadan',
      ramadanFull: 'Ramadan Calendar',
      day: 'Day'
    },
    bn: {
      ramadan: 'রমজান',
      ramadanFull: 'রমজান ক্যালেন্ডার',
      day: 'রোজা'
    }
  };

  const txt = translations[language] || translations.en;

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <i className="fas fa-moon text-2xl text-[#d4af37] group-hover:rotate-12 transition-transform"></i>
            {isRamadan && (
              <span className="absolute -top-2 -right-2 w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
            )}
          </div>
          <span className="text-xl font-bold hidden sm:block font-bangla text-white group-hover:text-[#d4af37] transition">
            {t('app.name')}
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item relative ${
                location.pathname === item.path ? 'active' : ''
              } ${
                item.label === 'ramadan' ? 'ramadan-nav-item' : ''
              }`}
            >
              <i className={item.icon}></i>
              <span>{t(`nav.${item.label}`) || txt[item.label] || item.label}</span>
              
              {/* Special badge for Ramadan */}
              {item.label === 'ramadan' && (
                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full animate-pulse">
                  {ramadanInfo.day}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          
          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdown(!profileDropdown)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition"
              >
                <div className="w-8 h-8 rounded-full bg-[#d4af37]/20 flex items-center justify-center">
                  <i className="fas fa-user text-[#d4af37]"></i>
                </div>
                <span className="hidden lg:block text-white/70">
                  {user?.name?.split(' ')[0] || 'User'}
                </span>
                <i className={`fas fa-chevron-${profileDropdown ? 'up' : 'down'} text-xs text-white/50`}></i>
              </button>

              {/* Profile Dropdown */}
              {profileDropdown && (
                <div className="absolute right-0 mt-2 w-56 glass rounded-lg shadow-xl py-2 border border-white/10">
                  <Link
                    to="/profile"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition"
                  >
                    <i className="fas fa-user text-[#d4af37] w-5"></i>
                    <span>{t('nav.profile') || 'Profile'}</span>
                  </Link>
                  
                  {/* Ramadan in dropdown (also shown) */}
                  {isRamadan && (
                    <Link
                      to="/ramadan"
                      onClick={() => setProfileDropdown(false)}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition text-emerald-400"
                    >
                      <i className="fas fa-moon w-5"></i>
                      <span>{txt.ramadanFull}</span>
                      <span className="ml-auto text-xs bg-emerald-500/20 px-2 py-0.5 rounded-full">
                        Day {ramadanInfo.day}
                      </span>
                    </Link>
                  )}
                  
                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdown(false)}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition"
                  >
                    <i className="fas fa-cog text-[#d4af37] w-5"></i>
                    <span>{t('nav.settings') || 'Settings'}</span>
                  </Link>
                  
                  <div className="border-t border-white/10 my-1"></div>
                  
                  <button
                    onClick={() => {
                      setProfileDropdown(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/10 transition text-red-400"
                  >
                    <i className="fas fa-sign-out-alt w-5"></i>
                    <span>{t('nav.logout') || 'Logout'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg hover:bg-white/10 transition text-white/70 hover:text-white"
              >
                {t('nav.login') || 'Login'}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold"
              >
                {t('nav.register') || 'Register'}
              </Link>
            </div>
          )}

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
                className={`nav-item w-full flex items-center justify-between ${
                  location.pathname === item.path ? 'active' : ''
                } ${item.label === 'ramadan' ? 'text-emerald-400' : ''}`}
              >
                <span>
                  <i className={`${item.icon} w-6`}></i>
                  <span className="ml-2">
                    {t(`nav.${item.label}`) || txt[item.label] || item.label}
                  </span>
                </span>
                {item.label === 'ramadan' && (
                  <span className="px-2 py-1 bg-emerald-500 text-white text-xs rounded-full">
                    Day {ramadanInfo.day}
                  </span>
                )}
              </Link>
            ))}
            
            {/* Mobile Auth Links */}
            {!isAuthenticated && (
              <>
                <div className="border-t border-white/10 my-2"></div>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="nav-item w-full"
                >
                  <i className="fas fa-sign-in-alt w-6"></i>
                  <span>{t('nav.login') || 'Login'}</span>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="nav-item w-full"
                >
                  <i className="fas fa-user-plus w-6"></i>
                  <span>{t('nav.register') || 'Register'}</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
