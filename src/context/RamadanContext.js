import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  const [lastLocation, setLastLocation] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState(4);
  const [useOffsets, setUseOffsets] = useState(false);
  
  const dataCache = useRef({});

  // Load saved data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('ramadanData');
    const savedMetadata = localStorage.getItem('ramadanMetadata');
    
    if (savedData && savedMetadata) {
      try {
        const parsed = JSON.parse(savedData);
        const metadata = JSON.parse(savedMetadata);
        
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
      } catch (e) {
        console.error('Failed to load cached data:', e);
      }
    }
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

  // Load data when location changes
  useEffect(() => {
    if (!userLocation) return;
    
    const locationKey = `${userLocation.lat}_${userLocation.lng}_${selectedMethod}_${useOffsets}`;
    
    // Check if we already have data for this location in cache
    if (dataCache.current[locationKey]) {
      console.log('📦 Using cached data for this location');
      setRamadanData(dataCache.current[locationKey]);
      setLastLocation(userLocation);
      return;
    }
    
    // Check if location actually changed
    const locationChanged = !lastLocation || 
      lastLocation.lat !== userLocation.lat || 
      lastLocation.lng !== userLocation.lng ||
      lastLocation.city !== userLocation.city;
    
    // Only reload if location changed OR method/offsets changed
    const paramsChanged = lastLocation && (
      lastLocation.method !== selectedMethod ||
      lastLocation.useOffsets !== useOffsets
    );
    
    if (locationChanged || paramsChanged) {
      loadRamadanData();
    }
  }, [userLocation, selectedMethod, useOffsets]);

  const loadRamadanData = async () => {
    if (!userLocation) return;
    
    try {
      setLoading(true);
      setLoadingProgress(0);
      
      const toastId = toast.loading(
        '📅 Generating Ramadan calendar...'
      );
      
      const data = await hijriService.getCompleteRamadanData(
        userLocation,
        selectedMethod,
        useOffsets,
        (progress) => {
          setLoadingProgress(progress);
        }
      );
      
      // Cache the data
      const locationKey = `${userLocation.lat}_${userLocation.lng}_${selectedMethod}_${useOffsets}`;
      dataCache.current[locationKey] = data;
      
      setRamadanData(data);
      setLastLocation({
        ...userLocation,
        method: selectedMethod,
        useOffsets
      });
      
      toast.success('✅ Calendar loaded successfully', { id: toastId });
      
    } catch (error) {
      console.error('Error loading Ramadan data:', error);
      toast.error('❌ Failed to load data');
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  };

  const updateMethod = (method) => {
    setSelectedMethod(method);
  };

  const toggleOffsets = () => {
    setUseOffsets(prev => !prev);
  };

  const refreshData = () => {
    // Clear cache for current location and reload
    if (userLocation) {
      const locationKey = `${userLocation.lat}_${userLocation.lng}_${selectedMethod}_${useOffsets}`;
      delete dataCache.current[locationKey];
      loadRamadanData();
    }
  };

  const clearCache = () => {
    dataCache.current = {};
    localStorage.removeItem('ramadanData');
    localStorage.removeItem('ramadanMetadata');
    setRamadanData(null);
    setLastLocation(null);
    toast.success('🧹 Cache cleared');
  };

  const value = {
    ramadanData,
    loading,
    loadingProgress,
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
