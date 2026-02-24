import axios from 'axios';

class CitySearchService {
  constructor() {
    this.baseURL = 'https://nominatim.openstreetmap.org';
    this.userAgent = 'IslamicApp/1.0';
    this.cache = new Map();
    this.CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.lastRequestTime = 0;
    this.minRequestInterval = 1000; // 1 second (respect Nominatim policy)
  }

  /**
   * Search for cities worldwide
   * @param {string} query - City name to search
   * @param {number} limit - Maximum number of results (default: 10)
   * @returns {Promise<Array>} - Array of city objects
   */
  async searchCities(query, limit = 10) {
    // Validate input
    if (!query || query.trim().length < 2) {
      return [];
    }

    const trimmedQuery = query.trim();
    const cacheKey = `search_${trimmedQuery}_${limit}`;

    // Check cache first
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      console.log('📍 Using cached search results for:', trimmedQuery);
      return cached;
    }

    // Rate limiting
    await this._waitForRateLimit();

    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          q: trimmedQuery,
          format: 'json',
          addressdetails: 1,
          limit: limit,
          'accept-language': 'en'
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept-Language': 'en'
        },
        timeout: 10000
      });

      if (!response.data || response.data.length === 0) {
        return [];
      }

      const results = this._formatResults(response.data);
      
      // Save to cache
      this._saveToCache(cacheKey, results);
      
      return results;

    } catch (error) {
      console.error('City search failed:', error);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Search timed out. Please try again.');
      }
      
      throw new Error('Failed to search cities. Please check your connection.');
    }
  }

  /**
   * Get city details by coordinates (reverse geocoding)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object|null>} - City object or null
   */
  async getCityByCoordinates(lat, lng) {
    const cacheKey = `reverse_${lat.toFixed(4)}_${lng.toFixed(4)}`;
    
    // Check cache
    const cached = this._getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    await this._waitForRateLimit();

    try {
      const response = await axios.get(`${this.baseURL}/reverse`, {
        params: {
          lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          zoom: 18
        },
        headers: {
          'User-Agent': this.userAgent
        },
        timeout: 10000
      });

      if (!response.data) {
        return null;
      }

      const result = this._formatReverseResult(response.data);
      
      // Save to cache
      this._saveToCache(cacheKey, result);
      
      return result;

    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  /**
   * Format search results
   * @private
   */
  _formatResults(data) {
    return data.map(item => ({
      id: item.place_id,
      name: this._getCityName(item),
      fullName: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      country: item.address?.country || 'Unknown',
      countryCode: item.address?.country_code?.toUpperCase() || '',
      city: this._getCityName(item),
      state: item.address?.state || '',
      district: item.address?.state_district || '',
      county: item.address?.county || '',
      type: item.type || 'city',
      importance: item.importance || 0,
      boundingBox: item.boundingbox
    })).sort((a, b) => b.importance - a.importance); // Sort by importance
  }

  /**
   * Format reverse geocoding result
   * @private
   */
  _formatReverseResult(data) {
    return {
      id: data.place_id,
      name: this._getCityName(data),
      fullName: data.display_name,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon),
      country: data.address?.country || 'Unknown',
      countryCode: data.address?.country_code?.toUpperCase() || '',
      city: this._getCityName(data),
      state: data.address?.state || '',
      district: data.address?.state_district || '',
      county: data.address?.county || '',
      postcode: data.address?.postcode || '',
      road: data.address?.road || '',
      neighbourhood: data.address?.neighbourhood || ''
    };
  }

  /**
   * Extract city name from address
   * @private
   */
  _getCityName(item) {
    const addr = item.address;
    return addr?.city || 
           addr?.town || 
           addr?.village || 
           addr?.hamlet || 
           addr?.county || 
           addr?.state_district || 
           addr?.state || 
           item.display_name.split(',')[0].trim() || 
           'Unknown';
  }

  /**
   * Get from cache
   * @private
   */
  _getFromCache(key) {
    try {
      const cached = localStorage.getItem(`city_search_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.CACHE_DURATION) {
          return data;
        }
        localStorage.removeItem(`city_search_${key}`);
      }
    } catch (error) {
      console.warn('Cache read failed:', error);
    }
    return null;
  }

  /**
   * Save to cache
   * @private
   */
  _saveToCache(key, data) {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`city_search_${key}`, JSON.stringify(cacheData));
      
      // Clean old cache entries
      this._cleanOldCache();
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this._clearOldestCache();
        try {
          localStorage.setItem(`city_search_${key}`, JSON.stringify(cacheData));
        } catch (e) {
          console.warn('Cache save failed even after cleanup');
        }
      }
    }
  }

  /**
   * Clean cache entries older than CACHE_DURATION
   * @private
   */
  _cleanOldCache() {
    try {
      const now = Date.now();
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('city_search_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            if (now - item.timestamp > this.CACHE_DURATION) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Clear oldest cache entries when quota exceeded
   * @private
   */
  _clearOldestCache() {
    try {
      const cacheEntries = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('city_search_')) {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            cacheEntries.push({ key, timestamp: item.timestamp });
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
      
      // Sort by timestamp (oldest first) and remove oldest 20%
      cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
      const removeCount = Math.floor(cacheEntries.length * 0.2);
      
      for (let i = 0; i < removeCount; i++) {
        localStorage.removeItem(cacheEntries[i].key);
      }
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  /**
   * Rate limiting for Nominatim API
   * @private
   */
  async _waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Clear all search cache
   */
  clearCache() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('city_search_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      this.cache.clear();
      console.log('🧹 Search cache cleared');
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  /**
   * Get popular/major cities as quick suggestions
   * @returns {Array} - Array of popular cities
   */
  getPopularCities() {
    return [
      // South Asia
      { name: 'Dhaka', country: 'Bangladesh', lat: 23.8103, lng: 90.4125 },
      { name: 'Chittagong', country: 'Bangladesh', lat: 22.3569, lng: 91.7832 },
      { name: 'Sylhet', country: 'Bangladesh', lat: 24.8949, lng: 91.8687 },
      { name: 'Delhi', country: 'India', lat: 28.6139, lng: 77.2090 },
      { name: 'Mumbai', country: 'India', lat: 19.0760, lng: 72.8777 },
      { name: 'Karachi', country: 'Pakistan', lat: 24.8607, lng: 67.0011 },
      { name: 'Lahore', country: 'Pakistan', lat: 31.5204, lng: 74.3587 },
      
      // Southeast Asia
      { name: 'Jakarta', country: 'Indonesia', lat: -6.2088, lng: 106.8456 },
      { name: 'Kuala Lumpur', country: 'Malaysia', lat: 3.1390, lng: 101.6869 },
      { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
      { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
      { name: 'Manila', country: 'Philippines', lat: 14.5995, lng: 120.9842 },
      
      // Middle East
      { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
      { name: 'Riyadh', country: 'Saudi Arabia', lat: 24.7136, lng: 46.6753 },
      { name: 'Makkah', country: 'Saudi Arabia', lat: 21.3891, lng: 39.8579 },
      { name: 'Madinah', country: 'Saudi Arabia', lat: 24.5247, lng: 39.5692 },
      { name: 'Doha', country: 'Qatar', lat: 25.2854, lng: 51.5310 },
      { name: 'Kuwait City', country: 'Kuwait', lat: 29.3759, lng: 47.9774 },
      { name: 'Muscat', country: 'Oman', lat: 23.5880, lng: 58.3829 },
      
      // Africa
      { name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357 },
      { name: 'Casablanca', country: 'Morocco', lat: 33.5731, lng: -7.5898 },
      { name: 'Lagos', country: 'Nigeria', lat: 6.5244, lng: 3.3792 },
      { name: 'Nairobi', country: 'Kenya', lat: -1.2921, lng: 36.8219 },
      { name: 'Johannesburg', country: 'South Africa', lat: -26.2041, lng: 28.0473 },
      
      // Europe
      { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
      { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
      { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
      { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
      { name: 'Madrid', country: 'Spain', lat: 40.4168, lng: -3.7038 },
      { name: 'Istanbul', country: 'Turkey', lat: 41.0082, lng: 28.9784 },
      { name: 'Moscow', country: 'Russia', lat: 55.7558, lng: 37.6173 },
      
      // Americas
      { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
      { name: 'Los Angeles', country: 'USA', lat: 34.0522, lng: -118.2437 },
      { name: 'Chicago', country: 'USA', lat: 41.8781, lng: -87.6298 },
      { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
      { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
      { name: 'São Paulo', country: 'Brazil', lat: -23.5505, lng: -46.6333 },
      { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
      
      // Oceania
      { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
      { name: 'Melbourne', country: 'Australia', lat: -37.8136, lng: 144.9631 },
      { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633 }
    ];
  }
}

export default new CitySearchService();
