import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { TrendingUp, Users, Trophy, PieChart, BarChart3 } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface AdminStats {
  total_users: number;
  active_users_today: number;
  total_classes: number;
  total_subjects: number;
  total_absences: number;
  total_notes: number;
  banned_users: number;
  users_by_tier: Record<string, number>;
}

interface AdvancedChartsProps {
  stats: AdminStats | null;
}

const AdvancedCharts: React.FC<AdvancedChartsProps> = ({ stats }) => {
  const tierColors = {
    calouro: { color: 'bg-gray-500', bgColor: 'bg-gray-100', textColor: 'text-gray-700' },
    veterano: { color: 'bg-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
    expert: { color: 'bg-purple-500', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
    lenda: { color: 'bg-yellow-500', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'calouro': return '🌱';
      case 'veterano': return '⚡';
      case 'expert': return '🔥';
      case 'lenda': return '👑';
      default: return '📊';
    }
  };

  if (!stats?.users_by_tier) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5" />
            <span>Distribuição de Usuários</span>
          </CardTitle>
          <CardDescription>Dados não disponíveis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Carregando dados de distribuição...
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTierUsers = Object.values(stats.users_by_tier).reduce((sum, count) => sum + count, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* User Distribution by Tier */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Distribuição por Tier</CardTitle>
                <CardDescription>Progresso dos usuários na gamificação</CardDescription>
              </div>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              {totalTierUsers} usuários
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Tier Breakdown */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats.users_by_tier).map(([tier, count]) => {
                const config = tierColors[tier as keyof typeof tierColors];
                const percentage = totalTierUsers > 0 ? (count / totalTierUsers * 100) : 0;
                
                return (
                  <div 
                    key={tier} 
                    className={cn(
                      "relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg cursor-pointer",
                      config?.bgColor || "bg-gray-100"
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getTierIcon(tier)}</span>
                        <span className={cn("font-semibold capitalize", config?.textColor)}>
                          {tier}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {percentage.toFixed(1)}%
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div className={cn("text-3xl font-bold", config?.textColor)}>
                        {count}
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-white/80 rounded-full h-2 overflow-hidden">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-1000", config?.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual representation */}
            <div className="mt-8">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">Distribuição Visual</h4>
              <div className="flex h-4 bg-muted rounded-lg overflow-hidden">
                {Object.entries(stats.users_by_tier).map(([tier, count]) => {
                  const config = tierColors[tier as keyof typeof tierColors];
                  const percentage = totalTierUsers > 0 ? (count / totalTierUsers * 100) : 0;
                  
                  return (
                    <div
                      key={tier}
                      className={cn("transition-all duration-1000 hover:opacity-80", config?.color)}
                      style={{ width: `${percentage}%` }}
                      title={`${tier}: ${count} usuários (${percentage.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engagement Metrics */}
      <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Métricas de Engajamento</CardTitle>
                <CardDescription>Atividade e participação dos usuários</CardDescription>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800">
              <TrendingUp className="h-3 w-3 mr-1" />
              Crescendo
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Engagement stats */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-blue-900">Taxa de Atividade</div>
                    <div className="text-sm text-blue-700">Usuários ativos hoje</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.total_users > 0 ? Math.round((stats.active_users_today / stats.total_users) * 100) : 0}%
                  </div>
                  <div className="text-xs text-blue-600">
                    {stats.active_users_today} de {stats.total_users}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Trophy className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-purple-900">Conteúdo Criado</div>
                    <div className="text-sm text-purple-700">Matérias e anotações</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">
                    {(stats.total_subjects + stats.total_notes).toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-600">
                    {stats.total_subjects} matérias + {stats.total_notes} notas
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-orange-900">Média por Usuário</div>
                    <div className="text-sm text-orange-700">Matérias por pessoa</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    {stats.total_users > 0 ? Math.round(stats.total_subjects / stats.total_users * 10) / 10 : 0}
                  </div>
                  <div className="text-xs text-orange-600">
                    matérias/usuário
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedCharts;