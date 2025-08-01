import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  Activity,
  TrendingUp,
  UserCheck,
  Calendar,
  FileText,
  UserX,
  Server,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import AdminUserManagement from './AdminUserManagement';
import AdminClassManagement from './AdminClassManagement';
import AdminAnalytics from './AdminAnalytics';
import AdminSystemSettings from './AdminSystemSettings';
import AdminLogs from './AdminLogs';

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

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      // Use the is_admin function instead of direct table access
      const { data: isAdminResult, error } = await supabase
        .rpc('is_admin', { user_id: user.id });

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!isAdminResult);
        if (isAdminResult) {
          loadStats();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_user_statistics');
      
      if (error) {
        toast.error('Erro ao carregar estatísticas');
        console.error('Error loading stats:', error);
      } else {
        setStats(data as unknown as AdminStats);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não possui permissões administrativas para acessar este painel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.history.back()} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      {/* Modern Admin Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-primary via-primary to-primary/80 rounded-3xl flex items-center justify-center shadow-lg">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                  Painel Administrativo
                </h1>
                <p className="text-sm text-muted-foreground flex items-center space-x-2">
                  <Server className="h-3 w-3" />
                  <span>FALTURA Admin Dashboard</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-muted/50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Sistema Online</span>
              </div>
              <Button variant="outline" onClick={signOut} size="sm" className="hover:bg-destructive hover:text-destructive-foreground transition-colors">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Fixed Navigation Tabs with proper styling */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-1 bg-muted/50 p-1 rounded-2xl backdrop-blur-sm">
              <Button
                variant={activeTab === 'overview' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('overview')}
                size="sm"
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'overview' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                variant={activeTab === 'users' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('users')}
                size="sm"
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'users' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </Button>
              <Button
                variant={activeTab === 'classes' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('classes')}
                size="sm"
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'classes' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Turmas
              </Button>
              <Button
                variant={activeTab === 'analytics' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('analytics')}
                size="sm"
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'analytics' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Analytics
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('settings')}
                size="sm"
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'settings' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Settings className="h-4 w-4 mr-2" />
                Configurações
              </Button>
              <Button
                variant={activeTab === 'logs' ? 'default' : 'ghost'}
                onClick={() => setActiveTab('logs')}
                size="sm"
                className={`rounded-xl transition-all duration-200 ${
                  activeTab === 'logs' 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'hover:bg-background/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Activity className="h-4 w-4 mr-2" />
                Logs
              </Button>
            </div>
          </div>

          {/* Modern Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Hero Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{stats?.total_users || 0}</div>
                  <p className="text-sm text-muted-foreground flex items-center mt-2">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    {stats?.active_users_today || 0} ativos hoje
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
                <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Turmas Ativas</CardTitle>
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <UserCheck className="h-5 w-5 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">{stats?.total_classes || 0}</div>
                  <p className="text-sm text-muted-foreground flex items-center mt-2">
                    <FileText className="h-3 w-3 mr-1 text-blue-500" />
                    {stats?.total_subjects || 0} matérias
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent">
                <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Faltas Registradas</CardTitle>
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{stats?.total_absences || 0}</div>
                  <p className="text-sm text-muted-foreground flex items-center mt-2">
                    <FileText className="h-3 w-3 mr-1 text-orange-500" />
                    {stats?.total_notes || 0} anotações
                  </p>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent">
                <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-10 translate-x-10"></div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Banidos</CardTitle>
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <UserX className="h-5 w-5 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{stats?.banned_users || 0}</div>
                  <p className="text-sm text-muted-foreground flex items-center mt-2">
                    <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                    Banimentos ativos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Users by Tier */}
            {stats?.users_by_tier && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <span>Distribuição por Tier</span>
                  </CardTitle>
                  <CardDescription>
                    Progresso dos usuários na gamificação da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {Object.entries(stats.users_by_tier).map(([tier, count], index) => {
                      const colors = ['bg-gray-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500'];
                      const bgColors = ['bg-gray-500/10', 'bg-blue-500/10', 'bg-purple-500/10', 'bg-yellow-500/10'];
                      return (
                        <div key={tier} className={`text-center p-6 ${bgColors[index]} rounded-2xl border transition-all duration-200 hover:shadow-md`}>
                          <div className={`w-3 h-3 ${colors[index]} rounded-full mx-auto mb-3`}></div>
                          <div className="text-3xl font-bold mb-1">{count}</div>
                          <div className="text-sm text-muted-foreground capitalize font-medium">{tier}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Statistics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health Card */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Server className="h-5 w-5 text-green-600" />
                    </div>
                    <span>Status do Sistema</span>
                  </CardTitle>
                  <CardDescription>
                    Informações sobre a saúde da plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-500/5 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">Base de Dados</span>
                      </div>
                      <span className="text-green-600 font-semibold">Online</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-blue-500/5 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="font-medium">Autenticação</span>
                      </div>
                      <span className="text-blue-600 font-semibold">Ativo</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-purple-500/5 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="font-medium">API</span>
                      </div>
                      <span className="text-purple-600 font-semibold">Estável</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-500/5 to-red-500/5 rounded-t-lg">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Activity className="h-5 w-5 text-orange-600" />
                    </div>
                    <span>Atividade Recente</span>
                  </CardTitle>
                  <CardDescription>
                    Resumo das ações mais recentes na plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-500/5">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Novos usuários cadastrados hoje</span>
                      <span className="ml-auto font-semibold text-blue-600">{stats?.active_users_today || 0}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-purple-500 bg-purple-500/5">
                      <UserCheck className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Total de turmas ativas</span>
                      <span className="ml-auto font-semibold text-purple-600">{stats?.total_classes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-green-500 bg-green-500/5">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Faltas registradas</span>
                      <span className="ml-auto font-semibold text-green-600">{stats?.total_absences || 0}</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 border-l-4 border-orange-500 bg-orange-500/5">
                      <FileText className="h-4 w-4 text-orange-600" />
                      <span className="text-sm">Anotações criadas</span>
                      <span className="ml-auto font-semibold text-orange-600">{stats?.total_notes || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Platform Statistics */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                  </div>
                  <span>Estatísticas Gerais</span>
                </CardTitle>
                <CardDescription>
                  Visão geral da atividade na plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-500/5 rounded-xl border">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{stats?.total_subjects || 0}</div>
                    <div className="text-sm text-muted-foreground">Matérias Cadastradas</div>
                  </div>
                  <div className="text-center p-4 bg-green-500/5 rounded-xl border">
                    <div className="text-2xl font-bold text-green-600 mb-2">{((stats?.total_absences || 0) / Math.max(stats?.total_users || 1, 1)).toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Faltas por Usuário</div>
                  </div>
                  <div className="text-center p-4 bg-purple-500/5 rounded-xl border">
                    <div className="text-2xl font-bold text-purple-600 mb-2">{((stats?.total_notes || 0) / Math.max(stats?.total_users || 1, 1)).toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Tarefas por Usuário</div>
                  </div>
                  <div className="text-center p-4 bg-orange-500/5 rounded-xl border">
                    <div className="text-2xl font-bold text-orange-600 mb-2">{((stats?.total_subjects || 0) / Math.max(stats?.total_users || 1, 1)).toFixed(1)}</div>
                    <div className="text-sm text-muted-foreground">Matérias por Usuário</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <AdminUserManagement />
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes">
            <AdminClassManagement />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AdminAnalytics />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <AdminSystemSettings />
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">
            <AdminLogs />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;