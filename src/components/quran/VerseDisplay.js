import React from 'react';
import { motion } from 'framer-motion';

const VerseDisplay = ({ verses, currentVerse, onVerseClick, onBookmark, onAudioClick, onTafsirClick, language }) => {
  return (
    <div className="divide-y divide-white/10">
      {verses.map((verse) => (
        <motion.div
          key={verse.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: verse.id * 0.01 }}
          className={`p-4 hover:bg-white/5 transition group cursor-pointer ${
            currentVerse?.id === verse.id ? 'bg-[#d4af37]/10' : ''
          }`}
          onClick={() => onVerseClick(verse)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <span className="text-sm text-[#d4af37] mb-2 block">
                Verse {verse.id}
              </span>
              <p className="text-2xl mb-3 text-right font-arabic leading-loose">
                {verse.arabic}
              </p>
              <p className="text-white/80 font-bangla">
                {verse.translation}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 ml-4 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onBookmark(verse);
                }}
                className="p-2 hover:bg-[#d4af37]/20 rounded-lg"
                title="Bookmark"
              >
                <i className="far fa-bookmark text-[#d4af37]"></i>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAudioClick();
                }}
                className="p-2 hover:bg-[#d4af37]/20 rounded-lg"
                title="Play Audio"
              >
                <i className="fas fa-play text-[#d4af37]"></i>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTafsirClick();
                }}
                className="p-2 hover:bg-[#d4af37]/20 rounded-lg"
                title="Tafsir"
              >
                <i className="fas fa-book-open text-[#d4af37]"></i>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(verse.arabic);
                }}
                className="p-2 hover:bg-[#d4af37]/20 rounded-lg"
                title="Copy"
              >
                <i className="fas fa-copy text-[#d4af37]"></i>
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default VerseDisplay;