import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../hooks/useLocations';
import hijriService from '../services/hijriService';
import { toast } from 'react-hot-toast';

const RamadanContext = createContext();

export const useRamadan = () => {
  const context = useContext(RamadanContext);
  if (!context) {
    throw new Error('useRamadan must be used within RamadanProvider');
  }
  return context;
};

export const RamadanProvider = ({ children }) => {
  const { location: userLocation } = useLocation();
  const [ramadanData, setRamadanData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [lastLocation, setLastLocation] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(4);
  const [useOffsets, setUseOffsets] = useState(false);
  const [error, setError] = useState(null);
  const [forceReload, setForceReload] = useState(0);
  
  const dataCache = useRef({});
  const abortControllerRef = useRef(null);

  // Listen for location update events
  useEffect(() => {
    const handleLocationUpdate = (event) => {
      console.log('📍 Location updated event received:', event.detail);
      // Force a reload by incrementing counter
      setForceReload(prev => prev + 1);
      // Clear last location to force reload
      setLastLocation(null);
      // Clear cache for this location
      if (userLocation) {
        const cacheKey = `${userLocation.lat}_${userLocation.lng}_${selectedMethod}_${useOffsets}`;
        delete dataCache.current[cacheKey];
      }
    };

    window.addEventListener('locationUpdated', handleLocationUpdate);
    
    return () => {
      window.removeEventListener('locationUpdated', handleLocationUpdate);
    };
  }, [userLocation, selectedMethod, useOffsets]);

  // Load saved data from localStorage on mount
  useEffect(() => {
    const loadSavedData = () => {
      try {
        const savedData = localStorage.getItem('ramadanData');
        const savedMetadata = localStorage.getItem('ramadanMetadata');
        
        if (savedData && savedMetadata) {
          const parsed = JSON.parse(savedData);
          const metadata = JSON.parse(savedMetadata);
          
          // Check if data is not too old (24 hours)
          const isExpired = Date.now() - metadata.timestamp > 24 * 60 * 60 * 1000;
          
          if (!isExpired) {
            // Restore Date objects
            if (parsed.days) {
              parsed.days = parsed.days.map(day => ({
                ...day,
                gregorian: new Date(day.gregorian)
              }));
            }
            
            setRamadanData(parsed);
            setLastLocation(metadata.location);
            setSelectedMethod(metadata.method || 4);
            setUseOffsets(metadata.useOffsets || false);
            
            console.log('📦 Loaded cached Ramadan data');
          } else {
            // Clear expired data
            localStorage.removeItem('ramadanData');
            localStorage.removeItem('ramadanMetadata');
          }
        }
      } catch (e) {
        console.error('Failed to load cached data:', e);
      }
    };
    
    loadSavedData();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (ramadanData && lastLocation) {
      const metadata = {
        location: lastLocation,
        method: selectedMethod,
        useOffsets,
        timestamp: Date.now()
      };
      
      localStorage.setItem('ramadanData', JSON.stringify(ramadanData));
      localStorage.setItem('ramadanMetadata', JSON.stringify(metadata));
    }
  }, [ramadanData, lastLocation, selectedMethod, useOffsets]);

  // Check if we need to load data
  useEffect(() => {
    if (!userLocation) {
      console.log('⏳ Waiting for user location...');
      return;
    }
    
    console.log('📍 User location:', userLocation);
    console.log('📍 Last location:', lastLocation);
    console.log('🔄 Force reload counter:', forceReload);
    
    const shouldLoadData = () => {
      // No data at all
      if (!ramadanData) {
        console.log('🔄 No data, loading...');
        return true;
      }
      
      // No last location
      if (!lastLocation) {
        console.log('🔄 No last location, loading...');
        return true;
      }
      
      // Location changed (check coordinates AND city)
      if (lastLocation.lat !== userLocation.lat || 
          lastLocation.lng !== userLocation.lng ||
          lastLocation.city !== userLocation.city) {
        console.log('🔄 Location changed, loading...');
        return true;
      }
      
      // Method or offsets changed
      if (lastLocation.method !== selectedMethod ||
          lastLocation.useOffsets !== useOffsets) {
        console.log('🔄 Method/offsets changed, loading...');
        return true;
      }
      
      console.log('✅ Using cached data');
      return false;
    };
    
    if (shouldLoadData() || forceReload > 0) {
      loadRamadanData();
    }
  }, [userLocation, selectedMethod, useOffsets, forceReload]);

  const loadRamadanData = useCallback(async () => {
    if (!userLocation) {
      console.log('❌ No user location');
      return;
    }
    
    console.log('🚀 Loading Ramadan data for:', userLocation);
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      setLoadingProgress(0);
      setLoadingMessage('Initializing...');
      
      const toastId = toast.loading(
        '📅 Generating Ramadan calendar...'
      );
      
      // Generate cache key
      const cacheKey = `${userLocation.lat}_${userLocation.lng}_${selectedMethod}_${useOffsets}`;
      
      // Clear cache for this specific location to force fresh data
      delete dataCache.current[cacheKey];
      console.log('🗑️ Cleared cache for:', cacheKey);
      
      // Get complete data from hijriService
      const data = await hijriService.getCompleteRamadanData(
        userLocation,
        selectedMethod,
        useOffsets,
        (progress) => {
          setLoadingProgress(progress);
          if (progress < 20) setLoadingMessage('Fetching calendar data...');
          else if (progress < 40) setLoadingMessage('Loading prayer times...');
          else if (progress < 60) setLoadingMessage('Processing Sehri times...');
          else if (progress < 80) setLoadingMessage('Processing Iftar times...');
          else if (progress < 95) setLoadingMessage('Finalizing calendar...');
          else setLoadingMessage('Complete!');
        }
      );
      
      console.log('✅ Data loaded:', data);
      
      setLoadingProgress(100);
      setLoadingMessage('Complete!');
      
      // Store in cache
      dataCache.current[cacheKey] = data;
      
      setTimeout(() => {
        setRamadanData(data);
        setLastLocation({
          ...userLocation,
          method: selectedMethod,
          useOffsets
        });
        
        toast.success('✅ Calendar loaded successfully', { id: toastId });
        setLoading(false);
      }, 500);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request was cancelled');
        return;
      }
      
      console.error('❌ Error loading Ramadan data:', error);
      setError(error.message || 'Failed to load data');
      toast.error('❌ Failed to load data');
      setLoading(false);
    } finally {
      abortControllerRef.current = null;
    }
  }, [userLocation, selectedMethod, useOffsets]);

  const updateMethod = (method) => {
    console.log('🔄 Updating method to:', method);
    setSelectedMethod(method);
  };

  const toggleOffsets = () => {
    console.log('🔄 Toggling offsets to:', !useOffsets);
    setUseOffsets(prev => !prev);
  };

  const refreshData = () => {
    console.log('🔄 Refreshing data...');
    if (userLocation) {
      const cacheKey = `${userLocation.lat}_${userLocation.lng}_${selectedMethod}_${useOffsets}`;
      delete dataCache.current[cacheKey];
      setForceReload(prev => prev + 1);
    }
  };

  const clearCache = () => {
    console.log('🧹 Clearing all cache');
    dataCache.current = {};
    localStorage.removeItem('ramadanData');
    localStorage.removeItem('ramadanMetadata');
    setRamadanData(null);
    setLastLocation(null);
    setForceReload(prev => prev + 1);
    toast.success('🧹 Cache cleared');
  };

  const value = {
    ramadanData,
    loading,
    loadingProgress,
    loadingMessage,
    error,
    selectedMethod,
    useOffsets,
    updateMethod,
    toggleOffsets,
    refreshData,
    clearCache,
    lastLocation
  };

  return (
    <RamadanContext.Provider value={value}>
      {children}
    </RamadanContext.Provider>
  );
};
