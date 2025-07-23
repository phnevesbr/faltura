import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SystemSettings {
  [key: string]: any;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('system_settings_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'system_settings' },
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('setting_key, setting_value');

      if (error) throw error;

      const settingsMap: SystemSettings = {};
      data?.forEach(setting => {
        try {
          settingsMap[setting.setting_key] = typeof setting.setting_value === 'string' 
            ? JSON.parse(setting.setting_value) 
            : setting.setting_value;
        } catch {
          settingsMap[setting.setting_key] = setting.setting_value;
        }
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error loading system settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue?: any) => {
    return settings[key] || defaultValue;
  };

  const isFeatureEnabled = (key: string) => {
    const setting = settings[key];
    return setting?.enabled === true;
  };

  return {
    settings,
    loading,
    getSetting,
    isFeatureEnabled,
    refreshSettings: loadSettings
  };
};

export default useSystemSettings;