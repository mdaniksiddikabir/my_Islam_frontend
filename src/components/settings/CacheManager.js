import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const CacheManager = () => {
  const { t, language } = useLanguage();
  const [cacheSize, setCacheSize] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [cacheStats, setCacheStats] = useState({
    localStorage: 0,
    sessionStorage: 0,
    cacheStorage: 0,
    total: 0
  });

  // Calculate cache size on component mount
  useEffect(() => {
    calculateCacheSize();
  }, []);

  // Format bytes to human readable format
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate cache size
  const calculateCacheSize = async () => {
    try {
      setLoading(true);
      
      // Calculate localStorage size
      let localStorageSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        localStorageSize += (key?.length || 0) + (value?.length || 0);
      }

      // Calculate sessionStorage size
      let sessionStorageSize = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        sessionStorageSize += (key?.length || 0) + (value?.length || 0);
      }

      // Calculate Cache Storage size (if available)
      let cacheStorageSize = 0;
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          for (const request of keys) {
            const response = await cache.match(request);
            const blob = await response?.blob();
            cacheStorageSize += blob?.size || 0;
          }
        }
      }

      const total = localStorageSize + sessionStorageSize + cacheStorageSize;

      setCacheStats({
        localStorage: localStorageSize,
        sessionStorage: sessionStorageSize,
        cacheStorage: cacheStorageSize,
        total
      });

      setCacheSize(formatBytes(total));
    } catch (error) {
      console.error('Error calculating cache size:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear all cache
  const clearAllCache = async () => {
    try {
      setClearing(true);

      // Clear localStorage (except essential items)
      const essentials = ['token', 'user', 'language', 'theme'];
      const keysToKeep = new Set(essentials);
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!keysToKeep.has(key)) {
          localStorage.removeItem(key);
        }
      }

      // Clear sessionStorage
      sessionStorage.clear();

      // Clear Cache Storage
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Clear service worker caches if any
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        await registration.unregister();
      }

      // Recalculate cache size
      await calculateCacheSize();

      toast.success(
        language === 'bn' 
          ? 'ক্যাশে সফলভাবে মুছে ফেলা হয়েছে' 
          : 'Cache cleared successfully'
      );

    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error(
        language === 'bn' 
          ? 'ক্যাশে মুছে ফেলতে ব্যর্থ' 
          : 'Failed to clear cache'
      );
    } finally {
      setClearing(false);
    }
  };

  // Clear only app cache (keep login data)
  const clearAppCache = async () => {
    try {
      setClearing(true);

      // Clear non-essential localStorage items
      const essentials = ['token', 'user', 'language', 'theme', 'settings'];
      const cachePrefixes = ['cache_', 'temp_', 'quran_', 'prayer_', 'dua_'];
      
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!essentials.includes(key) && cachePrefixes.some(prefix => key?.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      }

      // Clear Cache Storage for app-specific caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        const appCaches = cacheNames.filter(name => 
          name.includes('app') || name.includes('quran') || name.includes('prayer')
        );
        await Promise.all(
          appCaches.map(cacheName => caches.delete(cacheName))
        );
      }

      await calculateCacheSize();

      toast.success(
        language === 'bn' 
          ? 'অ্যাপ ক্যাশে সফলভাবে মুছে ফেলা হয়েছে' 
          : 'App cache cleared successfully'
      );

    } catch (error) {
      console.error('Error clearing app cache:', error);
      toast.error(
        language === 'bn' 
          ? 'অ্যাপ ক্যাশে মুছে ফেলতে ব্যর্থ' 
          : 'Failed to clear app cache'
      );
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Cache Info */}
      <div className="bg-white/5 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-bold text-white">
            {language === 'bn' ? 'ক্যাশে তথ্য' : 'Cache Information'}
          </h4>
          <button
            onClick={calculateCacheSize}
            disabled={loading}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            title={language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">
              {language === 'bn' ? 'মোট ক্যাশে সাইজ:' : 'Total Cache Size:'}
            </span>
            <span className="text-[#d4af37] font-bold">
              {loading ? '...' : cacheSize || '0 B'}
            </span>
          </div>

          <div className="space-y-1 mt-3">
            <div className="flex justify-between text-xs">
              <span className="text-white/30">localStorage</span>
              <span className="text-white/50">{formatBytes(cacheStats.localStorage)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/30">sessionStorage</span>
              <span className="text-white/50">{formatBytes(cacheStats.sessionStorage)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/30">Cache Storage</span>
              <span className="text-white/50">{formatBytes(cacheStats.cacheStorage)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cache Items List */}
      <div className="bg-white/5 rounded-lg p-4">
        <h4 className="font-bold text-white mb-3">
          {language === 'bn' ? 'ক্যাশে আইটেম' : 'Cached Items'}
        </h4>
        
        <div className="max-h-40 overflow-y-auto space-y-1">
          {Array.from({ length: localStorage.length }).map((_, i) => {
            const key = localStorage.key(i);
            if (!key) return null;
            
            const value = localStorage.getItem(key);
            const size = (key.length + (value?.length || 0));
            
            return (
              <div key={key} className="flex justify-between items-center text-xs p-1 hover:bg-white/5 rounded">
                <span className="text-white/70 truncate max-w-[150px]">{key}</span>
                <span className="text-white/30">{formatBytes(size)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={clearAppCache}
          disabled={clearing}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <i className="fas fa-broom"></i>
          <span>
            {language === 'bn' ? 'অ্যাপ ক্যাশে মুছুন' : 'Clear App Cache'}
          </span>
        </button>

        <button
          onClick={clearAllCache}
          disabled={clearing}
          className="p-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <i className="fas fa-trash-alt"></i>
          <span>
            {language === 'bn' ? 'সব ক্যাশে মুছুন' : 'Clear All Cache'}
          </span>
        </button>
      </div>

      {/* Warning Message */}
      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <p className="text-xs text-yellow-500 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i>
          {language === 'bn' 
            ? 'সব ক্যাশে মুছে ফেললে আপনি লগআউট হয়ে যাবেন এবং কিছু সেটিংস রিসেট হবে'
            : 'Clearing all cache will log you out and reset some settings'
          }
        </p>
      </div>

      {/* Progress indicator when clearing */}
      {clearing && (
        <div className="mt-4 p-4 bg-[#d4af37]/10 rounded-lg text-center">
          <i className="fas fa-spinner fa-spin text-[#d4af37] text-2xl mb-2"></i>
          <p className="text-sm text-white/70">
            {language === 'bn' ? 'ক্যাশে মুছে ফেলা হচ্ছে...' : 'Clearing cache...'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CacheManager;
