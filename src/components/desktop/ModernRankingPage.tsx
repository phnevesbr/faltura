import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  TrendingUp, 
  Crown, 
  Sparkles,
  Target,
  Zap,
  Star,
  ChevronUp,
  ChevronDown,
  Flame
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

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

const ModernRankingPage: React.FC = () => {
  const { user } = useAuth();
  const { getTierInfo, userLevel } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

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
        .rpc('get_leaderboard_with_profiles', { limit_count: 10 });

      if (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Erro ao carregar ranking');
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
        const userInTop10 = formattedLeaderboard.find(u => u.user_id === user.id);
        if (userInTop10) {
          setUserPosition(userInTop10.position);
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
      case 1: return <Crown className="h-7 w-7 text-yellow-500" />;
      case 2: return <Medal className="h-7 w-7 text-gray-400" />;
      case 3: return <Award className="h-7 w-7 text-amber-600" />;
      default: return <span className="text-xl font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getRankGradient = (position: number) => {
    switch (position) {
      case 1: return "from-yellow-500/20 via-yellow-400/10 to-transparent";
      case 2: return "from-gray-400/20 via-gray-300/10 to-transparent";
      case 3: return "from-amber-600/20 via-amber-500/10 to-transparent";
      default: return "from-muted/50 to-transparent";
    }
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getPodiumPosition = (position: number) => {
    switch (position) {
      case 1: return "h-32";
      case 2: return "h-24";
      case 3: return "h-20";
      default: return "h-16";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const remainingUsers = leaderboard.slice(3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-3 bg-gradient-to-r from-primary/20 to-accent/20 px-6 py-3 rounded-full border border-primary/20">
          <Trophy className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ranking Global
          </h1>
          <Sparkles className="h-6 w-6 text-accent" />
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Descubra os melhores estudantes da plataforma e veja onde você está no ranking global!
        </p>
      </div>

      {/* User Position Card (if not in top 10) */}
      {userPosition && userPosition > 10 && userLevel && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-lg">Sua Posição Atual</div>
                  <div className="text-sm text-muted-foreground">
                    Continue jogando para subir no ranking!
                  </div>
                </div>
              </div>
              <div className="text-center">
                <Badge variant="outline" className="text-2xl px-4 py-2 mb-2">
                  #{userPosition}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Nível {userLevel.level} • {userLevel.total_experience.toLocaleString()} XP
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium - Top 3 */}
      {topThree.length > 0 && (
        <Card className="overflow-hidden bg-gradient-to-br from-background via-accent/5 to-primary/5">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <Crown className="h-6 w-6 text-yellow-500" />
              <span>Pódio dos Campeões</span>
              <Crown className="h-6 w-6 text-yellow-500" />
            </CardTitle>
            <CardDescription>Os 3 melhores estudantes da plataforma</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex items-end justify-center space-x-8">
              {/* Second Place */}
              {topThree[1] && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-gray-400">
                      {topThree[1].avatar && (
                        <AvatarImage src={topThree[1].avatar} alt="Avatar" />
                      )}
                      <AvatarFallback className="bg-gray-400 text-white text-lg font-bold">
                        {topThree[1].email ? getInitials(topThree[1].email) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 p-1 bg-gray-400 rounded-full">
                      <Medal className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className={cn("bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex flex-col items-center justify-end p-4 w-24", getPodiumPosition(2))}>
                    <span className="text-white font-bold text-lg">#2</span>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">
                      {topThree[1].email?.split('@')[0] || 'Usuário'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Nv. {topThree[1].level} • {topThree[1].total_experience.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              )}

              {/* First Place */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-yellow-500 shadow-lg shadow-yellow-500/25">
                    {topThree[0].avatar && (
                      <AvatarImage src={topThree[0].avatar} alt="Avatar" />
                    )}
                    <AvatarFallback className="bg-yellow-500 text-white text-xl font-bold">
                      {topThree[0].email ? getInitials(topThree[0].email) : '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-3 -right-3 p-2 bg-yellow-500 rounded-full animate-pulse">
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className={cn("bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex flex-col items-center justify-end p-4 w-24", getPodiumPosition(1))}>
                  <span className="text-white font-bold text-xl">#1</span>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-yellow-600">
                    {topThree[0].email?.split('@')[0] || 'Usuário'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nv. {topThree[0].level} • {topThree[0].total_experience.toLocaleString()} XP
                  </div>
                  <Badge className="mt-2 bg-yellow-500 text-white">
                    <Crown className="h-3 w-3 mr-1" />
                    Campeão
                  </Badge>
                </div>
              </div>

              {/* Third Place */}
              {topThree[2] && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-amber-600">
                      {topThree[2].avatar && (
                        <AvatarImage src={topThree[2].avatar} alt="Avatar" />
                      )}
                      <AvatarFallback className="bg-amber-600 text-white text-lg font-bold">
                        {topThree[2].email ? getInitials(topThree[2].email) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-2 -right-2 p-1 bg-amber-600 rounded-full">
                      <Award className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className={cn("bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg flex flex-col items-center justify-end p-4 w-24", getPodiumPosition(3))}>
                    <span className="text-white font-bold text-lg">#3</span>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">
                      {topThree[2].email?.split('@')[0] || 'Usuário'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Nv. {topThree[2].level} • {topThree[2].total_experience.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Remaining Rankings */}
      {remainingUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-primary" />
              Top 10 - Posições 4-10
            </CardTitle>
            <CardDescription>
              Continue subindo para chegar ao pódio!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {remainingUsers.map((leaderboardUser) => {
                const tierInfo = getTierInfo(leaderboardUser.current_tier);
                const isCurrentUser = leaderboardUser.user_id === user?.id;
                
                return (
                  <div
                    key={leaderboardUser.user_id}
                    className={cn(
                      "flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:shadow-md group",
                      `bg-gradient-to-r ${getRankGradient(leaderboardUser.position)}`,
                      isCurrentUser && "ring-2 ring-primary/50 bg-primary/5 shadow-lg",
                      "border border-border/50 hover:border-primary/30"
                    )}
                  >
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {getRankIcon(leaderboardUser.position)}
                    </div>
                    
                    <Avatar className="h-12 w-12 transition-transform group-hover:scale-110">
                      {leaderboardUser.avatar && (
                        <AvatarImage src={leaderboardUser.avatar} alt="Avatar" />
                      )}
                      <AvatarFallback className={cn("text-white font-semibold", tierInfo.color)}>
                        {leaderboardUser.email ? getInitials(leaderboardUser.email) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="font-semibold text-base truncate">
                          {leaderboardUser.email?.split('@')[0] || 'Usuário Anônimo'}
                        </div>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">Você</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        {leaderboardUser.course || 'Curso não informado'}
                      </div>
                      <Badge variant="outline" className={cn("text-xs", tierInfo.color)}>
                        {tierInfo.name}
                      </Badge>
                    </div>
                    
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-primary">Nv. {leaderboardUser.level}</div>
                      <div className="text-sm text-muted-foreground">
                        {leaderboardUser.total_experience.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Real-time indicator */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <Flame className="h-4 w-4" />
          <span>Atualizado em tempo real</span>
        </div>
      </div>
    </div>
  );
};

export default ModernRankingPage;