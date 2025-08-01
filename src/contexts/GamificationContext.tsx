import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { useNotifications } from '../hooks/useNotifications';

export interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  experience_points: number;
  total_experience: number;
  current_tier: string;
  level_progress: number;
  created_at: string;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  badge_id: string;
  badge_name: string;
  badge_description: string;
  badge_icon: string;
  earned_date: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

interface GamificationContextType {
  userLevel: UserLevel | null;
  userBadges: UserBadge[];
  addExperience: (amount: number, reason?: string) => Promise<void>;
  awardBadge: (badgeData: Omit<UserBadge, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  getTierInfo: (tier: string) => { name: string; color: string; emoji: string; range: string };
  getWeeklyBadges: () => UserBadge[];
  getMonthlyBadges: () => UserBadge[];
  checkAndAwardWeeklyBadges: () => Promise<void>;
  checkAndAwardMonthlyBadges: () => Promise<void>;
  getXpForNextLevel: () => number;
  // New XP tracking methods
  awardProfileUpdateXP: () => Promise<void>;
  awardNewSemesterXP: () => Promise<void>;
  awardSubjectCreationXP: () => Promise<void>;
  awardScheduleSlotXP: () => Promise<void>;
  awardGradeImportXP: () => Promise<void>;
  awardAbsenceRegistrationXP: () => Promise<void>;
  awardNoteCreationXP: () => Promise<void>;
  awardNoteCompletionXP: () => Promise<void>;
  awardAchievementXP: (rarity: 'common' | 'rare' | 'epic' | 'legendary') => Promise<void>;
  awardOnboardingXP: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { shouldShowNotification } = useNotifications();
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [gamificationSettings, setGamificationSettings] = useState<Record<string, number>>({});

  // Sistema de agrupamento de XP
  const [xpBuffer, setXpBuffer] = useState(0);
  const [xpReasons, setXpReasons] = useState<string[]>([]);
  const [xpTimer, setXpTimer] = useState<NodeJS.Timeout | null>(null);

  // Detect mobile for notification duration
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      loadUserLevel();
      loadUserBadges();
      loadGamificationSettings();
    } else {
      setUserLevel(null);
      setUserBadges([]);
      setGamificationSettings({});
    }
  }, [user]);

  const loadGamificationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_settings')
        .select('action_type, xp_reward');

      if (error) {
        console.error('Error loading gamification settings:', error);
        return;
      }

      const settingsMap: Record<string, number> = {};
      data?.forEach(setting => {
        settingsMap[setting.action_type] = setting.xp_reward;
      });

      setGamificationSettings(settingsMap);
    } catch (error) {
      console.error('Error in loadGamificationSettings:', error);
    }
  };

  const getXpForAction = (actionType: string, fallbackXp: number = 5) => {
    return gamificationSettings[actionType] || fallbackXp;
  };

  const loadUserLevel = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading user level:', error);
        return;
      }

      if (data) {
        setUserLevel(data);
      } else {
        // Criar registro inicial
        const { data: newLevel, error: createError } = await supabase
          .from('user_levels')
          .insert({
            user_id: user.id,
            level: 1,
            experience_points: 0,
            total_experience: 0,
            current_tier: 'aprendiz',
            level_progress: 0.0
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user level:', createError);
          return;
        }

        setUserLevel(newLevel);
      }
    } catch (error) {
      console.error('Error in loadUserLevel:', error);
    }
  };

  const loadUserBadges = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_date', { ascending: false });

      if (error) {
        console.error('Error loading user badges:', error);
        return;
      }

      setUserBadges(data || []);
    } catch (error) {
      console.error('Error in loadUserBadges:', error);
    }
  };

  const addExperience = async (amount: number, reason?: string) => {
    // This is the legacy function, still used by some achievement code
    // Defaulting to 'achievements' category for backwards compatibility
    await addExperienceWithCategory(amount, reason || 'Experiência ganha!', 'achievements');
  };

  const awardBadge = async (badgeData: Omit<UserBadge, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return;

    try {
      // Verificar se já possui o badge
      const existingBadge = userBadges.find(b => 
        b.badge_id === badgeData.badge_id && 
        b.is_active
      );

      if (existingBadge) return;

      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          ...badgeData
        })
        .select()
        .single();

      if (error) {
        console.error('Error awarding badge:', error);
        return;
      }

      setUserBadges(prev => [data, ...prev]);

      if (shouldShowNotification('achievements')) {
        const duration = isMobile ? 5000 : 4000;
        toast.success(`🏆 ${badgeData.badge_name}`, {
          description: badgeData.badge_description,
          duration,
        });
      }
    } catch (error) {
      console.error('Error in awardBadge:', error);
    }
  };

  const getTierInfo = (tier: string) => {
    // Map dos tiers baseado na configuração da tabela level_config
    const tierMappings = {
      'calouro': { name: 'Calouro', color: 'bg-tier-calouro', emoji: '🎓', range: 'Níveis 1-10' },
      'aprendiz': { name: 'Aprendiz', color: 'bg-tier-calouro', emoji: '🎓', range: 'Níveis 1-10' },
      'veterano': { name: 'Veterano', color: 'bg-tier-veterano', emoji: '⭐', range: 'Níveis 11-25' },
      'expert': { name: 'Expert', color: 'bg-tier-expert', emoji: '💎', range: 'Níveis 26-50' },
      'lenda': { name: 'Lenda', color: 'bg-tier-lenda', emoji: '👑', range: 'Níveis 51+' }
    };
    
    return tierMappings[tier as keyof typeof tierMappings] || tierMappings.calouro;
  };

  const getWeeklyBadges = () => {
    return userBadges.filter(badge => badge.badge_type === 'weekly' && badge.is_active);
  };

  const getMonthlyBadges = () => {
    return userBadges.filter(badge => badge.badge_type === 'monthly' && badge.is_active);
  };

  const checkAndAwardWeeklyBadges = async () => {
    if (!user) return;

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Verificar se já tem badge da semana atual
    const hasWeeklyBadge = userBadges.some(badge => 
      badge.badge_type === 'weekly' && 
      new Date(badge.earned_date) >= startOfWeek &&
      badge.is_active
    );

    if (hasWeeklyBadge) return;

    // Aqui você pode implementar lógicas específicas para badges semanais
    // Por exemplo, verificar faltas da semana, tarefas completadas, etc.
    
    // Exemplo: Badge de presença semanal
    try {
      const { data: weeklyAbsences } = await supabase
        .from('absences')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfWeek.toISOString().split('T')[0]);

      if (weeklyAbsences && weeklyAbsences.length === 0) {
        await awardBadge({
          badge_type: 'weekly',
          badge_id: `weekly_perfect_${startOfWeek.getTime()}`,
          badge_name: 'Semana Perfeita',
          badge_description: 'Zero faltas nesta semana!',
          badge_icon: '🌟',
          earned_date: today.toISOString().split('T')[0],
          is_active: true,
          expires_at: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error checking weekly badges:', error);
    }
  };

  const checkAndAwardMonthlyBadges = async () => {
    if (!user) return;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Verificar se já tem badge do mês atual
    const hasMonthlyBadge = userBadges.some(badge => 
      badge.badge_type === 'monthly' && 
      new Date(badge.earned_date) >= startOfMonth &&
      badge.is_active
    );

    if (hasMonthlyBadge) return;

    // Exemplo: Badge de dedicação mensal
    try {
      const { data: monthlyAbsences } = await supabase
        .from('absences')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startOfMonth.toISOString().split('T')[0]);

      if (monthlyAbsences && monthlyAbsences.length <= 2) {
        await awardBadge({
          badge_type: 'monthly',
          badge_id: `monthly_dedicated_${startOfMonth.getTime()}`,
          badge_name: 'Dedicado do Mês',
          badge_description: 'Máximo 2 faltas neste mês!',
          badge_icon: '🏅',
          earned_date: today.toISOString().split('T')[0],
          is_active: true,
          expires_at: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error checking monthly badges:', error);
    }
  };

  // Specific XP reward functions with proper notification categories
  const awardProfileUpdateXP = async () => {
    const xp = getXpForAction('profile_completed', 5);
    console.log('🎯 Awarding profile update XP:', xp);
    await addExperienceWithCategory(xp, 'Perfil atualizado', 'profile');
  };

  const awardNewSemesterXP = async () => {
    const xp = getXpForAction('profile_completed', 20); // Using same as profile for now
    console.log('🎯 Awarding new semester XP:', xp);
    await addExperienceWithCategory(xp, 'Novo semestre iniciado', 'profile');
  };

  const awardSubjectCreationXP = async () => {
    const xp = getXpForAction('subject_created', 50);
    console.log('🎯 Awarding subject creation XP:', xp);
    await addExperienceWithCategory(xp, 'Matéria criada', 'subjects');
  };

  const awardScheduleSlotXP = async () => {
    const xp = getXpForAction('schedule_configured', 2);
    console.log('🎯 Awarding schedule slot XP:', xp);
    await addExperienceWithCategory(xp, 'Aula adicionada à grade', 'grade');
  };

  const awardGradeImportXP = async () => {
    const xp = getXpForAction('schedule_configured', 10); // Using schedule for now since grade_import doesn't exist
    console.log('🎯 Awarding grade import XP:', xp);
    await addExperienceWithCategory(xp, 'Grade importada', 'grade');
  };

  const awardAbsenceRegistrationXP = async () => {
    const xp = getXpForAction('absence_registered', 10);
    console.log('🎯 Awarding absence registration XP:', xp);
    await addExperienceWithCategory(xp, 'Falta registrada', 'absences');
  };

  const awardNoteCreationXP = async () => {
    const xp = getXpForAction('note_created', 25);
    console.log('🎯 Awarding note creation XP:', xp);
    await addExperienceWithCategory(xp, 'Anotação criada', 'notes');
  };

  const awardNoteCompletionXP = async () => {
    const xp = getXpForAction('task_completed', 30);
    console.log('🎯 Awarding note completion XP:', xp);
    await addExperienceWithCategory(xp, 'Anotação concluída', 'notes');
  };

  const awardAchievementXP = async (rarity: 'common' | 'rare' | 'epic' | 'legendary') => {
    const baseXp = getXpForAction('achievement_unlocked', 200);
    const rarityMultiplier = {
      common: 0.2,
      rare: 0.5,
      epic: 0.8,
      legendary: 1.0
    };
    
    const xp = Math.round(baseXp * rarityMultiplier[rarity]);
    await addExperienceWithCategory(xp, `Conquista ${rarity} desbloqueada`, 'achievements');
  };

  const awardOnboardingXP = async () => {
    const xp = getXpForAction('achievement_unlocked', 200); // Using achievement XP for onboarding
    console.log('🎯 Awarding onboarding completion XP:', xp);
    await addExperienceWithCategory(xp, 'Tutorial concluído!', 'achievements');
  };

  const getXpForNextLevel = () => {
    if (!userLevel) return 0;
    
    const currentLevel = userLevel.level;
    const totalXp = userLevel.total_experience;
    
    // Calculate XP needed for next level based on the new tier system
    let xpForNextLevel: number;
    
    if (currentLevel <= 10) {
      xpForNextLevel = currentLevel * 100;
    } else if (currentLevel <= 20) {
      xpForNextLevel = 1000 + (currentLevel - 10) * 167;
    } else if (currentLevel <= 30) {
      xpForNextLevel = 2675 + (currentLevel - 20) * 400;
    } else if (currentLevel <= 40) {
      xpForNextLevel = 6675 + (currentLevel - 30) * 400;
    } else if (currentLevel <= 50) {
      xpForNextLevel = 10675 + (currentLevel - 40) * 400;
    } else {
      xpForNextLevel = 14675 + (currentLevel - 50) * 400;
    }
    
    return Math.max(0, xpForNextLevel - totalXp);
  };

  // Função para mostrar notificação de XP agrupada
  const showGroupedXpNotification = () => {
    if (xpBuffer > 0 && shouldShowNotification('xp_rewards')) {
      const totalXp = xpBuffer;
      const uniqueReasons = [...new Set(xpReasons)];
      const description = uniqueReasons.length === 1 
        ? uniqueReasons[0] 
        : `${uniqueReasons.length} ações realizadas`;
      
      toast.success(`+${totalXp} XP`, {
        description,
        duration: 2000,
      });
    }
    
    // Reset buffer
    setXpBuffer(0);
    setXpReasons([]);
  };

  // New function to add experience with specific notification category
  const addExperienceWithCategory = async (amount: number, reason: string, category: 'absences' | 'grade' | 'achievements' | 'subjects' | 'notes' | 'profile') => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('update_user_level', {
        user_id_param: user.id,
        xp_gained: amount
      });

      if (error) {
        console.error('Error adding experience:', error);
        return;
      }

      // Atualizar estado local
      console.log('🔄 Reloading user level after XP gain...');
      await loadUserLevel();
      console.log('✅ User level reloaded successfully');
      
      // Dispatch event for achievement tracking
      if (userLevel) {
        window.dispatchEvent(new CustomEvent('experienceUpdated', { 
          detail: { totalExperience: userLevel.total_experience + amount } 
        }));
      }

      // Sistema de agrupamento de XP para evitar spam de notificações
      if (shouldShowNotification('xp_rewards')) {
        setXpBuffer(prev => prev + amount);
        setXpReasons(prev => [...prev, reason]);
        
        // Cancelar timer anterior se existir
        if (xpTimer) {
          clearTimeout(xpTimer);
        }
        
        // Criar novo timer para mostrar notificação agrupada
        const newTimer = setTimeout(() => {
          showGroupedXpNotification();
          setXpTimer(null);
        }, 1500); // Aguarda 1.5s para agrupar XP
        
        setXpTimer(newTimer);
      }

      // Verificar se subiu de nível e dar badge correspondente
      if (data && typeof data === 'object' && 'level_up' in data && data.level_up) {
        const newLevel = (data as any).new_level;
        const tierInfo = getTierInfo((data as any).tier);
        
        // Mostrar notificação de level up apenas se habilitada para conquistas
        if (shouldShowNotification('achievements')) {
          toast.success(`🎉 Nível ${newLevel}!`, {
            description: `Você subiu para ${tierInfo.name}! ${tierInfo.emoji}`,
            duration: 5000,
          });
        }

        // Badge de nível é criado automaticamente pelo sistema de conquistas
      }
    } catch (error) {
      console.error('Error in addExperienceWithCategory:', error);
    }
  };

  // Cleanup do timer quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (xpTimer) {
        clearTimeout(xpTimer);
        // Mostrar qualquer XP pendente antes de limpar
        if (xpBuffer > 0) {
          showGroupedXpNotification();
        }
      }
    };
  }, [xpTimer, xpBuffer]);

  return (
    <GamificationContext.Provider value={{
      userLevel,
      userBadges,
      addExperience,
      awardBadge,
      getTierInfo,
      getWeeklyBadges,
      getMonthlyBadges,
      checkAndAwardWeeklyBadges,
      checkAndAwardMonthlyBadges,
      getXpForNextLevel,
      awardProfileUpdateXP,
      awardNewSemesterXP,
      awardSubjectCreationXP,
      awardScheduleSlotXP,
      awardGradeImportXP,
      awardAbsenceRegistrationXP,
      awardNoteCreationXP,
      awardNoteCompletionXP,
      awardAchievementXP,
      awardOnboardingXP
    }}>
      {children}
    </GamificationContext.Provider>
  );
};