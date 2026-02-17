import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { getDuasByCategory, getDailyDua, searchDuas } from '../services/duaService';
import Loader from '../components/common/Loader';
import toast from 'react-hot-toast';

const DuaPage = () => {
  const { t, currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [duas, setDuas] = useState([]);
  const [dailyDua, setDailyDua] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedDua, setSelectedDua] = useState(null);

  const categories = [
    { id: 'morning', nameEn: 'Morning Duas', nameBn: 'সকালের দোয়া', icon: '🌅' },
    { id: 'evening', nameEn: 'Evening Duas', nameBn: 'সন্ধ্যার দোয়া', icon: '🌆' },
    { id: 'afterPrayer', nameEn: 'After Prayer', nameBn: 'নামাজের পর', icon: '🕌' },
    { id: 'sleeping', nameEn: 'Sleeping', nameBn: 'ঘুমানোর দোয়া', icon: '😴' },
    { id: 'waking', nameEn: 'Waking Up', nameBn: 'ঘুম থেকে উঠার দোয়া', icon: '☀️' },
    { id: 'eating', nameEn: 'Eating', nameBn: 'খাওয়ার দোয়া', icon: '🍽️' },
    { id: 'travel', nameEn: 'Travel', nameBn: 'ভ্রমণের দোয়া', icon: '✈️' },
    { id: 'sickness', nameEn: 'Sickness', nameBn: 'অসুস্থতার দোয়া', icon: '🤒' },
    { id: 'protection', nameEn: 'Protection', nameBn: 'রক্ষার দোয়া', icon: '🛡️' },
    { id: 'forgiveness', nameEn: 'Forgiveness', nameBn: 'ক্ষমার দোয়া', icon: '🤲' },
    { id: 'ramadan', nameEn: 'Ramadan', nameBn: 'রমজানের দোয়া', icon: '🌙' },
    { id: 'hajj', nameEn: 'Hajj & Umrah', nameBn: 'হজ ও উমরার দোয়া', icon: '🕋' }
  ];

  useEffect(() => {
    loadDailyDua();
    if (selectedCategory !== 'all') {
      loadDuas(selectedCategory);
    }
  }, [selectedCategory, currentLanguage]);

  const loadDailyDua = async () => {
    try {
      const data = await getDailyDua(currentLanguage);
      setDailyDua(data);
    } catch (error) {
      console.error('Error loading daily dua:', error);
    }
  };

  const loadDuas = async (category) => {
    try {
      setLoading(true);
      const data = await getDuasByCategory(category, currentLanguage);
      setDuas(data);
    } catch (error) {
      console.error('Error loading duas:', error);
      toast.error(t('errors.loading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setLoading(true);
      const results = await searchDuas(searchQuery, currentLanguage);
      setSearchResults(results);
      setSelectedCategory('search');
    } catch (error) {
      console.error('Error searching:', error);
      toast.error(t('errors.search'));
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioUrl) => {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => {
      toast.error(t('errors.audio'));
    });
  };

  if (loading && selectedCategory !== 'all') return <Loader />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37]">
          <i className="fas fa-hands-praying mr-3"></i>
          {t('dua.library')}
        </h1>
        <p className="text-white/70 font-bangla">{t('dua.subtitle')}</p>
      </div>

      {/* Search Bar */}
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

      {/* Daily Dua */}
      {dailyDua && (
        <div className="glass p-6 bg-gradient-to-r from-[#d4af37]/20 to-transparent">
          <h3 className="text-lg mb-3 text-[#d4af37] flex items-center">
            <i className="fas fa-star mr-2"></i>
            {t('dua.daily')}
          </h3>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-2xl mb-3 text-right font-arabic">{dailyDua.arabic}</p>
              <p className="text-white/80 mb-2 font-bangla">{dailyDua.translation}</p>
              <p className="text-sm text-[#d4af37]">{dailyDua.reference}</p>
            </div>
            {dailyDua.audio && (
              <button
                onClick={() => playAudio(dailyDua.audio)}
                className="ml-4 p-3 bg-[#d4af37]/20 rounded-full hover:bg-[#d4af37]/30 transition"
              >
                <i className="fas fa-play text-[#d4af37]"></i>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="glass p-6">
        <h3 className="text-xl mb-4 text-[#d4af37]">
          <i className="fas fa-tags mr-2"></i>
          {t('dua.categories')}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`p-4 rounded-lg transition ${
                selectedCategory === category.id
                  ? 'bg-[#d4af37] text-[#1a3f54]'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <span className="text-2xl mb-2 block">{category.icon}</span>
              <span className="font-bangla">
                {currentLanguage === 'bn' ? category.nameBn : category.nameEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Duas List */}
      {selectedCategory !== 'all' && selectedCategory !== 'search' && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37]">
            {currentLanguage === 'bn' 
              ? categories.find(c => c.id === selectedCategory)?.nameBn
              : categories.find(c => c.id === selectedCategory)?.nameEn}
          </h3>
          
          <div className="space-y-4">
            {duas.map((dua, index) => (
              <div
                key={index}
                onClick={() => setSelectedDua(dua)}
                className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xl mb-2 text-right font-arabic">{dua.arabic}</p>
                    <p className="text-white/80 font-bangla line-clamp-2">{dua.translation}</p>
                  </div>
                  <button className="ml-4 p-2 hover:bg-[#d4af37]/20 rounded-lg">
                    <i className="fas fa-chevron-right text-[#d4af37]"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {selectedCategory === 'search' && searchResults.length > 0 && (
        <div className="glass p-6">
          <h3 className="text-xl mb-4 text-[#d4af37]">
            <i className="fas fa-search mr-2"></i>
            {t('common.searchResults')} ({searchResults.length})
          </h3>
          
          <div className="space-y-4">
            {searchResults.map((dua, index) => (
              <div
                key={index}
                onClick={() => setSelectedDua(dua)}
                className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xl mb-2 text-right font-arabic">{dua.arabic}</p>
                    <p className="text-white/80 font-bangla line-clamp-2">{dua.translation}</p>
                    <p className="text-sm text-[#d4af37] mt-2">{dua.category}</p>
                  </div>
                  <button className="ml-4 p-2 hover:bg-[#d4af37]/20 rounded-lg">
                    <i className="fas fa-chevron-right text-[#d4af37]"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dua Detail Modal */}
      {selectedDua && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-[#d4af37]">{t('dua.details')}</h3>
                <button
                  onClick={() => setSelectedDua(null)}
                  className="p-2 hover:bg-white/10 rounded-lg"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* Arabic */}
                <div>
                  <h4 className="text-sm text-white/50 mb-2">العربية</h4>
                  <p className="text-3xl text-right font-arabic leading-loose">
                    {selectedDua.arabic}
                  </p>
                </div>

                {/* Transliteration */}
                {selectedDua.transliteration && (
                  <div>
                    <h4 className="text-sm text-white/50 mb-2">Transliteration</h4>
                    <p className="text-lg text-white/80 italic">{selectedDua.transliteration}</p>
                  </div>
                )}

                {/* Translation */}
                <div>
                  <h4 className="text-sm text-white/50 mb-2">
                    {currentLanguage === 'bn' ? 'বাংলা অনুবাদ' : 'Translation'}
                  </h4>
                  <p className="text-xl text-white/90 font-bangla">{selectedDua.translation}</p>
                </div>

                {/* Reference */}
                <div>
                  <h4 className="text-sm text-white/50 mb-2">Reference</h4>
                  <p className="text-[#d4af37]">{selectedDua.reference}</p>
                </div>

                {/* Benefits */}
                {selectedDua.benefits && (
                  <div>
                    <h4 className="text-sm text-white/50 mb-2">
                      {currentLanguage === 'bn' ? 'ফজিলত' : 'Benefits'}
                    </h4>
                    <p className="text-white/80">{selectedDua.benefits}</p>
                  </div>
                )}

                {/* Audio */}
                {selectedDua.audio && (
                  <div>
                    <h4 className="text-sm text-white/50 mb-2">Audio</h4>
                    <button
                      onClick={() => playAudio(selectedDua.audio)}
                      className="px-4 py-2 bg-[#d4af37]/20 rounded-lg hover:bg-[#d4af37]/30 transition"
                    >
                      <i className="fas fa-play mr-2"></i>
                      {t('common.play')}
                    </button>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedDua.arabic + '\n\n' + selectedDua.translation);
                      toast.success(t('common.copied'));
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                  >
                    <i className="fas fa-copy mr-2"></i>
                    {t('common.copy')}
                  </button>
                  
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'Dua',
                          text: selectedDua.arabic + '\n' + selectedDua.translation
                        });
                      }
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition"
                  >
                    <i className="fas fa-share-alt mr-2"></i>
                    {t('common.share')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default DuaPage;