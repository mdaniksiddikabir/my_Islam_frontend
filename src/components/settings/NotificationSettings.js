import React from 'react';
import { useSettings } from '../../context/SettingsContext';

const NotificationSettings = () => {
  const { settings, updateSettings } = useSettings();

  const toggleSetting = (key) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key]
      }
    });
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
        <div>
          <p className="font-bold">Prayer Reminders</p>
          <p className="text-sm text-white/50">Get notified before prayer times</p>
        </div>
        <button
          onClick={() => toggleSetting('prayer')}
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
        <div>
          <p className="font-bold">Quran Reminders</p>
          <p className="text-sm text-white/50">Daily verse notifications</p>
        </div>
        <button
          onClick={() => toggleSetting('quran')}
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
        <div>
          <p className="font-bold">Event Reminders</p>
          <p className="text-sm text-white/50">Islamic events and holidays</p>
        </div>
        <button
          onClick={() => toggleSetting('events')}
          className={`w-12 h-6 rounded-full transition ${
            settings.notifications.events ? 'bg-[#d4af37]' : 'bg-white/20'
          }`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transform transition ${
            settings.notifications.events ? 'translate-x-7' : 'translate-x-1'
          }`} />
        </button>
      </label>

      <div className="mt-4">
        <label className="block text-sm text-white/50 mb-2">Reminder Time</label>
        <select
          value={settings.reminderTime}
          onChange={(e) => updateSettings({ reminderTime: parseInt(e.target.value) })}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
        >
          <option value="5">5 minutes before</option>
          <option value="10">10 minutes before</option>
          <option value="15">15 minutes before</option>
          <option value="30">30 minutes before</option>
          <option value="60">1 hour before</option>
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm text-white/50 mb-2">Sound</label>
        <div className="grid grid-cols-2 gap-3">
          <button className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition">
            <i className="fas fa-volume-up mr-2"></i>
            Test Sound
          </button>
          <select className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
            <option value="default">Default</option>
            <option value="gentle">Gentle</option>
            <option value="adhan">Adhan</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;