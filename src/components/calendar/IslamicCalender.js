import React from 'react';

const IslamicCalendar = ({ year, month, days, events, onDayClick }) => {
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const hijriMonths = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
    'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
  ];

  return (
    <div>
      {/* Month Header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-[#d4af37]">
          {hijriMonths[month - 1]} {year} AH
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
              ${day.isRamadan ? 'bg-emerald-500/10' : ''}
              ${day.isSpecial ? 'bg-purple-500/10' : ''}
            `}
          >
            <div className="flex flex-col items-center h-full">
              <span className="text-lg font-bold">{day.day}</span>
              
              {/* Event Indicators */}
              {day.events?.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {day.events.map((event, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"
                      title={event.name}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IslamicCalendar;