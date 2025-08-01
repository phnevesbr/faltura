import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Edit, Settings, Mail, User, MapPin, Star, Clock } from 'lucide-react';
import AvatarUpload from '../AvatarUpload';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { useThemeColors } from '../../hooks/useThemeColors';
import { useProfile } from '../../contexts/ProfileContext';

interface ProfileHeaderProps {
  profile: any;
  isEditing: boolean;
  onEditToggle: () => void;
  onSettingsClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isEditing,
  onEditToggle,
  onSettingsClick
}) => {
  const { user } = useAuth();
  const { userLevel, getTierInfo, getXpForNextLevel } = useGamification();
  const { getCurrentTheme } = useThemeColors();
  const { profile: userProfile } = useProfile();

  const tierInfo = userLevel ? getTierInfo(userLevel.current_tier) : getTierInfo('calouro');
  const currentTheme = getCurrentTheme(); // Força re-render quando tema muda

  // Usar a função correta para calcular XP restante
  const xpForNextLevel = getXpForNextLevel();
  
  // Calcular porcentagem de progresso corretamente
  const calculateLevelProgress = () => {
    if (!userLevel) return 0;
    
    const currentLevel = userLevel.level;
    const totalXp = userLevel.total_experience;
    
    // Calculate XP needed for current level and next level
    let xpForCurrentLevel: number;
    let xpForNextLevelTotal: number;
    
    if (currentLevel <= 10) {
      xpForCurrentLevel = (currentLevel - 1) * 100;
      xpForNextLevelTotal = currentLevel * 100;
    } else if (currentLevel <= 25) {
      xpForCurrentLevel = 1000 + (currentLevel - 11) * 267;
      xpForNextLevelTotal = 1000 + (currentLevel - 10) * 267;
    } else if (currentLevel <= 50) {
      xpForCurrentLevel = 5000 + (currentLevel - 26) * 400;
      xpForNextLevelTotal = 5000 + (currentLevel - 25) * 400;
    } else {
      xpForCurrentLevel = 15000 + (currentLevel - 51) * 800;
      xpForNextLevelTotal = 15000 + (currentLevel - 50) * 800;
    }
    
    const xpInCurrentLevel = totalXp - xpForCurrentLevel;
    const xpNeededForLevel = xpForNextLevelTotal - xpForCurrentLevel;
    
    return Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100));
  };
  
  const levelProgress = calculateLevelProgress();
  
  // Dados do perfil calculados para renderização

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-background via-background to-accent/5 border border-border/50 shadow-xl backdrop-blur-sm">
      <CardContent className="p-0">
        {/* Header com gradiente e badge */}
        <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/5 p-6 pb-4">
          {/* Badge "Lenda" posicionado no topo direito */}
          {userLevel && (
            <div className="absolute top-4 right-4">
                <Badge className="bg-primary text-primary-foreground border-0 shadow-lg px-4 py-1.5 rounded-full font-bold text-sm hover:shadow-xl transition-all duration-300">
                  🏅 {tierInfo.name}
                </Badge>
            </div>
          )}

          {/* Layout principal compacto */}
          <div className="flex items-center gap-6">
            {/* Avatar com badge de nível */}
            <div className="relative">
              <div className="relative">
                <AvatarUpload size="lg" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 pointer-events-none"></div>
              </div>
              {userLevel && (
                <Badge className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground border-2 border-background shadow-lg text-sm font-bold px-3 py-1.5 rounded-full min-w-[3rem] h-9 flex items-center justify-center hover:scale-105 transition-transform duration-200">
                  🏅 {userLevel.level}
                </Badge>
              )}
            </div>

            {/* Informações compactas do perfil */}
            <div className="flex-1">
              {/* Nome e XP na mesma linha */}
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-2xl font-bold text-foreground">
                  {userProfile?.name || profile?.name || user?.user_metadata?.name || 'Usuário'}
                </h1>
                {userLevel && (
                  <div className="flex items-center gap-2 bg-gradient-to-r from-primary/20 to-accent/20 px-3 py-1.5 rounded-full border border-primary/30">
                    <Star className="h-4 w-4 text-primary" />
                    <span className="text-lg font-bold text-primary">
                      {userLevel.total_experience.toLocaleString()} XP
                    </span>
                  </div>
                )}
              </div>

              {/* Informações secundárias em grid compacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{user?.email}</span>
                </div>
                
                {profile?.course && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.course}</span>
                  </div>
                )}
                
                {profile?.university && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{profile.university}</span>
                  </div>
                )}
                
                {profile?.shift && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {profile.shift === 'morning' ? 'Manhã' : 
                       profile.shift === 'afternoon' ? 'Tarde' : 
                       profile.shift === 'evening' || profile.shift === 'night' ? 'Noite' : profile.shift}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Painel lateral compacto */}
            <div className="flex flex-col items-end gap-3">
              {/* Botões mais compactos */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSettingsClick}
                  className="gap-1.5 px-3 py-2 h-8 bg-background/80 hover:bg-background border-border/50 text-xs font-medium"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Configurações
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditToggle}
                  className="gap-1.5 px-3 py-2 h-8 text-primary border-primary/20 hover:bg-primary/10 bg-background/80 text-xs font-medium"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de progresso destacada */}
        {userLevel && userLevel.level_progress !== undefined && (
          <div className="px-6 py-4 bg-background/50">
            <div className="space-y-2">
              {/* Header do progresso */}
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-foreground">Nível {userLevel.level}</span>
                <span className="text-sm font-bold text-primary">{Math.round(levelProgress)}%</span>
              </div>
              
              {/* Barra de progresso com gradiente */}
              <div className="relative h-3 bg-muted rounded-full overflow-hidden shadow-inner">
                <div 
                  className="absolute inset-y-0 left-0 bg-primary transition-all duration-700 ease-out rounded-full shadow-sm"
                  style={{ width: `${Math.min(levelProgress, 100)}%` }}
                />
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/20 to-transparent rounded-full" 
                     style={{ width: `${Math.min(levelProgress, 100)}%` }}></div>
              </div>
              
              {/* Informações do próximo nível */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  Próximo: {userLevel.level + 1}
                </span>
                <span className="text-xs font-bold text-primary">
                  {xpForNextLevel} XP restantes
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;