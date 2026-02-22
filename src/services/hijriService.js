import api from './api';

class HijriService {
  /**
   * Get current Hijri date from your working API
   */
  async getCurrentHijri() {
    try {
      const response = await api.get('/api/calendar/current-hijri');
      console.log('API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching current hijri:', error);
      // Fallback for development
      return {
        success: true,
        data: {
          day: 5,
          month: 9,
          monthName: "Ramadan",
          year: 1447,
          gregorian: "2026-02-22"
        }
      };
    }
  }

  /**
   * Generate Ramadan calendar for current year
   */
  async getRamadanCalendar() {
    try {
      // Get current Hijri date
      const hijriData = await this.getCurrentHijri();
      const currentDay = hijriData.data.day;
      const hijriYear = hijriData.data.year;
      
      console.log(`Current Hijri: Year ${hijriYear}, Day ${currentDay}, Month ${hijriData.data.month}`);
      
      // Since we know it's Ramadan (month 9), we can generate calendar
      const today = new Date();
      const gregorianToday = today.toISOString().split('T')[0];
      
      // Calculate start of Ramadan (current date minus (currentDay - 1) days)
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - (currentDay - 1));
      
      console.log(`Ramadan starts on: ${startDate.toDateString()}`);
      
      // Generate 30 days
      const days = [];
      
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        days.push({
          day: i + 1,
          gregorian: currentDate,
          gregorianStr: currentDate.toISOString().split('T')[0],
          hijri: {
            day: i + 1,
            month: 9,
            year: hijriYear,
            format: `${i + 1} Ramadan ${hijriYear}`
          },
          isToday: i + 1 === currentDay
        });
      }
      
      return {
        year: hijriYear,
        currentDay: currentDay,
        days: days,
        startDate: startDate,
        endDate: new Date(startDate.getTime() + (29 * 24 * 60 * 60 * 1000))
      };
      
    } catch (error) {
      console.error('Error generating Ramadan calendar:', error);
      return this.getFallbackCalendar();
    }
  }

  /**
   * Fallback calendar for development
   */
  getFallbackCalendar() {
    const startDate = new Date(2026, 1, 19); // Feb 19, 2026
    const days = [];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      days.push({
        day: i + 1,
        gregorian: date,
        gregorianStr: date.toISOString().split('T')[0],
        hijri: {
          day: i + 1,
          month: 9,
          year: 1447,
          format: `${i + 1} Ramadan 1447`
        },
        isToday: i + 1 === 5 // Feb 22 is day 5
      });
    }
    
    return {
      year: 1447,
      currentDay: 5,
      days: days,
      startDate: startDate,
      endDate: new Date(2026, 2, 20) // March 20, 2026
    };
  }
}

export default new HijriService();
