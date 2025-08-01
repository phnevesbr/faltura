/**
 * Faltula - Sistema de Gestão Acadêmica
 * Desenvolvido Por PHNevs
 * Instagram: https://www.instagram.com/phnevs/
 * 
 * Hook responsável pelo sistema de notificações do aplicativo.
 * Gerencia configurações de notificação, permissões do navegador
 * e envio de notificações push para diferentes eventos do sistema.
 */

import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

interface NotificationSettings {
  absences: boolean;
  grade: boolean;
  achievements: boolean;
  subjects: boolean;
  notes: boolean;
  profile: boolean;
  reminders: boolean;
  xp_rewards: boolean;
}

interface ScheduleSlot {
  id: string;
  day: number;
  time_slot: number;
  subject_id: string;
  subjects: {
    name: string;
    color: string;
  };
}

interface Note {
  id: string;
  title: string;
  date: string;
  type: string;
  priority: string;
  completed: boolean;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  slot_order: number;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings>({
    absences: true,
    grade: true,
    achievements: true,
    subjects: true,
    notes: true,
    profile: true,
    reminders: false,
    xp_rewards: true
  });
  const [loading, setLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Verificar se notificações são suportadas pelo navegador
    setIsSupported('Notification' in window);
    setPermission(Notification.permission);
    
    loadNotificationSettings();
  }, [user]);

  // Efeito separado para listeners que devem ser recriados quando configurações mudam
  useEffect(() => {
    if (!user || loading) return;
    
    // Configurando listeners de notificação com as configurações atuais
    const cleanup = setupNotificationListeners();
    return cleanup;
  }, [user, settings, permission, isSupported, loading]);

  const loadNotificationSettings = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        // Erro ao carregar configurações de notificação
        return;
      }

      if (data) {
        // Configurações de notificação carregadas do banco de dados
        setSettings({
          absences: data.absences,
          grade: data.grade,
          achievements: data.achievements,
          subjects: data.subjects,
          notes: data.notes,
          profile: data.profile,
          reminders: data.reminders || false,
          xp_rewards: data.xp_rewards !== undefined ? data.xp_rewards : true
        });
      } else {
        // Nenhuma configuração encontrada, criando configurações padrão
        const defaultSettings = {
          absences: true,
          grade: true,
          achievements: true,
          subjects: true,
          notes: true,
          profile: true,
          reminders: false,
          xp_rewards: true
        };
        
        const { error: createError } = await supabase
          .from('user_notifications')
          .insert({
            user_id: user.id,
            ...defaultSettings
          });
          
        if (!createError) {
          setSettings(defaultSettings);
        }
      }
    } catch (error) {
      // Erro interno no carregamento das configurações
    } finally {
      setLoading(false);
    }
  };

  const shouldShowNotification = (type: keyof NotificationSettings): boolean => {
    return settings[type];
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;
    
    // Atualizando configurações de notificação
    const updatedSettings = { ...settings, ...newSettings };
    
    // Atualizar estado local imediatamente para feedback visual rápido
    setSettings(updatedSettings);
    
    // Persistir no banco de dados
    try {
      const { error } = await supabase
        .from('user_notifications')
        .upsert({
          user_id: user.id,
          ...updatedSettings
        }, {
          onConflict: 'user_id'
        });
        
      if (error) {
        // Reverter mudança local se falhar
        setSettings(settings);
        toast.error('Erro ao salvar configurações');
      } else {
        toast.success('Configurações salvas com sucesso');
      }
    } catch (error) {
      // Reverter mudança local se falhar
      setSettings(settings);
      toast.error('Erro ao salvar configurações');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    try {
      // Solicitando permissão para notificações
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        // Notificação de teste para garantir que funciona
        showNotification('✅ Notificações Ativadas!', {
          body: 'Você agora receberá notificações do app.',
          tag: 'permission-granted'
        });
      }
      
      return newPermission === 'granted';
    } catch (error) {
      return false;
    }
  };

  const showNotification = (title: string, options: NotificationOptions = {}) => {
    if (!isSupported) {
      return;
    }
    
    if (permission !== 'granted') {
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false, // Não exigir interação do usuário no mobile
        silent: false,
        ...options
      });

      // Fechar automaticamente após 4 segundos no mobile, 5 segundos no desktop
      const isMobile = window.innerWidth < 768;
      const autoCloseTime = isMobile ? 4000 : 5000;
      setTimeout(() => {
        try {
          notification.close();
        } catch (e) {
          // Notificação já foi fechada
        }
      }, autoCloseTime);

      return notification;
    } catch (error) {
      return null;
    }
  };

  const setupNotificationListeners = () => {
    if (!user) return;

    // Escutar notificações de ausência de turma
    const abenceChannel = supabase
      .channel('absence-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'absence_notifications'
        },
        (payload) => {
          // Verificar se usuário deve receber esta notificação
          if (settings.absences && permission === 'granted' && isSupported) {
            const data = payload.new as any;
            showNotification('Nova Falta Registrada', {
              body: `Um colega registrou falta para ${data.subjects.join(', ')}`,
              tag: 'absence'
            });
          }
        }
      )
      .subscribe();

    // Escutar atualizações de conteúdo de notificações de ausência
    const contentChannel = supabase
      .channel('absence-content-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'absence_notifications',
          filter: 'content_sent=eq.true'
        },
        (payload) => {
          if (settings.absences && permission === 'granted' && isSupported) {
            const data = payload.new as any;
            if (data.content_text || data.content_photos?.length > 0) {
              showNotification('Conteúdo da Aula Disponível', {
                body: `Conteúdo foi compartilhado para ${data.subjects.join(', ')}`,
                tag: 'content'
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      // Limpando listeners de notificação
      supabase.removeChannel(abenceChannel);
      supabase.removeChannel(contentChannel);
    };
  };

  const checkUpcomingClasses = async () => {
    if (!settings.reminders || !user) return;

    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Domingo, 1 = Segunda, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Obter horário do usuário para hoje
      const { data: scheduleSlots, error: scheduleError } = await supabase
        .from('schedule_slots')
        .select(`
          *,
          subjects:subject_id (name, color)
        `)
        .eq('day', currentDay);

      if (scheduleError) throw scheduleError;

      // Obter slots de tempo do usuário
      const { data: timeSlots, error: timeSlotsError } = await supabase
        .from('user_time_slots')
        .select('*')
        .order('slot_order');

      if (timeSlotsError) throw timeSlotsError;

      if (scheduleSlots && timeSlots) {
        scheduleSlots.forEach((slot: ScheduleSlot) => {
          const timeSlot = timeSlots.find((ts: TimeSlot) => ts.slot_order === slot.time_slot);
          
          if (timeSlot) {
            const [hours, minutes] = timeSlot.start_time.split(':').map(Number);
            const classTime = hours * 60 + minutes;
            const timeUntilClass = classTime - currentTime;

            // Notificar 1 hora (60 minutos) antes da aula
            if (timeUntilClass === 60) {
              showNotification('Próxima Aula', {
                body: `${slot.subjects.name} começa em 1 hora`,
                tag: 'upcoming-class'
              });
            }
          }
        });
      }
    } catch (error) {
      // Erro ao verificar próximas aulas
    }
  };

  const checkUpcomingNotes = async () => {
    if (!settings.notes || !user) return;

    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const { data: notes, error } = await supabase
        .from('notes')
        .select('*')
        .eq('date', tomorrowStr)
        .eq('completed', false)
        .in('type', ['assignment', 'exam', 'project']);

      if (error) throw error;

      if (notes && notes.length > 0) {
        notes.forEach((note: Note) => {
          let title = 'Lembrete';
          let emoji = '📝';
          
          if (note.type === 'exam') {
            title = 'Prova Amanhã';
            emoji = '📚';
          } else if (note.type === 'assignment') {
            title = 'Entrega Amanhã';
            emoji = '📋';
          } else if (note.type === 'project') {
            title = 'Projeto Amanhã';
            emoji = '🚀';
          }

          showNotification(title, {
            body: `${emoji} ${note.title}`,
            tag: `note-${note.id}`
          });
        });
      }
    } catch (error) {
      // Erro ao verificar próximas anotações
    }
  };

  // Verificar eventos próximos a cada minuto
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkUpcomingClasses();
      checkUpcomingNotes();
    }, 60000); // Verificar a cada minuto

    return () => clearInterval(interval);
  }, [settings, user]);

  return {
    settings,
    loading,
    isSupported,
    permission,
    shouldShowNotification,
    requestPermission,
    showNotification,
    updateSettings,
    refreshSettings: loadNotificationSettings,
    checkUpcomingClasses,
    checkUpcomingNotes
  };
};