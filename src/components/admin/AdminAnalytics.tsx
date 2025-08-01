import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  TrendingUp, 
  Users, 
  Activity,
  BarChart3
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface AnalyticsData {
  user_growth: Array<{
    date: string;
    new_users: number;
    total_users: number;
  }>;
  activity_heatmap: Record<string, number>;
}

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');

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
    const intensity = count / maxCount;
    if (intensity > 0.8) return 'bg-primary';
    if (intensity > 0.6) return 'bg-primary/80';
    if (intensity > 0.4) return 'bg-primary/60';
    if (intensity > 0.2) return 'bg-primary/40';
    if (intensity > 0) return 'bg-primary/20';
    return 'bg-muted';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  const maxActivityCount = analytics?.activity_heatmap ? 
    Math.max(...Object.values(analytics.activity_heatmap)) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Analytics Avançados</span>
              </CardTitle>
              <CardDescription>
                Insights detalhados sobre uso da plataforma e comportamento dos usuários
              </CardDescription>
            </div>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* User Growth Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Crescimento de Usuários</span>
          </CardTitle>
          <CardDescription>
            Novos usuários registrados por dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.user_growth && analytics.user_growth.length > 0 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {analytics.user_growth[analytics.user_growth.length - 1]?.total_users || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Usuários</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.user_growth.reduce((sum, day) => sum + day.new_users, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Novos no Período</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(analytics.user_growth.reduce((sum, day) => sum + day.new_users, 0) / analytics.user_growth.length)}
                  </div>
                  <div className="text-sm text-muted-foreground">Média Diária</div>
                </div>
              </div>
              
              {/* Gráfico visual melhorado */}
              <div className="h-64 flex items-end space-x-1 bg-gradient-to-t from-muted/20 to-transparent p-6 rounded-lg border">
                {analytics.user_growth.slice(-parseInt(timeframe)).map((day, index) => {
                  const maxUsers = Math.max(...analytics.user_growth.map(d => d.new_users));
                  const height = maxUsers > 0 ? Math.max(8, (day.new_users / maxUsers) * 200) : 8;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center group">
                      <div 
                        className="w-full bg-gradient-to-t from-primary to-primary/70 rounded-t-sm hover:from-primary/80 hover:to-primary transition-all duration-200 relative"
                        style={{ height: `${height}px` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {new Date(day.date).toLocaleDateString('pt-BR')}
                          <br />
                          {day.new_users} novos usuários
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2 font-medium">
                        {new Date(day.date).getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Dados de crescimento não disponíveis</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Mapa de Atividade por Horário</span>
          </CardTitle>
          <CardDescription>
            Distribuição de atividade dos usuários ao longo do dia
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics?.activity_heatmap ? (
            <div className="space-y-6">
              {/* Estatísticas resumidas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Activity className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-blue-600">
                    {Object.values(analytics.activity_heatmap).reduce((sum, count) => sum + count, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total de Atividades</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-green-600">
                    {Object.keys(analytics.activity_heatmap).find(hour => 
                      analytics.activity_heatmap[hour] === Math.max(...Object.values(analytics.activity_heatmap))
                    ) || '0'}h
                  </div>
                  <div className="text-sm text-muted-foreground">Pico de Atividade</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-xl font-bold text-purple-600">
                    {Math.round(Object.values(analytics.activity_heatmap).reduce((sum, count) => sum + count, 0) / 24)}
                  </div>
                  <div className="text-sm text-muted-foreground">Média por Hora</div>
                </div>
              </div>

              {/* Mapa de calor melhorado */}
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-2">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const count = analytics.activity_heatmap[hour.toString()] || 0;
                    const intensity = maxActivityCount > 0 ? count / maxActivityCount : 0;
                    
                    return (
                      <div key={hour} className="text-center group">
                        <div 
                          className={`h-12 w-full rounded-lg ${getActivityIntensity(hour.toString(), count, maxActivityCount)} 
                            hover:ring-2 hover:ring-primary/50 transition-all duration-200 cursor-pointer relative
                            ${intensity > 0.5 ? 'shadow-lg' : 'shadow-sm'}`}
                        >
                          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            <div className="font-semibold">{hour}:00 - {hour + 1}:00</div>
                            <div>{count} atividades</div>
                            <div className="text-xs text-gray-300">
                              {intensity > 0 ? `${Math.round(intensity * 100)}% do pico` : 'Sem atividade'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 font-medium">
                          {hour.toString().padStart(2, '0')}h
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Legenda melhorada */}
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-muted-foreground">Menos ativo</span>
                    <div className="flex space-x-1">
                      <div className="w-4 h-4 bg-muted rounded border"></div>
                      <div className="w-4 h-4 bg-primary/20 rounded"></div>
                      <div className="w-4 h-4 bg-primary/40 rounded"></div>
                      <div className="w-4 h-4 bg-primary/60 rounded"></div>
                      <div className="w-4 h-4 bg-primary/80 rounded"></div>
                      <div className="w-4 h-4 bg-primary rounded shadow-sm"></div>
                    </div>
                    <span className="text-muted-foreground">Mais ativo</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Dados de atividade não disponíveis</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;