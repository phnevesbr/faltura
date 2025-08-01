import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [shouldShowOnboarding, setShouldShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Buscar status do onboarding no Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, onboarding_skipped')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao verificar status do onboarding:', error);
          setShouldShowOnboarding(false);
          return;
        }

        // Se nunca completou nem pulou, deve mostrar o onboarding
        if (!data?.onboarding_completed && !data?.onboarding_skipped) {
          setShouldShowOnboarding(true);
        } else {
          setShouldShowOnboarding(false);
        }
      } catch (error) {
        console.error('Erro ao verificar status do onboarding:', error);
        setShouldShowOnboarding(false);
      } finally {
        setIsLoading(false);
      }
    };

    // Pequeno delay para evitar flash
    const timer = setTimeout(checkOnboardingStatus, 100);
    
    return () => clearTimeout(timer);
  }, [user]);

  const markOnboardingComplete = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao marcar onboarding como completo:', error);
        return;
      }

      setShouldShowOnboarding(false);
    } catch (error) {
      console.error('Erro ao marcar onboarding como completo:', error);
    }
  };

  const markOnboardingSkipped = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_skipped: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao marcar onboarding como pulado:', error);
        return;
      }

      setShouldShowOnboarding(false);
    } catch (error) {
      console.error('Erro ao marcar onboarding como pulado:', error);
    }
  };

  const resetOnboarding = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: null,
          onboarding_skipped: null,
          onboarding_completed_at: null
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Erro ao resetar onboarding:', error);
        return;
      }

      setShouldShowOnboarding(true);
    } catch (error) {
      console.error('Erro ao resetar onboarding:', error);
    }
  };

  return {
    shouldShowOnboarding,
    isLoading,
    markOnboardingComplete,
    markOnboardingSkipped,
    resetOnboarding
  };
};