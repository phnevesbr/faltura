import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Trophy, 
  Star, 
  Zap, 
  Crown, 
  Lock, 
  Search, 
  Filter,
  Medal,
  Target,
  Sparkles,
  Award,
  Eye,
  EyeOff,
  Calendar,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useAchievements } from '../../contexts/AchievementsContext';
import { cn } from '../../lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { useDarkMode } from '../../hooks/useDarkMode';

const ModernAchievementsManager: React.FC = () => {
  const { achievements, getUnlockedCount, getTotalCount, getAchievementsByCategory } = useAchievements();
  const { isDarkMode } = useDarkMode();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSecretAchievements, setShowSecretAchievements] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);

  const rarityConfig = {
    common: { 
      color: 'from-gray-400 to-gray-600', 
      icon: Star, 
      label: 'Comum',
      bgGradient: 'from-gray-50 to-gray-100',
      bgGradientDark: 'from-gray-900 to-gray-800',
      shadow: 'shadow-gray-200',
      shadowDark: 'shadow-gray-800/50'
    },
    rare: { 
      color: 'from-blue-400 to-blue-600', 
      icon: Zap, 
      label: 'Raro',
      bgGradient: 'from-blue-50 to-blue-100',
      bgGradientDark: 'from-blue-900/20 to-blue-800/20',
      shadow: 'shadow-blue-200',
      shadowDark: 'shadow-blue-800/50'
    },
    epic: { 
      color: 'from-purple-400 to-purple-600', 
      icon: Trophy, 
      label: 'Épico',
      bgGradient: 'from-purple-50 to-purple-100',
      bgGradientDark: 'from-purple-900/20 to-purple-800/20',
      shadow: 'shadow-purple-200',
      shadowDark: 'shadow-purple-800/50'
    },
    legendary: { 
      color: 'from-yellow-400 to-orange-500', 
      icon: Crown, 
      label: 'Lendário',
      bgGradient: 'from-yellow-50 to-orange-100',
      bgGradientDark: 'from-yellow-900/20 to-orange-800/20',
      shadow: 'shadow-yellow-200',
      shadowDark: 'shadow-yellow-800/50'
    }
  };

  const categoryLabels = {
    integration: 'Integração',
    consistency: 'Consistência',
    secret: 'Secretas'
  };

  const getFilteredAchievements = useMemo(() => {
    let filtered = achievements.filter(achievement => {
      // Filtrar conquistas secretas se não estiver habilitado para mostrá-las
      if (achievement.isSecret && !showSecretAchievements && !achievement.isUnlocked) {
        return false;
      }
      return true;
    });

    // Aplicar filtro de categoria
    switch (selectedFilter) {
      case 'unlocked':
        filtered = filtered.filter(a => a.isUnlocked);
        break;
      case 'locked':
        filtered = filtered.filter(a => !a.isUnlocked);
        break;
      case 'integration':
      case 'consistency':
      case 'secret':
        filtered = getAchievementsByCategory(selectedFilter);
        break;
    }

    // Aplicar filtro de busca
    if (searchQuery.trim()) {
      filtered = filtered.filter(achievement =>
        achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Aplicar ordenação
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => {
          if (a.isUnlocked && b.isUnlocked) {
            return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
          }
          if (a.isUnlocked && !b.isUnlocked) return -1;
          if (!a.isUnlocked && b.isUnlocked) return 1;
          return 0;
        });
        break;
      case 'rarity':
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
        filtered.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    return filtered;
  }, [achievements, selectedFilter, searchQuery, showSecretAchievements, sortBy, getAchievementsByCategory]);

  const getCategoryStats = () => {
    const stats = {
      integration: { total: 0, unlocked: 0 },
      consistency: { total: 0, unlocked: 0 },
      secret: { total: 0, unlocked: 0 }
    };

    achievements.forEach(achievement => {
      stats[achievement.category].total++;
      if (achievement.isUnlocked) {
        stats[achievement.category].unlocked++;
      }
    });

    return stats;
  };

  const AchievementCard = ({ achievement }: { achievement: any }) => {
    const config = rarityConfig[achievement.rarity];
    const IconComponent = config.icon;

    return (
      <Card 
        className={cn(
          "group transition-all duration-500 hover:scale-[1.02] cursor-pointer relative overflow-hidden border-2",
          achievement.isUnlocked 
            ? `${isDarkMode ? config.shadowDark : config.shadow} shadow-lg border-transparent bg-gradient-to-br ${isDarkMode ? config.bgGradientDark : config.bgGradient}` 
            : "opacity-70 border-dashed border-muted-foreground/30 hover:opacity-90"
        )}
        onClick={() => setSelectedAchievement(achievement)}
      >
        {achievement.isUnlocked && (
          <div className={`absolute inset-0 bg-gradient-to-r ${config.color} opacity-5`} />
        )}
        
        <CardHeader className="pb-3 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "p-3 rounded-2xl flex items-center justify-center relative shadow-md transition-all duration-300 group-hover:scale-110",
                achievement.isUnlocked 
                  ? `bg-gradient-to-br ${config.color} shadow-lg` 
                  : "bg-muted"
              )}>
                {achievement.isUnlocked ? (
                  <span className="text-2xl filter drop-shadow-sm">{achievement.icon}</span>
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
                
                {achievement.isUnlocked && achievement.rarity === 'legendary' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <CardTitle className={cn(
                    "text-lg transition-colors duration-300",
                    achievement.isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {achievement.name}
                  </CardTitle>
                  {achievement.isSecret && (
                    <Badge variant="outline" className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 border-purple-200">
                      <Eye className="h-3 w-3 mr-1" />
                      Secreta
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs transition-all duration-300",
                      achievement.isUnlocked && `bg-gradient-to-r ${config.color} text-white border-transparent`
                    )}
                  >
                    <IconComponent className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {categoryLabels[achievement.category]}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <CardDescription className="text-sm leading-relaxed line-clamp-2">
            {achievement.description}
          </CardDescription>
        </CardContent>
      </Card>
    );
  };

  const categoryStats = getCategoryStats();

  return (
    <div className="space-y-8">
      {/* Header com estatísticas gerais */}
      <div className="text-center space-y-4">
        {/* Grid de estatísticas principais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
            <CardContent className="p-6 text-center relative">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {getUnlockedCount()}
              </div>
              <div className="text-sm text-muted-foreground">Desbloqueadas</div>
              <Medal className="h-6 w-6 mx-auto mt-2 text-blue-500" />
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/10 to-slate-500/10" />
            <CardContent className="p-6 text-center relative">
              <div className="text-3xl font-bold text-gray-600 mb-1">
                {getTotalCount() - getUnlockedCount()}
              </div>
              <div className="text-sm text-muted-foreground">Bloqueadas</div>
              <Lock className="h-6 w-6 mx-auto mt-2 text-gray-500" />
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
            <CardContent className="p-6 text-center relative">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {Math.round((getUnlockedCount() / getTotalCount()) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Progresso</div>
              <Target className="h-6 w-6 mx-auto mt-2 text-green-500" />
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10" />
            <CardContent className="p-6 text-center relative">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {achievements.filter(a => a.isUnlocked && a.rarity === 'legendary').length}
              </div>
              <div className="text-sm text-muted-foreground">Lendárias</div>
              <Crown className="h-6 w-6 mx-auto mt-2 text-yellow-500" />
            </CardContent>
          </Card>
        </div>
      </div>


      {/* Controles de filtro e busca */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Busca */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar conquistas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro por categoria */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="unlocked">Desbloqueadas</SelectItem>
                  <SelectItem value="locked">Bloqueadas</SelectItem>
                  <SelectItem value="integration">Integração</SelectItem>
                  <SelectItem value="consistency">Consistência</SelectItem>
                  <SelectItem value="secret">Secretas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="rarity">Por raridade</SelectItem>
                <SelectItem value="name">Por nome</SelectItem>
              </SelectContent>
            </Select>

            {/* Toggle conquistas secretas */}
            <Button
              variant="outline"
              onClick={() => setShowSecretAchievements(!showSecretAchievements)}
              className="flex items-center space-x-2"
            >
              {showSecretAchievements ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span>{showSecretAchievements ? 'Ocultar' : 'Mostrar'} Secretas</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid de conquistas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {getFilteredAchievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>

      {/* Estado vazio */}
      {getFilteredAchievements.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                <Trophy className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Nenhuma conquista encontrada
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  {searchQuery.trim() 
                    ? 'Tente ajustar os filtros ou buscar por outros termos.'
                    : 'Continue usando o Faltula para desbloquear novas conquistas!'}
                </p>
              </div>
              {searchQuery.trim() && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Limpar busca
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de detalhes da conquista */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-md [&>button]:focus:ring-0 [&>button]:focus:ring-offset-0 [&>button]:focus:bg-transparent">
          {selectedAchievement && (
            <>
               <DialogHeader>
                 <DialogTitle className="flex items-center space-x-3">
                   <div className={cn(
                     "p-3 rounded-2xl flex items-center justify-center relative shadow-md",
                     selectedAchievement.isUnlocked 
                       ? `bg-gradient-to-br ${rarityConfig[selectedAchievement.rarity].color} shadow-lg` 
                       : "bg-muted"
                   )}>
                     {selectedAchievement.isUnlocked ? (
                       <span className="text-2xl filter drop-shadow-sm">{selectedAchievement.icon}</span>
                     ) : (
                       <Lock className="h-6 w-6 text-muted-foreground" />
                     )}
                   </div>
                   <div>
                     <h3 className="text-xl font-bold">{selectedAchievement.name}</h3>
                     <div className="flex items-center space-x-2 mt-1">
                       <Badge 
                         variant="outline" 
                         className={cn(
                           "text-xs",
                           selectedAchievement.isUnlocked && `bg-gradient-to-r ${rarityConfig[selectedAchievement.rarity].color} text-white border-transparent`
                         )}
                       >
                         {rarityConfig[selectedAchievement.rarity].icon && 
                           React.createElement(rarityConfig[selectedAchievement.rarity].icon, { className: "h-3 w-3 mr-1" })
                         }
                         {rarityConfig[selectedAchievement.rarity].label}
                       </Badge>
                       <Badge variant="secondary" className="text-xs">
                         {categoryLabels[selectedAchievement.category]}
                       </Badge>
                     </div>
                   </div>
                 </DialogTitle>
               </DialogHeader>

              <div className="space-y-4">
                <DialogDescription className="text-sm leading-relaxed">
                  {selectedAchievement.description}
                </DialogDescription>

                {selectedAchievement.isSecret && (
                  <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                        Conquista Secreta
                      </span>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                      Esta conquista era um segredo até ser desbloqueada!
                    </p>
                  </div>
                )}

                {selectedAchievement.isUnlocked ? (
                  <div className="space-y-3">
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          🎉 Conquista Desbloqueada!
                        </span>
                        <div className="flex items-center space-x-1 text-green-600">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {new Date(selectedAchievement.unlockedAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedAchievement.experienceReward > 0 && (
                      <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            +{selectedAchievement.experienceReward} XP ganhos
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Lock className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Conquista ainda não desbloqueada
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Continue usando o Faltula para desbloquear esta conquista!
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ModernAchievementsManager;