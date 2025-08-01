import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Shield, 
  Users, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  Activity,
  TrendingUp,
  UserCheck,
  Calendar,
  FileText,
  UserX,
  Server,
  LogOut,
  Crown,
  Zap,
  Database,
  Globe,
  Lock,
  Eye,
  Sparkles,
  Layers,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';
import { useIsAdmin } from '../../hooks/useIsAdmin';
import { useAdminPermissions } from '../../hooks/useAdminPermissions';
import { cn } from '../../lib/utils';

// Importar componentes modernos
import StatCard from './components/StatCard';
import AdvancedCharts from './components/AdvancedCharts';
import UltraAnalytics from './components/UltraAnalytics';
// Importar componentes existentes
import AdminUserManagement from './AdminUserManagement';
import AdminClassManagement from './AdminClassManagement';
import AdminAnalytics from './AdminAnalytics';
import AdminSystemSettings from './AdminSystemSettings';
import AdminLogs from './AdminLogs';
import AdminStaffManagement from './AdminStaffManagement';


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

interface SystemHealth {
  database: 'online' | 'offline' | 'warning';
  authentication: 'active' | 'inactive' | 'error';
  storage: 'healthy' | 'degraded' | 'critical';
  api: 'operational' | 'slow' | 'down';
}

const UltraModernAdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { permissions, canViewAnalytics, canManageUsers, canConfigureSystem, canManageStaff } = useAdminPermissions();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    database: 'online',
    authentication: 'active',
    storage: 'healthy',
    api: 'operational'
  });
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState({
    onlineUsers: 0,
    systemLoad: 0,
    memoryUsage: 0,
    requestsPerMinute: 0
  });

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
      startRealTimeUpdates();
    }
  }, [isAdmin]);

  // Verificar se o usuário tem permissão para a aba ativa
  useEffect(() => {
    const availableTabs = [
      { id: 'overview', requiresPermission: null },
      { id: 'users', requiresPermission: 'user_management' },
      { id: 'classes', requiresPermission: 'class_management' },
      { id: 'analytics', requiresPermission: 'analytics' },
      { id: 'staff', requiresPermission: 'super_admin_only' },
      { id: 'settings', requiresPermission: 'system_config' },
      { id: 'logs', requiresPermission: 'analytics' }
    ];

    const currentTab = availableTabs.find(tab => tab.id === activeTab);
    
    if (currentTab && currentTab.requiresPermission) {
      let hasPermission = false;
      
      if (currentTab.requiresPermission === 'super_admin_only') {
        hasPermission = canManageStaff;
      } else {
        hasPermission = permissions[currentTab.requiresPermission as keyof typeof permissions];
      }
      
      if (!hasPermission) {
        setActiveTab('overview'); // Redirecionar para overview se não tiver permissão
      }
    }
  }, [activeTab, permissions, canManageStaff]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const startRealTimeUpdates = () => {
    // Simulação de dados em tempo real
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        onlineUsers: Math.floor(Math.random() * 50) + 10,
        systemLoad: Math.floor(Math.random() * 100),
        memoryUsage: Math.floor(Math.random() * 80) + 20,
        requestsPerMinute: Math.floor(Math.random() * 1000) + 100
      }));
    }, 5000);

    return () => clearInterval(interval);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'healthy':
      case 'operational':
        return 'text-emerald-600 bg-emerald-100';
      case 'warning':
      case 'slow':
      case 'degraded':
        return 'text-amber-600 bg-amber-100';
      case 'offline':
      case 'inactive':
      case 'error':
      case 'critical':
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
      case 'healthy':
      case 'operational':
        return <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />;
      case 'warning':
      case 'slow':
      case 'degraded':
        return <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />;
      default:
        return <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />;
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-primary via-accent to-primary rounded-3xl flex items-center justify-center mx-auto animate-pulse shadow-2xl">
              <Crown className="h-12 w-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Inicializando Painel Admin
            </h2>
            <p className="text-muted-foreground">Verificando permissões e carregando dados...</p>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-destructive/10 flex items-center justify-center">
        <Card className="max-w-md mx-auto border-0 shadow-2xl bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8">
            <div className="relative mx-auto mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-3xl flex items-center justify-center">
                <Shield className="h-10 w-10 text-destructive" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl mb-2">Acesso Restrito</CardTitle>
            <CardDescription className="text-base">
              Este painel é exclusivo para administradores do sistema FALTURA.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.history.back()} 
              className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-medium py-3"
            >
              <Eye className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5">
      {/* Ultra Modern Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary via-accent to-primary/80 rounded-3xl flex items-center justify-center shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Crown className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
              <div className="space-y-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
                  FALTURA Admin
                </h1>
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <Database className="h-3 w-3" />
                  <span>Centro de Comando & Controle</span>
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse inline-block" />
                  <span className="text-emerald-600 font-medium">Sistema Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Real-time metrics */}
              <div className="hidden lg:flex items-center space-x-4 px-4 py-2 bg-muted/50 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs text-muted-foreground">{realTimeData.onlineUsers} online</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center space-x-2">
                  <Cpu className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-muted-foreground">{realTimeData.systemLoad}% CPU</span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center space-x-2">
                  <Activity className="h-3 w-3 text-purple-600" />
                  <span className="text-xs text-muted-foreground">{realTimeData.requestsPerMinute}/min</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                onClick={signOut} 
                size="sm" 
                className="hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors duration-200 shadow-md"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Ultra Modern Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Modern Navigation with Enhanced Design */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 bg-card/50 backdrop-blur-sm p-2 rounded-3xl border shadow-lg">
              {[
                { id: 'overview', label: 'Dashboard', icon: BarChart3, color: 'from-blue-500 to-blue-600', requiresPermission: null },
                { id: 'users', label: 'Usuários', icon: Users, color: 'from-purple-500 to-purple-600', requiresPermission: 'user_management' },
                { id: 'classes', label: 'Turmas', icon: UserCheck, color: 'from-green-500 to-green-600', requiresPermission: 'class_management' },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp, color: 'from-orange-500 to-orange-600', requiresPermission: 'analytics' },
                { id: 'staff', label: 'Staff', icon: Crown, color: 'from-yellow-500 to-yellow-600', requiresPermission: 'super_admin_only' },
                { id: 'settings', label: 'Config', icon: Settings, color: 'from-gray-500 to-gray-600', requiresPermission: 'system_config' },
                { id: 'logs', label: 'Logs', icon: Activity, color: 'from-red-500 to-red-600', requiresPermission: 'analytics' }
              ].filter((tab) => {
                // Filtrar abas baseado nas permissões
                if (!tab.requiresPermission) return true; // Dashboard sempre visível
                if (tab.requiresPermission === 'super_admin_only') return canManageStaff; // Staff apenas para super admin
                return permissions[tab.requiresPermission as keyof typeof permissions];
              }).map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <Button
                    key={tab.id}
                    variant="ghost"
                    onClick={() => setActiveTab(tab.id)}
                    size="sm"
                    className={cn(
                      "rounded-2xl transition-all duration-300 relative overflow-hidden",
                      isActive 
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105 hover:scale-105` 
                        : "hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent" />
                    )}
                    <IconComponent className="h-4 w-4 mr-2 relative z-10" />
                    <span className="relative z-10 font-medium">{tab.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Overview Tab - Ultra Modern Dashboard */}
          <TabsContent value="overview" className="space-y-8">
            {/* Hero Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total de Usuários"
                value={stats?.total_users || 0}
                subtitle={`${stats?.active_users_today || 0} ativos hoje`}
                icon={Users}
                trend={{ value: 12, isPositive: true }}
                color="blue"
                className="hover:scale-105 transition-transform duration-300"
              />
              
              <StatCard
                title="Turmas Ativas"
                value={stats?.total_classes || 0}
                subtitle={`${stats?.total_subjects || 0} matérias`}
                icon={UserCheck}
                trend={{ value: 8, isPositive: true }}
                color="purple"
                className="hover:scale-105 transition-transform duration-300"
              />
              
              <StatCard
                title="Faltas Registradas"
                value={stats?.total_absences || 0}
                subtitle={`${stats?.total_notes || 0} anotações`}
                icon={Calendar}
                trend={{ value: 5, isPositive: false }}
                color="green"
                className="hover:scale-105 transition-transform duration-300"
              />
              
              <StatCard
                title="Usuários Banidos"
                value={stats?.banned_users || 0}
                subtitle="Moderação ativa"
                icon={UserX}
                trend={{ value: 3, isPositive: false }}
                color="red"
                className="hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* System Health Dashboard */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card to-muted/20">
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl shadow-lg">
                      <Server className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Status do Sistema</CardTitle>
                      <CardDescription>Monitoramento em tempo real da infraestrutura</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                    Todos os sistemas operacionais
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Database className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-900">Base de Dados</span>
                      </div>
                      {getHealthIcon(systemHealth.database)}
                    </div>
                    <Badge className={getHealthColor(systemHealth.database)}>
                      {systemHealth.database}
                    </Badge>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl border border-blue-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Lock className="h-5 w-5 text-blue-600" />
                        <span className="font-semibold text-blue-900">Autenticação</span>
                      </div>
                      {getHealthIcon(systemHealth.authentication)}
                    </div>
                    <Badge className={getHealthColor(systemHealth.authentication)}>
                      {systemHealth.authentication}
                    </Badge>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl border border-purple-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <HardDrive className="h-5 w-5 text-purple-600" />
                        <span className="font-semibold text-purple-900">Armazenamento</span>
                      </div>
                      {getHealthIcon(systemHealth.storage)}
                    </div>
                    <Badge className={getHealthColor(systemHealth.storage)}>
                      {systemHealth.storage}
                    </Badge>
                  </div>

                  <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Wifi className="h-5 w-5 text-orange-600" />
                        <span className="font-semibold text-orange-900">API</span>
                      </div>
                      {getHealthIcon(systemHealth.api)}
                    </div>
                    <Badge className={getHealthColor(systemHealth.api)}>
                      {systemHealth.api}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Advanced Charts and Analytics */}
            <AdvancedCharts stats={stats} />

          </TabsContent>

          {canManageUsers && (
            <TabsContent value="users">
              <AdminUserManagement />
            </TabsContent>
          )}
          
          {permissions.class_management && (
            <TabsContent value="classes">
              <AdminClassManagement />
            </TabsContent>
          )}
          
          {canViewAnalytics && (
            <TabsContent value="analytics">
              <UltraAnalytics />
            </TabsContent>
          )}
          
          {canManageStaff && (
            <TabsContent value="staff">
              <AdminStaffManagement />
            </TabsContent>
          )}
          
          {canConfigureSystem && (
            <TabsContent value="settings">
              <AdminSystemSettings />
            </TabsContent>
          )}
          
          {canViewAnalytics && (
            <TabsContent value="logs">
              <AdminLogs />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default UltraModernAdminDashboard;