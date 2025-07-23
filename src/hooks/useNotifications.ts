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
    // Check if notifications are supported
    setIsSupported('Notification' in window);
    setPermission(Notification.permission);
    
    loadNotificationSettings();
  }, [user]);

  // Separate effect for listeners that should recreate when settings change
  useEffect(() => {
    if (!user || loading) return;
    
    console.log('🔄 Setting up notification listeners with settings:', settings);
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
        console.error('Error loading notification settings:', error);
        return;
      }

      if (data) {
        console.log('Loaded notification settings from DB:', data);
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
        console.log('No notification settings found in DB, creating defaults');
        // Criar configurações padrão se não existirem
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
      console.error('Error in loadNotificationSettings:', error);
    } finally {
      setLoading(false);
    }
  };

  const shouldShowNotification = (type: keyof NotificationSettings): boolean => {
    return settings[type];
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;
    
    console.log('Updating notification settings:', newSettings);
    const updatedSettings = { ...settings, ...newSettings };
    console.log('Final settings to save:', updatedSettings);
    
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
        console.error('Error updating notification settings:', error);
        // Reverter mudança local se falhar
        setSettings(settings);
        toast.error('Erro ao salvar configurações');
      } else {
        console.log('Notification settings saved successfully');
        toast.success('Configurações salvas com sucesso');
      }
    } catch (error) {
      console.error('Error in updateSettings:', error);
      // Reverter mudança local se falhar
      setSettings(settings);
      toast.error('Erro ao salvar configurações');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('❌ Notifications not supported on this device/browser');
      return false;
    }

    try {
      console.log('🔔 Requesting notification permission...');
      const newPermission = await Notification.requestPermission();
      console.log('📱 Permission result:', newPermission);
      setPermission(newPermission);
      
      if (newPermission === 'granted') {
        // Test notification to ensure it works
        showNotification('✅ Notificações Ativadas!', {
          body: 'Você agora receberá notificações do app.',
          tag: 'permission-granted'
        });
      }
      
      return newPermission === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  };

  const showNotification = (title: string, options: NotificationOptions = {}) => {
    console.log('🔔 showNotification called:', { title, isSupported, permission });
    
    if (!isSupported) {
      console.log('❌ Notifications not supported');
      return;
    }
    
    if (permission !== 'granted') {
      console.log('❌ Permission not granted:', permission);
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false, // Don't require user interaction on mobile
        silent: false,
        ...options
      });

      console.log('✅ Notification created successfully:', notification);

      // Auto close after 4 seconds on mobile, 5 seconds on desktop
      const isMobile = window.innerWidth < 768;
      const autoCloseTime = isMobile ? 4000 : 5000;
      setTimeout(() => {
        try {
          notification.close();
        } catch (e) {
          console.log('Notification already closed');
        }
      }, autoCloseTime);

      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      return null;
    }
  };

  const setupNotificationListeners = () => {
    if (!user) return;

    // Listen for class absence notifications
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
          // Use current settings state, not closure
          console.log('🔔 Notification received:', payload);
          console.log('📱 Current notification settings:', settings);
          
          // Check if user should receive this notification
          if (settings.absences && permission === 'granted' && isSupported) {
            const data = payload.new as any;
            console.log('✅ Showing notification for absence');
            showNotification('Nova Falta Registrada', {
              body: `Um colega registrou falta para ${data.subjects.join(', ')}`,
              tag: 'absence'
            });
          } else {
            console.log('❌ Not showing notification:', { 
              settingsAbsences: settings.absences, 
              permission, 
              isSupported 
            });
          }
        }
      )
      .subscribe();

    // Listen for absence notification content updates
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
          console.log('🔔 Content update received:', payload);
          
          if (settings.absences && permission === 'granted' && isSupported) {
            const data = payload.new as any;
            if (data.content_text || data.content_photos?.length > 0) {
              console.log('✅ Showing notification for content update');
              showNotification('Conteúdo da Aula Disponível', {
                body: `Conteúdo foi compartilhado para ${data.subjects.join(', ')}`,
                tag: 'content'
              });
            }
          } else {
            console.log('❌ Not showing content notification:', { 
              settingsAbsences: settings.absences, 
              permission, 
              isSupported 
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up notification listeners');
      supabase.removeChannel(abenceChannel);
      supabase.removeChannel(contentChannel);
    };
  };

  const checkUpcomingClasses = async () => {
    if (!settings.reminders || !user) return;

    try {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Get user's schedule for today
      const { data: scheduleSlots, error: scheduleError } = await supabase
        .from('schedule_slots')
        .select(`
          *,
          subjects:subject_id (name, color)
        `)
        .eq('day', currentDay);

      if (scheduleError) throw scheduleError;

      // Get user's time slots
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

            // Notify 1 hour (60 minutes) before class
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
      console.error('Error checking upcoming classes:', error);
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
      console.error('Error checking upcoming notes:', error);
    }
  };

  // Check for upcoming events every minute
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      checkUpcomingClasses();
      checkUpcomingNotes();
    }, 60000); // Check every minute

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