import moment from 'moment';
import 'moment-hijri';

// Format time to 12-hour format
export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Format date to readable string
export const formatDate = (date, language = 'en') => {
  return new Date(date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Get Hijri date
export const getHijriDate = (date = new Date()) => {
  return {
    day: moment(date).iDate(),
    month: moment(date).iMonth() + 1,
    year: moment(date).iYear(),
    monthName: moment(date).format('iMMMM')
  };
};

// Convert Hijri to Gregorian
export const hijriToGregorian = (year, month, day) => {
  const date = moment().iYear(year).iMonth(month - 1).iDate(day);
  return date.toDate();
};

// Convert Gregorian to Hijri
export const gregorianToHijri = (date) => {
  return {
    day: moment(date).iDate(),
    month: moment(date).iMonth() + 1,
    year: moment(date).iYear()
  };
};

// Calculate time remaining until a given time
export const getTimeRemaining = (targetTime) => {
  const now = new Date();
  const [hours, minutes] = targetTime.split(':');
  const target = new Date();
  target.setHours(parseInt(hours), parseInt(minutes), 0);

  if (now > target) {
    target.setDate(target.getDate() + 1);
  }

  const diff = target - now;
  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

  return {
    hours: hoursLeft,
    minutes: minutesLeft,
    seconds: secondsLeft,
    total: diff,
    formatted: `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`
  };
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get cardinal direction from angle
export const getCardinalDirection = (angle) => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((angle % 360) / 45)) % 8;
  return directions[index];
};

// Save to localStorage
export const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// Get from localStorage
export const getFromStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Copy text to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone number (Bangladesh)
export const isValidBangladeshPhone = (phone) => {
  const re = /^01[3-9]\d{8}$/;
  return re.test(phone);
};

// Get platform info
export const getPlatform = () => {
  const ua = navigator.userAgent;
  if (/(android)/i.test(ua)) return 'android';
  if (/(iphone|ipad|ipod)/i.test(ua)) return 'ios';
  return 'web';
};

// Check if PWA can be installed
export const canInstallPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
};

// Share content using Web Share API
export const shareContent = async (data) => {
  if (navigator.share) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  }
  return false;
};