import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { 
  Trophy, 
  Medal, 
  Award, 
  Users, 
  TrendingUp, 
  Crown, 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight,
  Sparkles,
  Target,
  Flame 
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { useGamification } from '../contexts/GamificationContext';
import { cn } from '../lib/utils';
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

const RankingPage: React.FC = () => {
  const { user } = useAuth();
  const { getTierInfo } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const totalPages = 2; // Top 10 e Top 20

  useEffect(() => {
    loadLeaderboard();
    
    // Configurar realtime para atualizar ranking em tempo real
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
      
      // Buscar top 20 usuários por total_experience
      const { data: topUsers, error } = await supabase
        .rpc('get_leaderboard_with_profiles', { limit_count: 20 });

      if (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Erro ao carregar ranking: ' + error.message);
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

      // Buscar posição do usuário atual se não estiver no top 20
      if (user) {
        const userInTop20 = formattedLeaderboard.find(u => u.user_id === user.id);
        if (userInTop20) {
          setUserPosition(userInTop20.position);
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
      case 1: return "border-yellow-500/50 bg-gradient-to-r from-yellow-500/10 to-transparent";
      case 2: return "border-gray-400/50 bg-gradient-to-r from-gray-400/10 to-transparent";
      case 3: return "border-amber-600/50 bg-gradient-to-r from-amber-600/10 to-transparent";
      default: return "border-border/50 hover:border-primary/30";
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

  // Calcular usuários para a página atual
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const currentUsers = leaderboard.slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Carregando ranking...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract top 3 for podium display
  const topThree = currentPage === 1 ? currentUsers.slice(0, 3) : [];
  const remainingUsers = currentPage === 1 
    ? currentUsers.slice(3) 
    : currentUsers;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Ranking Global
            </h1>
            <p className="text-muted-foreground">
              Confira os melhores jogadores da plataforma
            </p>
          </div>
        </div>
        
        <div className="hidden sm:flex items-center p-2 rounded-full bg-muted/50">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm text-muted-foreground">Atualizado em tempo real</span>
        </div>
      </div>

      {/* User's position if not in top ranks */}
      {userPosition && userPosition > 10 && (
        <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 overflow-hidden">
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
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Podium - Top 3 (only on first page) */}
      {currentPage === 1 && topThree.length >= 3 && (
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
              {topThree[0] && (
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
              )}

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

      {/* Ranking List */}
      <Card className="overflow-hidden border border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Trophy className="h-6 w-6 mr-2 text-yellow-500" />
              <span>
                Top {currentPage === 1 ? '10' : '20'} - Página {currentPage}
              </span>
              {currentPage === 1 && <Sparkles className="h-5 w-5 ml-2 text-accent" />}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevPage}
                disabled={currentPage === 1}
                className="hover:border-primary/50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} de {totalPages}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="hover:border-primary/50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {currentPage === 1 
              ? currentPage === 1 && topThree.length >= 3 
                ? "Posições 4-10 do ranking global" 
                : "Os 10 melhores jogadores da plataforma"
              : "Posições 11-20 do ranking global"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {remainingUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado no ranking ainda.</p>
                <p className="text-sm">Complete algumas atividades para aparecer aqui!</p>
              </div>
            ) : (
              remainingUsers.map((leaderboardUser) => {
                const tierInfo = getTierInfo(leaderboardUser.current_tier);
                const isCurrentUser = leaderboardUser.user_id === user?.id;
                const isTopThree = leaderboardUser.position <= 3;
                
                return (
                  <div
                    key={leaderboardUser.user_id}
                    className={cn(
                      "flex items-center space-x-4 p-4 rounded-xl transition-all duration-300 hover:shadow-md group",
                      getRankColor(leaderboardUser.position),
                      isCurrentUser && "ring-2 ring-primary/50 bg-primary/5 shadow-lg",
                      "border border-border/50"
                    )}
                  >
                    <div className="flex-shrink-0 w-10 flex items-center justify-center">
                      {getRankIcon(leaderboardUser.position)}
                    </div>
                    
                    <Avatar className="h-12 w-12 transition-transform group-hover:scale-110">
                      {leaderboardUser.avatar && (
                        <AvatarImage src={leaderboardUser.avatar} alt="Avatar" />
                      )}
                      <AvatarFallback className={cn("text-white", tierInfo.color)}>
                        {leaderboardUser.email ? getInitials(leaderboardUser.email) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="font-semibold text-base truncate">
                          {leaderboardUser.email?.split('@')[0] || 'Usuário Anônimo'}
                        </div>
                        {isCurrentUser && (
                          <Badge variant="secondary" className="text-xs">Você</Badge>
                        )}
                        {isTopThree && (
                          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                            Top 3
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {leaderboardUser.course || 'Curso não informado'}
                      </div>
                      <Badge variant="secondary" className={cn("text-xs mt-1", tierInfo.color)}>
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
              })
            )}
          </div>
          
          {/* Real-time indicator - Bottom */}
          <div className="mt-6 pt-4 border-t text-center">
            <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Flame className="h-4 w-4" />
              <span>Atualizado em tempo real</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingPage;