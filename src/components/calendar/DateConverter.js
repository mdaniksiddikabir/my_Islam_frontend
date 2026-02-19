import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useLanguage } from '../../context/LanguageContext';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DateConverter = () => {
  const { currentLanguage } = useLanguage();
  const [fromType, setFromType] = useState('gregorian');
  const [toType, setToType] = useState('hijri');
  const [date, setDate] = useState({ day: '', month: '', year: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Hijri month names for display
  const hijriMonths = {
    en: [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
      'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
    ],
    bn: [
      'মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি',
      'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান',
      'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ'
    ]
  };

  // Gregorian month names
  const gregorianMonths = {
    en: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ],
    bn: [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ]
  };

  const handleConvert = async () => {
    // Validation
    if (!date.day || !date.month || !date.year) {
      toast.error('Please fill all fields');
      return;
    }

    const day = parseInt(date.day);
    const month = parseInt(date.month);
    const year = parseInt(date.year);

    if (day < 1 || day > 31) {
      toast.error('Day must be between 1 and 31');
      return;
    }

    if (month < 1 || month > 12) {
      toast.error('Month must be between 1 and 12');
      return;
    }

    if (year < 1000 || year > 9999) {
      toast.error('Please enter a valid year');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);
      
      const response = await axios.post(`${API_BASE_URL}/api/calendar/convert`, {
        from: fromType,
        to: toType,
        date: {
          day,
          month,
          year
        }
      });
      
      if (response.data.success) {
        setResult(response.data.data);
        toast.success('Date converted successfully!');
      } else {
        setError('Conversion failed');
        toast.error('Conversion failed');
      }
    } catch (error) {
      console.error('Conversion error:', error);
      const errorMessage = error.response?.data?.message || 'Conversion failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromType(toType);
    setToType(fromType);
    setResult(null);
    setError(null);
  };

  const handleClear = () => {
    setDate({ day: '', month: '', year: '' });
    setResult(null);
    setError(null);
  };

  const formatResult = () => {
    if (!result) return null;

    if (toType === 'hijri') {
      // Result is Hijri date
      const monthName = hijriMonths[currentLanguage]?.[result.month - 1] || 
                       hijriMonths.en[result.month - 1] || 
                       result.monthName || 
                       '';
      return (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-[#d4af37]">
            {result.day} {monthName} {result.year} AH
          </p>
          {result.weekday && (
            <p className="text-sm text-white/50">
              {result.weekday}
            </p>
          )}
        </div>
      );
    } else {
      // Result is Gregorian date
      const monthName = gregorianMonths[currentLanguage]?.[result.month - 1] || 
                       gregorianMonths.en[result.month - 1] || 
                       result.monthName || 
                       '';
      return (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-[#d4af37]">
            {result.day} {monthName} {result.year}
          </p>
          {result.weekday && (
            <p className="text-sm text-white/50">
              {result.weekday}
            </p>
          )}
        </div>
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/50 mb-2">
            {currentLanguage === 'bn' ? 'থেকে' : 'From'}
          </label>
          <select
            value={fromType}
            onChange={(e) => {
              setFromType(e.target.value);
              setResult(null);
              setError(null);
            }}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
          >
            <option value="gregorian">
              {currentLanguage === 'bn' ? 'গ্রেগরিয়ান' : 'Gregorian'}
            </option>
            <option value="hijri">
              {currentLanguage === 'bn' ? 'হিজরি' : 'Hijri'}
            </option>
          </select>
        </div>
        
        {/* Swap Button */}
        <div className="flex items-end">
          <button
            onClick={handleSwap}
            className="w-full px-4 py-2 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 text-[#d4af37] rounded-lg transition flex items-center justify-center gap-2"
          >
            <i className="fas fa-exchange-alt"></i>
            <span className="text-sm">{currentLanguage === 'bn' ? 'অদলবদল' : 'Swap'}</span>
          </button>
        </div>
      </div>

      {/* To Type Selection */}
      <div>
        <label className="block text-sm text-white/50 mb-2">
          {currentLanguage === 'bn' ? 'এতে' : 'To'}
        </label>
        <select
          value={toType}
          onChange={(e) => {
            setToType(e.target.value);
            setResult(null);
            setError(null);
          }}
          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
        >
          <option value="hijri">
            {currentLanguage === 'bn' ? 'হিজরি' : 'Hijri'}
          </option>
          <option value="gregorian">
            {currentLanguage === 'bn' ? 'গ্রেগরিয়ান' : 'Gregorian'}
          </option>
        </select>
      </div>

      {/* Date Input */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <input
            type="number"
            placeholder={currentLanguage === 'bn' ? 'দিন' : 'Day'}
            min="1"
            max="31"
            value={date.day}
            onChange={(e) => {
              setDate({ ...date, day: e.target.value });
              setResult(null);
              setError(null);
            }}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
          />
        </div>
        <div>
          <input
            type="number"
            placeholder={currentLanguage === 'bn' ? 'মাস' : 'Month'}
            min="1"
            max="12"
            value={date.month}
            onChange={(e) => {
              setDate({ ...date, month: e.target.value });
              setResult(null);
              setError(null);
            }}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
          />
        </div>
        <div>
          <input
            type="number"
            placeholder={currentLanguage === 'bn' ? 'সন' : 'Year'}
            min="1000"
            max="9999"
            value={date.year}
            onChange={(e) => {
              setDate({ ...date, year: e.target.value });
              setResult(null);
              setError(null);
            }}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={loading || !date.day || !date.month || !date.year}
          className="py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              {currentLanguage === 'bn' ? 'রূপান্তর হচ্ছে...' : 'Converting...'}
            </>
          ) : (
            <>
              <i className="fas fa-exchange-alt"></i>
              {currentLanguage === 'bn' ? 'রূপান্তর' : 'Convert'}
            </>
          )}
        </button>

        {/* Clear Button */}
        <button
          onClick={handleClear}
          disabled={loading || (!date.day && !date.month && !date.year && !result)}
          className="py-3 bg-white/10 hover:bg-white/20 rounded-lg transition font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <i className="fas fa-times"></i>
          {currentLanguage === 'bn' ? 'মুছুন' : 'Clear'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <p className="text-red-500 text-center">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && !error && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mt-4 p-6 bg-[#d4af37]/10 rounded-lg text-center border border-[#d4af37]/20"
        >
          <p className="text-sm text-white/50 mb-2">
            {currentLanguage === 'bn' ? 'ফলাফল:' : 'Result:'}
          </p>
          {formatResult()}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DateConverter;
