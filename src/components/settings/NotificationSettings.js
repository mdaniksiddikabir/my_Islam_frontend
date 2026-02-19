import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const NotificationSettings = () => {
  const { settings, updateSettings } = useSettings();
  const { t, language } = useLanguage();
  const [testingSound, setTestingSound] = useState(false);

  const toggleSetting = (key) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  const handleReminderTimeChange = (e) => {
    updateSettings({ reminderTime: parseInt(e.target.value) });
  };

  const handleSoundChange = (e) => {
    updateSettings({ notificationSound: e.target.value });
  };

  const testSound = () => {
    setTestingSound(true);
    // Simulate sound test
    setTimeout(() => {
      setTestingSound(false);
      toast.success(
        language === 'bn' 
          ? 'সাউন্ড টেস্ট সফল হয়েছে' 
          : 'Sound test successful'
      );
    }, 1000);
  };

  // Get translated text based on language
  const getReminderTimeText = (minutes) => {
    if (language === 'bn') {
      if (minutes === 5) return '৫ মিনিট আগে';
      if (minutes === 10) return '১০ মিনিট আগে';
      if (minutes === 15) return '১৫ মিনিট আগে';
      if (minutes === 30) return '৩০ মিনিট আগে';
      if (minutes === 60) return '১ ঘণ্টা আগে';
      return `${minutes} মিনিট আগে`;
    } else {
      if (minutes === 5) return '5 minutes before';
      if (minutes === 10) return '10 minutes before';
      if (minutes === 15) return '15 minutes before';
      if (minutes === 30) return '30 minutes before';
      if (minutes === 60) return '1 hour before';
      return `${minutes} minutes before`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Prayer Reminders */}
      <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer">
        <div>
          <p className="font-bold text-white">
            {language === 'bn' ? 'নামাজের রিমাইন্ডার' : 'Prayer Reminders'}
          </p>
          <p className="text-sm text-white/50">
            {language === 'bn' 
              ? 'নামাজের সময় হওয়ার আগে নোটিফিকেশন পান' 
              : 'Get notified before prayer times'}
          </p>
        </div>
        <button
          onClick={() => toggleSetting('prayer')}
          className={`w-12 h-6 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${
            settings.notifications?.prayer ? 'bg-[#d4af37]' : 'bg-white/20'
          }`}
          aria-label={language === 'bn' ? 'নামাজের রিমাইন্ডার টগল' : 'Toggle prayer reminders'}
        >
          <div className={`w-4 h-4 rounded-full bg-white transform transition ${
            settings.notifications?.prayer ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </label>

      {/* Quran Reminders */}
      <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer">
        <div>
          <p className="font-bold text-white">
            {language === 'bn' ? 'কোরআনের রিমাইন্ডার' : 'Quran Reminders'}
          </p>
          <p className="text-sm text-white/50">
            {language === 'bn' 
              ? 'দৈনিক আয়াতের নোটিফিকেশন' 
              : 'Daily verse notifications'}
          </p>
        </div>
        <button
          onClick={() => toggleSetting('quran')}
          className={`w-12 h-6 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${
            settings.notifications?.quran ? 'bg-[#d4af37]' : 'bg-white/20'
          }`}
          aria-label={language === 'bn' ? 'কোরআনের রিমাইন্ডার টগল' : 'Toggle quran reminders'}
        >
          <div className={`w-4 h-4 rounded-full bg-white transform transition ${
            settings.notifications?.quran ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </label>

      {/* Event Reminders */}
      <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer">
        <div>
          <p className="font-bold text-white">
            {language === 'bn' ? 'ইভেন্ট রিমাইন্ডার' : 'Event Reminders'}
          </p>
          <p className="text-sm text-white/50">
            {language === 'bn' 
              ? 'ইসলামিক ইভেন্ট ও ছুটির দিন' 
              : 'Islamic events and holidays'}
          </p>
        </div>
        <button
          onClick={() => toggleSetting('events')}
          className={`w-12 h-6 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${
            settings.notifications?.events ? 'bg-[#d4af37]' : 'bg-white/20'
          }`}
          aria-label={language === 'bn' ? 'ইভেন্ট রিমাইন্ডার টগল' : 'Toggle event reminders'}
        >
          <div className={`w-4 h-4 rounded-full bg-white transform transition ${
            settings.notifications?.events ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </label>

      {/* Sound Toggle */}
      <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer">
        <div>
          <p className="font-bold text-white">
            {language === 'bn' ? 'সাউন্ড' : 'Sound'}
          </p>
          <p className="text-sm text-white/50">
            {language === 'bn' 
              ? 'নোটিফিকেশনের জন্য সাউন্ড চালু/বন্ধ' 
              : 'Enable/disable notification sound'}
          </p>
        </div>
        <button
          onClick={() => toggleSetting('sound')}
          className={`w-12 h-6 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${
            settings.notifications?.sound ? 'bg-[#d4af37]' : 'bg-white/20'
          }`}
          aria-label={language === 'bn' ? 'সাউন্ড টগল' : 'Toggle sound'}
        >
          <div className={`w-4 h-4 rounded-full bg-white transform transition ${
            settings.notifications?.sound ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </label>

      {/* Vibration Toggle */}
      <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer">
        <div>
          <p className="font-bold text-white">
            {language === 'bn' ? 'ভাইব্রেশন' : 'Vibration'}
          </p>
          <p className="text-sm text-white/50">
            {language === 'bn' 
              ? 'নোটিফিকেশনের জন্য ভাইব্রেশন' 
              : 'Vibration for notifications'}
          </p>
        </div>
        <button
          onClick={() => toggleSetting('vibration')}
          className={`w-12 h-6 rounded-full transition focus:outline-none focus:ring-2 focus:ring-[#d4af37] ${
            settings.notifications?.vibration ? 'bg-[#d4af37]' : 'bg-white/20'
          }`}
          aria-label={language === 'bn' ? 'ভাইব্রেশন টগল' : 'Toggle vibration'}
        >
          <div className={`w-4 h-4 rounded-full bg-white transform transition ${
            settings.notifications?.vibration ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </label>

      {/* Divider */}
      <div className="border-t border-white/10 my-4"></div>

      {/* Reminder Time */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          {language === 'bn' ? 'রিমাইন্ডার সময়' : 'Reminder Time'}
        </label>
        <select
          value={settings.reminderTime || 15}
          onChange={handleReminderTimeChange}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-white"
        >
          <option value="5">{getReminderTimeText(5)}</option>
          <option value="10">{getReminderTimeText(10)}</option>
          <option value="15">{getReminderTimeText(15)}</option>
          <option value="30">{getReminderTimeText(30)}</option>
          <option value="60">{getReminderTimeText(60)}</option>
        </select>
      </div>

      {/* Sound Selection */}
      <div>
        <label className="block text-sm font-medium text-white/70 mb-2">
          {language === 'bn' ? 'নোটিফিকেশন সাউন্ড' : 'Notification Sound'}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={testSound}
            disabled={testingSound}
            className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <i className={`fas fa-${testingSound ? 'spinner fa-spin' : 'volume-up'}`}></i>
            {testingSound 
              ? (language === 'bn' ? 'বাজছে...' : 'Testing...') 
              : (language === 'bn' ? 'সাউন্ড টেস্ট' : 'Test Sound')
            }
          </button>
          
          <select
            value={settings.notificationSound || 'default'}
            onChange={handleSoundChange}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#d4af37] text-white"
          >
            <option value="default">
              {language === 'bn' ? 'ডিফল্ট' : 'Default'}
            </option>
            <option value="gentle">
              {language === 'bn' ? 'মৃদু' : 'Gentle'}
            </option>
            <option value="adhan">
              {language === 'bn' ? 'আযান' : 'Adhan'}
            </option>
            <option value="notification">
              {language === 'bn' ? 'নোটিফিকেশন' : 'Notification'}
            </option>
          </select>
        </div>
      </div>

      {/* Info Text */}
      <p className="text-xs text-white/30 text-center mt-4">
        {language === 'bn' 
          ? 'নোটিফিকেশন পেতে আপনার ডিভাইসের সেটিংসে অনুমতি দিন' 
          : 'Allow notification permissions in your device settings'}
      </p>
    </div>
  );
};

export default NotificationSettings;
