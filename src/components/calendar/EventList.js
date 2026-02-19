import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';
import { getIslamicEvents } from '../../services/calendarService';
import Loader from '../common/Loader';
import toast from 'react-hot-toast';
import { FaSearch, FaFilter, FaTimes, FaStar, FaMosque, FaPray, FaCalendarAlt, FaMoon, FaSun, FaInfoCircle, FaShare, FaBookmark, FaRegBookmark } from 'react-icons/fa';
import { GiRam } from 'react-icons/gi';

const EventList = () => {
  const { t, currentLanguage } = useLanguage();
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [bookmarkedEvents, setBookmarkedEvents] = useState([]);

  // Hijri month names
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

  // Event types with icons and colors
  const eventTypes = [
    { 
      id: 'all', 
      name: { en: 'All Events', bn: 'সব ইভেন্ট' },
      icon: FaStar,
      color: 'gray'
    },
    { 
      id: 'holiday', 
      name: { en: 'Holidays', bn: 'ছুটি' },
      icon: FaMosque,
      color: 'green'
    },
    { 
      id: 'religious', 
      name: { en: 'Religious', bn: 'ধর্মীয়' },
      icon: FaPray,
      color: 'blue'
    },
    { 
      id: 'ramadan', 
      name: { en: 'Ramadan', bn: 'রমজান' },
      icon: GiRam,
      color: 'purple'
    }
  ];

  // Load events on mount and when year changes
  useEffect(() => {
    fetchEvents();
  }, [selectedYear]);

  // Filter events based on search and type
  useEffect(() => {
    if (events.length > 0) {
      let filtered = [...events];

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(event => {
          const title = currentLanguage === 'bn' ? event.nameBn : event.name;
          return title?.toLowerCase().includes(searchTerm.toLowerCase());
        });
      }

      // Filter by type
      if (selectedType !== 'all') {
        filtered = filtered.filter(event => event.type === selectedType);
      }

      setFilteredEvents(filtered);
    }
  }, [events, searchTerm, selectedType, currentLanguage]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getIslamicEvents(selectedYear);
      
      // Transform data with null checks
      const formattedEvents = (data || []).map(event => {
        // Safely get month name with null checks
        const monthIndex = event?.hijriMonth ? event.hijriMonth - 1 : 0;
        const monthName = hijriMonths[currentLanguage]?.[monthIndex] || 
                         hijriMonths.en[monthIndex] || 
                         '';
        
        return {
          ...event,
          name: event?.name || '',
          nameBn: event?.nameBn || '',
          description: event?.description || '',
          descriptionBn: event?.descriptionBn || '',
          hijriDate: `${event?.hijriDay || ''} ${monthName} ${event?.year || ''} AH`.trim(),
          gregorianDate: formatGregorianDate(event?.gregorianDate)
        };
      });
      
      setEvents(formattedEvents);
      setFilteredEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError(error?.message || 'Failed to load events');
      toast.error(t('errors.loadEvents') || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const formatGregorianDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(
        currentLanguage === 'bn' ? 'bn-BD' : 'en-US',
        { year: 'numeric', month: 'long', day: 'numeric' }
      );
    } catch {
      return dateString || '';
    }
  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return '';
    if (currentLanguage === 'bn') {
      const banglaDigits = ['০','১','২','৩','৪','৫','৬','৭','৮','৯'];
      return num.toString().split('').map(d => banglaDigits[d] || d).join('');
    }
    return num;
  };

  const getEventIcon = (type) => {
    switch(type) {
      case 'holiday': return '🎉';
      case 'religious': return '🕋';
      case 'ramadan': return '🌙';
      default: return '📅';
    }
  };

  const getEventColor = (type) => {
    switch(type) {
      case 'holiday': return 'green';
      case 'religious': return 'blue';
      case 'ramadan': return 'purple';
      default: return 'gray';
    }
  };

  const getTypeName = (type) => {
    const eventType = eventTypes.find(t => t.id === type);
    return eventType?.name[currentLanguage] || eventType?.name.en || type || '';
  };

  const toggleBookmark = (eventId) => {
    if (!eventId) return;
    if (bookmarkedEvents.includes(eventId)) {
      setBookmarkedEvents(prev => prev.filter(id => id !== eventId));
      toast.success(t('events.removedBookmark') || 'Removed from bookmarks');
    } else {
      setBookmarkedEvents(prev => [...prev, eventId]);
      toast.success(t('events.addedBookmark') || 'Added to bookmarks');
    }
  };

  const shareEvent = (event) => {
    if (!event) return;
    const title = currentLanguage === 'bn' ? event.nameBn : event.name;
    const desc = currentLanguage === 'bn' ? event.descriptionBn : event.description;
    const text = `${title || ''}\n\n${desc || ''}\n\n📅 ${event.hijriDate || ''}\n📆 ${event.gregorianDate || ''}`;
    
    if (navigator.share) {
      navigator.share({
        title: title || 'Islamic Event',
        text: text,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      toast.success(t('events.copied') || 'Copied to clipboard');
    }
  };

  const openEventModal = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeEventModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    document.body.style.overflow = 'auto';
  };

  const handleYearChange = (direction) => {
    setSelectedYear(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  if (loading) {
    return <Loader />;
  }

  // Helper function to get color classes safely
  const getColorClass = (color, type = 'bg') => {
    const colorMap = {
      green: 'green',
      blue: 'blue',
      purple: 'purple',
      gray: 'gray'
    };
    const safeColor = colorMap[color] || 'gray';
    return `${type}-${safeColor}-500/20`;
  };

  const getTextColorClass = (color) => {
    const colorMap = {
      green: 'green',
      blue: 'blue',
      purple: 'purple',
      gray: 'gray'
    };
    const safeColor = colorMap[color] || 'gray';
    return `text-${safeColor}-400`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="glass p-6">
        <h1 className="text-3xl font-bold mb-2 text-[#d4af37] flex items-center">
          <FaStar className="mr-3" />
          {t('events.title') || 'Islamic Events'}
        </h1>
        <p className="text-white/70">
          {t('events.subtitle') || 'Important dates and events in the Islamic calendar'}
        </p>
      </div>

      {/* Controls */}
      <div className="glass p-6 space-y-4">
        {/* Year Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleYearChange('prev')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#d4af37]">
              {selectedYear} {currentLanguage === 'bn' ? 'হিজরি' : 'AH'}
            </h2>
          </div>
          
          <button
            onClick={() => handleYearChange('next')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('events.search') || 'Search events...'}
              className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-[#d4af37] transition appearance-none"
            >
              {eventTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name[currentLanguage] || type.name.en}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'grid' 
                ? 'bg-[#d4af37] text-[#1a3f54]' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <i className="fas fa-grid-2"></i>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition ${
              viewMode === 'list' 
                ? 'bg-[#d4af37] text-[#1a3f54]' 
                : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="glass p-4 bg-red-500/20 border border-red-500/30">
          <div className="flex items-center">
            <i className="fas fa-exclamation-circle text-red-500 mr-3"></i>
            <p className="text-red-500">{error}</p>
            <button
              onClick={fetchEvents}
              className="ml-auto px-4 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
            >
              {t('common.retry') || 'Retry'}
            </button>
          </div>
        </div>
      )}

      {/* Events Display */}
      {filteredEvents.length === 0 ? (
        <div className="glass p-12 text-center">
          <FaCalendarAlt className="mx-auto text-5xl text-white/20 mb-4" />
          <p className="text-white/50 text-lg">
            {t('events.noEvents') || 'No events found'}
          </p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map(event => {
                const color = getEventColor(event?.type || '');
                return (
                  <motion.div
                    key={event?.id || Math.random()}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass p-6 hover:shadow-xl transition-all cursor-pointer group"
                    onClick={() => openEventModal(event)}
                  >
                    {/* Event Header */}
                    <div className="flex items-start justify-between mb-4">
                      <span className="text-4xl">{getEventIcon(event?.type)}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClass(color)} ${getTextColorClass(color)}`}>
                        {getTypeName(event?.type)}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#d4af37] transition">
                      {currentLanguage === 'bn' ? event?.nameBn : event?.name}
                    </h3>

                    {/* Event Dates */}
                    <div className="space-y-2 mb-4 text-sm">
                      <div className="flex items-center text-white/60">
                        <FaMoon className="mr-2 text-[#d4af37]" />
                        <span>{event?.hijriDate || ''}</span>
                      </div>
                      <div className="flex items-center text-white/60">
                        <FaSun className="mr-2 text-[#d4af37]" />
                        <span>{event?.gregorianDate || ''}</span>
                      </div>
                    </div>

                    {/* Description Preview */}
                    <p className="text-white/50 text-sm line-clamp-2 mb-4">
                      {currentLanguage === 'bn' ? event?.descriptionBn : event?.description}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <button className="text-[#d4af37] hover:text-[#c4a037] transition text-sm">
                        {t('events.viewDetails') || 'View Details'}
                      </button>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleBookmark(event?.id);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                          {bookmarkedEvents.includes(event?.id) ? (
                            <FaBookmark className="text-[#d4af37]" />
                          ) : (
                            <FaRegBookmark className="text-white/40" />
                          )}
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareEvent(event);
                          }}
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                          <FaShare className="text-white/40" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="glass divide-y divide-white/10">
              {filteredEvents.map(event => {
                const color = getEventColor(event?.type || '');
                return (
                  <motion.div
                    key={event?.id || Math.random()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 hover:bg-white/5 transition cursor-pointer flex items-center gap-4"
                    onClick={() => openEventModal(event)}
                  >
                    {/* Event Icon */}
                    <span className="text-3xl">{getEventIcon(event?.type)}</span>

                    {/* Event Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-bold text-white">
                          {currentLanguage === 'bn' ? event?.nameBn : event?.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getColorClass(color)} ${getTextColorClass(color)}`}>
                          {getTypeName(event?.type)}
                        </span>
                      </div>
                      <p className="text-white/50 text-sm line-clamp-1">
                        {currentLanguage === 'bn' ? event?.descriptionBn : event?.description}
                      </p>
                      <div className="flex gap-4 mt-2 text-sm text-white/40">
                        <span className="flex items-center">
                          <FaMoon className="mr-1 text-[#d4af37] text-xs" />
                          {event?.hijriDate || ''}
                        </span>
                        <span className="flex items-center">
                          <FaSun className="mr-1 text-[#d4af37] text-xs" />
                          {event?.gregorianDate || ''}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(event?.id);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition"
                      >
                        {bookmarkedEvents.includes(event?.id) ? (
                          <FaBookmark className="text-[#d4af37]" />
                        ) : (
                          <FaRegBookmark className="text-white/40" />
                        )}
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareEvent(event);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition"
                      >
                        <FaShare className="text-white/40" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={closeEventModal}
            ></div>
            
            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative glass max-w-2xl w-full p-8 rounded-2xl z-10"
            >
              {/* Close Button */}
              <button
                onClick={closeEventModal}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center"
              >
                <FaTimes />
              </button>

              {/* Event Icon */}
              <div className="text-6xl mb-4 text-center">
                {getEventIcon(selectedEvent?.type)}
              </div>

              {/* Event Title */}
              <h2 className="text-3xl font-bold text-center text-[#d4af37] mb-2">
                {currentLanguage === 'bn' ? selectedEvent?.nameBn : selectedEvent?.name}
              </h2>

              {/* Event Type */}
              <div className="flex justify-center mb-6">
                <span className={`px-4 py-1 rounded-full text-sm ${getColorClass(getEventColor(selectedEvent?.type))} ${getTextColorClass(getEventColor(selectedEvent?.type))}`}>
                  {getTypeName(selectedEvent?.type)}
                </span>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 p-4 rounded-lg text-center">
                  <FaMoon className="mx-auto text-[#d4af37] mb-2" />
                  <p className="text-sm text-white/50 mb-1">Hijri Date</p>
                  <p className="text-xl font-bold text-white">
                    {selectedEvent?.hijriDate || ''}
                  </p>
                </div>
                
                <div className="bg-black/20 p-4 rounded-lg text-center">
                  <FaSun className="mx-auto text-[#d4af37] mb-2" />
                  <p className="text-sm text-white/50 mb-1">Gregorian Date</p>
                  <p className="text-xl font-bold text-white">
                    {selectedEvent?.gregorianDate || ''}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#d4af37] mb-2 flex items-center">
                  <FaInfoCircle className="mr-2" />
                  Description
                </h3>
                <p className="text-white/70 leading-relaxed">
                  {currentLanguage === 'bn' ? selectedEvent?.descriptionBn : selectedEvent?.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => toggleBookmark(selectedEvent?.id)}
                  className={`flex-1 py-3 rounded-lg transition flex items-center justify-center gap-2 ${
                    bookmarkedEvents.includes(selectedEvent?.id)
                      ? 'bg-[#d4af37] text-[#1a3f54]'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {bookmarkedEvents.includes(selectedEvent?.id) ? (
                    <>
                      <FaBookmark /> Bookmarked
                    </>
                  ) : (
                    <>
                      <FaRegBookmark /> Bookmark
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => shareEvent(selectedEvent)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FaShare /> Share
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EventList;
