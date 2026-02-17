import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getSurahs, getVerses, getDailyVerse, searchQuran } from '../services/quranService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const QuranPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [surahs, setSurahs] = useState([]);
  const [currentSurah, setCurrentSurah] = useState(null);
  const [verses, setVerses] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [dailyVerse, setDailyVerse] = useState(null);

  useEffect(() => {
    loadSurahs();
    loadDailyVerse();
  }, [currentLanguage]);

  const loadSurahs = async () => {
    try {
      const data = await getSurahs(currentLanguage);
      setSurahs(data);
    } catch (error) {
      console.error('Error loading surahs:', error);
      toast.error(t('errors.loading'));
    }
  };

  const loadDailyVerse = async () => {
    try {
      const data = await getDailyVerse(currentLanguage);
      setDailyVerse(data);
    } catch (error) {
      console.error('Error loading daily verse:', error);
    }
  };

  const loadSurah = async (surahId) => {
    try {
      setLoading(true);
      const data = await getVerses(surahId, currentLanguage);
      setCurrentSurah(data.surah);
      setVerses(data.verses);
      setShowSearch(false);
    } catch (error) {
      console.error('Error loading surah:', error);
      toast.error(t('errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const results = await searchQuran(searchQuery, currentLanguage);
      setSearchResults(results);
      setShowSearch(true);
    } catch (error) {
      console.error('Error searching:', error);
      toast.error(t('errors.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const copyVerse = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t('common.copied'));
  };

  if (loading && !surahs.length) return <Loader />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37] font-arabic">
          {t('quran.title')}
        </h1>
        <p className="text-white/70 font-bangla">{t('quran.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="glass p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('common.search')}
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-[#d4af37] focus:outline-none font-bangla"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition"
          >
            <i className="fas fa-search"></i>
          </button>
        </div>
      </div>

      {/* Daily Verse */}
      {dailyVerse && !currentSurah && !showSearch && (
        <div className="verse-card">
          <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
            <i className="fas fa-star mr-2"></i>
            {t('quran.dailyVerse')}
          </h3>
          <p className="text-2xl mb-4 text-right font-arabic">{dailyVerse.arabic}</p>
          <p className="text-white/80 mb-2 font-bangla">{dailyVerse.translation}</p>
          <p className="text-sm text-[#d4af37]">
            {t('quran.surah')} {dailyVerse.surahName} - {t('quran.verse')} {dailyVerse.verseId}
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Surah List */}
        <div className="lg:col-span-1">
          <div className="glass p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
            <h3 className="text-lg mb-3 text-[#d4af37]">
              <i className="fas fa-list mr-2"></i>
              {t('quran.surahs')}
            </h3>
            <div className="space-y-1">
              {surahs.map((surah) => (
                <button
                  key={surah.id}
                  onClick={() => loadSurah(surah.id)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    currentSurah?.id === surah.id
                      ? 'bg-[#d4af37] text-[#1a3f54]'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-arabic">{surah.name}</span>
                    <span className="text-sm opacity-70">{surah.totalVerses}</span>
                  </div>
                  <div className="text-xs mt-1 opacity-70 font-bangla">{surah.translation}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Display */}
        <div className="lg:col-span-3">
          {showSearch && searchResults.length > 0 ? (
            <div className="glass p-6">
              <h3 className="text-xl mb-4 text-[#d4af37]">
                <i className="fas fa-search mr-2"></i>
                {t('common.searchResults')}
              </h3>
              <div className="space-y-4">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
                    onClick={() => {
                      loadSurah(result.surahId);
                      setShowSearch(false);
                    }}
                  >
                    <p className="text-xl mb-2 text-right font-arabic">{result.arabic}</p>
                    <p className="text-white/80 font-bangla">{result.translation}</p>
                    <p className="text-sm text-[#d4af37] mt-2">
                      {t('quran.surah')} {result.surahName} - {t('quran.verse')} {result.verseId}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : currentSurah ? (
            <div className="space-y-4">
              {/* Surah Header */}
              <div className="glass p-6 text-center">
                <h2 className="text-3xl font-bold mb-2 font-arabic text-[#d4af37]">
                  {currentSurah.name}
                </h2>
                <p className="text-white/70 mb-2 font-bangla">
                  {currentSurah.translation} | {t('quran.verses')} {currentSurah.totalVerses}
                </p>
              </div>

              {/* Bismillah */}
              {currentSurah.id !== 9 && (
                <div className="glass p-4 text-center">
                  <p className="text-2xl font-arabic text-[#d4af37]">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </p>
                  <p className="text-sm text-white/70 mt-2 font-bangla">
                    পরম করুণাময়, অতি দয়ালু আল্লাহর নামে শুরু
                  </p>
                </div>
              )}

              {/* Verses */}
              <div className="glass divide-y divide-white/10">
                {verses.map((verse) => (
                  <div key={verse.id} className="p-4 hover:bg-white/5 transition group">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-sm text-[#d4af37] mb-2 block">
                          {t('quran.verse')} {verse.id}
                        </span>
                        <p className="text-2xl mb-3 text-right font-arabic leading-loose">
                          {verse.arabic}
                        </p>
                        <p className="text-white/80 font-bangla">{verse.translation}</p>
                      </div>
                      <button
                        onClick={() => copyVerse(verse.arabic + '\n\n' + verse.translation)}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-[#d4af37]/20 rounded-lg transition"
                      >
                        <i className="fas fa-copy"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="glass p-12 text-center">
              <i className="fas fa-quran text-6xl text-[#d4af37] mb-4"></i>
              <p className="text-xl text-white/70 font-bangla">{t('quran.selectSurah')}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default QuranPage;