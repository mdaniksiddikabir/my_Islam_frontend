import api from './api';

export const registerPushNotification = async (subscription) => {
  const response = await api.post('/notifications/register', subscription);
  return response.data;
};

export const unregisterPushNotification = async () => {
  const response = await api.post('/api/notifications/unregister');
  return response.data;
};

export const sendTestNotification = async () => {
  const response = await api.post('/api/notifications/test');
  return response.data;
};

export const getNotificationSettings = async () => {
  const response = await api.get('/api/notifications/settings');
  return response.data.data;
};

export const updateNotificationSettings = async (settings) => {
  const response = await api.put('/api/notifications/settings', settings);
  return response.data;
};

export const schedulePrayerReminder = async (prayer, time) => {
  const response = await api.post('/api/notifications/schedule', {
    type: 'prayer',
    prayer,
    time
  });
  return response.data;
};

export const cancelAllReminders = async () => {
  const response = await api.delete('/api/notifications/all');
  return response.data;
};

// Check if browser supports notifications
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return { granted: false, error: 'Notifications not supported' };
  }

  const permission = await Notification.requestPermission();
  return {
    granted: permission === 'granted',
    permission
  };
};

// Show a browser notification
export const showNotification = (title, options = {}) => {
  if (!isNotificationSupported()) return false;
  
  if (Notification.permission === 'granted') {
    new Notification(title, options);
    return true;
  }
  return false;
};
