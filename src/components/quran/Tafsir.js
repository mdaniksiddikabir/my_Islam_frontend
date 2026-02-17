import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Tafsir = ({ surahId, verseId, onClose, language }) => {
  const [tafsir, setTafsir] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTafsir();
  }, [surahId, verseId]);

  const fetchTafsir = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/quran/tafsir/${surahId}/${verseId}`, {
        params: { language }
      });
      setTafsir(response.data.data);
    } catch (error) {
      console.error('Error fetching tafsir:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="glass max-w-2xl w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#d4af37]">
              Tafsir - Surah {surahId}, Verse {verseId}
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#d4af37]"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Verse Arabic */}
              <div>
                <h4 className="text-sm text-white/50 mb-2">Verse</h4>
                <p className="text-xl text-right font-arabic">{tafsir?.verse}</p>
              </div>

              {/* Tafsir Content */}
              <div>
                <h4 className="text-sm text-white/50 mb-2">Tafsir Ibn Kathir</h4>
                <p className="text-white/90 leading-relaxed font-bangla">
                  {tafsir?.content}
                </p>
              </div>

              {/* Source */}
              <div className="pt-4 border-t border-white/10">
                <p className="text-sm text-white/50">
                  Source: {tafsir?.source}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Tafsir;