import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SurahList from './SurahList';
import VerseDisplay from './VerseDisplay';
import AudioPlayer from './AudioPlayer';
import Tafsir from './Tafsir';

const QuranReader = ({ surahs, currentSurah, verses, onSurahSelect, language }) => {
  const [showAudio, setShowAudio] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [currentVerse, setCurrentVerse] = useState(null);
  const [bookmarks, setBookmarks] = useState([]);

  const handleVerseClick = (verse) => {
    setCurrentVerse(verse);
  };

  const handleBookmark = (verse) => {
    const newBookmarks = [...bookmarks, verse];
    setBookmarks(newBookmarks);
    localStorage.setItem('quranBookmarks', JSON.stringify(newBookmarks));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Surah List Sidebar */}
      <div className="lg:col-span-1">
        <div className="glass p-4 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto">
          <SurahList
            surahs={surahs}
            currentSurah={currentSurah}
            onSelect={onSurahSelect}
            language={language}
          />
        </div>
      </div>

      {/* Quran Content */}
      <div className="lg:col-span-3">
        {currentSurah ? (
          <div className="space-y-4">
            {/* Surah Header */}
            <div className="glass p-6 text-center">
              <h2 className="text-3xl font-bold mb-2 font-arabic text-[#d4af37]">
                {currentSurah.name}
              </h2>
              <p className="text-white/70">
                {currentSurah.translation} | {currentSurah.totalVerses} Verses
              </p>
            </div>

            {/* Bismillah */}
            {currentSurah.id !== 9 && (
              <div className="glass p-4 text-center">
                <p className="text-2xl font-arabic text-[#d4af37]">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
            )}

            {/* Verses */}
            <div className="glass divide-y divide-white/10">
              <VerseDisplay
                verses={verses}
                currentVerse={currentVerse}
                onVerseClick={handleVerseClick}
                onBookmark={handleBookmark}
                onAudioClick={() => setShowAudio(true)}
                onTafsirClick={() => setShowTafsir(true)}
                language={language}
              />
            </div>
          </div>
        ) : (
          <div className="glass p-12 text-center">
            <i className="fas fa-quran text-6xl text-[#d4af37] mb-4"></i>
            <p className="text-xl text-white/70">
              Select a Surah to begin reading
            </p>
          </div>
        )}
      </div>

      {/* Audio Player Modal */}
      <AnimatePresence>
        {showAudio && currentVerse && (
          <AudioPlayer
            surahId={currentSurah?.id}
            verseId={currentVerse?.id}
            onClose={() => setShowAudio(false)}
          />
        )}
      </AnimatePresence>

      {/* Tafsir Modal */}
      <AnimatePresence>
        {showTafsir && currentVerse && (
          <Tafsir
            surahId={currentSurah?.id}
            verseId={currentVerse?.id}
            onClose={() => setShowTafsir(false)}
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default QuranReader;