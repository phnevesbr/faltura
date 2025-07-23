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
  ChevronRight,
  Users
} from 'lucide-react';
import { useGamification } from '../../contexts/GamificationContext';
import { cn } from '../../lib/utils';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useAchievements } from '../../contexts/AchievementsContext';

const CompactGamificationProfile: React.FC = () => {
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
      {/* Header Compacto com nível e XP */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center text-xl",
                tierInfo.color
              )}>
                {tierInfo.emoji}
              </div>
              <div className="flex-1">
                <div className="font-semibold">
                  Nível {userLevel.level}
                </div>
                <div className="text-sm text-muted-foreground">
                  {tierInfo.name}
                </div>
                <Progress value={userLevel.level_progress} className="h-2 mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {userLevel.experience_points.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">XP Atual</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold">
                  {userLevel.total_experience.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">XP Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próxima recompensa - Mais compacto */}
      {nextReward && (
        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="text-xl">{nextReward.icon}</div>
                <div>
                  <div className="font-medium text-sm">Próxima Recompensa</div>
                  <div className="text-xs text-muted-foreground">
                    {nextReward.name} - Nível {nextReward.level}
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                {nextReward.level - userLevel.level} níveis
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs mais organizadas */}
      <Tabs defaultValue="ranking" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ranking" className="gap-2">
            <Users className="h-4 w-4" />
            Ranking
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Temas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ranking" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Classificação Global
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ranking em desenvolvimento</p>
                <p className="text-sm">Em breve você poderá ver sua posição!</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Temas Desbloqueados
              </CardTitle>
              <CardDescription>
                Personalize a aparência do seu app
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unlockedRewards.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <Button
                      variant={selectedTheme === 'default' ? "default" : "outline"}
                      className="h-16 flex flex-col space-y-1"
                      onClick={() => handleThemeChange('default')}
                    >
                      <div className="text-lg">🎨</div>
                      <div className="text-xs">Padrão</div>
                    </Button>
                    {unlockedRewards
                      .filter(r => r.type === 'theme')
                      .map((reward, index) => (
                        <Button
                          key={index}
                          variant={selectedTheme === reward.name ? "default" : "outline"}
                          className="h-16 flex flex-col space-y-1"
                          onClick={() => handleThemeChange(reward.name)}
                        >
                          <div className="text-lg">{reward.icon}</div>
                          <div className="text-xs">{reward.name.replace('Tema ', '')}</div>
                        </Button>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">Nenhum tema desbloqueado</p>
                  <p className="text-sm">Continue subindo de nível para desbloquear novos temas!</p>
                  <Badge variant="secondary" className="mt-2">
                    Primeiro tema no nível 5
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompactGamificationProfile;