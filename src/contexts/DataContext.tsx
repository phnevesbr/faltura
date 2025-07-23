import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useGamification } from './GamificationContext';
import { supabase } from '../integrations/supabase/client';
import { filterValidSubjects } from '../utils/subjectHelpers';

export interface Subject {
  id: string;
  name: string;
  weeklyHours: number;
  color: string;
  maxAbsences: number;
  currentAbsences: number;
}

export interface ScheduleSlot {
  id: string;
  subjectId: string;
  day: number; // 0 = Monday, 5 = Saturday
  timeSlot: number; // 0-N (dynamic based on configured time slots)
}

export interface Absence {
  id: string;
  date: string;
  subjects: { subjectId: string; classCount: number }[];
}

interface DataContextType {
  subjects: Subject[];
  schedule: ScheduleSlot[];
  absences: Absence[];
  addSubject: (subject: Omit<Subject, 'id' | 'currentAbsences'>) => Promise<Subject | void>;
  updateSubject: (id: string, updates: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  addScheduleSlot: (slot: Omit<ScheduleSlot, 'id'>, skipXpReward?: boolean) => Promise<boolean>;
  removeScheduleSlot: (id: string) => Promise<void>;
  addAbsence: (date: string, availableTimeSlots?: number, specificSubjects?: string[]) => Promise<void>;
  removeAbsence: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

const subjectColors = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444',
  '#EC4899', '#8B5A2B', '#6366F1', '#84CC16', '#F97316'
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { awardScheduleSlotXP, awardGradeImportXP } = useGamification();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadUserData();
      setupRealTimeSubscriptions();
    } else {
      setSubjects([]);
      setSchedule([]);
      setAbsences([]);
    }
  }, [user]);

  // Setup real-time subscriptions
  const setupRealTimeSubscriptions = () => {
    if (!user) return;

    // Subscribe to absences changes
    const absencesChannel = supabase
      .channel('absences-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'absences',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadUserData(); // Reload data when absences change
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'absence_subjects'
        },
        () => {
          loadUserData(); // Reload data when absence subjects change
        }
      )
      .subscribe();

    // Subscribe to subjects changes
    const subjectsChannel = supabase
      .channel('subjects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subjects',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadUserData();
        }
      )
      .subscribe();

    // Cleanup on unmount
    return () => {
      supabase.removeChannel(absencesChannel);
      supabase.removeChannel(subjectsChannel);
    };
  };

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id);

      if (subjectsData) {
        const formattedSubjects = subjectsData
          .map(s => ({
            id: s.id,
            name: s.name || 'Matéria sem nome',
            weeklyHours: s.weekly_hours || 2,
            color: s.color || '#3B82F6',
            maxAbsences: s.max_absences || 10,
            currentAbsences: s.current_absences || 0
          }));
        
        // Filter out invalid subjects and set
        setSubjects(filterValidSubjects(formattedSubjects));
      }

      // Load schedule
      const { data: scheduleData } = await supabase
        .from('schedule_slots')
        .select('*')
        .eq('user_id', user.id);

      if (scheduleData) {
        const formattedSchedule = scheduleData.map(s => ({
          id: s.id,
          subjectId: s.subject_id,
          day: s.day,
          timeSlot: s.time_slot
        }));
        setSchedule(formattedSchedule);
      }

      // Load absences with subjects
      const { data: absencesData, error: absencesError } = await supabase
        .from('absences')
        .select(`
          *,
          absence_subjects (
            subject_id,
            class_count
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (absencesError) {
        console.error('Erro ao carregar faltas:', absencesError);
      }

      if (absencesData) {
        const formattedAbsences = absencesData.map(a => {
          const subjects = (a.absence_subjects || []).map((as: any) => ({
            subjectId: as.subject_id,
            classCount: as.class_count
          }));
          
          return {
            id: a.id,
            date: a.date,
            subjects
          };
        });
        setAbsences(formattedAbsences);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const addSubject = async (subjectData: Omit<Subject, 'id' | 'currentAbsences'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          name: subjectData.name,
          weekly_hours: subjectData.weeklyHours,
          color: subjectData.color || subjectColors[subjects.length % subjectColors.length],
          max_absences: subjectData.maxAbsences,
          current_absences: 0
        })
        .select()
        .single();

      if (error) throw error;

      const newSubject: Subject = {
        id: data.id,
        name: data.name,
        weeklyHours: data.weekly_hours,
        color: data.color,
        maxAbsences: data.max_absences,
        currentAbsences: data.current_absences
      };

      setSubjects(prev => [...prev, newSubject]);
      return newSubject;
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  const updateSubject = async (id: string, updates: Partial<Subject>) => {
    if (!user) return;

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.weeklyHours !== undefined) dbUpdates.weekly_hours = updates.weeklyHours;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.maxAbsences !== undefined) dbUpdates.max_absences = updates.maxAbsences;
      if (updates.currentAbsences !== undefined) dbUpdates.current_absences = updates.currentAbsences;

      const { error } = await supabase
        .from('subjects')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSubjects(prev => prev.map(subject => {
        if (subject.id === id) {
          const updatedSubject = { ...subject, ...updates };
          
          // Track color changes for achievements
          if (updates.color && updates.color !== subject.color) {
            window.dispatchEvent(new CustomEvent('colorChanged', { 
              detail: { subjectId: id, oldColor: subject.color, color: updates.color } 
            }));
          }
          
          return updatedSubject;
        }
        return subject;
      }));
    } catch (error) {
      console.error('Error updating subject:', error);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSubjects(prev => prev.filter(subject => subject.id !== id));
      setSchedule(prev => prev.filter(slot => slot.subjectId !== id));
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };

  const addScheduleSlot = async (slot: Omit<ScheduleSlot, 'id'>, skipXpReward: boolean = false): Promise<boolean> => {
    if (!user) return false;

    // Check if slot is already occupied
    const isOccupied = schedule.some(s => s.day === slot.day && s.timeSlot === slot.timeSlot);
    if (isOccupied) return false;

    // Get subject info to check weekly hours limit
    const subject = subjects.find(s => s.id === slot.subjectId);
    if (!subject) return false;

    // Count how many classes this subject already has across all days
    const totalSubjectClasses = schedule.filter(s => s.subjectId === slot.subjectId).length;
    
    // Check if subject has reached its weekly hours limit
    if (totalSubjectClasses >= subject.weeklyHours) return false;

    // Check if subject already has 2 classes on this day (for Monday to Friday only)
    const subjectSlotsOnDay = schedule.filter(s => s.day === slot.day && s.subjectId === slot.subjectId);
    if (slot.day < 5 && subjectSlotsOnDay.length >= 2) return false; // Apply 2-class limit only to weekdays (0-4)

    try {
      const { data, error } = await supabase
        .from('schedule_slots')
        .insert({
          user_id: user.id,
          subject_id: slot.subjectId,
          day: slot.day,
          time_slot: slot.timeSlot
        })
        .select()
        .single();

      if (error) throw error;

      const newSlot: ScheduleSlot = {
        id: data.id,
        subjectId: data.subject_id,
        day: data.day,
        timeSlot: data.time_slot
      };

      setSchedule(prev => [...prev, newSlot]);
      
      // Only award XP if not skipping (i.e., not during bulk import)
      if (!skipXpReward) {
        await awardScheduleSlotXP();
      }
      
      return true;
    } catch (error) {
      console.error('Error adding schedule slot:', error);
      return false;
    }
  };

  const removeScheduleSlot = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('schedule_slots')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setSchedule(prev => prev.filter(slot => slot.id !== id));
    } catch (error) {
      console.error('Error removing schedule slot:', error);
    }
  };

  const addAbsence = async (date: string, availableTimeSlots: number = 10, specificSubjects?: string[]) => {
    if (!user) return;
    
    const dateObj = new Date(date + 'T00:00:00');
    const dayOfWeek = dateObj.getDay();
    
    let adjustedDay: number;
    if (dayOfWeek === 0) {
      adjustedDay = 6;
    } else if (dayOfWeek === 6) {
      adjustedDay = 5;
    } else {
      adjustedDay = dayOfWeek - 1;
    }
    
    // Verificar se o sábado está habilitado
    const showSaturday = localStorage.getItem('faltula_show_saturday');
    const isSaturdayEnabled = showSaturday ? JSON.parse(showSaturday) : false;
    
    // Se for sábado (adjustedDay === 5) e não estiver habilitado, retornar
    if (adjustedDay >= 5 && !(adjustedDay === 5 && isSaturdayEnabled)) return;
    
    let daySlots = schedule.filter(slot => 
      slot.day === adjustedDay && slot.timeSlot < availableTimeSlots
    );
    
    if (specificSubjects && specificSubjects.length > 0) {
      daySlots = daySlots.filter(slot => specificSubjects.includes(slot.subjectId));
    }
    
    if (daySlots.length === 0) return;
    
    const subjectClassCount = new Map<string, number>();
    daySlots.forEach(slot => {
      const currentCount = subjectClassCount.get(slot.subjectId) || 0;
      subjectClassCount.set(slot.subjectId, currentCount + 1);
    });
    
    const subjectsWithCount = Array.from(subjectClassCount.entries()).map(([subjectId, classCount]) => ({
      subjectId,
      classCount
    }));

    try {
      // Create absence
      const { data: absenceData, error: absenceError } = await supabase
        .from('absences')
        .insert({
          user_id: user.id,
          date
        })
        .select()
        .single();

      if (absenceError) throw absenceError;

      // Create absence subjects
      const absenceSubjects = subjectsWithCount.map(s => ({
        absence_id: absenceData.id,
        subject_id: s.subjectId,
        class_count: s.classCount
      }));

      const { data: insertedSubjects, error: subjectsError } = await supabase
        .from('absence_subjects')
        .insert(absenceSubjects)
        .select();

      if (subjectsError) {
        console.error('Erro ao inserir matérias da falta:', subjectsError);
        console.error('Dados que tentamos inserir:', absenceSubjects);
        throw subjectsError;
      }

      const newAbsence: Absence = {
        id: absenceData.id,
        date,
        subjects: subjectsWithCount
      };
      
      setAbsences(prev => [...prev, newAbsence]);
      
      // Update subject absence counts
      for (const subjectData of subjectsWithCount) {
        const subject = subjects.find(s => s.id === subjectData.subjectId);
        if (subject) {
          await updateSubject(subject.id, {
            currentAbsences: subject.currentAbsences + subjectData.classCount
          });
        }
      }

    } catch (error) {
      console.error('Error adding absence:', error);
    }
  };

  const removeAbsence = async (id: string) => {
    if (!user) return;

    const absence = absences.find(a => a.id === id);
    if (!absence) return;

    try {
      const { error } = await supabase
        .from('absences')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setAbsences(prev => prev.filter(a => a.id !== id));
      
      // Update subject absence counts
      for (const subjectData of absence.subjects) {
        const subject = subjects.find(s => s.id === subjectData.subjectId);
        if (subject) {
          await updateSubject(subject.id, {
            currentAbsences: Math.max(0, subject.currentAbsences - subjectData.classCount)
          });
        }
      }
    } catch (error) {
      console.error('Error removing absence:', error);
    }
  };

  return (
    <DataContext.Provider value={{
      subjects,
      schedule,
      absences,
      addSubject,
      updateSubject,
      deleteSubject,
      addScheduleSlot,
      removeScheduleSlot,
      addAbsence,
      removeAbsence
    }}>
      {children}
    </DataContext.Provider>
  );
};