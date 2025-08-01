import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
import { useGamification } from '../../contexts/GamificationContext';
import { cn } from '../../lib/utils';
import { useAchievements } from '../../contexts/AchievementsContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { toast } from 'sonner';
import MobileRankingLeaderboard from './MobileRankingLeaderboard';

const MobileGamificationProfile: React.FC = () => {
  const { 
    userLevel, 
    userBadges, 
    getTierInfo, 
    getWeeklyBadges, 
    getMonthlyBadges
  } = useGamification();

  const { applyTheme, getCurrentTheme } = useThemeColors();
  const { trackThemeChange } = useAchievements();
  const [selectedTheme, setSelectedTheme] = useState('default');

  useEffect(() => {
    setSelectedTheme(getCurrentTheme());
  }, [getCurrentTheme]);

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
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground text-sm">
            Carregando sistema de gamificação...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com nível e XP */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                tierInfo.color
              )}>
                {tierInfo.emoji}
              </div>
              <div>
                <CardTitle className="text-lg">
                  Nível {userLevel.level}
                </CardTitle>
                <CardDescription className="text-sm">
                  {tierInfo.name}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {userLevel.experience_points.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Progresso</span>
              <span>{userLevel.level_progress.toFixed(1)}%</span>
            </div>
            <Progress value={userLevel.level_progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Próxima recompensa */}
      {nextReward && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-xl">{nextReward.icon}</div>
                <div>
                  <div className="font-semibold text-sm">Próxima Recompensa</div>
                  <div className="text-xs text-muted-foreground">
                    {nextReward.name} - Nível {nextReward.level}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 h-9">
          <TabsTrigger value="ranking" className="text-xs">Ranking</TabsTrigger>
          <TabsTrigger value="rewards" className="text-xs">Temas</TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          <MobileRankingLeaderboard />
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                Temas de Cores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {unlockedRewards.length > 0 ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Temas Disponíveis</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={selectedTheme === 'default' ? "default" : "outline"}
                        className="h-auto p-3 flex flex-col space-y-1"
                        onClick={() => handleThemeChange('default')}
                      >
                        <div className="text-lg">🌟</div>
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
                            <div className="text-lg">{reward.icon}</div>
                            <div className="text-xs">{reward.name.replace('Tema ', '')}</div>
                          </Button>
                        ))
                      }
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Continue subindo de nível!</p>
                  <p className="text-xs">Primeiro tema no nível 5</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default MobileGamificationProfile;