/**
 * Faltula - Sistema de Gestão Acadêmica
 * Desenvolvido Por PHNevs
 * Instagram: https://www.instagram.com/phnevs/
 * 
 * Hook para gerenciamento de verificação de email.
 * Controla quando a verificação de email é obrigatória
 * e gerencia o bloqueio de usuários não verificados.
 */

import { useSystemSettings } from './useSystemSettings';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';

export const useEmailVerification = () => {
  const { getSetting, refreshSettings } = useSystemSettings();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Forçar atualização quando configurações mudam
  useEffect(() => {
    const channel = supabase
      .channel('email_verification_settings')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'system_settings',
          filter: 'setting_key=eq.email_verification_required'
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

  const isEmailVerificationRequired = () => {
    const setting = getSetting('email_verification_required');
    return setting?.enabled && setting?.value;
  };

  const configureSupabaseAuth = async () => {
    const isRequired = isEmailVerificationRequired();
    
    try {
      // This would typically be done at the Supabase project level
      // For now, we'll handle it in the application logic
      // Verificação de email configurada
      
      // You could implement additional logic here to enforce email verification
      return isRequired;
    } catch (error) {
      // Erro ao configurar autenticação
      return false;
    }
  };

  const shouldBlockUnverifiedUsers = (user: any) => {
    const setting = getSetting('email_verification_required');
    
    // Se a configuração não está ativa ou não está definida, não bloquear
    if (!setting?.enabled || !setting?.value) {
      return false;
    }
    
    return user?.email_confirmed_at === null;
  };

  return {
    isEmailVerificationRequired,
    configureSupabaseAuth,
    shouldBlockUnverifiedUsers
  };
};

export default useEmailVerification;