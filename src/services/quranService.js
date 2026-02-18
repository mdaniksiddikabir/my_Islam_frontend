import api from './api';

// =====================================================
// QURAN SERVICE - COMPLETE WITH ALL FUNCTIONS
// =====================================================

/**
 * Get all surahs
 */
export const getSurahs = async (language = 'en') => {
  try {
    const response = await api.get('/quran/surahs', {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching surahs:', error);
    // Return fallback data
    return [
      { id: 1, name: 'الفاتحة', translation: 'Al-Fatihah', totalVerses: 7 },
      { id: 2, name: 'البقرة', translation: 'Al-Baqarah', totalVerses: 286 }
    ];
  }
};

/**
 * Get verses of a surah
 */
export const getVerses = async (surahId, language = 'en') => {
  try {
    const response = await api.get(`/quran/surah/${surahId}/verses`, {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching verses:', error);
    return { verses: [] };
  }
};

/**
 * ✅ FIXED: Get daily verse (THIS WAS MISSING)
 */
export const getDailyVerse = async (language = 'bn') => {
  try {
    const response = await api.get('/quran/daily', {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching daily verse:', error);
    // Return fallback data so UI doesn't crash
    return {
      arabic: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      translation: language === 'bn' 
        ? "পরম করুণাময়, অতি দয়ালু আল্লাহর নামে শুরু"
        : "In the name of Allah, the Most Gracious, the Most Merciful",
      surahName: language === 'bn' ? "الفاتحة" : "Al-Fatihah",
      verseId: 1
    };
  }
};

/**
 * Get a single verse
 */
export const getVerse = async (surahId, verseId, language = 'en') => {
  try {
    const response = await api.get(`/quran/verse/${surahId}/${verseId}`, {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching verse:', error);
    return null;
  }
};

/**
 * Get tafsir for a verse
 */
export const getTafsir = async (surahId, verseId, language = 'bn') => {
  try {
    const response = await api.get(`/quran/tafsir/${surahId}/${verseId}`, {
      params: { language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching tafsir:', error);
    return { tafsir: 'তাফসির পাওয়া যায়নি' };
  }
};

/**
 * Search in Quran
 */
export const searchQuran = async (query, language = 'en') => {
  try {
    const response = await api.get('/quran/search', {
      params: { q: query, language }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error searching Quran:', error);
    return [];
  }
};

export default {
  getSurahs,
  getVerses,
  getDailyVerse,
  getVerse,
  getTafsir,
  searchQuran
};
