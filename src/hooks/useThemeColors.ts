import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeColors {
  [key: string]: {
    primary: string;
    primaryForeground: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    mutedForeground: string;
    border: string;
    card: string;
    cardForeground: string;
  }
}

const themes: ThemeColors = {
  default: {
    primary: '262.1 83.3% 57.8%',
    primaryForeground: '210 40% 98%',
    secondary: '210 40% 96.1%',
    accent: '210 40% 96.1%',
    background: '0 0% 100%',
    foreground: '222.2 84% 4.9%',
    muted: '210 40% 96.1%',
    mutedForeground: '215.4 16.3% 46.9%',
    border: '214.3 31.8% 91.4%',
    card: '0 0% 100%',
    cardForeground: '222.2 84% 4.9%'
  },
  'Tema Oceano': {
    primary: '200 100% 40%',
    primaryForeground: '210 40% 98%',
    secondary: '200 20% 92%',
    accent: '200 20% 92%',
    background: '195 100% 98%',
    foreground: '200 80% 10%',
    muted: '200 20% 92%',
    mutedForeground: '200 30% 40%',
    border: '200 30% 85%',
    card: '0 0% 100%',
    cardForeground: '200 80% 10%'
  },
  'Tema Floresta': {
    primary: '120 60% 35%',
    primaryForeground: '210 40% 98%',
    secondary: '120 20% 92%',
    accent: '120 20% 92%',
    background: '120 40% 98%',
    foreground: '120 80% 10%',
    muted: '120 20% 92%',
    mutedForeground: '120 30% 40%',
    border: '120 30% 85%',
    card: '0 0% 100%',
    cardForeground: '120 80% 10%'
  },
  'Tema Sunset': {
    primary: '25 95% 55%',
    primaryForeground: '210 40% 98%',
    secondary: '25 20% 92%',
    accent: '25 20% 92%',
    background: '25 60% 98%',
    foreground: '25 80% 10%',
    muted: '25 20% 92%',
    mutedForeground: '25 30% 40%',
    border: '25 30% 85%',
    card: '0 0% 100%',
    cardForeground: '25 80% 10%'
  },
  'Tema Cristal': {
    primary: '185 100% 60%',
    primaryForeground: '0 0% 100%',
    secondary: '185 10% 95%',
    accent: '185 15% 90%',
    background: '185 20% 99%',
    foreground: '185 50% 15%',
    muted: '185 10% 95%',
    mutedForeground: '185 20% 50%',
    border: '185 15% 85%',
    card: '0 0% 100%',
    cardForeground: '185 50% 15%'
  },
  'Tema Neon': {
    primary: '322 100% 54%',
    primaryForeground: '0 0% 100%',
    secondary: '0 0% 96%',
    accent: '180 100% 50%',
    background: '0 0% 100%',
    foreground: '0 0% 5%',
    muted: '0 0% 96%',
    mutedForeground: '0 0% 45%',
    border: '0 0% 90%',
    card: '0 0% 100%',
    cardForeground: '0 0% 5%'
  },
  'Tema Vulcão': {
    primary: '10 100% 55%',
    primaryForeground: '0 0% 100%',
    secondary: '15 40% 90%',
    accent: '20 60% 85%',
    background: '25 20% 98%',
    foreground: '10 70% 20%',
    muted: '15 30% 92%',
    mutedForeground: '10 40% 45%',
    border: '15 30% 80%',
    card: '0 0% 100%',
    cardForeground: '10 70% 20%'
  },
  'Tema Lendário': {
    primary: '45 100% 50%',
    primaryForeground: '0 0% 0%',
    secondary: '45 20% 92%',
    accent: '45 20% 92%',
    background: '45 30% 98%',
    foreground: '45 80% 10%',
    muted: '45 20% 92%',
    mutedForeground: '45 30% 40%',
    border: '45 30% 85%',
    card: '0 0% 100%',
    cardForeground: '45 80% 10%'
  }
};

export const useThemeColors = () => {
  const [currentTheme, setCurrentTheme] = useState<string>('default');
  const [isLoading, setIsLoading] = useState(true);

  const applyTheme = async (themeName: string) => {
    console.log('🎨 Aplicando tema:', themeName);
    
    const root = document.documentElement;
    
    // Remove all theme classes first
    root.className = root.className.replace(/\b(ocean|forest|sunset|crystal|neon|volcano|legendary)\b/g, '');
    console.log('🎨 Classes removidas, className atual:', root.className);
    
    // Apply theme class based on theme name - não aplicar nada para o tema padrão
    if (themeName !== 'default') {
      const themeClassMap: { [key: string]: string } = {
        'Tema Oceano': 'ocean',
        'oceano': 'ocean',
        'Tema Floresta': 'forest',
        'floresta': 'forest',
        'Tema Sunset': 'sunset',
        'sunset': 'sunset',
        'Tema Cristal': 'crystal',
        'cristal': 'crystal',
        'Tema Neon': 'neon',
        'neon': 'neon',
        'Tema Vulcão': 'volcano',
        'vulcao': 'volcano',
        'Tema Lendário': 'legendary',
        'lendario': 'legendary'
      };
      
      const themeClass = themeClassMap[themeName];
      console.log('🎨 Mapeamento do tema:', themeName, '→', themeClass);
      
      if (themeClass) {
        root.classList.add(themeClass);
        console.log('🎨 Classe aplicada:', themeClass, 'className final:', root.className);
      } else {
        console.log('❌ Tema não encontrado no mapeamento:', themeName);
      }
    } else {
      console.log('🎨 Tema padrão selecionado - nenhuma classe aplicada');
    }
    
    setCurrentTheme(themeName);
    
    // Salvar no Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('💾 Salvando tema no Supabase para usuário:', user?.id);
      
      if (user) {
        const { data: existingPrefs, error: selectError } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        console.log('📁 Preferências existentes:', existingPrefs, 'Error:', selectError);

        if (existingPrefs) {
          const { error: updateError } = await supabase
            .from('user_preferences')
            .update({ theme_name: themeName })
            .eq('id', existingPrefs.id);
          console.log('✅ Tema atualizado no Supabase, error:', updateError);
        } else {
          const { error: insertError } = await supabase
            .from('user_preferences')
            .insert({ user_id: user.id, theme_name: themeName });
          console.log('✅ Tema inserido no Supabase, error:', insertError);
        }
      } else {
        console.log('💾 Usuário não logado, salvando no localStorage');
        localStorage.setItem('faltula-theme', themeName);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar tema no Supabase:', error);
      console.log('💾 Usando fallback do localStorage');
      localStorage.setItem('faltula-theme', themeName);
    }
  };

  const getCurrentTheme = () => {
    return currentTheme;
  };

  const initializeTheme = async () => {
    setIsLoading(true);
    console.log('🎨 Inicializando tema...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Usuário:', user ? 'logado' : 'não logado');
      
      if (user) {
        const { data: prefs, error } = await supabase
          .from('user_preferences')
          .select('theme_name')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        console.log('📁 Preferências do Supabase:', prefs, 'Error:', error);
        
        const themeName = prefs?.theme_name || 'default';
        console.log('🎨 Tema selecionado:', themeName);
        
        const root = document.documentElement;
        
        // Apply theme class based on theme name
        root.className = root.className.replace(/\b(ocean|forest|sunset|crystal|neon|volcano|legendary)\b/g, '');
        
        if (themeName !== 'default') {
          const themeClassMap: { [key: string]: string } = {
            'Tema Oceano': 'ocean',
            'oceano': 'ocean',
            'Tema Floresta': 'forest',
            'floresta': 'forest',
            'Tema Sunset': 'sunset',
            'sunset': 'sunset',
            'Tema Cristal': 'crystal',
            'cristal': 'crystal',
            'Tema Neon': 'neon',
            'neon': 'neon',
            'Tema Vulcão': 'volcano',
            'vulcao': 'volcano',
            'Tema Lendário': 'legendary',
            'lendario': 'legendary'
          };
          
          const themeClass = themeClassMap[themeName];
          console.log('🎨 Inicialização - Mapeamento do tema:', themeName, '→', themeClass);
          
          if (themeClass) {
            root.classList.add(themeClass);
            console.log('🎨 Inicialização - Classe aplicada:', themeClass);
          }
        }
        
        setCurrentTheme(themeName);
      } else {
        // Fallback para localStorage se não estiver logado
        const savedTheme = localStorage.getItem('faltula-theme') || 'default';
        console.log('💾 Tema do localStorage:', savedTheme);
        
        const root = document.documentElement;
        
        // Apply theme class based on theme name
        root.className = root.className.replace(/\b(ocean|forest|sunset|crystal|neon|volcano|legendary)\b/g, '');
        
        if (savedTheme !== 'default') {
          const themeClassMap: { [key: string]: string } = {
            'Tema Oceano': 'ocean',
            'oceano': 'ocean',
            'Tema Floresta': 'forest',
            'floresta': 'forest',
            'Tema Sunset': 'sunset',
            'sunset': 'sunset',
            'Tema Cristal': 'crystal',
            'cristal': 'crystal',
            'Tema Neon': 'neon',
            'neon': 'neon',
            'Tema Vulcão': 'volcano',
            'vulcao': 'volcano',
            'Tema Lendário': 'legendary',
            'lendario': 'legendary'
          };
          
          const themeClass = themeClassMap[savedTheme];
          if (themeClass) {
            root.classList.add(themeClass);
          }
        }
        
        setCurrentTheme(savedTheme);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar tema:', error);
      const savedTheme = localStorage.getItem('faltula-theme') || 'default';
      console.log('💾 Usando fallback do localStorage:', savedTheme);
      
      const root = document.documentElement;
      
      // Apply theme class based on theme name
      root.className = root.className.replace(/\b(ocean|forest|sunset|crystal|neon|volcano|legendary)\b/g, '');
      
      if (savedTheme !== 'default') {
        const themeClassMap: { [key: string]: string } = {
          'Tema Oceano': 'ocean',
          'oceano': 'ocean',
          'Tema Floresta': 'forest',
          'floresta': 'forest',
          'Tema Sunset': 'sunset',
          'sunset': 'sunset',
          'Tema Cristal': 'crystal',
          'cristal': 'crystal',
          'Tema Neon': 'neon',
          'neon': 'neon',
          'Tema Vulcão': 'volcano',
          'vulcao': 'volcano',
          'Tema Lendário': 'legendary',
          'lendario': 'legendary'
        };
        
        const themeClass = themeClassMap[savedTheme];
        if (themeClass) {
          root.classList.add(themeClass);
        }
      }
      
      setCurrentTheme(savedTheme);
    }
    setIsLoading(false);
  };

  // Auto-aplicar tema ao carregar
  useEffect(() => {
    initializeTheme();
  }, []);

  return {
    applyTheme,
    getCurrentTheme,
    availableThemes: Object.keys(themes),
    isLoading
  };
};