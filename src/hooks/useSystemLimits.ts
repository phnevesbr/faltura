import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemLimits {
  maxSubjects: number;
  maxTasks: number;
  maxClassMemberships: number;
  maxClassLeadership: number;
  maxTimeSlots: number;
  maxSemesterDuration: number;
}

const defaultLimits: SystemLimits = {
  maxSubjects: 10,
  maxTasks: 50,
  maxClassMemberships: 5,
  maxClassLeadership: 2,
  maxTimeSlots: 12,
  maxSemesterDuration: 6
};

export const useSystemLimits = () => {
  const [limits, setLimits] = useState<SystemLimits>(defaultLimits);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLimits();
  }, []);

  const fetchLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'max_subjects_limit',
          'max_tasks_limit', 
          'max_class_memberships',
          'max_class_leadership',
          'max_time_slots',
          'max_semester_duration'
        ]);

      if (error) {
        console.error('Error fetching system limits:', error);
        return;
      }

      const newLimits = { ...defaultLimits };
      
      data?.forEach(setting => {
        const value = (setting.setting_value as any)?.value;
        if (typeof value === 'number') {
          switch (setting.setting_key) {
            case 'max_subjects_limit':
              newLimits.maxSubjects = value;
              break;
            case 'max_tasks_limit':
              newLimits.maxTasks = value;
              break;
            case 'max_class_memberships':
              newLimits.maxClassMemberships = value;
              break;
            case 'max_class_leadership':
              newLimits.maxClassLeadership = value;
              break;
            case 'max_time_slots':
              newLimits.maxTimeSlots = value;
              break;
            case 'max_semester_duration':
              newLimits.maxSemesterDuration = value;
              break;
          }
        }
      });

      setLimits(newLimits);
    } catch (error) {
      console.error('Error fetching limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkSubjectLimit = async (userId: string): Promise<{ canAdd: boolean; currentCount: number; limit: number }> => {
    const { count } = await supabase
      .from('subjects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;
    return {
      canAdd: currentCount < limits.maxSubjects,
      currentCount,
      limit: limits.maxSubjects
    };
  };

  const checkTaskLimit = async (userId: string): Promise<{ canAdd: boolean; currentCount: number; limit: number }> => {
    const { count } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;
    return {
      canAdd: currentCount < limits.maxTasks,
      currentCount,
      limit: limits.maxTasks
    };
  };

  const checkClassMembershipLimit = async (userId: string): Promise<{ canAdd: boolean; currentCount: number; limit: number }> => {
    const { count } = await supabase
      .from('class_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;
    return {
      canAdd: currentCount < limits.maxClassMemberships,
      currentCount,
      limit: limits.maxClassMemberships
    };
  };

  const checkClassLeadershipLimit = async (userId: string): Promise<{ canAdd: boolean; currentCount: number; limit: number }> => {
    const { count } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('leader_id', userId);

    const currentCount = count || 0;
    return {
      canAdd: currentCount < limits.maxClassLeadership,
      currentCount,
      limit: limits.maxClassLeadership
    };
  };

  const checkTimeSlotLimit = async (userId: string): Promise<{ canAdd: boolean; currentCount: number; limit: number }> => {
    const { count } = await supabase
      .from('user_time_slots')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;
    return {
      canAdd: currentCount < limits.maxTimeSlots,
      currentCount,
      limit: limits.maxTimeSlots
    };
  };

  return {
    limits,
    loading,
    checkSubjectLimit,
    checkTaskLimit,
    checkClassMembershipLimit,
    checkClassLeadershipLimit,
    checkTimeSlotLimit,
    refreshLimits: fetchLimits
  };
};