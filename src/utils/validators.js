export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) return { valid: false, error: 'Email is required' };
  if (!re.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
};

export const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  if (password.length > 50) return { valid: false, error: 'Password must be less than 50 characters' };
  return { valid: true };
};

export const validateName = (name) => {
  if (!name) return { valid: false, error: 'Name is required' };
  if (name.length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  if (name.length > 50) return { valid: false, error: 'Name must be less than 50 characters' };
  if (!/^[a-zA-Z\s]+$/.test(name)) return { valid: false, error: 'Name can only contain letters and spaces' };
  return { valid: true };
};

export const validatePhone = (phone, country = 'BD') => {
  if (!phone) return { valid: false, error: 'Phone number is required' };
  
  const patterns = {
    BD: /^01[3-9]\d{8}$/,
    US: /^\+?1?\d{10}$/,
    UK: /^\+?44\d{10}$/
  };
  
  if (!patterns[country].test(phone)) {
    return { valid: false, error: `Invalid ${country} phone number` };
  }
  return { valid: true };
};

export const validateCoordinates = (lat, lng) => {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }
  return { valid: true };
};

export const validateHijriDate = (year, month, day) => {
  if (year < 1 || year > 1500) {
    return { valid: false, error: 'Hijri year must be between 1 and 1500' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }
  if (day < 1 || day > 30) {
    return { valid: false, error: 'Day must be between 1 and 30' };
  }
  return { valid: true };
};

export const validateGregorianDate = (year, month, day) => {
  if (year < 1900 || year > 2100) {
    return { valid: false, error: 'Year must be between 1900 and 2100' };
  }
  if (month < 1 || month > 12) {
    return { valid: false, error: 'Month must be between 1 and 12' };
  }
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, error: `Day must be between 1 and ${daysInMonth}` };
  }
  return { valid: true };
};

export const validateUrl = (url) => {
  if (!url) return { valid: false, error: 'URL is required' };
  try {
    new URL(url);
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
};

export const validateSearchQuery = (query) => {
  if (!query) return { valid: false, error: 'Search query is required' };
  if (query.length < 3) {
    return { valid: false, error: 'Search query must be at least 3 characters' };
  }
  if (query.length > 100) {
    return { valid: false, error: 'Search query must be less than 100 characters' };
  }
  return { valid: true };
};

export const validateSettings = (settings) => {
  const errors = {};
  
  if (settings.language && !['en', 'bn'].includes(settings.language)) {
    errors.language = 'Invalid language selection';
  }
  
  if (settings.theme && !['dark', 'light', 'auto'].includes(settings.theme)) {
    errors.theme = 'Invalid theme selection';
  }
  
  if (settings.calculationMethod && (settings.calculationMethod < 1 || settings.calculationMethod > 16)) {
    errors.calculationMethod = 'Invalid calculation method';
  }
  
  if (settings.reminderTime && ![5, 10, 15, 30, 60].includes(settings.reminderTime)) {
    errors.reminderTime = 'Invalid reminder time';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
};