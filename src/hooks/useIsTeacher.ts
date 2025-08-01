import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useIsTeacher = () => {
  const { user } = useAuth();
  const [isTeacher, setIsTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!user) {
        setIsTeacher(false);
        setLoading(false);
        return;
      }

      try {
        // Verificar se o usuário tem o papel 'moderator' (que representa professor)
        const { data, error } = await supabase
          .from('admin_roles')
          .select('*')
          .eq('user_id', user.id)
          .eq('role', 'moderator')
          .is('revoked_at', null)
          .maybeSingle();
        
        if (error) {
          console.error('Error checking teacher status:', error);
          setIsTeacher(false);
        } else {
          setIsTeacher(!!data);
        }
      } catch (error) {
        console.error('Error checking teacher status:', error);
        setIsTeacher(false);
      } finally {
        setLoading(false);
      }
    };

    checkTeacherStatus();
  }, [user]);

  return { isTeacher, loading };
};