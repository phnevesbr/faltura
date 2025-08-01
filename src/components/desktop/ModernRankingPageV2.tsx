import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
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
  Flame,
  Search,
  Filter,
  Calendar,
  BarChart3,
  Gauge,
  Eye,
  EyeOff,
  Gift
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useAuth } from '../../contexts/AuthContext';
import { useGamification } from '../../contexts/GamificationContext';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

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

interface RankingStats {
  totalUsers: number;
  avgLevel: number;
  topTier: string;
  weeklyGrowth: number;
}

const ModernRankingPageV2: React.FC = () => {
  const { user } = useAuth();
  const { getTierInfo, userLevel } = useGamification();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [allLeaderboard, setAllLeaderboard] = useState<LeaderboardUser[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState<RankingStats | null>(null);
  const [showUserCard, setShowUserCard] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5; // Mostrar apenas 5 usuários por página
  const maxPages = 6; // Até página 6

  useEffect(() => {
    loadLeaderboard();
    loadStats();
    
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_levels'
      }, () => {
        loadLeaderboard();
        loadStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      
      // Load top 30 users (6 páginas × 5 usuários)
      const { data: topUsers, error } = await supabase
        .rpc('get_leaderboard_with_profiles', { limit_count: 30 });

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

      setAllLeaderboard(formattedLeaderboard);

      // Find user position
      if (user) {
        const userInLeaderboard = formattedLeaderboard.find(u => u.user_id === user.id);
        if (userInLeaderboard) {
          setUserPosition(userInLeaderboard.position);
        } else {
          // Get user rank from all users
          const { data: userRank } = await supabase
            .rpc('get_user_rank', { target_user_id: user.id });
          setUserPosition(userRank || null);
        }
      }
    } catch (error) {
      console.error('Error in loadLeaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('level, current_tier');
      
      if (error) throw error;

      const totalUsers = data.length;
      const avgLevel = data.reduce((sum, user) => sum + user.level, 0) / totalUsers;
      const tierCounts = data.reduce((acc: any, user) => {
        acc[user.current_tier] = (acc[user.current_tier] || 0) + 1;
        return acc;
      }, {});
      
      const topTier = Object.entries(tierCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'calouro';

      setStats({
        totalUsers,
        avgLevel: Math.round(avgLevel),
        topTier,
        weeklyGrowth: Math.floor(Math.random() * 15) + 5 // Mock data
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1: 
        return (
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative"
          >
            <Crown className="h-8 w-8 text-yellow-500" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
          </motion.div>
        );
      case 2: return <Medal className="h-7 w-7 text-gray-400" />;
      case 3: return <Award className="h-7 w-7 text-amber-600" />;
      default: 
        return (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <span className="text-sm font-bold text-slate-600">#{position}</span>
          </div>
        );
    }
  };

  const getRankGradient = (position: number) => {
    switch (position) {
      case 1: return "from-yellow-500/30 via-yellow-400/20 to-yellow-300/10";
      case 2: return "from-gray-400/30 via-gray-300/20 to-gray-200/10";
      case 3: return "from-amber-600/30 via-amber-500/20 to-amber-400/10";
      default: return "from-primary/10 via-primary/5 to-transparent";
    }
  };

  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const filterUsers = (users: LeaderboardUser[]) => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.course?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  // Calcular usuários para a página atual
  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;
  const displayedUsers = filterUsers(allLeaderboard).slice(startIndex, endIndex);

  const nextPage = () => {
    if (currentPage < maxPages) {
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
      <div className="space-y-6">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Trophy className="h-12 w-12 text-primary mb-4" />
          </motion.div>
          <p className="text-muted-foreground">Carregando ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Roxo - Similar às imagens */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl"
              >
                <Trophy className="h-8 w-8 text-yellow-300" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold">Ranking Global</h1>
                <p className="text-white/80 text-lg">
                  Competição acadêmica em tempo real
                </p>
              </div>
            </div>
            
            {stats && (
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <div className="text-sm text-white/70">Estudantes</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <div className="text-2xl font-bold">Nv.{stats.avgLevel}</div>
                  <div className="text-sm text-white/70">Nível Médio</div>
                </div>
              </div>
            )}
          </div>

          {/* Live Indicator */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2 bg-green-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Ao Vivo</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">+{stats?.weeklyGrowth}% esta semana</span>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-4 right-20 w-6 h-6 bg-yellow-400/30 rounded-full"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute bottom-8 right-12 w-4 h-4 bg-pink-400/30 rounded-full"
        />
      </div>

      {/* User Position Card */}
      {userPosition && userLevel && showUserCard && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Card className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 border-primary/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <Avatar className="h-16 w-16 border-4 border-primary/20">
                      {/* Priorizar avatar do perfil, depois metadados do usuário */}
                      {userLevel && allLeaderboard.find(u => u.user_id === user?.id)?.avatar ? (
                        <AvatarImage src={allLeaderboard.find(u => u.user_id === user?.id)?.avatar} alt="Avatar" />
                      ) : user?.user_metadata?.avatar_url ? (
                        <AvatarImage src={user.user_metadata.avatar_url} alt="Avatar" />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                        {user?.email ? getInitials(user.email) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 p-1 bg-primary rounded-full">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold">Sua Posição</h3>
                      <Badge variant="outline" className="text-lg px-3 py-1">
                        #{userPosition}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Gauge className="h-4 w-4" />
                        Nível {userLevel.level}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        {userLevel.total_experience.toLocaleString()} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        {getTierInfo(userLevel.current_tier).name}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUserCard(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Campo de Busca */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar estudante..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Ranking Completo */}
      <Card className="overflow-hidden border border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">
                  Ranking Completo
                </CardTitle>
                <CardDescription className="text-sm">
                  Todos os estudantes classificados por experiência
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-muted-foreground">
                {allLeaderboard.length} estudantes
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-3">
            <AnimatePresence>
              {displayedUsers.map((rankUser, index) => {
                const tierInfo = getTierInfo(rankUser.current_tier);
                const isCurrentUser = rankUser.user_id === user?.id;
                
                return (
                  <motion.div
                    key={rankUser.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center space-x-4 p-4 rounded-2xl transition-all duration-300 hover:shadow-lg group border",
                      `bg-gradient-to-r ${getRankGradient(rankUser.position)}`,
                      isCurrentUser && "ring-2 ring-primary/50 bg-primary/10 shadow-xl scale-[1.02]",
                      "border-border/50 hover:border-primary/30"
                    )}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex-shrink-0 w-12 flex items-center justify-center">
                      {getRankIcon(rankUser.position)}
                    </div>
                    
                    <Avatar className="h-14 w-14 transition-transform group-hover:scale-110 border-2 border-background shadow-md">
                      {rankUser.avatar && (
                        <AvatarImage src={rankUser.avatar} alt="Avatar" />
                      )}
                      <AvatarFallback className={cn("text-white font-semibold text-lg", tierInfo.color)}>
                        {rankUser.email ? getInitials(rankUser.email) : '??'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center space-x-3">
                        <div className="font-bold text-lg truncate">
                          {rankUser.email?.split('@')[0] || 'Usuário Anônimo'}
                        </div>
                        {isCurrentUser && (
                          <Badge className="bg-purple-600 text-white">
                            Você
                          </Badge>
                        )}
                        {rankUser.position <= 5 && (
                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Star className="h-3 w-3 mr-1" />
                            Elite
                          </Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        {rankUser.course || 'Curso não informado'}
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className={cn("text-xs font-medium", tierInfo.color)}>
                          {tierInfo.name}
                        </Badge>
                        
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Gauge className="h-3 w-3" />
                            Nv. {rankUser.level}
                          </span>
                          <span className="flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            {rankUser.total_experience.toLocaleString()} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex-shrink-0 space-y-1">
                      <div className="text-2xl font-bold text-purple-600">#{rankUser.position}</div>
                      {rankUser.position <= 10 && (
                        <div className="text-xs text-green-600 font-medium">
                          TOP 10
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Navegação entre páginas */}
          <div className="flex items-center justify-center space-x-4 mt-6 pt-4 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevPage}
              disabled={currentPage === 1}
              className="hover:border-purple-300"
            >
              <ChevronDown className="h-4 w-4 mr-1 rotate-90" />
              Anterior
            </Button>
            
            <div className="flex items-center space-x-2">
              {Array.from({ length: maxPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 p-0",
                    page === currentPage && "bg-purple-600 text-white"
                  )}
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextPage}
              disabled={currentPage === maxPages}
              className="hover:border-purple-300"
            >
              Próxima
              <ChevronDown className="h-4 w-4 ml-1 -rotate-90" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Show User Card Toggle */}
      {!showUserCard && userPosition && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed bottom-6 right-6"
        >
          <Button
            onClick={() => setShowUserCard(true)}
            className="rounded-full shadow-lg"
            size="lg"
          >
            <Eye className="h-4 w-4 mr-2" />
            Minha Posição
          </Button>
        </motion.div>
      )}

      {/* Real-time Status */}
      <div className="text-center">
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-flex items-center space-x-2 text-sm text-muted-foreground bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-3 rounded-full border border-green-200"
        >
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <Flame className="h-4 w-4 text-green-600" />
          <span className="text-green-700 font-medium">Ranking atualizado em tempo real</span>
          <Sparkles className="h-4 w-4 text-green-600" />
        </motion.div>
      </div>
    </div>
  );
};

export default ModernRankingPageV2;