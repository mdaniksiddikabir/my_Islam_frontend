import api from './api';

class HijriService {
  constructor() {
    // Complete country Ramadan start offsets
    // 0 = February 18 start (Saudi Arabia, UAE, Qatar, etc.)
    // -1 = February 19 start (Bangladesh, India, Pakistan, Indonesia, etc.)
    this.countryOffsets = {
      // =====================================================
      // GROUP 1: February 18 Start (0 offset)
      // These countries started Ramadan on Feb 18, 2026
      // =====================================================
      
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
      // These countries started Ramadan on Feb 19, 2026
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
      // China regions (most follow February 18 start)
      'China (Liaoning)': 0,
      'China (Beijing)': 0,
      'China (Shanghai)': 0,
      'China (Tianjin)': 0,
      'China (Chongqing)': 0,
      'China (Hebei)': 0,
      'China (Shanxi)': 0,
      'China (Inner Mongolia)': 0,
      'China (Jilin)': 0,
      'China (Heilongjiang)': 0,
      'China (Jiangsu)': 0,
      'China (Zhejiang)': 0,
      'China (Anhui)': 0,
      'China (Fujian)': 0,
      'China (Jiangxi)': 0,
      'China (Shandong)': 0,
      'China (Henan)': 0,
      'China (Hubei)': 0,
      'China (Hunan)': 0,
      'China (Guangdong)': 0,
      'China (Guangxi)': 0,
      'China (Hainan)': 0,
      'China (Sichuan)': 0,
      'China (Guizhou)': 0,
      'China (Yunnan)': 0,
      'China (Tibet)': 0,
      'China (Shaanxi)': 0,
      'China (Gansu)': 0,
      'China (Qinghai)': 0,
      'China (Ningxia)': 0,
      'China (Xinjiang)': 0,
      
      // Specific cities in Liaoning
      'Shenyang': 0,
      'Dalian': 0,
      'Anshan': 0,
      'Fushun': 0,
      'Benxi': 0,
      'Dandong': 0,
      'Jinzhou': 0,
      'Yingkou': 0,
      'Fuxin': 0,
      'Liaoyang': 0,
      'Panjin': 0,
      'Tieling': 0,
      'Chaoyang': 0,
      'Huludao': 0,
      */
      
      // China default (most regions follow Feb 18 start)
      'China': -1
    };
  }

  /**
   * Get country-specific offset with fallback
   * @param {Object} location - User's location with country and city
   * @returns {number} Offset (-1, 0, etc.)
   */
  getCountryOffset(location) {
    if (!location) return 0; // Default to Saudi calculation if no location
    
    const country = location.country;
    const city = location.city;
    
    console.log(`Checking offset for: ${city}, ${country}`);
    
    // Try exact city match first (for cities with special offsets)
    if (city) {
      // Check if city has its own entry
      if (this.countryOffsets[city] !== undefined) {
        console.log(`Found city match for ${city}: offset ${this.countryOffsets[city]}`);
        return this.countryOffsets[city];
      }
      
      // Check for country-specific city format (e.g., "China (Beijing)")
      const countryCityKey = `${country} (${city})`;
      if (this.countryOffsets[countryCityKey] !== undefined) {
        console.log(`Found country-city match: offset ${this.countryOffsets[countryCityKey]}`);
        return this.countryOffsets[countryCityKey];
      }
    }
    
    // Try country match
    if (this.countryOffsets[country] !== undefined) {
      console.log(`Found country match for ${country}: offset ${this.countryOffsets[country]}`);
      return this.countryOffsets[country];
    }
    
    // Try common variations
    const countryVariations = {
      'UK': 'United Kingdom',
      'USA': 'United States',
      'UAE': 'United Arab Emirates',
      'England': 'United Kingdom',
      'Scotland': 'United Kingdom',
      'Wales': 'United Kingdom',
      'Northern Ireland': 'United Kingdom',
    };
    
    if (countryVariations[country]) {
      const mappedCountry = countryVariations[country];
      if (this.countryOffsets[mappedCountry] !== undefined) {
        console.log(`Found mapped country match: offset ${this.countryOffsets[mappedCountry]}`);
        return this.countryOffsets[mappedCountry];
      }
    }
    
    // Default to 0 (Saudi calculation) if no match
    console.log(`No match found for ${country}, using default offset 0`);
    return 0;
  }

  /**
   * Get current Hijri date with country-specific offset
   */
  async getCurrentHijri(location) {
    try {
      // Get base date from API
      const response = await api.get('/api/calendar/current-hijri');
      console.log('API Response:', response.data);
      
      // Apply country offset
      const offset = this.getCountryOffset(location);
      
      if (offset !== 0) {
        console.log(`Applying offset of ${offset} day for ${location?.country}, ${location?.city}`);
        
        // Adjust the day based on offset
        let adjustedDay = response.data.data.day + offset;
        let adjustedMonth = response.data.data.month;
        let adjustedYear = response.data.data.year;
        
        // Handle month boundaries
        if (adjustedDay < 1) {
          // Previous month
          adjustedMonth -= 1;
          if (adjustedMonth < 1) {
            adjustedMonth = 12;
            adjustedYear -= 1;
          }
          // Get days in previous month (simplified - assume 30 days)
          adjustedDay = 30 + adjustedDay;
        } else if (adjustedDay > 30) {
          // Next month
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
   * Generate Ramadan calendar with proper dates and offset support
   */
  async getRamadanCalendar(location) {
    try {
      // Get current Hijri date with offset
      const hijriData = await this.getCurrentHijri(location);
      const currentDay = hijriData.data.day;
      const hijriYear = hijriData.data.year;
      const offset = this.getCountryOffset(location);

      console.log(`📍 Location: ${location?.city}, ${location?.country}`);
      console.log(`📅 Current Hijri from API: Day ${hijriData.data.day}, Month ${hijriData.data.month}, Year ${hijriYear}`);
      console.log(`🔄 Country offset: ${offset}`);

      // Set base Ramadan start date to February 18, 2026
      const baseStartDate = new Date(2026, 1, 18); // February 18, 2026
      
      // Apply offset to start date
      // offset = 0: Feb 18 start
      // offset = -1: Feb 19 start (one day later)
      const startDate = new Date(baseStartDate);
      startDate.setDate(baseStartDate.getDate() + Math.abs(offset));
      
      // Today's actual date (Feb 25, 2026)
      const today = new Date(2026, 1, 25); // February 25, 2026
      
      console.log(`🌙 Base Ramadan start: ${baseStartDate.toDateString()}`);
      console.log(`🌙 Adjusted start (offset ${offset}): ${startDate.toDateString()}`);
      console.log(`📆 Today's date: ${today.toDateString()}`);
      
      // Calculate current day of Ramadan based on adjusted start date
      const diffTime = Math.abs(today - startDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const calculatedCurrentDay = diffDays + 1; // +1 because day 1 is start date
      
      console.log(`✅ Days since Ramadan started: ${diffDays}`);
      console.log(`✅ Today should be Day ${calculatedCurrentDay} of Ramadan`);

      // Generate 30 days starting from adjusted start date
      const days = [];
      for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        
        // Format date as YYYY-MM-DD
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
          isToday: i + 1 === calculatedCurrentDay
        });
      }

      // DEBUG: Log first 10 days to verify
      console.log('📅 RAMADAN CALENDAR:');
      days.slice(0, 10).forEach(d => {
        console.log(`Day ${d.day}: ${d.gregorianStr} ${d.isToday ? '← TODAY' : ''}`);
      });

      return {
        success: true,
        data: {
          year: hijriYear,
          currentDay: calculatedCurrentDay,
          days: days,
          startDate: startDate,
          endDate: new Date(startDate.getTime() + (29 * 24 * 60 * 60 * 1000)),
          offset: offset,
          location: location
        }
      };

    } catch (error) {
      console.error('Error generating Ramadan calendar:', error);
      return this.getFallbackCalendar(location);
    }
  }

  /**
   * Fallback calendar with offset support
   */
  getFallbackCalendar(location) {
    const offset = this.getCountryOffset(location);
    
    // Base: Ramadan starts Feb 18, 2026
    const baseStartDate = new Date(2026, 1, 18); // Feb 18, 2026
    
    // Apply offset
    const startDate = new Date(baseStartDate);
    startDate.setDate(baseStartDate.getDate() + Math.abs(offset));
    
    const today = new Date(2026, 1, 25); // Feb 25, 2026
    
    // Calculate current day based on adjusted start
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const currentDay = diffDays + 1;
    
    console.log(`📍 FALLBACK: Base start Feb 18, offset ${offset} → actual start ${startDate.toDateString()}`);
    console.log(`📍 Today (Feb 25) is day ${currentDay} of Ramadan`);
    
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
        isToday: i + 1 === currentDay
      });
    }
    
    return {
      success: true,
      data: {
        year: 1447,
        currentDay: currentDay,
        days: days,
        startDate: startDate,
        endDate: new Date(startDate.getTime() + (29 * 24 * 60 * 60 * 1000)),
        offset: offset,
        location: location
      }
    };
  }

  /**
   * Get fallback data with country-specific offset
   */
  getFallbackData(location) {
    const offset = this.getCountryOffset(location);
    
    // For Feb 25, 2026:
    // offset 0: Day 8 of Ramadan
    // offset -1: Day 7 of Ramadan
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
}

export default new HijriService();
