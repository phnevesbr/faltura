import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Trophy, Star, Zap, Crown, Lock } from 'lucide-react';
import { useAchievements } from '../contexts/AchievementsContext';
import { cn } from '../lib/utils';

const AchievementsManager: React.FC = () => {
  const { achievements, getUnlockedCount, getTotalCount, getAchievementsByCategory } = useAchievements();
  const [selectedCategory, setSelectedCategory] = useState('all');

  const rarityConfig = {
    common: { color: 'bg-gray-500', icon: Star, label: 'Comum' },
    rare: { color: 'bg-blue-500', icon: Zap, label: 'Raro' },
    epic: { color: 'bg-purple-500', icon: Trophy, label: 'Épico' },
    legendary: { color: 'bg-yellow-500', icon: Crown, label: 'Lendário' }
  };

  const categoryLabels = {
    integration: 'Integração',
    consistency: 'Consistência',
    secret: 'Secretas'
  };

  const getFilteredAchievements = () => {
    // Filtrar conquistas secretas que não foram desbloqueadas
    const visibleAchievements = achievements.filter(achievement => {
      if (achievement.isSecret) {
        return achievement.isUnlocked;
      }
      return true;
    });
    
    if (selectedCategory === 'all') return visibleAchievements;
    if (selectedCategory === 'unlocked') return visibleAchievements.filter(a => a.isUnlocked);
    if (selectedCategory === 'locked') return visibleAchievements.filter(a => !a.isUnlocked);
    return getAchievementsByCategory(selectedCategory);
  };

  const AchievementCard = ({ achievement }: { achievement: any }) => {
    const config = rarityConfig[achievement.rarity];
    const IconComponent = config.icon;

    return (
      <Card className={cn(
        "transition-all duration-300 hover:shadow-lg",
        achievement.isUnlocked 
          ? "border-2 border-primary/20 shadow-md" 
          : "opacity-60 border-dashed"
      )}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={cn(
                "p-2 rounded-full flex items-center justify-center",
                achievement.isUnlocked ? config.color : "bg-gray-300"
              )}>
                {achievement.isUnlocked ? (
                  <span className="text-xl">{achievement.icon}</span>
                ) : (
                  <Lock className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">{achievement.name}</CardTitle>
                <Badge variant="outline" className="mt-1">
                  <IconComponent className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
            </div>
            
            {achievement.isUnlocked && (
              <div className="text-right">
                <div className="text-xs text-muted-foreground">
                  Desbloqueado em
                </div>
                <div className="text-sm font-medium">
                  {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <CardDescription className="text-sm">
            {achievement.description}
          </CardDescription>
          
          <div className="mt-3 flex items-center justify-between">
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[achievement.category]}
            </Badge>
            
            {achievement.rarity === 'legendary' && (
              <div className="flex items-center space-x-1 text-yellow-600">
                <Crown className="h-4 w-4" />
                <span className="text-xs font-bold">LENDÁRIA</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
            Sistema de Conquistas
          </CardTitle>
          <CardDescription>
            Desbloqueie conquistas usando o Faltula e torne-se um verdadeiro acadêmico!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {getUnlockedCount()}
              </div>
              <div className="text-sm text-muted-foreground">Desbloqueadas</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-gray-500/10 to-slate-500/10 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {getTotalCount() - getUnlockedCount()}
              </div>
              <div className="text-sm text-muted-foreground">Bloqueadas</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((getUnlockedCount() / getTotalCount()) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progresso</div>
            </div>
            
            <div className="text-center p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {achievements.filter(a => a.isUnlocked && a.rarity === 'legendary').length}
              </div>
              <div className="text-sm text-muted-foreground">Lendárias</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="unlocked">Desbloqueadas</TabsTrigger>
          <TabsTrigger value="locked">Bloqueadas</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
          <TabsTrigger value="consistency">Consistência</TabsTrigger>
          <TabsTrigger value="secret">Secretas</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedCategory} className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredAchievements().map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
          
          {getFilteredAchievements().length === 0 && (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                Nenhuma conquista encontrada
              </p>
              <p className="text-sm text-muted-foreground">
                Continue usando o app para desbloquear novas conquistas!
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementsManager;
