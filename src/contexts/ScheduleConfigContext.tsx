
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSystemLimits } from '../hooks/useSystemLimits';
import { toast } from 'sonner';

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ScheduleConfigContextType {
  timeSlots: TimeSlot[];
  updateTimeSlots: (newTimeSlots: TimeSlot[]) => void;
  addTimeSlot: () => void;
  removeTimeSlot: (id: string) => void;
  updateTimeSlot: (id: string, startTime: string, endTime: string) => void;
  resetToDefault: () => void;
}

const ScheduleConfigContext = createContext<ScheduleConfigContextType | undefined>(undefined);

export const useScheduleConfig = () => {
  const context = useContext(ScheduleConfigContext);
  if (context === undefined) {
    throw new Error('useScheduleConfig must be used within a ScheduleConfigProvider');
  }
  return context;
};

const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return endMinutes - startMinutes;
};

const createTimeSlot = (startTime: string, endTime: string): TimeSlot => ({
  id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  startTime,
  endTime,
  duration: calculateDuration(startTime, endTime)
});

const defaultTimeSlots: TimeSlot[] = [
  createTimeSlot('07:00', '07:50'),
  createTimeSlot('07:50', '08:40'),
  createTimeSlot('08:40', '09:30'),
  createTimeSlot('09:50', '10:40'),
  createTimeSlot('10:40', '11:30')
];

export const ScheduleConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { limits } = useSystemLimits();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(defaultTimeSlots);

  // Load user-specific time slots
  useEffect(() => {
    if (user) {
      const userKey = `faltula_timeslots_${user.id}`;
      const savedTimeSlots = localStorage.getItem(userKey);
      if (savedTimeSlots) {
        try {
          const parsedSlots = JSON.parse(savedTimeSlots);
          // Ensure all slots have id and duration
          const validSlots = parsedSlots.map((slot: any) => {
            if (!slot.id) {
              return createTimeSlot(slot.startTime, slot.endTime);
            }
            if (!slot.duration) {
              return {
                ...slot,
                duration: calculateDuration(slot.startTime, slot.endTime)
              };
            }
            return slot;
          });
          setTimeSlots(validSlots);
        } catch (error) {
          console.error('Error loading time slots:', error);
          setTimeSlots(defaultTimeSlots);
        }
      } else {
        setTimeSlots(defaultTimeSlots);
      }
    } else {
      setTimeSlots(defaultTimeSlots);
    }
  }, [user]);

  // Save time slots when they change
  useEffect(() => {
    if (user) {
      const userKey = `faltula_timeslots_${user.id}`;
      localStorage.setItem(userKey, JSON.stringify(timeSlots));
    }
  }, [user, timeSlots]);

  const updateTimeSlots = (newTimeSlots: TimeSlot[]) => {
    setTimeSlots(newTimeSlots);
  };

  const addTimeSlot = () => {
    // Verificar limite de horários
    if (timeSlots.length >= limits.maxTimeSlots) {
      toast.error(`Limite de horários excedido!`, {
        description: `Você já tem ${timeSlots.length} horários. Limite máximo: ${limits.maxTimeSlots}`,
      });
      return;
    }

    const lastSlot = timeSlots[timeSlots.length - 1];
    const lastEndTime = lastSlot ? lastSlot.endTime : '11:30';
    
    // Calculate next start time (add 10 minutes break)
    const [hour, min] = lastEndTime.split(':').map(Number);
    const nextStartMinutes = hour * 60 + min + 10;
    const nextStartHour = Math.floor(nextStartMinutes / 60);
    const nextStartMin = nextStartMinutes % 60;
    
    const nextStartTime = `${nextStartHour.toString().padStart(2, '0')}:${nextStartMin.toString().padStart(2, '0')}`;
    const nextEndTime = `${(nextStartHour + 1).toString().padStart(2, '0')}:${nextStartMin.toString().padStart(2, '0')}`;
    
    const newSlot = createTimeSlot(nextStartTime, nextEndTime);
    setTimeSlots(prev => [...prev, newSlot]);
  };

  const removeTimeSlot = (id: string) => {
    setTimeSlots(prev => prev.filter(slot => slot.id !== id));
  };

  const updateTimeSlot = (id: string, startTime: string, endTime: string) => {
    setTimeSlots(prev => prev.map(slot => 
      slot.id === id 
        ? { ...slot, startTime, endTime, duration: calculateDuration(startTime, endTime) }
        : slot
    ));
  };

  const resetToDefault = () => {
    setTimeSlots(defaultTimeSlots);
  };

  return (
    <ScheduleConfigContext.Provider value={{
      timeSlots,
      updateTimeSlots,
      addTimeSlot,
      removeTimeSlot,
      updateTimeSlot,
      resetToDefault
    }}>
      {children}
    </ScheduleConfigContext.Provider>
  );
};
