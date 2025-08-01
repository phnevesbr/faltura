import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
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
  Monitor,
  Crown,
  Star,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import AdminUserManagement from './AdminUserManagement';
import AdminClassManagement from './AdminClassManagement';
import AdminAnalytics from './AdminAnalytics';
import AdminSystemSettings from './AdminSystemSettings';
import AdminLogs from './AdminLogs';
import { cn } from '../../lib/utils';

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

const ModernAdminDashboard: React.FC = () => {
  const { user } = useAuth();
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
      const { data: isAdminResult, error } = await supabase.rpc('is_admin', { user_id: user.id });
      if (error) {
        setIsAdmin(false);
      } else {
        setIsAdmin(!!isAdminResult);
        if (isAdminResult) loadStats();
      }
    } catch (error) {
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
      } else {
        setStats(data as unknown as AdminStats);
      }
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto animate-pulse">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <p className="text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle>Acesso Negado</CardTitle>
          <CardDescription>Você não possui permissões administrativas.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="relative p-8 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 rounded-3xl">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Painel Administrativo</h1>
            <p className="text-muted-foreground flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Sistema de Gestão • FALTURA</span>
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex justify-center">
          <div className="inline-flex items-center space-x-1 bg-muted/50 p-1.5 rounded-2xl">
            {[
              { id: 'overview', label: 'Dashboard', icon: BarChart3 },
              { id: 'users', label: 'Usuários', icon: Users },
              { id: 'classes', label: 'Turmas', icon: UserCheck },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              { id: 'settings', label: 'Config', icon: Settings },
              { id: 'logs', label: 'Logs', icon: Activity }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  size="sm"
                  className={cn(
                    "rounded-xl transition-all duration-200",
                    activeTab === tab.id 
                      ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg" 
                      : "hover:bg-background/80"
                  )}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600">{stats?.total_users || 0}</div>
                <div className="text-sm text-muted-foreground">Total de Usuários</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/10 to-green-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600">{stats?.active_users_today || 0}</div>
                <div className="text-sm text-muted-foreground">Usuários Ativos Hoje</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500/10 to-purple-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <UserCheck className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-600">{stats?.total_classes || 0}</div>
                <div className="text-sm text-muted-foreground">Turmas Ativas</div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500/10 to-red-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <UserX className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600">{stats?.banned_users || 0}</div>
                <div className="text-sm text-muted-foreground">Usuários Banidos</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users"><AdminUserManagement /></TabsContent>
        <TabsContent value="classes"><AdminClassManagement /></TabsContent>
        <TabsContent value="analytics"><AdminAnalytics /></TabsContent>
        <TabsContent value="settings"><AdminSystemSettings /></TabsContent>
        <TabsContent value="logs"><AdminLogs /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ModernAdminDashboard;