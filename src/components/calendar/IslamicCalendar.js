import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const IslamicCalendar = ({ year, month, days, events, onDayClick, prayerTimes }) => {
  const { language } = useLanguage();

  const weekDays = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    bn: ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']
  };

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

  // Check if current month is Ramadan (month 9)
  const isRamadan = month === 9;

  // Format time to 12-hour format
  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div>
      {/* Month Header */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-[#d4af37]">
          {hijriMonths[language]?.[month - 1] || hijriMonths.en[month - 1]} {year} AH
        </h3>
        {isRamadan && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full">
            <i className="fas fa-moon text-emerald-400"></i>
            <span className="text-emerald-400 text-sm font-medium">
              {language === 'bn' ? 'রমজান মাস' : 'Ramadan Month'}
            </span>
          </div>
        )}
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays[language]?.map((day) => (
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
            onClick={() => !day?.empty && onDayClick?.(day)}
            className={`
              aspect-square p-1 sm:p-2 rounded-lg cursor-pointer transition-all relative
              ${day?.empty ? 'opacity-0' : 'hover:bg-[#d4af37]/20'}
              ${day?.isToday ? 'border-2 border-[#d4af37] bg-[#d4af37]/10' : ''}
              ${day?.isRamadan ? 'bg-emerald-500/5' : ''}
              ${day?.isSpecial ? 'bg-purple-500/10' : ''}
            `}
          >
            <div className="flex flex-col items-center h-full">
              {/* Day Number */}
              <span className="text-lg font-bold">{day?.day || ''}</span>
              
              {/* Iftar/Sehri Times for Ramadan */}
              {isRamadan && !day?.empty && prayerTimes && (
                <div className="text-[8px] sm:text-[10px] mt-1 space-y-0.5">
                  {day.day === 1 && (
                    <>
                      <div className="text-emerald-400 font-medium flex items-center gap-0.5">
                        <i className="fas fa-moon text-[6px]"></i>
                        <span>Sehri: {formatTime(prayerTimes?.fajr)}</span>
                      </div>
                      <div className="text-amber-400 font-medium flex items-center gap-0.5">
                        <i className="fas fa-sun text-[6px]"></i>
                        <span>Iftar: {formatTime(prayerTimes?.maghrib)}</span>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              {/* Event Indicators */}
              {day?.events && day.events.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {day.events.slice(0, 2).map((event, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#d4af37]"
                      title={event?.name || ''}
                    />
                  ))}
                  {day.events.length > 2 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#d4af37] opacity-50">
                      <span className="sr-only">+{day.events.length - 2} more</span>
                    </div>
                  )}
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
