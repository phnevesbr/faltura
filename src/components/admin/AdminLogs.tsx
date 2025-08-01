import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Activity, 
  Search, 
  Filter,
  Eye,
  Calendar,
  User,
  Database,
  RefreshCw,
  Shield,
  Users,
  Settings,
  FileText,
  Plus,
  Trash2,
  Edit,
  Download,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface AdminLog {
  id: string;
  admin_user_id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface UserLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

const AdminLogs: React.FC = () => {
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [userLogs, setUserLogs] = useState<UserLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterTarget, setFilterTarget] = useState('all');
  const [activeTab, setActiveTab] = useState('admin');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      // Load admin logs
      const { data: adminLogsData, error: adminLogsError } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (adminLogsError) throw adminLogsError;

      // Get admin emails
      const adminIds = [...new Set(adminLogsData.map(log => log.admin_user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .in('user_id', adminIds);

      if (profilesError) throw profilesError;

      // Combine admin logs with emails
      const combinedAdminLogs = adminLogsData.map(log => {
        const admin = profiles.find(p => p.user_id === log.admin_user_id);
        return {
          ...log,
          admin_email: admin?.email || 'Email não encontrado'
        } as AdminLog;
      });

      setAdminLogs(combinedAdminLogs);

      // Load user logs using the new function
      const { data: userLogsData, error: userLogsError } = await supabase
        .rpc('get_user_logs', { limit_count: 100 });

      if (userLogsError) throw userLogsError;

      // Cast and clean the data to match UserLog interface
      const cleanedUserLogs = (userLogsData || []).map(log => ({
        id: log.id,
        user_id: log.user_id,
        user_email: log.user_email || 'Email não encontrado',
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        details: log.details,
        ip_address: log.ip_address ? String(log.ip_address) : null,
        user_agent: log.user_agent || null,
        created_at: log.created_at
      })) as UserLog[];

      setUserLogs(cleanedUserLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': 
      case 'subject_created':
      case 'note_created':
      case 'absence_created':
        return 'bg-green-100 text-green-800';
      case 'UPDATE': 
      case 'subject_updated':
      case 'note_updated':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE': 
      case 'subject_deleted':
      case 'note_deleted':
      case 'absence_deleted':
        return 'bg-red-100 text-red-800';
      default: 
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetIcon = (targetType: string) => {
    switch (targetType) {
      case 'user_bans': 
      case 'admin_roles': 
        return <User className="h-4 w-4" />;
      case 'system_settings': 
        return <Settings className="h-4 w-4" />;
      case 'subjects': 
        return <FileText className="h-4 w-4" />;
      case 'notes': 
        return <Edit className="h-4 w-4" />;
      case 'absences': 
        return <Calendar className="h-4 w-4" />;
      default: 
        return <Database className="h-4 w-4" />;
    }
  };

  const getActionTranslation = (action: string) => {
    const translations = {
      'INSERT': 'Inserir',
      'UPDATE': 'Atualizar',
      'DELETE': 'Deletar',
      'subject_created': 'Matéria Criada',
      'subject_updated': 'Matéria Atualizada',
      'subject_deleted': 'Matéria Deletada',
      'note_created': 'Nota Criada',
      'note_updated': 'Nota Atualizada',
      'note_deleted': 'Nota Deletada',
      'absence_created': 'Falta Criada',
      'absence_deleted': 'Falta Deletada'
    };
    return translations[action] || action;
  };

  const filteredAdminLogs = adminLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.admin_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesTarget = filterTarget === 'all' || log.target_type === filterTarget;

    return matchesSearch && matchesAction && matchesTarget;
  });

  const filteredUserLogs = userLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesTarget = filterTarget === 'all' || log.entity_type === filterTarget;

    return matchesSearch && matchesAction && matchesTarget;
  });

  const uniqueAdminActions = [...new Set(adminLogs.map(log => log.action))];
  const uniqueAdminTargets = [...new Set(adminLogs.map(log => log.target_type))];
  const uniqueUserActions = [...new Set(userLogs.map(log => log.action))];
  const uniqueUserTargets = [...new Set(userLogs.map(log => log.entity_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Sistema de Logs</span>
              </CardTitle>
              <CardDescription>
                Monitoramento completo de atividades de usuários e administradores
              </CardDescription>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-muted/50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Logs ativos</span>
              </div>
              <Button onClick={loadLogs} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="admin" className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Logs Admin</span>
                <Badge variant="secondary" className="ml-2">
                  {adminLogs.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Logs Usuários</span>
                <Badge variant="secondary" className="ml-2">
                  {userLogs.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin">
              <div className="space-y-4">
                {/* Admin Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar logs por admin, ação ou tipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      {uniqueAdminActions.map(action => (
                        <SelectItem key={action} value={action}>{action}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterTarget} onValueChange={setFilterTarget}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {uniqueAdminTargets.map(target => (
                        <SelectItem key={target} value={target}>{target}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Admin Logs Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>ID do Alvo</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAdminLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm">
                                  {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Shield className="h-4 w-4 text-primary" />
                              <div className="text-sm">{log.admin_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {getActionTranslation(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTargetIcon(log.target_type)}
                              <span className="text-sm">{log.target_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono">
                              {log.target_id?.substring(0, 8)}...
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredAdminLogs.length === 0 && (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Nenhum log admin encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterAction !== 'all' || filterTarget !== 'all' 
                        ? 'Tente ajustar os filtros de busca' 
                        : 'Ainda não há logs administrativos registrados'
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="user">
              <div className="space-y-4">
                {/* User Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar logs por usuário, ação ou tipo..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as ações</SelectItem>
                      {uniqueUserActions.map(action => (
                        <SelectItem key={action} value={action}>{getActionTranslation(action)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterTarget} onValueChange={setFilterTarget}>
                    <SelectTrigger className="w-full sm:w-[150px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os tipos</SelectItem>
                      {uniqueUserTargets.map(target => (
                        <SelectItem key={target} value={target}>{target}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* User Logs Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Ação</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>ID do Alvo</TableHead>
                        <TableHead>Detalhes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUserLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div className="text-sm">
                                  {new Date(log.created_at).toLocaleDateString('pt-BR')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <div className="text-sm">{log.user_email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {getActionTranslation(log.action)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getTargetIcon(log.entity_type)}
                              <span className="text-sm">{log.entity_type}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs font-mono">
                              {log.entity_id?.substring(0, 8)}...
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {filteredUserLogs.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Nenhum log de usuário encontrado</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || filterAction !== 'all' || filterTarget !== 'all' 
                        ? 'Tente ajustar os filtros de busca' 
                        : 'Ainda não há logs de usuários registrados'
                      }
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogs;