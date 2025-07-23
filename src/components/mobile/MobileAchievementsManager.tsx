import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Trophy, Star, Zap, Crown, Lock, Filter } from 'lucide-react';
import { useAchievements } from '../../contexts/AchievementsContext';
import { cn } from '../../lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const MobileAchievementsManager: React.FC = () => {
  const { achievements, getUnlockedCount, getTotalCount, getAchievementsByCategory } = useAchievements();
  const [selectedFilter, setSelectedFilter] = useState('all');

  const rarityConfig = {
    common: { color: 'bg-gray-500', icon: Star, label: 'Comum', textColor: 'text-gray-600' },
    rare: { color: 'bg-blue-500', icon: Zap, label: 'Raro', textColor: 'text-blue-600' },
    epic: { color: 'bg-purple-500', icon: Trophy, label: 'Épico', textColor: 'text-purple-600' },
    legendary: { color: 'bg-yellow-500', icon: Crown, label: 'Lendário', textColor: 'text-yellow-600' }
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
    
    switch (selectedFilter) {
      case 'unlocked':
        return visibleAchievements.filter(a => a.isUnlocked);
      case 'locked':
        return visibleAchievements.filter(a => !a.isUnlocked);
      case 'integration':
      case 'consistency':
      case 'secret':
        return getAchievementsByCategory(selectedFilter);
      default:
        return visibleAchievements;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Conquistas
          </CardTitle>
          <CardDescription className="text-sm">
            {getUnlockedCount()} de {getTotalCount()} desbloqueadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg">
              <div className="text-lg font-bold text-primary">
                {getUnlockedCount()}
              </div>
              <div className="text-xs text-muted-foreground">Desbloqueadas</div>
            </div>
            
            <div className="text-center p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {Math.round((getUnlockedCount() / getTotalCount()) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Progresso</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Conquistas</SelectItem>
                <SelectItem value="unlocked">Desbloqueadas</SelectItem>
                <SelectItem value="locked">Bloqueadas</SelectItem>
                <SelectItem value="integration">Integração</SelectItem>
                <SelectItem value="consistency">Consistência</SelectItem>
                <SelectItem value="secret">Secretas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Achievements List */}
      <div className="space-y-3">
        {getFilteredAchievements().map((achievement) => {
          const config = rarityConfig[achievement.rarity];
          const IconComponent = config.icon;

          return (
            <Card 
              key={achievement.id} 
              className={cn(
                "transition-all duration-300",
                achievement.isUnlocked 
                  ? "border-l-4 border-l-primary shadow-sm" 
                  : "opacity-60 border-dashed"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className={cn(
                    "p-2 rounded-full flex items-center justify-center flex-shrink-0",
                    achievement.isUnlocked ? config.color : "bg-gray-300"
                  )}>
                    {achievement.isUnlocked ? (
                      <span className="text-sm">{achievement.icon}</span>
                    ) : (
                      <Lock className="h-3 w-3 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {achievement.name}
                      </h3>
                      {achievement.rarity === 'legendary' && (
                        <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                      {achievement.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          <IconComponent className="h-2 w-2 mr-1" />
                          {config.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[achievement.category]}
                        </Badge>
                      </div>
                      
                      {achievement.isUnlocked && (
                        <div className="text-xs text-muted-foreground">
                          {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {getFilteredAchievements().length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-muted-foreground mb-1">
              Nenhuma conquista encontrada
            </p>
            <p className="text-sm text-muted-foreground">
              Continue usando o app para desbloquear!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MobileAchievementsManager;
