import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Trophy, 
  Star, 
  Zap, 
  Crown, 
  Calendar,
  Flame,
  Target,
  TrendingUp,
  Award,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useGamification } from '../contexts/GamificationContext';
import { cn } from '../lib/utils';
import { useThemeColors } from '../hooks/useThemeColors';
import { useAchievements } from '../contexts/AchievementsContext';

const GamificationProfile: React.FC = () => {
  const { 
    userLevel, 
    userBadges, 
    getTierInfo, 
    getWeeklyBadges, 
    getMonthlyBadges,
    addExperience 
  } = useGamification();

  const { applyTheme, getCurrentTheme } = useThemeColors();
  const { trackThemeChange } = useAchievements();
  const [selectedTheme, setSelectedTheme] = useState(getCurrentTheme());

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
  }, []);

  const handleThemeChange = (themeName: string) => {
    setSelectedTheme(themeName);
    applyTheme(themeName);
    trackThemeChange();
  };

  const weeklyBadges = getWeeklyBadges();
  const monthlyBadges = getMonthlyBadges();

  const tierInfo = userLevel ? getTierInfo(userLevel.current_tier) : getTierInfo('calouro');

  // Recompensas desbloqueadas por nível
  const getUnlockedRewards = () => {
    if (!userLevel) return [];
    
    const rewards = [];
    const level = userLevel.level;
    
    // Temas desbloqueados - ADICIONADOS 2 NOVOS TEMAS
    if (level >= 5) rewards.push({ type: 'theme', name: 'Tema Oceano', icon: '🌊' });
    if (level >= 10) rewards.push({ type: 'theme', name: 'Tema Floresta', icon: '🌲' });
    if (level >= 15) rewards.push({ type: 'theme', name: 'Tema Sunset', icon: '🌅' });
    if (level >= 25) rewards.push({ type: 'theme', name: 'Tema Cristal', icon: '💎' });
    if (level >= 30) rewards.push({ type: 'theme', name: 'Tema Neon', icon: '⚡' });
    if (level >= 40) rewards.push({ type: 'theme', name: 'Tema Vulcão', icon: '🌋' });
    if (level >= 50) rewards.push({ type: 'theme', name: 'Tema Lendário', icon: '👑' });
    
    
    return rewards;
  };

  const getNextReward = () => {
    if (!userLevel) return null;
    
    const allRewards = [
      { level: 5, type: 'theme', name: 'Tema Oceano', icon: '🌊' },
      { level: 10, type: 'theme', name: 'Tema Floresta', icon: '🌲' },
      { level: 15, type: 'theme', name: 'Tema Sunset', icon: '🌅' },
      { level: 25, type: 'theme', name: 'Tema Cristal', icon: '💎' },
      { level: 30, type: 'theme', name: 'Tema Neon', icon: '⚡' },
      { level: 40, type: 'theme', name: 'Tema Vulcão', icon: '🌋' },
      { level: 50, type: 'theme', name: 'Tema Lendário', icon: '👑' },
    ];
    
    return allRewards.find(reward => reward.level > userLevel.level);
  };

  const nextReward = getNextReward();
  const unlockedRewards = getUnlockedRewards();

  if (!userLevel) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Carregando sistema de gamificação...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com nível e XP */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center text-2xl",
                tierInfo.color
              )}>
                {tierInfo.emoji}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  Nível {userLevel.level} - {tierInfo.name}
                </CardTitle>
                <CardDescription>
                  {userLevel.total_experience.toLocaleString()} XP Total • {tierInfo.range}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-xp-text">
                {userLevel.experience_points.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">XP Atual</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso para o próximo nível</span>
              <span>{userLevel.level_progress.toFixed(1)}%</span>
            </div>
            <Progress value={userLevel.level_progress} className="h-3" />
          </div>
        </CardHeader>
      </Card>

      <Card>
        {nextReward && (
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{nextReward.icon}</div>
                <div>
                  <div className="font-semibold">Próxima Recompensa</div>
                  <div className="text-sm text-muted-foreground">
                    {nextReward.name} - Nível {nextReward.level}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
        )}
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            Temas de Cores
          </CardTitle>
          <CardDescription>
            Personalize a aparência do app
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unlockedRewards.length > 0 ? (
            <div className="space-y-4">
              {/* Temas */}
              <div>
                <h4 className="font-semibold mb-3">Temas Disponíveis</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <Button
                    variant={selectedTheme === 'default' ? "default" : "outline"}
                    className="h-auto p-3 flex flex-col space-y-1"
                    onClick={() => handleThemeChange('default')}
                  >
                    <div className="text-xl">🌟</div>
                    <div className="text-xs">Padrão</div>
                  </Button>
                  {unlockedRewards
                    .filter(r => r.type === 'theme')
                    .map((reward, index) => (
                      <Button
                        key={index}
                        variant={selectedTheme === reward.name ? "default" : "outline"}
                        className="h-auto p-3 flex flex-col space-y-1"
                        onClick={() => handleThemeChange(reward.name)}
                      >
                        <div className="text-xl">{reward.icon}</div>
                        <div className="text-xs">{reward.name.replace('Tema ', '')}</div>
                      </Button>
                    ))
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Continue subindo de nível para desbloquear novos temas!</p>
              <p className="text-sm">Primeiro tema disponível no nível 5</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamificationProfile;