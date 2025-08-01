import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { 
  TrendingUp, 
  Users, 
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Target,
  Zap,
  Globe,
  Eye,
  MousePointer,
  Smartphone
} from 'lucide-react';
import { supabase } from '../../../integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '../../../lib/utils';

interface AnalyticsData {
  user_growth: Array<{
    date: string;
    new_users: number;
    total_users: number;
  }>;
  activity_heatmap: Record<string, number>;
  top_courses: Array<{
    course: string;
    user_count: number;
  }>;
}

const UltraAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('users');

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.rpc('get_system_analytics', {
        days_back: parseInt(timeframe)
      });

      if (error) throw error;

      setAnalytics(data as unknown as AnalyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Erro ao carregar analytics');
    } finally {
      setLoading(false);
    }
  };

  const getActivityIntensity = (hour: string, count: number, maxCount: number) => {
    const intensity = maxCount > 0 ? count / maxCount : 0;
    if (intensity > 0.8) return 'bg-gradient-to-t from-primary to-primary/80 shadow-lg';
    if (intensity > 0.6) return 'bg-gradient-to-t from-primary/80 to-primary/60';
    if (intensity > 0.4) return 'bg-gradient-to-t from-primary/60 to-primary/40';
    if (intensity > 0.2) return 'bg-gradient-to-t from-primary/40 to-primary/20';
    if (intensity > 0) return 'bg-gradient-to-t from-primary/20 to-primary/10';
    return 'bg-muted';
  };

  const maxActivityCount = analytics?.activity_heatmap ? 
    Math.max(...Object.values(analytics.activity_heatmap)) : 0;

  const peakHour = analytics?.activity_heatmap ? 
    Object.keys(analytics.activity_heatmap).find(hour => 
      analytics.activity_heatmap[hour] === maxActivityCount
    ) : null;

  const totalActivities = analytics?.activity_heatmap ? 
    Object.values(analytics.activity_heatmap).reduce((sum, count) => sum + count, 0) : 0;

  const averageActivity = totalActivities > 0 ? Math.round(totalActivities / 24) : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Controls */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-card to-muted/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Analytics Avançados</CardTitle>
                <CardDescription className="text-base">
                  Insights profundos sobre uso da plataforma e comportamento dos usuários
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">Usuários</SelectItem>
                  <SelectItem value="activity">Atividade</SelectItem>
                  <SelectItem value="engagement">Engajamento</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-500/20 rounded-2xl">
                <Activity className="h-6 w-6 text-emerald-600" />
              </div>
              <Badge className="bg-emerald-100 text-emerald-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12%
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-emerald-600">{totalActivities}</div>
              <div className="text-sm font-medium text-emerald-900">Total de Atividades</div>
              <div className="text-xs text-emerald-700">Últimos {timeframe} dias</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                Pico às {peakHour || '0'}h
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-blue-600">{averageActivity}</div>
              <div className="text-sm font-medium text-blue-900">Média por Hora</div>
              <div className="text-xs text-blue-700">Atividades/hora</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500/20 rounded-2xl">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <Badge className="bg-purple-100 text-purple-800">
                <Eye className="h-3 w-3 mr-1" />
                Ativos
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-purple-600">
                {analytics?.user_growth ? analytics.user_growth[analytics.user_growth.length - 1]?.total_users || 0 : 0}
              </div>
              <div className="text-sm font-medium text-purple-900">Usuários Totais</div>
              <div className="text-xs text-purple-700">Base de usuários</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-orange-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500/20 rounded-2xl">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <Badge className="bg-orange-100 text-orange-800">
                <Zap className="h-3 w-3 mr-1" />
                Taxa
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="text-3xl font-bold text-orange-600">
                {analytics?.user_growth ? 
                  Math.round(analytics.user_growth.reduce((sum, day) => sum + day.new_users, 0) / analytics.user_growth.length) : 0
                }
              </div>
              <div className="text-sm font-medium text-orange-900">Novos/Dia</div>
              <div className="text-xs text-orange-700">Média diária</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Growth Chart */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Crescimento de Usuários</CardTitle>
                <CardDescription>Evolução da base de usuários ao longo do tempo</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              +{analytics?.user_growth ? analytics.user_growth.reduce((sum, day) => sum + day.new_users, 0) : 0} novos
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {analytics?.user_growth && analytics.user_growth.length > 0 ? (
            <div className="space-y-6">
              {/* Enhanced Visual Chart */}
              <div className="h-80 flex items-end space-x-2 bg-gradient-to-t from-muted/30 to-transparent p-6 rounded-2xl border">
                {analytics.user_growth.slice(-parseInt(timeframe)).map((day, index) => {
                  const maxUsers = Math.max(...analytics.user_growth.map(d => d.new_users));
                  const height = maxUsers > 0 ? Math.max(8, (day.new_users / maxUsers) * 280) : 8;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group cursor-pointer">
                      <div 
                        className="w-full bg-gradient-to-t from-primary via-primary/80 to-primary/60 rounded-t-lg hover:from-primary/90 hover:via-primary/70 hover:to-primary/50 transition-all duration-300 relative shadow-sm hover:shadow-lg"
                        style={{ height: `${height}px` }}
                      >
                        {/* Tooltip */}
                        <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                          <div className="font-semibold">{new Date(day.date).toLocaleDateString('pt-BR')}</div>
                          <div className="text-emerald-300">{day.new_users} novos usuários</div>
                          <div className="text-blue-300">{day.total_users} total</div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                        </div>
                        
                        {/* Highlight peak */}
                        {day.new_users === maxUsers && (
                          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-3 font-medium">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {analytics.user_growth[analytics.user_growth.length - 1]?.total_users || 0}
                  </div>
                  <div className="text-sm text-blue-700 font-medium">Total de Usuários</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl border border-emerald-200">
                  <div className="text-2xl font-bold text-emerald-600">
                    {analytics.user_growth.reduce((sum, day) => sum + day.new_users, 0)}
                  </div>
                  <div className="text-sm text-emerald-700 font-medium">Novos no Período</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(analytics.user_growth.reduce((sum, day) => sum + day.new_users, 0) / analytics.user_growth.length)}
                  </div>
                  <div className="text-sm text-purple-700 font-medium">Média Diária</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Dados de crescimento não disponíveis</h3>
              <p className="text-sm text-muted-foreground">Aguarde o acúmulo de dados históricos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Mapa de Atividade por Horário</CardTitle>
                <CardDescription>Padrões de uso ao longo do dia (horário de Brasília)</CardDescription>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-800">
              Pico às {peakHour || '0'}:00
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {analytics?.activity_heatmap ? (
            <div className="space-y-8">
              {/* Enhanced Heatmap */}
              <div className="space-y-6">
                <div className="grid grid-cols-12 gap-3">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const count = analytics.activity_heatmap[hour.toString()] || 0;
                    const intensity = maxActivityCount > 0 ? count / maxActivityCount : 0;
                    const isPeak = hour.toString() === peakHour;
                    
                    return (
                      <div key={hour} className="text-center group relative">
                        <div className={cn(
                          "h-16 w-full rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden",
                          getActivityIntensity(hour.toString(), count, maxActivityCount),
                          "hover:scale-105 hover:shadow-lg",
                          isPeak && "ring-2 ring-yellow-400 ring-offset-2"
                        )}>
                          {/* Peak indicator */}
                          {isPeak && (
                            <div className="absolute top-1 right-1">
                              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                            </div>
                          )}
                          
                          {/* Shimmer effect for high activity */}
                          {intensity > 0.6 && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse"></div>
                          )}
                          
                          {/* Tooltip */}
                          <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 shadow-xl">
                            <div className="font-semibold">{hour.toString().padStart(2, '0')}:00 - {(hour + 1).toString().padStart(2, '0')}:00</div>
                            <div className="text-blue-300">{count} atividades</div>
                            <div className="text-yellow-300">
                              {intensity > 0 ? `${Math.round(intensity * 100)}% do pico` : 'Sem atividade'}
                            </div>
                            {isPeak && <div className="text-yellow-400">🏆 Pico de atividade</div>}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 font-medium">
                          {hour.toString().padStart(2, '0')}h
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center space-x-8 text-sm">
                  <div className="flex items-center space-x-3">
                    <span className="text-muted-foreground font-medium">Menos ativo</span>
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 bg-muted rounded border"></div>
                      <div className="w-4 h-4 bg-primary/20 rounded"></div>
                      <div className="w-4 h-4 bg-primary/40 rounded"></div>
                      <div className="w-4 h-4 bg-primary/60 rounded"></div>
                      <div className="w-4 h-4 bg-primary/80 rounded"></div>
                      <div className="w-4 h-4 bg-primary rounded shadow-sm"></div>
                    </div>
                    <span className="text-muted-foreground font-medium">Mais ativo</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">Dados de atividade não disponíveis</h3>
              <p className="text-sm text-muted-foreground">Aguarde o acúmulo de dados de atividade</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UltraAnalytics;