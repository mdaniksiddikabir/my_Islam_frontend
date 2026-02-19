import React from 'react';

const GregorianCalendar = ({ year, month, days, onDayClick }) => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const gregorianMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div>
      {/* Month Header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-[#d4af37]">
          {gregorianMonths[month - 1]} {year}
        </h3>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-[#d4af37] text-sm py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => (
          <div
            key={index}
            onClick={() => !day.empty && onDayClick(day)}
            className={`
              aspect-square p-2 rounded-lg cursor-pointer transition-all
              ${day.empty ? 'opacity-0' : 'hover:bg-[#d4af37]/20'}
              ${day.isToday ? 'border-2 border-[#d4af37] bg-[#d4af37]/10' : ''}
            `}
          >
            <div className="flex flex-col items-center h-full">
              <span className="text-lg font-bold">{day.day}</span>
              <span className="text-xs text-white/40 mt-1">
                {day.weekDay}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GregorianCalendar;
