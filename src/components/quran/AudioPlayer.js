import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';

const AudioPlayer = ({ surahId, verseId, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const reciters = [
    { id: 1, name: 'Abdul Rahman Al-Sudais' },
    { id: 2, name: 'Mishary Rashid Alafasy' },
    { id: 3, name: 'Saad Al-Ghamdi' }
  ];

  const [selectedReciter, setSelectedReciter] = useState(reciters[0]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="glass p-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[#d4af37] font-bold">
              Audio Player - Surah {surahId}, Verse {verseId}
            </h4>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Reciter Selection */}
          <select
            value={selectedReciter.id}
            onChange={(e) => setSelectedReciter(reciters.find(r => r.id === parseInt(e.target.value)))}
            className="mb-3 px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm"
          >
            {reciters.map((reciter) => (
              <option key={reciter.id} value={reciter.id}>
                {reciter.name}
              </option>
            ))}
          </select>

          {/* Audio Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-[#d4af37] text-[#1a3f54] hover:bg-[#c4a037] transition flex items-center justify-center"
            >
              <i className={`fas fa-${isPlaying ? 'pause' : 'play'}`}></i>
            </button>

            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span>{formatTime(currentTime)}</span>
                <div className="flex-1 h-1 bg-white/10 rounded-full">
                  <div
                    className="h-full bg-[#d4af37] rounded-full"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
                  ></div>
                </div>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <button className="p-2 hover:bg-white/10 rounded-lg">
              <i className="fas fa-volume-up"></i>
            </button>
          </div>

          {/* Audio Element */}
          <audio
            ref={audioRef}
            src={`https://example.com/audio/${selectedReciter.id}/${surahId}/${verseId}.mp3`}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default AudioPlayer;