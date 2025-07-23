import { useSystemSettings } from './useSystemSettings';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSundayConfig = () => {
  const { getSetting, refreshSettings } = useSystemSettings();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Forçar atualização quando configurações mudam
  useEffect(() => {
    const channel = supabase
      .channel('sunday_config_settings')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'system_settings',
          filter: 'setting_key=eq.include_sunday_schedule'
        },
        () => {
          refreshSettings();
          setForceUpdate(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshSettings]);

  const isSundayEnabled = () => {
    const setting = getSetting('include_sunday_schedule');
    return setting?.enabled && setting?.value;
  };

  return {
    isSundayEnabled
  };
};

export default useSundayConfig;