import api from './api';
import cacheService from './cacheService';

// Batch processor for parallel requests
class PrayerServiceOptimized {
  constructor() {
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.processing = false;
  }

  /**
   * Get single prayer time with caching
   */
  async getPrayerTime(lat, lng, method, date) {
    const cacheKey = cacheService.generateKey(
      cacheService.CONFIG.PRAYER_TIMES,
      { lat, lng },
      method,
      date
    );
    
    // Check cache first
    const cached = cacheService.get(
      cacheService.CONFIG.PRAYER_TIMES,
      { lat, lng },
      method,
      date
    );
    
    if (cached) {
      return cached;
    }
    
    // Make API call
    try {
      const response = await api.get('/api/prayer/times', {
        params: { lat, lng, method, date }
      });
      
      const data = response.data.data;
      
      // Save to cache
      cacheService.set(
        cacheService.CONFIG.PRAYER_TIMES,
        { lat, lng },
        method,
        data,
        date
      );
      
      return data;
    } catch (error) {
      console.error(`Failed to fetch for ${date}:`, error);
      // Return default times on error
      return {
        timings: {
          Fajr: '05:30',
          Maghrib: '18:15'
        }
      };
    }
  }

  /**
   * Get ALL 30 days in parallel with batching
   */
  async getAllRamadanTimes(lat, lng, method, dates) {
    console.log(`🚀 Fetching ${dates.length} days in parallel...`);
    
    // Split into batches of 10 to avoid overwhelming the API
    const batchSize = 10;
    const batches = [];
    
    for (let i = 0; i < dates.length; i += batchSize) {
      batches.push(dates.slice(i, i + batchSize));
    }
    
    let allResults = [];
    let completed = 0;
    
    // Show progress
    const onProgress = (batchResults) => {
      completed += batchResults.length;
      const percent = Math.round((completed / dates.length) * 100);
      console.log(`📊 Progress: ${percent}%`);
    };
    
    // Process batches sequentially (but each batch in parallel)
    for (const batch of batches) {
      const batchPromises = batch.map(date => 
        this.getPrayerTime(lat, lng, method, date)
          .catch(() => ({
            timings: { Fajr: '05:30', Maghrib: '18:15' }
          }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      allResults = [...allResults, ...batchResults];
      onProgress(batchResults);
    }
    
    return allResults;
  }

  /**
   * Prefetch nearby dates (for future days)
   */
  async prefetchNearbyDates(lat, lng, method, currentDate, range = 5) {
    const dates = [];
    for (let i = -range; i <= range; i++) {
      const date = new Date(currentDate);
      date.setDate(currentDate.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    // Prefetch in background (don't await)
    this.getAllRamadanTimes(lat, lng, method, dates).catch(console.warn);
  }
}

export default new PrayerServiceOptimized();
