export const formatNumber = (num, language = 'en') => {
  if (language === 'bn') {
    const banglaDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
    return num.toString().split('').map(d => banglaDigits[d] || d).join('');
  }
  return num.toString();
};

export const formatTimeArabic = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const minute = parseInt(minutes);
  
  if (hour < 12) return `${hour}:${minutes.toString().padStart(2, '0')} ص`;
  if (hour === 12) return `12:${minutes.toString().padStart(2, '0')} م`;
  return `${hour-12}:${minutes.toString().padStart(2, '0')} م`;
};

export const formatDateRange = (startDate, endDate, language = 'en') => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const options = { month: 'short', day: 'numeric' };
  if (start.getFullYear() !== end.getFullYear()) {
    options.year = 'numeric';
  }
  
  return `${start.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', options)} - ${end.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', options)}`;
};

export const formatRelativeTime = (date, language = 'en') => {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (language === 'bn') {
    if (seconds < 60) return 'এখনই';
    if (minutes < 60) return `${minutes} মিনিট আগে`;
    if (hours < 24) return `${hours} ঘন্টা আগে`;
    if (days < 7) return `${days} দিন আগে`;
    return formatDate(date, 'bn');
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  return formatDate(date, 'en');
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

export const formatPhoneNumber = (phone, country = 'BD') => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (country === 'BD' && cleaned.length === 11) {
    return `+88 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  return phone;
};

export const formatAddress = (address) => {
  const parts = [];
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.country) parts.push(address.country);
  return parts.join(', ');
};

export const formatTemperature = (temp, unit = 'celsius') => {
  if (unit === 'fahrenheit') {
    return `${Math.round(temp * 9/5 + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
};

export const formatWindSpeed = (speed, unit = 'kmh') => {
  if (unit === 'mph') {
    return `${Math.round(speed * 0.621371)} mph`;
  }
  return `${Math.round(speed)} km/h`;
};

export const formatPercentage = (value, decimals = 0) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatCurrency = (amount, currency = 'BDT', language = 'en') => {
  const formatter = new Intl.NumberFormat(language === 'bn' ? 'bn-BD' : 'en-US', {
    style: 'currency',
    currency: currency
  });
  return formatter.format(amount);
};