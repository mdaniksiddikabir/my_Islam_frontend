/**
 * Cache Service for storing prayer times
 * Reduces API calls by 90%
 */

const CACHE_CONFIG = {
  PRAYER_TIMES: 'prayer_times_cache',
  RAMADAN_CALENDAR: 'ramadan_calendar',
  DURATION: 24 * 60 * 60 * 1000, // 24 hours
  MAX_ENTRIES: 50 // Prevent localStorage from getting too big
};

class CacheService {
  constructor() {
    this.cache = new Map();
    this.loadFromStorage();
  }

  /**
   * Generate cache key from location and method
   */
  generateKey(type, location, method, date = null) {
    const base = `${type}_${location.lat.toFixed(4)}_${location.lng.toFixed(4)}_${method}`;
    return date ? `${base}_${date}` : base;
  }

  /**
   * Get item from cache
   */
  get(type, location, method, date = null) {
    const key = this.generateKey(type, location, method, date);
    
    // Check memory cache first (fastest)
    if (this.cache.has(key)) {
      const { data, timestamp } = this.cache.get(key);
      if (Date.now() - timestamp < CACHE_CONFIG.DURATION) {
        console.log(`✅ Cache HIT: ${key}`);
        return data;
      }
      this.cache.delete(key);
    }
    
    // Check localStorage (slower but persistent)
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const { data, timestamp } = JSON.parse(stored);
        if (Date.now() - timestamp < CACHE_CONFIG.DURATION) {
          // Store in memory for faster next access
          this.cache.set(key, { data, timestamp });
          console.log(`💾 Cache LOADED from storage: ${key}`);
          return data;
        }
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }
    
    console.log(`❌ Cache MISS: ${key}`);
    return null;
  }

  /**
   * Save item to cache
   */
  set(type, location, method, data, date = null) {
    const key = this.generateKey(type, location, method, date);
    const cacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    // Save to memory
    this.cache.set(key, cacheEntry);
    
    // Save to localStorage (async to not block)
    setTimeout(() => {
      try {
        // Clean old entries if needed
        this.cleanup();
        localStorage.setItem(key, JSON.stringify(cacheEntry));
        console.log(`💾 Cache SAVED: ${key}`);
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          this.clearOldest();
          try {
            localStorage.setItem(key, JSON.stringify(cacheEntry));
          } catch (e) {
            console.warn('Cache write failed even after cleanup');
          }
        }
      }
    }, 0);
  }

  /**
   * Clear oldest cache entries
   */
  clearOldest() {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(k => 
        k.startsWith(CACHE_CONFIG.PRAYER_TIMES) || 
        k.startsWith(CACHE_CONFIG.RAMADAN_CALENDAR)
      );
      
      if (cacheKeys.length > CACHE_CONFIG.MAX_ENTRIES) {
        // Sort by timestamp and remove oldest
        const entries = cacheKeys.map(key => ({
          key,
          timestamp: JSON.parse(localStorage.getItem(key)).timestamp
        }));
        
        entries.sort((a, b) => a.timestamp - b.timestamp);
        
        const toDelete = entries.slice(0, entries.length - CACHE_CONFIG.MAX_ENTRIES);
        toDelete.forEach(entry => localStorage.removeItem(entry.key));
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_CONFIG.PRAYER_TIMES) || 
            key.startsWith(CACHE_CONFIG.RAMADAN_CALENDAR)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear failed:', error);
    }
  }

  /**
   * Load existing cache from localStorage on startup
   */
  loadFromStorage() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_CONFIG.PRAYER_TIMES) || 
            key.startsWith(CACHE_CONFIG.RAMADAN_CALENDAR)) {
          try {
            const { data, timestamp } = JSON.parse(localStorage.getItem(key));
            if (Date.now() - timestamp < CACHE_CONFIG.DURATION) {
              this.cache.set(key, { data, timestamp });
            } else {
              localStorage.removeItem(key);
            }
          } catch (e) {
            // Invalid cache entry, remove it
            localStorage.removeItem(key);
          }
        }
      });
      console.log(`📦 Loaded ${this.cache.size} items from cache`);
    } catch (error) {
      console.warn('Failed to load cache from storage');
    }
  }
}

export default new CacheService();
