import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  TrendingUp, 
  Crown, 
  Star,
  Zap,
  Flame,
  Target,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { cn } from '../../lib/utils';

interface LeaderboardUser {
  user_id: string;
  level: number;
  total_experience: number;
  current_tier: string;
  email?: string;
  course?: string;
  avatar?: string;
  position: number;
}

const MobileRankingLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const { getTierInfo, userLevel } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    
    // Configurar realtime para atualizar ranking em tempo real
    const channel = supabase
      .channel('mobile-leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_levels'
      }, () => {
        loadLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Usar a função RPC get_leaderboard_with_profiles
      const { data: topUsers, error } = await supabase
        .rpc('get_leaderboard_with_profiles', { limit_count: 20 });

      if (error) {
        console.error('Error loading leaderboard:', error);
        setLoading(false);
        return;
      }

      // Formatar dados e adicionar posições
      const formattedLeaderboard = (topUsers || []).map((user: any, index) => ({
        user_id: user.user_id,
        level: user.level,
        total_experience: user.total_experience,
        current_tier: user.current_tier,
        email: user.email,
        course: user.course,
        avatar: user.avatar,
        position: index + 1
      }));

      setLeaderboard(formattedLeaderboard);

      // Buscar posição do usuário atual
      if (user) {
        const userInTop20 = formattedLeaderboard.find(u => u.user_id === user.id);
        if (userInTop20) {
          setUserPosition(userInTop20.position);
        } else {
          // Usar função RPC para obter posição do usuário
          const { data: position } = await supabase
            .rpc('get_user_rank', { target_user_id: user.id });
          setUserPosition(position);
        }
      }
    } catch (error) {
      console.error('Error in loadLeaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-bold text-muted-foreground">#{position}</span>
          </div>
        );
    }
  };

  const getRankColor = (position: number) => {
    // Todos os cards com fundo branco
    return "border-border bg-white shadow-sm hover:shadow-md";
  };

  const getPositionBadge = (position: number) => {
    if (position <= 3) {
      const colors = {
        1: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
        2: "bg-gradient-to-r from-gray-400 to-slate-500 text-white", 
        3: "bg-gradient-to-r from-amber-600 to-orange-600 text-white"
      };
      return colors[position as keyof typeof colors];
    }
    return "bg-muted text-muted-foreground";
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        {/* Header Skeleton */}
        <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-secondary/5">
          <CardHeader>
            <div className="h-6 bg-muted rounded animate-pulse mb-2" />
            <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
          </CardHeader>
        </Card>
        
        {/* Items Skeleton */}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded w-16" />
                    <div className="h-3 bg-muted rounded w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header moderno */}
      <Card className="overflow-hidden bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-primary/20">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center text-primary">
                <Trophy className="h-6 w-6 mr-3 text-yellow-500" />
                Ranking Global
              </CardTitle>
              <CardDescription className="text-base mt-2 text-muted-foreground">
                Top 20 usuários com maior experiência
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
          </div>

          {/* Sua posição atual (se não estiver no top 20) */}
          {userPosition && userPosition > 20 && (
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-center justify-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Sua posição atual: #{userPosition}
                </span>
              </div>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Top 3 destacados */}
      {leaderboard.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {leaderboard.slice(0, 3).map((leaderboardUser, index) => {
            const tierInfo = getTierInfo(leaderboardUser.current_tier);
            const isCurrentUser = leaderboardUser.user_id === user?.id;
            const position = index + 1;
            
            return (
              <Card
                key={leaderboardUser.user_id}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:scale-105",
                  getRankColor(position),
                  isCurrentUser && "ring-2 ring-primary/50"
                )}
              >
                <CardContent className="p-3 text-center">
                  {/* Posição */}
                  <div className="flex justify-center mb-2">
                    {getRankIcon(position)}
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative mx-auto mb-2">
                    <Avatar className={cn("h-12 w-12 mx-auto border-2", position === 1 ? "border-yellow-500" : position === 2 ? "border-gray-400" : "border-amber-600")}>
                      {leaderboardUser.avatar ? (
                        <img 
                          src={leaderboardUser.avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className={cn("text-white text-sm font-bold", tierInfo.color)}>
                          {leaderboardUser.email ? getInitials(leaderboardUser.email) : '??'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {isCurrentUser && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Star className="h-2 w-2 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Nome */}
                  <div className="font-bold text-xs truncate mb-1">
                    {leaderboardUser.email?.split('@')[0] || 'Usuário'}
                  </div>
                  
                  {/* Level e XP */}
                  <div className="space-y-1">
                    <Badge variant="secondary" className="text-xs px-2 py-1">
                      Nv. {leaderboardUser.level}
                    </Badge>
                    <div className="text-xs text-muted-foreground font-medium">
                      {leaderboardUser.total_experience.toLocaleString()} XP
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Lista completa */}
      <div className="space-y-3">
        {leaderboard.map((leaderboardUser) => {
          const tierInfo = getTierInfo(leaderboardUser.current_tier);
          const isCurrentUser = leaderboardUser.user_id === user?.id;
          const isTopThree = leaderboardUser.position <= 3;
          
          return (
            <Card
              key={leaderboardUser.user_id}
              className={cn(
                "transition-all duration-300",
                getRankColor(leaderboardUser.position),
                isCurrentUser && "ring-2 ring-primary/60 bg-primary/5 border-primary/30"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  {/* Posição */}
                  <div className="flex-shrink-0 flex items-center justify-center">
                    {isTopThree ? getRankIcon(leaderboardUser.position) : (
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "h-8 w-8 rounded-full p-0 flex items-center justify-center text-xs font-bold",
                          getPositionBadge(leaderboardUser.position)
                        )}
                      >
                        #{leaderboardUser.position}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      {leaderboardUser.avatar ? (
                        <img 
                          src={leaderboardUser.avatar} 
                          alt="Avatar" 
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <AvatarFallback className={cn("text-white text-sm font-bold", tierInfo.color)}>
                          {leaderboardUser.email ? getInitials(leaderboardUser.email) : '??'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    
                    {/* Badge do tier */}
                    <div className={cn(
                      "absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 border-background",
                      tierInfo.color
                    )}>
                      {tierInfo.emoji}
                    </div>
                  </div>
                  
                  {/* Informações do usuário */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="font-bold text-sm truncate">
                        {leaderboardUser.email?.split('@')[0] || 'Usuário'}
                      </div>
                      {isCurrentUser && (
                        <Badge variant="default" className="text-xs px-2 py-0 bg-primary">
                          <Star className="h-3 w-3 mr-1" />
                          Você
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {leaderboardUser.course || 'Curso não informado'}
                    </div>
                    <div className="flex items-center space-x-1 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {tierInfo.name}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center space-x-1 mb-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span className="text-lg font-bold text-primary">
                        {leaderboardUser.level}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium">
                      {leaderboardUser.total_experience.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer com informações */}
      <Card className="bg-gradient-to-r from-muted/50 to-muted/30 border-dashed">
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Flame className="h-4 w-4 text-orange-500" />
            <span>Competindo com</span>
            <Badge variant="outline">{leaderboard.length}</Badge>
            <span>usuários ativos</span>
          </div>
          <div className="flex items-center justify-center space-x-1 mt-2 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Atualizado em tempo real</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileRankingLeaderboard;