import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { Trophy, Medal, Award, Users, TrendingUp, Crown, Star, Zap, Target, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { useRankingSystem } from '../hooks/useRankingSystem';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';

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

const RankingLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const { getTierInfo, userLevel } = useGamification();
  const { formatTitleDisplay, getMaxLevel } = useRankingSystem();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadLeaderboard();
    
    const channel = supabase
      .channel('leaderboard-updates')
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
      
      const { data: topUsers, error } = await supabase
        .rpc('get_leaderboard_with_profiles', { limit_count: 50 });

      if (error) {
        console.error('Error loading leaderboard:', error);
        toast('Erro ao carregar ranking: ' + error.message);
        return;
      }

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

      if (user) {
        const userInLeaderboard = formattedLeaderboard.find(u => u.user_id === user.id);
        if (userInLeaderboard) {
          setUserPosition(userInLeaderboard.position);
        } else {
          const { data: allUsers } = await supabase
            .from('user_levels')
            .select('user_id, total_experience')
            .order('total_experience', { ascending: false });
          
          const userIndex = allUsers?.findIndex(u => u.user_id === user.id);
          setUserPosition(userIndex !== undefined && userIndex >= 0 ? userIndex + 1 : null);
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
      case 1: return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getRankColor = (position: number) => {
    switch (position) {
      case 1: return "bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200";
      case 2: return "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200";
      case 3: return "bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200";
      default: return "bg-gradient-to-r from-background to-muted/30";
    }
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const displayedUsers = showAll ? leaderboard : leaderboard.slice(0, 10);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            Carregando ranking...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          🏆 Ranking Global
        </h1>
        <p className="text-muted-foreground">
          Veja onde você está entre os melhores estudantes da plataforma
        </p>
      </div>

      {/* User Position Card */}
      {user && userPosition && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Sua Posição Atual</p>
                  <p className="text-sm text-muted-foreground">
                    {userLevel ? `Nível ${userLevel.level} • ${userLevel.total_experience} XP` : 'Carregando...'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">#{userPosition}</p>
                <p className="text-xs text-muted-foreground">de {leaderboard.length}+</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Estudantes
          </CardTitle>
          <CardDescription>
            Os estudantes com maior experiência na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado no ranking ainda.</p>
              <p className="text-sm">Complete algumas atividades para aparecer aqui!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <ScrollArea className={displayedUsers.length > 10 ? "h-[500px]" : "h-auto"}>
                <div className="space-y-3 pr-4">
                  {displayedUsers.map((leaderboardUser) => {
                    const tierInfo = getTierInfo(leaderboardUser.current_tier);
                    const isCurrentUser = leaderboardUser.user_id === user?.id;
                    const isTopThree = leaderboardUser.position <= 3;
                    
                    return (
                      <div
                        key={leaderboardUser.user_id}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md",
                          getRankColor(leaderboardUser.position),
                          isCurrentUser && "ring-2 ring-primary/50 shadow-lg scale-[1.02]",
                          isTopThree && "shadow-lg"
                        )}
                      >
                        <div className="flex-shrink-0 w-12 flex items-center justify-center">
                          {getRankIcon(leaderboardUser.position)}
                        </div>
                        
                        <Avatar className={cn("h-12 w-12", isTopThree && "ring-2 ring-offset-2", 
                          leaderboardUser.position === 1 && "ring-yellow-400",
                          leaderboardUser.position === 2 && "ring-gray-400",
                          leaderboardUser.position === 3 && "ring-amber-400")}>
                          {leaderboardUser.avatar && (
                            <AvatarImage src={leaderboardUser.avatar} alt="Avatar" />
                          )}
                          <AvatarFallback className={cn("text-white font-medium", tierInfo.color)}>
                            {leaderboardUser.email ? getInitials(leaderboardUser.email) : '??'}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="font-semibold truncate">
                              {leaderboardUser.email?.split('@')[0] || 'Usuário Anônimo'}
                            </div>
                            {isCurrentUser && (
                              <Badge variant="default" className="text-xs">Você</Badge>
                            )}
                            {isTopThree && (
                              <Badge variant="secondary" className="text-xs">
                                {leaderboardUser.position === 1 ? '👑' : leaderboardUser.position === 2 ? '🥈' : '🥉'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {leaderboardUser.course || 'Curso não informado'}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: formatTitleDisplay(leaderboardUser.level).color + '20',
                                borderColor: formatTitleDisplay(leaderboardUser.level).color,
                                color: formatTitleDisplay(leaderboardUser.level).color
                              }}
                            >
                              {formatTitleDisplay(leaderboardUser.level).title}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="font-bold text-lg">Nv. {leaderboardUser.level}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {leaderboardUser.total_experience.toLocaleString()} XP
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              {leaderboard.length > 10 && (
                <div className="text-center pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={() => setShowAll(!showAll)}
                    className="gap-2"
                  >
                    {showAll ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Mostrar apenas Top 10
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver todos os {leaderboard.length} usuários
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Atualizado em tempo real</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingLeaderboard;