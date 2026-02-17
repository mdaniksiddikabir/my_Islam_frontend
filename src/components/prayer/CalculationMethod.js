import React from 'react';

const CalculationMethod = ({ currentMethod, onMethodChange }) => {
  const methods = [
    { id: 4, name: 'Umm Al-Qura (Makkah)' },
    { id: 3, name: 'Egyptian General' },
    { id: 2, name: 'ISNA' },
    { id: 5, name: 'Karachi' },
    { id: 12, name: 'Dubai' },
    { id: 15, name: 'Kuwait' },
    { id: 16, name: 'Qatar' }
  ];

  return (
    <select
      value={currentMethod}
      onChange={(e) => onMethodChange(parseInt(e.target.value))}
      className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm focus:border-[#d4af37] focus:outline-none"
    >
      {methods.map((method) => (
        <option key={method.id} value={method.id}>
          {method.name}
        </option>
      ))}
    </select>
  );
};

export default CalculationMethod;