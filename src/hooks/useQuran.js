import { useState, useEffect } from 'react';
import { getSurahs, getVerses, getDailyVerse, searchQuran } from '../services/quranService';
import { useLanguage } from '../context/LanguageContext';
import toast from 'react-hot-toast';

export const useQuran = () => {
  const { language } = useLanguage();
  const [surahs, setSurahs] = useState([]);
  const [currentSurah, setCurrentSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [dailyVerse, setDailyVerse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadSurahs();
    loadDailyVerse();
  }, [language]);

  const loadSurahs = async () => {
    try {
      setLoading(true);
      const data = await getSurahs(language);
      setSurahs(data);
    } catch (err) {
      console.error('Error loading surahs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSurah = async (surahId) => {
    try {
      setLoading(true);
      const data = await getVerses(surahId, language);
      setCurrentSurah(data.surah);
      setVerses(data.verses);
      setError(null);
    } catch (err) {
      console.error('Error loading surah:', err);
      setError(err.message);
      toast.error('Failed to load surah');
    } finally {
      setLoading(false);
    }
  };

  const loadDailyVerse = async () => {
    try {
      const data = await getDailyVerse(language);
      setDailyVerse(data);
    } catch (err) {
      console.error('Error loading daily verse:', err);
    }
  };

  const search = async (query) => {
    try {
      setLoading(true);
      const results = await searchQuran(query, language);
      setSearchResults(results);
      return results;
    } catch (err) {
      console.error('Error searching Quran:', err);
      toast.error('Search failed');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
  };

  return {
    surahs,
    currentSurah,
    verses,
    dailyVerse,
    searchResults,
    loading,
    error,
    loadSurah,
    search,
    clearSearch,
    refresh: loadSurahs
  };
};