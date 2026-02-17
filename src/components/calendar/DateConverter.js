import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const DateConverter = () => {
  const [fromType, setFromType] = useState('gregorian');
  const [toType, setToType] = useState('hijri');
  const [date, setDate] = useState({ day: '', month: '', year: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!date.day || !date.month || !date.year) return;

    try {
      setLoading(true);
      const response = await axios.post('/api/calendar/convert', {
        from: fromType,
        to: toType,
        date
      });
      setResult(response.data.data);
    } catch (error) {
      console.error('Conversion error:', error);
    } finally {
      setLoading(false);
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
          <label className="block text-sm text-white/50 mb-2">From</label>
          <select
            value={fromType}
            onChange={(e) => setFromType(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          >
            <option value="gregorian">Gregorian</option>
            <option value="hijri">Hijri</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-white/50 mb-2">To</label>
          <select
            value={toType}
            onChange={(e) => setToType(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          >
            <option value="hijri">Hijri</option>
            <option value="gregorian">Gregorian</option>
          </select>
        </div>
      </div>

      {/* Date Input */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <input
            type="number"
            placeholder="Day"
            value={date.day}
            onChange={(e) => setDate({ ...date, day: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Month"
            value={date.month}
            onChange={(e) => setDate({ ...date, month: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          />
        </div>
        <div>
          <input
            type="number"
            placeholder="Year"
            value={date.year}
            onChange={(e) => setDate({ ...date, year: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg"
          />
        </div>
      </div>

      {/* Convert Button */}
      <button
        onClick={handleConvert}
        disabled={loading}
        className="w-full py-3 bg-[#d4af37] text-[#1a3f54] rounded-lg hover:bg-[#c4a037] transition font-bold disabled:opacity-50"
      >
        {loading ? (
          <i className="fas fa-spinner fa-spin mr-2"></i>
        ) : (
          <i className="fas fa-exchange-alt mr-2"></i>
        )}
        Convert Date
      </button>

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 bg-[#d4af37]/10 rounded-lg text-center">
          <p className="text-sm text-white/50 mb-1">Result:</p>
          <p className="text-2xl font-bold text-[#d4af37]">
            {result.day} {result.month} {result.year}
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default DateConverter;