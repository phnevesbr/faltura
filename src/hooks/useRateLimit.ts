import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSystemSettings } from './useSystemSettings';

export const useRateLimit = () => {
  const [checking, setChecking] = useState(false);
  const { getSetting, isFeatureEnabled } = useSystemSettings();

  const checkRateLimit = async (actionType: string, userInfo?: { userId?: string; ipAddress?: string }) => {
    if (!isFeatureEnabled(`rate_limit_${actionType}`)) {
      return true; // Rate limiting disabled for this action
    }

    try {
      setChecking(true);
      
      const { data, error } = await supabase.rpc('check_rate_limit', {
        p_action_type: actionType,
        p_user_id: userInfo?.userId || null,
        p_ip_address: userInfo?.ipAddress || null
      });

      if (error) {
        if (error.message.includes('Rate limit excedido')) {
          toast.error(error.message);
          return false;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error checking rate limit:', error);
      toast.error('Erro ao verificar limite de ações');
      return false;
    } finally {
      setChecking(false);
    }
  };

  const getRateLimitInfo = (actionType: string) => {
    const setting = getSetting(`rate_limit_${actionType}`);
    return {
      enabled: setting?.enabled || false,
      limit: setting?.limit || 0,
      windowMinutes: setting?.window_minutes || 0
    };
  };

  return {
    checkRateLimit,
    getRateLimitInfo,
    checking
  };
};

export default useRateLimit;