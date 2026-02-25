import api from './api';

class HijriService {
  constructor() {
    // Complete country Ramadan start offsets
    // 0 = February 18 start (Saudi Arabia, UAE, Qatar, etc.)
    // -1 = February 19 start (Bangladesh, India, Pakistan, Indonesia, etc.)
    this.countryOffsets = {
      // Middle East
      'Saudi Arabia': 0, 'UAE': 0, 'United Arab Emirates': 0,
      'Qatar': 0, 'Kuwait': 0, 'Bahrain': 0, 'Oman': 0,
      'Iraq': 0, 'Lebanon': 0, 'Palestine': 0, 'Yemen': 0,
      'Jordan': 0, 'Syria': 0,
      
      // Africa (North)
      'Egypt': 0, 'Libya': 0, 'Sudan': 0, 'Tunisia': 0,
      'Algeria': 0, 'Morocco': 0, 'Mauritania': 0,
      
      // Africa (West)
      'Nigeria': 0, 'Ghana': 0, 'Ivory Coast': 0, 'Senegal': 0,
      'Mali': 0, 'Burkina Faso': 0, 'Niger': 0, 'Guinea': 0,
      'Benin': 0, 'Togo': 0, 'Sierra Leone': 0, 'Liberia': 0,
      
      // Africa (Central)
      'Cameroon': 0, 'Chad': 0, 'Central African Republic': 0,
      'Equatorial Guinea': 0, 'Gabon': 0, 'Republic of Congo': 0,
      'DR Congo': 0, 'Rwanda': 0, 'Burundi': 0,
      
      // Africa (East)
      'Kenya': 0, 'Uganda': 0, 'Tanzania': 0, 'Ethiopia': 0,
      'Eritrea': 0, 'Djibouti': 0, 'Somalia': 0,
      
      // Africa (South)
      'South Africa': 0, 'Zimbabwe': 0, 'Zambia': 0, 'Malawi': 0,
      'Mozambique': 0, 'Angola': 0, 'Namibia': 0, 'Botswana': 0,
      'Lesotho': 0, 'Eswatini': 0, 'Madagascar': 0,
      
      // Europe
      'Turkey': 0, 'Albania': 0, 'Kosovo': 0, 'Bosnia': 0,
      'United Kingdom': 0, 'UK': 0, 'England': 0, 'Scotland': 0, 'Wales': 0, 'Northern Ireland': 0,
      'France': 0, 'Germany': 0, 'Netherlands': 0, 'Belgium': 0,
      'Austria': 0, 'Switzerland': 0, 'Sweden': 0, 'Norway': 0,
      'Denmark': 0, 'Finland': 0, 'Iceland': 0, 'Ireland': 0,
      'Spain': 0, 'Portugal': 0, 'Italy': 0, 'Greece': 0,
      'Poland': 0, 'Czech Republic': 0, 'Slovakia': 0, 'Hungary': 0,
      'Romania': 0, 'Bulgaria': 0, 'Serbia': 0, 'Croatia': 0,
      'Slovenia': 0, 'Estonia': 0, 'Latvia': 0, 'Lithuania': 0,
      'Ukraine': 0, 'Belarus': 0, 'Moldova': 0, 'Georgia': 0,
      'Armenia': 0, 'Azerbaijan': 0, 'Russia': 0,
      
      // Americas
      'United States': 0, 'USA': 0, 'Canada': 0, 'Mexico': 0,
      'Brazil': 0, 'Argentina': 0, 'Chile': 0, 'Colombia': 0,
      'Venezuela': 0, 'Peru': 0, 'Ecuador': 0, 'Bolivia': 0,
      'Paraguay': 0, 'Uruguay': 0, 'Guyana': 0, 'Suriname': 0,
      
      // Caribbean
      'Trinidad and Tobago': 0, 'Jamaica': 0, 'Haiti': 0, 'Dominican Republic': 0,
      'Cuba': 0, 'Bahamas': 0, 'Barbados': 0, 'Saint Lucia': 0,
      'Grenada': 0, 'Saint Vincent': 0, 'Antigua': 0, 'Dominica': 0,
      
      // Central Asia
      'Afghanistan': 0, 'Tajikistan': 0, 'Kyrgyzstan': 0,
      
      // =====================================================
      // GROUP 2: February 19 Start (-1 offset)
      // =====================================================
      
      // South Asia
      'Pakistan': -1, 'India': -1, 'Bangladesh': -1, 'Sri Lanka': -1,
      'Nepal': -1, 'Maldives': -1, 'Bhutan': -1,
      
      // Southeast Asia
      'Indonesia': -1, 'Malaysia': -1, 'Singapore': -1, 'Brunei': -1,
      'Philippines': -1, 'Thailand': -1, 'Vietnam': -1, 'Myanmar': -1,
      'Cambodia': -1, 'Laos': -1, 'East Timor': -1,
      
      // East Asia
      'Japan': -1, 'South Korea': -1, 'North Korea': -1, 'Mongolia': -1,
      'Taiwan': -1, 'Hong Kong': -1, 'Macau': -1,
      
      // Central Asia
      'Kazakhstan': -1, 'Uzbekistan': -1, 'Turkmenistan': -1,
      
      // Middle East (some)
      'Iran': -1,
      
      // Oceania
      'Australia': -1, 'New Zealand': -1, 'Fiji': -1, 'Papua New Guinea': -1,
      'Solomon Islands': -1, 'Vanuatu': -1, 'Samoa': -1, 'Tonga': -1,
      /*
      // China regions
      'China (Liaoning)': 0, 'China (Beijing)': 0, 'China (Shanghai)': 0,
      'Shenyang': 0, 'Dalian': 0, 'Anshan': 0, 'Fushun': 0,
      */
      // China default
      'China': -1
    };
  }

  /**
   * Get country-specific offset with fallback
   */
  getCountryOffset(location) {
    if (!location) return 0;
    
    const country = location.country;
    const city = location.city;
    
    if (city) {
      if (this.countryOffsets[city] !== undefined) {
        return this.countryOffsets[city];
      }
      
      const countryCityKey = `${country} (${city})`;
      if (this.countryOffsets[countryCityKey] !== undefined) {
        return this.countryOffsets[countryCityKey];
      }
    }
    
    if (this.countryOffsets[country] !== undefined) {
      return this.countryOffsets[country];
    }
    
    const countryVariations = {
      'UK': 'United Kingdom', 'USA': 'United States', 'UAE': 'United Arab Emirates',
      'England': 'United Kingdom', 'Scotland': 'United Kingdom', 'Wales': 'United Kingdom'
    };
    
    if (countryVariations[country]) {
      const mappedCountry = countryVariations[country];
      if (this.countryOffsets[mappedCountry] !== undefined) {
        return this.countryOffsets[mappedCountry];
      }
    }
    
    return 0;
  }

  /**
   * Get offset description for UI
   */
  getOffsetDescription(location) {
    const offset = this.getCountryOffset(location);
    
    if (offset === -1) {
      return "This country follows the February 19 start (1 day behind Saudi Arabia)";
    } else {
      return "This country follows the February 18 start (same as Saudi Arabia)";
    }
  }

  /**
   * Get current Hijri date with country-specific offset
   */
  async getCurrentHijri(location) {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/calendar/current-hijri?_=${timestamp}`);
      
      const offset = this.getCountryOffset(location);
      
      if (offset !== 0) {
        let adjustedDay = response.data.data.day + offset;
        let adjustedMonth = response.data.data.month;
        let adjustedYear = response.data.data.year;
        
        if (adjustedDay < 1) {
          adjustedMonth -= 1;
          if (adjustedMonth < 1) {
            adjustedMonth = 12;
            adjustedYear -= 1;
          }
          adjustedDay = 30 + adjustedDay;
        } else if (adjustedDay > 30) {
          adjustedDay = adjustedDay - 30;
          adjustedMonth += 1;
          if (adjustedMonth > 12) {
            adjustedMonth = 1;
            adjustedYear += 1;
          }
        }
        
        response.data.data.day = adjustedDay;
        response.data.data.month = adjustedMonth;
        response.data.data.year = adjustedYear;
      }
      
      return response.data;
    } catch (error) {
      console.error('Error fetching current hijri:', error);
      return this.getFallbackData(location);
    }
  }

  /**
   * Get fallback data
   */
  getFallbackData(location) {
    const offset = this.getCountryOffset(location);
    const day = offset === -1 ? 7 : 8;
    
    return {
      success: true,
      data: {
        day: day,
        month: 9,
        monthName: "Ramadan",
        year: 1447,
        gregorian: "2026-02-25"
      }
    };
  }

  /**
   * Generate Ramadan calendar
   */
  async getRamadanCalendar(location) {
    try {
      const hijriData = await this.getCurrentHijri(location);
      const currentDay = hijriData.data.day;
      const hijriYear = hijriData.data.year;
      const offset = this.getCountryOffset(location);

      const baseStartDate = new Date(2026, 1, 18);
      const startDate = new Date(baseStartDate);
      startDate.setDate(baseStartDate.getDate() + Math.abs(offset));
      
      const today = new Date(2026, 1, 25);
      
      const diffTime = Math.abs(today - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedCurrentDay = diffDays + 1;

      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      const days = [];
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;

        days.push({
          day: i + 1,
          gregorian: currentDate,
          gregorianStr: dateStr,
          hijri: {
            day: i + 1,
            month: 9,
            year: hijriYear,
            format: `${i + 1} Ramadan ${hijriYear}`
          },
          isToday: i + 1 === calculatedCurrentDay,
          shortWeekday: weekdays[currentDate.getDay()].substring(0, 3)
        });
      }

      return {
        success: true,
        year: hijriYear,
        currentDay: calculatedCurrentDay,
        days: days,
        startDate: startDate,
        endDate: new Date(startDate.getTime() + (29 * 24 * 60 * 60 * 1000)),
        offset: offset,
        location: location
      };

    } catch (error) {
      console.error('Error generating Ramadan calendar:', error);
      return this.getFallbackCalendar(location);
    }
  }

  /**
   * Fallback calendar
   */
  getFallbackCalendar(location) {
    const offset = this.getCountryOffset(location);
    
    const baseStartDate = new Date(2026, 1, 18);
    const startDate = new Date(baseStartDate);
    startDate.setDate(baseStartDate.getDate() + Math.abs(offset));
    
    const today = new Date(2026, 1, 25);
    
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = diffDays + 1;
    
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const days = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      days.push({
        day: i + 1,
        gregorian: date,
        gregorianStr: dateStr,
        hijri: {
          day: i + 1,
          month: 9,
          year: 1447,
          format: `${i + 1} Ramadan 1447`
        },
        isToday: i + 1 === currentDay,
        shortWeekday: weekdays[date.getDay()].substring(0, 3)
      });
    }
    
    return {
      success: true,
      year: 1447,
      currentDay: currentDay,
      days: days,
      startDate: startDate,
      endDate: new Date(startDate.getTime() + (29 * 24 * 60 * 60 * 1000)),
      offset: offset,
      location: location
    };
  }

  /**
   * Get prayer times with cache busting
   */
  async getPrayerTimesWithOffset(location, method, dateStr, useOffsets = false) {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      
      const response = await api.get(`/api/prayer/times?lat=${location.lat}&lng=${location.lng}&method=${method}&date=${dateStr}&_=${timestamp}`);
      
      if (!useOffsets) {
        return response.data;
      }
      
      const offset = this.getCountryOffset(location);
      
      if (offset === 0) {
        return response.data;
      }
      
      return response.data;
      
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      throw error;
    }
  }

  /**
   * Get complete Ramadan data with progress
   */
  async getCompleteRamadanData(location, method = 1, useOffsets = false, onProgress = null) {
    try {
      if (onProgress) onProgress(5);
      
      const calendarData = await this.getRamadanCalendar(location);
      
      if (onProgress) onProgress(15);
      
      const daysWithTimes = [];
      const totalDays = calendarData.days.length;
      
      for (let i = 0; i < totalDays; i++) {
        const day = calendarData.days[i];
        
        try {
          const progress = 15 + Math.round((i + 1) / totalDays * 80);
          if (onProgress) onProgress(progress);
          
          const prayerResponse = await this.getPrayerTimesWithOffset(
            location,
            method,
            day.gregorianStr,
            useOffsets
          );
          
          let sehriTime = '';
          let iftarTime = '';
          
          if (prayerResponse?.data?.timings) {
            sehriTime = prayerResponse.data.timings.Fajr || '';
            iftarTime = prayerResponse.data.timings.Maghrib || '';
          }
          
          daysWithTimes.push({
            ...day,
            sehriTime,
            iftarTime,
            sehri12: this.convertTo12Hour(sehriTime),
            iftar12: this.convertTo12Hour(iftarTime),
            fastingHours: this.calculateFastingHours(sehriTime, iftarTime)
          });
          
        } catch (error) {
          console.error(`Failed to get times for day ${day.day}:`, error);
          daysWithTimes.push({
            ...day,
            sehriTime: '',
            iftarTime: '',
            sehri12: '--:-- --',
            iftar12: '--:-- --',
            fastingHours: '--h --m'
          });
        }
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (onProgress) onProgress(100);
      
      return {
        ...calendarData,
        days: daysWithTimes
      };
      
    } catch (error) {
      console.error('Error getting complete Ramadan data:', error);
      throw error;
    }
  }

  /**
   * Convert 24h to 12h format
   */
  convertTo12Hour(time) {
    if (!time) return '--:-- --';
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  /**
   * Calculate fasting hours
   */
  calculateFastingHours(sehri, iftar) {
    if (!sehri || !iftar) return '--h --m';
    
    const [sehriHour, sehriMin] = sehri.split(':').map(Number);
    const [iftarHour, iftarMin] = iftar.split(':').map(Number);
    
    let totalMinutes = (iftarHour * 60 + iftarMin) - (sehriHour * 60 + sehriMin);
    if (totalMinutes < 0) totalMinutes += 24 * 60;
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  }
}

export default new HijriService();
