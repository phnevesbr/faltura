import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useScheduleConfig } from '../contexts/ScheduleConfigContext';
import { isValidSubject } from '../utils/subjectHelpers';

export const useNextClass = () => {
  const { subjects, schedule } = useData();
  const { timeSlots } = useScheduleConfig();
  const [nextClass, setNextClass] = useState<any>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');

  const getSaoPauloTime = () => {
    // Convert to São Paulo time (UTC-3)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const saoPauloTime = new Date(utc + (-3 * 3600000));
    return saoPauloTime;
  };

  const getCurrentDay = () => {
    const saoPauloTime = getSaoPauloTime();
    const day = saoPauloTime.getDay();
    // Convert Sunday = 0 to Monday = 0 format
    return day === 0 ? 6 : day - 1;
  };

  const findNextClass = () => {
    const saoPauloTime = getSaoPauloTime();
    const currentDay = getCurrentDay();
    const currentTime = saoPauloTime.getHours() * 60 + saoPauloTime.getMinutes();

    // First, look for classes today after current time
    const todaySchedule = schedule
      .filter(item => item.day === currentDay)
      .sort((a, b) => a.timeSlot - b.timeSlot);

    for (const item of todaySchedule) {
      const timeSlot = timeSlots?.[item.timeSlot];
      if (!timeSlot?.startTime) continue;
      
      const [startHour, startMin] = timeSlot.startTime.split(':').map(Number);
      const startTime = startHour * 60 + startMin;
      
      if (currentTime < startTime) {
        const subject = subjects?.find(s => s.id === item.subjectId);
        if (isValidSubject(subject)) {
          return { item, subject, timeSlot, day: currentDay };
        }
      }
    }

    // If no class today, look for the next day with classes
    for (let i = 1; i <= 7; i++) {
      const dayToCheck = (currentDay + i) % 7;
      const daySchedule = schedule
        .filter(item => item.day === dayToCheck)
        .sort((a, b) => a.timeSlot - b.timeSlot);

      if (daySchedule.length > 0) {
        const firstClass = daySchedule[0];
        const timeSlot = timeSlots?.[firstClass.timeSlot];
        const subject = subjects?.find(s => s.id === firstClass.subjectId);
        
        if (timeSlot && isValidSubject(subject)) {
          return { item: firstClass, subject, timeSlot, day: dayToCheck };
        }
      }
    }

    return null;
  };

  const calculateTimeUntil = (nextClassInfo: any) => {
    if (!nextClassInfo) return '';

    const saoPauloTime = getSaoPauloTime();
    const currentDay = getCurrentDay();
    
    // Create next class date in São Paulo time
    const nextClassDate = new Date(saoPauloTime);
    
    // Calculate days difference
    let daysDiff;
    if (nextClassInfo.day === currentDay) {
      // Same day - check if class is later today
      const [startHour, startMin] = nextClassInfo?.timeSlot?.startTime?.split(':').map(Number) || [0, 0];
      const currentTime = saoPauloTime.getHours() * 60 + saoPauloTime.getMinutes();
      const classTime = startHour * 60 + startMin;
      
      if (classTime > currentTime) {
        daysDiff = 0; // Today
      } else {
        daysDiff = 7; // Next week same day
      }
    } else if (nextClassInfo.day > currentDay) {
      daysDiff = nextClassInfo.day - currentDay;
    } else {
      daysDiff = 7 - currentDay + nextClassInfo.day;
    }
    
    nextClassDate.setDate(nextClassDate.getDate() + daysDiff);
    
    const [startHour, startMin] = nextClassInfo?.timeSlot?.startTime?.split(':').map(Number) || [0, 0];
    nextClassDate.setHours(startHour, startMin, 0, 0);

    const timeDiff = nextClassDate.getTime() - saoPauloTime.getTime();
    
    if (timeDiff <= 0) return 'Agora';

    const totalMinutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      if (remainingHours > 0) {
        return `${days}d ${remainingHours}h`;
      } else {
        return `${days}d`;
      }
    } else if (hours > 0) {
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${hours}h`;
      }
    } else {
      return `${minutes}m`;
    }
  };

  useEffect(() => {
    const updateNextClass = () => {
      const next = findNextClass();
      setNextClass(next);
      
      if (next) {
        const timeUntil = calculateTimeUntil(next);
        setTimeUntilNext(timeUntil);
      } else {
        setTimeUntilNext('');
      }
    };

    // Update immediately
    updateNextClass();

    // Update every minute
    const interval = setInterval(updateNextClass, 60000);

    return () => clearInterval(interval);
  }, [schedule, subjects, timeSlots]);

  return { nextClass, timeUntilNext };
};