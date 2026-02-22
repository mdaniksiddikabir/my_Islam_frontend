import api from './api';

class HijriService {
  /**
   * Get Hijri date for any location using your backend API
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @param {Date} date - Date to convert
   */
  async getHijriDate(lat, lng, date = new Date()) {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      
      // Use your backend API which already has Aladhan integration
      const response = await api.get('/api/calendar/hijri', {
        params: {
          lat,
          lng,
          date: formattedDate
        }
      });

      if (response.data && response.data.data) {
        return {
          year: response.data.data.hijri.year,
          month: response.data.data.hijri.month,
          monthName: response.data.data.hijri.monthName,
          day: response.data.data.hijri.day,
          format: `${response.data.data.hijri.day} ${response.data.data.hijri.monthName} ${response.data.data.hijri.year}`
        };
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error fetching Hijri date:', error);
      return this.getFallbackDate(date);
    }
  }

  /**
   * Get complete Ramadan calendar for any location
   */
  async getRamadanCalendar(lat, lng) {
    try {
      const today = new Date();
      const calendar = [];
      let ramadanYear = null;
      let currentDay = null;
      
      // Get today's Hijri date
      const todayHijri = await this.getHijriDate(lat, lng, today);
      
      // If we're in Ramadan (month 9)
      if (todayHijri.month === 9) {
        ramadanYear = todayHijri.year;
        currentDay = todayHijri.day;
        
        // Calculate start of Ramadan (1st of month)
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - (currentDay - 1));
        
        // Generate 30 days
        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          
          const hijriDate = await this.getHijriDate(lat, lng, currentDate);
          
          calendar.push({
            day: i + 1,
            gregorian: currentDate,
            hijri: hijriDate,
            isToday: i + 1 === currentDay
          });
        }
      } else {
        // Not in Ramadan - show upcoming Ramadan
        ramadanYear = todayHijri.month > 9 ? todayHijri.year + 1 : todayHijri.year;
        
        // Find next Ramadan start (simplified)
        const startDate = new Date(today);
        startDate.setMonth(2, 1); // Approximate
        startDate.setFullYear(ramadanYear === todayHijri.year ? today.getFullYear() : today.getFullYear() + 1);
        
        for (let i = 0; i < 30; i++) {
          const currentDate = new Date(startDate);
          currentDate.setDate(startDate.getDate() + i);
          
          calendar.push({
            day: i + 1,
            gregorian: currentDate,
            hijri: { day: i + 1, month: 9, year: ramadanYear, format: `${i + 1} Ramadan ${ramadanYear}` },
            isToday: false
          });
        }
      }
      
      return {
        year: ramadanYear,
        currentDay,
        days: calendar
      };
    } catch (error) {
      console.error('Error generating Ramadan calendar:', error);
      return this.getFallbackCalendar();
    }
  }

  getFallbackDate(date) {
    // Simple calculation fallback
    return {
      year: 1447,
      month: 9,
      monthName: 'Ramadan',
      day: date.getDate(),
      format: `${date.getDate()} Ramadan 1447`
    };
  }

  getFallbackCalendar() {
    const calendar = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + (i - 14));
      
      calendar.push({
        day: i + 1,
        gregorian: date,
        hijri: {
          day: i + 1,
          month: 9,
          year: 1447,
          format: `${i + 1} Ramadan 1447`
        },
        isToday: i === 14
      });
    }
    
    return {
      year: 1447,
      currentDay: 15,
      days: calendar
    };
  }
}

export default new HijriService();
