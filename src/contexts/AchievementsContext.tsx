import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useProfile } from './ProfileContext';
import { useGamification } from './GamificationContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { AchievementEngine, UserActionData } from '../utils/achievementEngine';

// Função para obter data/hora de São Paulo
const getSaoPauloTime = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
};

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'integration' | 'consistency' | 'secret';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: string;
  isUnlocked: boolean;
  isSecret?: boolean;
}

interface AchievementsContextType {
  achievements: Achievement[];
  checkAchievements: () => void;
  getUnlockedCount: () => number;
  getTotalCount: () => number;
  getAchievementsByCategory: (category: string) => Achievement[];
  trackColorChange: (subjectId: string, color?: string) => void;
  trackFileDownload: () => void;
  trackAvatarConfig: () => void;
  trackSectionVisit: (section: string) => void;
  trackFutureAbsence: (absenceDate: string) => void;
  trackDataImport: () => void;
  trackQuickAbsenceRemoval: (absenceId: string) => void;
  trackLogoClicks: () => void;
  trackThemeChange: () => void;
  trackNoteCreated: () => void;
  trackJoinedClass: () => void;
  trackExperienceUpdate: (totalXp: number) => void;
  trackClassMembersUpdate: (memberCount: number) => void;
  trackClassesLedUpdate: (classCount: number) => void;
  resetAchievements: () => void;
}

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (context === undefined) {
    console.error('useAchievements called outside of AchievementsProvider');
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};

const initialAchievements: Achievement[] = [
  // Integration Achievements (9)
  {
    id: 'first_steps',
    name: 'Primeiros Passos',
    description: 'Crie sua primeira matéria',
    icon: '👶',
    category: 'integration',
    rarity: 'common',
    isUnlocked: false
  },
  {
    id: 'schedule_builder',
    name: 'Construtor de Horários',
    description: 'Adicione 10 slots na grade horária',
    icon: '🏗️',
    category: 'integration',
    rarity: 'common',
    isUnlocked: false
  },
  {
    id: 'color_artist',
    name: 'Artista das Cores',
    description: 'Personalize a cor de 3 matérias diferentes',
    icon: '🎨',
    category: 'integration',
    rarity: 'rare',
    isUnlocked: false
  },
  {
    id: 'data_manager',
    name: 'Gerente de Dados',
    description: 'Use a função de importar grade',
    icon: '📊',
    category: 'integration',
    rarity: 'rare',
    isUnlocked: false
  },
  {
    id: 'profile_perfectionist',
    name: 'Perfeccionista do Perfil',
    description: 'Preencha todas as informações do seu perfil acadêmico',
    icon: '✨',
    category: 'integration',
    rarity: 'epic',
    isUnlocked: false
  },
  {
    id: 'complete_explorer',
    name: 'Explorador Completo',
    description: 'Visite todas as seções do app: Grade, Matérias, Faltas, Anotações, Estatísticas, Perfil e Conquistas',
    icon: '🗺️',
    category: 'integration',
    rarity: 'epic',
    isUnlocked: false
  },
  {
    id: 'designer_interface',
    name: 'Designer de Interface',
    description: 'Mude o tema do app 3 vezes',
    icon: '🎨',
    category: 'integration',
    rarity: 'rare',
    isUnlocked: false
  },
  {
    id: 'prolific_writer',
    name: 'Escritor Prolífico',
    description: 'Crie 20 anotações',
    icon: '📝',
    category: 'integration',
    rarity: 'epic',
    isUnlocked: false
  },
  {
    id: 'networking',
    name: 'Networking',
    description: 'Entre em sua primeira turma',
    icon: '🤝',
    category: 'integration',
    rarity: 'common',
    isUnlocked: false
  },

  // Consistency Achievements (9)
  {
    id: 'perfect_week',
    name: 'Semana Perfeita',
    description: 'Complete 5 dias úteis consecutivos sem faltas',
    icon: '⭐',
    category: 'consistency',
    rarity: 'rare',
    isUnlocked: false
  },
  {
    id: 'monthly_champion',
    name: 'Campeão Mensal',
    description: 'Tenha menos de 3 faltas em um mês inteiro',
    icon: '🏆',
    category: 'consistency',
    rarity: 'epic',
    isUnlocked: false
  },
  {
    id: 'attendance_guardian',
    name: 'Guardião da Presença',
    description: 'Mantenha uma matéria com 0 faltas por 30 dias',
    icon: '🛡️',
    category: 'consistency',
    rarity: 'epic',
    isUnlocked: false
  },
  {
    id: 'early_bird',
    name: 'Madrugador',
    description: 'Não falte em 10 aulas que começam antes das 8h',
    icon: '🐦',
    category: 'consistency',
    rarity: 'rare',
    isUnlocked: false
  },
  {
    id: 'friday_warrior',
    name: 'Guerreiro das Sextas',
    description: 'Não falte em nenhuma sexta-feira por 4 semanas',
    icon: '💪',
    category: 'consistency',
    rarity: 'epic',
    isUnlocked: false
  },
  {
    id: 'semester_legend',
    name: 'Lenda do Semestre',
    description: 'Termine com menos de 10% de faltas em todas as matérias',
    icon: '👑',
    category: 'consistency',
    rarity: 'legendary',
    isUnlocked: false
  },
  {
    id: 'data_analyst',
    name: 'Analista de Dados',
    description: 'Acumule 1000 pontos de experiência',
    icon: '📊',
    category: 'consistency',
    rarity: 'rare',
    isUnlocked: false
  },
  {
    id: 'supreme_mind',
    name: 'Mente Suprema',
    description: 'Acumule 40.000 pontos de experiência',
    icon: '🧠',
    category: 'consistency',
    rarity: 'legendary',
    isUnlocked: false
  },
  {
    id: 'academia_king',
    name: 'Rei da Academia',
    description: 'Tenha uma turma com mais de 40 membros ativos',
    icon: '👑',
    category: 'consistency',
    rarity: 'legendary',
    isUnlocked: false
  },

  // Secret Achievements (8)
  {
    id: 'night_owl',
    name: 'Coruja Noturna',
    description: 'Acesse o app entre 2h e 5h da manhã',
    icon: '🦉',
    category: 'secret',
    rarity: 'rare',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'rainbow_collector',
    name: 'Colecionador do Arco-íris',
    description: 'Use 7 cores diferentes nas suas matérias',
    icon: '🌈',
    category: 'secret',
    rarity: 'epic',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'quick_regret',
    name: 'Arrependimento Rápido',
    description: 'Adicione uma falta e a remova em menos de 30 segundos',
    icon: '😅',
    category: 'secret',
    rarity: 'rare',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'schedule_architect',
    name: 'Arquiteto da Grade',
    description: 'Tenha exatamente 25 aulas na sua grade horária',
    icon: '📐',
    category: 'secret',
    rarity: 'epic',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'minimalist',
    name: 'Minimalista',
    description: 'Use apenas 2 cores para todas as suas matérias',
    icon: '🎨',
    category: 'secret',
    rarity: 'rare',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'emperor_of_classes',
    name: 'Imperador das Turmas',
    description: 'Crie e lidere 5 turmas diferentes simultaneamente',
    icon: '🏰',
    category: 'secret',
    rarity: 'legendary',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'color_maestro',
    name: 'Maestro das Cores',
    description: 'Mude o tema do app 50 vezes',
    icon: '🌈',
    category: 'secret',
    rarity: 'legendary',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'christmas_student',
    name: 'Estudante Natalino',
    description: 'Acesse o app no dia 25 de dezembro',
    icon: '🎄',
    category: 'secret',
    rarity: 'rare',
    isUnlocked: false,
    isSecret: true
  },
  {
    id: 'new_year_new_me',
    name: 'Ano Novo, Eu Novo',
    description: 'Acesse o app no dia 1º de janeiro',
    icon: '🎆',
    category: 'secret',
    rarity: 'rare',
    isUnlocked: false,
    isSecret: true
  }
];

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { subjects, schedule, absences } = useData();
  const { profile } = useProfile();
  const { awardAchievementXP } = useGamification();
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [achievementEngine] = useState(() => new AchievementEngine());
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<NodeJS.Timeout | null>(null);
  const [notifiedAchievements, setNotifiedAchievements] = useState<Set<string>>(new Set());
  const [isImportBlocked, setIsImportBlocked] = useState(false);

  // Load achievements from Supabase when user changes
  useEffect(() => {
    if (user) {
      loadAchievementsFromSupabase();
      loadTrackingDataFromSupabase();
      
      // Listen for reset events
      const handleReset = () => {
        resetAchievements();
      };
      
      const handleImportStart = () => {
        setIsImportBlocked(true);
      };
      
      const handleImportEnd = () => {
        setTimeout(() => setIsImportBlocked(false), 3000);
      };
      
      const handleExperienceUpdate = (event: CustomEvent) => {
        if (event.detail?.totalExperience) {
          trackExperienceUpdate(event.detail.totalExperience);
        }
      };
      
      window.addEventListener('resetAchievements', handleReset);
      window.addEventListener('importStart', handleImportStart);
      window.addEventListener('importEnd', handleImportEnd);
      window.addEventListener('experienceUpdated', handleExperienceUpdate as EventListener);
      
      return () => {
        window.removeEventListener('resetAchievements', handleReset);
        window.removeEventListener('importStart', handleImportStart);
        window.removeEventListener('importEnd', handleImportEnd);
        window.removeEventListener('experienceUpdated', handleExperienceUpdate as EventListener);
      };
    } else {
      // Reset achievements when user logs out
      setAchievements(initialAchievements);
      setNotifiedAchievements(new Set());
    }
  }, [user]);

  const loadAchievementsFromSupabase = async () => {
    if (!user) return;

    try {
      const { data: unlockedAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id);

      if (unlockedAchievements) {
        // Criar um set com todos os achievements já desbloqueados para evitar notificações duplicadas
        const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievement_id));
        setNotifiedAchievements(unlockedIds);
        
        setAchievements(prev => prev.map(achievement => {
          const unlockedAchievement = unlockedAchievements.find(
            ua => ua.achievement_id === achievement.id
          );
          
          return {
            ...achievement,
            isUnlocked: !!unlockedAchievement,
            unlockedAt: unlockedAchievement?.unlocked_at
          };
        }));
      }
    } catch (error) {
      console.error('Error loading achievements from Supabase:', error);
    }
  };

  const loadTrackingDataFromSupabase = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('achievement_tracking')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.tracking_data) {
        try {
          achievementEngine.loadUserActionData(data.tracking_data as unknown as UserActionData);
        } catch (error) {
          console.error('Error parsing tracking data:', error);
        }
      }
    } catch (error) {
      console.error('Error loading tracking data from Supabase:', error);
    }
  };

  const saveTrackingDataToSupabase = async () => {
    if (!user) return;

    try {
      const engineData = achievementEngine.getUserActionData();
      
      // Upsert tracking data
      const { error } = await supabase
        .from('achievement_tracking')
        .upsert({
          user_id: user.id,
          tracking_type: 'general',
          tracking_data: engineData,
          date_tracked: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'user_id,tracking_type,date_tracked'
        });

      if (error) {
        console.error('Error saving tracking data to Supabase:', error);
      }
    } catch (error) {
      console.error('Error saving tracking data:', error);
    }
  };

  // Save engine data to Supabase whenever it changes
  useEffect(() => {
    if (user && (subjects.length > 0 || schedule.length > 0 || absences.length > 0)) {
      saveTrackingDataToSupabase();
    }
  }, [user, subjects, schedule, absences]);

  const unlockAchievement = async (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.isUnlocked || !user) return;

    // Verifica se já foi notificado para evitar notificações duplicadas
    if (notifiedAchievements.has(achievementId)) return;

    // Save to Supabase - apenas o ID e timestamp
    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId
        });

      if (error && error.code !== '23505') { // Ignora erro de duplicação
        console.error('Error saving achievement to Supabase:', error);
        return;
      }
    } catch (error) {
      console.error('Error saving achievement:', error);
      return;
    }

    // Marca como notificado
    setNotifiedAchievements(prev => new Set([...prev, achievementId]));

    setAchievements(prev => prev.map(a => {
      if (a.id === achievementId && !a.isUnlocked) {
        const unlockedAchievement = {
          ...a,
          isUnlocked: true,
          unlockedAt: getSaoPauloTime().toISOString()
        };
        
        // Show toast notification apenas na primeira vez
        const rarityColors = {
          common: '🥉',
          rare: '🥈',
          epic: '🥇',
          legendary: '👑'
        };
        
        toast.success(`${rarityColors[a.rarity]} Conquista Desbloqueada!`, {
          description: `${a.name}: ${a.description}`,
          duration: 5000,
        });

        // Award XP for achievement
        awardAchievementXP(a.rarity);
        
        return unlockedAchievement;
      }
      return a;
    }));
  };

  const trackColorChange = (subjectId: string, color?: string) => {
    if (color && !isImportBlocked) {
      achievementEngine.trackAction('color_changed', { color });
      setTimeout(() => checkSpecificAchievement('color_artist'), 1000);
      setTimeout(() => checkSpecificAchievement('rainbow_collector'), 1000);
      setTimeout(() => checkSpecificAchievement('minimalist'), 1000);
    }
  };

  const trackFileDownload = () => {
    trackDataImport();
  };

  const trackDataImport = () => {
    // Block all achievement checking during import
    window.dispatchEvent(new CustomEvent('importStart'));
    
    // Only track the import action, no other achievements
    achievementEngine.trackAction('grade_imported');
    setTimeout(() => checkSpecificAchievement('data_manager'), 2000);
    
    // End import blocking after a delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('importEnd'));
    }, 5000);
  };

  const trackQuickAbsenceRemoval = (absenceId: string) => {
    if (!isImportBlocked) {
      achievementEngine.trackAction('quick_absence_removal');
      setTimeout(() => checkSpecificAchievement('quick_regret'), 500);
    }
  };

  const trackLogoClicks = () => {
    // Não faz mais nada - conquista removida
  };

  const trackAvatarConfig = () => {
    // Avatar config não é mais uma conquista válida no sistema atual
  };

  const trackThemeChange = () => {
    if (!isImportBlocked) {
      achievementEngine.trackAction('theme_changed');
      setTimeout(() => checkSpecificAchievement('designer_interface'), 1000);
      setTimeout(() => checkSpecificAchievement('color_maestro'), 1000);
    }
  };

  const trackNoteCreated = () => {
    if (!isImportBlocked) {
      achievementEngine.trackAction('note_created');
      setTimeout(() => checkSpecificAchievement('prolific_writer'), 1000);
    }
  };

  const trackJoinedClass = () => {
    if (!isImportBlocked) {
      achievementEngine.trackAction('joined_class');
      setTimeout(() => checkSpecificAchievement('networking'), 1000);
    }
  };

  const trackExperienceUpdate = (totalXp: number) => {
    if (!isImportBlocked) {
      achievementEngine.updateExperience(totalXp);
      setTimeout(() => checkSpecificAchievement('data_analyst'), 1000);
      setTimeout(() => checkSpecificAchievement('supreme_mind'), 1000);
    }
  };

  const trackClassMembersUpdate = (memberCount: number) => {
    if (!isImportBlocked) {
      achievementEngine.updateClassMembers(memberCount);
      setTimeout(() => checkSpecificAchievement('academia_king'), 1000);
    }
  };

  const trackClassesLedUpdate = (classCount: number) => {
    if (!isImportBlocked) {
      achievementEngine.updateClassesLed(classCount);
      setTimeout(() => checkSpecificAchievement('emperor_of_classes'), 1000);
    }
  };

  const trackSectionVisit = (section: string) => {
    if (!isImportBlocked) {
      achievementEngine.trackAction('section_visited', { section });
      setTimeout(() => checkSpecificAchievement('complete_explorer'), 1000);
    }
  };

  const trackFutureAbsence = (absenceDate: string) => {
    // Não faz mais nada - conquista removida
  };

  // Verifica uma conquista específica
  const checkSpecificAchievement = (achievementId: string) => {
    if (isImportBlocked) return;
    
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.isUnlocked) return;

    // Atualiza os dados do engine
    achievementEngine.setCurrentData({
      subjects,
      schedule,
      absences,
      profile,
      all_subjects_attendance_rate: subjects.length > 0 ? 
        subjects.reduce((sum, s) => sum + (1 - (s.currentAbsences / s.maxAbsences)), 0) / subjects.length : 0
    });

    achievementEngine.updateSequenceData();

    if (achievementEngine.canUnlockAchievement(achievementId)) {
      unlockAchievement(achievementId);
    }
  };

  const checkAchievements = () => {
    if (!user || isImportBlocked) return;

    const now = getSaoPauloTime();
    
    // Verificações baseadas em tempo (noturno e datas especiais)
    const hour = now.getHours();
    if (hour >= 2 && hour <= 5) {
      checkSpecificAchievement('night_owl');
    }
    
    // Verificações de datas especiais
    if (now.getDate() === 25 && now.getMonth() === 11) {
      checkSpecificAchievement('christmas_student');
    }
    
    if (now.getDate() === 1 && now.getMonth() === 0) {
      checkSpecificAchievement('new_year_new_me');
    }
    
    // Verificações baseadas em dados atuais
    achievementEngine.setCurrentData({
      subjects,
      schedule, 
      absences,
      profile
    });

    // Lista expandida de conquistas para verificar automaticamente
    const achievementsToCheck = [
      'first_steps',
      'schedule_builder', 
      'color_artist',
      'profile_perfectionist',
      'complete_explorer',
      'schedule_architect',
      'designer_interface',
      'prolific_writer',
      'networking',
      'data_analyst',
      'supreme_mind',
      'academia_king',
      'minimalist',
      'emperor_of_classes',
      'color_maestro'
    ];

    achievementsToCheck.forEach(achievementId => {
      setTimeout(() => checkSpecificAchievement(achievementId), Math.random() * 1000);
    });
  };

  // Track new subjects and schedule slots
  useEffect(() => {
    if (user && subjects.length > 0 && !isImportBlocked) {
      // Track when subjects are added - emit event for immediate verification
      window.dispatchEvent(new CustomEvent('subjectCreated'));
      setTimeout(() => checkSpecificAchievement('first_steps'), 500);
    }
  }, [subjects.length, user, isImportBlocked]);

  useEffect(() => {
    if (user && schedule.length > 0 && !isImportBlocked) {
      // Track schedule slots
      achievementEngine.trackAction('schedule_slot_added');
      setTimeout(() => checkSpecificAchievement('schedule_builder'), 500);
      setTimeout(() => checkSpecificAchievement('schedule_architect'), 500);
    }
  }, [schedule.length, user, isImportBlocked]);

  // Track profile completion
  useEffect(() => {
    if (user && profile && !isImportBlocked) {
      const profileComplete = profile.course && profile.university && profile.shift && profile.semesterStart && profile.semesterEnd;
      if (profileComplete) {
        console.log('Profile complete, checking achievement:', {
          course: profile.course,
          university: profile.university,
          shift: profile.shift,
          semesterStart: profile.semesterStart,
          semesterEnd: profile.semesterEnd
        });
        setTimeout(() => checkSpecificAchievement('profile_perfectionist'), 1000);
      }
    }
  }, [profile, user, isImportBlocked]);

  const resetAchievements = async () => {
    if (!user) return;

    try {
      // Delete all user achievements from Supabase
      const { error: achievementsError } = await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', user.id);

      if (achievementsError) {
        console.error('Error deleting achievements:', achievementsError);
        return;
      }

      // Delete all tracking data from Supabase
      const { error: trackingError } = await supabase
        .from('achievement_tracking')
        .delete()
        .eq('user_id', user.id);

      if (trackingError) {
        console.error('Error deleting tracking data:', trackingError);
        return;
      }

      // Reset local state (block all achievements)
      setAchievements(initialAchievements.map(a => ({ ...a, isUnlocked: false })));
      setNotifiedAchievements(new Set());
      
      // Reset achievement engine
      achievementEngine.resetAllData();

      console.log('Conquistas resetadas com sucesso!');
      
    } catch (error) {
      console.error('Error resetting achievements:', error);
    }
  };

  const getUnlockedCount = () => achievements.filter(a => a.isUnlocked).length;
  const getTotalCount = () => achievements.length;
  const getAchievementsByCategory = (category: string) => {
    // Não mostrar conquistas secretas a menos que estejam desbloqueadas
    return achievements.filter(achievement => {
      if (achievement.category === category) {
        if (achievement.isSecret) {
          return achievement.isUnlocked;
        }
        return true;
      }
      return false;
    });
  };

  return (
    <AchievementsContext.Provider value={{
      achievements,
      checkAchievements,
      getUnlockedCount,
      getTotalCount,
      getAchievementsByCategory,
      trackColorChange,
      trackFileDownload,
      trackAvatarConfig,
      trackSectionVisit,
      trackFutureAbsence,
      trackDataImport,
      trackQuickAbsenceRemoval,
      trackLogoClicks,
      trackThemeChange,
      trackNoteCreated,
      trackJoinedClass,
      trackExperienceUpdate,
      trackClassMembersUpdate,
      trackClassesLedUpdate,
      resetAchievements
    }}>
      {children}
    </AchievementsContext.Provider>
  );
};