import { useState, useEffect } from 'react';
import moment from 'moment-hijri';

const useRamadan = () => {
  const [isRamadan, setIsRamadan] = useState(false);
  const [ramadanInfo, setRamadanInfo] = useState({
    year: null,
    day: null,
    remaining: null
  });

  useEffect(() => {
    checkRamadan();
  }, []);

  const checkRamadan = () => {
    const today = moment();
    const hijriMonth = today.iMonth() + 1; // iMonth() returns 0-11
    
    // Check if current Hijri month is Ramadan (month 9)
    if (hijriMonth === 9) {
      const hijriYear = today.iYear();
      const currentDay = today.iDate();
      const daysRemaining = 30 - currentDay;
      
      setIsRamadan(true);
      setRamadanInfo({
        year: hijriYear,
        day: currentDay,
        remaining: daysRemaining
      });
    } else {
      setIsRamadan(false);
    }
  };

  return { isRamadan, ramadanInfo };
};

export default useRamadan;
