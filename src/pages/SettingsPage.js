import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getSettings, updateSettings, exportData, importData } from '../services/userService';
import toast from 'react-hot-toast';
import ThemeSwitcher from '../components/settings/ThemeSwitcher';

const SettingsPage = () => {
  // Fix: Use correct function names from context
  const { t, language: currentLanguage, setLanguage } = useLanguage();
  
  const [settings, setSettings] = useState({
    language: currentLanguage,
    theme: 'dark',
    notifications: {
      prayer: true,
      quran: true,
      events: true,
      sound: true,
      vibration: true
    },
    calculationMethod: 4,
    adhanSound: 'makkah',
    reminderTime: 15,
    autoDetectLocation: true
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Update settings when language changes from context
  useEffect(() => {
    setSettings(prev => ({ ...prev, language: currentLanguage }));
  }, [currentLanguage]);

  const loadSettings = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await updateSettings(settings);
      toast.success(t('settings.saved'));
    } catch (error) {
      toast.error(t('errors.save'));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `islamic-app-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      toast.success(t('settings.exported'));
    } catch (error) {
      toast.error(t('errors.export'));
    }
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await importData(data);
          toast.success(t('settings.imported'));
          loadSettings();
        } catch (error) {
          toast.error(t('errors.import'));
        }
      };
      reader.readAsText(file);
    }
  };

  const toggleNotification = (key) => {
    setSettings({
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37] flex items-center">
          <i className="fas fa-cog mr-3"></i>
          {t('settings.title')}
        </h1>
        <p className="text-white/70 font-bangla">{t('settings.subtitle')}</p>
      </div>

      {/* Language Settings */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-language mr-2"></i>
          {t('settings.language')}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setLanguage('en')} // Fixed: use setLanguage
            className={`p-4 rounded-lg transition ${
              settings.language === 'en'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="text-2xl mb-2 block">🇬🇧</span>
            <span>English</span>
            {settings.language === 'en' && (
              <i className="fas fa-check ml-2"></i>
            )}
          </button>
          
          <button
            onClick={() => setLanguage('bn')} // Fixed: use setLanguage
            className={`p-4 rounded-lg transition ${
              settings.language === 'bn'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="text-2xl mb-2 block">🇧🇩</span>
            <span>বাংলা</span>
            {settings.language === 'bn' && (
              <i className="fas fa-check ml-2"></i>
            )}
          </button>
        </div>

        {/* Language description */}
        <p className="text-sm text-white/50 mt-4 text-center">
          {settings.language === 'bn' 
            ? 'বর্তমান ভাষা: বাংলা' 
            : 'Current language: English'}
        </p>
      </div>


      // In your SettingsPage JSX:
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-paint-brush mr-2"></i>
          {t('settings.theme')}
        </h3>
       <ThemeSwitcher />
      </div>


      {/* Rest of your component remains the same */}
      {/* Theme Settings */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-paint-brush mr-2"></i>
          {t('settings.theme')}
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => setSettings({...settings, theme: 'dark'})}
            className={`p-4 rounded-lg transition ${
              settings.theme === 'dark'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <i className="fas fa-moon text-2xl mb-2 block"></i>
            <span>{t('settings.dark')}</span>
          </button>
          
          <button
            onClick={() => setSettings({...settings, theme: 'light'})}
            className={`p-4 rounded-lg transition ${
              settings.theme === 'light'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <i className="fas fa-sun text-2xl mb-2 block"></i>
            <span>{t('settings.light')}</span>
          </button>
          
          <button
            onClick={() => setSettings({...settings, theme: 'auto'})}
            className={`p-4 rounded-lg transition ${
              settings.theme === 'auto'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <i className="fas fa-clock text-2xl mb-2 block"></i>
            <span>{t('settings.auto')}</span>
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-bell mr-2"></i>
          {t('settings.notifications')}
        </h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="font-bangla">{t('settings.prayerReminders')}</span>
            <button
              onClick={() => toggleNotification('prayer')}
              className={`w-12 h-6 rounded-full transition ${
                settings.notifications.prayer ? 'bg-[#d4af37]' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transform transition ${
                settings.notifications.prayer ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="font-bangla">{t('settings.quranReminders')}</span>
            <button
              onClick={() => toggleNotification('quran')}
              className={`w-12 h-6 rounded-full transition ${
                settings.notifications.quran ? 'bg-[#d4af37]' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transform transition ${
                settings.notifications.quran ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="font-bangla">{t('settings.eventReminders')}</span>
            <button
              onClick={() => toggleNotification('events')}
              className={`w-12 h-6 rounded-full transition ${
                settings.notifications.events ? 'bg-[#d4af37]' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transform transition ${
                settings.notifications.events ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="font-bangla">{t('settings.sound')}</span>
            <button
              onClick={() => toggleNotification('sound')}
              className={`w-12 h-6 rounded-full transition ${
                settings.notifications.sound ? 'bg-[#d4af37]' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transform transition ${
                settings.notifications.sound ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </label>

          <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <span className="font-bangla">{t('settings.vibration')}</span>
            <button
              onClick={() => toggleNotification('vibration')}
              className={`w-12 h-6 rounded-full transition ${
                settings.notifications.vibration ? 'bg-[#d4af37]' : 'bg-white/20'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transform transition ${
                settings.notifications.vibration ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </label>
        </div>

        {/* Reminder Time */}
        <div className="mt-4">
          <label className="block text-sm text-white/50 mb-2">
            {t('settings.reminderTime')}
          </label>
          <select
            value={settings.reminderTime}
            onChange={(e) => setSettings({...settings, reminderTime: parseInt(e.target.value)})}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          >
            <option value="5">5 {t('common.minutes')}</option>
            <option value="10">10 {t('common.minutes')}</option>
            <option value="15">15 {t('common.minutes')}</option>
            <option value="30">30 {t('common.minutes')}</option>
            <option value="60">1 {t('common.hour')}</option>
          </select>
        </div>
      </div>

      {/* Prayer Calculation Method */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-calculator mr-2"></i>
          {t('settings.calculationMethod')}
        </h3>
        
        <select
          value={settings.calculationMethod}
          onChange={(e) => setSettings({...settings, calculationMethod: parseInt(e.target.value)})}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
        >
          <option value="4">Umm Al-Qura (Makkah)</option>
          <option value="3">Egyptian General</option>
          <option value="2">ISNA</option>
          <option value="5">Karachi</option>
          <option value="1">Karachi (Old)</option>
          <option value="12">Dubai</option>
          <option value="15">Kuwait</option>
          <option value="16">Qatar</option>
        </select>
      </div>

      {/* Adhan Sound */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-volume-up mr-2"></i>
          {t('settings.adhanSound')}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setSettings({...settings, adhanSound: 'makkah'})}
            className={`p-4 rounded-lg transition ${
              settings.adhanSound === 'makkah'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="text-2xl mb-2 block">🕋</span>
            <span>Makkah</span>
          </button>
          
          <button
            onClick={() => setSettings({...settings, adhanSound: 'madinah'})}
            className={`p-4 rounded-lg transition ${
              settings.adhanSound === 'madinah'
                ? 'bg-[#d4af37] text-[#1a3f54]'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            <span className="text-2xl mb-2 block">🕌</span>
            <span>Madinah</span>
          </button>
        </div>
      </div>

      {/* Location Settings */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-map-marker-alt mr-2"></i>
          {t('settings.location')}
        </h3>
        
        <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <span className="font-bangla">{t('settings.autoDetectLocation')}</span>
          <button
            onClick={() => setSettings({...settings, autoDetectLocation: !settings.autoDetectLocation})}
            className={`w-12 h-6 rounded-full transition ${
              settings.autoDetectLocation ? 'bg-[#d4af37]' : 'bg-white/20'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transform transition ${
              settings.autoDetectLocation ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </label>
      </div>

      {/* Data Management */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37] flex items-center">
          <i className="fas fa-database mr-2"></i>
          {t('settings.dataManagement')}
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleExport}
            className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition"
          >
            <i className="fas fa-download text-2xl mb-2 block text-[#d4af37]"></i>
            <span className="font-bangla">{t('settings.export')}</span>
          </button>
          
          <label className="p-4 bg-white/5 hover:bg-white/10 rounded-lg transition cursor-pointer text-center">
            <i className="fas fa-upload text-2xl mb-2 block text-[#d4af37]"></i>
            <span className="font-bangla">{t('settings.import')}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {t('common.saving')}
            </>
          ) : (
            <>
              <i className="fas fa-save mr-2"></i>
              {t('common.save')}
            </>
          )}
        </button>
      </div>

      {/* About Section */}
      <div className="glass p-6 text-center">
        <h3 className="text-lg mb-2 text-[#d4af37]">{t('settings.about')}</h3>
        <p className="text-white/70 font-bangla mb-2">
          {t('app.name')} v1.0.0
        </p>
        <p className="text-sm text-white/50">
          © 2026 - {t('app.tagline')}
        </p>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
