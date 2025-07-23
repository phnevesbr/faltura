import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDarkMode = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const toggleDarkMode = async (value?: boolean) => {
    const newDarkMode = value !== undefined ? value : !isDarkMode;
    
    // Apply to DOM immediately
    const root = document.documentElement;
    if (newDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    setIsDarkMode(newDarkMode);
    
    // Save to database/localStorage
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: existingPrefs } = await supabase
          .from('user_preferences')
          .select('id, theme_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingPrefs) {
          const { error: updateError } = await supabase
            .from('user_preferences')
            .update({ 
              theme_name: existingPrefs.theme_name || 'default'
            })
            .eq('id', existingPrefs.id);
        } else {
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({ 
              user_id: user.id, 
              theme_name: 'default'
            });
        }
      }
      
      // Also save to localStorage as fallback
      localStorage.setItem('faltula-dark-mode', newDarkMode.toString());
    } catch (error) {
      console.error('Erro ao salvar modo dark:', error);
      localStorage.setItem('faltula-dark-mode', newDarkMode.toString());
    }
  };

  const initializeDarkMode = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let shouldUseDarkMode = false;
      
      if (user) {
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // Check localStorage for dark mode preference since we're not storing it in DB yet
        const savedDarkMode = localStorage.getItem('faltula-dark-mode');
        shouldUseDarkMode = savedDarkMode === 'true';
      } else {
        // Fallback to localStorage
        const saved = localStorage.getItem('faltula-dark-mode');
        shouldUseDarkMode = saved === 'true';
      }
      
      // Apply to DOM
      const root = document.documentElement;
      if (shouldUseDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      setIsDarkMode(shouldUseDarkMode);
    } catch (error) {
      console.error('Erro ao carregar modo dark:', error);
      const saved = localStorage.getItem('faltula-dark-mode');
      const shouldUseDarkMode = saved === 'true';
      
      const root = document.documentElement;
      if (shouldUseDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      
      setIsDarkMode(shouldUseDarkMode);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    initializeDarkMode();
  }, []);

  return {
    isDarkMode,
    toggleDarkMode,
    isLoading
  };
};