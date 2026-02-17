export const PRAYER_NAMES = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha'
};

export const PRAYER_NAMES_BN = {
  fajr: 'ফজর',
  sunrise: 'সূর্যোদয়',
  dhuhr: 'যোহর',
  asr: 'আসর',
  maghrib: 'মাগরিব',
  isha: 'ইশা'
};

export const CALCULATION_METHODS = [
  { id: 1, name: 'Karachi (University of Islamic Sciences)' },
  { id: 2, name: 'ISNA (Islamic Society of North America)' },
  { id: 3, name: 'Egyptian General Authority' },
  { id: 4, name: 'Umm Al-Qura (Makkah)' },
  { id: 5, name: 'Karachi (Old)' },
  { id: 12, name: 'Dubai' },
  { id: 15, name: 'Kuwait' },
  { id: 16, name: 'Qatar' }
];

export const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
  'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
];

export const HIJRI_MONTHS_BN = [
  'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
  'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান',
  'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'
];

export const GREGORIAN_MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const GREGORIAN_MONTHS_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export const WEEK_DAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEK_DAYS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];

export const ISLAMIC_EVENTS = [
  { id: 1, name: 'Islamic New Year', hijri: { month: 1, day: 1 } },
  { id: 2, name: 'Day of Ashura', hijri: { month: 1, day: 10 } },
  { id: 3, name: 'Mawlid al-Nabi', hijri: { month: 3, day: 12 } },
  { id: 4, name: 'Isra and Mi\'raj', hijri: { month: 7, day: 27 } },
  { id: 5, name: 'Mid-Sha\'ban', hijri: { month: 8, day: 15 } },
  { id: 6, name: 'Beginning of Ramadan', hijri: { month: 9, day: 1 } },
  { id: 7, name: 'Laylat al-Qadr', hijri: { month: 9, day: 27 } },
  { id: 8, name: 'Eid al-Fitr', hijri: { month: 10, day: 1 } },
  { id: 9, name: 'Day of Arafah', hijri: { month: 12, day: 9 } },
  { id: 10, name: 'Eid al-Adha', hijri: { month: 12, day: 10 } }
];

export const THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  AUTO: 'auto'
};

export const LANGUAGES = {
  EN: 'en',
  BN: 'bn'
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  SETTINGS: 'settings',
  FAVORITES: 'favorites',
  BOOKMARKS: 'bookmarks'
};

export const API_ENDPOINTS = {
  PRAYER: '/prayer',
  QIBLA: '/qibla',
  QURAN: '/quran',
  CALENDAR: '/calendar',
  DUAS: '/duas',
  AUTH: '/auth',
  USERS: '/users',
  NOTIFICATIONS: '/notifications'
};