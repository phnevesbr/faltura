import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Star, 
  Zap, 
  Crown, 
  Target,
  Flame,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight,
  Palette,
  Gift,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { useGamification } from '../../contexts/GamificationContext';
import { useAchievements } from '../../contexts/AchievementsContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const DesktopGamificationSection: React.FC = () => {
  const { user } = useAuth();
  const { 
    userLevel, 
    userBadges, 
    getTierInfo, 
    getWeeklyBadges, 
    getMonthlyBadges
  } = useGamification();

  const { applyTheme, getCurrentTheme } = useThemeColors();
  const { trackThemeChange, achievements } = useAchievements();
  const [selectedTheme, setSelectedTheme] = useState(getCurrentTheme());
  const [recentAchievements, setRecentAchievements] = useState<any[]>([]);

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
    if (user) {
      loadRecentAchievements();
    }
  }, [getCurrentTheme, user]);

  const loadRecentAchievements = async () => {
    if (!user) return;

    try {
      const { data: userAchievements } = await supabase
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', user.id)
        .order('unlocked_at', { ascending: false })
        .limit(3);

      if (userAchievements) {
        const recentAchievementsData = userAchievements.map(ua => {
          const achievement = achievements.find(a => a.id === ua.achievement_id);
          return {
            id: ua.achievement_id,
            name: achievement?.name || 'Conquista',
            description: achievement?.description || 'Conquista desbloqueada',
            icon: achievement?.icon || '🏆',
            unlockedAt: ua.unlocked_at
          };
        });
        setRecentAchievements(recentAchievementsData);
      }
    } catch (error) {
      console.error('Error loading recent achievements:', error);
    }
  };

  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);
    applyTheme(themeName);
    trackThemeChange();
  };

  const tierInfo = userLevel ? getTierInfo(userLevel.current_tier) : getTierInfo('calouro');

  // Recompensas desbloqueadas por nível
  const getUnlockedRewards = () => {
    if (!userLevel) return [];
    
    const rewards = [];
    const level = userLevel.level;
    
    // Temas desbloqueados
    if (level >= 5) rewards.push({ type: 'theme', name: 'oceano', displayName: 'Oceano', icon: '🌊' });
    if (level >= 10) rewards.push({ type: 'theme', name: 'floresta', displayName: 'Floresta', icon: '🌲' });
    if (level >= 15) rewards.push({ type: 'theme', name: 'sunset', displayName: 'Sunset', icon: '🌅' });
    if (level >= 25) rewards.push({ type: 'theme', name: 'cristal', displayName: 'Cristal', icon: '💎' });
    if (level >= 30) rewards.push({ type: 'theme', name: 'neon', displayName: 'Neon', icon: '⚡' });
    if (level >= 40) rewards.push({ type: 'theme', name: 'vulcao', displayName: 'Vulcão', icon: '🌋' });
    if (level >= 50) rewards.push({ type: 'theme', name: 'lendario', displayName: 'Lendário', icon: '👑' });
    
    return rewards;
  };

  const getNextReward = () => {
    if (!userLevel) return null;
    
    const allRewards = [
      { level: 5, type: 'theme', name: 'oceano', displayName: 'Oceano', icon: '🌊' },
      { level: 10, type: 'theme', name: 'floresta', displayName: 'Floresta', icon: '🌲' },
      { level: 15, type: 'theme', name: 'sunset', displayName: 'Sunset', icon: '🌅' },
      { level: 25, type: 'theme', name: 'cristal', displayName: 'Cristal', icon: '💎' },
      { level: 30, type: 'theme', name: 'neon', displayName: 'Neon', icon: '⚡' },
      { level: 40, type: 'theme', name: 'vulcao', displayName: 'Vulcão', icon: '🌋' },
      { level: 50, type: 'theme', name: 'lendario', displayName: 'Lendário', icon: '👑' },
    ];
    
    return allRewards.find(reward => reward.level > userLevel.level);
  };

  const nextReward = getNextReward();
  const unlockedRewards = getUnlockedRewards();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (!userLevel) {
    return (
      <Card className="border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="text-center text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Carregando sistema de gamificação...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header com nível e XP */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden bg-gradient-to-br from-background to-primary/5 border-0 shadow-xl">
          <CardContent className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center text-3xl shadow-lg",
                  tierInfo.color
                )}>
                  {tierInfo.emoji}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">
                    Nível {userLevel.level} - {tierInfo.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {userLevel.total_experience.toLocaleString()} XP Total • {tierInfo.range}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">
                  {userLevel.experience_points.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">XP Atual</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progresso para o próximo nível</span>
                <span>{userLevel.level_progress.toFixed(1)}%</span>
              </div>
              <Progress value={userLevel.level_progress} className="h-4" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Próxima recompensa */}
      {nextReward && (
        <motion.div variants={itemVariants}>
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
                    {nextReward.icon}
                  </div>
                  <div>
                    <div className="font-bold text-lg text-amber-800">Próxima Recompensa</div>
                    <div className="text-amber-700">
                      Tema {nextReward.displayName} - Nível {nextReward.level}
                    </div>
                    <div className="text-sm text-amber-600">
                      {nextReward.level - userLevel.level} níveis restantes
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-6 w-6 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Temas disponíveis */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-lg">
                <Palette className="h-6 w-6 text-purple-600" />
              </div>
              Temas de Cores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unlockedRewards.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Tema padrão */}
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={selectedTheme === 'default' ? "default" : "outline"}
                      className="h-24 w-full flex flex-col space-y-2 relative overflow-hidden"
                      onClick={() => handleThemeChange('default')}
                    >
                      <div className="text-2xl">🌟</div>
                      <div className="text-xs font-medium">Padrão</div>
                      {selectedTheme === 'default' && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </Button>
                  </motion.div>

                  {/* Temas desbloqueados */}
                  {unlockedRewards
                    .filter(r => r.type === 'theme')
                    .map((reward, index) => (
                      <motion.div
                        key={index}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={selectedTheme === reward.name ? "default" : "outline"}
                          className="h-24 w-full flex flex-col space-y-2 relative overflow-hidden"
                          onClick={() => handleThemeChange(reward.name)}
                        >
                          <div className="text-2xl">{reward.icon}</div>
                          <div className="text-xs font-medium">{reward.displayName}</div>
                          {selectedTheme === reward.name && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </Button>
                      </motion.div>
                    ))
                  }
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {unlockedRewards.length + 1} tema{unlockedRewards.length > 0 ? 's' : ''} disponível{unlockedRewards.length > 0 ? 'is' : ''} • Continue subindo de nível para desbloquear mais!
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 opacity-50" />
                </div>
                <h3 className="font-semibold mb-2">Temas Bloqueados</h3>
                <p className="text-sm">Continue subindo de nível para desbloquear novos temas!</p>
                <p className="text-xs mt-1">Primeiro tema disponível no nível 5</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Conquistas e estatísticas */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conquistas recentes */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-amber-600" />
                Conquistas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAchievements.length > 0 ? recentAchievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div>
                      <div className="font-medium">{achievement.name}</div>
                      <div className="text-sm text-muted-foreground">{achievement.description}</div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma conquista ainda</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg">
                  <Crown className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-700">
                    {userLevel.level}
                  </div>
                  <div className="text-xs text-muted-foreground">Nível Atual</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg">
                  <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-700">
                    {userBadges?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Conquistas</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg">
                  <Flame className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-purple-700">
                    {tierInfo.name}
                  </div>
                  <div className="text-xs text-muted-foreground">Rank</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/5 rounded-lg">
                  <Sparkles className="h-6 w-6 text-amber-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-amber-700">
                    {unlockedRewards.length + 1}
                  </div>
                  <div className="text-xs text-muted-foreground">Temas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DesktopGamificationSection;