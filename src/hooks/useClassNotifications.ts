import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export const useClassNotifications = () => {
  const [classNotifications, setClassNotifications] = useState(0);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // Primeiro buscar as turmas do usuário
      const { data: userClasses, error: classError } = await supabase
        .from('class_members')
        .select('class_id')
        .eq('user_id', user.id);

      if (classError) {
        console.error('Erro ao buscar turmas:', classError);
        return;
      }

      const classIds = userClasses?.map(c => c.class_id) || [];

      if (classIds.length === 0) {
        setClassNotifications(0);
        return;
      }

      // Buscar notificações de ausência não lidas (sem conteúdo enviado)
      const { data: absenceNotifications, error: absenceError } = await supabase
        .from('absence_notifications')
        .select('id')
        .eq('content_sent', false)
        .in('class_id', classIds);

      if (absenceError) {
        console.error('Erro ao buscar notificações:', absenceError);
        return;
      }

      setClassNotifications(absenceNotifications?.length || 0);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!user) return;

    try {
      // Marcar todas as notificações como lidas (simulado resetando o contador)
      setClassNotifications(0);
    } catch (error) {
      console.error('Erro ao marcar notificações como lidas:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();

      // Configurar real-time para notificações de absence_notifications
      const channel = supabase
        .channel('class-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'absence_notifications'
          },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return {
    classNotifications,
    fetchNotifications,
    markNotificationsAsRead
  };
};